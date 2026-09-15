export function initSectorPanel() {
  const panel = document.querySelector("[data-sector-panel]");
  if (!panel) return;

  const intro = panel.querySelector("[data-sector-intro]");
  const blades = Array.from(panel.querySelectorAll(".sector-wedge"));
  const details = Array.from(panel.querySelectorAll("[data-sector-detail]"));
  const label = panel.querySelector("[data-sector-label]");
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
    panel.classList.toggle("has-sector-active", Boolean(activeTarget));
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
