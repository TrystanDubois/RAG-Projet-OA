// src/frontend/src/ProgramPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ReactMarkdown from 'react-markdown'; // Sert d'interprétation pour conversion en HTML

const ProgramPage = () => {
    const { getAccessToken, VITE_API_BASE_URL } = useAuth();
    
    const [program, setProgram] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = `${VITE_API_BASE_URL}/program/generate`;

    // Styles de base pour imiter le design simple
    const styles = {
        container: {
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f9f9f9',
            minHeight: '100vh',
        },
        header: {
            color: '#007bff',
            borderBottom: '2px solid #007bff',
            paddingBottom: '10px',
            marginBottom: '30px',
            textAlign: 'center',
        },
        button: {
            backgroundColor: '#28a745',
            color: 'white',
            padding: '12px 25px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '20px',
            marginBottom: '40px',
            transition: 'background-color 0.3s',
        },
        programBox: {
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            whiteSpace: 'pre-wrap', // Pour respecter les retours à la ligne Markdown
            textAlign: 'left',
        },
        loading: {
            color: '#007bff',
            fontSize: '18px',
            textAlign: 'center',
            marginTop: '50px',
        },
        error: {
            color: 'red',
            fontSize: '18px',
            textAlign: 'center',
            marginTop: '50px',
        }
    };

    const generateProgram = async () => {
        setIsLoading(true);
        setError(null);
        setProgram('');
        
        try {
            const token = getAccessToken();
            if (!token) {
                setError("Erreur d'authentification. Veuillez vous reconnecter.");
                setIsLoading(false);
                return;
            }

            const response = await fetch(API_URL, {
                method: 'POST', // Utilisation de POST même si aucune donnée n'est envoyée dans le body
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json', // Nécessaire même si le body est vide
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Erreur lors de la génération: ${response.status}`);
            }

            const data = await response.json();
            setProgram(data.program); // Assurez-vous que le backend renvoie 'program_text'

        } catch (err) {
            console.error('Erreur de génération de programme:', err);
            setError(`Impossible de générer le programme : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Charger automatiquement le programme au premier montage (optionnel)
    // useEffect(() => {
    //     generateProgram();
    // }, []);


    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Mon Programme d'Entraînement Personnalisé</h1>
            <p style={{ textAlign: 'center', marginBottom: '30px' }}>
                Cliquez sur le bouton ci-dessous pour générer un programme basé sur vos informations personnelles et notre documentation experte.
            </p>

            <div style={{ textAlign: 'center' }}>
                <button 
                    onClick={generateProgram} 
                    style={styles.button} 
                    disabled={isLoading}
                >
                    {isLoading ? 'Génération en cours...' : 'Générer Mon Programme'}
                </button>
            </div>
            
            {error && <div style={styles.error}>🚨 {error}</div>}
            
            {program && (
                <div style={styles.programBox}>
                    {/* Utilise ReactMarkdown pour interpréter le Markdown du LLM */}
                    <ReactMarkdown>{program}</ReactMarkdown> 
                </div>
            )}

            {isLoading && !program && <div style={styles.loading}>Chargement et analyse des données en cours... Veuillez patienter.</div>}

            {/* Affiche un message si rien n'est encore généré */}
            {!program && !isLoading && !error && (
                <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '50px' }}>
                    Aucun programme généré. Cliquez sur "Générer Mon Programme" pour commencer.
                </div>
            )}

        </div>
    );
};

export default ProgramPage;