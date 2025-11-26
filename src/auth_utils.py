# src/auth_utils.py
# Permet de gérer la sécurité avec le hachage des mdp et la vérif des users

from datetime import datetime, timedelta
from typing import Optional

# Nécessaire pour le hachage sécurisé des mots de passe
from passlib.context import CryptContext
# Nécessaire pour la gestion des tokens JWT
from jose import JWTError, jwt

# --- 1. Hachage des Mots de Passe (Bcrypt) ---

# Contexte pour le hachage (standard pour FastAPI)
pwd_context = CryptContext(schemes=["sha256_crypt", "md5_crypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe clair correspond au mot de passe haché."""
    # Note : Bcrypt tronquera automatiquement le mot de passe s'il est trop long ici aussi, mais il est préférable de le gérer à l'entrée.
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    safe_password = password.encode('utf-8')[:72] # Laissez cette ligne par précaution
    return pwd_context.hash(safe_password)

# --- 2. Configuration des Tokens JWT ---

# REMPLACER CECI par une chaîne générée aléatoirement et non partagée !
SECRET_KEY = "UN-SECRET-TRES-LONG-ET-COMPLEXE-POUR-JWT-PROJET-RAG"
ALGORITHM = "HS256"
# Durée de vie du token : 30 minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token d'accès JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Ajoute le temps d'expiration au payload du token
    to_encode.update({"exp": expire})
    
    # Encode le token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Fonction pour vérifier si l'utilisateur est bien authentifié
def decode_token(token: str) -> Optional[dict]:
    """Décode un token JWT et retourne le payload (données) s'il est valide."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Erreur si le token est invalide, expiré ou malformé
        return None