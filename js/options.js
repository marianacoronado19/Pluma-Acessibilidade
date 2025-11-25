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

async function loadPreferences() {
    const defaultPreferences = { 
        highContrastToggle: false, 
        fontSettingsToggle: false, 
        distractionFreeToggle: false,
        keyboardNavToggle: false, // teclado
        fontSizeFactor: DEFAULT_FONT_SIZE_FACTOR,
        fontFamily: 'Atkinson Hyperlegible',
        // Adicionado: Padrões para TTS
        ttsRate: 1.0, 
        ttsVolume: 1.0,
        ...THEMES['padrao'] 
    };
    const result = await chrome.storage.sync.get('pluma_preferences');
    return result.pluma_preferences || defaultPreferences;
}

//--------------------------MARI--------------------------------
function toCamelCase(str) {
    if (typeof str !== 'string' || !str.includes('-')) return str;
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

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
        // **Assumindo que o JWT (token de autenticação) está salvo no chrome.storage.local**
        const result = await chrome.storage.local.get('jwtToken');
        const jwtToken = result.jwtToken;
        
        if (!jwtToken) {
            console.warn("Usuário não autenticado no backend. Preferências salvas apenas localmente.");
            return;
        }

        const response = await fetch('http://localhost:3000/api/preferencias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Envia o token para o backend verificar o usuário
                'Authorization': `Bearer ${jwtToken}` 
            },
            // Envia o JSON serializado dentro do corpo
            body: JSON.stringify({ 
                preferencias: preferenciasJsonString 
            })
        });

        if (response.ok) {
            console.log('Preferências salvas no BD com sucesso!');
        } else {
            // Tratar erros de servidor (e-mail/senha incorretos, etc.)
            const errorData = await response.json();
            console.error('Falha ao salvar preferências no BD:', errorData.message);
        }
    } catch (error) {
        console.error('Erro de rede/servidor ao salvar preferências:', error);
    }
}
//----------
async function savePreferences(prefs) {
    // 1. Salva no storage da extensão (mantendo a funcionalidade local)
    await chrome.storage.sync.set({ 'pluma_preferences': prefs });
    
    // 2. NOVO: Salva no banco de dados
    await savePreferencesToDatabase(prefs); 
    
    // 3. Envia mensagem para abas abertas
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
//--------------------------------------------------------------


// async function savePreferences(prefs) {
//     await chrome.storage.sync.set({ 'pluma_preferences': prefs });
    
//     chrome.tabs.query({}, (tabs) => {
//         tabs.forEach(tab => {
//              if (tab.id) {
//                chrome.tabs.sendMessage(tab.id, {
//                    action: "APPLY_NEW_PREFERENCES",
//                    preferences: prefs
//                }).catch(error => {});
//            }
//         });
//     });
// }

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

// ??????????????????????????????????????????????????????????????????????
function collectAllPreferences() {
    const prefs = {};
    
    // Toggles e Fontes
    prefs.highContrastToggle = document.getElementById('toggle-alto-contraste')?.checked || false;
    prefs.fontSettingsToggle = document.getElementById('toggle-font-settings')?.checked || false;
    prefs.distractionFreeToggle = document.getElementById('toggle-modo-distracao')?.checked || false;
    prefs.keyboardNavToggle = document.getElementById('keyboardNavToggle')?.checked || false;

    const fontSizeSlider = document.getElementById('tamanho-fonte-slider');
    prefs.fontSizeFactor = (fontSizeSlider?.value / 100) || DEFAULT_FONT_SIZE_FACTOR; 

    const activeFontButton = document.querySelector('.font-selecao-container .font-botao.active');
    prefs.fontFamily = activeFontButton?.getAttribute('data-font-family') || 'Atkinson Hyperlegible';
 
    const rateSlider = document.getElementById('tts-rate'); // ID da tela-selecao
    prefs.ttsRate = parseFloat(rateSlider?.value) || 1.0;
 
    const volumeSlider = document.getElementById('tts-volume'); // ID da tela-selecao
    prefs.ttsVolume = parseFloat(volumeSlider?.value) || 1.0;

    const pitchSlider = document.getElementById('tts-pitch'); // ID da tela-selecao
    prefs.ttsPitch = parseFloat(pitchSlider?.value) || 1.0; 

    const voiceSelect = document.getElementById('leitura-voz-select'); // ID da tela-leitura-voz
    prefs.ttsVoice = voiceSelect?.value || '';

    // Cores
    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        const prop = input.getAttribute('data-prop');
        if (prop) {
            prefs[prop] = input.value;
        }
    });
    
    return prefs;
}
// ----------------------------------------------------------------------

function applyHighContrastClass(isEnabled) {
    const root = document.documentElement;
    if (isEnabled) {
        root.classList.add('pluma-high-contrast-active-config'); 
    } else {
        root.classList.remove('pluma-high-contrast-active-config');
    }
}

function updateFontSizeLabel(slider, valueElement) {
    valueElement.textContent = `${slider.value}%`;
}
 
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

    // --- Sliders (Rate, Volume, Pitch) ---
    [
        { slider: rateSlider, pref: initialPrefs.ttsRate, id: 'tts-rate' },
        { slider: volumeSlider, pref: initialPrefs.ttsVolume, id: 'tts-volume' },
        { slider: pitchSlider, pref: initialPrefs.ttsPitch, id: 'tts-pitch' }
    ].forEach(({ slider, pref, id }) => {
        if (slider) {
            // 1. Inicializa o valor do slider com a preferência salva
            slider.value = pref || 1.0; 
            
            // 2. Atualiza o rótulo de texto (o número ao lado) na inicialização
            updateTtsRangeLabel(id, parseFloat(slider.value));
            
            // 3. Adiciona o listener para salvar e aplicar
            slider.addEventListener('input', () => {
                // Atualiza o rótulo de texto toda vez que o slider é arrastado
                updateTtsRangeLabel(id, parseFloat(slider.value));
                
                // Salva e envia as preferências atualizadas
                saveAndApply(); 
            });
        }
    });
    // Listener para o botão 'Testar Leitura'
    document.getElementById('test-tts-button')?.addEventListener('click', () => {
        enviarComandoTTS('INICIAR');
    });
    // --- Lógica para o seletor de Voz da tela-leitura-voz ---
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
 
    // --- Botões de Controle TTS (play-btn, pausa-btn, stop-btn) ---
    document.getElementById('play-btn')?.addEventListener('click', () => {
        enviarComandoTTS('INICIAR');
    });
 
    // CORRIGIR ID SE NECESSÁRIO. Assumindo que você usou 'pausa-btn' no HTML.
    document.getElementById('pausa-btn')?.addEventListener('click', () => { 
        enviarComandoTTS('PAUSAR');
    });
 
    document.getElementById('stop-btn')?.addEventListener('click', () => {
        enviarComandoTTS('PARAR');
    });
});