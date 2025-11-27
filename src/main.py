from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings 
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional 
from typing import Annotated

import os
import shutil
from pydantic import BaseModel, Field
from typing import List

# Nouveaux Imports pour l'Authentification et la BDD
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

# Imports des utilitaires BDD et Auth 
from auth_database import get_db, User, create_tables, UserParameters
from auth_utils import get_password_hash, verify_password, create_access_token, decode_token
from models import UserParametersBase


from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
#from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.schema import Document

#import requests

load_dotenv() 

# --- SCHÉMAS PYDANTIC POUR L'AUTHENTIFICATION ---

class UserCreate(BaseModel):
    """Schéma pour l'inscription : demande l'email et le mot de passe."""
    email: str
    password: str

class Token(BaseModel):
    """Schéma de la réponse après connexion réussie (contient le JWT)."""
    access_token: str
    token_type: str = "bearer"

# Utilisé pour obtenir le token JWT depuis l'en-tête de la requête
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") 

# --- Récupération des fichiers PDF dans le dossier docs---
class DocumentInfo(BaseModel):
    """Schéma d'un seul document."""
    name: str = Field(description="Nom du fichier PDF.")
    size: str = Field(description="Taille formatée du fichier.")

class DocumentListResponse(BaseModel):
    """Schéma de la réponse pour la liste des documents."""
    documents: List[DocumentInfo]

# --- INITIALISATION FASTAPI (Utilisation des settings) ---
app = FastAPI(
    title=settings.APP_NAME,
    description=f"Projet RAG Coach IA - Environnement: {settings.ENVIRONMENT}",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DÉFINITION DE LA STRUCTURE DE LA REQUÊTE ---
class QueryRequest(BaseModel):
    query: str

# --- FONCTIONS DE LOGIQUE D'AUTHENTIFICATION ---

def get_user_by_email(db: Session, email: str):
    """Récupère un utilisateur de la BDD par son email."""
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    """Vérifie les identifiants et retourne l'utilisateur si valides."""
    user = get_user_by_email(db, email=email)
    if not user:
        return False
    # Vérifie le mot de passe haché
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]):
    """Dépendance qui vérifie la validité du token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Décode le token pour extraire l'email (stocké sous la clé "sub")
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    # Vérifie si l'utilisateur existe toujours dans la BDD
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    
    return user

# --- PAGES ET FONCTIONS RAG (Inchagées) ---

DOCS_PATH = "./docs" 
CHROMA_DB_PATH = "./chroma_db_rag" # Chemin pour la base vectorielle persistante
RAG_RETRIEVER = None # Variable globale qui contiendra l'objet Retriever

# --- FONCTION DE MISE À JOUR DYNAMIQUE (REMPLACE get_retriever) ---

def initialize_or_update_retriever():
    """Charge, re-crée, et met à jour le Vector Store pour le RAG."""
    global RAG_RETRIEVER
    
    # 1. Charger les PDF depuis le dossier
    print(f"-> Chargement des documents PDF depuis {DOCS_PATH}")
    try:
        loader = PyPDFDirectoryLoader(DOCS_PATH)
        documents = loader.load()
    except Exception as e:
        print(f"Erreur lors du chargement des PDF : {e}")
        documents = []

    if not documents:
        print(f"ATTENTION : Aucun document PDF trouvé dans le dossier '{DOCS_PATH}'. Le RAG sera vide.")
        # Crée un retriever vide
        vectorstore = Chroma.from_documents(documents=[], embedding=OpenAIEmbeddings())
        RAG_RETRIEVER = vectorstore.as_retriever()
        return

    print(f"-> {len(documents)} documents chargés.")
    
    # 2. Séparer le texte en morceaux (chunks)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE, 
        chunk_overlap=int(settings.CHUNK_SIZE * 0.2)
    )
    texts = text_splitter.split_documents(documents)
    print(f"-> Divisé en {len(texts)} chunks.")
    
    # 3. Création ou mise à jour (Re-création complète pour la simplicité)
    embeddings = OpenAIEmbeddings()
    
    # Suppression de l'ancienne DB pour forcer la re-création complète
    if os.path.exists(CHROMA_DB_PATH):
        try:
            shutil.rmtree(CHROMA_DB_PATH)
            print("-> Base vectorielle existante supprimée pour re-création.")
        except Exception as e:
            # Cette erreur peut se produire si le processus précédent n'a pas relâché le lock
            print(f"ATTENTION: Impossible de supprimer le dossier Chroma: {e}")

    # Création du Vector Store (et persistance)
    vectorstore = Chroma.from_documents(
        documents=texts, 
        embedding=embeddings, 
        persist_directory=CHROMA_DB_PATH
    )
    vectorstore.persist() # Sauvegarde sur disque
    print("-> Base vectorielle re-créée et persistée.")
    
    # 4. Définition du Retriever global
    RAG_RETRIEVER = vectorstore.as_retriever(search_kwargs={"k": 3}) # k=3 est un bon point de départ
    print("-> Le Retriever RAG a été mis à jour.")


def rag_answer(query):
    """
    Utilise le Retriever RAG global pour répondre à la question.
    """
    global RAG_RETRIEVER
    
    # Vérification si le retriever est prêt
    if RAG_RETRIEVER is None:
        return "Le système RAG est en cours d'initialisation. Veuillez réessayer."
        
    template = """
You are a recognized expert and a specialized coach in the field of **running, sports training, and performance nutrition**.
Your role is to provide accurate advice and detailed information. Answer the user's question with a professional and encouraging tone.

**Crucial Instructions for the Answer:**
1. **Primary Source:** Base your answer on the **Context** provided below as a priority for all specific, numerical, or factual information.
2. **Expert Knowledge:** If the context is insufficient or irrelevant to answer the question, use your general expert knowledge in running and nutrition to provide a useful and general answer.
3. **Format:** Your response **MUST** be structured in two sections with the following headings:
   - **CONCISE ANSWER:** A short, direct answer (1-2 sentences maximum).
   - **DETAILED EXPLANATION:** A complete explanation that elaborates on the concise answer, including all supporting facts from the context or your expertise.
4. **Transparency:** Never explicitly mention that you used the documents or that you are limited by the context.

Context:
{context}

Question: {query}
"""
    prompt = ChatPromptTemplate.from_template(template)
    model = ChatOpenAI(model_name=settings.LLM_MODEL, temperature=0)
    
    chain = (
        {"context": RAG_RETRIEVER, "query": RunnablePassthrough()} # Utilisation du RAG_RETRIEVER global
        | prompt
        | model
        | StrOutputParser()
    )
    return chain.invoke(query)

# --- NOUVELLE FONCTION DE GÉNÉRATION DE PROGRAMME RAG ---

def rag_generate_program(user_params: UserParametersBase):
    """
    Génère un programme sportif/nutritionnel hautement personnalisé
    en utilisant les paramètres utilisateur et le RAG.
    """
    global RAG_RETRIEVER
    
    if RAG_RETRIEVER is None:
        return "Le système RAG est en cours d'initialisation. Veuillez réessayer."

    # 1. Préparation des paramètres utilisateur pour le prompt
    # Création d'une chaîne de caractères descriptive et structurée
    user_data_str = f"""
--- PARAMÈTRES UTILISATEUR POUR LA PERSONNALISATION ---
- Âge: {user_params.age if user_params.age else 'Non spécifié'} ans
- Sexe: {user_params.gender if user_params.gender else 'Non spécifié'}
- Poids: {user_params.weight_kg if user_params.weight_kg else 'Non spécifié'} kg
- Taille: {user_params.height_cm if user_params.height_cm else 'Non spécifié'} cm
- Objectif Sportif Principal: {user_params.sport_goal if user_params.sport_goal else 'Non spécifié'}
- Niveau Actuel: {user_params.activity_level if user_params.activity_level else 'Non spécifié'}
- Temps d'Entraînement Disponible / Semaine: {user_params.time_per_week_hours if user_params.time_per_week_hours else 'Non spécifié'} heures
- Temps de Sommeil Moyen: {user_params.sleep_hours if user_params.sleep_hours else 'Non spécifié'} heures / nuit
- Matériel Disponible: {user_params.equipment_available if user_params.equipment_available else 'Non spécifié'}
- Préférence d'Entraînement (Style): {user_params.training_preference if user_params.training_preference else 'Non spécifié'}
- Restrictions Alimentaires (Nutrition): {user_params.dietary_restrictions if user_params.dietary_restrictions else 'Aucune'}
"""
    
    # 2. Définition du Prompt Système Principal
    template = f"""
You are a highly qualified and recognized **Elite Sports Coach** and **Performance Nutritionist**.
Your task is to generate a comprehensive, structured, and highly personalized training program (both sport and nutrition) for the user based on their specific parameters and the expert documents provided (Context).

**CRUCIAL INSTRUCTIONS:**
1. **Goal:** The program must directly address the user's **Sport Goal** and be tailored to their **Activity Level**, **Time Available**, and **Equipment Available**.
2. **Integration:** Integrate the knowledge from the **Context** provided by the expert documents into the structure, intensity, and rationale of the program.
3. **Structure & Format:**
    - The output **MUST** be structured and easy to read (using detailed Markdown).
    - Start with a personalized summary motivation based on the user's goal.
    - Provide a **Training Plan** (4 weeks) detailed by day (Running, Strength, Rest, etc.).
    - Provide concise **Nutrition Recommendations** based on their goal and dietary restrictions.
    - Provide a section with **Key Advice** (Sleep, Recovery, Hydration).
4. **Language:** Respond entirely in **French**.
5. **Program Duration:** The plan must cover **4 weeks** in detail.

{user_data_str}

Context (Expert Documents):
{{context}}

**Program Generation Request:** Generate the personalized 4-week training and nutrition program now.
"""
    
    prompt = ChatPromptTemplate.from_template(template)
    # On utilise une température plus élevée pour encourager la créativité et la personnalisation du programme
    model = ChatOpenAI(model_name=settings.LLM_MODEL, temperature=0.7) 
    
    # Requête spécifique pour le retriever afin de récupérer le contexte le plus pertinent
    rag_query_for_retriever = f"Conseils d'entraînement et de nutrition pour un objectif de {user_params.sport_goal} avec un niveau {user_params.activity_level}. Matériel disponible : {user_params.equipment_available}."
    
    # La chaîne LangChain:
    chain = (
        {
            # Récupère le contexte en utilisant la requête spécifique
            "context": (lambda x: rag_query_for_retriever) | RAG_RETRIEVER,
            # Le champ 'query' est obligatoire mais son contenu est ignoré
            "query": RunnablePassthrough() 
        } 
        | prompt
        | model
        | StrOutputParser()
    )
    
    # Exécuter la chaîne.
    return chain.invoke("Start generation")

# --- DÉMARRAGE DE L'APPLICATION (Gère la BDD et le RAG) ---

@app.on_event("startup")
def startup_event():
    print('='*50)
    print('INITIALISATION DE L\'APPLICATION FASTAPI')
    
    # 1. Assurez-vous que le dossier docs existe
    if not os.path.isdir(DOCS_PATH):
        os.makedirs(DOCS_PATH)
        
    # 2. Crée les tables de la base de données (si elles n'existent pas)
    create_tables()
    print("-> Tables de BDD vérifiées et créées.")

    # 3. Initialise le retriever RAG (première exécution)
    initialize_or_update_retriever()
    print('RETRIEVER CHARGÉ. Application prête.')
    print('='*50)


# --- ROUTES D'AUTHENTIFICATION ---

@app.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Route pour l'inscription d'un nouvel utilisateur."""
    # 1. Vérifie si l'utilisateur existe déjà
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Crée le nouvel utilisateur
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Génère un token d'accès après l'inscription
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# src/main.py (MODIFICATION de la fonction login_for_access_token)

@app.post("/token", response_model=Token)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Session = Depends(get_db)
):
    # 1. Tenter de trouver l'utilisateur
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Configuration de l'exception
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nom d'utilisateur ou mot de passe incorrect.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 2. Vérifier si l'utilisateur existe
    if not user:
        raise credentials_exception
    
    # 3. 🔐 VÉRIFICATION CRUCIALE DU MOT DE PASSE 
    # Appel de la fonction 'verify_password' définie dans auth_utils.py
    if not verify_password(form_data.password, user.hashed_password):
        # Si la vérification échoue, on lève l'exception et le token n'est pas créé.
        raise credentials_exception

    # 4. Si la vérification est réussie, on génère le token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- UTILS POUR LES ROUTES SÉCURISÉES ---

# Fonction pour obtenir l'utilisateur connecté via le token
async def get_current_user_from_token(
    token: Annotated[str, Depends(oauth2_scheme)], 
    db: Session = Depends(get_db)
):
    # 1. Décoder le token pour obtenir le payload (dictionnaire)
    # Renommage de la variable pour plus de clarté
    payload = decode_token(token) 
    
    # 2. Extraire la valeur de l'email à partir de la clé 'sub' du payload
    email: str = payload.get("sub")
    
    # Vérification de sécurité supplémentaire
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token data is invalid or missing email",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. La requête de filtrage SQL fonctionne maintenant avec une chaîne de caractères (email)
    # Ligne 307 corrigée
    user = db.query(User).filter(User.email == email).first() 
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# --- ROUTES POUR LA GESTION DES INFORMATIONS UTILISATEUR ---

@app.get("/user/parameters", response_model=UserParametersBase)
def read_user_parameters(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Récupère les informations spécifiques de l'utilisateur connecté.
    Si l'utilisateur n'a pas encore d'informations (nouvelle inscription), renvoie des valeurs nulles.
    """
    # Tente de trouver les paramètres existants
    parameters = db.query(UserParameters).filter(UserParameters.user_id == current_user.id).first()
    
    if parameters is None:
        # Si aucun paramètre n'existe, renvoie un objet avec des valeurs par défaut/nulles
        return UserParametersBase()
        
    return parameters

@app.post("/user/parameters", response_model=UserParametersBase)
def update_user_parameters(
    params_data: UserParametersBase,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Crée ou met à jour les informations spécifiques de l'utilisateur connecté.
    """
    parameters = db.query(UserParameters).filter(UserParameters.user_id == current_user.id).first()

    if parameters:
        # Mise à jour des champs existants
        for field, value in params_data.model_dump().items():
            setattr(parameters, field, value)
    else:
        # Création d'un nouvel enregistrement si les paramètres n'existent pas encore
        parameters = UserParameters(user_id=current_user.id, **params_data.model_dump())
        db.add(parameters)

    db.commit()
    db.refresh(parameters)
    return parameters

@app.post("/update_rag", status_code=status.HTTP_200_OK)
def update_rag_endpoint(
    # Sécuriser la route : seul un utilisateur connecté peut la déclencher
    current_user: Annotated[User, Depends(get_current_user)], 
):
    """
    Déclenche la réindexation de tous les documents PDF du répertoire ./docs.
    """
    print(f"Requête de mise à jour RAG reçue de: {current_user.email}")
    try:
        initialize_or_update_retriever()
        return {"message": "Index RAG mis à jour avec succès à partir du répertoire ./docs."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour de l'index: {e.__class__.__name__}"
        )

# ---  ROUTE /query EXISTANTE (Mode API) ---

@app.post("/query")
def process_rag_query(
    request: QueryRequest,
    # AJOUT DE LA DÉPENDANCE : Seul un utilisateur connecté peut accéder à cette route
    current_user: Annotated[User, Depends(get_current_user)], 
):
    """
    Point de terminaison pour interroger le RAG via une requête HTTP (Nécessite connexion).
    """
    print(f"Query received from authenticated user: {current_user.email}") 

    answer = rag_answer(request.query)
    
    return {
        "query": request.query,
        "answer": answer,
        "model": settings.LLM_MODEL
    }

DOCS_PATH = "./docs" # Définir le chemin vers vos documents RAG

@app.get("/documents", response_model=DocumentListResponse)
def get_documents_list(
    # Le Depends(get_current_user) assure que l'utilisateur est connecté pour accéder
    current_user: Annotated[User, Depends(get_current_user)], 
):
    """
    Point de terminaison pour lister dynamiquement les documents PDF du RAG.
    """
    print(f"Demande de liste de documents par l'utilisateur: {current_user.email}")
    
    documents_list = []
    
    # 1. Vérifie si le dossier existe
    if not os.path.isdir(DOCS_PATH):
        # Si le dossier n'existe pas, on retourne une liste vide (ou une erreur 500)
        return {"documents": []}
    
    # 2. Liste et traite les fichiers
    for filename in os.listdir(DOCS_PATH):
        # On ne traite que les fichiers PDF
        if filename.lower().endswith('.pdf'):
            file_path = os.path.join(DOCS_PATH, filename)
            
            try:
                # Récupère la taille du fichier
                size_bytes = os.path.getsize(file_path)
                
                # Formatage de la taille (simple : octets -> Ko -> Mo)
                if size_bytes >= 1024 * 1024:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} Mo"
                elif size_bytes >= 1024:
                    size_str = f"{size_bytes / 1024:.0f} Ko"
                else:
                    size_str = f"{size_bytes} octets"
                
                documents_list.append(DocumentInfo(name=filename, size=size_str))
            
            except Exception as e:
                # Ignore les erreurs (ex: fichier non accessible)
                print(f"Erreur lors du traitement du fichier {filename}: {e}")
                pass 
            
    return {"documents": documents_list}

# --- NOUVELLE ROUTE : GÉNÉRATION DU PROGRAMME PERSONNALISÉ ---

@app.post("/program/generate")
def generate_user_program(
    current_user: Annotated[User, Depends(get_current_user_from_token)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Génère un programme d'entraînement et de nutrition personnalisé 
    en utilisant les paramètres de l'utilisateur et le RAG.
    """
    print(f"Demande de génération de programme reçue de: {current_user.email}")
    
    # 1. Récupérer les paramètres utilisateur depuis la BDD
    parameters = db.query(UserParameters).filter(UserParameters.user_id == current_user.id).first()
    
    # 2. Vérifier si les paramètres existent
    if parameters is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Les paramètres utilisateur ne sont pas renseignés. Veuillez remplir la page 'Mon Profil' au préalable pour générer un programme."
        )
        
    # 3. Convertir l'objet SQLAlchemy en modèle Pydantic pour une utilisation propre
    user_params_base = UserParametersBase.model_validate(parameters)

    # 4. Appeler la logique de génération LLM+RAG
    try:
        program_output = rag_generate_program(user_params_base)
        return {
            "program": program_output,
            "user_email": current_user.email,
            "model": settings.LLM_MODEL
        }
    except Exception as e:
        print(f"Erreur lors de la génération du programme RAG: {e}")
        # Soulever une exception HTTP pour le client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du programme. Cause: {e.__class__.__name__}"
        )


# --- BLOC D'EXÉCUTION CONSOLE (Mode Interactif) ---

if __name__ == "__main__":
    # Ce code s'exécute UNIQUEMENT lorsque le script est lancé via 'python main.py'

    print(f"Lancement en mode console. Application: {settings.APP_NAME}")
    print(f"Modèle LLM utilisé: {settings.LLM_MODEL}")
    
    try:
        while True:
            print('-' * 50)
            print('Posez une question :')
            question = input('> ')
            print()
            
            # Utilise la fonction rag_answer qui elle-même utilise le retriever global
            print(rag_answer(question)) 
            print('\n')

    except KeyboardInterrupt:
        print("\nExiting...")