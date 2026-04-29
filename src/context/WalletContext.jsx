import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const { user, updateUser } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch wallet balance from backend
    const fetchBalance = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await authFetch(`${API_BASE_URL}/api/wallet/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const newBalance = data.balance || 0;
                setBalance(newBalance);

                // Optional: Sync user object in AuthContext if needed
                if (user.balance !== newBalance) {
                    updateUser({ ...user, balance: newBalance });
                }
            }
        } catch (error) {
            console.error('Error fetching balance from API:', error);
            // Fallback to local storage if API fails
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const currentUser = localUsers.find(u => u.email === user.email);
            if (currentUser) setBalance(currentUser.balance || 0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch transaction history from backend
    const fetchTransactions = async () => {
        if (!user) return;

        try {
            const response = await authFetch(`${API_BASE_URL}/api/wallet/transactions?email=${user.email}`);
            const data = await response.json();

            if (data.success) {
                let userTransactions = data.transactions || [];

                // Restriction pour les managers : 30 derniers jours
                if (user?.role === 'manager') {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    userTransactions = userTransactions.filter(tx => new Date(tx.date) >= thirtyDaysAgo);
                }

                setTransactions(userTransactions);
            }
        } catch (error) {
            console.error('Error fetching transactions from API:', error);
            // Fallback
            const allTransactions = JSON.parse(localStorage.getItem('wallet_transactions') || '[]');
            const userTransactions = allTransactions.filter(tx => tx.userEmail === user.email)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(userTransactions);
        }
    };

    // Pay with wallet
    const payWithWallet = async (amount, orderId) => {
        if (!user) {
            return { success: false, message: 'Veuillez vous connecter' };
        }

        try {
            setLoading(true);
            const response = await authFetch(`${API_BASE_URL}/api/wallet/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    amount: amount,
                    orderId: orderId
                }),
            });

            const data = await response.json();

            if (data.success) {
                setBalance(data.newBalance);
                updateUser({ ...user, balance: data.newBalance });
                fetchTransactions();
                return { success: true, newBalance: data.newBalance };
            } else {
                return { success: false, message: data.message || 'Erreur lors du paiement' };
            }
        } catch (error) {
            console.error('Error paying with wallet:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        } finally {
            setLoading(false);
        }
    };

    // Check if user has sufficient balance
    const hasSufficientBalance = (amount) => {
        return balance >= amount;
    };

    // Load balance on user change
    useEffect(() => {
        if (user) {
            fetchBalance();
            fetchTransactions();
        } else {
            setBalance(0);
            setTransactions([]);
        }
    }, [user]);

    // Periodically sync balance (useful if admin updates it in another "tab" or if session needs update)
    useEffect(() => {
        const interval = setInterval(() => {
            if (user) fetchBalance();
        }, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    const value = {
        balance,
        transactions,
        loading,
        fetchBalance,
        fetchTransactions,
        payWithWallet,
        hasSufficientBalance
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};


// Auto-Injected fetch wrapper for JWT
const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token && url.includes('/api/')) {
        options.headers = {
            ...options.headers,
            'Authorization': 'Bearer ' + token,
        };
    }
    return fetch(url, options);
};
