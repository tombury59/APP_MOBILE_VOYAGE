// app/(tabs)/trips.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { tripDb, db, Trip, Destination } from '@/database';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

// Créer un type pour les voyages enrichis avec les données de destination
type EnrichedTrip = Trip & {
    destination?: Destination;
};

export default function TripsScreen() {
    const [trips, setTrips] = useState<EnrichedTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        loadTrips();
    }, [user]);

    const loadTrips = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userTrips = await tripDb.getTripsByUserId(user.id);

            // Enrichir chaque voyage avec sa destination
            const enrichedTrips: EnrichedTrip[] = [];
            for (const trip of userTrips) {
                const destination = await db.getDestinationById(trip.destinationId);
                enrichedTrips.push({
                    ...trip,
                    destination: destination || undefined // Correction de l'erreur TypeScript
                });
            }

            // Trier les voyages par date de mise à jour (du plus récent au plus ancien)
            const sortedTrips = enrichedTrips.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            setTrips(sortedTrips);
        } catch (error) {
            console.error('Erreur lors du chargement des voyages:', error);
            Alert.alert('Erreur', 'Impossible de charger vos voyages');
        } finally {
            setLoading(false);
        }
    };

    const deleteTrip = async (tripId: number) => {
        Alert.alert(
            'Confirmation',
            'Êtes-vous sûr de vouloir supprimer ce voyage ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await tripDb.deleteTrip(tripId);
                            if (success) {
                                setTrips(trips.filter(trip => trip.id !== tripId));
                            } else {
                                Alert.alert('Erreur', 'Impossible de supprimer ce voyage');
                            }
                        } catch (error) {
                            console.error('Erreur lors de la suppression:', error);
                            Alert.alert('Erreur', 'Une erreur est survenue');
                        }
                    }
                }
            ]
        );
    };

    const navigateToTrip = (trip: EnrichedTrip) => {
        router.push(`/trip-detail?id=${trip.id}`);
    };

    const createNewTrip = () => {
        // Navigation vers l'écran de création d'un nouveau voyage
        router.push('/explore');
    };

    const renderTripItem = ({ item }: { item: EnrichedTrip }) => (
        <TouchableOpacity
            style={styles.tripCard}
            onPress={() => navigateToTrip(item)}
        >
            <View style={styles.tripImageContainer}>
                {item.destination && (
                    <Image
                        source={{ uri: item.destination.image }}
                        style={styles.tripImage}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.tripInfo}>
                    <ThemedText style={styles.tripName}>{item.name}</ThemedText>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#fff" />
                        <ThemedText style={styles.locationText}>
                            {item.destination ? item.destination.name : 'Destination inconnue'}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.tripDetails}>
                <View style={styles.tripStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <ThemedText style={styles.statText}>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Non planifié'}
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                        <ThemedText style={styles.statText}>
                            {item.activities.filter(a => a.completed).length}/{item.activities.length} activités
                        </ThemedText>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteTrip(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <ProtectedRoute>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Mes Voyages</ThemedText>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.headerButton} onPress={createNewTrip}>
                            <Ionicons name="add" size={24} color="#4ca5ff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={loadTrips}>
                            <Ionicons name="refresh" size={24} color="#4ca5ff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4ca5ff" />
                    </View>
                ) : trips.length > 0 ? (
                    <FlatList
                        data={trips}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTripItem}
                        contentContainerStyle={styles.tripsList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="airplane-outline" size={60} color="#ccc" />
                        <ThemedText style={styles.emptyText}>
                            Vous n'avez pas encore de voyages
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={createNewTrip}
                        >
                            <ThemedText style={styles.createButtonText}>Créer un voyage</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </ThemedView>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 8,
        marginLeft: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripsList: {
        paddingBottom: 20,
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    tripImageContainer: {
        height: 150,
        position: 'relative',
    },
    tripImage: {
        width: '100%',
        height: '100%',
    },
    tripInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 12,
    },
    tripName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 4,
    },
    tripDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    tripStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    createButton: {
        backgroundColor: '#4ca5ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});