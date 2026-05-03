const express = require('express');
const router = express.Router();
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { getFileData, saveFileData } = require('../supabaseDb');

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

// Helper function to find or create user
async function findOrCreateUser(email) {
    const users = await getUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        user = {
            id: `user_${Date.now()}`,
            email: email,
            walletBalance: 0,
            transactions: []
        };
        users.push(user);
        await saveUsers(users);
    }

    return user;
}

// GET /api/wallet/balance - Get user wallet balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const email = req.user.email; // Get email from JWT, NOT req.query

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email required' });
        }

        const user = await findOrCreateUser(email);

        res.json({
            success: true,
            balance: user.walletBalance,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/wallet/pay - Pay with wallet balance
router.post('/pay', authMiddleware, async (req, res) => {
    try {
        const { amount, orderId } = req.body; const email = req.user.email;
        console.log(`💰 PAY REQUEST: email=${email}, amount=${amount}, orderId=${orderId}`);

        if (!email || !amount) {
            console.error('❌ Missing email or amount');
            return res.status(400).json({ success: false, message: 'Email and amount required' });
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            console.error(`❌ User not found: ${email}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[userIndex];
        console.log(`👤 User found: ${user.email}, balance=${user.walletBalance}`);

        if (user.walletBalance < amount) {
            console.error(`❌ Insufficient balance: ${user.walletBalance} < ${amount}`);
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                balance: user.walletBalance,
                required: amount
            });
        }

        // Deduct amount
        user.walletBalance -= amount;

        // Add transaction
        user.transactions.push({
            id: `tx_${Date.now()}`,
            type: 'debit',
            amount: amount,
            date: new Date().toISOString(),
            description: `Order payment ${orderId || ''}`,
            balanceAfter: user.walletBalance
        });

        users[userIndex] = user;
        await saveUsers(users);

        res.json({
            success: true,
            message: 'Payment successful',
            newBalance: user.walletBalance,
            transactionId: user.transactions[user.transactions.length - 1].id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/wallet/transactions - Get user transaction history
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const email = req.user.email;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email required' });
        }

        const user = await findOrCreateUser(email);

        res.json({
            success: true,
            transactions: user.transactions.reverse() // Most recent first
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/wallet/transfer - Transfer balance between users
router.post('/transfer', authMiddleware, async (req, res) => {
    try {
        const { toEmail, amount, description } = req.body; const fromEmail = req.user.email;

        if (!fromEmail || !toEmail || !amount) {
            return res.status(400).json({ success: false, message: 'Source, destinataire et montant requis' });
        }

        if (fromEmail === toEmail) {
            return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous envoyer des fonds à vous-même' });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Le montant doit être positif' });
        }

        const users = await getUsers();
        const fromIndex = users.findIndex(u => u.email === fromEmail || u.id === fromEmail); // Support both
        let toIndex = users.findIndex(u => u.id === toEmail || u.email === toEmail);

        if (fromIndex === -1) {
            return res.status(404).json({ success: false, message: 'Expéditeur non trouvé' });
        }

        const fromUser = users[fromIndex];

        if (fromUser.walletBalance < amount) {
            return res.status(400).json({ success: false, message: 'Solde insuffisant' });
        }

        // Handle destination user (create if doesn't exist)
        if (toIndex === -1) {
            const newUser = {
                id: `user_${Date.now()}`,
                email: toEmail,
                walletBalance: 0,
                transactions: []
            };
            users.push(newUser);
            toIndex = users.length - 1;
        }

        const toUser = users[toIndex];

        // Process transfer
        const date = new Date().toISOString();
        const transferId = `tr_${Date.now()}`;

        // Debit sender
        fromUser.walletBalance -= amount;
        fromUser.transactions.push({
            id: `${transferId}_out`,
            type: 'debit',
            amount: amount,
            date: date,
            description: description || `Virement vers ${toUser.name || toUser.id}`,
            balanceAfter: fromUser.walletBalance
        });

        // Credit receiver
        toUser.walletBalance += amount;
        toUser.transactions.push({
            id: `${transferId}_in`,
            type: 'credit',
            amount: amount,
            date: date,
            description: `Virement reçu de ${fromEmail}`,
            balanceAfter: toUser.walletBalance
        });

        users[fromIndex] = fromUser;
        users[toIndex] = toUser;

        await saveUsers(users);

        // Notify receiver
        sendEmail(emailTemplates.walletCredit(toUser.email, amount, toUser.walletBalance))
            .then(() => console.log('Transfer notification email sent to:', toUser.email))
            .catch(err => console.error('Failed to send transfer notification:', err));

        res.json({
            success: true,
            message: 'Transfert réussi',
            newBalance: fromUser.walletBalance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
