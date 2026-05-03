const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const path = require('path');
const nodemailer = require('nodemailer');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { getFileData, saveFileData } = require('../supabaseDb');

// Email helper functions are now in ../utils/emailService.js

const USERS_FILE = 'users.json';

// Helper function to read users
async function getUsers() {
    try {
        const data = await getFileData(USERS_FILE, '{"users":[]}');
        return JSON.parse(data).users;
    } catch (error) {
        return [];
    }
}

// Helper function to save users
async function saveUsers(users) {
    await saveFileData(USERS_FILE, JSON.stringify({ users }, null, 2));
}

// POST /api/admin/wallet/email-notification - Send email notification for wallet credit (detached from DB)
router.post('/wallet/email-notification', async (req, res) => {
    try {
        const { email, amount, newBalance, description } = req.body;

        console.log(`📧 Triggering wallet notification for ${email}`);

        if (!email || !amount) {
            return res.status(400).json({ success: false, message: 'Email and amount required' });
        }

        const success = await sendEmail(emailTemplates.walletCredit(email, amount, newBalance));

        if (success) {
            res.json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error) {
        console.error('❌ Error sending wallet notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/wallet/credit - Credit user wallet (Admin only)
router.post('/wallet/credit', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email, userId, amount, description } = req.body;

        if ((!email && !userId) || !amount) {
            return res.status(400).json({ success: false, message: 'Identifiant (Email ou ID) et montant requis' });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be positive' });
        }

        const users = await getUsers();
        let userIndex = -1;

        if (userId) {
            userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1 && !email) {
                return res.status(404).json({ success: false, message: 'Utilisateur non trouvé avec cet ID' });
            }
        }

        if (userIndex === -1 && email) {
            userIndex = users.findIndex(u => u.email === email);
        }

        // Create user if doesn't exist
        if (userIndex === -1) {
            users.push({
                id: `user_${Date.now()}`,
                email: email,
                walletBalance: 0,
                transactions: []
            });
            userIndex = users.length - 1;
        }

        const user = users[userIndex];

        // Add amount
        user.walletBalance += amount;

        // Add transaction
        user.transactions.push({
            id: `tx_${Date.now()}`,
            type: 'credit',
            amount: amount,
            date: new Date().toISOString(),
            description: description || 'Admin credit',
            balanceAfter: user.walletBalance
        });

        users[userIndex] = user;
        await saveUsers(users);

        // Envoyer l'email de notification en arrière-plan
        sendEmail(emailTemplates.walletCredit(user.email, amount, user.walletBalance))
            .then(() => console.log(`[DEBUG] Email sent to ${user.email}`))
            .catch(err => console.error(`[DEBUG] Failed to send email to ${user.email}:`, err.message));

        res.json({
            success: true,
            message: 'Balance credited successfully',
            user: {
                email: user.email,
                newBalance: user.walletBalance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/wallet/users - Get all users with balances
router.get('/wallet/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await getUsers();

        const userSummaries = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            joined: user.joined,
            walletBalance: user.walletBalance,
            transactionCount: user.transactions.length,
            lastTransaction: user.transactions.length > 0
                ? user.transactions[user.transactions.length - 1].date
                : null
        }));

        res.json({
            success: true,
            users: userSummaries,
            totalUsers: userSummaries.length,
            totalBalance: userSummaries.reduce((sum, u) => sum + u.walletBalance, 0)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/wallet/history - Get all wallet transactions
router.get('/wallet/history', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await getUsers();

        const allTransactions = [];
        users.forEach(user => {
            user.transactions.forEach(tx => {
                allTransactions.push({
                    ...tx,
                    userEmail: user.email
                });
            });
        });

        // Sort by date, most recent first
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            transactions: allTransactions,
            totalTransactions: allTransactions.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/revenue - Get revenue statistics
router.get('/revenue', async (req, res) => {
    try {
        const users = await getUsers();

        let totalRevenue = 0;
        let totalOrders = 0;

        users.forEach(user => {
            user.transactions.forEach(tx => {
                if (tx.type === 'debit') {
                    totalRevenue += tx.amount;
                    totalOrders++;
                }
            });
        });

        res.json({
            success: true,
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/order-email - Send order status email
router.post('/order-email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { order, status, note } = req.body;
        console.log(`📩 Triggering email for Order #${order?.id}, Status: ${status}`);

        if (!order || !order.email) {
            return res.status(400).json({ success: false, message: 'Invalid order data' });
        }

        const success = await sendEmail(emailTemplates.orderStatus(order, status, note));

        if (success) {
            res.json({ success: true, message: 'Email sent' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/order-refund - Process refund for cancelled order
router.post('/order-refund', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { order, note } = req.body;
        console.log(`💰 Processing refund for Order #${order?.id}`);

        if (!order || !order.email || !order.total) {
            return res.status(400).json({ success: false, message: 'Invalid order data for refund' });
        }

        const users = await getUsers();
        let userIndex = users.findIndex(u => u.email === order.email);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'Customer not found in wallet system' });
        }

        const user = users[userIndex];

        // 🔒 IDEMPOTENCY CHECK: prevent double refund for same order
        const alreadyRefunded = (user.transactions || []).some(
            tx => tx.description && tx.description.includes(`#${order.id}`) && tx.type === 'credit'
        );
        if (alreadyRefunded) {
            console.warn(`⚠️ Refund already processed for order #${order.id} — skipping.`);
            return res.status(409).json({
                success: false,
                message: `Un remboursement a déjà été effectué pour la commande #${order.id}.`
            });
        }

        const refundAmount = parseFloat(order.total);
        const oldBalance = user.walletBalance || 0;

        // Update balance
        user.walletBalance = oldBalance + refundAmount;

        // Add transaction
        user.transactions.push({
            id: `refund_${order.id}_${Date.now()}`,
            type: 'credit',
            amount: refundAmount,
            date: new Date().toISOString(),
            description: `Remboursement Commande #${order.id}`,
            balanceAfter: user.walletBalance
        });

        users[userIndex] = user;
        await saveUsers(users);

        // Send enhanced email with balance info
        console.log(`📩 Sending refund email to ${user.email}`);
        await sendEmail(emailTemplates.orderStatus(order, 'Remboursée', note, oldBalance, user.walletBalance));

        res.json({
            success: true,
            message: 'Refund processed and email sent',
            newBalance: user.walletBalance
        });
    } catch (error) {
        console.error('❌ Refund error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/admin/users/:id - Update user (Admin only)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === id || u.email === id);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent changing admin@trymyday235.com role unless it's the admin themselves
        if (users[userIndex].email.toLowerCase() === 'trymyday235@gmail.com' && updatedData.role && updatedData.role !== 'admin') {
            // Optional: allow it but be careful. For now, let's allow it if it's the admin doing it.
        }

        users[userIndex] = { ...users[userIndex], ...updatedData };
        await saveUsers(users);

        res.json({ success: true, message: 'User updated successfully', user: users[userIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/admin/users/:email - Delete user (Admin only)
router.delete('/users/:email(*)', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const users = await getUsers();
        const initialCount = users.length;

        // Prevent deleting the main admin
        if (email.toLowerCase() === 'trymyday235@gmail.com') {
            return res.status(403).json({ success: false, message: 'Cannot delete the primary admin account' });
        }

        const filteredUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());

        if (filteredUsers.length === initialCount) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await saveUsers(filteredUsers);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/wallet/undo-transaction - Rollback a credit transaction
router.post('/wallet/undo-transaction', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.body;
        const users = await getUsers();
        let transactionFound = false;
        let targetUserEmail = null;

        for (const user of users) {
            const txIndex = user.transactions.findIndex(tx => tx.id === transactionId);
            if (txIndex !== -1) {
                const tx = user.transactions[txIndex];
                if (tx.type === 'credit') {
                    user.walletBalance -= tx.amount;
                    tx.description += ' (Annulée par l\'admin)';
                    tx.type = 'debit'; // Effectively counters the credit
                    tx.reversed = true;
                    transactionFound = true;
                    targetUserEmail = user.email;
                    break;
                }
            }
        }

        if (!transactionFound) {
            return res.status(404).json({ success: false, message: 'Transaction non trouvée ou non réversible' });
        }

        await saveUsers(users);
        res.json({ success: true, message: 'Transaction annulée avec succès' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
