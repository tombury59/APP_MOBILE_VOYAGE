// app/(tabs)/trip-steps.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db, tripDb, Destination, Trip as TripModel } from '@/database';
import { useAuth } from '@/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import TripMap from '@/components/voyage/TripMap';

type Step = {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    order: number;
    tripId: number;
};

export default function TripStepsScreen() {
    const [trip, setTrip] = useState<TripModel | null>(null);
    const [destination, setDestination] = useState<Destination | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Récupérer l'utilisateur connecté
    const { user } = useAuth();

    // Récupérer l'ID du voyage depuis les paramètres
    const params = useLocalSearchParams();
    const tripId = params.tripId ? Number(params.tripId) : undefined;

    useEffect(() => {
        const loadTripData = async () => {
            if (!tripId || !user) {
                Alert.alert("Erreur", "Voyage non trouvé");
                router.back();
                return;
            }

            try {
                setLoading(true);

                // Charger les détails du voyage
                const tripData = await tripDb.getTripById(tripId);
                if (!tripData || tripData.userId !== user.id) {
                    Alert.alert("Erreur", "Vous n'avez pas accès à ce voyage");
                    router.back();
                    return;
                }

                setTrip(tripData);

                // Charger la destination
                const dest = await db.getDestinationById(tripData.destinationId);
                setDestination(dest);

                // Charger les étapes existantes du voyage
                const tripSteps = await tripDb.getStepsForTrip(tripId);
                setSteps(tripSteps || []);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                Alert.alert("Erreur", "Impossible de charger les détails du voyage");
            } finally {
                setLoading(false);
            }
        };

        loadTripData();
    }, [tripId, user]);

    const saveSteps = async () => {
        if (!tripId || !user) return;

        try {
            setIsSaving(true);

            // Supprimer les anciennes étapes
            await tripDb.deleteAllStepsForTrip(tripId);

            // Ajouter les nouvelles étapes
            for (const step of steps) {
                await tripDb.addStepToTrip(
                    tripId,
                    step.title,
                    step.description || '',
                    step.latitude,
                    step.longitude,
                    step.order
                );
            }

            Alert.alert(
                "Succès",
                "Étapes du voyage enregistrées avec succès",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des étapes:', error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ProtectedRoute>
            <ThemedView style={styles.container}>
                {/* En-tête avec titre et bouton de sauvegarde */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4ca5ff" />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>
                        {trip?.name} - Étapes
                    </ThemedText>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={saveSteps}
                        disabled={isSaving}
                    >
                        <Ionicons
                            name="save-outline"
                            size={24}
                            color="#4ca5ff"
                        />
                    </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <ThemedText style={styles.instructionsText}>
                        Ajoutez des étapes à votre voyage en touchant la carte.
                    </ThemedText>
                </View>

                {/* Map pour gérer les étapes */}
                <TripMap
                    initialSteps={steps}
                    onStepsChange={setSteps}
                    readonly={false}
                    initialRegion={
                        destination ? {
                            latitude: destination.latitude,
                            longitude: destination.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05
                        } : undefined
                    }
                />
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
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        padding: 8,
    },
    instructions: {
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    instructionsText: {
        fontSize: 14,
        color: '#666',
    }
});