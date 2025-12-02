let currentPlumaPreferences = {};

function injetarPreLoginCSS() { 
// Injeta a folha de estilos CSS necessária para o popup de pré-login, verificando se já foi adicionada.
    if (document.getElementById('pluma-prelogin-style')) return;

    const linkElement = document.createElement('link');
    linkElement.id = 'pluma-prelogin-style';
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = chrome.runtime.getURL('stylesheets/prelogin.css');
    document.head.appendChild(linkElement);
}

function criarPopupPreLogin() {
// Cria e exibe o modal de pré-login para que o usuário escolha entre cadastrar, fazer login ou usar anonimamente. Remove-se após a escolha e solicita a recarga da página.
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
// Exibe o guia de boas-vindas com a assistente "Bru" e um botão que aciona o popup de pré-login.
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
// Cria e exibe o ícone flutuante do PLUMA na página; ao ser clicado, abre a página de configurações em uma nova aba.
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
 * Move o foco de acessibilidade para o próximo elemento do tipo especificado (heading ou link) na página e rola para a visualização.
 * @param {string} type - 'heading' ou 'link'.
 */
function navigateToNextElement(type) {
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
// Gerencia atalhos de teclado globais (Ctrl+Shift+. para cabeçalhos e Ctrl+Shift+, para links) usando MapsToNextElement().
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

function isPlumaElement(element) {
// Verifica se um elemento HTML pertence à interface de usuário (UI) da própria extensão PLUMA, para evitar ocultá-lo.
    if (!element || !element.closest) return false;
    return element.closest('.div-guia-popup, .div-guia, .prelogin-container');
}

/**
 * Oculta anúncios na página web usando seletores CSS se o modo sem distrações estiver ativo.
 * @param {boolean} isActive - Se o modo sem anúncios está ativo (vindo de prefs.distractionFreeToggle).
 */
function applyAdFreeMode(isActive) {
    if (!isActive) {
        return;
    }

    const currentHostname = window.location.hostname;
    if (currentHostname.includes('youtube.com')) {
        console.log("[Pluma Ad-Free] YouTube detectado. Modo sem anúncios desativado.");
        return; 
    }

    const adSelectors = [
        // IFRAMES: O principal vetor de anúncios, geralmente tem 'ad' na URL.
        'iframe[src*="ad"]',
        
        // ELEMENTOS DE ANÚNCIO PADRÃO (AdSense, etc.)
        '.adsbygoogle',                   
        '.ad-container', 
        '.ad-box', 
        '.advertisement', 
        '.promo', 
        '[data-ad-slot]', 
        '[data-google-query-id]',
        
        // ELEMENTOS COM ID OU CLASSE MUITO ESPECÍFICA (e.g., 'ad-slot', 'ad-wrapper')
        // *Somente* os que contêm 'ad-' ou '-ad-' ou 'banner-' no INÍCIO ou FIM do nome (evitando meio).
        'div[class^="ad-"]', 'div[class*=" ad-"]', 
        'div[class$="-ad"]', 'div[class*=" -ad"]',
        'div[id^="ad-"]', 'div[id*=" ad-"]', 
        'div[id$="-ad"]', 'div[id*=" -ad"]',
        'div[id*="banner-"]', 'div[class*="banner-"]'
    ];

    adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            // ** VERIFICAÇÃO DE EXCLUSÃO **
            if (isPlumaElement(element)) {
                return; // Não esconde elementos da própria UI
            }
            
            element.style.setProperty('display', 'none', 'important');
        });
    });
}

/**
 * Aplica todas as preferências de acessibilidade (cores, contraste, fontes) como variáveis CSS na página.
 * @param {object} prefs - Objeto de preferências de acessibilidade.
 */
function applyAccessibilitySettings(prefs) {
    const root = document.documentElement;

    if (prefs.highContrastToggle) {
        root.classList.add('pluma-high-contrast-active');
    } else {
        root.classList.remove('pluma-high-contrast-active');
    }
    

    applyAdFreeMode(prefs.distractionFreeToggle); 
    
    currentPlumaPreferences = prefs;

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
}

function setupMutationObserver() {
// Configura um observador de mutação para monitorar novos elementos no DOM e aplicar o modo sem anúncios dinamicamente.
    const observer = new MutationObserver((mutationsList, observer) => {
        if (currentPlumaPreferences.distractionFreeToggle) {
            applyAdFreeMode(true);
        }
    });

    const config = { childList: true, subtree: true };

    if (document.body) {
        observer.observe(document.body, config);
    } else {
        observer.observe(document.documentElement, config);
    }
    console.log("[Pluma] MutationObserver configurado para Ad-Free Mode.");
}

let currentSpeech = null;
let ttsSettings = {
    rate: 1.0, 
    volume: 1.0, 
    pitch: 1.0, 
    voice: null 
};
 
function iniciarLeitura() {
// Inicia a leitura em voz alta (TTS) do texto atualmente selecionado, aplicando as configurações de voz salvas.
    speechSynthesis.cancel(); 
    
    const selection = window.getSelection();
    let text = selection.toString().trim();
 
    if (!text) {
        console.log("Nenhum texto selecionado para leitura.");
        return;
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
// Pausa a leitura em voz alta que está em andamento.
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        console.log("Leitura pausada.");
    }
}
 
function pararLeitura() {
// Para e cancela completamente qualquer leitura em voz alta.
    if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
        currentSpeech = null;
        console.log("Leitura parada.");
    }
}
 
function updateTtsSettings(prefs) {
// Atualiza as configurações globais de Text-to-Speech (ttsSettings) com as preferências salvas (velocidade, tom, volume e voz).
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

function injectGoogleFont() {
// Injeta o link para a fonte "Atkinson Hyperlegible" do Google Fonts no cabeçalho do documento.
    const fontId = 'pluma-atkinson-font';
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    
    link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap'; 
    
    document.head.appendChild(link);
}

function loadAndApplyInitialPreferences() {
// Carrega as preferências de acessibilidade e TTS salvas no chrome.storage.sync e as aplica na inicialização.
    chrome.storage.sync.get('pluma_preferences', (data) => {
        if (data.pluma_preferences) {
            applyAccessibilitySettings(data.pluma_preferences); 
            updateTtsSettings(data.pluma_preferences); 
        }
    });
}

function checkAndDisplayInitialUI() {
// Decide se deve exibir o guia inicial de boas-vindas (primeira vez) ou apenas o ícone flutuante do PLUMA (após a primeira vez).
    chrome.storage.local.get('showWelcomeGuide', (data) => {
        if (data.showWelcomeGuide === true || data.showWelcomeGuide === undefined) { 
            guiaInicial(); // Chama a Bru e o balão
            
            // Define explicitamente como false para as próximas vezes
            chrome.storage.local.set({ showWelcomeGuide: false });
            console.log("Guia de boas-vindas exibida. Flag resetada.");
        } else {
            popupPluma(); // Chama apenas o ícone
            console.log("Guia já exibida. Exibindo ícone flutuante.");
        }
    });
}

function initializePlumaUI() {
// Função principal de inicialização do content script: carrega fontes, aplica preferências, configura observadores e injeta a UI inicial.
    console.log("[Pluma] Iniciando lógica principal (aplicação de estilos e observadores)...");
    
    injectGoogleFont();
    
    loadAndApplyInitialPreferences();
    
    document.addEventListener('keydown', handleGlobalKeyboardNavigation, true);

    setupMutationObserver();

    setTimeout(() => {
        if (document.body) {
            checkAndDisplayInitialUI();
            console.log("[Pluma] UI (Logo/Guia) injetada com atraso seguro (100ms).");
        } else {
            console.warn("[Pluma] Falha ao injetar UI: document.body ausente após 100ms.");
        }
    }, 100); 
}

initializePlumaUI();