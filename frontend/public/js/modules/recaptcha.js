import { RECAPTCHA_SITE_KEY } from "../config.js";

const SCRIPT_URL = "https://www.google.com/recaptcha/api.js";
const ONLOAD_CALLBACK = "onDmsRecaptchaLoad";
const NORMAL_WIDGET_WIDTH = 304;

export function createRecaptcha(container, { onChange, onLoadError }) {
  let widgetId = null;
  let verified = false;

  function setVerified(value) {
    verified = value;
    onChange(value);
  }

  function render() {
    widgetId = window.grecaptcha.render(container, {
      sitekey: RECAPTCHA_SITE_KEY,
      size: container.clientWidth < NORMAL_WIDGET_WIDTH ? "compact" : "normal",
      callback: () => setVerified(true),
      "expired-callback": () => setVerified(false),
      "error-callback": () => setVerified(false),
    });
  }

  function load() {
    window[ONLOAD_CALLBACK] = render;
    const script = document.createElement("script");
    script.src = `${SCRIPT_URL}?onload=${ONLOAD_CALLBACK}&render=explicit&hl=pt-BR`;
    script.async = true;
    script.defer = true;
    script.addEventListener("error", onLoadError);
    document.head.appendChild(script);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: "600px 0px" });
    observer.observe(container);
  } else {
    load();
  }

  return {
    isVerified: () => verified,
    reset() {
      if (widgetId !== null) window.grecaptcha.reset(widgetId);
      setVerified(false);
    },
  };
}
