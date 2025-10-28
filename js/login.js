const btnLogin = document.querySelector('.botaologin'); 
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const loginContainer = document.querySelector('.login');
const togglePassword = document.getElementById('togglePassword');
 
const mensagemDiv = document.createElement('div');
mensagemDiv.id = 'mensagem-status';
loginContainer.insertBefore(mensagemDiv, btnLogin.nextSibling); 

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    this.classList.toggle('fa-eye-slash');
    this.classList.toggle('fa-eye');
});
 
function exibirMensagem(texto, cor = 'red') {
    mensagemDiv.textContent = texto;
    mensagemDiv.style.color = cor;
    if (texto) {
        mensagemDiv.classList.add('visivel');
    } else {
        mensagemDiv.classList.remove('visivel');
    }
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

async function fazerLogin() {
    exibirMensagem('');
 
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        exibirMensagem('Por favor, preencha todos os campos.');
        return;
    }

    if (!isDominioEmailPermitido(email)) {
        exibirMensagem('Domínio de e-mail não permitido. Use Gmail, Hotmail, etc.');
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
            if (data.token) {
                // 1. Salva a sessão no Chrome Storage (sync)
                chrome.storage.sync.set({
                    'pluma_auth_token': data.token,
                    'pluma_username': data.username,
                    'is_logged_in': true 
                }, () => {
                    
                    // 2. NOVO: Marca que a configuração inicial foi concluída (local)
                    // Esta flag é o que o content.js usa para alternar Bru -> Ícone Pluma.
                    chrome.storage.local.set({ 'pluma_initial_setup_complete': true }, () => {
                        exibirMensagem('Login realizado! Preferências serão salvas.', 'limegreen');
                        sucesso = true; 
                        
                        setTimeout(() => {
                            window.location.href = '/pages/configs.html';
                        }, 1500);
                    });
                });
            } else {
                 exibirMensagem('Erro ao estabelecer uma sessão de usuário.');
            }
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