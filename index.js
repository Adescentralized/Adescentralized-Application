
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken'); 
const authMiddleware = require('./src/authMiddleware.js'); 

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota raiz redireciona para login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Account
app.post('/wallet/', authMiddleware, async (req, res) => {
    const { email, password, name } = req.body; // << ADICIONAR name
    if (!email || !password || !name) {
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
                // << ATUALIZAR SQL E PARÂMETROS
                "INSERT INTO users (name, email, password, publicKey, secretKey) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, publicKey, secretKey],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ message: "Usuário criado com sucesso!", publicKey });
                }
            );
        } catch (e) {
            res.status(500).json({ error: `Failed to fund account. We have this error: ${e}` });
        }
    });
});

app.post('/wallet/login', authMiddleware, (req, res) => {
    
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

        // Criar o payload (dados que irão dentro do token)
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name, // O nome do anunciante que precisávamos!
            publicKey: user.publicKey
        };

        // Assinar o token com a chave secreta
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Define a validade do token
        );

        // Retornar o token e os dados do usuário
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
               id: user.id,
               email: user.email,
               name: user.name,
               publicKey: user.publicKey
            }
        });
    });
});

app.get('/wallet/:email', authMiddleware, async (req, res) => {
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

app.post('/transfer', authMiddleware, async (req, res) => {
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


app.post('/advertisements', authMiddleware, async (req, res) => {
    // 1. Obtenha os dados do corpo da requisição
    const { title, description, imageUrl, targetUrl, budgetXlm, costPerClick, tags } = req.body;
    
    // 2. Obtenha os dados do usuário a partir do token (injetados pelo middleware)
    const { id: userId, name: advertiserName, publicKey: advertiserStellarKey } = req.user;

    // 3. Validação dos campos
    if (!title || !imageUrl || !targetUrl || !budgetXlm || !costPerClick) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const db = require('./src/database.js');
    const { v4: uuidv4 } = require('uuid');

    const campaignId = `campaign_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    db.run(
        `INSERT INTO campaigns (id, user_id, advertiser_name, advertiser_stellar_key, title, description, image_url, target_url, budget_xlm, cost_per_click, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        // 4. Use as variáveis obtidas do token
        [campaignId, userId, advertiserName, advertiserStellarKey, title, description, imageUrl, targetUrl, budgetXlm, costPerClick, JSON.stringify(tags || [])],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ 
                message: 'Campanha criada com sucesso!', 
                campaignId: campaignId,
                status: 'pending'
            });
        }
    );
});

// Listar campanhas do usuário
app.get('/advertisements/:userId', authMiddleware, (req, res) => {
    const { userId } = req.params;
    const db = require('./src/database.js');

    db.all("SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// Atualizar campanha
app.put('/advertisements/:campaignId', (req, res) => {
    const { campaignId } = req.params;
    const { title, description, imageUrl, targetUrl, budgetXlm, costPerClick, tags, active } = req.body;
    const db = require('./src/database.js');

    const updates = [];
    const values = [];
    
    if (title) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (imageUrl) { updates.push('image_url = ?'); values.push(imageUrl); }
    if (targetUrl) { updates.push('target_url = ?'); values.push(targetUrl); }
    if (budgetXlm) { updates.push('budget_xlm = ?'); values.push(budgetXlm); }
    if (costPerClick) { updates.push('cost_per_click = ?'); values.push(costPerClick); }
    if (tags) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(campaignId);

    if (updates.length === 1) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    db.run(
        `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Campanha não encontrada' });
            }
            res.status(200).json({ message: 'Campanha atualizada com sucesso!' });
        }
    );
});

// Deletar campanha
app.delete('/advertisements/:campaignId', (req, res) => {
    const { campaignId } = req.params;
    const db = require('./src/database.js');

    db.run("DELETE FROM campaigns WHERE id = ?", [campaignId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        res.status(200).json({ message: 'Campanha deletada com sucesso!' });
    });
});

// Criar site (publishers)
app.post('/sites', authMiddleware, (req, res) => {
    const { userId, name, domain, revenueShare } = req.body;
    
    if (!userId || !name || !domain) {
        return res.status(400).json({ error: 'userId, name e domain são obrigatórios' });
    }

    const db = require('./src/database.js');
    const { v4: uuidv4 } = require('uuid');

    // Verificar se o usuário existe
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const siteId = `site_${Date.now()}_${uuidv4().substring(0, 8)}`;
        
        db.run(
            `INSERT INTO sites (id, user_id, name, domain, stellar_public_key, revenue_share) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [siteId, userId, name, domain, user.publicKey, revenueShare || 0.7],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ 
                    message: 'Site cadastrado com sucesso!', 
                    siteId: siteId,
                    sdkCode: generateSDKCode(siteId)
                });
            }
        );
    });
});

// Listar sites do usuário
app.get('/sites/:userId', authMiddleware, (req, res) => {
    const { userId } = req.params;
    const db = require('./src/database.js');

    db.all("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// Atualizar site
app.put('/sites/:siteId', (req, res) => {
    const { siteId } = req.params;
    const { name, domain, revenueShare, status } = req.body;
    const db = require('./src/database.js');

    const updates = [];
    const values = [];
    
    if (name) { updates.push('name = ?'); values.push(name); }
    if (domain) { updates.push('domain = ?'); values.push(domain); }
    if (revenueShare) { updates.push('revenue_share = ?'); values.push(revenueShare); }
    if (status) { updates.push('status = ?'); values.push(status); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(siteId);

    if (updates.length === 1) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    db.run(
        `UPDATE sites SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Site não encontrado' });
            }
            res.status(200).json({ message: 'Site atualizado com sucesso!' });
        }
    );
});

// Gerar código SDK para o site
app.get('/sites/:siteId/sdk-code', authMiddleware, (req, res) => {
    const { siteId } = req.params;
    const db = require('./src/database.js');

    db.get("SELECT * FROM sites WHERE id = ?", [siteId], (err, site) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!site) {
            return res.status(404).json({ error: 'Site não encontrado' });
        }

        const sdkCode = generateSDKCode(siteId);
        res.status(200).json({ 
            siteId: siteId,
            siteName: site.name,
            sdkCode: sdkCode 
        });
    });
});

// Dashboard - estatísticas do usuário
app.get('/dashboard/:userId', authMiddleware, (req, res) => {
    const { userId } = req.params;
    const db = require('./src/database.js');

    // Buscar dados do usuário
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Buscar estatísticas de campanhas
        db.all(`
            SELECT 
                c.*,
                COALESCE(click_stats.total_clicks, 0) as total_clicks,
                COALESCE(click_stats.total_revenue, 0) as total_revenue,
                COALESCE(impression_stats.total_impressions, 0) as total_impressions
            FROM campaigns c
            LEFT JOIN (
                SELECT campaign_id, COUNT(*) as total_clicks, SUM(payment_amount) as total_revenue
                FROM clicks 
                GROUP BY campaign_id
            ) click_stats ON c.id = click_stats.campaign_id
            LEFT JOIN (
                SELECT campaign_id, COUNT(*) as total_impressions
                FROM impressions 
                GROUP BY campaign_id
            ) impression_stats ON c.id = impression_stats.campaign_id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [userId], (err, campaigns) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Buscar sites se for publisher
            db.all("SELECT * FROM sites WHERE user_id = ?", [userId], (err, sites) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                res.status(200).json({
                    user: {
                        id: user.id,
                        email: user.email,
                        publicKey: user.publicKey,
                        userType: user.user_type
                    },
                    campaigns: campaigns || [],
                    sites: sites || [],
                    summary: {
                        totalCampaigns: campaigns.length,
                        totalSites: sites.length,
                        totalClicks: campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0),
                        totalImpressions: campaigns.reduce((sum, c) => sum + (c.total_impressions || 0), 0),
                        totalSpent: campaigns.reduce((sum, c) => sum + (c.spent_xlm || 0), 0)
                    }
                });
            });
        });
    });
});

// Função auxiliar para gerar código SDK
function generateSDKCode(siteId) {
    return `<!-- Stellar Ads SDK -->
<div id="stellar-ad-container" 
     data-site-id="${siteId}"
     data-tags="geral">
    <!-- Anúncios serão carregados aqui -->
</div>

<script>
window.StellarAdsConfig = {
    siteId: '${siteId}',
    apiBaseUrl: 'http://localhost:3000', // Altere para sua URL de produção
    debug: false
};
</script>
<script src="http://localhost:3000/sdk.js"></script>
<!-- Em produção: <script src="https://api.stellarads.com/sdk.js"></script> -->`;
}

const db = require('./src/database.js');
const stellar = require('./src/stellar.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
