import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => {
    return (
        <View style={styles.header}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>Where to next?</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a2a3a',
    },
});

export default Header;