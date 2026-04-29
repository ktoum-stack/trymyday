import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

const CartContext = createContext(null);

// Available coupons
const AVAILABLE_COUPONS = {
    'WELCOME10': { discount: 10, type: 'percentage', description: 'Réduction de 10%' },
    'SAVE20': { discount: 20, type: 'percentage', description: 'Réduction de 20%' },
    'FREESHIP': { discount: 0, type: 'free_shipping', description: 'Livraison gratuite' },
    'FIXED50': { discount: 32500, type: 'fixed', description: 'Réduction de 32 500 FCFA' },
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const { products } = useData();

    // Cart items (Initialize from localStorage)
    const [cartItems, setCartItems] = useState(() => {
        if (!user?.email) return [];
        const saved = localStorage.getItem(`cart_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Saved items (save for later)
    const [savedItems, setSavedItems] = useState(() => {
        if (!user?.email) return [];
        const saved = localStorage.getItem(`savedItems_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    // Selected items (for checkout) - Initialize from localStorage
    const [selectedItems, setSelectedItems] = useState(() => {
        if (!user?.email) return {};
        const saved = localStorage.getItem(`selectedItems_${user.email}`);
        return saved ? JSON.parse(saved) : {};
    });

    // Sync selectedItems when cartItems change
    useEffect(() => {
        if (!user?.email) return;

        setSelectedItems(prev => {
            const newSelection = { ...prev };
            let hasChanged = false;

            // Ensure any new items added to cart are selected by default
            cartItems.forEach(item => {
                const idStr = item.id?.toString();
                if (idStr && newSelection[idStr] === undefined) {
                    newSelection[idStr] = true;
                    hasChanged = true;
                }
            });

            // Cleanup: remove items that are no longer in the cart
            Object.keys(newSelection).forEach(id => {
                if (!cartItems.find(item => item.id?.toString() === id)) {
                    delete newSelection[id];
                    hasChanged = true;
                }
            });

            return hasChanged ? newSelection : prev;
        });
    }, [cartItems, user?.email]);

    // Sync cart when user identity COMPLETELY changes (Login/Logout)
    useEffect(() => {
        if (user?.email) {
            // Check if we should reload because of a different user
            const savedCart = localStorage.getItem(`cart_${user.email}`);
            setCartItems(savedCart ? JSON.parse(savedCart) : []);

            const savedSavedItems = localStorage.getItem(`savedItems_${user.email}`);
            setSavedItems(savedSavedItems ? JSON.parse(savedSavedItems) : []);
        } else {
            setCartItems([]);
            setSavedItems([]);
        }
    }, [user?.email]);

    // Persist cart to localStorage (User specific)
    useEffect(() => {
        if (user?.email) {
            localStorage.setItem(`cart_${user.email}`, JSON.stringify(cartItems));
        }
    }, [cartItems, user?.email]);

    // Persist saved items to localStorage (User specific)
    useEffect(() => {
        if (user?.email) {
            localStorage.setItem(`savedItems_${user.email}`, JSON.stringify(savedItems));
        }
    }, [savedItems, user?.email]);

    // Persist selectedItems to localStorage (User specific)
    useEffect(() => {
        if (user?.email) {
            localStorage.setItem(`selectedItems_${user.email}`, JSON.stringify(selectedItems));
        }
    }, [selectedItems, user?.email]);

    const addToCart = (product) => {
        if (!user) {
            return false; // Caller must handle the redirect
        }
        const prodIdStr = product.id?.toString();
        
        // Strip out reactive price data to just hold the ID and variant info
        const cartProduct = { ...product };

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id?.toString() === prodIdStr);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id?.toString() === prodIdStr
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...cartProduct, quantity: 1 }];
        });
        return true;
    };

    const removeFromCart = (id) => {
        const idStr = id?.toString();
        setCartItems(prevItems => prevItems.filter(item => item.id?.toString() !== idStr));
    };

    const updateQuantity = (id, quantity) => {
        if (quantity < 1) return;
        const idStr = id?.toString();
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id?.toString() === idStr ? { ...item, quantity: Number(quantity) } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setSelectedItems({});
        setAppliedCoupon(null);

        // Explicitly clear from localStorage as well to avoid any race conditions
        if (user?.email) {
            localStorage.setItem(`cart_${user.email}`, JSON.stringify([]));
            localStorage.setItem(`selectedItems_${user.email}`, JSON.stringify({}));
        }
    };

    // Save for later functionality
    const saveForLater = (id) => {
        const idStr = id?.toString();
        const item = cartItems.find(item => item.id?.toString() === idStr);
        if (item) {
            setSavedItems(prev => [...prev, item]);
            removeFromCart(idStr);
        }
    };

    const moveToCart = (id) => {
        const idStr = id?.toString();
        const item = savedItems.find(item => item.id?.toString() === idStr);
        if (item) {
            addToCart(item);
            setSavedItems(prev => prev.filter(i => i.id?.toString() !== idStr));
        }
    };

    const removeSavedItem = (id) => {
        const idStr = id?.toString();
        setSavedItems(prev => prev.filter(item => item.id?.toString() !== idStr));
    };

    // Coupon functionality
    const applyCoupon = (code) => {
        const coupon = AVAILABLE_COUPONS[code.toUpperCase()];
        if (coupon) {
            setAppliedCoupon({ code: code.toUpperCase(), ...coupon });
            return { success: true, message: `Coupon "${code}" appliqué avec succès!` };
        }
        return { success: false, message: 'Code promo invalide' };
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    const toggleItemSelection = (id) => {
        const idStr = id?.toString();
        setSelectedItems(prev => ({
            ...prev,
            [idStr]: !prev[idStr]
        }));
    };

    // Sync items with fresh product data
    const syncWithFreshData = (items) => {
        if (!products || products.length === 0) return items;
        return items.map(item => {
            const freshProduct = products.find(p => p.id?.toString() === item.id?.toString());
            if (freshProduct) {
                return {
                    ...item,
                    price: freshProduct.price,
                    flashSale: freshProduct.flashSale,
                    stock: freshProduct.stock,
                    name: freshProduct.name,
                    image: freshProduct.image || (freshProduct.images && freshProduct.images[0])
                };
            }
            return item;
        });
    };

    const syncedCartItems = syncWithFreshData(cartItems);
    const syncedSavedItems = syncWithFreshData(savedItems);

    const isItemSelected = (id) => {
        const idStr = id?.toString();
        return selectedItems[idStr] !== false; // Default to true if not found
    };

    const getSelectedItems = () => {
        return syncedCartItems.filter(item => isItemSelected(item.id));
    };

    // Calculate subtotal
    const getSubtotal = (onlySelected = false) => {
        const items = onlySelected ? getSelectedItems() : syncedCartItems;
        return items.reduce((total, item) => {
            // Check for flash sale price effectively
            let itemPrice = item.price;
            if (item.flashSale && item.flashSale.discount) {
                const now = new Date();
                const isActive = (!item.flashSale.startDate || now >= new Date(item.flashSale.startDate)) &&
                                 (!item.flashSale.endDate || now <= new Date(item.flashSale.endDate));
                if (isActive) {
                    itemPrice = Math.round(item.price * (1 - item.flashSale.discount / 100));
                }
            }
            return total + (itemPrice * item.quantity);
        }, 0);
    };

    // Calculate shipping cost
    const getShippingCost = () => {
        if (appliedCoupon?.type === 'free_shipping') return 0;
        return 0; // Livraison calculée plus tard ou retirée du panier
    };

    // Calculate tax (5% TVA)
    const getTax = (onlySelected = false) => {
        return 0; // Tax removed as requested
    };

    // Calculate discount
    const getDiscount = (onlySelected = false) => {
        if (!appliedCoupon) return 0;
        const subtotal = getSubtotal(onlySelected);

        if (appliedCoupon.type === 'percentage') {
            return subtotal * (appliedCoupon.discount / 100);
        } else if (appliedCoupon.type === 'fixed') {
            return Math.min(appliedCoupon.discount, subtotal);
        }
        return 0;
    };

    // Calculate final total
    const getCartTotal = (onlySelected = false) => {
        const subtotal = getSubtotal(onlySelected);
        const shipping = getShippingCost(); // Shipping stays same for order
        const tax = getTax(onlySelected);
        const discount = getDiscount(onlySelected);

        return Math.max(0, subtotal + shipping + tax - discount);
    };

    const getCartCount = (onlySelected = false) => {
        const items = onlySelected ? getSelectedItems() : syncedCartItems;
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems: syncedCartItems,
            rawCartItems: cartItems, // Just in case raw is needed
            savedItems: syncedSavedItems,
            appliedCoupon,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            saveForLater,
            moveToCart,
            removeSavedItem,
            applyCoupon,
            removeCoupon,
            getSubtotal,
            getShippingCost,
            getTax,
            getDiscount,
            getCartTotal,
            getCartCount,
            selectedItems,
            toggleItemSelection,
            isItemSelected,
            getSelectedItems,
            availableCoupons: AVAILABLE_COUPONS
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
