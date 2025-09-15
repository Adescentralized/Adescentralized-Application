
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Account
app.post('/wallet/', async (req, res) => {
    const { email, password } = req.body;
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
            return res.status(400).json({ error: 'User already exists' });
        }

        const keypair = stellar.StellarSdk.Keypair.random();
        const publicKey = keypair.publicKey();
        const secretKey = keypair.secret();

        try {
            await stellar.fundAccount(publicKey);
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            db.run(
                "INSERT INTO users (email, password, publicKey, secretKey) VALUES (?, ?, ?, ?)",
                [email, hashedPassword, publicKey, secretKey],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ publicKey });
                }
            );
        } catch (e) {
            res.status(500).json({ error: `Failed to fund account. We have this error: ${e}` });
        }
    });
});

app.post('/wallet/login', (req, res) => {
    
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = require('./src/database.js');
    const bcrypt = require('bcrypt');

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, row.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.status(200).json({ 
            id: row.id,
            email: row.email,
            message: 'Login successful', 
            publicKey: row.publicKey 
        });
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
          res.status(200).json({ publicKey: row.publicKey, balances, account: account });
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

app.post('/transfer', async (req, res) => {
    const { fromEmail, toPublicKey, amount } = req.body;
    if (!fromEmail || !toPublicKey || !amount) {
        return res.status(400).json({ error: 'fromEmail, toPublicKey and amount are required' });
    }

    const db = require('./src/database.js');
    const stellar = require('./src/stellar.js');

    db.get("SELECT * FROM users WHERE email = ?", [fromEmail], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Sender not found' });
        }

        try {
            const tx = new stellar.StellarSdk.TransactionBuilder(
                await stellar.server.loadAccount(row.publicKey),
                {
                    fee: await stellar.server.fetchBaseFee(),
                    networkPassphrase: stellar.StellarSdk.Networks.TESTNET
                }
            )
            .addOperation(stellar.StellarSdk.Operation.payment({
                destination: toPublicKey,
                asset: stellar.StellarSdk.Asset.native(),
                amount: amount.toString()
            }))
            .setTimeout(30)
            .build();

            tx.sign(stellar.StellarSdk.Keypair.fromSecret(row.secretKey));  

            const transactionResult = await stellar.server
                .submitTransaction(tx)

            res.status(200).json({ message: 'Payment successful', transactionResult });
        } catch (e) {
            res.status(500).json({ error: `Failed to send payment. We have this error: ${e}` });
        }
    });
});

// Advertisements
app.post('/advertisements', (req, res) => {
    //
});

const db = require('./src/database.js');
const stellar = require('./src/stellar.js');
const { Transaction } = require('stellar-sdk');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
