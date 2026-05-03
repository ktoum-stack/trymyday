const express = require('express');
const router = express.Router();
const path = require('path');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { getFileData, saveFileData } = require('../supabaseDb');

const PRODUCTS_FILE = 'products.json';

// Helper to read products
async function getProducts() {
    try {
        const data = await getFileData(PRODUCTS_FILE, '{"products":[]}');
        return JSON.parse(data).products;
    } catch (error) {
        // If file doesn't exist or error, return empty array
        return [];
    }
}

// Helper to save products
async function saveProducts(products) {
    await saveFileData(PRODUCTS_FILE, JSON.stringify({ products }, null, 2));
}

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/products - Create a product
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const newProduct = req.body;
        const products = await getProducts();

        // Ensure ID
        if (!newProduct.id) {
            newProduct.id = Math.floor(10000000 + Math.random() * 90000000).toString();
        }

        products.push(newProduct);
        await saveProducts(products);

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/products/:id - Update a product
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const products = await getProducts();

        const index = products.findIndex(p => p.id == id);
        if (index === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Merge existing product with updates
        products[index] = { ...products[index], ...updatedData };
        await saveProducts(products);

        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let products = await getProducts();

        const initialLength = products.length;
        products = products.filter(p => p.id != id);

        if (products.length === initialLength) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await saveProducts(products);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
