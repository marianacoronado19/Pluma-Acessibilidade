chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ showWelcomeGuide: true });
    console.log("Extensão instalada! Guia de boas-vindas será exibida.");
  }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "RELOAD_CURRENT_TAB") {
            if (sender.tab && sender.tab.id) {
                chrome.tabs.reload(sender.tab.id, { bypassCache: true });
                console.log("Aba recarregada para forçar o content script a mostrar o ícone do Pluma.");
            }
            sendResponse({ status: "Tab reload command sent" });
            return true;
        }
    }
);