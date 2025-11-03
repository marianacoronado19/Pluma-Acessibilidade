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
        fontSizeFactor: DEFAULT_FONT_SIZE_FACTOR,
        fontFamily: 'Atkinson Hyperlegible',
        ...THEMES['padrao'] 
    };
    const result = await chrome.storage.sync.get('pluma_preferences');
    return result.pluma_preferences || defaultPreferences;
}

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

function collectAllPreferences() {
    const prefs = {};
    
    prefs.highContrastToggle = document.getElementById('toggle-alto-contraste')?.checked || false;

    prefs.fontSettingsToggle = document.getElementById('toggle-font-settings')?.checked || false;

    prefs.distractionFreeToggle = document.getElementById('toggle-modo-distracao')?.checked || false;
    
    const fontSizeSlider = document.getElementById('tamanho-fonte-slider');
    prefs.fontSizeFactor = (fontSizeSlider?.value / 100) || DEFAULT_FONT_SIZE_FACTOR; 

    const activeFontButton = document.querySelector('.font-selecao-container .font-botao.active');
    prefs.fontFamily = activeFontButton?.getAttribute('data-font-family') || 'Atkinson Hyperlegible';

    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        const prop = input.getAttribute('data-prop');
        if (prop) {
            prefs[prop] = input.value;
        }
    });
    
    return prefs;
}

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


document.addEventListener('DOMContentLoaded', async () => {
    
    const saveAndApply = () => savePreferences(collectAllPreferences());

    const initialPrefs = await loadPreferences();
    
    const highContrastToggle = document.getElementById('toggle-alto-contraste');

    const distractionToggle = document.getElementById('toggle-modo-distracao');
    if (distractionToggle) {
        distractionToggle.checked = initialPrefs.distractionFreeToggle || false;
        distractionToggle.addEventListener('change', saveAndApply);
    }
    
    const fontSizeSlider = document.getElementById('tamanho-fonte-slider');
    const fontSizeValue = document.querySelector('#tela-fonte .slider-valor');

    const fontSettingsToggle = document.getElementById('toggle-font-settings');
    if (fontSettingsToggle) {
        fontSettingsToggle.checked = initialPrefs.fontSettingsToggle || false;
        fontSettingsToggle.addEventListener('change', saveAndApply); 
    }

    if (initialPrefs.fontFamily) {
        document.querySelectorAll('.font-botao').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-font-family') === initialPrefs.fontFamily) {
                btn.classList.add('active');
            }
        });
    }
    
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

});