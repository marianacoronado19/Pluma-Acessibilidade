require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { router: authRouter, checkAuth } = require('./auth');
const path = require('path');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Habilita o Cross-Origin Resource Sharing (CORS) para permitir requisições de diferentes origens, como o frontend da extensão.
app.use(cors());
// Configura o middleware para processar corpos de requisição JSON, tornando os dados disponíveis em req.body.
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'pages')));
app.use('/stylesheets', express.static(path.join(__dirname, '..', 'stylesheets')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Rota raiz que serve a página login.html para autenticação de novos usuários.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'));
});

// Rota protegida (requer checkAuth) para receber, salvar e vincular as novas preferências do usuário no banco de dados.
app.post('/api/preferencias', checkAuth, async (req, res) => {
    const idUsuario = req.userId; 
    const preferenciasJsonString = req.body.preferencias;
    
    if (!preferenciasJsonString) {
        return res.status(400).send({ message: 'Preferências não fornecidas no corpo da requisição.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [prefResult] = await connection.execute(
            `INSERT INTO preferencias (preferencias_json) VALUES (?)`,
            [preferenciasJsonString]
        );
        const idPreferencia = prefResult.insertId;
        
        const linkQuery = `
            INSERT INTO usuario_preferencia (id_usuario, id_preferencia) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_preferencia = VALUES(id_preferencia);
        `;

        await connection.execute(linkQuery, [idUsuario, idPreferencia]);

        await connection.commit();
        
        res.status(201).send({ message: '✅ Preferências salvas com sucesso no banco de dados!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Erro ao salvar preferências:', error);
        res.status(500).send({ message: 'Erro interno do servidor ao salvar preferências.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Rota protegida que busca e retorna a última configuração de acessibilidade salva para o usuário autenticado.
app.get('/api/preferencias', checkAuth, async (req, res) => {
    const idUsuario = req.userId;

    if (!idUsuario) {
        return res.status(401).send({ message: 'Usuário não autenticado.' });
    }

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
            return res.status(404).send({ message: 'Nenhuma preferência encontrada para este usuário.' });
        }

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

// Associa o roteador de autenticação (login, cadastro) ao caminho raiz da aplicação.
app.use('/', authRouter);

// Inicia o servidor e o mantém escutando as requisições na porta configurada.
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Agora o login usa o banco de dados MySQL.');
});