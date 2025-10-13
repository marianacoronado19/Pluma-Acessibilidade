// Arquivo: background.js

// Este evento é disparado quando a extensão é instalada pela primeira vez.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Salva um marcador no armazenamento da extensão para indicar
    // que a guia de boas-vindas deve ser exibida.
    chrome.storage.local.set({ showWelcomeGuide: true });
    console.log("Extensão instalada! Guia de boas-vindas será exibida.");
  }
});