// DestinationSelector.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Destination } from '@/database';

interface DestinationSelectorProps {
    destination: Destination | null;
    availableDestinations: Destination[];
    onDestinationSelected: (destination: Destination) => void;
}

const DestinationSelector: React.FC<DestinationSelectorProps> = ({
                                                                     destination,
                                                                     availableDestinations,
                                                                     onDestinationSelected
                                                                 }) => {
    // Afficher le sélecteur de destination
    const showDestinationPicker = () => {
        if (availableDestinations.length === 0) {
            Alert.alert("Erreur", "Aucune destination disponible");
            return;
        }

        Alert.alert(
            "Sélectionner une destination",
            "Choisissez votre destination",
            availableDestinations.map(destination => ({
                text: destination.name,
                onPress: () => onDestinationSelected(destination)
            })),
            { cancelable: true }
        );
    };

    return (
        <TouchableOpacity
            style={styles.destinationSelector}
            onPress={showDestinationPicker}
        >
            {destination ? (
                <View style={styles.selectedDestination}>
                    <View style={styles.destinationImageContainer}>
                        <Image
                            source={{ uri: destination.image }}
                            style={styles.destinationImage}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={styles.destinationDetails}>
                        <ThemedText style={styles.destinationName}>
                            {destination.name}
                        </ThemedText>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <ThemedText style={styles.locationText}>
                                {destination.location}
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
    );
};

const styles = StyleSheet.create({
    destinationSelector: {
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7ea',
        padding: 15,
        marginBottom: 15,
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
    }
});

export default DestinationSelector;