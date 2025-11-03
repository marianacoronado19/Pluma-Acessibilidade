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
  
  const balaoContainer = document.createElement("div");
  balaoContainer.classList.add("div-balao");
  balaoContainer.style.backgroundImage = `url(${chrome.runtime.getURL("images/assistente/balao_fala_vazio.png")})`;
  container.appendChild(balaoContainer);

  const textoBalao = document.createElement("p");
  textoBalao.classList.add("texto-balao");
  textoBalao.innerHTML = 'Olá, eu sou a Bru, sua assistente de acessibilidade! <br>Aqui, vou te ajudar a deixar os sites com a sua cara! <br>Vamos começar?';
  balaoContainer.appendChild(textoBalao);
  
  const botaoConfig = document.createElement("button");
  botaoConfig.innerText = "Configurar";
  botaoConfig.classList.add("botao-config");
  balaoContainer.appendChild(botaoConfig); 
  
  const imagemBru = document.createElement("img");
  imagemBru.src = chrome.runtime.getURL('images/assistente/guia_bru.png'); 
  imagemBru.alt = "Bru, sua assistente de acessibilidade.";
  imagemBru.classList.add("imagem-bru");
  container.appendChild(imagemBru);
  
  botaoConfig.addEventListener("click", () => {    
      container.style.display = "none";
  
      injetarPreLoginCSS();
  
      criarPopupPreLogin();
  });
}

function popupPluma() {
  const container = document.createElement("div");
  container.classList.add("div-guia-popup");
  document.body.appendChild(container);

  const logoPluma = document.createElement("img");
  logoPluma.src = chrome.runtime.getURL("images/logoPluma/icon-qualidade.png")
  logoPluma.classList.add("logo-pluma")
  container.appendChild(logoPluma)

//   logoPluma.addEventListener('click', () => {
//     const configPageURL = chrome.runtime.getURL("pages/configs.html");

//     window.open(configPageURL, '_blank'); 
// });
}

/**
 * Aplica as variáveis CSS (cores, fontes) e o estado dos toggles na página web.
 * @param {object} prefs - Objeto de preferências de acessibilidade.
 */
function applyAccessibilitySettings(prefs) {
    const root = document.documentElement;

    // 1. Lógica de Alto Contraste (Cores)
    // Aplica a classe (que lida com o CSS das cores) SÓ se o toggle estiver ligado
    if (prefs.highContrastToggle) {
        root.classList.add('pluma-high-contrast-active');
    } else {
        root.classList.remove('pluma-high-contrast-active');
    }

    // 2. Aplicação das variáveis CSS (Cores)
    // Aplica as variáveis de cor (independente do toggle, para que o pluma-high-contrast-active as use)
    for (const [property, value] of Object.entries(prefs)) {
        // Ignora valores booleanos (que são os toggles)
        if (typeof value === 'boolean') continue;

        // Note: Se a cor é uma variável, ela sempre é injetada
        root.style.setProperty(`--${property}`, value);
    }
    
    // --- NOVO: Lógica das Configurações de Fonte ---
    
    // 3. Aplicação do Tamanho e Estilo da Fonte (CONDICIONAL)
    if (prefs.fontSettingsToggle) {
        // Aplica o Fator de Tamanho da Fonte (ex: 1.5)
        if (prefs.fontSizeFactor) {
            root.style.setProperty(`--font-size-factor`, prefs.fontSizeFactor);
        }
        
        // Aplica o Estilo da Família da Fonte (ex: Atkinson Hyperlegible)
        if (prefs.fontFamily) {
            root.style.setProperty(`--pluma-font-family`, prefs.fontFamily);
        }
        
    } else {
        // Se o toggle de Fontes estiver DESLIGADO, remove ou reseta as variáveis
        root.style.removeProperty('--font-size-factor');
        root.style.removeProperty('--pluma-font-family');
    }
    
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "APPLY_NEW_PREFERENCES") {
        applyAccessibilitySettings(request.preferences);
        sendResponse({status: "Setting applied to content"});
      }
    }
);

chrome.storage.sync.get('pluma_preferences', (data) => {
    if (data.pluma_preferences) {
        applyAccessibilitySettings(data.pluma_preferences);
    }
});

function injectGoogleFont() {
    const fontId = 'pluma-atkinson-font';
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    
    link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'; 
    
    document.head.appendChild(link);
}


// popupPluma();

injectGoogleFont();

guiaInicial();




// TO-DO:
// Ajustar o CSS para telas menores (responsividade); fizemo(?)

// Salvar preferências do usuário (local storage ou base de dados);
// Implementar funcionalidades de acessibilidade (ex: leitor de tela, ajuste de contraste, etc).
// - Trabalhando em: cores + tamanho da fonte
// Testes de usabilidade e acessibilidade;

// "Destruir conta"

// Grupo 4