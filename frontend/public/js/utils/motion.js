export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const supportsIntersectionObserver = "IntersectionObserver" in window;

export function onFirstVisible(elements, className, options) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(className);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  elements.forEach((element) => observer.observe(element));
  return observer;
}
