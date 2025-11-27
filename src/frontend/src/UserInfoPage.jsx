// src/frontend/src/UserInfoPage.jsx - VERSION CORRIGÉE

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
        // 💡 CORRECTION 3 : Raccourci à 10 caractères MAX pour respecter Pydantic
        gender: 'Non-défini', 
        time_per_week_hours: '',
        sleep_hours: '',
        dietary_restrictions: 'Aucune', 
        equipment_available: 'Aucun',  
        training_preference: 'Mixte',  
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
            
            setFormData({
                age: data.age || '',
                weight_kg: data.weight_kg || '',
                height_cm: data.height_cm || '',
                sport_goal: data.sport_goal || '',
                activity_level: data.activity_level || 'Débutant',
                // Utilise 'Non-défini' si la valeur BDD est null/vide (même correction)
                gender: data.gender || 'Non-défini', 
                time_per_week_hours: data.time_per_week_hours || '',
                sleep_hours: data.sleep_hours || '',
                dietary_restrictions: data.dietary_restrictions || 'Aucune', 
                equipment_available: data.equipment_available || 'Aucun',
                training_preference: data.training_preference || 'Mixte',
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
            // Conserve la valeur comme chaîne vide "" si l'utilisateur efface,
            // ce qui sera géré par la soumission (null)
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
        setStatusMessage('');
    };

    // --- 3. FONCTION DE SAUVEGARDE DES DONNÉES ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 💡 Correction 2: Si le formulaire n'est pas valide, on sort avant de sauvegarder
        if (!isFormValid()) {
            setStatusMessage('Veuillez remplir les champs obligatoires pour enregistrer.');
            return;
        }

        setIsSaving(true);
        setStatusMessage('Sauvegarde en cours...');

        // 💡 Correction 1 : Préparation du payload avec conversion des chaînes vides en null
        const dataToSend = { ...formData };
    
        for (const key in dataToSend) {
            // Convertit l'état `''` (chaîne vide) en `null` pour Pydantic
            if (dataToSend[key] === '') {
                dataToSend[key] = null;
            } 
            // ℹ️ La conversion en parseFloat pour les nombres est technique, 
            // mais pas obligatoire si vous faites confiance à `handleChange` 
            // et au format JSON. On la garde pour plus de robustesse sur les champs numériques.
            else if (['age', 'weight_kg', 'height_cm', 'time_per_week_hours', 'sleep_hours'].includes(key) && dataToSend[key] !== null) {
                 // Assurez-vous que les données non-vides sont des nombres avant d'envoyer.
                dataToSend[key] = parseFloat(dataToSend[key]);
            }
        }
        
        try {
            const token = getAccessToken();
            
            // 💡 Correction 1: Utilisation du dataToSend CORRECTEMENT nettoyé
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend), // <<< UTILISE DATA TO SEND
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
    
    // 💡 Correction 2 : Déplacé ici pour être accessible par le JSX du bouton
    const requiredFields = ['age', 'weight_kg', 'height_cm', 'time_per_week_hours', 'sleep_hours'];

    const isFormValid = () => {
        const allRequiredFilled = requiredFields.every(key => 
            // Un champ est considéré comme 'rempli' s'il n'est pas la chaîne vide.
            // On ignore le `null` ici car `formData` ne devrait contenir que `''` ou la valeur
            formData[key] !== ''
        );
        return allRequiredFilled;
    };
    
    // --- 4. Rendu du Composant ---
    // (Styles non modifiés pour la concision)
    const containerStyle = { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' };
    const headerStyle = { color: 'var(--primary-blue)', borderBottom: '2px solid var(--border-grey)', paddingBottom: '10px', marginBottom: '30px' };
    const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-dark)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' };
    const buttonStyle = { 
        padding: '12px 25px', 
        backgroundColor: isSaving || !isFormValid() ? 'var(--text-light-grey)' : 'var(--primary-blue)', // Changer la couleur si désactivé
        color: 'white', 
        border: 'none', 
        borderRadius: '6px', 
        // 💡 Correction 2: Ajout de isFormValid() pour désactiver le bouton
        cursor: isSaving || !isFormValid() ? 'not-allowed' : 'pointer', 
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
                        {/* 💡 CORRECTION 3 : Changement de la valeur pour respecter les 10 caractères du backend */}
                        <option value="Non-défini">Non-défini</option>
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
                {/* CHAMP RESTRICTIONS ALIMENTAIRES */}
                <div>
                    <label htmlFor="dietary_restrictions" style={labelStyle}>Restrictions Alimentaires</label>
                    <select
                        id="dietary_restrictions"
                        name="dietary_restrictions"
                        value={formData.dietary_restrictions}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Aucune">Aucune</option>
                        <option value="Végétarien">Végétarien</option>
                        <option value="Végétalien">Végétalien (Vegan)</option>
                        <option value="Sans Gluten">Sans Gluten</option>
                        <option value="Sans Lactose">Sans Lactose</option>
                        <option value="Autres">Autres (Préciser dans le chat)</option>
                    </select>
                </div>
                {/* CHAMP MATÉRIEL DISPONIBLE */}
                <div>
                    <label htmlFor="equipment_available" style={labelStyle}>Matériel d'Entraînement Disponible</label>
                    <select
                        id="equipment_available"
                        name="equipment_available"
                        value={formData.equipment_available}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Aucun">Aucun (Corps seulement)</option>
                        <option value="Haltères et Élastiques">Haltères et Élastiques</option>
                        <option value="Home Gym Complet">Home Gym Complet (Banc, Rack...)</option>
                        <option value="Salle de Sport">Salle de Sport (Toutes machines)</option>
                    </select>
                </div>
                {/* CHAMP PRÉFÉRENCE D'ENTRAÎNEMENT */}
                <div>
                    <label htmlFor="training_preference" style={labelStyle}>Préférence d'Entraînement</label>
                    <select
                        id="training_preference"
                        name="training_preference"
                        value={formData.training_preference}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="Mixte">Mixte (Force et Cardio)</option>
                        <option value="Force/Musculation">Force / Musculation</option>
                        <option value="Endurance/Cardio">Endurance / Cardio</option>
                        <option value="HIIT/Court">HIIT / Court</option>
                    </select>
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
                
                {/* 💡 Correction 2 : Utilisation de isFormValid() pour désactiver le bouton */}
                <button 
                    type="submit" 
                    style={buttonStyle} 
                    disabled={isSaving || !isFormValid()}
                >
                    {isSaving ? 'Sauvegarde en cours...' : 'Enregistrer Mes Informations'}
                </button>

                {statusMessage && <div style={messageStyle}>{statusMessage}</div>}
                
                {/* Affiche le message d'erreur si la validation front-end échoue */}
                {!isFormValid() && (
                    <div style={{ color: 'orange', marginTop: '10px' }}>
                        Veuillez remplir l'âge, le poids, la taille, le temps d'entraînement et le temps de sommeil pour enregistrer.
                    </div>
                )}
            </form>
        </div>
    );
};

export default UserInfoPage;