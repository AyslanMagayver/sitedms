const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
let lastScrollY = window.scrollY;

function updateHeader() {
  if (!header) return;
  const currentScrollY = window.scrollY;
  header.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
  const isScrollingDown = currentScrollY > lastScrollY;
  const shouldHide = currentScrollY > 110 && isScrollingDown && header.dataset.menu !== "open";
  header.dataset.hidden = shouldHide ? "true" : "false";
  lastScrollY = currentScrollY;
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

function closeMenu() {
  if (!header || !menuToggle) return;
  header.dataset.menu = "closed";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  nav?.setAttribute("aria-hidden", String(window.innerWidth <= 1080));
}

function openMenu() {
  if (!header || !menuToggle) return;
  header.dataset.menu = "open";
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Fechar menu");
  nav?.setAttribute("aria-hidden", "false");
}

if (header && menuToggle && nav) {
  closeMenu();

  menuToggle.addEventListener("click", () => {
    const isOpen = header.dataset.menu === "open";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (header.dataset.menu !== "open") return;
    if (!header.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    closeMenu();
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-visual, .hero-card, .section-title, .intro-copy, .metrics article, .mission-panel article, .solution-grid article, .solution-card, .standards-image, .standards-content, .mosaic-stage, .pd-grid article, .sector-panel, .proof-head p, .logo-cloud img, .experience-carousel, .experience-copy, .contact-shortcuts, .contact-form, .social-actions .button, .team-card, .atua-title-block, .atua-kpi, .atua-legend"
  );

  document.body.classList.add("motion-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((target) => {
    target.classList.add("reveal-item");
    observer.observe(target);
  });
}

const atuaSection = document.querySelector(".atua-section");

if (atuaSection && !prefersReducedMotion && "IntersectionObserver" in window) {
  const atuaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("atua-inview");
          atuaObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.25 }
  );

  atuaObserver.observe(atuaSection);
}

const solutionsGrid = document.querySelector(".solutions-grid");

if (solutionsGrid) {
  const solutionCards = Array.from(solutionsGrid.querySelectorAll(".solution-card"));
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setActiveSolution(card) {
    solutionCards.forEach((item) => {
      const isActive = item === card;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-expanded", String(isActive));
    });
    solutionsGrid.classList.add("has-active");
  }

  function clearActiveSolutions() {
    solutionCards.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-expanded", "false");
    });
    solutionsGrid.classList.remove("has-active");
  }

  if (hasHover) {
    solutionCards.forEach((card) => {
      card.addEventListener("mouseenter", () => setActiveSolution(card));
      card.addEventListener("focus", () => setActiveSolution(card));
    });

    solutionsGrid.addEventListener("mouseleave", clearActiveSolutions);

    solutionsGrid.addEventListener("focusout", (event) => {
      if (!solutionsGrid.contains(event.relatedTarget)) clearActiveSolutions();
    });
  } else {
    solutionCards.forEach((card) => {
      card.addEventListener("click", () => {
        const isActive = card.classList.contains("is-active");
        if (isActive) {
          clearActiveSolutions();
        } else {
          setActiveSolution(card);
        }
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const isActive = card.classList.contains("is-active");
        if (isActive) {
          clearActiveSolutions();
        } else {
          setActiveSolution(card);
        }
      });
    });
  }
}

const parallaxTargets = document.querySelectorAll(".parallax-soft");

if (!prefersReducedMotion && parallaxTargets.length) {
  let ticking = false;

  function updateParallax() {
    const viewportCenter = window.innerHeight / 2;

    parallaxTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = (elementCenter - viewportCenter) / window.innerHeight;
      const offset = Math.max(-18, Math.min(18, distance * -28));
      target.style.setProperty("--parallax", `${offset}px`);
    });

    ticking = false;
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  updateParallax();
  window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
  window.addEventListener("resize", requestParallaxUpdate);
}

const experienceCarousel = document.querySelector('[data-carousel="experiences"]');

if (experienceCarousel) {
  const track = experienceCarousel.querySelector(".experience-track");
  const dotsContainer = experienceCarousel.querySelector(".experience-dots");
  const prevButton = experienceCarousel.querySelector(".carousel-arrow--prev");
  const nextButton = experienceCarousel.querySelector(".carousel-arrow--next");
  let slides = [];
  let currentSlide = 0;
  let experienceTimer;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function youtubeEmbedUrl(videoId) {
    // enablejsapi=1 + origin: necessário pra IFrame Player API (abaixo) poder
    // controlar o player via postMessage (senão pauseVideo() não funciona,
    // por ser cross-origin com o youtube.com).
    // cc_load_policy=0 (Gabriel, 28/06/2026): legenda automática vinha
    // ligada por padrão pra quem tem "sempre mostrar legendas" ativado na
    // própria conta/navegador do YouTube — isso força o padrão pra
    // desligado nesse embed específico. O botão CC nativo do player
    // continua disponível pra quem quiser ligar manualmente.
    const params = new URLSearchParams({
      enablejsapi: "1",
      origin: window.location.origin,
      cc_load_policy: "0",
    });
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  // Pedido do Gabriel (28/06/2026): não pode haver dois vídeos do carrossel
  // tocando ao mesmo tempo. Como cada slide é um iframe do YouTube (cross-
  // origin), só dá pra pausar via YouTube IFrame Player API — carregamos o
  // script da API uma vez, e cada iframe ganha um YT.Player; ao detectar
  // PLAYING em um, os outros levam pauseVideo().
  let ytApiPromise = null;
  let ytPlayers = [];

  function loadYoutubeApi() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        resolve(window.YT);
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
    return ytApiPromise;
  }

  function pauseOtherVideos(activePlayer) {
    ytPlayers.forEach((player) => {
      if (player === activePlayer) return;
      try {
        if (typeof player.pauseVideo === "function") player.pauseVideo();
      } catch (error) {
        /* player ainda não pronto - ignora */
      }
    });
  }

  function setupYoutubePauseSync() {
    const iframes = Array.from(track.querySelectorAll(".experience-slide-video iframe"));
    if (!iframes.length) return;
    loadYoutubeApi().then((YT) => {
      ytPlayers = iframes.map(
        (iframe) =>
          new YT.Player(iframe, {
            events: {
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  pauseOtherVideos(event.target);
                }
              },
            },
          })
      );
    });
  }

  function renderExperienceSlides(items) {
    if (!track || !Array.isArray(items) || items.length === 0) return;

    track.replaceChildren();

    items.forEach((item, index) => {
      // title = linha principal (cor escura), subtitle = linha(s) secundária
      // (cor clara). Se um item antigo só tiver "title" com quebras "\n",
      // a 1a linha vira a principal e o resto vira a secundária.
      let mainLines;
      let subLines;
      if (item.subtitle !== undefined) {
        mainLines = String(item.title || "").split("\n").filter(Boolean);
        subLines = String(item.subtitle || "").split("\n").filter(Boolean);
      } else {
        const allLines = String(item.title || "").split("\n").filter(Boolean);
        mainLines = allLines.slice(0, 1);
        subLines = allLines.slice(1);
      }
      const flatTitle = [...mainLines, ...subLines].join(" - ");

      const slide = document.createElement("article");
      slide.className = `experience-slide${index === 0 ? " is-active" : ""}`;

      const textCol = document.createElement("div");
      textCol.className = "experience-slide-text";

      const heading = document.createElement("h3");
      if (mainLines.length) {
        const mainSpan = document.createElement("span");
        mainSpan.className = "experience-title-main";
        mainSpan.innerHTML = mainLines.map((line) => escapeHtml(line)).join("<br>");
        heading.appendChild(mainSpan);
      }
      if (subLines.length) {
        const subSpan = document.createElement("span");
        subSpan.className = "experience-title-sub";
        subSpan.innerHTML = subLines.map((line) => escapeHtml(line)).join("<br>");
        heading.appendChild(subSpan);
      }
      textCol.appendChild(heading);

      if (item.text) {
        const paragraph = document.createElement("p");
        paragraph.textContent = item.text;
        textCol.appendChild(paragraph);
      }

      if (item.qr) {
        const qr = document.createElement("img");
        qr.className = "experience-qr";
        qr.src = item.qr;
        qr.alt = `QR code do vídeo ${flatTitle}`.trim();
        qr.loading = "lazy";
        textCol.appendChild(qr);
      }

      const videoCol = document.createElement("div");
      videoCol.className = "experience-slide-video";

      const iframe = document.createElement("iframe");
      iframe.src = youtubeEmbedUrl(item.videoId);
      iframe.title = flatTitle || "Vídeo - Experiências em campo";
      iframe.loading = "lazy";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      videoCol.appendChild(iframe);

      slide.appendChild(textCol);
      slide.appendChild(videoCol);
      track.appendChild(slide);
    });

    slides = Array.from(track.querySelectorAll(".experience-slide"));
    currentSlide = 0;
    renderDots();
    startExperienceCarousel();
    setupYoutubePauseSync();
  }

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = slides
      .map((_, index) => `<span class="${index === currentSlide ? "is-active" : ""}"></span>`)
      .join("");
  }

  function setSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentSlide);
    });
    Array.from(dotsContainer?.children || []).forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
    });
  }

  function goToSlide(index) {
    setSlide(index);
    window.clearInterval(experienceTimer);
  }

  function startExperienceCarousel() {
    window.clearInterval(experienceTimer);
    if (slides.length <= 1 || prefersReducedMotion) return;
    experienceTimer = window.setInterval(() => {
      setSlide(currentSlide + 1);
    }, 9000);
  }

  prevButton?.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextButton?.addEventListener("click", () => goToSlide(currentSlide + 1));

  // Pedido do Gabriel (28/06/2026): ao clicar no play do vídeo (iframe do
  // YouTube, cross-origin) ou nas setas, o carrossel deve parar de trocar
  // sozinho. Cliques dentro do iframe não disparam "click" no documento pai,
  // mas o iframe rouba o foco da janela - detectamos isso via "blur".
  window.addEventListener("blur", () => {
    if (
      document.activeElement?.tagName === "IFRAME" &&
      experienceCarousel.contains(document.activeElement)
    ) {
      window.clearInterval(experienceTimer);
    }
  });

  if (window.location.protocol !== "file:") {
    fetch("/api/experiences")
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.ok && result.items?.length) {
          renderExperienceSlides(result.items);
        }
      })
      .catch(() => {});
  }
}

const contactForm = document.querySelector("#contact-form");

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formStatus = contactForm.querySelector(".form-status");

  function setFormStatus(message, type = "") {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.dataset.type = type;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("nome") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("assunto") || "").trim();
    const message = String(formData.get("mensagem") || "").trim();
    const attachment = contactForm.querySelector('input[name="anexo"]')?.files?.[0];
    const maxAttachmentSize = 5 * 1024 * 1024;
    const allowedAttachmentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (attachment) {
      const extension = attachment.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx"];

      if (attachment.size > maxAttachmentSize) {
        setFormStatus("O anexo deve ter no máximo 5 MB.", "error");
        return;
      }

      if (!allowedAttachmentTypes.includes(attachment.type) && !allowedExtensions.includes(extension)) {
        setFormStatus("Envie apenas arquivos PDF, DOC, DOCX, PPT ou PPTX.", "error");
        return;
      }
    }

    const normalizedName = name.replace(/\s+/g, " ");
    const nameLetters = normalizedName.match(/\p{L}/gu) || [];
    const linkMatches = message.match(/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|info|xyz|top|click|shop|online)\b/gi) || [];

    if (
      normalizedName.length < 2 ||
      nameLetters.length < 2 ||
      /[<>{}[\]\\]/.test(normalizedName) ||
      /(https?:\/\/|www\.|@)/i.test(normalizedName) ||
      /[^\p{L}\p{M}\s'.-]/u.test(normalizedName)
    ) {
      setFormStatus("Informe um nome válido.", "error");
      return;
    }

    if (linkMatches.length > 2) {
      setFormStatus("A mensagem parece conter links em excesso. Revise o texto e tente novamente.", "error");
      return;
    }

    if (window.location.protocol === "file:") {
      setFormStatus(
        "Para enviar a mensagem, abra o site pelo servidor Node, não diretamente pelo arquivo HTML.",
        "error"
      );
      return;
    }

    setFormStatus("Enviando mensagem...", "loading");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
      });
      // 404/405 = hospedagem estática sem a API de envio
      if (response.status === 404 || response.status === 405) {
        throw new TypeError("api-indisponivel");
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Não foi possível enviar a mensagem.");
      }

      contactForm.reset();
      setFormStatus("Mensagem enviada com sucesso. Em breve a equipe DMS retornará o contato.", "success");
    } catch (error) {
      // Em hospedagem estática (sem backend Node) o POST falha: oferece os
      // canais diretos em vez de uma mensagem técnica.
      const friendlyMessage =
        error instanceof TypeError
          ? "O envio pelo site está temporariamente indisponível. Fale conosco pelo WhatsApp (botão acima) ou envie um e-mail para contato@dmsocioambiental.com."
          : error.message || "Não foi possível enviar. Tente novamente mais tarde.";
      setFormStatus(friendlyMessage, "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar mensagem";
      }
    }
  });
}

const sectorPanel = document.querySelector("[data-sector-panel]");

if (sectorPanel) {
  const intro = sectorPanel.querySelector("[data-sector-intro]");
  const blades = Array.from(sectorPanel.querySelectorAll(".sector-wedge"));
  const details = Array.from(sectorPanel.querySelectorAll("[data-sector-detail]"));
  const label = sectorPanel.querySelector("[data-sector-label]");
  const defaultLabel = label ? label.textContent : "";
  let activeTarget = null;

  function render() {
    if (intro) intro.hidden = Boolean(activeTarget);
    details.forEach((detail) => {
      detail.hidden = detail.dataset.sectorDetail !== activeTarget;
    });
    let activeName = null;
    blades.forEach((blade) => {
      const isActive = blade.dataset.sectorTarget === activeTarget;
      blade.classList.toggle("is-active", isActive);
      blade.setAttribute("aria-expanded", String(isActive));
      if (isActive) activeName = blade.dataset.sectorName;
    });
    if (label) label.textContent = activeName || defaultLabel;
    sectorPanel.classList.toggle("has-sector-active", Boolean(activeTarget));
  }

  blades.forEach((blade) => {
    blade.addEventListener("click", () => {
      const target = blade.dataset.sectorTarget;
      activeTarget = activeTarget === target ? null : target;
      render();
    });
  });

  render();
}

const logoSectorGrids = Array.from(document.querySelectorAll("[data-logo-sector]"));
const logoCloudEl = document.querySelector("[data-logo-cloud]");

if (logoSectorGrids.length || logoCloudEl) {
  fetch("/api/logos")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || !data.ok) return;

      function fillGrid(container, items) {
        if (!container) return;
        container.innerHTML = "";
        items.forEach((item) => {
          const img = document.createElement("img");
          img.src = item.src;
          img.alt = item.alt;
          img.loading = "lazy";
          container.appendChild(img);
        });
        const isEmpty = items.length === 0;
        container.hidden = isEmpty;
        const label = container.previousElementSibling;
        if (
          label &&
          (label.classList.contains("sector-clients-label") || label.classList.contains("sector-partners-label"))
        ) {
          label.hidden = isEmpty;
        }
      }

      logoSectorGrids.forEach((container) => {
        const sectorData = data.sectors && data.sectors[container.dataset.logoSector];
        const items = (sectorData && sectorData[container.dataset.logoType]) || [];
        fillGrid(container, items);
      });

      if (logoCloudEl) {
        fillGrid(logoCloudEl, data.cloud || []);

        if (!prefersReducedMotion && "IntersectionObserver" in window) {
          const cloudObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-visible");
                  cloudObserver.unobserve(entry.target);
                }
              });
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
          );

          logoCloudEl.querySelectorAll("img").forEach((img) => {
            img.classList.add("reveal-item");
            cloudObserver.observe(img);
          });
        }
      }
    })
    .catch(() => {
      /* API indisponível: blocos de logos ficam vazios em vez de quebrar a página */
    });
}
