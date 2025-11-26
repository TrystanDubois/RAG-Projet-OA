// src/frontend/src/UserInfoPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserInfoPage = () => {
    const { getAccessToken, VITE_API_BASE_URL } = useAuth();
    
    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState({
        age: '',
        weight_kg: '',
        height_cm: '',
        sport_goal: '',
        activity_level: 'Débutant', // Valeur par défaut
        gender: 'Non spécifié', // Valeur par défaut
        time_per_week_hours: '',
        sleep_hours: '',
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const API_URL = `${VITE_API_BASE_URL}/user/parameters`;

    // --- 1. FONCTION DE CHARGEMENT DES DONNÉES ---
    const loadUserData = async () => {
        setIsLoading(true);
        setStatusMessage('');
        try {
            const token = getAccessToken();
            if (!token) return;

            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Met à jour l'état avec les données récupérées. 
            // L'API renvoie des valeurs nulles si pas d'enregistrement, donc on les gère.
            setFormData({
                age: data.age || '',
                weight_kg: data.weight_kg || '',
                height_cm: data.height_cm || '',
                sport_goal: data.sport_goal || '',
                activity_level: data.activity_level || 'Débutant',
                gender: data.gender || 'Non spécifié', // Utilise 'Non spécifié' si null
                time_per_week_hours: data.time_per_week_hours || '', // Utilise '' si null
                sleep_hours: data.sleep_hours || '', // Utilise '' si null
            });
            setStatusMessage('Informations chargées.');

        } catch (error) {
            console.error("Erreur de chargement:", error);
            setStatusMessage(`Erreur de chargement: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Charge les données au premier montage du composant
    useEffect(() => {
        loadUserData();
    }, []);

    // --- 2. GESTION DES CHANGEMENTS DU FORMULAIRE ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            // Convertit en nombre si c'est un champ numérique
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
        setStatusMessage(''); // Efface le message de statut dès qu'on modifie
    };

    // --- 3. FONCTION DE SAUVEGARDE DES DONNÉES ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage('Sauvegarde en cours...');

        try {
            const token = getAccessToken();
            const payload = {
                // S'assure d'envoyer null pour les champs vides ou zéros invalides
                ...formData,
                age: formData.age || null,
                weight_kg: formData.weight_kg || null,
                height_cm: formData.height_cm || null,
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Échec de la sauvegarde des informations.');
            }

            setStatusMessage('✅ Vos informations ont été sauvegardées avec succès !');

        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            setStatusMessage(`❌ Erreur de sauvegarde: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- 4. Rendu du Composant ---
    
    // Styles de base (ajustez-les selon votre fichier index.css si besoin)
    const containerStyle = { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' };
    const headerStyle = { color: 'var(--primary-blue)', borderBottom: '2px solid var(--border-grey)', paddingBottom: '10px', marginBottom: '30px' };
    const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-dark)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' };
    const buttonStyle = { 
        padding: '12px 25px', 
        backgroundColor: isSaving ? 'var(--text-light-grey)' : 'var(--primary-blue)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: isSaving ? 'not-allowed' : 'pointer', 
        fontSize: '16px', 
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
        display: 'block',
        width: '100%'
    };
    const messageStyle = { marginTop: '20px', padding: '10px', borderRadius: '4px', textAlign: 'center', backgroundColor: statusMessage.startsWith('✅') ? '#e6ffe6' : (statusMessage.startsWith('❌') ? '#ffe6e6' : 'transparent'), color: statusMessage.startsWith('❌') ? '#cc0000' : '#006600' };

    if (isLoading) {
        return <div style={{...containerStyle, textAlign: 'center', marginTop: '50px'}}>Chargement de vos informations...</div>;
    }

    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>Mes Informations et Paramètres Personnels</h2>
            
            <p style={{ fontSize: '16px', color: 'var(--text-dark-grey)', marginBottom: '30px' }}>
                Ces données sont essentielles pour permettre à votre coach IA de vous fournir des conseils d'entraînement et de nutrition hyper-personnalisés.
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                    {/* CHAMP AGE */}
                    <div>
                        <label htmlFor="age" style={labelStyle}>Âge (années)</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            style={inputStyle}
                            min="1" max="120"
                            placeholder="Ex: 30"
                        />
                    </div>
                    {/* CHAMP POIDS */}
                    <div>
                        <label htmlFor="weight_kg" style={labelStyle}>Poids (kg)</label>
                        <input
                            type="number"
                            id="weight_kg"
                            name="weight_kg"
                            value={formData.weight_kg}
                            onChange={handleChange}
                            style={inputStyle}
                            min="20" max="300" step="0.1"
                            placeholder="Ex: 75.5"
                        />
                    </div>
                    {/* CHAMP TAILLE */}
                    <div>
                        <label htmlFor="height_cm" style={labelStyle}>Taille (cm)</label>
                        <input
                            type="number"
                            id="height_cm"
                            name="height_cm"
                            value={formData.height_cm}
                            onChange={handleChange}
                            style={inputStyle}
                            min="50" max="250"
                            placeholder="Ex: 180"
                        />
                    </div>
                </div>
                {/* CHAMP SEXE/GENRE */}
                <div>
                    <label htmlFor="gender" style={labelStyle}>Sexe / Genre</label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Non spécifié">Non spécifié</option>
                        <option value="Homme">Homme</option>
                        <option value="Femme">Femme</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                {/* CHAMP TEMPS DISPONIBLE PAR SEMAINE */}
                <div>
                    <label htmlFor="time_per_week_hours" style={labelStyle}>Temps disponible pour le sport (heures/semaine)</label>
                    <input
                        type="number"
                        id="time_per_week_hours"
                        name="time_per_week_hours"
                        value={formData.time_per_week_hours}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Ex: 5.5"
                        min="0"
                        max="100"
                    />
                </div>

                {/* CHAMP TEMPS DE SOMMEIL */}
                <div>
                    <label htmlFor="sleep_hours" style={labelStyle}>Temps de sommeil (heures/nuit)</label>
                    <input
                        type="number"
                        id="sleep_hours"
                        name="sleep_hours"
                        value={formData.sleep_hours}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Ex: 7.5"
                        min="0"
                        max="24"
                    />
                </div>

                {/* CHAMP OBJECTIF SPORTIF */}
                <div>
                    <label htmlFor="sport_goal" style={labelStyle}>Objectif Sportif Principal</label>
                    <input
                        type="text"
                        id="sport_goal"
                        name="sport_goal"
                        value={formData.sport_goal}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Ex: Courir un Marathon, Perte de poids de 5kg, Améliorer ma VMA"
                    />
                </div>

                {/* CHAMP NIVEAU D'ACTIVITÉ */}
                <div>
                    <label htmlFor="activity_level" style={labelStyle}>Niveau d'Activité Actuel</label>
                    <select
                        id="activity_level"
                        name="activity_level"
                        value={formData.activity_level}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Débutant">Débutant (Moins de 1 an d'expérience)</option>
                        <option value="Intermédiaire">Intermédiaire (Régulier, quelques courses)</option>
                        <option value="Avancé">Avancé (Entraînement structuré, compétiteur)</option>
                        <option value="Expert">Expert (Plusieurs années, objectifs de performance)</option>
                    </select>
                </div>
                
                <button type="submit" style={buttonStyle} disabled={isSaving}>
                    {isSaving ? 'Sauvegarde en cours...' : 'Enregistrer Mes Informations'}
                </button>

                {statusMessage && <div style={messageStyle}>{statusMessage}</div>}

            </form>
        </div>
    );
};

export default UserInfoPage;