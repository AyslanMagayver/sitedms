const EMBED_URL = "https://www.youtube.com/embed/";

export function initProjectVideos() {
  const gallery = document.querySelector("[data-projects-gallery]");
  if (!gallery) return;

  let playing = null;

  function stop(entry) {
    entry.iframe.replaceWith(entry.button);
  }

  function play(button) {
    if (playing) stop(playing);

    const params = new URLSearchParams({ autoplay: "1", rel: "0", cc_load_policy: "0" });
    const iframe = document.createElement("iframe");
    iframe.src = `${EMBED_URL}${encodeURIComponent(button.dataset.videoId)}?${params}`;
    iframe.title = button.getAttribute("aria-label").replace(/^Assistir ao vídeo: /, "");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;

    button.replaceWith(iframe);
    iframe.focus();
    playing = { button, iframe };
  }

  gallery.addEventListener("click", (event) => {
    const button = event.target.closest(".project-play");
    if (button) play(button);
  });
}
