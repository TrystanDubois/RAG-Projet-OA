import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// -------------------------------------------------------------------
// 1. DÉFINITION DES STYLES MODERNES (Inspirés du design minimaliste)
// -------------------------------------------------------------------

// Couleurs (simule l'utilisation de variables CSS pour la cohérence)
const COLORS = {
    primaryBlue: '#3B82F6',
    lightBlue: '#EFF6FF',
    textDark: '#1F2937',
    textGrey: '#4B5563',
    borderLight: '#E5E7EB',
    background: '#F9FAFB',
    successBg: '#D1FAE5',
    successText: '#065F46',
    errorBg: '#FEE2E2',
    errorText: '#B91C1C',
    sectionBg: '#FFFFFF', // Fond blanc pour les cartes de section
};

const styles = {
    container: {
        padding: '40px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif', // Police moderne
        backgroundColor: COLORS.background,
        minHeight: '100%',
        borderRadius: '8px',
    },
    header: {
        color: COLORS.textDark,
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '10px',
    },
    subHeader: {
        color: COLORS.textGrey,
        fontSize: '1.1rem',
        marginBottom: '40px',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: COLORS.primaryBlue,
        borderBottom: `2px solid ${COLORS.borderLight}`,
        paddingBottom: '10px',
        marginBottom: '20px',
        marginTop: '30px',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Grid réactive
        gap: '25px',
        backgroundColor: COLORS.sectionBg,
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px',
    },
    label: {
        display: 'block',
        fontWeight: '500',
        marginBottom: '8px',
        color: COLORS.textDark,
        fontSize: '0.95rem',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: '8px',
        fontSize: '1rem',
        backgroundColor: COLORS.sectionBg,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    },
    button: (isSaving, isValid) => ({
        padding: '15px 30px',
        backgroundColor: isSaving || !isValid ? COLORS.textGrey : COLORS.primaryBlue,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isSaving || !isValid ? 'not-allowed' : 'pointer',
        fontSize: '1.1rem',
        fontWeight: '600',
        transition: 'background-color 0.2s',
        width: '100%',
        marginTop: '20px',
        
    }),
    message: (type) => {
        let bg, text;
        if (type === 'success') { bg = COLORS.successBg; text = COLORS.successText; }
        else if (type === 'error') { bg = COLORS.errorBg; text = COLORS.errorText; }
        else { bg = COLORS.lightBlue; text = COLORS.primaryBlue; }

        return {
            marginTop: '25px',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: bg,
            color: text,
            fontWeight: '600',
        };
    },
    requiredHint: {
        color: COLORS.errorText,
        fontSize: '0.9rem',
        marginTop: '15px',
        padding: '10px',
        backgroundColor: COLORS.errorBg,
        borderRadius: '8px',
        borderLeft: `5px solid ${COLORS.errorText}`,
    },
};


// -------------------------------------------------------------------
// 2. COMPOSANT PRINCIPAL
// -------------------------------------------------------------------

const UserInfoPage = () => {
    const { getAccessToken, VITE_API_BASE_URL } = useAuth();
    
    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState({
        age: '',
        weight_kg: '',
        height_cm: '',
        
        // Mode de vie
        gender: 'Non-défini', 
        time_per_week_hours: '',
        sleep_hours: '',
        dietary_restrictions: 'Aucune', 

        // Sport & Objectifs
        sport_goal: '',
        activity_level: 'Débutant',
        equipment_available: 'Aucun',  
        training_preference: 'Mixte',  
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const API_URL = `${VITE_API_BASE_URL}/user/parameters`;

    // Champs obligatoires pour la validation front-end
    const requiredFields = ['age', 'weight_kg', 'height_cm', 'time_per_week_hours', 'sleep_hours'];
    
    const getMessageType = () => {
        if (statusMessage.startsWith('✅')) return 'success';
        if (statusMessage.startsWith('❌') || statusMessage.startsWith('Veuillez')) return 'error';
        return 'info';
    };

    // --- 1. FONCTION DE CHARGEMENT DES DONNÉES ---
    const loadUserData = async () => {
        setIsLoading(true);
        setStatusMessage('');
        try {
            const token = getAccessToken();
            if (!token) return;

            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Met à jour l'état en veillant à ne pas écraser les champs par défaut
            setFormData({
                age: data.age === null ? '' : data.age,
                weight_kg: data.weight_kg === null ? '' : data.weight_kg,
                height_cm: data.height_cm === null ? '' : data.height_cm,
                time_per_week_hours: data.time_per_week_hours === null ? '' : data.time_per_week_hours,
                sleep_hours: data.sleep_hours === null ? '' : data.sleep_hours,
                
                // Champs de type SELECT avec valeurs par défaut
                sport_goal: data.sport_goal || '',
                activity_level: data.activity_level || 'Débutant',
                gender: data.gender || 'Non-défini', 
                dietary_restrictions: data.dietary_restrictions || 'Aucune', 
                equipment_available: data.equipment_available || 'Aucun',
                training_preference: data.training_preference || 'Mixte',
            });
            setStatusMessage('Informations chargées.');

        } catch (error) {
            console.error("Erreur de chargement:", error);
            setStatusMessage(`❌ Erreur de chargement: ${error.message}`);
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
            // Conserve la chaîne vide "" pour les inputs numériques vides
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
        setStatusMessage('');
    };
    
    const isFormValid = () => {
        const allRequiredFilled = requiredFields.every(key => 
            // Vérifie que les champs obligatoires ne sont pas des chaînes vides
            formData[key] !== ''
        );
        return allRequiredFilled;
    };

    // --- 3. FONCTION DE SAUVEGARDE DES DONNÉES ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid()) {
            setStatusMessage('Veuillez remplir les champs obligatoires (* champs avec unités) pour enregistrer.');
            return;
        }

        setIsSaving(true);
        setStatusMessage('Sauvegarde en cours...');

        // Préparation du payload: conversion des chaînes vides en null pour FastAPI/Pydantic
        const dataToSend = { ...formData };
    
        for (const key in dataToSend) {
            if (dataToSend[key] === '') {
                dataToSend[key] = null;
            } 
            // Conversion explicite en float/int pour les champs numériques
            else if (['age', 'weight_kg', 'height_cm', 'time_per_week_hours', 'sleep_hours'].includes(key) && dataToSend[key] !== null) {
                // Utilise parseInt pour age/height_cm, parseFloat pour les autres
                if (key === 'age' || key === 'height_cm') {
                    dataToSend[key] = parseInt(dataToSend[key], 10);
                } else {
                    dataToSend[key] = parseFloat(dataToSend[key]);
                }
            }
        }
        
        try {
            const token = getAccessToken();
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Échec de la sauvegarde des informations.');
            }

            setStatusMessage('Vos informations ont été sauvegardées avec succès !');

        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            setStatusMessage(`❌ Erreur de sauvegarde: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    
    // --- 4. Rendu du Composant ---
    if (isLoading) {
        return <div style={{...styles.container, textAlign: 'center', marginTop: '50px', fontSize: '1.2rem'}}>Chargement de vos informations...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Votre Profil</h1>
            <p style={styles.subHeader}>
                Ces données sont essentielles pour permettre à votre coach IA de vous fournir des conseils d'entraînement et de nutrition hyper-personnalisés.
            </p>

            <form onSubmit={handleSubmit}>
                
                {/* ------------------------------------------- */}
                {/* 1. SECTION : PROFIL & BIOMÉTRIE */}
                {/* ------------------------------------------- */}
                <h2 style={styles.sectionTitle}>1. Profil & Biométrie</h2>
                <div style={styles.formGrid}>
                    
                    {/* CHAMP AGE */}
                    <div>
                        <label htmlFor="age" style={styles.label}>Âge (années) <span style={{color: COLORS.primaryBlue}}>*</span></label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            style={styles.input}
                            min="1" max="120"
                            placeholder="Ex: 30"
                        />
                    </div>
                    {/* CHAMP POIDS */}
                    <div>
                        <label htmlFor="weight_kg" style={styles.label}>Poids (kg) <span style={{color: COLORS.primaryBlue}}>*</span></label>
                        <input
                            type="number"
                            id="weight_kg"
                            name="weight_kg"
                            value={formData.weight_kg}
                            onChange={handleChange}
                            style={styles.input}
                            min="20" max="300" step="0.1"
                            placeholder="Ex: 75.5"
                        />
                    </div>
                    {/* CHAMP TAILLE */}
                    <div>
                        <label htmlFor="height_cm" style={styles.label}>Taille (cm) <span style={{color: COLORS.primaryBlue}}>*</span></label>
                        <input
                            type="number"
                            id="height_cm"
                            name="height_cm"
                            value={formData.height_cm}
                            onChange={handleChange}
                            style={styles.input}
                            min="50" max="250"
                            placeholder="Ex: 180"
                        />
                    </div>
                     {/* CHAMP SEXE/GENRE */}
                    <div>
                        <label htmlFor="gender" style={styles.label}>Sexe / Genre</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            <option value="Non-défini">Non-défini</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>


                {/* ------------------------------------------- */}
                {/* 2. SECTION : MODE DE VIE & RÉCUPÉRATION 😴🍎 */}
                {/* ------------------------------------------- */}
                <h2 style={styles.sectionTitle}>2. Mode de Vie & Récupération</h2>
                <div style={styles.formGrid}>
                   
                    {/* CHAMP TEMPS DISPONIBLE PAR SEMAINE */}
                    <div>
                        <label htmlFor="time_per_week_hours" style={styles.label}>Temps d'entraînement (h/semaine) <span style={{color: COLORS.primaryBlue}}>*</span></label>
                        <input
                            type="number"
                            id="time_per_week_hours"
                            name="time_per_week_hours"
                            value={formData.time_per_week_hours}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Ex: 5.5"
                            min="0" max="100" step="0.5"
                        />
                    </div>

                    {/* CHAMP TEMPS DE SOMMEIL */}
                    <div>
                        <label htmlFor="sleep_hours" style={styles.label}>Sommeil (h/nuit) <span style={{color: COLORS.primaryBlue}}>*</span></label>
                        <input
                            type="number"
                            id="sleep_hours"
                            name="sleep_hours"
                            value={formData.sleep_hours}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Ex: 7.5"
                            min="0" max="24" step="0.5"
                        />
                    </div>
                     {/* CHAMP RESTRICTIONS ALIMENTAIRES */}
                    <div>
                        <label htmlFor="dietary_restrictions" style={styles.label}>Restrictions Alimentaires</label>
                        <select
                            id="dietary_restrictions"
                            name="dietary_restrictions"
                            value={formData.dietary_restrictions}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            <option value="Aucune">Aucune</option>
                            <option value="Végétarien">Végétarien</option>
                            <option value="Végétalien">Végétalien (Vegan)</option>
                            <option value="Sans Gluten">Sans Gluten</option>
                            <option value="Sans Lactose">Sans Lactose</option>
                            <option value="Autres">Autres (Préciser dans le chat)</option>
                        </select>
                    </div>
                </div>

                {/* ------------------------------------------- */}
                {/* 3. SECTION : SPORT & OBJECTIFS 🏅🏋️ */}
                {/* ------------------------------------------- */}
                 <h2 style={styles.sectionTitle}>3. Sport & Objectifs</h2>
                <div style={styles.formGrid}>
                    
                    {/* CHAMP NIVEAU D'ACTIVITÉ */}
                    <div>
                        <label htmlFor="activity_level" style={styles.label}>Niveau d'Activité Actuel</label>
                        <select
                            id="activity_level"
                            name="activity_level"
                            value={formData.activity_level}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            <option value="Débutant">Débutant (Moins de 1 an)</option>
                            <option value="Intermédiaire">Intermédiaire (Régulier, quelques courses)</option>
                            <option value="Avancé">Avancé (Entraînement structuré)</option>
                            <option value="Expert">Expert (Objectifs de performance)</option>
                        </select>
                    </div>
                    {/* CHAMP PRÉFÉRENCE D'ENTRAÎNEMENT */}
                    <div>
                        <label htmlFor="training_preference" style={styles.label}>Préférence d'Entraînement</label>
                        <select
                            id="training_preference"
                            name="training_preference"
                            value={formData.training_preference}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            <option value="Mixte">Mixte (Force et Cardio)</option>
                            <option value="Force/Musculation">Force / Musculation</option>
                            <option value="Endurance/Cardio">Endurance / Cardio</option>
                            <option value="HIIT/Court">HIIT / Court</option>
                        </select>
                    </div>
                    {/* CHAMP MATÉRIEL DISPONIBLE */}
                    <div>
                        <label htmlFor="equipment_available" style={styles.label}>Matériel Disponible</label>
                        <select
                            id="equipment_available"
                            name="equipment_available"
                            value={formData.equipment_available}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            <option value="Aucun">Aucun (Corps seulement)</option>
                            <option value="Haltères et Élastiques">Haltères et Élastiques</option>
                            <option value="Home Gym Complet">Home Gym Complet</option>
                            <option value="Salle de Sport">Salle de Sport</option>
                        </select>
                    </div>
                </div>
                
                 {/* CHAMP OBJECTIF SPORTIF (Full Width) */}
                <div style={{...styles.formGrid, gridTemplateColumns: '1fr'}}>
                    <div>
                        <label htmlFor="sport_goal" style={styles.label}>Objectif Sportif Principal</label>
                        <input
                            type="text"
                            id="sport_goal"
                            name="sport_goal"
                            value={formData.sport_goal}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Ex: Courir un Marathon, Perte de poids de 5kg, Améliorer ma VMA (facultatif)"
                        />
                    </div>
                </div>
                
                {/* ------------------------------------------- */}
                {/* 4. BOUTON & MESSAGES */}
                {/* ------------------------------------------- */}

                {!isFormValid() && (
                    <div style={styles.requiredHint}>
                        Veuillez remplir les **champs obligatoires marquées d'une étoile (\*)** (âge, poids, taille, temps d'entraînement et temps de sommeil) pour pouvoir enregistrer.
                    </div>
                )}

                <button 
                    type="submit" 
                    style={styles.button(isSaving, isFormValid())} 
                    disabled={isSaving || !isFormValid()}
                >
                    {isSaving ? 'Sauvegarde en cours...' : 'Enregistrer Mes Informations'}
                </button>

                {statusMessage && <div style={styles.message(getMessageType())}>{statusMessage}</div>}
                
            </form>
        </div>
    );
};

export default UserInfoPage;