import chromadb
import os

from langchain_google_genai import GoogleGenerativeAIEmbeddings
# OU
# from langchain_openai import OpenAIEmbeddings

# 🚨 CHEMIN VERS VOTRE BASE DE DONNÉES
# NOTE : Utilisez des barres obliques simples (/) ou doubles barres obliques inverses (\\) dans les chemins Python, 
# même sous Windows. Le chemin absolu est crucial.
# 1. Initialiser le modèle de base (le modèle qui code en 768 dimensions)
BASE_EMBEDDING_MODEL = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004", 
    google_api_key=os.environ.get("GEMINI_API_KEY") 
)

# 2. Envelopper le modèle dans l'adaptateur pour ChromaDB
EMBEDDING_MODEL = BASE_EMBEDDING_MODEL
PERSIST_DIRECTORY = "C:\\Users\\tryst\\Desktop\\ECE cours\\ING5\\OA\\LLMs_Fondation\\PromptEngineering\\Projet\\src\\chroma_db_rag"
# Utiliser r"..." garantit que le chemin est interprété littéralement.

def inspect_chroma_db():
    print(f"Tentative de connexion à ChromaDB au chemin: {PERSIST_DIRECTORY}")
    
    # Vérification que le dossier existe
    if not os.path.exists(PERSIST_DIRECTORY):
        print("ERREUR: Le chemin spécifié n'existe pas. Veuillez vérifier l'orthographe du chemin.")
        return

    try:
        # Connexion au client persistant
        client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

        # --- 1. Lister les collections ---
        collections = client.list_collections()
        if not collections:
            print("Aucune collection trouvée dans cette base de données ChromaDB.")
            return

        print("\n--- Collections trouvées (Vos index RAG) ---")
        for coll in collections:
            print(f"- Nom de la collection : {coll.name}")
        
        # Nous allons inspecter la première collection trouvée
        collection_name = collections[0].name
        collection = client.get_collection(
            name=collection_name,
            embedding_function=EMBEDDING_MODEL 
        )
        # --- 2. Compter les documents (chunks) ---
        count = collection.count()
        print(f"\n-> Collection '{collection_name}' contient {count} documents (chunks).")

        if count == 0:
             return

        # --- 3. Effectuer une recherche de test ---
        print("\n--- Test de Récupération (Recherche de similarité) ---")
        query_text = "Quels sont les conseils nutritionnels pour une course de longue distance ?"
        
        results = collection.query(
            query_texts=[query_text],
            n_results=2,  # Récupérer les 2 meilleurs résultats
            include=['documents', 'metadatas'] 
        )

        # --- 4. Afficher les résultats ---
        for i, (doc_text, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            print(f"Résultat {i+1}:")
            # Afficher la source (si elle a été stockée) et un aperçu du texte
            source = meta.get('source', 'Source inconnue')
            print(f"  Source : {source}")
            print(f"  Texte (Aperçu) : {doc_text[:150]}...")
            print("-" * 40)
            
    except Exception as e:
        print(f"\nUne erreur est survenue lors de l'accès à ChromaDB : {e}")

if __name__ == "__main__":
    inspect_chroma_db()