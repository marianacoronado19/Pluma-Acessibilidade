const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');
 
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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
 
    if (!isDominioEmailPermitido(email)) {
        return res.status(400).json({ 
            message: "Domínio de e-mail não permitido. Use um provedor conhecido (Gmail, Hotmail, etc.)." 
        });
    }

    try {
            const [rows] = await db.execute(
            'SELECT username, senha_hash FROM usuarios WHERE email = ?',
            [email]
        );
 
        if (rows.length === 0) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }
 
        const usuario = rows[0];
       
        const senhaCorreta = await bcrypt.compare(password, usuario.senha_hash);
 
        if (senhaCorreta) {
            return res.status(200).json({
                message: "Login bem-sucedido!",
                nome: usuario.nome
            });
        } else {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }
 
    } catch (error) {
        console.error('Erro de Autenticação/DB:', error);
        return res.status(500).json({
            message: "Erro interno do servidor ao tentar autenticar."
        });
    }
});
 
router.post('/cadastro', async (req, res) => {
    const { 
        nome, 
        telefone, 
        nascimento, 
        email, 
        senha, 
        confirmarSenha, 
        genero, 
        acessibilidade 
    } = req.body;

    if (!isDominioEmailPermitido(email)) {
        return res.status(400).json({ 
            message: "Domínio de e-mail não permitido. Use um provedor conhecido (Gmail, Hotmail, etc.)." 
        });
    }

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
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, telefoneNumerico, nascimento, email, senhaHash, genero, acessibilidadeStr]
        );

        return res.status(201).json({ message: "Cadastro realizado com sucesso!" });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        return res.status(500).json({ message: "Erro interno do servidor ao tentar realizar o cadastro." });
    }
});

module.exports = router;