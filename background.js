const API_URL = "http://localhost:3000";

const THEMES_PADRAO = { 
    'text-color': '#FFFFFF', 'link-color': '#FFFF00', 'disabled-color': '#00FF00', 
    'selected-bg': '#000000', 'selected-text': '#00FFFF', 
    'button-text': '#FFFFFF', 'button-bg': '#000000', 'background-color': '#000000'
};

const DEFAULT_PREFERENCES = {
    highContrastToggle: false, 
    fontSettingsToggle: false, 
    distractionFreeToggle: false,
    keyboardNavToggle: false, 
    fontSizeFactor: 1.0,
    fontFamily: 'Atkinson Hyperlegible',
    ttsRate: 1.0, 
    ttsVolume: 1.0,
    ttsPitch: 1.0,
    ttsVoice: '',
    ...THEMES_PADRAO 
};

// Executa na instalação ou atualização: define a flag para mostrar o guia de boas-vindas e garante que as preferências padrão estejam salvas.
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install' || details.reason === 'update') {
        chrome.storage.local.set({ showWelcomeGuide: true });
        console.log(`Extensão ${details.reason}! Guia de boas-vindas será exibida.`);
        
        await chrome.storage.sync.set({ 'pluma_preferences': DEFAULT_PREFERENCES });
        console.log("Preferências padrão salvas na primeira instalação.");

    } else if (details.reason === 'update') {
        const result = await chrome.storage.sync.get('pluma_preferences');
        const existingPrefs = result.pluma_preferences || {};
        const mergedPrefs = Object.assign({}, DEFAULT_PREFERENCES, existingPrefs);

        if (JSON.stringify(mergedPrefs) !== JSON.stringify(existingPrefs)) {
             await chrome.storage.sync.set({ 'pluma_preferences': mergedPrefs });
             console.log("Preferências atualizadas com novos padrões.");
        }
    }
});

/**
 * Envia uma mensagem com o objeto de preferências para o Content Script na aba ativa para aplicação imediata.
 * @param {object} preferences - O objeto de configurações de acessibilidade.
 */
function applyPreferencesToActiveTab(preferences) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "APPLY_NEW_PREFERENCES",
                preferences: preferences
            });
            console.log("Preferências enviadas para o Content Script (Ação: APPLY_PREFERENCES).");
        }
    });
}

/**
 * Salva as preferências no armazenamento sincronizado (chrome.storage.sync) e as aplica na aba ativa.
 * @param {object} preferences - O objeto de configurações de acessibilidade.
 */
function savePreferencesToStorage(preferences) {
    const prefsToSave = preferences || {}; 

    chrome.storage.sync.set({'pluma_preferences': prefsToSave}, () => {
        console.log('Preferências salvas no chrome.storage.sync.');
        applyPreferencesToActiveTab(prefsToSave);
    });
}

/**
 * Função assíncrona que busca as preferências salvas no servidor do usuário logado e chama savePreferencesToStorage() para aplicá-las.
 * @param {string} token - O JWT do usuário.
 */
async function fetchAndApplyPreferences(token) {
    console.log("Sincronizando preferências do servidor...");
    try {
        const response = await fetch(`${API_URL}/preferences/fetch`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const fetchedPrefs = data.preferences || {};
            savePreferencesToStorage(fetchedPrefs);
            return { success: true, preferences: fetchedPrefs, message: "Preferências sincronizadas com o servidor." };
        } else {
            console.error("Erro ao buscar preferências:", data.message);
            chrome.storage.sync.get('pluma_preferences', (localData) => {
                applyPreferencesToActiveTab(localData.pluma_preferences || {});
            });
            return { success: false, message: data.message || "Erro desconhecido ao buscar preferências." };
        }
    } catch (error) {
        console.error('Erro de rede ao buscar preferências:', error);
        return { success: false, message: "Erro de conexão com o servidor. Verifique se o backend está rodando." };
    }
}

/**
 * Função assíncrona que envia as preferências atuais para o servidor do PLUMA para salvamento no perfil do usuário.
 * @param {string} token - O JWT do usuário.
 * @param {object} preferences - O objeto de configurações de acessibilidade.
 */
async function savePreferencesToServer(token, preferences) {
    try {
        const response = await fetch(`${API_URL}/preferences/save`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ preferences })
        });
        
        const data = await response.json();
        return { success: response.ok, message: data.message };
    } catch (error) {
        console.error('Erro de rede ao salvar preferências:', error);
        return { success: false, message: "Erro de conexão com o servidor." };
    }
}

/**
 * Carrega as preferências, inverte o valor de um toggle específico (pela chave key) e salva o estado atualizado.
* @param {string} key - A chave do toggle (ex: 'highContrastToggle').
*/
function togglePreferenceAndSave(key) {
    chrome.storage.sync.get('pluma_preferences', (data) => {
        const prefs = data.pluma_preferences || {};
        prefs[key] = !prefs[key]; 

        savePreferencesToStorage(prefs);
    });
}

/**
 * Envia um comando de ação (ex: iniciar TTS, parar TTS) para o Content Script da aba ativa.
 * @param {string} action - A ação a ser executada (ex: 'INICIAR', 'PARAR').
 */
function executeActionInActiveTab(action) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action });
            console.log(`Comando global enviado para o Content Script: ${action}`);
        }
    });
}

// Escuta os atalhos de teclado globais definidos no manifest.json, como abrir configurações ou alternar alto contraste.
chrome.commands.onCommand.addListener(function(command) {
    console.log("Comando de teclado recebido:", command);
        
    chrome.storage.sync.get('pluma_preferences', (data) => {
        const prefs = data.pluma_preferences || {};

        switch (command) {
            case "open-config":
                // Alt + A
                const configPageUrl = chrome.runtime.getURL("pages/configs.html");
                chrome.tabs.create({ url: configPageUrl });
                console.log(`Configurações Pluma abertas: ${configPageUrl}`);
                break;

            case "toggle-high-contrast":
                // Alt + C
                togglePreferenceAndSave("highContrastToggle"); 
                break;
                
            case "start-tts":
                // Ctrl + Shift + L (Inicia/Pausa a leitura)
                executeActionInActiveTab("START_PAUSE_TTS"); 
                break;

            case "stop-tts":
                // Ctrl + Shift + X (Para a leitura)
                executeActionInActiveTab("STOP_TTS"); 
                break;
                
            default:
                console.warn(`Comando não tratado: ${command}`);
        }
        return true;
    });
});

// Ouve mensagens de outros scripts (Content/Popup) para lidar com eventos críticos de Login, Logout, Sincronização, Status e Comandos de Recarga/TTS.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    chrome.storage.local.get(['pluma_token', 'pluma_userId'], async (data) => {
        const token = data.pluma_token;
        
        try {
            if (request.action === 'USER_LOGIN') {
                const { email, password } = request;
                
                const loginResponse = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });

                const loginData = await loginResponse.json();
                
                if (loginResponse.ok) {
                    const { token, userId } = loginData;
                    
                    await chrome.storage.local.set({ 
                        'pluma_token': token, 
                        'pluma_userId': userId 
                    });
                    console.log("Token de login salvo.");

                    const syncResult = await fetchAndApplyPreferences(token);
                    
                    sendResponse({ 
                        success: true, 
                        message: "Login e sincronização concluídos!", 
                        preferences: syncResult.preferences 
                    });
                    
                } else {
                    sendResponse({ success: false, message: loginData.message || "Erro desconhecido no login." });
                }
                
            } else if (request.action === 'USER_LOGOUT') {
                
                await chrome.storage.local.remove(['pluma_token', 'pluma_userId']);
                
                const emptyPrefs = {};
                await chrome.storage.sync.set({'pluma_preferences': emptyPrefs});

                applyPreferencesToActiveTab(emptyPrefs); 
                
                sendResponse({ success: true, message: "Logout realizado com sucesso." });

            } else if (request.action === 'SAVE_PREFERENCES') {
                
                savePreferencesToStorage(request.preferences); 
                
                let serverMessage = "Preferências salvas localmente (usuário offline).";
                
                if (token) {
                    const serverResult = await savePreferencesToServer(token, request.preferences);
                    serverMessage = serverResult.message;
                }
                
                sendResponse({ success: true, message: serverMessage });
            
            } else if (request.action === 'GET_AUTH_STATUS') {
                
                sendResponse({ 
                    isLoggedIn: !!token, 
                    userId: data.pluma_userId 
                });
            
            } else if (request.action === "RELOAD_CURRENT_TAB") {
                
                if (sender.tab && sender.tab.id) {
                    chrome.tabs.reload(sender.tab.id, { bypassCache: true });
                    console.log("Aba recarregada para forçar o content script a mostrar o ícone do Pluma.");
                }
                sendResponse({ status: "Tab reload command sent" });

            } else if (request.action === 'INICIAR') { 
                executeActionInActiveTab("START_PAUSE_TTS");
                sendResponse({ success: true, message: "Comando de leitura enviado para a aba ativa." });
                return true;
                
            } else if (request.action === 'PARAR') { 
                executeActionInActiveTab("STOP_TTS");
                sendResponse({ success: true, message: "Comando de parada enviado para a aba ativa." });
                return true;

            } else {
                sendResponse({ success: false, message: "Ação não reconhecida." });
            }
            
        } catch (error) {
            console.error('Erro no Listener de Mensagens:', error);
            sendResponse({ success: false, message: "Erro interno do Service Worker." });
        }
        
        return true; 
    });
    
    return true;
});