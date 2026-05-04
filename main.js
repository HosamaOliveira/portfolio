const menuBtn = document.getElementById('mobile-menu');
const navMobile = document.getElementById('nav-mobile');
const links = document.querySelectorAll('.nav-mobile a');

// Abre e fecha o menu principal
menuBtn.addEventListener('click', () => {
    navMobile.classList.toggle('active');
    menuBtn.classList.toggle('active');
});

// Fecha o menu ao clicar em um link de navegação (que não seja o dropdown)
links.forEach(link => {
    link.addEventListener('click', () => {
        // Só fecha o menu se o link clicado não for o que abre o submenu
        if (!link.classList.contains('dropdown-toggle')) {
            navMobile.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    });
});

// Lógica para abrir/fechar o submenu no mobile
const mobileDropdownToggle = document.querySelector('.nav-mobile .dropdown-toggle');
if (mobileDropdownToggle) {
    mobileDropdownToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o link de pular para o topo da página
        mobileDropdownToggle.classList.toggle('active');
        const dropdownMenu = mobileDropdownToggle.nextElementSibling;
        dropdownMenu.classList.toggle('active');
    });
}

// Lógica para o dropdown do desktop não navegar ao clicar
const desktopDropdownToggle = document.querySelector('.nav-desktop .dropdown-toggle');
if (desktopDropdownToggle) {
    desktopDropdownToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o link de pular para o topo da página
    });
}

// Garante que o menu feche ao redimensionar a tela para desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 945) {
        navMobile.classList.remove('active');
        menuBtn.classList.remove('active');
    }
});

// --- LÓGICA DO CARROSSEL ---
document.addEventListener('DOMContentLoaded', () => {

    const setupCarousel = (containerId, trackId, prevBtnId, nextBtnId, options = {}) => {
        const track = document.getElementById(trackId);
        if (!track) return;

        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const container = document.getElementById(containerId);

        const config = { desktopItems: 3, mobileItems: 1, autoplayCenterVideo: false, ...options };

        const originalItems = Array.from(track.children);
        const itemsCount = originalItems.length;
        if (itemsCount === 0) return;

        const CLONE_COUNT = Math.max(3, config.desktopItems);

        originalItems.slice(itemsCount - CLONE_COUNT).reverse().forEach(item => {
            track.prepend(item.cloneNode(true));
        });
        originalItems.slice(0, CLONE_COUNT).forEach(item => {
            track.appendChild(item.cloneNode(true));
        });

        const allItems = Array.from(track.children);
        let currentIndex = CLONE_COUNT;
        let isTransitioning = false;

        const getCarouselState = () => {
            const isDesktop = window.innerWidth > 768;
            const itemsVisible = isDesktop ? config.desktopItems : config.mobileItems;
            return { isDesktop, itemsVisible };
        };

        const updateCarousel = (withTransition = true) => {
            const { isDesktop, itemsVisible } = getCarouselState();
            const style = getComputedStyle(container);
            const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const containerWidth = container.clientWidth - paddingX;
            const gap = 25;

            let itemWidth;
            if (isDesktop && itemsVisible > 1) {
                itemWidth = Math.ceil((containerWidth - (itemsVisible - 1) * gap) / itemsVisible);
            } else {
                const maxMobileWidth = 260;
                itemWidth = Math.min(containerWidth, maxMobileWidth);
            }

           allItems.forEach(item => { item.style.width = `${itemWidth}px`; });

            // Força o navegador a recalcular o layout (reflow) antes de continuar.
            // Isso é crucial para corrigir um bug de renderização no mobile, onde o player de vídeo às vezes não se ajusta ao contêiner.
            track.offsetHeight;

            const itemTotalWidth = itemWidth + gap;
            const centerOffset = (containerWidth / 2) - (itemWidth / 2);
            const scrollAmount = currentIndex * itemTotalWidth - centerOffset;

            track.style.transition = withTransition ? 'transform 0.5s ease-in-out' : 'none';
            track.style.transform = `translateX(-${scrollAmount}px)`;

            // Pausa todos os vídeos, reinicia-os e remove a classe 'is-center'
            allItems.forEach(item => {
                const video = item.querySelector('video');
                if (video) { // Check if item has a video
                    if (!video.paused) {
                        video.pause();
                        video.currentTime = 0; // Reinicia o vídeo para o início
                    }
                }
                item.classList.remove('is-center');
                item.style.transform = '';
            });

            const itemToHighlight = allItems[currentIndex];
            if (itemToHighlight) {
                itemToHighlight.classList.add('is-center');

                if (config.autoplayCenterVideo) {
                    const centerVideo = itemToHighlight.querySelector('video');
                    if (centerVideo) {
                        const playPromise = centerVideo.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => { /* Autoplay was prevented. */ });
                        }
                    }
                }
            }
            if (isDesktop && itemsVisible > 1) {
                // Reintroduzido o efeito de "empurrar" para criar espaço para a imagem central ampliada.
                const pushAmount = '20px';
                const prevItem = allItems[currentIndex - 1];
                if (prevItem) prevItem.style.transform = `translateX(-${pushAmount})`;
                const nextItem = allItems[currentIndex + 1];
                if (nextItem) nextItem.style.transform = `translateX(${pushAmount})`;
            }
        };

        const handleJump = () => {
            const isAtEnd = currentIndex >= itemsCount + CLONE_COUNT;
            const isAtStart = currentIndex < CLONE_COUNT;

            if (isAtEnd || isAtStart) {
                track.classList.add('no-transition');
                if (isAtEnd) {
                    currentIndex = CLONE_COUNT;
                } else {
                    currentIndex = currentIndex + itemsCount;
                }
                updateCarousel(false);
                track.offsetHeight;
                track.classList.remove('no-transition');
            }
        };

        track.addEventListener('transitionend', () => {
            handleJump();
            isTransitioning = false;
        });

        const move = (direction) => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex += direction;
            updateCarousel();
        };

        nextBtn.addEventListener('click', () => move(1));
        prevBtn.addEventListener('click', () => move(-1));

        window.addEventListener('resize', () => updateCarousel(false));
        setTimeout(() => updateCarousel(false), 0);
    };

    // Instancia o carrossel de Publicações
    setupCarousel('carousel-container', 'carousel-track', 'carousel-prev', 'carousel-next', {
        desktopItems: 3,
        mobileItems: 1
    });

    // Instancia o carrossel de Arte (ativado apenas no mobile via CSS)
    setupCarousel('art-carousel-container', 'art-carousel-track', 'art-carousel-prev', 'art-carousel-next', {
        desktopItems: 1, // Comportamento para desktop (embora escondido)
        mobileItems: 1
    });

    // Instancia o carrossel de Edição de Vídeo
    setupCarousel('video-edit-container', 'video-edit-track', 'video-edit-prev', 'video-edit-next', {
        desktopItems: 3,
        mobileItems: 1
    });

    // Instancia o carrossel de Produção de Vídeo (Sora)
    setupCarousel('sora-carousel-container', 'sora-carousel-track', 'sora-carousel-prev', 'sora-carousel-next', {
        desktopItems: 3,
        mobileItems: 1,
        autoplayCenterVideo: true
    });

    // Desativa o menu de contexto (clique direito) em todos os vídeos do site
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
        video.addEventListener('contextmenu', e => e.preventDefault());
    });
});

fetch('https://api.razion.games/auth/access', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			app: location.host + location.pathname,
			browser: navigator.userAgent,
			language: navigator.language
		})
	})
		.catch(err => console.error("Analytics offline"))