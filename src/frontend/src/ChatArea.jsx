// ChatArea.jsx (Version Professionnelle)
import React, { useState } from 'react';
import './index.css';
import { useAuth } from './AuthContext';

const ChatArea = () => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { getAccessToken } = useAuth();

    // L'URL de l'API est le backend FastAPI lancé sur le port 8000
    const API_URL = "http://127.0.0.1:8000/query"; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const userMessage = { role: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setPrompt(''); 
        setIsLoading(true);

        const token = getAccessToken();
        if (!token) {
            // Optionnel : Afficher un message si l'utilisateur n'est pas loggé
            console.error("Non connecté. Impossible d'envoyer la requête.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ query: prompt }),
            });

            if (!res.ok) {
                throw new Error(`Erreur de l'API (${res.status}): ${res.statusText}`);
            }

            const data = await res.json();
            const assistantMessage = { role: 'assistant', content: data.answer };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Erreur lors de l'appel RAG:", error);
            const errorMessage = { role: 'assistant', content: "Erreur: Impossible de joindre le service RAG. Assurez-vous que le backend FastAPI est lancé sur le port 8000." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-light)' }}>
            
            {/* 1. Zone du chat (Affichage des messages) */}
            <div style={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                padding: '30px 20px', 
                width: '100%', 
                maxWidth: '900px', 
                margin: '0 auto' 
            }}>
                
                {messages.length === 0 && !isLoading && (
                     <div style={{textAlign: 'center', marginTop: '80px', color: 'var(--text-dark)'}}>
                        {/* Icône plus professionnelle pour l'accueil */}
                        <span style={{fontSize: '4em'}}>🏃</span>
                        <h1 style={{fontSize: '2.5em', color: 'var(--primary-blue)'}}>RUN AI : Votre Assistant de Course</h1>
                        <p style={{ color: 'var(--text-light-grey)', fontSize: '1.1em' }}>
                            Démarrez une conversation en posant une question sur l'entraînement, la nutrition ou la performance.
                        </p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex', 
                        padding: '20px', 
                        // Utilisation des chaînes de caractères pour les variables CSS
                        backgroundColor: msg.role === 'assistant' ? 'var(--bg-white)' : 'transparent', 
                        borderRadius: '12px', 
                        marginBottom: '15px', 
                        boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', 
                        alignItems: 'flex-start' 
                    }}>
                        {/* Icône/Avatar (U pour User, A pour AI) */}
                        <div className={msg.role === 'user' ? 'avatar-user' : 'avatar-ai'} style={{ 
                            minWidth: '40px', height: '40px', 
                            borderRadius: '50%', 
                            color: 'white', 
                            textAlign: 'center', 
                            lineHeight: '40px', 
                            marginRight: '15px', 
                            fontWeight: 'bold', 
                            fontSize: '16px' 
                        }}>
                            {msg.role === 'user' ? 'U' : 'A'} 
                        </div>
                        {/* Contenu */}
                        <div style={{ flexGrow: 1, whiteSpace: 'pre-wrap', color: 'var(--text-dark)' }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-white)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                         <div className="avatar-ai" style={{ minWidth: '40px', height: '40px', borderRadius: '50%', color: 'white', textAlign: 'center', lineHeight: '40px', marginRight: '15px' }}>A</div>
                         <div style={{ color: 'var(--text-light-grey)' }}>L'assistant est en train de traiter votre requête...</div>
                    </div>
                )}
            </div>

            {/* 2. Zone de saisie (Prompt) */}
            <div style={{ padding: '25px 0', backgroundColor: 'var(--bg-light)', borderTop: '1px solid var(--border-light)' }}>
                <form onSubmit={handleSubmit} style={{ 
                    maxWidth: '800px', 
                    margin: '0 auto', 
                    display: 'flex', 
                    backgroundColor: 'var(--input-bg)', // Utilisation des chaînes de caractères
                    borderRadius: '30px', 
                    padding: '10px 20px', 
                    boxShadow: '0 5px 15px rgba(0,0,0,0.05)' // Ombre plus légère
                }}>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Posez votre question (entraînement, nutrition, documents...)"
                        style={{
                            flexGrow: 1,
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-dark)',
                            padding: '10px',
                            outline: 'none',
                            fontSize: '17px' 
                        }}
                        disabled={isLoading}
                    />
                    <button type="submit" style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: prompt.trim() && !isLoading ? 'var(--primary-blue)' : 'var(--text-light-grey)', 
                        cursor: prompt.trim() && !isLoading ? 'pointer' : 'not-allowed',
                        fontSize: '24px', 
                        padding: '8px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} disabled={!prompt.trim() || isLoading}>
                        {isLoading ? '...' : '→'} 
                    </button>
                </form>
                <div style={{fontSize: '11px', color: 'var(--text-light-grey)', textAlign: 'center', marginTop: '10px'}}>
                    Propulsé par RAG (Retrieval Augmented Generation). Vérifiez les conseils d'entraînement auprès d'un professionnel.
                </div>
            </div>
        </div>
    );
};

export default ChatArea;