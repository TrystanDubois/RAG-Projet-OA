# Projet : Chatbot basé sur un RAG

Système de RAG (Retrieval-Augmented Generation) simple qui répond aux questions des utilisateurs sur la course à pied en s'appuyant sur un ensemble de pages ajouté dans un dossier et une possibilité d'obtenir un programme personnalisé en fonction des objectifs de l'utilisateur.

## Installer les dépendances

```
pip install -r requiments.txt
```

## Créer le fichier .env

Créer le fichier `.env` à partir du fichier `.env.template` :

```
cp .env.template .env
```

Puis éditer le fichier `.env` pour y ajouter les informations nécessaires.

## Lancer le projet

```
python main.py
```