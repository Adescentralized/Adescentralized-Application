// src/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Pega o header de autorização
    const authHeader = req.headers.authorization;

    // Verifica se o header existe e se está no formato 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso não autorizado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verifica e decodifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Anexa os dados do usuário decodificados ao objeto 'req'
        // para que as próximas rotas possam usá-los
        req.user = { 
            id: decoded.id, 
            email: decoded.email,
            name: decoded.name, // Nome do anunciante
            publicKey: decoded.publicKey
        };

        next(); // Passa para a próxima função (a rota em si)
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = authMiddleware;