
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/get-or-create-wallet', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const db = require('./src/database.js');
    const stellar = require('./src/stellar.js');

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            return res.status(200).json({ publicKey: row.publicKey });
        }

        const keypair = stellar.StellarSdk.Keypair.random();
        const publicKey = keypair.publicKey();
        const secretKey = keypair.secret();

        try {
            await stellar.fundAccount(publicKey);
            db.run("INSERT INTO users (email, publicKey, secretKey) VALUES (?, ?, ?)", [email, publicKey, secretKey], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ publicKey });
            });
        } catch (e) {
            res.status(500).json({ error: `Failed to fund account. We have this error: ${e}` });
        }
    });
});

app.get('/wallet/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const db = require('./src/database.js');
    const stellar = require('./src/stellar.js');

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }

        try {
          const account = await stellar.server.loadAccount(row.publicKey);
          const balances = account.balances.map(balance => ({
              type: balance.asset_type,
              balance: balance.balance
          }));
          res.status(200).json({ publicKey: row.publicKey, balances });
        } catch (e) {
            res.status(500).json({ error: `Failed to load account. We have this error: ${e}` });
        }
    });
});

app.delete('/wallet/:email', (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const db = require('./src/database.js');

    db.run("DELETE FROM users WHERE email = ?", [email], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
});

const db = require('./src/database.js');
const stellar = require('./src/stellar.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
