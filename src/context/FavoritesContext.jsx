import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
    const { user } = useAuth();

    // Load favorites from localStorage based on user
    const [favorites, setFavorites] = useState(() => {
        if (!user) return [];
        const saved = localStorage.getItem(`favorites_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Save favorites to localStorage when they change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`favorites_${user.email}`, JSON.stringify(favorites));
        }
    }, [favorites, user]);

    // Update favorites when user changes
    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`favorites_${user.email}`);
            setFavorites(saved ? JSON.parse(saved) : []);
        } else {
            setFavorites([]);
        }
    }, [user]);

    const addToFavorites = (productId) => {
        const idStr = productId?.toString();
        if (!favorites.some(id => id?.toString() === idStr)) {
            setFavorites([...favorites, idStr]);
        }
    };

    const removeFromFavorites = (productId) => {
        const idStr = productId?.toString();
        setFavorites(favorites.filter(id => id?.toString() !== idStr));
    };

    const toggleFavorite = (productId) => {
        const idStr = productId?.toString();
        if (favorites.some(id => id?.toString() === idStr)) {
            removeFromFavorites(idStr);
        } else {
            addToFavorites(idStr);
        }
    };

    const isFavorite = (productId) => {
        const idStr = productId?.toString();
        return favorites.some(id => id?.toString() === idStr);
    };

    const clearFavorites = () => {
        setFavorites([]);
    };

    return (
        <FavoritesContext.Provider value={{
            favorites,
            addToFavorites,
            removeFromFavorites,
            toggleFavorite,
            isFavorite,
            clearFavorites,
            favoritesCount: favorites.length
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within FavoritesProvider');
    }
    return context;
};
