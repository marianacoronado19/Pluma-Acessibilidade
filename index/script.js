// const result = await chrome.tabs.query({active: true, currentWindow: true});
// // alterar coisas dentro da guia ativa no chrome

// chrome.action.onClicked.addListener((tab) => {
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: createCharacter
//     });
// });
    
function openLoginPage() {
    chrome.runtime.openLoginPage(); 
}
