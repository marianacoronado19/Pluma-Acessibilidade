const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const db = require('./db_connection');
 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
 
    try {
        const [rows] = await db.execute(
            'SELECT id, nome, senha_hash FROM usuarios WHERE email = ?',
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
            // Senha Incorreta
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }
    } catch (error) {
        console.error('Erro de Servidor:', error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
});