// src/frontend/src/App.jsx (Nouveau Contenu)
import React, {useState} from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import LoginPage from './LoginPage'; // Importe la nouvelle page de connexion
import { AuthProvider, useAuth } from './AuthContext'; // Importe le fournisseur et le hook
import DocumentsPage from './DocumentsPage'; 
import UserInfoPage from './UserInfoPage';

// Composant qui représente l'interface utilisateur COMPLÈTE (Sidebar + ChatArea)
const MainAppContent = () => {
    const { isLoggedIn, userEmail, logout } = useAuth(); // Récupère les fonctions d'authentification
    const [activePage, setActivePage] = useState('chat'); // NOUVEL ÉTAT : 'chat' est par défaut, 'documents' pour la page documents
    if (!isLoggedIn){
        return <LoginPage/>;
    }
    // Note: Vous devrez mettre à jour Sidebar.jsx pour accepter 'logout' et 'userEmail'
    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* Passe la fonction de déconnexion à la Sidebar */}
            <Sidebar 
                onLogout={logout} 
                userEmail={userEmail}
                onNavigate={setActivePage} // Fonction de navigation
                activePage={activePage}     // Page actuellement active
            />
            {/* Zone de Contenu Principal */}
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                {activePage === 'chat' && <ChatArea />}
                {activePage === 'documents' && <DocumentsPage />} 
                {activePage === 'user-info' && <UserInfoPage />}
            </div>
        </div>
    );
};

// Composant racine qui gère la logique de connexion/déconnexion
const App = () => {
    return (
        // Enveloppe toute l'application dans le AuthProvider
        <AuthProvider>
            <AuthGate />
        </AuthProvider>
    );
};

// Composant qui décide d'afficher la page de connexion ou le contenu principal
const AuthGate = () => {
    const { isLoggedIn } = useAuth();

    if (isLoggedIn) {
        // Affiche l'application complète si l'utilisateur est connecté
        return <MainAppContent />;
    } else {
        // Affiche la page de connexion/inscription si déconnecté
        return <LoginPage />;
    }
};

export default App;