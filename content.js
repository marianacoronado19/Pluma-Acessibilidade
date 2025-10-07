const container = document.createElement("div");
container.classList.add("div-guia");
document.body.appendChild(container);

const botaoConfig = document.createElement("button");
botaoConfig.innerText = "Configurar";
botaoConfig.classList.add("botao-config");
balao.appendChild(botaoConfig);



// const balao = document.createElement("div");
// // balao.src = chrome.runtime.getURL("images/assistente/balao_fala.png");
// balao.classList.add("balao-div");
// container.appendChild(balao);

// const textoBalao = document.createElement("div");
// textoBalao.innerText = "Olá! Eu sou a Bru, sua assistente de acessibilidade. Estou aqui para ajudar você a personalizar sua experiência de navegação na web. Vamos começar?";
// textoBalao.classList.add("texto-balao");
// balao.appendChild(textoBalao);


// const guia = document.createElement("img");
// guia.src = chrome.runtime.getURL("images/assistente/guia_bru.png");
// guia.classList.add("img-guia");
// container.appendChild(guia);

// botaoConfig.addEventListener("click", () => {
//   alert("Aqui você pode configurar as opções de acessibilidade.");
// });