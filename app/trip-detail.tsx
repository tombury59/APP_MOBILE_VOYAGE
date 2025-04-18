import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db, tripDb, Destination, Trip as TripModel, Activity } from '@/database';
import { useAuth } from '@/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';

export default function TripDetailScreen() {
    const [trip, setTrip] = useState<TripModel | null>(null);
    const [destination, setDestination] = useState<Destination | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Récupérer l'ID du voyage depuis les paramètres
    const params = useLocalSearchParams();
    const tripId = params.id ? Number(params.id) : undefined;

    useEffect(() => {
        const loadTripDetails = async () => {
            if (!tripId || !user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Initialiser les BDs si nécessaire
                await db.initDatabase();
                await tripDb.initializeTripDB();

                // Récupérer le voyage
                const tripData = await tripDb.getTripById(tripId);

                if (!tripData || tripData.userId !== user.id) {
                    Alert.alert("Erreur", "Ce voyage n'existe pas ou vous n'avez pas les droits pour y accéder");
                    router.replace('/trips');
                    return;
                }

                // Récupérer la destination
                const destinationData = await db.getDestinationById(tripData.destinationId);

                setTrip(tripData);
                setDestination(destinationData);
            } catch (error) {
                console.error("Erreur lors du chargement du voyage:", error);
                Alert.alert("Erreur", "Impossible de charger les détails du voyage");
            } finally {
                setLoading(false);
            }
        };

        loadTripDetails();
    }, [tripId, user]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Non définie";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const deleteTrip = async () => {
        if (!trip || !user) return;

        Alert.alert(
            "Supprimer le voyage",
            "Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const success = await tripDb.deleteTrip(trip.id);
                            if (success) {
                                Alert.alert("Succès", "Voyage supprimé avec succès");
                                router.replace('/trips');
                            } else {
                                Alert.alert("Erreur", "Impossible de supprimer le voyage");
                            }
                        } catch (error) {
                            console.error("Erreur lors de la suppression:", error);
                            Alert.alert("Erreur", "Une erreur est survenue");
                        }
                    }
                }
            ]
        );
    };

    const toggleActivityCompletion = async (activityId: number) => {
        if (!trip) return;

        try {
            const updatedActivities = trip.activities.map(activity =>
                activity.id === activityId
                    ? {...activity, completed: !activity.completed}
                    : activity
            );

            const updatedTrip = {...trip, activities: updatedActivities};
            setTrip(updatedTrip);

            // Mettre à jour la BD
            await tripDb.updateActivityStatus(trip.id, activityId,
                !trip.activities.find(a => a.id === activityId)?.completed);
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'activité:", error);
        }
    };

    const editTrip = () => {
        if (trip) {
            router.push(`/explore?tripId=${trip.id}`);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ca5ff" />
                <ThemedText style={styles.loadingText}>Chargement du voyage...</ThemedText>
            </ThemedView>
        );
    }

    if (!trip || !destination) {
        return (
            <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>Voyage introuvable</ThemedText>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/trips')}
                >
                    <ThemedText style={styles.backButtonText}>Retour aux voyages</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ProtectedRoute>
            <ThemedView style={styles.container}>
                <ScrollView>
                    {/* En-tête */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#4ca5ff" />
                        </TouchableOpacity>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerAction} onPress={editTrip}>
                                <Ionicons name="create-outline" size={24} color="#4ca5ff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerAction} onPress={deleteTrip}>
                                <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Image de destination */}
                    <View style={styles.destinationImageContainer}>
                        <Image
                            source={{ uri: destination.image }}
                            style={styles.destinationImage}
                            resizeMode="cover"
                        />
                        <View style={styles.destinationOverlay}>
                            <ThemedText style={styles.tripName}>{trip.name}</ThemedText>
                            <View style={styles.destinationInfo}>
                                <Ionicons name="location-outline" size={18} color="#fff" />
                                <ThemedText style={styles.destinationName}>{destination.name}, {destination.location}</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Informations de voyage */}
                    <View style={styles.tripInfoContainer}>
                        <View style={styles.dateContainer}>
                            <View style={styles.dateBox}>
                                <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                                <View style={styles.dateTextContainer}>
                                    <ThemedText style={styles.dateLabel}>Date de début</ThemedText>
                                    <ThemedText style={styles.dateValue}>{formatDate(trip.startDate)}</ThemedText>
                                </View>
                            </View>

                            <View style={styles.dateBox}>
                                <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                                <View style={styles.dateTextContainer}>
                                    <ThemedText style={styles.dateLabel}>Date de fin</ThemedText>
                                    <ThemedText style={styles.dateValue}>{formatDate(trip.endDate)}</ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Activités */}
                        <View style={styles.activitiesContainer}>
                            <View style={styles.sectionHeader}>
                                <ThemedText style={styles.sectionTitle}>Activités planifiées</ThemedText>
                                <ThemedText style={styles.activitiesCount}>
                                    {trip.activities.length} activité{trip.activities.length !== 1 ? 's' : ''}
                                </ThemedText>
                            </View>

                            {trip.activities.length > 0 ? (
                                trip.activities.map((activity) => (
                                    <TouchableOpacity
                                        key={activity.id}
                                        style={styles.activityItem}
                                        onPress={() => toggleActivityCompletion(activity.id)}
                                    >
                                        <View style={styles.activityItemContent}>
                                            <View style={styles.activityCheckbox}>
                                                <Ionicons
                                                    name={activity.completed ? "checkmark-circle" : "ellipse-outline"}
                                                    size={24}
                                                    color={activity.completed ? "#4ca5ff" : "#ccc"}
                                                />
                                            </View>
                                            <ThemedText
                                                style={[
                                                    styles.activityText,
                                                    activity.completed ? styles.completedActivityText : null
                                                ]}
                                            >
                                                {activity.text}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyActivities}>
                                    <ThemedText style={styles.emptyText}>
                                        Aucune activité planifiée
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </ThemedView>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        position: 'absolute',
        zIndex: 10,
        width: '100%',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    backButtonText: {
        color: '#4ca5ff',
        fontSize: 16,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerAction: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 10,
    },
    destinationImageContainer: {
        width: '100%',
        height: 300,
        position: 'relative',
    },
    destinationImage: {
        width: '100%',
        height: '100%',
    },
    destinationOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    tripName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    destinationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    destinationName: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 5,
    },
    tripInfoContainer: {
        padding: 20,
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dateBox: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7ea',
    },
    dateTextContainer: {
        marginLeft: 10,
    },
    dateLabel: {
        fontSize: 12,
        color: '#888',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    activitiesContainer: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7ea',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    activitiesCount: {
        fontSize: 14,
        color: '#888',
    },
    activityItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activityItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityCheckbox: {
        marginRight: 10,
    },
    activityText: {
        fontSize: 16,
        flex: 1,
    },
    completedActivityText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    emptyActivities: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});