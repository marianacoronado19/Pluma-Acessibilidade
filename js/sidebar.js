 document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('open-btn');
    const closeBtn = document.getElementById('close-btn');

    const navLinks = document.querySelectorAll('.sidebar-item[data-target]'); 
    const contentScreens = document.querySelectorAll('.box[id]'); 
    
    const sidebarConteudo = document.querySelector('.sidebar-conteudo');
    const perfilItem = document.querySelector('.sidebar-item.perfil');
    const perfilNomeSpan = perfilItem.querySelector('span:last-child');

    function openSidebar() {
        sidebar.classList.remove('sidebar-fechada');
        openBtn.style.opacity = '0';
        openBtn.style.pointerEvents = 'none';
    }

    function closeSidebar() {
        sidebar.classList.add('sidebar-fechada');
        openBtn.style.opacity = '1';
        openBtn.style.pointerEvents = 'auto';
    }
    
    function navigateTo(targetId) {
        contentScreens.forEach(screen => {
            screen.setAttribute('data-screen', 'false');
        });
        navLinks.forEach(link => {
            link.classList.remove('active-link');
        });

        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.setAttribute('data-screen', 'true');
        }
        
        const activeLink = document.querySelector(`.sidebar-item[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active-link');
        }

        closeSidebar();
    }

    function handleLogout(event) {
        event.preventDefault();
        
        chrome.storage.sync.remove(['pluma_auth_token', 'pluma_username', 'is_logged_in'], () => {
            alert('Sessão encerrada. Você voltou ao modo anônimo.');
            
            window.location.reload(); 
        });
    }

    function initializeSessionState() {
        chrome.storage.sync.get(['is_logged_in', 'pluma_username'], (data) => {
            const isLoggedIn = data.is_logged_in;
            const username = data.pluma_username;

            if (isLoggedIn && username) {
                perfilNomeSpan.textContent = username;
            
                perfilItem.classList.add('perfil-logado-clicavel'); 
            
                perfilItem.addEventListener('click', () => {
                window.location.href = '/pages/perfil.html'; 
            });

            const logoutHTML = `
                <a href="#" class="sidebar-item logout-link" id="logout-btn">
                    <span class="material-symbols-outlined icon-arrow">logout</span>
                    <span>Sair</span>
                </a>
            `;
            sidebarConteudo.insertAdjacentHTML('beforeend', logoutHTML);

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }

            } else {
                perfilNomeSpan.textContent = 'Login / Cadastro';
                perfilItem.classList.add('perfil-nao-logado');
                
                perfilItem.addEventListener('click', () => {
                     window.location.href = '/pages/login.html';
                });
            }
        });
    }


    openBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const target = link.dataset.target;
            if (target) {
                navigateTo(target);
            }
        });
    });

    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnOpenBtn = openBtn.contains(event.target);
        
        if (!sidebar.classList.contains('sidebar-fechada') && !isClickInsideSidebar && !isClickOnOpenBtn) {
            closeSidebar();
        }
    });

    const initialScreen = document.querySelector('.box[data-screen="true"]');
    if (initialScreen) {
       navigateTo(initialScreen.id);
    } else if (contentScreens.length > 0) {
        navigateTo(contentScreens[0].id);
    }

    initializeSessionState();
});