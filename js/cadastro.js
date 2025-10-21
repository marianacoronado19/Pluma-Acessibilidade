document.addEventListener('DOMContentLoaded', () => {

  const campoAcess = document.querySelector('.campo-acess');
  const inputAcess = document.querySelector('.input-acess');
  const gavetaAcess = document.querySelector('.gaveta-acess');
  const campoTexto = document.getElementById('acessibilidade');
  const checkboxes = gavetaAcess.querySelectorAll('input[type="checkbox"]');

  inputAcess.addEventListener('click', () => {
    campoAcess.classList.toggle('aberto');
  });

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const selecionados = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.textContent.trim());

      if (selecionados.length === 0) {
        campoTexto.value = '';
      } else if (selecionados.length === 1) {
        campoTexto.value = selecionados[0];
      } else {
        campoTexto.value = `${selecionados.length} opções selecionadas`;
      }
    });
  });

  window.addEventListener('click', (event) => {
    if (!campoAcess.contains(event.target)) {
      campoAcess.classList.remove('aberto');
    }
  });
});