## Projeto Final – Pluma 🪶  
*Mais que uma extensão, uma ponte para a inclusão digital.*

---

## 🛠️ Modificações realizadas desde o início do projeto
- Definição do tema: **Extensão de navegador para acessibilidade digital**.
- Design inicial no Canva e Figma.
- Escolha da paleta de cores acessível.
- Estrutura inicial de pastas e arquivos do projeto:  
  - `manifest.json` configurado para rodar no Chrome.  
  - Criação das primeiras páginas HTML (`index.html`, `login.html`, `configs.html`, `prelogin.html`).  
  - Implementação básica de navegação entre páginas (index → pré-login → configurações ou login).
    
---

## 🧪 Ideias em fase de teste ou prototipagem
- Escolha entre diferentes tecnologias para **Text-to-Speech** (Web Speech API ou integração externa).  
- Armazenamento de preferências:  
  - Opção 1: salvar localmente usando **Chrome Storage API**.  
  - Opção 2: salvar em banco externo via API (para login com conta).  
- Avaliação de estilos visuais para acessibilidade (alto contraste, cursor ampliado, etc.).  

---

## 🚀 Planos para os próximos passos
1. **Frontend da extensão**  
   - Melhorar a interface do popup, página de configurações e login.

2. **Funcionalidades principais**  
   - Implementar as funcionalidades de acessibilidade 

3. **Configurações personalizadas**  
   - Criar sistema de **salvar preferências no navegador**.  
   - Implementar banco de daods

4. **Documentação**  
   - Atualizar este README a cada checkpoint.  
   - Criar fluxograma com todas as telas e navegação.  

---

## 🛠️ Implantação do projeto
   - Para conexão com um banco de dados utilizamos JavaScript e Node.js, além de bcrypt para melhor segurança de senhas
   - Para inicialização de package.json: `npm init -y`
   - Para instalação de outras dependências: `npm install express cors mysql2 bcrypt`

## 👥 Equipe
- Luana Bitencourt OLiveira
- Luiza Fregonesi Castelucci
- Mariana Coronado Teixeira

---

## 📌 Repositório
🔗 [Link do Repositório no GitHub](https://github.com/marianacoronado19/Pluma-Acessibilidade)
