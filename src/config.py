from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import find_dotenv
import os
from typing import Optional

# --- CLASSE DE CONFIGURATION ---

class Settings(BaseSettings):
    """
    Définit et valide les paramètres de configuration du projet, chargés depuis le fichier .env.
    """


    #OPENAI_API_KEY: str
    GEMINI_API_KEY : str

    LANGCHAIN_API_KEY: Optional[str] = None # | None signifie que la clé est facultative
    

    #LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_MODEL: str = "gemini-2.5-flash"
    
    # Taille du chunk (morceau de texte) pour le RAG
    CHUNK_SIZE: int = 1000
    
    APP_NAME: str = "CoachSportifRAG"

    ENVIRONMENT : str = "development"
    
    # Activer ou désactiver le tracing LangChain/LangSmith (tiré de votre .env)
    LANGCHAIN_TRACING_V2: str = "false" # Pydantic le chargera comme str et LangChain le lira ensuite.

    # --- 4. CONFIGURATION DU CHARGEMENT ---

    model_config = SettingsConfigDict(
        # Recherche le fichier .env dans le répertoire actuel
        env_file=find_dotenv(),
        env_file_encoding='utf-8',
        # Ignore les variables dans le .env qui ne sont pas listées ci-dessus
        extra='ignore' 
    )

# --- EXPORT DE L'OBJET SETTINGS ---

# Crée l'unique instance de configuration à importer dans les autres fichiers
settings = Settings()