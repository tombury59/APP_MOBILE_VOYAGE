// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { AuthProvider, useAuth } from '@/context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <TabLayout />
        </AuthProvider>
    );
}

function TabLayout() {
    const colorScheme = useColorScheme();
    const { isAuthenticated } = useAuth(); // accès au contexte

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />

            <Tabs.Screen
                name="trips"
                options={{
                    title: 'Mes Trips',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="airplane" color={color} />,
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Prévoir un trip',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
                }}
            />



            <Tabs.Screen
                name="profil"
                options={{
                    title: 'Mon Compte',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                    href: isAuthenticated ? undefined : null, // null cache l'onglet
                }}
            />

            <Tabs.Screen
                name="login"
                options={{
                    title: 'Connexion',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.badge.plus" color={color} />,
                    href: isAuthenticated ? null : undefined, // null cache l'onglet
                }}
            />
        </Tabs>
    );
}