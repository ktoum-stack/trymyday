const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sendEmail, emailTemplates } = require('../utils/emailService');

const USERS_FILE = path.join(__dirname, '../data/users.json');

async function getUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        return [];
    }
}

async function saveUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const users = await getUsers();

        if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Math.floor(10000000 + Math.random() * 90000000).toString(),
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'client',
            walletBalance: 0,
            joined: new Date().toISOString().split('T')[0],
            transactions: []
        };

        users.push(newUser);
        await saveUsers(users);

        // JWT Generation
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

        res.status(201).json({ user: { ...newUser, password: undefined }, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPassword = password.trim();
        const users = await getUsers();

        // Special Admin Bypass check
        if (normalizedEmail === 'trymyday235@gmail.com') {
            let adminUser = users.find(u => u.email.toLowerCase() === 'trymyday235@gmail.com');
            if (!adminUser) {
                adminUser = {
                    id: 'admin_1',
                    name: 'Trymyday',
                    email: 'Trymyday235@gmail.com',
                    password: password,
                    role: 'admin',
                    walletBalance: 0,
                    joined: new Date().toISOString().split('T')[0],
                    transactions: []
                };
                users.push(adminUser);
                await saveUsers(users);
            } else if (adminUser.role !== 'admin') {
                adminUser.role = 'admin';
                adminUser.name = 'Trymyday';
                const idx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
                users[idx] = adminUser;
                await saveUsers(users);
            }
            return res.json({ ...adminUser, balance: adminUser.walletBalance });
        }

        const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const bcrypt = require('bcryptjs');

        // Compare password with bcrypt
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(normalizedPassword, user.password);
        } catch (e) {
            // Ignore bcrypt errors (e.g. if it's plaintext)
        }
        
        // Legacy Support: If bcrypt fails but it matches plaintext, hash it and save!
        if (!isMatch && user.password === normalizedPassword) {
            user.password = await bcrypt.hash(normalizedPassword, 10);
            await saveUsers(users);
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Generate JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

        res.json({ user: { ...user, balance: user.walletBalance, password: undefined }, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
