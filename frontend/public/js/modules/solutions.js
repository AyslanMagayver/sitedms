const ACTIVE_GROW = 1.76;
const INACTIVE_GROW = 0.62;
const MOBILE_QUERY = "(max-width: 700px)";

export function initSolutionCards() {
  const grid = document.querySelector(".solutions-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".solution-card"));
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobileQuery = window.matchMedia(MOBILE_QUERY);

  function openWidth() {
    if (mobileQuery.matches) return grid.clientWidth;
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const available = grid.clientWidth - gap * (cards.length - 1);
    return (available * ACTIVE_GROW) / (ACTIVE_GROW + INACTIVE_GROW * (cards.length - 1));
  }

  function measureOpenHeight(card) {
    const probe = card.cloneNode(true);
    probe.classList.add("is-active");
    probe.removeAttribute("tabindex");
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: `${openWidth()}px`,
      height: "auto",
      visibility: "hidden",
      pointerEvents: "none",
      transition: "none",
      animation: "none",
    });
    const body = probe.querySelector(".solution-card-body");
    Object.assign(body.style, { position: "static", transition: "none" });

    grid.appendChild(probe);
    const contentHeight = probe.getBoundingClientRect().height;
    const closedHeight = parseFloat(getComputedStyle(probe).getPropertyValue("--solution-closed-height")) || 0;
    probe.remove();
    return Math.ceil(Math.max(contentHeight, closedHeight));
  }

  function setActive(card) {
    grid.style.setProperty("--solutions-open-height", `${measureOpenHeight(card)}px`);
    cards.forEach((item) => {
      const isActive = item === card;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-expanded", String(isActive));
    });
    grid.classList.add("has-active");
  }

  function clearActive() {
    cards.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-expanded", "false");
    });
    grid.classList.remove("has-active");
  }

  function toggle(card) {
    if (card.classList.contains("is-active")) {
      clearActive();
    } else {
      setActive(card);
    }
  }

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const active = cards.find((card) => card.classList.contains("is-active"));
      if (active) grid.style.setProperty("--solutions-open-height", `${measureOpenHeight(active)}px`);
    });
  });

  if (hasHover) {
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => setActive(card));
      card.addEventListener("focus", () => setActive(card));
    });
    grid.addEventListener("mouseleave", clearActive);
    grid.addEventListener("focusout", (event) => {
      if (!grid.contains(event.relatedTarget)) clearActive();
    });
    return;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => toggle(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle(card);
    });
  });
}
