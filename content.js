const container = document.createElement("div");
container.classList.add("div-guia");
document.body.appendChild(container);

const botaoConfig = document.createElement("button");
botaoConfig.innerText = "Configurar";
botaoConfig.classList.add("botao-config");
balao.appendChild(botaoConfig);


// botaoConfig.addEventListener("click", () => {
//   alert("Aqui você pode configurar as opções de acessibilidade.");
// });