// Sidebar.jsx (Version finale avec support de l'authentification)
import React from 'react';
import './index.css';

const NavIcon = ({ active }) => (
    <span style={{ 
        marginRight: '12px', 
        fontSize: '1.1em', 
        fontWeight: active ? 'bold' : 'normal',
        color: active ? 'var(--bg-white)' : 'var(--primary-blue)' 
    }}>
        {active ? '◆' : '◇'} 
    </span>
);

const navSections = [
    { name: "Mon Coach IA", id : 'chat'}, 
    { type: 'divider' },
    { name: "Mes Documents", id : 'documents' },
    { name: "Mes Informations de Course" },
    { name: "Mon Alimentation" },
    { type: 'divider' },
    { name: "Paramètres" },
    { name: "Aide" },
];

// Le composant accepte maintenant les props onLogout et userEmail
const Sidebar = ({ onLogout, userEmail, onNavigate, activePage}) => { 
    
    // Extrait la première lettre de l'email pour l'avatar
    const avatarLetter = userEmail ? userEmail[0].toUpperCase() : 'U';
    
    return (
        <div style={{ 
            width: '400px', 
            backgroundColor: 'var(--sidebar-bg)', 
            padding: '20px 0', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: '1px solid var(--border-light)', 
            minHeight: '100vh',
            boxShadow: 'none' 
        }}>
            {/* Logo/Titre Minimal */}
            <div style={{ 
                padding: '0 25px 40px', 
                color: 'var(--text-dark)', 
                fontSize: '1.6em', 
                fontWeight: '600', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center'
            }}>
                RUN AI
            </div>

            {/* Zone de Navigation */}
            <div style={{ flexGrow: 1, padding: '0 15px', overflowY: 'auto' }}>
                {navSections.map((item, index) => {
                    if (item.type === 'divider') return <hr key={index} style={{ borderTop: '1px solid var(--border-light)', margin: '15px 0' }} />;

                    // Déterminer si cet item est la page active
                    const isActive = item.id === activePage;
                    
                    return (
                        <a 
                            key={index} 
                            href="#" 
                            onClick={() => item.id && onNavigate(item.id)} // Appel à onNavigate
                            style={{
                                display: 'flex', 
                                alignItems: 'center',
                                textDecoration: 'none',
                                padding: '10px 15px', 
                                margin: '4px 0',
                                borderRadius: '6px', 
                                // Utiliser isActive
                                backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent',
                                cursor: 'pointer',
                                color: isActive ? 'var(--bg-white)' : 'var(--text-dark)',
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : 'normal',
                                transition: 'all 0.2s ease',
                            }} 
                            className="sidebar-item"
                        >
                            <NavIcon active={isActive} />
                            {item.name}
                        </a>
                    );
                })}
            </div>

            {/* Zone du bas: Profil utilisateur et Déconnexion */}
            <div style={{ 
                padding: '20px 25px', 
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px' 
            }}>
                
                {/* Ligne Profil */}
                <div style={{ 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-dark)'
                }}>
                    <div style={{ 
                        width: '32px', height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-blue)', 
                        color: 'white', 
                        textAlign: 'center', 
                        lineHeight: '32px', 
                        marginRight: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>{avatarLetter}</div>
                    {/* Affiche l'email de l'utilisateur connecté */}
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {userEmail}
                    </div>
                </div>

                {/* Bouton de Déconnexion */}
                <button 
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'transparent',
                        color: 'var(--text-light-grey)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
};

export default Sidebar;