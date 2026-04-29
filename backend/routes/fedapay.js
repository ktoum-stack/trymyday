const express = require('express');
const router = express.Router();
const { FedaPay, Transaction } = require('fedapay');

// Initialize FedaPay with secret key
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');

// POST /api/fedapay/create-transaction
router.post('/create-transaction', async (req, res) => {
    try {
        const { amount, customer, items } = req.body;

        if (!amount || !customer) {
            return res.status(400).json({ success: false, message: 'Missing amount or customer data' });
        }

        // Create transaction
        const transaction = await Transaction.create({
            description: `Commande TRYMYDAY - ${customer.email}`,
            amount: amount,
            currency: { iso: 'XOF' },
            callback_url: `${req.headers.origin}/profile/orders`, // Redirect after success
            customer: {
                firstname: customer.firstname,
                lastname: customer.lastname,
                email: customer.email,
                phone_number: {
                    number: customer.phone,
                    country: 'BJ' // Default or dynamic
                }
            }
        });

        const token = await transaction.generateToken();

        res.json({
            success: true,
            url: token.url,
            transaction_id: transaction.id
        });

    } catch (error) {
        console.error('FedaPay Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
