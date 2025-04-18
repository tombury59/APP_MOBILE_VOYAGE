// app/(tabs)/login.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { userDb } from '@/database';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const { login } = useAuth();
    const router = useRouter();

    // Initialisation de la base de données utilisateurs
    useEffect(() => {
        const initUsers = async () => {
            try {
                await userDb.initializeUserDB();
                await userDb.insertDefaultUsers();
            } catch (error) {
                console.error('Erreur lors de l\'initialisation des utilisateurs:', error);
            } finally {
                setInitializing(false);
            }
        };

        initUsers();
    }, []);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        try {
            const user = await userDb.validateCredentials(username, password);

            if (user) {
                login(user);
                Alert.alert('Connexion réussie', `Bienvenue, ${user.firstName || user.username}!`);
                router.replace('/');
            } else {
                Alert.alert('Échec de connexion', 'Nom d\'utilisateur ou mot de passe incorrect');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenue 👋</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

            <View style={styles.formContainer}>
                <TextInput
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                />
                <TextInput
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor="#888"
                />

                <Button
                    title={loading ? "Connexion en cours..." : "Se connecter"}
                    onPress={handleLogin}
                    color="#1E90FF"
                    disabled={loading}
                />
            </View>

            <Text style={styles.signUpText}>
                Pas encore de compte?
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
        color: '#111',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 24,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    input: {
        width: '100%',
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
    },
    signUpText: {
        marginTop: 20,
        fontSize: 14,
        color: '#555',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    }
});

export default LoginScreen;