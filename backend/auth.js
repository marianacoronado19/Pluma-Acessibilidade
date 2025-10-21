const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Para comparação de hash de senhas
const db = require('./db');     // Sua conexão real com o MySQL
 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
 
    try {
            const [rows] = await db.execute(
            'SELECT username, senha_hash FROM usuarios WHERE email = ?',
            [email] // Parâmetro seguro
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
 
module.exports = router;