const guia = document.createElement("img");
guia.src = chrome.runtime.getURL("images/assistente/guia_bru.png");

guia.style.position = "fixed";
guia.style.bottom = "0";
guia.style.right = "5px";
guia.style.width = "200px";
guia.style.height = "auto";
guia.style.pointerEvents = "none";
guia.style.zIndex = "999999";

document.body.appendChild(guia);