export function initSolutionCards() {
  const grid = document.querySelector(".solutions-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".solution-card"));
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setActive(card) {
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
