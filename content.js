let isKeyboardNavActive = false;

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
  linkAnonimo.target = '_blank';  

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
  // botaoFechar.onclick = () => containerPrincipal.remove();

  containerPrincipal.appendChild(botaoFechar);
  containerPrincipal.appendChild(titulo);
  containerPrincipal.appendChild(paragrafo);
  containerPrincipal.appendChild(acaoInicialContainer);
  containerPrincipal.appendChild(loginContainer);

  document.body.appendChild(containerPrincipal);

  function handleLinkClick(event) {
      containerPrincipal.remove();
      chrome.runtime.sendMessage({ action: "RELOAD_CURRENT_TAB" });
  }

  linkCadastro.addEventListener('click', handleLinkClick);

  linkAnonimo.addEventListener('click', handleLinkClick);

  botaoLogin.addEventListener('click', () => {
    window.open(chrome.runtime.getURL('pages/login.html'), '_blank');
    
    containerPrincipal.remove();
    chrome.runtime.sendMessage({ action: "RELOAD_CURRENT_TAB" });
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

  logoPluma.addEventListener('click', () => {
    const configPageURL = chrome.runtime.getURL("pages/configs.html");

    window.open(configPageURL, '_blank'); 
});
}

/**
 * Aplica as variáveis CSS (cores, fontes) e o estado dos toggles na página web.
 * @param {object} prefs - Objeto de preferências de acessibilidade.
 */
function applyAccessibilitySettings(prefs) {
    const root = document.documentElement;

    if (prefs.highContrastToggle) {
        root.classList.add('pluma-high-contrast-active');
    } else {
        root.classList.remove('pluma-high-contrast-active');
    }

    for (const [property, value] of Object.entries(prefs)) {
        if (typeof value === 'boolean') continue;
        root.style.setProperty(`--${property}`, value);
    }
    
    if (prefs.fontSettingsToggle) {
        if (prefs.fontSizeFactor) {
            root.style.setProperty(`--font-size-factor`, prefs.fontSizeFactor);
        }
        
        if (prefs.fontFamily) {
            root.style.setProperty(`--pluma-font-family`, prefs.fontFamily);
        }
        
    } else {
        root.style.removeProperty('--font-size-factor');
        root.style.removeProperty('--pluma-font-family');
    } 
    isKeyboardNavActive = prefs.keyboardNavToggle || false;  
}

/**
 * Encontra e foca no próximo elemento do tipo especificado (heading ou link).
 * @param {string} type - 'heading' ou 'link'.
 */
function navigateToNextElement(type) {
    if (!isKeyboardNavActive) return;

    const selectors = {
        'heading': 'h1, h2, h3, h4, h5, h6',
        'link': 'a[href]'
    };
    
    const elements = Array.from(document.querySelectorAll(selectors[type]));
    if (elements.length === 0) return;

    const focusedElement = document.activeElement;
    let nextIndex = 0;
    
    if (focusedElement && focusedElement.matches(selectors[type])) {
        const currentIndex = elements.indexOf(focusedElement);
        nextIndex = currentIndex + 1;
        
        if (nextIndex >= elements.length) {
            nextIndex = 0;
        }
    }
    
    const nextElement = elements[nextIndex];
    if (nextElement) {
        if (!nextElement.hasAttribute('tabindex')) {
            nextElement.setAttribute('tabindex', '0'); 
        }
        nextElement.focus();
        
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function handleGlobalKeyboardNavigation(event) {
    if (!isKeyboardNavActive) return;

    const isCtrlShift = event.ctrlKey && event.shiftKey && !event.altKey;

    let commandHandled = false;

    if (isCtrlShift) {
        if (event.key === '.') {
            navigateToNextElement('heading');
            commandHandled = true;
        } else if (event.key === ',') {
            navigateToNextElement('link');
            commandHandled = true;
        }
    }

    if (commandHandled) {
        event.preventDefault(); 
        event.stopPropagation();
    }
}


    
//     if (prefs.distractionFreeToggle) {
//         // Adiciona a classe que o seu acessibility.css usará para esconder elementos
//         root.classList.add('pluma-distraction-free-active');
//     } else {
//         root.classList.remove('pluma-distraction-free-active');
//     }
// }

// MODIFICAÇÃO ---------------------------------------------------------
// Ouve o Service Worker (background.js) para mensagens de atualização em tempo real
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.action === "APPLY_SETTINGS") {
//             // Esta é a chamada de ATUALIZAÇÃO que o background.js usa no login/logout/save.
//             applyAccessibilitySettings(request.preferences || {}); // Garante um objeto para limpeza
//             sendResponse({status: "Setting applied to content"});
//         }
//     }
// );

// // Tenta aplicar as configurações no CARREGAMENTO INICIAL da página
// chrome.storage.sync.get('pluma_preferences', (data) => {
//     // Se houverem preferências no cache sincronizado, aplique-as
//     if (data.pluma_preferences) {
//         applyAccessibilitySettings(data.pluma_preferences);
//     } 
//     // Se data.pluma_preferences for null ou undefined, a função fará a limpeza (se estiver bem escrita).
// });
// MODIFICAÇÃO ---------------------------------------------------------

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

function checkAndDisplayInitialUI() {
    chrome.storage.local.get('showWelcomeGuide', (data) => {
        if (data.showWelcomeGuide) {
            guiaInicial();
            
            chrome.storage.local.set({ showWelcomeGuide: false });
            console.log("Guia de boas-vindas exibida. Flag resetada.");
        } else {
            popupPluma();
            console.log("Guia já exibida. Exibindo ícone flutuante.");
        }
    });
}

let currentSpeech = null;
let ttsSettings = {
    rate: 1.0, 
    volume: 1.0, 
    pitch: 1.0, 
    voice: null 
};
 
function iniciarLeitura() {
    const selection = window.getSelection();
    let text = selection.toString().trim();
 
    if (!text) {
        console.log("Nenhum texto selecionado para leitura.");
        return;
    }
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    currentSpeech = new SpeechSynthesisUtterance(text);
    currentSpeech.rate = ttsSettings.rate;
    currentSpeech.volume = ttsSettings.volume;
    currentSpeech.pitch = ttsSettings.pitch; 
    if (ttsSettings.voice) {
        currentSpeech.voice = ttsSettings.voice;
    }
 
    speechSynthesis.speak(currentSpeech);
    console.log("Leitura iniciada:", currentSpeech);
}
 
function pausarLeitura() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        console.log("Leitura pausada.");
    }
}
 
function pararLeitura() {
    if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
        currentSpeech = null;
        console.log("Leitura parada.");
    }
}
 
function updateTtsSettings(prefs) {
    ttsSettings.rate = prefs.ttsRate || 1.0;
    ttsSettings.volume = prefs.ttsVolume || 1.0;
    ttsSettings.pitch = prefs.ttsPitch || 1.0;
    const selectedVoiceName = prefs.ttsVoice;
    if (selectedVoiceName) {
        const voices = window.speechSynthesis.getVoices();
        ttsSettings.voice = voices.find(v => v.name === selectedVoiceName) || null;
    }
 
    console.log("Configurações TTS atualizadas:", ttsSettings);
}
 
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "APPLY_NEW_PREFERENCES") {
        applyAccessibilitySettings(request.preferences);
        updateTtsSettings(request.preferences); 
        sendResponse({status: "Settings applied to content"});
        return true;
      }
      
      if (request.action === 'START_PAUSE_TTS') {
          if (speechSynthesis.paused) {
              speechSynthesis.resume();
              console.log("Leitura retomada pelo atalho.");
          } else if (speechSynthesis.speaking) {
              speechSynthesis.pause();
              console.log("Leitura pausada pelo atalho.");
          } else {
              iniciarLeitura();
          }
      } else if (request.action === 'STOP_TTS') {
          pararLeitura();
      }
      
      if (request.action === 'INICIAR') {
          iniciarLeitura();
      } else if (request.action === 'PAUSAR') {
          pausarLeitura();
      } else if (request.action === 'PARAR') {
          pararLeitura();
      }

      return true;
    }
);

 
chrome.storage.sync.get('pluma_preferences', (data) => {
    if (data.pluma_preferences) {
        updateTtsSettings(data.pluma_preferences); 
    }
});

injectGoogleFont();
checkAndDisplayInitialUI();
document.addEventListener('keydown', handleGlobalKeyboardNavigation, true);



// TO-DO:
// Ajustar o CSS para telas menores (responsividade); fizemos(?)

// Salvar preferências do usuário (local storage ou base de dados);
// Implementar funcionalidade: modo sem distrações;
// - Trabalhando em: cores +
// telefone só aceita números + formatação (xx) xxxxx-xxxx
// SLIDERS
// PREVISÃO FORMATO DA FONTE

// "Destruir conta" -> página de configurações do usuário;

// Grupo 4