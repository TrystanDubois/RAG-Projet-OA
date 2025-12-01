# src/auth_database.py
#pont entre appli Python (FastAPI) et le serveur PostgreSQL (docker)
#permet de gérer l'accès aux données
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Date 
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator

# --- 1. Configuration de la connexion PostgreSQL ---

# La chaîne de connexion utilise les identifiants de docker-compose.yml :
# user_rag, password_rag, 127.0.0.1:5432, rag_database
DATABASE_URL = "postgresql://user_rag:password_rag@127.0.0.1:5432/rag_database"

# Crée le moteur de connexion (utilisé pour se connecter et interagir avec la BDD)
engine = create_engine(DATABASE_URL)

# Crée une classe de base pour les modèles de BDD
Base = declarative_base()

# Crée une fabrique de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- 2. Modèle de la table Utilisateur ---

class User(Base):
    """Définit la table 'users' qui stockera les informations d'authentification."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    # Ce champ stockera le mot de passe HACHÉ et sécurisé
    hashed_password = Column(String) 
    parameters = relationship("UserParameters", back_populates="owner", uselist=False)

class UserParameters(Base):
    """Définit la table 'user_parameters' pour stocker les informations spécifiques à l'utilisateur."""
    __tablename__ = "user_parameters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True) # Clé étrangère vers la table 'users'

    # Champs spécifiques pour le coach sportif
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True) # Poids en kg
    height_cm = Column(Integer, nullable=True) # Taille en cm
    gender = Column(String, nullable=True)  # 'Homme' ou 'Femme'
    time_per_week_hours = Column(Float, nullable=True) # Temps disponible en heures
    sleep_hours = Column(Float, nullable=True)        # Temps de sommeil en heures
    # Nutrition
    dietary_restrictions = Column(String, nullable=True)
    # Entraînement
    equipment_available = Column(String, nullable=True)  # Ex: Haltères, Salle complète, Aucun
    training_preference = Column(String, nullable=True)  # Ex: Force, Endurance, HIIT, Mixte
    
    # Objectif sportif (Ex: Marathon, 10km, Perte de poids)
    sport_goal = Column(String, nullable=True) 
    
    # Niveau d'activité (Ex: Débutant, Intermédiaire, Expert)
    activity_level = Column(String, nullable=True) 
    
    # Relation : le propriétaire de ces paramètres
    owner = relationship("User", back_populates="parameters")
    
# --- 3. Utilitaires de BDD ---

def get_db() -> Generator:
    """Dépendance qui fournit une session de BDD par requête FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Création des tables
def create_tables():
    """Crée toutes les tables définies (ici, la table 'users') si elles n'existent pas."""
    # Base.metadata.create_all(bind=engine) crée la table 'users' dans la BDD
    Base.metadata.create_all(bind=engine)

# Exécuter la création des tables au moment de l'import
# Cela garantit que la table 'users' est créée la première fois que l'API démarre
create_tables()