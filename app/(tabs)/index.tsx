import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Header from '@/components/accueil/Header';
import SearchBar from '@/components/accueil/SearchBar';
import FeaturedDestinations from '@/components/accueil/FeaturedDestinations';

const HomeScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <FeaturedDestinations searchQuery={searchQuery} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 40,
    },
});

export default HomeScreen;