// src/frontend/src/AuthContext.jsx (Correction Affichage Email)

import React, { createContext, useState, useContext, useEffect } from 'react';

// Création du contexte d'authentification
export const AuthContext = createContext(null);

// Nom de la clé utilisée dans le stockage local du navigateur
const TOKEN_STORAGE_KEY = 'run_ai_auth_token';
const USER_STORAGE_KEY = 'run_ai_user_email';

export const AuthProvider = ({ children }) => {
    // État initial basé sur ce qui est stocké dans le navigateur
    const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY));
    const [userEmail, setUserEmail] = useState(localStorage.getItem(USER_STORAGE_KEY));

    // Définition de l'URL de base pour l'API
    const VITE_API_BASE_URL = 'http://localhost:8000'; 
    
    // Fonction interne pour stocker le token et l'email dans l'état et localStorage
    const setAuthData = (accessToken, email) => {
        setToken(accessToken);
        // 📧 CORRECTION : S'assure de stocker l'email
        setUserEmail(email); 
        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        localStorage.setItem(USER_STORAGE_KEY, email);
    };

    // Fonction de déconnexion : nettoie le stockage et l'état
    const logout = () => {
        setToken(null);
        setUserEmail(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
    };
    
    // Fonction permettant de récupérer le jeton JWT (Bearer token)
    const getAccessToken = () => {
        return token;
    };
    
    // 🔑 FONCTION LOGIN : Gère l'appel API /token (et stocke le bon email)
    const login = async (email, password) => {
        const url = `${VITE_API_BASE_URL}/token`;

        // FastAPI/OAuth2PasswordRequestForm attend 'application/x-www-form-urlencoded'
        const formData = new URLSearchParams();
        formData.append('username', email); // Le champ attendu par FastAPI est 'username'
        formData.append('password', password);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // CRUCIAL
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(errorData.detail || 'Échec de la connexion. Vérifiez vos identifiants.');
        }

        const data = await response.json();
        // 📧 CORRECTION : Passe la variable 'email' à setAuthData
        setAuthData(data.access_token, email); 
    };
    
    // FONCTION REGISTER
    const register = async (email, password) => {
        const url = `${VITE_API_BASE_URL}/register`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Échec de l\'inscription. Veuillez vérifier les informations.');
        }

        const data = await response.json();
        // Utilise la nouvelle fonction de mise à jour de l'état
        setAuthData(data.access_token, email); 
    };


    // Vérifie si l'utilisateur est connecté
    const isLoggedIn = !!token;

    // Contexte partagé par toute l'application
    const contextValue = {
        isLoggedIn,
        token,
        userEmail,
        login, 
        logout,
        getAccessToken,
        VITE_API_BASE_URL,
        register,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour une utilisation facile
export const useAuth = () => {
    return useContext(AuthContext);
};