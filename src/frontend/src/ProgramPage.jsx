// src/frontend/src/ProgramPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ReactMarkdown from 'react-markdown';

const ProgramPage = () => {
    const { getAccessToken, VITE_API_BASE_URL } = useAuth();
    
    const [program, setProgram] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = `${VITE_API_BASE_URL}/program/generate`;

    // --- 1. STYLES ---
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
            textAlign: 'left',
            overflowX: 'auto', // Important pour les tableaux larges
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
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            margin: '20px 0',
        },
        th: {
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px',
            textAlign: 'left',
            border: '1px solid #ddd',
        },
        td: {
            padding: '10px',
            border: '1px solid #ddd',
            verticalAlign: 'top',
        },
    };

    // --- 2. FONCTION DE GÉNÉRATION ---
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
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Erreur lors de la génération: ${response.status}`);
            }

            const data = await response.json();
            // L'API renvoie le programme dans 'program'. Si votre backend renvoie 'program_text', utilisez setProgram(data.program_text)
            setProgram(data.program); 

        } catch (err) {
            console.error('Erreur de génération de programme:', err);
            setError(`Impossible de générer le programme : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. COMPOSANTS DE RENDU MARKDOWN PERSONNALISÉS ---
    // Ces composants appliquent les styles CSS aux éléments HTML générés par ReactMarkdown

    const Table = ({ children }) => <table style={styles.table}>{children}</table>;
    const Th = ({ children }) => <th style={styles.th}>{children}</th>;
    const Td = ({ children }) => <td style={styles.td}>{children}</td>;
    const H1 = ({ children }) => <h1 style={{ color: '#007bff', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>{children}</h1>;
    const H2 = ({ children }) => <h2 style={{ color: '#28a745', borderBottom: '1px solid #28a745', paddingBottom: '3px', marginTop: '30px' }}>{children}</h2>;
    
    // Définition de l'objet de rendu
    const markdownComponents = {
        table: Table,
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: Th,
        td: Td,
        h1: H1,
        h2: H2,
        // Ajout de style de base pour les listes
        ul: ({ children }) => <ul style={{ marginLeft: '20px', paddingLeft: '0' }}>{children}</ul>,
        li: ({ children }) => <li style={{ marginBottom: '8px' }}>{children}</li>,
        p: ({ children }) => <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>{children}</p>
    };

    // --- 4. RENDU PRINCIPAL ---
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
                    {/* Utilise ReactMarkdown avec les composants personnalisés */}
                    <ReactMarkdown components={markdownComponents}>
                        {program}
                    </ReactMarkdown>
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