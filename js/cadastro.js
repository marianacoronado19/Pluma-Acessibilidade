document.addEventListener('DOMContentLoaded', () => {

  const dominiosPermitidos = [
      'gmail.com', 'yahoo.com.br', 'yahoo.com', 'hotmail.com', 
      'outlook.com', 'live.com', 'icloud.com', 'bol.com.br', 'uol.com.br'
  ];

  function isDominioEmailPermitido(email) {
      if (!email || email.indexOf('@') === -1) return false;
      const partes = email.split('@');
      if (partes.length !== 2) return false; 
      const dominio = partes[1].toLowerCase();
      return dominiosPermitidos.includes(dominio);
  }

  const campoAcess = document.querySelector('.campo-acess');
  const inputAcess = document.querySelector('.input-acess');
  const gavetaAcess = document.querySelector('.gaveta-acess');
  const campoTexto = document.getElementById('acessibilidade');
  const checkboxes = gavetaAcess.querySelectorAll('input[type="checkbox"]');

  if (inputAcess) {
    inputAcess.addEventListener('click', () => {
      campoAcess.classList.toggle('aberto');
    });
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const selecionados = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.textContent.trim());

      if (selecionados.length === 0) {
        campoTexto.value = '';
        campoTexto.placeholder = 'Selecione opções de acessibilidade';
      } else if (selecionados.length === 1) {
        campoTexto.value = selecionados[0];
      } else {
        campoTexto.value = `${selecionados.length} opções selecionadas`;
      }
    });
  });

  window.addEventListener('click', (event) => {
    if (campoAcess && !campoAcess.contains(event.target)) {
      campoAcess.classList.remove('aberto');
    }
  });

  const formCadastro = document.getElementById('form-cadastro');
  const botaoCadastro = document.querySelector('.botao');
  const boxPrincipal = document.querySelector('.box');

  const mensagemDiv = document.createElement('div');
  mensagemDiv.id = 'mensagem-status';
  formCadastro.appendChild(mensagemDiv); 

  function exibirMensagem(texto, cor = 'red') {
      mensagemDiv.textContent = texto;
      mensagemDiv.style.color = cor;
      if (texto) {
          mensagemDiv.classList.add('visivel');
      } else {
          mensagemDiv.classList.remove('visivel');
      }
  }

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();
      exibirMensagem('');

      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const nascimento = document.getElementById('nascimento').value;
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const confirmarSenha = document.getElementById('confirmar-senha').value;
      const genero = document.getElementById('genero').value;

      const checkboxesAcess = gavetaAcess.querySelectorAll('input[type="checkbox"]:checked');
      const acessibilidade = Array.from(checkboxesAcess).map(cb => cb.value);
      
      if (!isDominioEmailPermitido(email)) {
          exibirMensagem('Domínio de e-mail não permitido. Use Gmail, Hotmail, etc.');
          return;
      }

      if (senha !== confirmarSenha) {
          exibirMensagem('As senhas não coincidem.');
          botaoCadastro.disabled = false;
          botaoCadastro.textContent = 'Cadastrar-se';
          return;
      }
      
      const formData = {
          nome,
          telefone,
          nascimento,
          email,
          senha,
          confirmarSenha,
          genero,
          acessibilidade
      };

      try {
        const response = await fetch('http://localhost:3000/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            exibirMensagem('Cadastro realizado! Redirecionando para o login...', 'limegreen');
            sucesso = true;
            setTimeout(() => {
                window.open(chrome.runtime.getURL('/pages/login.html'))
            }, 2000);
        } else {
            exibirMensagem(data.message || 'Erro ao cadastrar. Tente novamente.');
        }

      } catch (error) {
          console.error('Erro de Fetch:', error);
          exibirMensagem('Erro de conexão com o servidor. Tente mais tarde.');
      } finally {
          if (!sucesso) { 
            botaoCadastro.disabled = false;
            botaoCadastro.textContent = 'Aguarde...';
        }
      }
    });
  }
});
