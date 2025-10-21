const express = require('express');
const cors = require('cors');
const authRouter = require('./auth');
const path = require('path');
 
const app = express();
const port = 3000;
 
app.use(cors());
app.use(express.json());
 
// 1. Servir arquivos estáticos do Frontend
// 1. Servir os arquivos HTML (login.html, configs.html, etc.) da pasta 'pages'
// Eles estarão acessíveis na raiz (ex: http://localhost:3000/login.html)
app.use(express.static(path.join(__dirname, '..', 'pages')));
 
// 2. Servir os arquivos CSS da pasta 'stylesheets' no caminho /stylesheets
// Isso faz o <link href="/stylesheets/login.css"> funcionar
app.use('/stylesheets', express.static(path.join(__dirname, '..', 'stylesheets')));
 
// 3. Servir os arquivos JS (login.js, etc.) da pasta 'js' no caminho /js
// Isso faz o <script src="/js/login.js"> funcionar
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
 
// 4. Servir as imagens (esta linha estava correta)
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
 
// 5. Rota GET para a raiz (agora aponta para /pages/login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'));
});
 
// 3. Rota de Autenticação (agora usando a lógica do MySQL)
app.use('/', authRouter);
 
// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Agora o login usa o banco de dados MySQL.');
});