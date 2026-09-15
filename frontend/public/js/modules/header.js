const MOBILE_BREAKPOINT = 1080;

export function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  initScrollBehavior(header);

  const menuToggle = header.querySelector(".menu-toggle");
  const nav = header.querySelector(".nav");
  if (menuToggle && nav) initMobileMenu(header, menuToggle, nav);
}

function initScrollBehavior(header) {
  let lastScrollY = window.scrollY;

  function updateHeader() {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY;
    const shouldHide = currentScrollY > 110 && isScrollingDown && header.dataset.menu !== "open";

    header.dataset.scrolled = currentScrollY > 24 ? "true" : "false";
    header.dataset.hidden = shouldHide ? "true" : "false";
    lastScrollY = currentScrollY;
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initMobileMenu(header, menuToggle, nav) {
  function closeMenu() {
    header.dataset.menu = "closed";
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    nav.setAttribute("aria-hidden", String(window.innerWidth <= MOBILE_BREAKPOINT));
  }

  function openMenu() {
    header.dataset.menu = "open";
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
    nav.setAttribute("aria-hidden", "false");
  }

  closeMenu();

  menuToggle.addEventListener("click", () => {
    if (header.dataset.menu === "open") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (header.dataset.menu === "open" && !header.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", closeMenu);
}
