const express = require('express');
const cors = require('cors');
const authRouter = require('./auth');
const path = require('path');
 
const app = express();
const port = 3000;
 
app.use(cors());
app.use(express.json());
 
app.use(express.static(path.join(__dirname, '..', 'pages')));
 
app.use('/stylesheets', express.static(path.join(__dirname, '..', 'stylesheets')));
 
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
 
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'));
});
 
app.use('/', authRouter);
 
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Agora o login usa o banco de dados MySQL.');
});