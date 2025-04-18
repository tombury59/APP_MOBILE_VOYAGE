// components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import {Alert} from "react-native";

type Props = {
    children: React.ReactNode;
};

const ProtectedRoute = ({ children }: Props) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect href="/login" />;

    }

    return <>{children}</>;
};

export default ProtectedRoute;
