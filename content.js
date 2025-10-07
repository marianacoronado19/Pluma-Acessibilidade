console.log("Pluma: content.js foi carregado e está ativo.");

function injetarPreLoginCSS() { // link com css do popup
  if (document.getElementById('pluma-prelogin-style')) return;

  const linkElement = document.createElement('link');
  linkElement.id = 'pluma-prelogin-style';
  linkElement.rel = 'stylesheet';
  linkElement.type = 'text/css';
  linkElement.href = chrome.runtime.getURL('prelogin.css');
  document.head.appendChild(linkElement);

  console.log("Pluma: CSS do popup injetado com sucesso.");
}

function criarPopupPreLogin() {
  if (document.getElementById('pluma-prelogin-container')) return; // se já existe, não faz nada

  // Container principal
  const containerPrincipal = document.createElement('div');
  containerPrincipal.id = 'pluma-prelogin-container';
  containerPrincipal.classList.add('prelogin-container');

  // Título
  const titulo = document.createElement('h1');
  titulo.textContent = 'Bem vindo ao PLUMA!';

  // Parágrafo principal
  const paragrafo = document.createElement('p');
  paragrafo.textContent = 'Ao configurar seu pluma, você pode deixar suas preferências salvas criando uma conta! Assim fica mais fácil acessar suas escolhas em qualquer navegador... Você deseja cadastrar-se?';

  // Div para os botões de ação inicial (Sim / Não)
  const acaoInicialContainer = document.createElement('div');
  acaoInicialContainer.classList.add('acao-inicial-container');

  const linkCadastro = document.createElement('a');
  linkCadastro.href = '#';
  linkCadastro.textContent = 'sim, cadastrar-se';
  linkCadastro.classList.add('link-texto');

  const textoOu = document.createElement('span');
  textoOu.textContent = '- ou -';
  textoOu.classList.add('texto-separador');

  const linkAnonimo = document.createElement('a');
  linkAnonimo.href = '#';
  linkAnonimo.textContent = 'não, usar anonimamente';
  linkAnonimo.classList.add('link-texto');

  acaoInicialContainer.appendChild(linkCadastro);
  acaoInicialContainer.appendChild(textoOu);
  acaoInicialContainer.appendChild(linkAnonimo);

  // Div para a seção de Login
  const loginContainer = document.createElement('div');
  loginContainer.classList.add('login-container');

  const paragrafoLogin = document.createElement('p');
  paragrafoLogin.textContent = 'Já possui um cadastro? Faça login!';

  const botaoLogin = document.createElement('button');
  botaoLogin.textContent = 'Login';
  botaoLogin.classList.add('botao-login');

  loginContainer.appendChild(paragrafoLogin);
  loginContainer.appendChild(botaoLogin);
  
  // Botão de fechar (X)
  const botaoFechar = document.createElement('span');
  botaoFechar.textContent = 'X';
  botaoFechar.classList.add('botao-fechar');
  botaoFechar.onclick = () => containerPrincipal.remove();

  // Adiciona todos os elementos ao container principal
  containerPrincipal.appendChild(botaoFechar);
  containerPrincipal.appendChild(titulo);
  containerPrincipal.appendChild(paragrafo);
  containerPrincipal.appendChild(acaoInicialContainer);
  containerPrincipal.appendChild(loginContainer);

  // Adiciona o container principal ao corpo da página
  document.body.appendChild(containerPrincipal);
}

function guiaInicial() {
    const container = document.createElement("div");
    container.classList.add("div-guia");
    document.body.appendChild(container);
    
    const botaoConfig = document.createElement("button");
    botaoConfig.innerText = "Configurar";
    botaoConfig.classList.add("botao-config");
    container.appendChild(botaoConfig);
    
    // Evento de clique que agora orquestra tudo.
    botaoConfig.addEventListener("click", () => {    
        container.style.display = "none"; // esconde a guia Bru
    
        injetarPreLoginCSS();
    
        criarPopupPreLogin();
    });
}

guiaInicial();