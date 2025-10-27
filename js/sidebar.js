document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementos da Sidebar
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('open-btn');
    const closeBtn = document.getElementById('close-btn');

    // 2. Elementos de Conteúdo
    const navLinks = document.querySelectorAll('.sidebar-item[data-target]'); 
    // MUDANÇA: Agora selecionamos todas as divs .box que têm um ID, já que data-screen fará o trabalho.
    const contentScreens = document.querySelectorAll('.box[id]'); 

    // --- Funções de Abrir/Fechar Sidebar ---
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
    
    // --- Função de Navegação Principal (NOVA LÓGICA) ---
    function navigateTo(targetId) {
        // 1. Esconde todas as telas e remove o active-link
        contentScreens.forEach(screen => {
            screen.setAttribute('data-screen', 'false'); // Esconde via CSS
        });
        navLinks.forEach(link => {
            link.classList.remove('active-link');
        });

        // 2. Mostra a tela de destino e ativa o link
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.setAttribute('data-screen', 'true'); // Mostra via CSS
        }
        
        const activeLink = document.querySelector(`.sidebar-item[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active-link');
        }

        closeSidebar(); // Fecha a sidebar
    }

    // --- Ligar Eventos ---
    openBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    // Evento de clique para os links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const target = link.dataset.target;
            if (target) {
                navigateTo(target);
            }
        });
    });

    // Fechar ao clicar fora (mantido)
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnOpenBtn = openBtn.contains(event.target);
        
        if (!sidebar.classList.contains('sidebar-fechada') && !isClickInsideSidebar && !isClickOnOpenBtn) {
            closeSidebar();
        }
    });

    // Inicialização: Garante que a tela inicial marcada no HTML tenha o link ativo
    const initialScreen = document.querySelector('.box[data-screen="true"]');
    if (initialScreen) {
        const initialTarget = initialScreen.id;
       // const initialLink = document.querySelector(`.sidebar-item[data-target="${initialTarget}"]`);
       // if (initialLink) {
            // initialLink.classList.add('active-link');
       // }
       navigateTo(initialTarget);
    } else {
        navigateTo(contentSreens[0].id)
    }
});