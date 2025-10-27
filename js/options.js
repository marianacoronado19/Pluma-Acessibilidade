const THEMES = {
    'padrao': { 
        'text-color': '#FFFFFF', 'link-color': '#FFFF00', 'disable-color': '#00FF00', 
        'selected-bg': '#000000', 'selected-text': '#00FFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#000000', 'background-color': '#000000'
    },
    'sepia': { 
        'text-color': '#2C1E1E', 'link-color': '#663300', 'disable-color': '#A58E83', 
        'selected-bg': '#663300', 'selected-text': '#FFFFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#663300', 'background-color': '#F5E6B5'
    },
    'contraste-claro': { 
        'text-color': '#000000', 'link-color': '#0000FF', 'disable-color': '#B0B0B0', 
        'selected-bg': '#008000', 'selected-text': '#FFFFFF', 
        'button-text': '#FFFFFF', 'button-bg': '#008000', 'background-color': '#FFFFFF'
    },
    'contraste-escuro': {
        'text-color': '#FFFF00', 'link-color': '#00FFFF', 'disable-color': '#FF00FF', 
        'selected-bg': '#FF00FF', 'selected-text': '#000000', 
        'button-text': '#000000', 'button-bg': '#FFFF00', 'background-color': '#000000'
    }
};


async function loadPreferences() {
    const defaultPreferences = { highContrastToggle: false, fontSizeFactor: 1.0, ...THEMES['padrao'] };
    const result = await chrome.storage.sync.get('pluma_preferences');
    return result.pluma_preferences || defaultPreferences;
}

async function savePreferences(prefs) {
    await chrome.storage.sync.set({ 'pluma_preferences': prefs });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "APPLY_NEW_PREFERENCES",
                preferences: prefs
            });
        }
    });
}


function applyTheme(themeColors) {
    const root = document.documentElement;
    for (const [property, value] of Object.entries(themeColors)) {
        root.style.setProperty(`--${property}`, value);
    }
}

function applyColorsToForm(themeColors) {
    for (const prop in themeColors) {
        const input = document.querySelector(`.cores-selecao-container [data-prop="${prop}"]`);
        if (input) {
            input.value = themeColors[prop];
        }
    }
}

function collectAllPreferences() {
    const prefs = {};
    prefs.highContrastToggle = document.getElementById('toggle-alto-contraste')?.checked || false;
    prefs.fontSizeFactor = document.getElementById('tamanho-fonte-slider')?.value / 100 || 1.0; 

    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        const prop = input.getAttribute('data-prop');
        if (prop) {
            prefs[prop] = input.value;
        }
    });
    
    return prefs;
}


document.addEventListener('DOMContentLoaded', async () => {
    
    const saveAndApply = () => savePreferences(collectAllPreferences());

    const initialPrefs = await loadPreferences();
    
    const toggle = document.getElementById('toggle-alto-contraste');
    if (toggle) toggle.checked = initialPrefs.highContrastToggle;
    
    const slider = document.getElementById('font-size-slider');
    if (slider) slider.value = initialPrefs.fontSizeFactor * 100;
    
    applyColorsToForm(initialPrefs); 
    applyTheme(initialPrefs); 

    
    
    document.querySelectorAll('.cores-selecao-container input[type="color"]').forEach(input => {
        input.addEventListener('input', () => { 
            applyTheme(collectAllPreferences()); 
            saveAndApply(); 
        });
    });

    if (toggle) toggle.addEventListener('change', saveAndApply);
    if (slider) slider.addEventListener('input', saveAndApply);

    document.querySelectorAll('.tema-botao').forEach(button => {
        button.addEventListener('click', () => {
            const themeKey = button.getAttribute('data-theme'); 
            const theme = THEMES[themeKey];
            
            if (theme) {
                applyColorsToForm(theme);
                applyTheme(theme); 

                document.querySelectorAll('.tema-botao').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                saveAndApply(); 
            }
        });
    });
});