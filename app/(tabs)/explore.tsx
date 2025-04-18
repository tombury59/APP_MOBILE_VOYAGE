import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db, tripDb, Destination, Activity, Trip as TripModel } from '@/database';
import { useAuth } from '@/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';

import TripMap from '@/components/voyage/TripMap';
import DateSelector from '@/components/voyage/DateSelector';
import DestinationSelector from '@/components/voyage/DestinationSelector';

type Step = {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    order: number;
};

export default function ExploreScreen() {
    const [availableDestinations, setAvailableDestinations] = useState<Destination[]>([]);
    const [trip, setTrip] = useState<{
        id?: number;
        destination: Destination | null;
        activities: Activity[];
        name: string;
        startDate?: string;
        endDate?: string;
    }>({
        destination: null,
        activities: [],
        name: "Mon voyage",
        startDate: undefined,
        endDate: undefined
    });

    const [loading, setLoading] = useState(true);
    const [showActivityInput, setShowActivityInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewTrip, setIsNewTrip] = useState(true);



    // Nouvel état pour afficher le modal de sélection de dates sur iOS
    const [showDateModal, setShowDateModal] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

    // Récupérer l'utilisateur connecté
    const { user } = useAuth();

    // Récupérer les paramètres d'URL (pour éditer un voyage existant)
    const params = useLocalSearchParams();
    const tripId = params.tripId ? Number(params.tripId) : undefined;

    // Charger les destinations disponibles et initialiser la base de données des voyages
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Initialiser les bases de données
                await db.initDatabase();
                await tripDb.initializeTripDB();
                await db.insertInitialData();

                // Charger les destinations
                const destinations = await db.getDestinations();
                setAvailableDestinations(destinations);

                // Si un ID de voyage est fourni, charger ce voyage spécifique
                if (tripId && user) {
                    const existingTrip = await tripDb.getTripById(tripId);
                    if (existingTrip && existingTrip.userId === user.id) {
                        const destination = await db.getDestinationById(existingTrip.destinationId);
                        if (destination) {
                            setTrip({
                                id: existingTrip.id,
                                destination: destination,
                                activities: existingTrip.activities,
                                name: existingTrip.name,
                                startDate: existingTrip.startDate,
                                endDate: existingTrip.endDate
                            });
                            setIsNewTrip(false);
                        }
                    }
                } else {
                    // Réinitialiser pour un nouveau voyage
                    setTrip({
                        destination: null,
                        activities: [],
                        name: "Mon voyage",
                        startDate: undefined,
                        endDate: undefined
                    });
                    setIsNewTrip(true);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, tripId]);

    // Sauvegarder le voyage
    const saveTrip = async () => {
        if (!user || !trip.destination) {
            Alert.alert("Erreur", "Veuillez vous connecter et sélectionner une destination");
            return;
        }

        try {
            setIsSaving(true);

            if (trip.id && !isNewTrip) {
                // Mettre à jour un voyage existant
                const tripToUpdate: TripModel = {
                    id: trip.id,
                    userId: user.id,
                    destinationId: trip.destination.id,
                    name: trip.name,
                    activities: trip.activities,
                    createdAt: new Date().toISOString(), // Vous devriez conserver la date de création originale
                    updatedAt: new Date().toISOString(),
                    startDate: trip.startDate,
                    endDate: trip.endDate
                };

                const success = await tripDb.updateTrip(tripToUpdate);
                if (success) {
                    Alert.alert("Succès", "Voyage mis à jour avec succès");
                    router.push('/trips');
                } else {
                    Alert.alert("Erreur", "Échec de la mise à jour du voyage");
                }
            } else {
                // Toujours créer un nouveau voyage
                const newTrip = await tripDb.createTrip(
                    user.id,
                    trip.destination.id,
                    trip.name,
                    trip.startDate,
                    trip.endDate
                );

                if (newTrip) {
                    // Ajouter toutes les activités
                    for (const activity of trip.activities) {
                        await tripDb.addActivityToTrip(newTrip.id, activity.text);

                        // Si l'activité est complétée, mettre à jour son statut
                        if (activity.completed) {
                            await tripDb.updateActivityStatus(newTrip.id, activity.id, true);
                        }
                    }

                    Alert.alert(
                        "Succès",
                        "Voyage enregistré avec succès",
                        [
                            {
                                text: "OK",
                                onPress: () => {
                                    // Rediriger vers la liste des voyages
                                    router.push('/trips');
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert("Erreur", "Échec de la création du voyage");
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du voyage:', error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    // Modifier le nom du voyage
    const updateTripName = (name: string) => {
        setTrip(prevTrip => ({
            ...prevTrip,
            name
        }));
    };


    // Créer un nouveau voyage vide
    const resetTrip = () => {
        setTrip({
            destination: null,
            activities: [],
            name: "Mon voyage",
            startDate: undefined,
            endDate: undefined
        });
        setIsNewTrip(true);
    };

    const [tempDate, setTempDate] = useState<Date | null>(null);
    const [selectedStep, setSelectedStep] = useState<Step | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);

    // Afficher le modal de date pour iOS
    const renderDateModal = () => {
        if (!showDateModal) return null;

        const initialDate = datePickerMode === 'start'
            ? (trip.startDate ? new Date(trip.startDate) : new Date())
            : (trip.endDate ? new Date(trip.endDate) : new Date());

        if (!tempDate) {
            setTempDate(initialDate);
        }

        return (
            <View style={[styles.dateModalContainer, { zIndex: 1000 }]}>
                <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                        <ThemedText style={styles.dateModalTitle}>
                            {datePickerMode === 'start' ? 'Date de début' : 'Date de fin'}
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.dateModalCloseButton}
                            onPress={() => {
                                setShowDateModal(false);
                                setTempDate(null);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#ff6b6b" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerWrapper}>
                        <DateTimePicker
                            value={tempDate || initialDate}
                            mode="date"
                            display="spinner"
                            onChange={(event, date) => {
                                if (date) {
                                    setTempDate(date);
                                }
                            }}
                            style={{ height: 200, width: '100%' }}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.dateModalConfirmButton}
                        onPress={() => {
                            if (tempDate) {
                                handleDateChange({ type: 'set', nativeEvent: {} }, tempDate);
                                setTempDate(null);
                                setShowDateModal(false);
                            }
                        }}
                    >
                        <ThemedText style={styles.dateModalConfirmText}>Confirmer</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };



    return (
        <ProtectedRoute>
            <ThemedView style={styles.container}>
                {/* En-tête avec bouton de sauvegarde */}
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>
                        {isNewTrip ? "Nouveau voyage" : "Modifier le voyage"}
                    </ThemedText>
                    <View style={styles.headerButtons}>
                        {!isNewTrip && (
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={resetTrip}
                            >
                                <Ionicons name="add-outline" size={24} color="#4ca5ff" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={saveTrip}
                            disabled={!trip.destination || isSaving}
                        >
                            <Ionicons
                                name="save-outline"
                                size={24}
                                color={trip.destination ? "#4ca5ff" : "#bbb"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>



                {/* Nom du voyage */}
                <View style={styles.tripNameContainer}>
                    <TextInput
                        style={styles.tripNameInput}
                        value={trip.name}
                        onChangeText={updateTripName}
                        placeholder="Nom du voyage"
                    />
                </View>

                {/* Sélection de destination */}
                <DestinationSelector
                    destination={trip.destination}
                    availableDestinations={availableDestinations}
                    onDestinationSelected={(destination) =>
                        setTrip(prevTrip => ({
                            ...prevTrip,
                            destination: destination
                        }))
                    }
                />

                {/* Bloc pour les dates */}
                <DateSelector
                    startDate={trip.startDate}
                    endDate={trip.endDate}
                    onStartDateChange={(date) => setTrip(prev => ({ ...prev, startDate: date }))}
                    onEndDateChange={(date) => setTrip(prev => ({ ...prev, endDate: date }))}
                />

                {/* Affichage de la map et des étapes */}
                {/*<TripMap*/}
                {/*    initialSteps={steps}*/}
                {/*    onStepsChange={setSteps}*/}
                {/*    readonly={false}*/}
                {/*/>*/}

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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginRight: 8,
    },
    saveButton: {
        padding: 8,
    },
    tripNameContainer: {
        marginBottom: 15,
    },
    tripNameInput: {
        fontSize: 18,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7ea',
    },
    // Les styles de modal sont conservés car ils sont encore utilisés dans le code actuel
    dateModalContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dateModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dateModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateModalCloseButton: {
        padding: 5,
    },
    datePickerWrapper: {
        backgroundColor: '#fff',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateModalConfirmButton: {
        backgroundColor: '#4ca5ff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    dateModalConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});