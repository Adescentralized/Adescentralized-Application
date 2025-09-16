
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');
    
    // Tabela de usuários
     db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, -- << ADICIONE ESTA LINHA
        email TEXT NOT NULL UNIQUE,
        publicKey TEXT NOT NULL,
        secretKey TEXT NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT DEFAULT 'advertiser' CHECK(user_type IN ('advertiser', 'publisher')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de sites (editores/publishers)
    db.run(`CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        stellar_public_key TEXT NOT NULL,
        revenue_share REAL NOT NULL DEFAULT 0.7,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tabela de campanhas (anunciantes)
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        advertiser_name TEXT NOT NULL,
        advertiser_stellar_key TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        target_url TEXT NOT NULL,
        budget_xlm REAL NOT NULL,
        spent_xlm REAL NOT NULL DEFAULT 0,
        cost_per_click REAL NOT NULL,
        cost_per_impression REAL DEFAULT 0.001,
        active BOOLEAN NOT NULL DEFAULT 1,
        tags TEXT, -- JSON array de tags para matching
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paused')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tabela de cliques (métricas)
    db.run(`CREATE TABLE IF NOT EXISTS clicks (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        payment_amount REAL NOT NULL,
        payment_tx_hash TEXT,
        payment_status TEXT DEFAULT 'pending',
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (site_id) REFERENCES sites(id)
    )`);

    // Tabela de impressões
    db.run(`CREATE TABLE IF NOT EXISTS impressions (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        served_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        user_fingerprint TEXT,
        payment_amount REAL DEFAULT 0,
        payment_tx_hash TEXT,
        payment_status TEXT DEFAULT 'pending',
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (site_id) REFERENCES sites(id)
    )`);

    // Tabela de recompensas de usuários
    db.run(`CREATE TABLE IF NOT EXISTS user_rewards (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT NOT NULL,
        site_id TEXT NOT NULL,
        last_reward_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_impressions INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        total_earned_xlm REAL DEFAULT 0,
        stellar_public_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_fingerprint, site_id)
    )`);

    console.log('✅ Todas as tabelas foram criadas/verificadas');
});

module.exports = db;
