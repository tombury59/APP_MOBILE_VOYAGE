// database.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces des modèles
export interface Destination {
    id: number;
    location: string;
    name: string;
    rating: number;
    image: string;
}

export interface User {
    id: number;
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    createdAt: string;
    lastLogin?: string;
}

export interface Activity {
    id: number;
    text: string;
    completed: boolean;
}

export interface Trip {
    id: number;
    userId: number;
    destinationId: number;
    name: string;
    startDate?: string;
    endDate?: string;
    activities: Activity[];
    createdAt: string;
    updatedAt: string;
}

// Gestionnaire des destinations
class DatabaseManager {
    private static instance: DatabaseManager;
    private databaseInitialized: boolean = false;
    private STORAGE_KEY = 'destinations_data';
    private lastId: number = 0;

    private constructor() {}

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    async initDatabase() {
        if (this.databaseInitialized) return;

        try {
            console.log('Début de l\'initialisation du stockage');
            // Vérifier si des données existent déjà
            const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);

            if (existingData) {
                const destinations = JSON.parse(existingData);
                // Trouver le dernier ID utilisé
                if (destinations.length > 0) {
                    this.lastId = Math.max(...destinations.map((dest: Destination) => dest.id));
                }
            }

            this.databaseInitialized = true;
            console.log('Stockage initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du stockage:', error);
        }
    }

    async addDestination(location: string, name: string, rating: number, image: string) {
        try {
            // Récupérer les destinations existantes
            const destinations = await this.getDestinations();

            // Créer une nouvelle destination
            const newDestination: Destination = {
                id: ++this.lastId,
                location,
                name,
                rating,
                image
            };

            // Ajouter à la liste
            destinations.push(newDestination);

            // Sauvegarder la liste mise à jour
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(destinations));
            console.log('Destination ajoutée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la destination:', error);
        }
    }


    async getDestinations(): Promise<Destination[]> {
        try {
            const data = await AsyncStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des destinations:', error);
            return [];
        }
    }

    async getDestinationById(id: number): Promise<Destination | null> {
        try {
            const destinations = await this.getDestinations();
            return destinations.find(dest => dest.id === id) || null;
        } catch (error) {
            console.error('Erreur lors de la récupération de la destination:', error);
            return null;
        }
    }

    async insertInitialData() {
        try {
            const destinations = await this.getDestinations();
            if (destinations.length === 0) {
                // Ajouter des destinations initiales seulement si aucune n'existe
                await this.addDestination(
                    'Angleterre',
                    'Londres',
                    4.8,
                    'https://picsum.photos/id/1011/800/600'
                );
                await this.addDestination(
                    'Egypte',
                    'Pyramides',
                    4.8,
                    'https://picsum.photos/id/1023/800/600'
                );
                await this.addDestination(
                    'Montagnes',
                    'Kirghizistan',
                    4.8,
                    'https://picsum.photos/id/1036/800/600'
                );
                console.log('Données initiales insérées avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de l\'insertion des données initiales:', error);
        }
    }

    async clearAllData() {
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            console.log('Toutes les données ont été supprimées');
            this.lastId = 0;
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
        }
    }

    async isDatabaseInitialized(): Promise<boolean> {
        return this.databaseInitialized;
    }
}

// Gestionnaire des utilisateurs
class UserManager {
    private static instance: UserManager;
    private initialized: boolean = false;
    private STORAGE_KEY = 'users_data';
    private lastId: number = 0;

    private constructor() {}

    static getInstance(): UserManager {
        if (!UserManager.instance) {
            UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }

    async initializeUserDB() {
        if (this.initialized) return;

        try {
            console.log('Initialisation de la base de données utilisateurs');
            const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);

            if (existingData) {
                const users = JSON.parse(existingData);
                if (users.length > 0) {
                    this.lastId = Math.max(...users.map((user: User) => user.id));
                }
            }

            this.initialized = true;
            console.log('Base de données utilisateurs initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la base utilisateurs:', error);
        }
    }

    async getUsers(): Promise<User[]> {
        try {
            const data = await AsyncStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            return [];
        }
    }

    async getUserByUsername(username: string): Promise<User | null> {
        try {
            const users = await this.getUsers();
            const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
            return user || null;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateur:', error);
            return null;
        }
    }

    async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
        try {
            const users = await this.getUsers();

            // Vérifier si l'utilisateur existe déjà
            const existingUser = users.find(u => u.username.toLowerCase() === user.username.toLowerCase());
            if (existingUser) {
                console.error('Un utilisateur avec ce nom existe déjà');
                return null;
            }

            const newUser: User = {
                ...user,
                id: ++this.lastId,
                createdAt: new Date().toISOString(),
            };

            users.push(newUser);
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            console.log(`Utilisateur ${newUser.username} ajouté avec succès`);
            return newUser;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
            return null;
        }
    }

    async updateUserLastLogin(userId: number): Promise<boolean> {
        try {
            const users = await this.getUsers();
            const userIndex = users.findIndex(user => user.id === userId);

            if (userIndex === -1) {
                return false;
            }

            users[userIndex].lastLogin = new Date().toISOString();
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
            return false;
        }
    }

    async validateCredentials(username: string, password: string): Promise<User | null> {
        try {
            const user = await this.getUserByUsername(username);
            if (!user) {
                return null;
            }

            if (user.password === password) {
                await this.updateUserLastLogin(user.id);
                return user;
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la validation des identifiants:', error);
            return null;
        }
    }

    async insertDefaultUsers() {
        try {
            const users = await this.getUsers();
            if (users.length === 0) {
                // Ajouter l'utilisateur "tom" avec le mot de passe "1234"
                await this.addUser({
                    username: 'tom',
                    password: '1234',
                    email: 'tom@example.com',
                    firstName: 'Tom',
                    lastName: 'User',
                    profilePicture: 'https://picsum.photos/id/1005/200/200'
                });
                console.log('Utilisateur par défaut ajouté');
            }
        } catch (error) {
            console.error('Erreur lors de l\'insertion des utilisateurs par défaut:', error);
        }
    }

    async clearAllUsers() {
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            console.log('Tous les utilisateurs ont été supprimés');
            this.lastId = 0;
        } catch (error) {
            console.error('Erreur lors de la suppression des utilisateurs:', error);
        }
    }
}

// Gestionnaire des voyages
class TripManager {
    private static instance: TripManager;
    private initialized: boolean = false;
    private STORAGE_KEY = 'trips_data';
    private lastId: number = 0;

    private constructor() {}

    static getInstance(): TripManager {
        if (!TripManager.instance) {
            TripManager.instance = new TripManager();
        }
        return TripManager.instance;
    }

    async initializeTripDB() {
        if (this.initialized) return;

        try {
            console.log('Initialisation de la base de données des voyages');
            const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);

            if (existingData) {
                const trips = JSON.parse(existingData);
                if (trips.length > 0) {
                    this.lastId = Math.max(...trips.map((trip: Trip) => trip.id));
                }
            }

            this.initialized = true;
            console.log('Base de données des voyages initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la base des voyages:', error);
        }
    }

    async addStepToTrip(tripId: number, title: string, description: string, latitude: number, longitude: number, order: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.transaction(tx => {
                tx.executeSql(
                    'INSERT INTO steps (trip_id, title, description, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?, ?)',
                    [tripId, title, description, latitude, longitude, order],
                    (_, result) => {
                        resolve(result.insertId);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

// Récupérer toutes les étapes d'un voyage
    async getStepsForTrip(tripId: number): Promise<Step[]> {
        return new Promise((resolve, reject) => {
            this.db.transaction(tx => {
                tx.executeSql(
                    'SELECT * FROM steps WHERE trip_id = ? ORDER BY order_index ASC',
                    [tripId],
                    (_, result) => {
                        const steps: Step[] = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            const item = result.rows.item(i);
                            steps.push({
                                id: item.id,
                                tripId: item.trip_id,
                                title: item.title,
                                description: item.description,
                                latitude: item.latitude,
                                longitude: item.longitude,
                                order: item.order_index
                            });
                        }
                        resolve(steps);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

// Supprimer toutes les étapes d'un voyage
    async deleteAllStepsForTrip(tripId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.transaction(tx => {
                tx.executeSql(
                    'DELETE FROM steps WHERE trip_id = ?',
                    [tripId],
                    (_, result) => {
                        resolve(true);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    async getTrips(): Promise<Trip[]> {
        try {
            const data = await AsyncStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des voyages:', error);
            return [];
        }
    }

    async getTripsByUserId(userId: number): Promise<Trip[]> {
        try {
            const trips = await this.getTrips();
            return trips.filter(trip => trip.userId === userId);
        } catch (error) {
            console.error('Erreur lors de la récupération des voyages de l\'utilisateur:', error);
            return [];
        }
    }

    async getTripById(id: number): Promise<Trip | null> {
        try {
            const trips = await this.getTrips();
            return trips.find(trip => trip.id === id) || null;
        } catch (error) {
            console.error('Erreur lors de la récupération du voyage:', error);
            return null;
        }
    }

    async createTrip(
        userId: number,
        destinationId: number,
        name: string,
        startDate?: string,
        endDate?: string
    ): Promise<Trip | null> {
        try {
            const trips = await this.getTrips();
            const now = new Date().toISOString();

            const newTrip: Trip = {
                id: ++this.lastId,
                userId,
                destinationId,
                name,
                activities: [],
                startDate,
                endDate,
                createdAt: now,
                updatedAt: now
            };

            trips.push(newTrip);
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(trips));
            console.log('Voyage ajouté avec succès');
            return newTrip;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du voyage:', error);
            return null;
        }
    }

    async updateTrip(updatedTrip: Trip): Promise<boolean> {
        try {
            const trips = await this.getTrips();
            const tripIndex = trips.findIndex(trip => trip.id === updatedTrip.id);

            if (tripIndex === -1) {
                console.error('Voyage non trouvé');
                return false;
            }

            updatedTrip.updatedAt = new Date().toISOString();
            trips[tripIndex] = updatedTrip;
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(trips));
            console.log('Voyage mis à jour avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du voyage:', error);
            return false;
        }
    }

    async addActivityToTrip(tripId: number, activityText: string): Promise<boolean> {
        try {
            const trip = await this.getTripById(tripId);
            if (!trip) {
                console.error('Voyage non trouvé');
                return false;
            }

            const newActivity: Activity = {
                id: Date.now(),
                text: activityText,
                completed: false
            };

            trip.activities.push(newActivity);
            trip.updatedAt = new Date().toISOString();

            return await this.updateTrip(trip);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'activité:', error);
            return false;
        }
    }

    async updateActivityStatus(tripId: number, activityId: number, completed: boolean): Promise<boolean> {
        try {
            const trip = await this.getTripById(tripId);
            if (!trip) {
                console.error('Voyage non trouvé');
                return false;
            }

            const activityIndex = trip.activities.findIndex(activity => activity.id === activityId);
            if (activityIndex === -1) {
                console.error('Activité non trouvée');
                return false;
            }

            trip.activities[activityIndex].completed = completed;
            trip.updatedAt = new Date().toISOString();

            return await this.updateTrip(trip);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de l\'activité:', error);
            return false;
        }
    }

    async removeActivityFromTrip(tripId: number, activityId: number): Promise<boolean> {
        try {
            const trip = await this.getTripById(tripId);
            if (!trip) {
                console.error('Voyage non trouvé');
                return false;
            }

            trip.activities = trip.activities.filter(activity => activity.id !== activityId);
            trip.updatedAt = new Date().toISOString();

            return await this.updateTrip(trip);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'activité:', error);
            return false;
        }
    }

    async deleteTrip(tripId: number): Promise<boolean> {
        try {
            const trips = await this.getTrips();
            const filteredTrips = trips.filter(trip => trip.id !== tripId);

            if (trips.length === filteredTrips.length) {
                console.error('Voyage non trouvé');
                return false;
            }

            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTrips));
            console.log('Voyage supprimé avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du voyage:', error);
            return false;
        }
    }

    async clearAllTrips() {
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            console.log('Tous les voyages ont été supprimés');
            this.lastId = 0;
        } catch (error) {
            console.error('Erreur lors de la suppression des voyages:', error);
        }
    }
}

// Exports
export const db = DatabaseManager.getInstance();
export const userDb = UserManager.getInstance();
export const tripDb = TripManager.getInstance();