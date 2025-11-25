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
    // 1. Obtém o ID do usuário (definido pelo middleware checkAuth) e o JSON das preferências (do body)
    const idUsuario = req.userId; 
    const preferenciasJsonString = req.body.preferencias; // String JSON enviada do frontend
    
    if (!preferenciasJsonString) {
        return res.status(400).send({ message: 'Preferências não fornecidas no corpo da requisição.' });
    }

    let connection;
    try {
        // Inicia a transação
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insere o novo JSON de preferências na tabela 'preferencias'
        const [prefResult] = await connection.execute(
            `INSERT INTO preferencias (preferencias_json) VALUES (?)`,
            [preferenciasJsonString]
        );
        const idPreferencia = prefResult.insertId;
        
        // 2. Linka/Atualiza o ID do usuário ao ID da preferência
        //    Se o id_usuario já existir, ele ATUALIZA o id_preferencia
        const linkQuery = `
            INSERT INTO usuario_preferencia (id_usuario, id_preferencia) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_preferencia = VALUES(id_preferencia);
        `;

        await connection.execute(linkQuery, [idUsuario, idPreferencia]);

        // Comita a transação
        await connection.commit();
        
        // Resposta de SUCESSO
        res.status(201).send({ message: '✅ Preferências salvas com sucesso no banco de dados!' });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Desfaz as alterações em caso de erro
        }
        console.error('Erro ao salvar preferências:', error);
        res.status(500).send({ message: 'Erro interno do servidor ao salvar preferências.' });
    } finally {
        if (connection) {
            connection.release();
        }
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