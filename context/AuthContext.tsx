// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/database';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Charger l'état d'authentification depuis le stockage local au démarrage
        const loadAuthState = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const userData = JSON.parse(userJson);
                    setUser(userData);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error('Erreur lors du chargement de l\'état d\'authentification', e);
            } finally {
                setLoading(false);
            }
        };

        loadAuthState();
    }, []);

    const login = async (userData: User) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
        } catch (e) {
            console.error('Erreur lors de l\'enregistrement de l\'utilisateur', e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
        } catch (e) {
            console.error('Erreur lors de la déconnexion', e);
        }
    };

    if (loading) {
        return null; // ou un composant de chargement
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
};