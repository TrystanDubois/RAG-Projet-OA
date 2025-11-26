# src/models.py

from pydantic import BaseModel, Field
from typing import Optional

# Schéma Pydantic pour les informations utilisateur (servira pour l'API)
class UserParametersBase(BaseModel):
    """Schéma de base pour les paramètres utilisateur."""
    age: Optional[int] = Field(None, ge=1, le=120)
    weight_kg: Optional[float] = Field(None, ge=20.0, le=300.0)
    height_cm: Optional[int] = Field(None, ge=50, le=250)
    
    sport_goal: Optional[str] = Field(None, max_length=100)
    activity_level: Optional[str] = Field(None, max_length=50)
    
    # Permet à FastAPI d'utiliser ce schéma avec l'ORM SQLAlchemy
    class Config:
        from_attributes = True # Ancien orm_mode = True