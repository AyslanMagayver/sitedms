const PRODUCTION_API_URL = "https://dms-landing-vsjk.onrender.com";
const LOCAL_API_URL = "http://localhost:3000";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export const API_BASE_URL = LOCAL_HOSTNAMES.has(window.location.hostname) ? LOCAL_API_URL : PRODUCTION_API_URL;

export const CONTACT_ENDPOINT = `${API_BASE_URL}/api/contact`;

export const CONTACT_EMAIL = "contato@dmsocioambiental.com";

export const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
