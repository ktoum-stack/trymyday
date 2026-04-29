const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

// Helper to read orders
async function getOrders() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        return JSON.parse(data).orders;
    } catch (error) {
        return [];
    }
}

// Helper to save orders
async function saveOrders(orders) {
    await fs.writeFile(ORDERS_FILE, JSON.stringify({ orders }, null, 2));
}

// GET /api/orders - Get all orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await getOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/orders/user/:email - Get orders for specific user
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const orders = await getOrders();
        const userOrders = orders.filter(o => o.email === email);
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/orders - Create new order
router.post('/', authMiddleware, async (req, res) => {
    try {
        const newOrder = req.body;
        const orders = await getOrders();

        // Basic validation
        if (!newOrder.items || newOrder.items.length === 0) {
            return res.status(400).json({ message: 'Order must have items' });
        }

        // Ensure ID and Date
        if (!newOrder.id) newOrder.id = Date.now().toString();
        if (!newOrder.date) newOrder.date = new Date().toLocaleDateString('fr-FR');
        if (!newOrder.status) newOrder.status = 'En attente';

        orders.push(newOrder);
        await saveOrders(orders);

        // Notify customer (Automatic Email)
        sendEmail(emailTemplates.orderStatus(newOrder, newOrder.status))
            .then(() => console.log('Order confirmation email sent'))
            .catch(err => console.error('Failed to send confirmation email:', err));

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, admin, trackingNumber } = req.body;
        const orders = await getOrders();

        const index = orders.findIndex(o => o.id == id);
        if (index === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[index];
        order.status = status;

        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        // Add to timeline if provided
        if (note || admin) {
            if (!order.timeline) order.timeline = [];
            order.timeline.push({
                date: new Date().toLocaleString('fr-FR'),
                status: status,
                note: note || '',
                admin: admin || 'System'
            });
        }

        order.lastUpdated = new Date().toLocaleString('fr-FR');

        orders[index] = order;
        await saveOrders(orders);

        // Notify customer (Automatic Email)
        sendEmail(emailTemplates.orderStatus(order, status, note))
            .then(() => console.log('Status update email sent'))
            .catch(err => console.error('Failed to send status update email:', err));

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/orders/:id - Update full order (e.g. for cancellation details)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const orders = await getOrders();

        const index = orders.findIndex(o => o.id == id);
        if (index === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        orders[index] = { ...orders[index], ...updates };
        await saveOrders(orders);

        res.json(orders[index]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
