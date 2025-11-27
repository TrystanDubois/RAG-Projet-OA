// src/frontend/src/DocumentsPage.jsx (Version Améliorée)

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './index.css'; // S'assure que les variables CSS sont chargées

const DocumentsPage = () => {
    const { getAccessToken, VITE_API_BASE_URL } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState({ message: null, type: null }); // {message: str, type: 'success'|'error'}

    const API_DOCS_URL = `${VITE_API_BASE_URL}/documents`;
    const API_UPDATE_RAG_URL = `${VITE_API_BASE_URL}/update_rag`;

    // --- Fonction de Fetch de Base (réutilisable) ---
    const authenticatedFetch = async (url, method = 'GET') => {
        const token = getAccessToken();
        if (!token) throw new Error("Accès non autorisé. Veuillez vous reconnecter.");
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Erreur inconnue.' }));
            throw new Error(errorData.detail || `Erreur du serveur (${response.status})`);
        }
        return response.json();
    };

    // --- 1. Charger la liste des documents ---
    const fetchDocuments = async () => {
        setIsLoading(true);
        setUpdateStatus({ message: null, type: null });
        try {
            const data = await authenticatedFetch(API_DOCS_URL);
            setDocuments(data.documents);
        } catch (err) {
            setUpdateStatus({ message: err.message, type: 'error' });
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. Déclencher la réindexation ---
    const handleUpdateRAG = async () => {
        setIsUpdating(true);
        setUpdateStatus({ message: "Démarrage de la réindexation...", type: 'info' });

        try {
            const data = await authenticatedFetch(API_UPDATE_RAG_URL, 'POST');
            
            // Afficher le message de succès du backend
            setUpdateStatus({ message: data.message, type: 'success' }); 

            // Recharger la liste des documents pour inclure le nouveau
            setTimeout(() => {
                fetchDocuments();
            }, 500); // Délai pour s'assurer que ChromaDB a fini de persister
            
        } catch (err) {
            setUpdateStatus({ message: `Erreur de mise à jour : ${err.message}`, type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []); 

    // --- Rendu du Composant ---

    // Style pour les messages de statut
    const getStatusStyle = (type) => {
        switch (type) {
            case 'success':
                return { backgroundColor: '#e6ffe6', color: '#008000', borderLeft: '4px solid #008000' };
            case 'error':
                return { backgroundColor: '#ffe6e6', color: '#cc0000', borderLeft: '4px solid #cc0000' };
            case 'info':
                return { backgroundColor: '#e6f7ff', color: '#004085', borderLeft: '4px solid #004085' };
            default:
                return {};
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            
            <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-grey)', paddingBottom: '20px' }}>
                <h1 style={{ color: 'var(--text-dark)', fontSize: '2em' }}>📚 Gestion de la Base de Connaissances</h1>
                <p style={{ color: 'var(--text-light-grey)', marginTop: '10px' }}>
                    Ajoutez ou supprimez des fichiers dans le dossier  puis cliquez sur Réindexer pour mettre à jour le LLM.
                </p>
            </header>

            {/* Section Mise à Jour */}
            <div style={{ 
                marginBottom: '40px', 
                padding: '20px', 
                backgroundColor: 'var(--bg-light-grey)', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Contrôles RAG</h3>
                
                <button 
                    onClick={handleUpdateRAG} 
                    disabled={isUpdating}
                    style={{ 
                        padding: '12px 20px', 
                        backgroundColor: isUpdating ? 'var(--text-light-grey)' : 'var(--primary-blue)',
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s',
                    }}
                >
                    {isUpdating ? 'Réindexation en cours...' : 'Réindexer les Documents RAG'}
                </button>
                
                {updateStatus.message && (
                    <div style={{ 
                        ...getStatusStyle(updateStatus.type), 
                        padding: '10px 15px', 
                        borderRadius: '4px', 
                        marginTop: '15px',
                        fontSize: '0.9em'
                    }}>
                        {updateStatus.message}
                    </div>
                )}
            </div>

            {/* Section Liste des Documents */}
            <h3 style={{ color: 'var(--text-dark)', marginBottom: '20px' }}>
                Documents Actuellement Indexés ({documents.length})
            </h3>

            {isLoading ? (
                <p style={{ color: 'var(--text-light-grey)' }}>Chargement de la liste...</p>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(200px, 1fr) 100px', /* Nom et Taille */
                    fontWeight: 'bold', 
                    padding: '10px 0',
                    borderBottom: '2px solid var(--text-dark)'
                }}>
                    <span>Nom du Fichier</span>
                    <span style={{ textAlign: 'right' }}>Taille</span>
                </div>
            )}
            
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {documents.map((doc, index) => (
                    <li key={index} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'minmax(200px, 1fr) 100px',
                        padding: '15px 0',
                        borderBottom: '1px solid var(--border-grey)',
                        color: 'var(--text-dark)'
                    }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.name}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--text-light-grey)', fontSize: '0.9em' }}>
                            {doc.size}
                        </span>
                    </li>
                ))}
            </ul>

        </div>
    );
};

export default DocumentsPage;