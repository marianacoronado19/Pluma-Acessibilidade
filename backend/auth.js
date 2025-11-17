const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db'); // Conexão com o MySQL
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não está definida nas variáveis de ambiente!");
    process.exit(1);
}

// ----------------------------------------------------
// Middleware para autenticar o Token (JWT)
// ----------------------------------------------------
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Espera o formato 'Bearer TOKEN'
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401: Não autorizado (Sem token)
        return res.status(401).json({ message: "Token não fornecido." }); 
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // 403: Proibido (Token inválido/expirado)
            return res.status(403).json({ message: "Token inválido ou expirado." });
        }
        // O payload do token (que deve incluir o user ID) é anexado
        req.user = user; 
        next();
    });
}
router.authenticateToken = authenticateToken;
// ----------------------------------------------------


// FUNÇÕES DE VALIDAÇÃO (Exemplo)
const dominiosPermitidos = [
    'gmail.com', 'yahoo.com.br', 'yahoo.com', 'hotmail.com', 
    'outlook.com', 'live.com', 'icloud.com', 'bol.com.br', 'uol.com.br'
];
function isDominioEmailPermitido(email) {
    if (!email || email.indexOf('@') === -1) return false;
    const partes = email.split('@');
    if (partes.length !== 2) return false; 
    const dominio = partes[1].toLowerCase();
    return dominiosPermitidos.includes(dominio);
}

// ----------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// ----------------------------------------------------

// Rota de LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
 
    if (!isDominioEmailPermitido(email)) {
        return res.status(400).json({ 
            message: "Domínio de e-mail não permitido. Use um provedor conhecido (Gmail, Hotmail, etc.)." 
        });
    }

    try {
        // MUDANÇA PRINCIPAL: Incluir 'preferences' na query
        const [rows] = await db.execute(
            'SELECT id, username, senha_hash, preferences FROM usuarios WHERE email = ?', // Incluindo 'preferences'
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

        const usuario = rows[0];
        const senhaCorreta = await bcrypt.compare(password, usuario.senha_hash);

        if (senhaCorreta) {
            // 1. Geração do Token JWT (como já existia)
            const token = jwt.sign(
                { userId: usuario.id, username: usuario.username }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            // 2. Parsing das preferências salvas no DB
            let preferencesObject = {};
            if (usuario.preferences) {
                 try {
                    // Assume que o campo preferences no MySQL é um JSON String.
                    preferencesObject = JSON.parse(usuario.preferences);
                } catch (e) {
                    console.error('Erro ao fazer JSON.parse das preferências no login:', e);
                    preferencesObject = {}; 
                }
            }

            // 3. Retorna o token, o ID do usuário E AS PREFERÊNCIAS
            return res.status(200).json({
                message: "Login bem-sucedido!",
                token: token,
                userId: usuario.id,
                preferences: preferencesObject // Preferências incluídas
            });
        } else {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Rota de CADASTRO
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha, confirmarSenha, nascimento, genero, telefone, acessibilidade } = req.body;

    if (!nome || !email || !senha || !confirmarSenha || !nascimento || !genero || !telefone || !acessibilidade) {
        return res.status(400).json({ message: "Por favor, preencha todos os campos obrigatórios." });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ message: "As senhas não coincidem." });
    }

    try {
        const [usuariosExistentes] = await db.execute(
            'SELECT email FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({ message: "Este e-mail já está cadastrado." });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const acessibilidadeStr = Array.isArray(acessibilidade) ? acessibilidade.join(',') : '';

        const telefoneNumerico = telefone ? telefone.replace(/\D/g, '') : null;

        await db.execute(
            `INSERT INTO usuarios (username, telefone, nascimento, email, senha_hash, genero, acessibilidade) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
            , [nome, telefoneNumerico, nascimento, email, senhaHash, genero, acessibilidadeStr]
        );

        return res.status(201).json({ message: "Cadastro realizado com sucesso! Utilize suas credenciais para logar." });

    } catch (error) {
        console.error('Erro de Servidor no Cadastro:', error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
});


// ----------------------------------------------------
// ROTAS DE PREFERÊNCIAS (AS NOVAS ROTAS)
// ----------------------------------------------------

/**
 * Rota POST protegida para salvar as preferências do usuário.
 * O ID do usuário é obtido do token JWT.
 */
router.post('/preferences/save', authenticateToken, async (req, res) => {
    // req.user.id é definido pelo middleware authenticateToken
    const userId = req.user.id; 
    const preferences = req.body.preferences;

    if (!preferences) {
        return res.status(400).json({ message: "Objeto de preferências não fornecido." });
    }

    try {
        // Converte o objeto JavaScript em uma string JSON para o banco de dados
        const preferencesJson = JSON.stringify(preferences);
        
        await db.execute(
            'UPDATE usuarios SET preferences = ? WHERE id = ?',
            [preferencesJson, userId]
        );

        return res.status(200).json({ message: "Preferências salvas com sucesso no servidor!" });

    } catch (error) {
        console.error('Erro ao salvar preferências:', error);
        // O erro pode ser de comunicação com o DB ou formato SQL inválido.
        return res.status(500).json({ message: "Erro interno do servidor ao salvar preferências." });
    }
});

/**
 * Rota GET protegida para buscar as preferências do usuário.
 * O ID do usuário é obtido do token JWT.
 */
router.get('/preferences/fetch', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // Busca a coluna 'preferences' na tabela 'usuarios'
        const [rows] = await db.execute(
            'SELECT preferences FROM usuarios WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        
        const preferencesJson = rows[0].preferences;
        let preferencesObject = {};

        // Se houver dados (não NULL), faz o parsing
        if (preferencesJson) {
            try {
                // Se o campo for TEXT, usa JSON.parse. Se for JSON, o mysql2 já pode retornar como objeto.
                // Usaremos JSON.parse para garantir a compatibilidade com campos TEXT e JSON.
                preferencesObject = JSON.parse(preferencesJson);
            } catch (e) {
                console.error('Erro ao fazer JSON.parse das preferências:', e);
                // Retorna objeto vazio se o JSON estiver malformado
                preferencesObject = {}; 
            }
        }
        
        // Retorna o objeto de preferências
        return res.status(200).json({ 
            preferences: preferencesObject, 
            message: "Preferências buscadas com sucesso!" 
        });

    } catch (error) {
        console.error('Erro ao buscar preferências:', error);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar preferências." });
    }
});

module.exports = router;