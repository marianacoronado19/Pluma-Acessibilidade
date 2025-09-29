const GUIDA_CONTAINER_ID = 'pluma-guia-container';
const CONFIG_BUTTON_ID = 'config-button';

function injectGuiaAndBubble() {
    
    const guiaImgSrc = chrome.runtime.getURL('images/assistente/guia_bru.png'); 
    const balaoImgSrc = chrome.runtime.getURL('images/assistente/balao_fala.png');

    const htmlContent = `
        <div id="${GUIDA_CONTAINER_ID}" class="div-guia">
            <div class="balao-div" style="background-image: url('${balaoImgSrc}');">
                <div class="div-fala">
                    <p class="fala-balao">Olá, eu sou a Bru, sua assistente de acessibilidade! Aqui, vou te ajudar a deixar os sites com a sua cara! Vamos começar?</p>  
                </div>                

                <button id="${CONFIG_BUTTON_ID}" class="config-button">Configurar</button>
            </div>
            
            <img src="${guiaImgSrc}" class="guia-pluma" alt="Assistente Bru">

        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', htmlContent);

    addEventListeners();
}

function addEventListeners() {
    document.getElementById(CONFIG_BUTTON_ID).addEventListener('click', showPreLoginModal);
    // Você pode adicionar ouvintes para outros elementos aqui, se necessário.
}

// --- 4. Função para Mostrar o Modal de Pré-Login (Continuação da Lógica) ---
function showPreLoginModal() {
    
    // **Ajuste:** Esconder o balão (mas manter a Bru)
    document.querySelector('.balao-div').style.display = 'none';

    // (Aqui você injetaria o HTML do seu Modal de Pré-Login, 
    // e adicionaria os ouvintes para 'Fazer Login' e 'Anônimo' que enviariam mensagens.)
    
    // EX:
    // document.getElementById('login-btn').addEventListener('click', () => {
    //    chrome.runtime.sendMessage({ action: "openLogin" });
    //    // Remover o modal
    // });
}

// --- 5. Inicialização ---
// Executa a injeção assim que o content script é carregado
injectGuiaAndBubble();