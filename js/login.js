const btnLogin = document.querySelector('.botaologin'); 
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const loginContainer = document.querySelector('.login');
 
const mensagemDiv = document.createElement('div');
mensagemDiv.id = 'mensagem-status';
loginContainer.insertBefore(mensagemDiv, btnLogin.nextSibling); 
 

function exibirMensagem(texto, cor = 'red') {
    mensagemDiv.textContent = texto;
    mensagemDiv.style.color = cor;
    mensagemDiv.style.fontWeight = 'bold';
    mensagemDiv.style.textAlign = 'center';
    mensagemDiv.style.marginTop = '15px';
}

 
function inicializarFormulario() {
    if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Login';
    }
    exibirMensagem('');
    if(emailInput) emailInput.value = '';
    if(passwordInput) passwordInput.value = '';
}
 
 
async function fazerLogin() {
    exibirMensagem('');
 
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        exibirMensagem('Por favor, preencha todos os campos.');
        return;
    }
    btnLogin.disabled = true;
    btnLogin.textContent = 'Aguarde...';
 
    let sucesso = false;
 
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
 
        const data = await response.json();
 
        if (response.ok) {
            exibirMensagem('Login realizado! Redirecionando...', 'limegreen');
            localStorage.setItem('nomeUsuario', data.nome || email); 
            sucesso = true; 
            setTimeout(() => {
                window.location.href = '/configs/configs.html'; 
            }, 1500);
 
        } else {
            exibirMensagem(data.message || 'E-mail ou senha incorretos. Tente novamente.');
        }
 
    } catch (error) {
        exibirMensagem('Erro de conexão com o servidor. Verifique se o Backend está ativo.');
        console.error('Erro de Fetch:', error);
    } finally {
        if (!sucesso) {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Login';
        }
    }
}
 
btnLogin.addEventListener('click', fazerLogin);
 
window.addEventListener('pageshow', function(event) {
    inicializarFormulario();
});
 
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.activeElement === emailInput || document.activeElement === passwordInput) {
            fazerLogin();
        }
    }
});