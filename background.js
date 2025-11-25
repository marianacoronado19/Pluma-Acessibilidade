// chrome.runtime.onInstalled.addListener((details) => {
//   if (details.reason === 'install') {
//     chrome.storage.local.set({ showWelcomeGuide: true });
//     console.log("Extensão instalada! Guia de boas-vindas será exibida.");
//   }
// });

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.action === "RELOAD_CURRENT_TAB") {
//             if (sender.tab && sender.tab.id) {
//                 chrome.tabs.reload(sender.tab.id, { bypassCache: true });
//                 console.log("Aba recarregada para forçar o content script a mostrar o ícone do Pluma.");
//             }
//             sendResponse({ status: "Tab reload command sent" });
//             return true;
//         }
//     }
// );

// MODIFICAÇÃO ---------------------------------------------------------

// background.js

// URL da sua API de backend
const API_URL = "http://localhost:3000";

// O listener de instalação deve permanecer
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ showWelcomeGuide: true });
    console.log("Extensão instalada! Guia de boas-vindas será exibida.");
  }
});


// ----------------------------------------------------------------------
// FUNÇÕES DE SINCRONIZAÇÃO E APLICAÇÃO DE PREFERÊNCIAS
// ----------------------------------------------------------------------

/**
 * Envia uma mensagem para o content script da aba ativa para aplicar as configurações.
 * @param {object} preferences - O objeto de configurações de acessibilidade.
 */
function applyPreferencesToActiveTab(preferences) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
            // Usa chrome.tabs.sendMessage para enviar ao content.js da aba atual
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "APPLY_NEW_PREFERENCES",
                preferences: preferences
            });
            console.log("Preferências enviadas para o Content Script (Ação: APPLY_PREFERENCES).");
        }
    });
}

/**
 * Salva as preferências no chrome.storage.sync (cache rápido e sincronizado)
 * e aplica imediatamente na aba ativa.
 * @param {object} preferences - O objeto de configurações de acessibilidade.
 */
function savePreferencesToStorage(preferences) {
    // Garante que o objeto de preferências não é nulo/vazio antes de salvar
    const prefsToSave = preferences || {}; 

    chrome.storage.sync.set({'pluma_preferences': prefsToSave}, () => {
        console.log('Preferências salvas no chrome.storage.sync.');
        // Aplica o que foi salvo (crucial para o login)
        applyPreferencesToActiveTab(prefsToSave);
    });
}


// ----------------------------------------------------------------------
// COMUNICAÇÃO COM A API DE BACKEND 
// ----------------------------------------------------------------------

/**
 * Busca as preferências do servidor, salva no storage e aplica.
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
            // Salva no cache e aplica na aba ativa
            savePreferencesToStorage(fetchedPrefs);
            return { success: true, preferences: fetchedPrefs, message: "Preferências sincronizadas com o servidor." };
        } else {
            console.error("Erro ao buscar preferências:", data.message);
            // Mesmo com erro, tenta aplicar o que já está no cache local (se houver)
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
 * Salva as preferências atuais no servidor.
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
* Alterna o valor de um toggle salvo no storage e aplica as novas preferências.
* @param {string} key - A chave do toggle (ex: 'highContrastToggle').
*/
function togglePreferenceAndSave(key) {
    chrome.storage.sync.get('pluma_preferences', (data) => {
        const prefs = data.pluma_preferences || {};
        // Alterna o valor: se for true, vira false; se não for true, vira true.
        prefs[key] = !prefs[key]; 

        // Salva no storage e aplica imediatamente na aba ativa.
        savePreferencesToStorage(prefs);
    });
}

/**
 * Envia uma ação simples (sem objeto de preferências) para o content.js da aba ativa.
 * Usado principalmente para comandos de TTS.
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



// Listener principal para comandos de teclado. (Definidos no manifest.json)
chrome.commands.onCommand.addListener(function(command) {
    console.log("Comando de teclado recebido:", command);
        
    // 1. OBTÉM AS PREFERÊNCIAS DO STORAGE
    chrome.storage.sync.get('pluma_preferences', (data) => {
        const prefs = data.pluma_preferences || {};
        
        // Define quais comandos DEVEM SER CONTROLADOS pelo keyboardNavToggle
        const ttsCommands = ["start-tts", "stop-tts"];
        
        // SE o comando for de TTS E a Navegação por Teclado estiver DESATIVADA (false ou undefined),
        // interrompe a execução.
        if (keyboardNavCommands.includes(command) && !prefs.keyboardNavToggle) {
             console.log(`Comando '${command}' ignorado: Navegação por Teclado desativada.`);
             // Se o TTS tiver um toggle próprio e você quiser controlá-lo por ele:
             // if (ttsCommands.includes(command) && !prefs.ttsToggle) return; 
             return; 
        }

    switch (command) {
        case "open-config":
            // Alt + A (Abre a página de configurações)
            // Usa getURL para pegar o caminho correto da sua options_page
            const configPageUrl = chrome.runtime.getURL("pages/configs.html");
            chrome.tabs.create({ url: configPageUrl });
            console.log(`Configurações Pluma abertas: ${configPageUrl}`);
            break;

        case "toggle-high-contrast":
            // Alt + C (Alterna o Alto Contraste)
            // CHAVE CORRETA: Presumindo que sua chave é 'highContrastToggle'
            togglePreferenceAndSave("highContrastToggle"); 
            break;
            
        case "start-tts":
            // Ctrl + Shift + L (Inicia/Pausa a leitura)
            // AÇÃO CORRETA: Presumindo que seu content.js usa 'INICIAR'
            executeActionInActiveTab("INICIAR"); 
            break;

        case "stop-tts":
            // Ctrl + Shift + X (Para a leitura)
            // AÇÃO CORRETA: Presumindo que seu content.js usa 'PARAR'
            executeActionInActiveTab("PARAR"); 
            break;
            
        default:
            console.warn(`Comando não tratado: ${command}`);
    }
});


// ----------------------------------------------------------------------
// LISTENER PRINCIPAL DE MENSAGENS (COMUNICAÇÃO COM options.js, popup, etc.)
// ----------------------------------------------------------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Todas as operações que requerem autenticação precisam buscar o token primeiro
    chrome.storage.local.get(['pluma_token', 'pluma_userId'], async (data) => {
        const token = data.pluma_token;
        
        try {
            if (request.action === 'USER_LOGIN') {
                const { email, password } = request;
                
                // 1. Tenta fazer login na API
                const loginResponse = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });

                const loginData = await loginResponse.json();
                
                if (loginResponse.ok) {
                    // 2. Login bem-sucedido: Salva token e ID localmente
                    const { token, userId } = loginData; // Assume que o backend retorna token e userId
                    
                    await chrome.storage.local.set({ 
                        'pluma_token': token, 
                        'pluma_userId': userId 
                    });
                    console.log("Token de login salvo.");

                    // 3. SINCRONIZA E APLICA as preferências salvas no servidor.
                    // ESTE PASSO RESOLVE A PERSISTÊNCIA APÓS O LOGIN.
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
                
                // 1. Limpa o token e o ID do usuário
                await chrome.storage.local.remove(['pluma_token', 'pluma_userId']);
                
                // 2. Limpa as preferências no cache (objeto vazio)
                const emptyPrefs = {};
                await chrome.storage.sync.set({'pluma_preferences': emptyPrefs});

                // 3. Aplica o objeto vazio para limpar imediatamente os estilos na aba ativa
                applyPreferencesToActiveTab(emptyPrefs); // <-- GARANTE O LIMPEZA VISUAL
                
                sendResponse({ success: true, message: "Logout realizado com sucesso." });

            } else if (request.action === 'SAVE_PREFERENCES') {
                
                // 1. Salva no cache local/sync e aplica imediatamente
                savePreferencesToStorage(request.preferences); 
                
                let serverMessage = "Preferências salvas localmente (usuário offline).";
                
                if (token) {
                    // 2. Se logado, salva no servidor para persistência
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

            } else {
                sendResponse({ success: false, message: "Ação não reconhecida." });
            }
            
        } catch (error) {
            console.error('Erro no Listener de Mensagens:', error);
            sendResponse({ success: false, message: "Erro interno do Service Worker." });
        }
        
        return true; // Indica que sendResponse será chamado assincronamente
    });
    
    return true; // Obrigatório para a natureza assíncrona do listener
});