import { onFirstVisible, prefersReducedMotion, supportsIntersectionObserver } from "../utils/motion.js";

const REVEAL_SELECTORS = [
  ".about-intro",
  ".hero-card",
  ".section-title",
  ".mission-panel article",
  ".solution-card",
  ".standards-intro",
  ".standards-institutions",
  ".standards-benefits",
  ".mosaic-stage",
  ".pd-grid article",
  ".sector-panel",
  ".proof-head p",
  ".logo-cloud img",
  ".projects-head",
  ".project-card",
  ".cta-intro",
  ".contact-form",
  ".team-card",
  ".atua-title-block",
  ".atua-kpi",
  ".atua-legend",
].join(", ");

export function initRevealAnimations() {
  if (prefersReducedMotion || !supportsIntersectionObserver) return;

  const targets = document.querySelectorAll(REVEAL_SELECTORS);
  document.body.classList.add("motion-ready");
  targets.forEach((target) => target.classList.add("reveal-item"));
  onFirstVisible(targets, "is-visible", { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

  const atuaSection = document.querySelector(".atua-section");
  if (atuaSection) {
    onFirstVisible([atuaSection], "atua-inview", { rootMargin: "0px 0px -10% 0px", threshold: 0.25 });
  }
}
