const THEMES = {
    'padrao': { 
        'text-color': '#FFFFFF', 'link-color': '#FFFF00', 'disabled-color': '#00FF00', 
        'selected-bg': '#000000', 'selected-text': '#00FFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#000000', 'background-color': '#000000'
    },
    'leitura': { 
        'text-color': '#2C1E1E', 'link-color': '#663300', 'disabled-color': '#A58E83', 
        'selected-bg': '#663300', 'selected-text': '#FFFFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#663300', 'background-color': '#F5E6B5'
    },
    'contraste-claro': { 
        'text-color': '#000000', 'link-color': '#0000FF', 'disabled-color': '#B0B0B0', 
        'selected-bg': '#008000', 'selected-text': '#FFFFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#008000', 'background-color': '#FFFFFF'
    },
    'contraste-escuro': {
        'text-color': '#FFFF00', 'link-color': '#00FFFF', 'disabled-color': '#FF00FF', 
        'selected-bg': '#FF00FF', 'selected-text': '#000000', 
        'button-text': '#000000', 'button-bg': '#FFFF00', 'background-color': '#000000'
    }
};

const DEFAULT_FONT_SIZE_FACTOR = 1.0; 

// Função assíncrona que carrega as preferências salvas em chrome.storage.sync ou retorna as preferências padrão.
async function loadPreferences() {
    const defaultPreferences = { 
        highContrastToggle: false, 
        fontSettingsToggle: false, 
        distractionFreeToggle: false,
        keyboardNavToggle: false, 
        fontSizeFactor: DEFAULT_FONT_SIZE_FACTOR,
        fontFamily: 'Atkinson Hyperlegible',
        ttsRate: 1.0, 
        ttsVolume: 1.0,
        ...THEMES['padrao'] 
    };
    const result = await chrome.storage.sync.get('pluma_preferences');
    return result.pluma_preferences || defaultPreferences;
}

// Converte strings no formato kebab-case (ex: link-color) para camelCase (ex: linkColor).
function toCamelCase(str) {
    if (typeof str !== 'string' || !str.includes('-')) return str;
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// Envia as preferências de acessibilidade para o servidor backend (API) do PLUMA para salvá-las no perfil do usuário, se autenticado.
async function savePreferencesToDatabase(prefs) {
    const dbPreferences = {
        highContrastToggle: prefs.highContrastToggle,
        fontSettingsToggle: prefs.fontSettingsToggle,
        distractionFreeToggle: prefs.distractionFreeToggle,
        keyboardNavToggle: prefs.keyboardNavToggle,
        fontSizeFactor: prefs.fontSizeFactor,
        fontFamily: prefs.fontFamily,
        ttsRate: prefs.ttsRate,
        ttsVolume: prefs.ttsVolume,
        ttsPitch: prefs.ttsPitch || 1.0,
        ttsVoice: prefs.ttsVoice || '', 
        
        themeStyles: {
            textColor: prefs['text-color'],
            linkColor: prefs['link-color'],
            disabledColor: prefs['disabled-color'],
            selectedBg: prefs['selected-bg'],
            selectedText: prefs['selected-text'],
            buttonText: prefs['button-text'],
            buttonBg: prefs['button-bg'],
            backgroundColor: prefs['background-color'],
        }
    };

    const preferenciasJsonString = JSON.stringify(dbPreferences);
    
    try {
        const result = await chrome.storage.local.get('pluma_auth_token');
        const jwtToken = result.pluma_auth_token;
        
        if (!jwtToken) {
            console.warn("Usuário não autenticado no backend. Preferências salvas apenas localmente.");
            return;
        }

        const response = await fetch('http://localhost:3000/api/preferencias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}` 
            },
            body: JSON.stringify({ 
                preferencias: preferenciasJsonString 
            })
        });

        console.log('Status da Resposta do Servidor:', response.status, response.statusText);

        if (response.ok) {
            console.log('Preferências salvas no BD com sucesso!');
            return true;
        } else {
            const errorData = await response.json();
            console.error('Falha ao salvar preferências no BD:', errorData.message);
            return false;
        }
    } catch (error) {
        console.error('Erro de rede/servidor ao salvar preferências:', error);
        return false;
    }
}

// Gerencia a ação de salvar: coleta as preferências, exibe o estado de "Salvando" e chama savePreferencesToDatabase().
async function savePreferencesToProfile() {
    console.log('BOTÃO DE SALVAR CLICADO: Iniciando coleta e envio.');

    const saveButton = document.getElementById('salvar-preferencias-btn');
    const preferences = collectAllPreferences();

    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="material-symbols-outlined rotating">progress_activity</span> Salvando...';

    try {
        const savedToDatabase = await savePreferencesToDatabase(preferences);

        if (savedToDatabase) {
            alert('✅ Preferências salvas com sucesso no seu perfil!');
        } else {
            const result = await chrome.storage.local.get('jwtToken');
            if (!result.jwtToken) {
                alert('⚠️ Você precisa estar logado para salvar suas preferências no perfil.');
            } else {
                alert('❌ Erro ao salvar preferências na Base de Dados. Tente novamente.');
            }
        }

    } catch (error) {
        console.error('Erro geral ao salvar no perfil:', error);
        alert('❌ Erro interno ao tentar salvar as preferências.');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Preferências no Perfil';
    }
}

// Salva o objeto de preferências em chrome.storage.sync e envia uma mensagem para todas as abas abertas aplicarem as novas configurações.
async function savePreferences(prefs) {
    await chrome.storage.sync.set({ 'pluma_preferences': prefs });
    
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
             if (tab.id) {
               chrome.tabs.sendMessage(tab.id, {
                   action: "APPLY_NEW_PREFERENCES",
                   preferences: prefs
               }).catch(error => {});
           }
        });
    });
}

// Aplica as cores do tema (incluindo fundo e texto) e fatores de fonte como variáveis CSS no elemento raiz (<html>) da página de configurações.
function applyTheme(prefs) {
    const root = document.documentElement;

    for (const [property, value] of Object.entries(prefs)) {
        if (property.endsWith('-color') || property.endsWith('-bg') || property.endsWith('-text')) {
            root.style.setProperty(`--${property}`, value);
        }
    }
    
    if (prefs.fontSizeFactor) {
         root.style.setProperty(`--font-size-factor`, prefs.fontSizeFactor);
    }
    
    if (prefs.fontFamily) {
         root.style.setProperty(`--pluma-font-family`, prefs.fontFamily);
    }
}

// Atualiza os seletores de cores e o toggle de alto contraste na página de configurações com base nas cores do tema aplicado.
function applyColorsToForm(themeColors) {
    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        const prop = input.getAttribute('data-prop');
        if (prop && themeColors[prop]) {
            input.value = themeColors[prop];
        }
    });

    const toggle = document.getElementById('toggle-alto-contraste');
    if (toggle) {
        const isHighContrastActive = themeColors.highContrastToggle === true; 
        toggle.checked = isHighContrastActive;
    }
}

// Coleta todos os valores de configuração (toggles, sliders, seleções de cores e fontes) atuais do formulário.
function collectAllPreferences() {
    const prefs = {};
    
    prefs.highContrastToggle = document.getElementById('toggle-alto-contraste')?.checked || false;
    prefs.fontSettingsToggle = document.getElementById('toggle-font-settings')?.checked || false;
    prefs.distractionFreeToggle = document.getElementById('toggle-modo-distracao')?.checked || false;

    const fontSizeSlider = document.getElementById('tamanho-fonte-slider');
    prefs.fontSizeFactor = (fontSizeSlider?.value / 100) || DEFAULT_FONT_SIZE_FACTOR; 

    const activeFontButton = document.querySelector('.font-selecao-container .font-botao.active');
    prefs.fontFamily = activeFontButton?.getAttribute('data-font-family') || 'Atkinson Hyperlegible';

    const voiceSelect = document.getElementById('leitura-voz-select');
    prefs.ttsVoice = voiceSelect?.value || '';

    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        const prop = input.getAttribute('data-prop');
        if (prop) {
            prefs[prop] = input.value;
        }
    });
    
    return prefs;
}

// Adiciona ou remove uma classe CSS específica (pluma-high-contrast-active-config) no elemento raiz para estilização de alto contraste.
function applyHighContrastClass(isEnabled) {
    const root = document.documentElement;
    if (isEnabled) {
        root.classList.add('pluma-high-contrast-active-config'); 
    } else {
        root.classList.remove('pluma-high-contrast-active-config');
    }
}

// Atualiza o texto exibido ao lado do slider de tamanho da fonte (ex: "120%") com o valor atual do slider.
function updateFontSizeLabel(slider, valueElement) {
    valueElement.textContent = `${slider.value}%`;
}

// Envia comandos de controle de TTS (INICIAR, PAUSAR, PARAR) para a aba da web ativa e tenta injetar o content script se necessário.
function enviarComandoTTS(comando) {
    chrome.tabs.query({ currentWindow: true, url: ["http://*/*", "https://*/*"] }, (tabs) => {
        if (tabs.length === 0) {
            console.error("[Options Page] Nenhuma aba da web encontrada. Abra uma página (ex: Google) para usar a leitura.");
            return;
        }
 
        const targetTab = tabs[0]; 
        const targetTabId = targetTab.id;
        console.log(`[Options Page] Tentando enviar o comando para a aba de conteúdo ID: ${targetTabId}`);
 
        chrome.tabs.sendMessage(targetTabId, { action: comando }, (response) => {
            if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message;
                if (errorMessage.includes("Receiving end does not exist")) {
                    console.warn("Content script não encontrado. Tentando injetar o content.js e reenviar o comando...");
                    chrome.scripting.executeScript({
                        target: { tabId: targetTabId },
                        files: ["content.js"] 
                    }, () => {
                        chrome.scripting.insertCSS({
                            target: { tabId: targetTabId },
                            files: ["/stylesheets/accessibility.css"]
                        }).catch(err => console.error("Erro injetando CSS de acessibilidade:", err));
 
                        setTimeout(() => {
                            chrome.tabs.sendMessage(targetTabId, { action: comando });
                            console.log(`[Options Page] Comando TTS reenviado após injeção.`);
                        }, 50); 
                    });
                } else {
                    console.error("[Options Page] Erro inesperado ao enviar comando:", errorMessage);
                }
            } else {
                console.log(`[Options Page] Comando TTS enviado com sucesso: ${comando}`);
            }
        });
    });
}

// Atualiza o texto exibido ao lado dos sliders de taxa, volume e tom de TTS com seus valores formatados.
function updateTtsRangeLabel(sliderId, value) {
    const labelId = sliderId + '-value'; 
    const valueElement = document.getElementById(labelId);
    
    if (valueElement) {
        if (sliderId.includes('volume')) {
            valueElement.textContent = `${(value * 100).toFixed(0)}%`;
        } else {
            valueElement.textContent = value.toFixed(1);
        }
    }
}

// Bloco de código principal que é executado ao carregar a página: carrega preferências iniciais, configura event listeners e aplica o tema inicial ao formulário.
document.addEventListener('DOMContentLoaded', async () => {
    
    const saveAndApply = () => savePreferences(collectAllPreferences());

    const initialPrefs = await loadPreferences();
    
    const highContrastToggle = document.getElementById('toggle-alto-contraste');
    const distractionToggle = document.getElementById('toggle-modo-distracao');
    const fontSettingsToggle = document.getElementById('toggle-font-settings');

    if (distractionToggle) {
        distractionToggle.checked = initialPrefs.distractionFreeToggle || false;
        distractionToggle.addEventListener('change', saveAndApply);
    }

    if (fontSettingsToggle) {
        fontSettingsToggle.checked = initialPrefs.fontSettingsToggle || false;
        fontSettingsToggle.addEventListener('change', saveAndApply); 
    }

    const keyboardNavToggle = document.getElementById('keyboardNavToggle');
    if (keyboardNavToggle) {
        keyboardNavToggle.checked = initialPrefs.keyboardNavToggle || false;
        keyboardNavToggle.addEventListener('change', saveAndApply);
    }

    if (initialPrefs.fontFamily) {
        document.querySelectorAll('.font-botao').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-font-family') === initialPrefs.fontFamily) {
                btn.classList.add('active');
            }
        });
    }
    
    const fontSizeSlider = document.getElementById('tamanho-fonte-slider');
    const fontSizeValue = document.querySelector('#tela-fonte .slider-valor');    
    
    if (fontSizeSlider) {
        fontSizeSlider.value = initialPrefs.fontSizeFactor * 100;
        if (fontSizeValue) {
             updateFontSizeLabel(fontSizeSlider, fontSizeValue);
        }
    }
    
    applyColorsToForm(initialPrefs); 
    applyTheme(initialPrefs); 
    applyHighContrastClass(initialPrefs.highContrastToggle); 
    
    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        input.addEventListener('input', () => { 
            applyTheme(collectAllPreferences()); 
            saveAndApply(); 
        });
    });

    if (highContrastToggle) highContrastToggle.addEventListener('change', () => {
        applyHighContrastClass(highContrastToggle.checked); 
        saveAndApply(); 
    });
    
    document.querySelectorAll('.tema-botao').forEach(button => {
        button.addEventListener('click', () => {
            const themeKey = button.getAttribute('data-theme'); 
            const theme = THEMES[themeKey];
            
            if (theme) {
                const isHighContrastTheme = ['padrao', 'contraste-claro', 'contraste-escuro'].includes(themeKey);
                const toggleState = isHighContrastTheme; 
                
                applyColorsToForm({...theme, highContrastToggle: toggleState});
                applyTheme({...theme, fontSizeFactor: initialPrefs.fontSizeFactor, fontFamily: initialPrefs.fontFamily}); 

                document.querySelectorAll('.tema-botao').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                saveAndApply(); 
            }
        });
    });
    
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            updateFontSizeLabel(fontSizeSlider, fontSizeValue);
            applyTheme(collectAllPreferences()); 
            
            if (fontSettingsToggle?.checked) { 
                 saveAndApply(); 
            }
        });
    }
    
    document.querySelectorAll('.font-botao').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            document.querySelectorAll('.font-botao').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            applyTheme(collectAllPreferences());
            
            if (fontSettingsToggle?.checked) {
                 saveAndApply(); 
            }
        });
    });

    const rateSlider = document.getElementById('tts-rate');      
    const volumeSlider = document.getElementById('tts-volume');  
    const pitchSlider = document.getElementById('tts-pitch');    

    [
        { slider: rateSlider, pref: initialPrefs.ttsRate, id: 'tts-rate' },
        { slider: volumeSlider, pref: initialPrefs.ttsVolume, id: 'tts-volume' },
        { slider: pitchSlider, pref: initialPrefs.ttsPitch, id: 'tts-pitch' }
    ].forEach(({ slider, pref, id }) => {
        if (slider) {
            slider.value = pref || 1.0; 
            
            updateTtsRangeLabel(id, parseFloat(slider.value));
            
            slider.addEventListener('input', () => {
                updateTtsRangeLabel(id, parseFloat(slider.value));
                
                saveAndApply(); 
            });
        }
    });
    document.getElementById('test-tts-button')?.addEventListener('click', () => {
        enviarComandoTTS('INICIAR');
    });
    const voiceSelect = document.getElementById('leitura-voz-select');
    if (voiceSelect) {
        function populateVoiceList() {
            const voices = window.speechSynthesis.getVoices();
            voiceSelect.innerHTML = ''; 
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (initialPrefs.ttsVoice === voice.name) {
                    option.selected = true;
                }
                voiceSelect.appendChild(option);
            });
            saveAndApply(); 
        }
        populateVoiceList();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
 
        voiceSelect.addEventListener('change', saveAndApply);
    }
 
    document.getElementById('play-btn')?.addEventListener('click', () => {
        enviarComandoTTS('INICIAR');
    });
 
    document.getElementById('pausa-btn')?.addEventListener('click', () => { 
        enviarComandoTTS('PAUSAR');
    });
 
    document.getElementById('stop-btn')?.addEventListener('click', () => {
        enviarComandoTTS('PARAR');
    });

    const saveToProfileButton = document.getElementById('salvar-preferencias-btn');
    
    if (saveToProfileButton) {
        console.log('Listener do botão de salvar registrado com sucesso.');
        saveToProfileButton.addEventListener('click', savePreferencesToProfile);
    } else {
        console.error('ERRO CRÍTICO: Não foi possível encontrar o botão com o ID: salvar-preferencias-btn');
    }
});