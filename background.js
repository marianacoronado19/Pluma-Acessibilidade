chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "openPreLogin") {
        openInternalPage("prelogin/prelogin.html");
    } else if (request.action === "openSettings") {
        openInternalPage("configs/configs.html");
    } else if (request.action === "openLogin") {
        openInternalPage("login/login.html");
    }
    
    sendResponse({ status: "Page open request received." });
    
    return true; 
});

// ... (A função openInternalPage() definida acima vai aqui) ...
openInternalPage = (page) => {
    chrome.tabs.create({ url: chrome.runtime.getURL(page) });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extensão Pluma instalada. Service Worker iniciado.");
    // Inicialização do armazenamento local
    // -> a extensão se inicia no anônimo, tema padrão (começar já alterado se já fez login)
    
    // chrome.storage.local.set({ isAnon: true, theme: 'default' });
});