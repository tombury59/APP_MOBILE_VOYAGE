// app/(tabs)/profil.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { tripDb } from '@/database';

export default function ProfilScreen() {
    const router = useRouter();
    const { logout, user } = useAuth();
    const [tripCount, setTripCount] = useState(0);
    const [activityCount, setActivityCount] = useState(0);
    useEffect(() => {
        // Charger le nombre de voyages et d'activités de l'utilisateur
        const loadUserData = async () => {
            if (user) {
                try {
                    const userTrips = await tripDb.getTripsByUserId(user.id);
                    setTripCount(userTrips.length);

                    const totalActivities = userTrips.reduce((count, trip) => count + trip.activities.length, 0);
                    setActivityCount(totalActivities);
                } catch (error) {
                    console.error('Erreur lors du chargement des données utilisateur:', error);
                }
            }
        };

        loadUserData();
    }, [user]);

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Déconnexion",
                    style: "destructive",
                    onPress: () => {
                        logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    // Formatage de la date d'inscription
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Inconnue";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <ProtectedRoute>
            <ScrollView style={{ flex: 1 }}>
                <ThemedView style={styles.container}>
                    {/* En-tête avec couleur */}
                    <View style={styles.headerBackground}>
                        <View style={styles.profileHeader}>
                            <View style={styles.profileImageContainer}>
                                <View style={styles.profileImageBorder}>
                                    <View style={styles.profileImageWrapper}>
                                        <View style={styles.imageOverlay} />
                                        <View style={styles.profileImage}>
                                            {user?.profilePicture ? (
                                                <Image
                                                    source={{ uri: user.profilePicture }}
                                                    style={{ width: '100%', height: '100%' }}
                                                />
                                            ) : (
                                                <View style={styles.imageBackground}>
                                                    <Ionicons name="person" size={60} color="#999" style={{ alignSelf: 'center', marginTop: 25 }} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <ThemedText type="title" style={styles.userName}>
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username}
                            </ThemedText>
                            <ThemedText style={styles.userRole}>Membre</ThemedText>
                        </View>
                    </View>

                    {/* Section d'informations */}
                    <View style={styles.infoSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-circle-outline" size={22} color="#3b5998" />
                            <ThemedText style={styles.sectionTitle}>Informations personnelles</ThemedText>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoLabelContainer}>
                                    <Ionicons name="person-outline" size={18} color="#666" />
                                    <ThemedText style={styles.infoLabel}>Nom d'utilisateur</ThemedText>
                                </View>
                                <ThemedText style={styles.infoValue}>{user?.username}</ThemedText>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <View style={styles.infoLabelContainer}>
                                    <Ionicons name="mail-outline" size={18} color="#666" />
                                    <ThemedText style={styles.infoLabel}>Email</ThemedText>
                                </View>
                                <ThemedText style={styles.infoValue}>{user?.email || "Non renseigné"}</ThemedText>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <View style={styles.infoLabelContainer}>
                                    <Ionicons name="calendar-outline" size={18} color="#666" />
                                    <ThemedText style={styles.infoLabel}>Date d'inscription</ThemedText>
                                </View>
                                <ThemedText style={styles.infoValue}>{formatDate(user?.createdAt)}</ThemedText>
                            </View>

                            {user?.lastLogin && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoLabelContainer}>
                                            <Ionicons name="time-outline" size={18} color="#666" />
                                            <ThemedText style={styles.infoLabel}>Dernière connexion</ThemedText>
                                        </View>
                                        <ThemedText style={styles.infoValue}>{formatDate(user.lastLogin)}</ThemedText>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Section statistiques */}
                    <View style={styles.statsSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="stats-chart" size={22} color="#3b5998" />
                            <ThemedText style={styles.sectionTitle}>Statistiques</ThemedText>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <ThemedText style={styles.statValue}>{tripCount}</ThemedText>
                                <ThemedText style={styles.statLabel}>Voyages</ThemedText>
                            </View>

                            <View style={styles.statCard}>
                                <ThemedText style={styles.statValue}>{activityCount}</ThemedText>
                                <ThemedText style={styles.statLabel}>Activités</ThemedText>
                            </View>

                            <View style={styles.statCard}>
                                <ThemedText style={styles.statValue}>0</ThemedText>
                                <ThemedText style={styles.statLabel}>Avis</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Section actions rapides */}
                    <View style={styles.quickActionsSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="flash-outline" size={22} color="#3b5998" />
                            <ThemedText style={styles.sectionTitle}>Actions rapides</ThemedText>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity style={styles.actionButton}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="settings-outline" size={24} color="#3b5998" />
                                </View>
                                <ThemedText style={styles.actionText}>Paramètres</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="help-circle-outline" size={24} color="#3b5998" />
                                </View>
                                <ThemedText style={styles.actionText}>Aide</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                                <View style={[styles.actionIcon, { backgroundColor: '#ffebee' }]}>
                                    <Ionicons name="log-out-outline" size={24} color="#f44336" />
                                </View>
                                <ThemedText style={styles.actionText}>Déconnexion</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ThemedView>
            </ScrollView>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        paddingTop: 60,
        paddingBottom: 40,
        backgroundColor: '#3b5998',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    profileImageContainer: {
        marginBottom: 15,
    },
    profileImageBorder: {
        padding: 3,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    profileImageWrapper: {
        position: 'relative',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 57,
        zIndex: 1,
    },
    profileImage: {
        width: 114,
        height: 114,
        borderRadius: 57,
        overflow: 'hidden',
    },
    imageBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f0f0f0',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    userRole: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 15,
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
    infoValue: {
        fontSize: 15,
        color: '#555',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
    },
    statsSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3b5998',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    quickActionsSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 80, // Augmentez l'espace pour éviter tout chevauchement
        position: 'relative', // Assurez une position correcte
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10, // Place les boutons au-dessus
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#555',
    },
});