import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import TripDetailScreen from '../components/TripDetailScreen';

export default function TripDetailPage() {
    return (
            <AuthProvider>
                <TripDetailScreen />
            </AuthProvider>
    );
}