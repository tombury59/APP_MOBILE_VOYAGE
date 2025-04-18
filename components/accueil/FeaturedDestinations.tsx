import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../database';

// Interface pour les propriétés du composant
interface FeaturedDestinationsProps {
    searchQuery: string;
}

// Interface Destination
interface Destination {
    id: number;
    location: string;
    name: string;
    rating: number;
    image: string;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.85;
const ITEM_SPACING = 15;

const FeaturedDestinations: React.FC<FeaturedDestinationsProps> = ({ searchQuery }) => {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDestinations = async () => {
            try {
                setLoading(true);
                // Initialiser la base de données
                await db.initDatabase();

                // Insérer les données initiales si nécessaire
                await db.insertInitialData();

                // Récupérer les destinations
                const data = await db.getDestinations();
                console.log(`${data.length} destinations récupérées`);
                setDestinations(data);
                setFilteredDestinations(data);
            } catch (err) {
                console.error('Erreur lors du chargement des destinations:', err);
                setError('Impossible de charger les destinations');
            } finally {
                setLoading(false);
            }
        };

        loadDestinations();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredDestinations(destinations);
            console.log("Recherche vide, affichage de toutes les destinations:", destinations.length);
        } else {
            const query = searchQuery.toLowerCase();
            console.log("Recherche en cours pour:", query);

            const filtered = destinations.filter(
                item => {
                    const nameMatch = item.name.toLowerCase().includes(query);
                    const locationMatch = item.location.toLowerCase().includes(query);
                    console.log(`Vérification de ${item.name} (${nameMatch}) et ${item.location} (${locationMatch})`);
                    return nameMatch || locationMatch;
                }
            );

            console.log("Destinations filtrées:", filtered.length);
            setFilteredDestinations(filtered);
        }
    }, [searchQuery, destinations]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ca5ff" />
                <Text style={styles.loadingText}>Chargement des destinations...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (filteredDestinations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucune destination trouvée'}
                </Text>
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.sectionTitle}>
                {searchQuery ? 'Résultats de recherche' : 'Destinations Populaires'}
            </Text>
            <FlatList
                horizontal
                data={filteredDestinations}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                        <Image
                            source={{ uri: item.image }}
                            style={styles.destinationImage}
                            resizeMode="cover"
                            onError={(e) => console.log(`Erreur de chargement de l'image pour ${item.name}`)}
                        />
                        <View style={styles.overlay} />
                        <View style={styles.imageOverlayContainer}>
                            <Text style={styles.placeName}>{item.name}</Text>
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={18} color="#4ca5ff" />
                                <Text style={styles.destinationName}>{item.location}</Text>
                            </View>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.rating}>{item.rating}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={ITEM_WIDTH + ITEM_SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.flatListContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 20,
        marginBottom: 15,
        color: '#333',
    },
    card: {
        width: ITEM_WIDTH,
        height: 260,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginRight: ITEM_SPACING,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    destinationImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.3)', // Dégradé foncé pour améliorer la lisibilité du texte
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    imageOverlayContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    destinationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 6,
    },
    placeName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
        marginLeft: 4,
    },
    flatListContent: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default FeaturedDestinations;