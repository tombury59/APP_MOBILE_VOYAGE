import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
    return (
        <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#a0a0a0" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Rechercher des destinations"
                placeholderTextColor="#a0a0a0"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <Ionicons
                    name="close-circle"
                    size={20}
                    color="#a0a0a0"
                    style={styles.clearIcon}
                    onPress={() => setSearchQuery('')}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 25,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearIcon: {
        padding: 5,
    }
});

export default SearchBar;