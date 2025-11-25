require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { router: authRouter, checkAuth } = require('./auth');
const path = require('path');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'pages')));
app.use('/stylesheets', express.static(path.join(__dirname, '..', 'stylesheets')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Rota principal (login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'));
});

// =========================================================================
// Rota para SALVAR as preferências (POST)
// =========================================================================
app.post('/api/preferencias', checkAuth, async (req, res) => {
    // 1. Obtém o ID do usuário (do token) e o JSON das preferências (do body)
    const idUsuario = req.userId; // Definido pelo middleware checkAuth
    const preferenciasJsonString = req.body.preferencias; // String JSON enviada do frontend
    
    if (!idUsuario || !preferenciasJsonString) {
        return res.status(400).send({ message: 'Dados incompletos.' });
    }

    // --- Passo 1: Inserir a String JSON na tabela 'preferencias' ---
    const insertPrefQuery = `
        INSERT INTO preferencias (preferencias_json)
        VALUES (?)
    `;
    
    try {
        // Insere as preferências e obtém o ID gerado
        const [resultPref] = await db.execute(insertPrefQuery, [preferenciasJsonString]);
        const idPreferencia = resultPref.insertId;

        // --- Passo 2: Ligar o ID da Preferência ao ID do Usuário na tabela 'usuario_preferencia' ---
        const insertLinkQuery = `
            INSERT INTO usuario_preferencia (id_usuario, id_preferencia)
            VALUES (?, ?)
        `;
        
        // Cria a ligação entre o usuário e o novo registro de preferência
        await db.execute(insertLinkQuery, [idUsuario, idPreferencia]);

        res.status(200).send({ message: 'Preferências salvas com sucesso!', idPreferencia });

    } catch (error) {
        console.error('Erro ao salvar preferências:', error);
        res.status(500).send({ message: 'Erro interno do servidor ao salvar preferências.' });
    }
});

// =========================================================================
// Rota para BUSCAR as preferências mais recentes (GET)
// =========================================================================
app.get('/api/preferencias', checkAuth, async (req, res) => {
    const idUsuario = req.userId; // Definido pelo middleware checkAuth

    if (!idUsuario) {
        // Isso não deve acontecer se checkAuth funcionar corretamente, mas é uma salvaguarda
        return res.status(401).send({ message: 'Usuário não autenticado.' });
    }

    // Query que busca o JSON da preferência mais recente
    const fetchPrefQuery = `
        SELECT p.preferencias_json
        FROM usuario_preferencia up
        JOIN preferencias p ON up.id_preferencia = p.idpreferencia
        WHERE up.id_usuario = ?
        ORDER BY up.idusuario_preferencia DESC
        LIMIT 1
    `;

    try {
        const [rows] = await db.execute(fetchPrefQuery, [idUsuario]);

        if (rows.length === 0) {
            // Se o usuário nunca salvou preferências, retorna um status 404
            return res.status(404).send({ message: 'Nenhuma preferência encontrada para este usuário.' });
        }

        // O JSON retornado pelo MySQL é geralmente um objeto, mas o campo é string no código
        // Se o tipo no banco for JSON (como no script que gerei), o mysql2 já parseia.
        // Se o tipo for TEXT/VARCHAR, ele pode vir como string.
        const preferenciasData = rows[0].preferencias_json;

        res.status(200).send({ 
            message: 'Preferências recuperadas com sucesso.', 
            preferencias: preferenciasData 
        });

    } catch (error) {
        console.error('Erro ao buscar preferências:', error);
        res.status(500).send({ message: 'Erro interno do servidor ao buscar preferências.' });
    }
});


// Rotas de autenticação (login, cadastro, etc.)
app.use('/', authRouter);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Agora o login usa o banco de dados MySQL.');
});