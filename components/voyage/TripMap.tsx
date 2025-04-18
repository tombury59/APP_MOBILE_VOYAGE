// TripMap.tsx
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

type Step = {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    order: number;
};

interface TripMapProps {
    initialSteps: Step[];
    onStepsChange: (steps: Step[]) => void;
    readonly: boolean;
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
}

const TripMap: React.FC<TripMapProps> = ({ initialSteps = [], onStepsChange, readonly = false }) => {
    const [steps, setSteps] = useState<Step[]>(initialSteps);
    const [selectedStep, setSelectedStep] = useState<Step | null>(null);

    const addStep = (coordinate: { latitude: number; longitude: number }) => {
        if (readonly) return;

        const newStep = {
            id: Date.now(),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            title: `Étape ${steps.length + 1}`,
            order: steps.length + 1,
            description: ''
        };

        const updatedSteps = [...steps, newStep];
        setSteps(updatedSteps);
        setSelectedStep(newStep);
        if (onStepsChange) onStepsChange(updatedSteps);
    };

    const updateStepTitle = (stepId: number, newTitle: string) => {
        if (readonly) return;

        const updatedSteps = steps.map(step =>
            step.id === stepId ? { ...step, title: newTitle } : step
        );
        setSteps(updatedSteps);
        if (onStepsChange) onStepsChange(updatedSteps);
    };

    const deleteStep = (stepId: number) => {
        if (readonly) return;

        const filteredSteps = steps.filter(step => step.id !== stepId);
        // Réorganiser les ordres
        const reorderedSteps = filteredSteps.map((step, index) => ({
            ...step,
            order: index + 1,
            title: step.title === `Étape ${step.order}` ? `Étape ${index + 1}` : step.title
        }));

        setSteps(reorderedSteps);
        setSelectedStep(null);
        if (onStepsChange) onStepsChange(reorderedSteps);
    };

    const reorderSteps = (stepId: number, newOrder: number) => {
        if (readonly) return;

        const step = steps.find(s => s.id === stepId);
        if (!step) return;

        const oldOrder = step.order;
        const updatedSteps = steps
            .map(s => {
                if (s.id === stepId) {
                    return { ...s, order: newOrder };
                }
                if (newOrder > oldOrder) {
                    return s.order <= newOrder && s.order > oldOrder
                        ? { ...s, order: s.order - 1 }
                        : s;
                }
                return s.order >= newOrder && s.order < oldOrder
                    ? { ...s, order: s.order + 1 }
                    : s;
            })
            .sort((a, b) => a.order - b.order);

        setSteps(updatedSteps);
        if (onStepsChange) onStepsChange(updatedSteps);
    };

    return (
        <View style={styles.mapContainer}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 48.8566,
                    longitude: 2.3522,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                }}
                onPress={(e) => !readonly && addStep(e.nativeEvent.coordinate)}
            >
                {steps.map((step) => (
                    <Marker
                        key={step.id}
                        coordinate={{ latitude: step.latitude, longitude: step.longitude }}
                        title={step.title}
                        onPress={() => !readonly && setSelectedStep(step)}
                    >
                        <View style={{ padding: 5, backgroundColor: '#4ca5ff', borderRadius: 15 }}>
                            <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>
                                {step.order}
                            </ThemedText>
                        </View>
                    </Marker>
                ))}
                {steps.length >= 2 && (
                    <Polyline
                        coordinates={steps.sort((a, b) => a.order - b.order)
                            .map(step => ({
                                latitude: step.latitude,
                                longitude: step.longitude,
                            }))}
                        strokeWidth={3}
                        strokeColor="#4ca5ff"
                    />
                )}
            </MapView>

            {/* Modal d'édition des étapes */}
            {!readonly && selectedStep && (
                <View style={styles.stepModal}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
                            Modifier l'étape
                        </ThemedText>
                        <TouchableOpacity onPress={() => setSelectedStep(null)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.stepInput}
                        value={selectedStep.title}
                        onChangeText={(text) => updateStepTitle(selectedStep.id, text)}
                        placeholder="Nom de l'étape"
                    />

                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: '#ff6b6b' }]}
                        onPress={() => deleteStep(selectedStep.id)}
                    >
                        <ThemedText style={styles.buttonText}>
                            Supprimer l'étape
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Liste des étapes */}
            <FlatList
                data={steps.sort((a, b) => a.order - b.order)}
                style={styles.stepList}
                renderItem={({ item }) => (
                    <View style={styles.stepItem}>
                        <ThemedText>{item.order}.</ThemedText>
                        <ThemedText style={styles.stepTitle}>{item.title}</ThemedText>
                        {!readonly && (
                            <View style={styles.stepActions}>
                                {item.order > 1 && (
                                    <TouchableOpacity onPress={() => reorderSteps(item.id, item.order - 1)}>
                                        <Ionicons name="arrow-up" size={24} color="#4ca5ff" />
                                    </TouchableOpacity>
                                )}
                                {item.order < steps.length && (
                                    <TouchableOpacity onPress={() => reorderSteps(item.id, item.order + 1)}>
                                        <Ionicons name="arrow-down" size={24} color="#4ca5ff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}
                keyExtractor={item => item.id.toString()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: 300,
    },
    stepModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    stepInput: {
        fontSize: 18,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7ea',
        marginVertical: 10,
    },
    deleteButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    stepList: {
        maxHeight: 200,
        marginTop: 10,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f5f7fa',
        marginVertical: 5,
        borderRadius: 8,
    },
    stepTitle: {
        flex: 1,
        marginLeft: 10,
    },
    stepActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default TripMap;