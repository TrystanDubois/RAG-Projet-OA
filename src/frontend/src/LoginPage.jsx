// src/frontend/src/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './index.css'; 

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false); 
    const [error, setError] = useState('');
    
    // Récupère les fonctions d'AuthContext
    const { login, register } = useAuth(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        try {
            if (isRegister) {
                // Mode Inscription
                await register(email, password);
            } else {
                // Mode Connexion
                await login(email, password);
            }
        } catch (err) {
            // Affiche l'erreur renvoyée par AuthContext.jsx
            setError(err.message || "Erreur de communication avec le serveur d'authentification.");
        }
    };

    return (
        // Conteneur centré
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-light)', 
        }}>
            {/* Titre Principal (Logo/App Name) */}
            <div style={{ 
                position: 'absolute', 
                top: '40px', 
                fontSize: '2.5em', 
                fontWeight: '700', 
                color: 'var(--text-dark)' 
            }}>
                RUN AI
            </div>

            {/* Formulaire Card */}
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-white)',
                boxShadow: 'var(--shadow-medium)',
            }}>
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'var(--text-dark)',
                    fontSize: '1.8em'
                }}>
                    {isRegister ? 'Créer mon compte' : 'Se connecter à RUN AI'}
                </h2>
                
                {/* Affichage de l'erreur */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        padding: '10px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px solid #fca5a5'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* Champ Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--input-border)',
                            backgroundColor: 'var(--input-bg)',
                            fontSize: '16px',
                            color: 'var(--text-dark)'
                        }}
                    />

                    {/* Champ Mot de passe */}
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--input-border)',
                            backgroundColor: 'var(--input-bg)',
                            fontSize: '16px',
                            color: 'var(--text-dark)'
                        }}
                    />

                    {/* Bouton de Soumission */}
                    <button 
                        type="submit"
                        style={{
                            padding: '12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--primary-blue)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '10px',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4A4AEB'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary-blue)'}
                    >
                        {isRegister ? 'Créer mon compte' : 'Se connecter'}
                    </button>
                </form>

                {/* Changement de mode */}
                <div style={{ 
                    textAlign: 'center', 
                    fontSize: '14px', 
                    color: 'var(--text-light-grey)',
                    marginTop: '20px'
                }}>
                    {isRegister ? "Déjà un compte ?" : "Pas encore de compte ?"}
                    <a 
                        href="#" 
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ 
                            color: 'var(--primary-blue)', 
                            textDecoration: 'none', 
                            marginLeft: '5px',
                            fontWeight: '600'
                        }}
                    >
                        {isRegister ? 'Se connecter' : 'Créer un compte'}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;