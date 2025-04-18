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
    const [newActivityText, setNewActivityText] = useState('');
    const [loading, setLoading] = useState(true);
    const [showActivityInput, setShowActivityInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewTrip, setIsNewTrip] = useState(true);

    // Nouveaux états pour le DatePicker
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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

    // Nouvelles fonctions pour gérer les dates
    const onStartDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (trip.startDate ? new Date(trip.startDate) : new Date());
        setShowStartDatePicker(Platform.OS === 'ios');

        // Vérifier que la date de début est antérieure à la date de fin
        if (trip.endDate && new Date(currentDate) > new Date(trip.endDate)) {
            Alert.alert("Erreur", "La date de début doit être antérieure à la date de fin");
            return;
        }

        setTrip(prevTrip => ({
            ...prevTrip,
            startDate: currentDate.toISOString()
        }));
    };

    const onEndDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (trip.endDate ? new Date(trip.endDate) : new Date());
        setShowEndDatePicker(Platform.OS === 'ios');

        // Vérifier que la date de fin est postérieure à la date de début
        if (trip.startDate && new Date(currentDate) < new Date(trip.startDate)) {
            Alert.alert("Erreur", "La date de fin doit être postérieure à la date de début");
            return;
        }

        setTrip(prevTrip => ({
            ...prevTrip,
            endDate: currentDate.toISOString()
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Non définie";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    // Ajouter une activité
    const addActivity = async () => {
        if (!trip.destination) {
            Alert.alert("Erreur", "Veuillez d'abord sélectionner une destination");
            return;
        }

        if (newActivityText.trim() === '') {
            Alert.alert("Erreur", "Veuillez entrer une activité");
            return;
        }

        const newActivity: Activity = {
            id: Date.now(),
            text: newActivityText,
            completed: false
        };

        // Ajouter l'activité localement
        setTrip(prevTrip => ({
            ...prevTrip,
            activities: [...prevTrip.activities, newActivity]
        }));

        // Si le voyage existe déjà dans la base de données, mettre à jour
        if (trip.id && user && !isNewTrip) {
            await tripDb.addActivityToTrip(trip.id, newActivityText);
        }

        setNewActivityText('');
        setShowActivityInput(false);
    };

    // Supprimer une activité
    const deleteActivity = async (id: number) => {
        // Supprimer l'activité localement
        setTrip(prevTrip => ({
            ...prevTrip,
            activities: prevTrip.activities.filter(activity => activity.id !== id)
        }));

        // Si le voyage existe déjà dans la base de données, mettre à jour
        if (trip.id && user && !isNewTrip) {
            await tripDb.removeActivityFromTrip(trip.id, id);
        }
    };

    // Marquer une activité comme complétée
    const toggleActivityCompletion = async (id: number) => {
        // Mettre à jour localement
        const updatedActivities = trip.activities.map(activity =>
            activity.id === id ? {...activity, completed: !activity.completed} : activity
        );

        setTrip(prevTrip => ({
            ...prevTrip,
            activities: updatedActivities
        }));

        // Si le voyage existe déjà dans la base de données, mettre à jour
        if (trip.id && user && !isNewTrip) {
            const activity = trip.activities.find(a => a.id === id);
            if (activity) {
                await tripDb.updateActivityStatus(trip.id, id, !activity.completed);
            }
        }
    };

    // Sélectionner une destination
    const selectDestination = (destination: Destination) => {
        setTrip(prevTrip => ({
            ...prevTrip,
            destination: destination
        }));
    };

    // Modifier le nom du voyage
    const updateTripName = (name: string) => {
        setTrip(prevTrip => ({
            ...prevTrip,
            name
        }));
    };

    // Afficher le sélecteur de destination
    const showDestinationPicker = () => {
        Alert.alert(
            "Sélectionner une destination",
            "Choisissez votre destination",
            availableDestinations.map(destination => ({
                text: destination.name,
                onPress: () => selectDestination(destination)
            })),
            { cancelable: true }
        );
    };

    // Afficher le formulaire d'ajout d'activité
    const toggleActivityInput = () => {
        if (!trip.destination) {
            Alert.alert("Erreur", "Veuillez d'abord sélectionner une destination");
            return;
        }
        setShowActivityInput(!showActivityInput);
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

                {/* Nouveau bloc pour les dates */}
                <View style={styles.datePickersContainer}>
                    <TouchableOpacity
                        style={styles.datePicker}
                        onPress={() => setShowStartDatePicker(true)}
                    >
                        <View style={styles.datePickerContent}>
                            <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                            <View style={styles.dateTextContainer}>
                                <ThemedText style={styles.dateLabel}>Date de début</ThemedText>
                                <ThemedText style={styles.dateValue}>
                                    {trip.startDate ? formatDate(trip.startDate) : "Non définie"}
                                </ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.datePicker}
                        onPress={() => setShowEndDatePicker(true)}
                    >
                        <View style={styles.datePickerContent}>
                            <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                            <View style={styles.dateTextContainer}>
                                <ThemedText style={styles.dateLabel}>Date de fin</ThemedText>
                                <ThemedText style={styles.dateValue}>
                                    {trip.endDate ? formatDate(trip.endDate) : "Non définie"}
                                </ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* DatePickers */}
                {showStartDatePicker && (
                    <DateTimePicker
                        value={trip.startDate ? new Date(trip.startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onStartDateChange}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={trip.endDate ? new Date(trip.endDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onEndDateChange}
                    />
                )}

                {/* Sélection de destination */}
                <TouchableOpacity
                    style={styles.destinationSelector}
                    onPress={showDestinationPicker}
                >
                    {trip.destination ? (
                        <View style={styles.selectedDestination}>
                            <View style={styles.destinationImageContainer}>
                                <Image
                                    source={{ uri: trip.destination.image }}
                                    style={styles.destinationImage}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.destinationDetails}>
                                <ThemedText style={styles.destinationName}>
                                    {trip.destination.name}
                                </ThemedText>
                                <View style={styles.locationContainer}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <ThemedText style={styles.locationText}>
                                        {trip.destination.location}
                                    </ThemedText>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.changeButton} onPress={showDestinationPicker}>
                                <ThemedText style={styles.changeButtonText}>Changer</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.destinationPlaceholder}>
                            <Ionicons name="add-circle-outline" size={24} color="#4ca5ff" />
                            <ThemedText style={styles.placeholderText}>Sélectionner une destination</ThemedText>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Liste des activités */}
                <View style={styles.activitiesContainer}>
                    <View style={styles.activitiesHeader}>
                        <ThemedText style={styles.activitiesTitle}>Activités</ThemedText>
                        <View style={styles.activitiesHeaderRight}>
                            <ThemedText style={styles.activitiesCount}>
                                {trip.activities.length} activité{trip.activities.length !== 1 ? 's' : ''} prévue{trip.activities.length !== 1 ? 's' : ''}
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.addActivityButton}
                                onPress={toggleActivityInput}
                                disabled={!trip.destination}
                            >
                                <Ionicons name="add-circle" size={24} color={trip.destination ? "#4ca5ff" : "#bbb"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showActivityInput && (
                        <View style={styles.addActivityInputContainer}>
                            <TextInput
                                style={styles.activityInput}
                                placeholder="Ajouter une activité..."
                                value={newActivityText}
                                onChangeText={setNewActivityText}
                                autoFocus
                            />
                            <TouchableOpacity
                                style={[styles.addButton, newActivityText.trim() === '' ? styles.disabledButton : null]}
                                onPress={addActivity}
                                disabled={newActivityText.trim() === ''}
                            >
                                <Ionicons name="checkmark" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {trip.activities.length > 0 ? (
                        <FlatList
                            data={trip.activities}
                            renderItem={({ item }) => (
                                <View style={styles.activityItem}>
                                    <TouchableOpacity
                                        style={styles.activityCheckbox}
                                        onPress={() => toggleActivityCompletion(item.id)}
                                    >
                                        <Ionicons
                                            name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                                            size={24}
                                            color={item.completed ? "#4ca5ff" : "#ccc"}
                                        />
                                    </TouchableOpacity>
                                    <ThemedText style={[
                                        styles.activityText,
                                        item.completed ? styles.completedActivityText : null
                                    ]}>
                                        {item.text}
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteActivity(item.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            keyExtractor={item => item.id.toString()}
                            style={styles.activitiesList}
                        />
                    ) : (
                        <View style={styles.emptyList}>
                            <ThemedText style={styles.emptyListText}>
                                Aucune activité planifiée
                            </ThemedText>
                        </View>
                    )}
                </View>
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
    datePickersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    datePicker: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7ea',
        padding: 12,
        marginHorizontal: 5,
    },
    datePickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
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
    destinationSelector: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    selectedDestination: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    destinationPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    placeholderText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#4ca5ff',
    },
    destinationImageContainer: {
        marginRight: 15,
    },
    destinationImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    destinationDetails: {
        flex: 1,
    },
    destinationName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
    },
    changeButton: {
        backgroundColor: '#f0f4ff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    changeButtonText: {
        color: '#4ca5ff',
        fontSize: 14,
    },
    activitiesContainer: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    activitiesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    activitiesHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activitiesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    activitiesCount: {
        fontSize: 14,
        color: '#888',
        marginRight: 10,
    },
    addActivityButton: {
        padding: 5,
    },
    activitiesList: {
        flex: 1,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activityCheckbox: {
        marginRight: 10,
    },
    activityText: {
        flex: 1,
        fontSize: 16,
    },
    completedActivityText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    deleteButton: {
        padding: 5,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyListText: {
        color: '#999',
        fontSize: 16,
    },
    addActivityInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    activityInput: {
        flex: 1,
        height: 46,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginRight: 10,
        fontSize: 16,
    },
    addButton: {
        width: 46,
        height: 46,
        backgroundColor: '#4ca5ff',
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#bbb',
    },
});