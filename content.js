const container = document.createElement("div");
container.classList.add("div-guia");
document.body.appendChild(container);


const balao = document.createElement("div");
// balao.src = chrome.runtime.getURL("images/assistente/balao_fala.png");
balao.classList.add("balao-div");
container.appendChild(balao);

const textoBalao = document.createElement("div");
textoBalao.innerText = "Olá! Eu sou a Bru, sua assistente de acessibilidade. Estou aqui para ajudar você a personalizar sua experiência de navegação na web. Vamos começar?";
textoBalao.classList.add("texto-balao");
balao.appendChild(textoBalao);

const botaoConfig = document.createElement("button");
botaoConfig.innerText = "Configurar";
botaoConfig.classList.add("botao-config");
balao.appendChild(botaoConfig);

const guia = document.createElement("img");
guia.src = chrome.runtime.getURL("images/assistente/guia_bru.png");
guia.classList.add("img-guia");
container.appendChild(guia);

// botaoConfig.addEventListener("click", () => {
//   alert("Aqui você pode configurar as opções de acessibilidade.");
// });


// guia.style.position = "fixed";
// guia.style.bottom = "0";
// guia.style.right = "5px";
// guia.style.width = "200px";
// guia.style.height = "auto";
// guia.style.pointerEvents = "none";
// guia.style.zIndex = "999999";


// balao.style.position = "fixed";
// balao.style.bottom = "275px";
// balao.style.right = "120px";
// balao.style.width = "250px";
// balao.style.height = "auto";
// balao.style.pointerEvents = "none";
// balao.style.zIndex = "999998";

// textoBalao.style.position = "fixed";
// textoBalao.style.bottom = "340px";
// textoBalao.style.right = "160px";
// textoBalao.style.width = "180px";
// textoBalao.style.pointerEvents = "none";
// textoBalao.style.zIndex = "999999";
// textoBalao.style.color = "#000000";
// textoBalao.style.fontSize = "14px";
// textoBalao.style.fontFamily = "Arial, sans-serif";
// textoBalao.style.textAlign = "center";

// botaoConfig.innerText = "Configurar";
// botaoConfig.style.position = "fixed";
// botaoConfig.style.bottom = "310px";
// botaoConfig.style.right = "200px";
// botaoConfig.style.padding = "4px 12px";
// botaoConfig.style.cursor = "pointer";

// botaoConfig.style.fontSize = "14px";
// botaoConfig.style.zIndex = "999999";
// botaoConfig.style.backgroundColor = "#4164b7ff";
// botaoConfig.style.color = "#000";
// botaoConfig.style.border = "none";
// botaoConfig.style.borderRadius = "4px";