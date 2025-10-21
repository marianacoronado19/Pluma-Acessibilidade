function injetarPreLoginCSS() { 
  if (document.getElementById('pluma-prelogin-style')) return;

  const linkElement = document.createElement('link');
  linkElement.id = 'pluma-prelogin-style';
  linkElement.rel = 'stylesheet';
  linkElement.type = 'text/css';
  linkElement.href = chrome.runtime.getURL('stylesheets/prelogin.css');
  document.head.appendChild(linkElement);
}

function criarPopupPreLogin() {
  if (document.getElementById('pluma-prelogin-container')) return;

  const containerPrincipal = document.createElement('div');
  containerPrincipal.classList.add('prelogin-container');

  const titulo = document.createElement('h1');
  titulo.textContent = 'Bem vindo ao PLUMA!';

  const paragrafo = document.createElement('p');
  paragrafo.textContent = 'Ao configurar seu pluma, você pode deixar suas preferências salvas criando uma conta! Assim fica mais fácil acessar suas escolhas em qualquer navegador... Você deseja cadastrar-se?';

  const acaoInicialContainer = document.createElement('div');
  acaoInicialContainer.classList.add('acao-inicial-container');

  const linkCadastro = document.createElement('a');
  linkCadastro.href = chrome.runtime.getURL('pages/cadastro.html');
  linkCadastro.textContent = 'Sim, cadastrar-me!';
  linkCadastro.classList.add('link-texto');

  const textoOu = document.createElement('span');
  textoOu.textContent = '- ou -';
  textoOu.classList.add('texto-separador');

  const linkAnonimo = document.createElement('a');
  linkAnonimo.href = chrome.runtime.getURL('pages/configs.html');
  linkAnonimo.textContent = 'Não, usar anonimamente...';
  linkAnonimo.classList.add('link-texto');

  acaoInicialContainer.appendChild(linkCadastro);
  acaoInicialContainer.appendChild(textoOu);
  acaoInicialContainer.appendChild(linkAnonimo);


  const loginContainer = document.createElement('div');
  loginContainer.classList.add('login-container');

  const paragrafoLogin = document.createElement('p');
  paragrafoLogin.textContent = 'Já possui um cadastro? Faça login!';

  const botaoLogin = document.createElement('button');
  botaoLogin.textContent = 'Login';
  botaoLogin.classList.add('botao-login');

  loginContainer.appendChild(paragrafoLogin);
  loginContainer.appendChild(botaoLogin);
  
  const botaoFechar = document.createElement('span');
  botaoFechar.textContent = 'X';
  botaoFechar.classList.add('botao-fechar');
  botaoFechar.onclick = () => containerPrincipal.remove();

  containerPrincipal.appendChild(botaoFechar);
  containerPrincipal.appendChild(titulo);
  containerPrincipal.appendChild(paragrafo);
  containerPrincipal.appendChild(acaoInicialContainer);
  containerPrincipal.appendChild(loginContainer);

  document.body.appendChild(containerPrincipal);

  botaoLogin.addEventListener('click', () => {
    window.open(chrome.runtime.getURL('pages/login.html'));
  });

  botaoFechar.addEventListener('click', () => {
      containerPrincipal.remove();
      guiaInicial();
  });
}

function guiaInicial() {
    const container = document.createElement("div");
    container.classList.add("div-guia");
    document.body.appendChild(container);
    
    const botaoConfig = document.createElement("button");
    botaoConfig.innerText = "Configurar";
    botaoConfig.classList.add("botao-config");
    container.appendChild(botaoConfig);
    
    botaoConfig.addEventListener("click", () => {    
        container.style.display = "none";
    
        injetarPreLoginCSS();
    
        criarPopupPreLogin();
    });
}

guiaInicial();

// TO-DO:
// Ajustar o CSS para telas menores (responsividade); fizemo(?)
// Lógica cadastro/login (back-end);
// Sessao do usuário (manter logado);
// Fazer logout;
// Salvar preferências do usuário (local storage ou base de dados);
// Implementar funcionalidades de acessibilidade (ex: leitor de tela, ajuste de contraste, etc).
// Testes de usabilidade e acessibilidade;

// "Destruir conta"

// Grupo 4