// DateSelector.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Fonction d'aide pour formater les dates de manière plus lisible
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Non définie";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date invalide";

    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

// Fonction pour calculer la durée du séjour
const calculateDuration = (startDate: string | undefined, endDate: string | undefined): string => {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const durationMs = end.getTime() - start.getTime();
    const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (days === 0) return '(même jour)';
    if (days === 1) return '(1 jour)';
    return `(${days} jours)`;
};

interface DateSelectorProps {
    startDate?: string;
    endDate?: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
                                                       startDate,
                                                       endDate,
                                                       onStartDateChange,
                                                       onEndDateChange
                                                   }) => {
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
    const [tempDate, setTempDate] = useState<Date | null>(null);

    const openDatePicker = (mode: 'start' | 'end') => {
        setDatePickerMode(mode);
        setTempDate(null);
        if (Platform.OS === 'ios') {
            setShowDateModal(true);
        } else {
            if (mode === 'start') {
                setShowStartDatePicker(true);
            } else {
                setShowEndDatePicker(true);
            }
        }
    };

    const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowStartDatePicker(Platform.OS === 'ios' ? true : false);

        if (event.type === 'dismissed') {
            return;
        }

        if (!selectedDate) return;

        const currentDate = selectedDate;

        if (endDate && new Date(currentDate) > new Date(endDate)) {
            Alert.alert("Attention", "La date de début est postérieure à la date de fin. La date de fin sera ajustée.");

            const newEndDate = new Date(currentDate);
            newEndDate.setDate(newEndDate.getDate() + 1);

            onStartDateChange(currentDate.toISOString());
            onEndDateChange(newEndDate.toISOString());
        } else {
            onStartDateChange(currentDate.toISOString());
        }

        if (Platform.OS === 'ios') {
            setShowDateModal(false);
        }
    };

    const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios' ? true : false);

        if (event.type === 'dismissed') {
            return;
        }

        if (!selectedDate) return;

        const currentDate = selectedDate;

        if (startDate && new Date(currentDate) < new Date(startDate)) {
            Alert.alert("Attention", "La date de fin est antérieure à la date de début. La date de début sera ajustée.");

            const newStartDate = new Date(currentDate);
            newStartDate.setDate(newStartDate.getDate() - 1);

            onStartDateChange(newStartDate.toISOString());
            onEndDateChange(currentDate.toISOString());
        } else {
            onEndDateChange(currentDate.toISOString());
        }

        if (Platform.OS === 'ios') {
            setShowDateModal(false);
        }
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (datePickerMode === 'start') {
            handleStartDateChange(event, selectedDate);
        } else {
            handleEndDateChange(event, selectedDate);
        }
    };

    const renderDateModal = () => {
        if (!showDateModal) return null;

        const initialDate = datePickerMode === 'start'
            ? (startDate ? new Date(startDate) : new Date())
            : (endDate ? new Date(endDate) : new Date());

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
        <View style={styles.dateSection}>
            <View style={styles.dateSectionHeader}>
                <Ionicons name="calendar" size={18} color="#4ca5ff" />
                <ThemedText style={styles.dateSectionTitle}>Dates du voyage</ThemedText>
            </View>

            <View style={styles.datePickersContainer}>
                <TouchableOpacity
                    style={styles.datePicker}
                    onPress={() => openDatePicker('start')}
                >
                    <View style={styles.datePickerContent}>
                        <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                        <View style={styles.dateTextContainer}>
                            <ThemedText style={styles.dateLabel}>Départ</ThemedText>
                            <ThemedText style={styles.dateValue}>
                                {formatDate(startDate)}
                            </ThemedText>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.datePicker}
                    onPress={() => openDatePicker('end')}
                >
                    <View style={styles.datePickerContent}>
                        <Ionicons name="calendar-outline" size={20} color="#4ca5ff" />
                        <View style={styles.dateTextContainer}>
                            <ThemedText style={styles.dateLabel}>Retour</ThemedText>
                            <ThemedText style={styles.dateValue}>
                                {formatDate(endDate)}
                            </ThemedText>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Afficher la durée du voyage si les deux dates sont définies */}
            {startDate && endDate && (
                <View style={styles.durationContainer}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <ThemedText style={styles.durationText}>
                        Durée: {calculateDuration(startDate, endDate)}
                    </ThemedText>
                </View>
            )}

            {/* DatePickers pour Android */}
            {showStartDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={startDate ? new Date(startDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleStartDateChange}
                />
            )}

            {showEndDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={endDate ? new Date(endDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleEndDateChange}
                />
            )}

            {/* Modal pour iOS */}
            {Platform.OS === 'ios' && renderDateModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    dateSection: {
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7ea',
        padding: 15,
        marginBottom: 15,
    },
    dateSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    datePickersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    datePicker: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 8,
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
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7ea',
        marginTop: 8,
    },
    durationText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
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
    },
});

export default DateSelector;