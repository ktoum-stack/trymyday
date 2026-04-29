import { createContext, useState, useContext, useEffect } from 'react';
import API_BASE_URL from '../config';

const DataContext = createContext(null);

export const CATEGORIES = {
    'Femme': {
        icon: 'bi-person',
        groups: {
            'Vêtements': ['Robes', 'Chemisiers', 'Jeans', 'Jupes', 'T-shirts', 'Vestes'],
            'Chaussures': ['Baskets', 'Bottines', 'Talons', 'Sandales'],
            'Sacs': ['Sacs à main', 'Sacs bandoulière', 'Pochettes', 'Cabas'],
            'Accessoires': ['Bijoux', 'Montres', 'Lunettes']
        }
    },
    'Homme': {
        icon: 'bi-person',
        groups: {
            'Vêtements': ['Chemises', 'Pantalons', 'Pulls', 'T-shirts', 'Costumes', 'Polos'],
            'Chaussures': ['Baskets', 'Mocassins', 'Bottes'],
            'Sacs': ['Sacs à dos', 'Sacs de sport', 'Sacoches'],
            'Accessoires': ['Montres', 'Ceintures', 'Cravates']
        }
    },
    'Enfant': {
        icon: 'bi-emoji-smile',
        groups: {
            'Bébé': ['Bodys', 'Ensembles'],
            'Garçon': ['T-shirts', 'Pantalons', 'Vestes'],
            'Fille': ['Robes', 'Jupes', 'Pantalons'],
            'Sacs': ['Cartables', 'Sacs à dos', 'Trousses'],
            'Jouets': ['Éveil', 'Jeux de société', 'Poupées']
        }
    },
    'Maison & Meuble': {
        icon: 'bi-house',
        groups: {
            'Décoration': ['Lampes', 'Vases', 'Coussins', 'Tableaux'],
            'Mobilier': ['Chaises', 'Tables', 'Canapés'],
            'Linge de maison': ['Draps', 'Serviettes', 'Région']
        }
    },
    'Cosmétique': {
        icon: 'bi-magic',
        groups: {
            'Maquillage': ['Teint', 'Yeux', 'Lèvres'],
            'Soins': ['Visage', 'Corps', 'Cheveux'],
            'Parfums': ['Homme', 'Femme', 'Coffrets']
        }
    },
    'Chaussures': {
        icon: 'bi-handbag',
        groups: {
            'Sports': ['Baskets', 'Running', 'Football'],
            'Ville': ['Mocassins', 'Bottes', 'Chaussures de ville'],
            'Soirée': ['Talons', 'Escarpins', 'Sandales chic']
        }
    },
    'Sacs': {
        icon: 'bi-bag',
        groups: {
            'Modèles': ['Sacs à main', 'Sacs à dos', 'Pochettes', 'Cabas'],
            'Usage': ['Voyage', 'Sport', 'Bureau', 'Soirée'],
            'Matières': ['Cuir', 'Simili', 'Tissu']
        }
    },
    'Électronique': {
        icon: 'bi-display',
        groups: {
            'Mobile': ['Smartphones', 'Accessoires'],
            'Audio': ['Casques', 'Enceintes'],
            'Informatique': ['PC Portables', 'Périphériques'],
        }
    }
};

const initialReviews = [
    { id: 101, productId: 1, userId: 10, userName: 'Alice', rating: 5, comment: 'Excellent casque, le son est pur !', date: '2024-06-15' },
    { id: 102, productId: 1, userId: 11, userName: 'Bob', rating: 4, comment: 'Très confortable, un peu cher mais vaut le coup.', date: '2024-06-18' },
    { id: 103, productId: 2, userId: 12, userName: 'Charlie', rating: 5, comment: 'Superbe montre, très fluide.', date: '2024-06-20' },
];

// Keep users/expenses/questions for now as they are less critical or handled differently effectively
const initialUsers = [
    { id: 1, name: 'Jean Dupont', email: 'jean@test.com', role: 'client', joined: '2025-01-15' },
    { id: 2, name: 'Admin User', email: 'Trymyday235@gmail.com', role: 'admin', joined: '2025-01-01' },
    { id: 3, name: 'Test Manager', email: 'manager@test.com', role: 'manager', joined: '2025-02-01' },
];

const initialExpenses = [
    { id: 1, description: 'Stock initial', amount: 325000, category: 'Stock', date: '2025-12-01' },
    { id: 2, description: 'Publicité Facebook', amount: 32500, category: 'Marketing', date: '2025-12-15' },
];

const initialHelpQuestions = [
    { id: 1, question: "Comment puis-je modifier mon adresse de livraison ?", answer: "Vous pouvez le faire dans votre profil, section 'Mes adresses'.", status: 'approved', date: '2025-12-20', userName: 'Alice' },
    { id: 2, question: "Acceptez-vous le paiement en cryptomonnaie ?", answer: "Pas encore, mais nous y travaillons !", status: 'approved', date: '2025-12-22', userName: 'Bob' },
];

export const DataProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState(() => {
        const savedUsers = localStorage.getItem('users');
        const userList = savedUsers ? JSON.parse(savedUsers) : initialUsers;
        const today = new Date().toISOString().split('T')[0];
        return userList.map(u => ({
            ...u,
            joined: (u.joined && u.joined !== '2025-01-01') ? u.joined : today
        }));
    });

    const [expenses, setExpenses] = useState(() => {
        const savedExpenses = localStorage.getItem('expenses');
        return savedExpenses ? JSON.parse(savedExpenses) : initialExpenses;
    });
    const [reviews, setReviews] = useState(initialReviews);
    const [helpQuestions, setHelpQuestions] = useState(() => {
        const saved = localStorage.getItem('helpQuestions');
        return saved ? JSON.parse(saved) : initialHelpQuestions;
    });

    // Fetch Products and Orders from Backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const prodRes = await authFetch(`${API_BASE_URL}/api/products`);
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProducts(prodData);
                }

                // Fetch Orders
                const orderRes = await authFetch(`${API_BASE_URL}/api/orders`);
                if (orderRes.ok) {
                    const orderData = await orderRes.json();
                    setOrders(orderData);
                }

                // Fetch Users (for Admin view)
                const userRes = await authFetch(`${API_BASE_URL}/api/admin/wallet/users`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.success) {
                        setUsers(userData.users);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Persist users to localStorage (Legacy)
    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
    }, [users]);

    // Persist expenses to localStorage (Legacy)
    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    // Persist help questions to localStorage (Legacy)
    useEffect(() => {
        localStorage.setItem('helpQuestions', JSON.stringify(helpQuestions));
    }, [helpQuestions]);


    const addProduct = async (product) => {
        try {
            const tempId = Math.floor(10000000 + Math.random() * 90000000).toString();
            const newProduct = { ...product, id: tempId, images: product.images || [product.image] };

            // Optimistic update
            setProducts(prev => [...prev, newProduct]);

            const response = await authFetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });

            if (!response.ok) {
                // Revert on failure
                setProducts(prev => prev.filter(p => p.id !== tempId));
                console.error("Failed to save product to backend");
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error adding product:", error);
            return false;
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            const idStr = id.toString();
            setProducts(prev => prev.map(p => p.id.toString() === idStr ? { ...p, ...updatedProduct } : p));

            const response = await authFetch(`${API_BASE_URL}/api/products/${idStr}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            return response.ok;
        } catch (error) {
            console.error("Error updating product:", error);
            return false;
        }
    };

    const deleteProduct = async (id) => {
        try {
            const idStr = id.toString();
            setProducts(prev => prev.filter(p => p.id.toString() !== idStr));

            const response = await authFetch(`${API_BASE_URL}/api/products/${idStr}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error("Error deleting product:", error);
            return false;
        }
    };

    const addReview = (newReview) => {
        setReviews([...reviews, { ...newReview, id: Date.now(), date: new Date().toISOString().split('T')[0] }]);
    };

    // Add new order
    const addOrder = async (orderData) => {
        const newOrder = {
            id: orderData.id || `CMD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            customerName: orderData.customerName || 'Client',
            email: orderData.email,
            date: new Date().toISOString().split('T')[0],
            total: orderData.total,
            subtotal: orderData.subtotal,
            shippingCost: orderData.shippingCost,
            status: orderData.status || 'En attente',
            items: orderData.items || [],
            shippingAddress: orderData.shippingAddress,
            phone: orderData.phone,
            paymentMethod: orderData.paymentMethod
        };

        // Optimistic UI
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        try {
            await authFetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
        } catch (error) {
            console.error("Error saving order:", error);
        }

        return newOrder;
    };

    // Update existing order
    const updateOrder = async (id, updatedData) => {
        setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, ...updatedData } : o));

        try {
            await authFetch(`${API_BASE_URL}/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    const addExpense = (expense) => {
        const newExpense = { ...expense, id: Date.now() };
        setExpenses([newExpense, ...expenses]);
    };

    const updateExpense = (id, updatedExpense) => {
        setExpenses(expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e));
    };

    const deleteExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const addHelpQuestion = (questionData) => {
        const newQ = {
            id: Date.now(),
            ...questionData,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            answer: ''
        };
        setHelpQuestions([newQ, ...helpQuestions]);
    };

    const updateHelpQuestion = (id, updatedData) => {
        setHelpQuestions(helpQuestions.map(q => q.id === id ? { ...q, ...updatedData } : q));
    };

    const deleteHelpQuestion = (id) => {
        setHelpQuestions(helpQuestions.filter(q => q.id !== id));
    };

    const adminUpdateUser = async (id, updatedData) => {
        try {
            setUsers(prev => prev.map(u => (u.id === id || u.email === id) ? { ...u, ...updatedData } : u));
            const response = await authFetch(`${API_BASE_URL}/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            return response.ok;
        } catch (error) {
            console.error("Error updating user:", error);
            return false;
        }
    };

    const adminDeleteUser = async (email) => {
        try {
            setUsers(prev => prev.filter(u => u.email !== email));
            const response = await authFetch(`${API_BASE_URL}/api/admin/users/${email}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error("Error deleting user:", error);
            return false;
        }
    };

    const adminAddUser = async (user) => {
        try {
            const newUser = { ...user, id: user.id || Date.now().toString() };
            setUsers(prev => [...prev, newUser]);

            // Re-use register endpoint or add a specific admin one? 
            // Register works but might have different logic. 
            // Let's assume register works for now as it handles users.json.
            const response = await authFetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            return response.ok;
        } catch (error) {
            console.error("Error adding user:", error);
            return false;
        }
    };

    return (
        <DataContext.Provider value={{
            products, addProduct, updateProduct, deleteProduct, loading,
            orders, setOrders, addOrder, updateOrder,
            users, setUsers, adminUpdateUser, adminDeleteUser, adminAddUser,
            expenses, addExpense, updateExpense, deleteExpense,
            reviews, addReview,
            helpQuestions, addHelpQuestion, updateHelpQuestion, deleteHelpQuestion
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);


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
