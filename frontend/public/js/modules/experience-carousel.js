import { prefersReducedMotion } from "../utils/motion.js";

const YOUTUBE_API_URL = "https://www.youtube.com/iframe_api";
const AUTOPLAY_INTERVAL_MS = 9000;

export function initExperienceCarousel() {
  const carousel = document.querySelector('[data-carousel="experiences"]');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll(".experience-slide"));
  if (!slides.length) return;

  const dotsContainer = carousel.querySelector(".experience-dots");
  const prevButton = carousel.querySelector(".carousel-arrow--prev");
  const nextButton = carousel.querySelector(".carousel-arrow--next");
  let currentSlide = 0;
  let autoplayTimer;

  function setSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentSlide);
    });
    Array.from(dotsContainer?.children || []).forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
    });
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (slides.length <= 1 || prefersReducedMotion) return;
    autoplayTimer = window.setInterval(() => setSlide(currentSlide + 1), AUTOPLAY_INTERVAL_MS);
  }

  function goToSlide(index) {
    setSlide(index);
    stopAutoplay();
  }

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.replaceChildren(
      ...slides.map((_, index) => {
        const dot = document.createElement("span");
        if (index === currentSlide) dot.className = "is-active";
        return dot;
      })
    );
  }

  prevButton?.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextButton?.addEventListener("click", () => goToSlide(currentSlide + 1));

  // Pedido do Gabriel (28/06/2026): ao clicar no play do vídeo (iframe do
  // YouTube, cross-origin) ou nas setas, o carrossel deve parar de trocar
  // sozinho. Cliques dentro do iframe não disparam "click" no documento pai,
  // mas o iframe rouba o foco da janela - detectamos isso via "blur".
  window.addEventListener("blur", () => {
    const active = document.activeElement;
    if (active?.tagName === "IFRAME" && carousel.contains(active)) stopAutoplay();
  });

  renderDots();
  startAutoplay();
  syncYoutubePlayers(carousel);
}

// Pedido do Gabriel (28/06/2026): não pode haver dois vídeos do carrossel
// tocando ao mesmo tempo. Como cada slide é um iframe do YouTube (cross-
// origin), só dá pra pausar via YouTube IFrame Player API — carregamos o
// script da API uma vez, e cada iframe ganha um YT.Player; ao detectar
// PLAYING em um, os outros levam pauseVideo().
function syncYoutubePlayers(carousel) {
  const iframes = Array.from(carousel.querySelectorAll(".experience-slide-video iframe"));
  if (!iframes.length) return;

  window.onYouTubeIframeAPIReady = () => {
    const { YT } = window;
    const players = iframes.map(
      (iframe) =>
        new YT.Player(iframe, {
          events: {
            onStateChange: (event) => {
              if (event.data !== YT.PlayerState.PLAYING) return;
              players.forEach((player) => {
                if (player === event.target) return;
                try {
                  player.pauseVideo?.();
                } catch {
                  /* player ainda não pronto - ignora */
                }
              });
            },
          },
        })
    );
  };

  const script = document.createElement("script");
  script.src = YOUTUBE_API_URL;
  document.head.appendChild(script);
}
