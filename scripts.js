let deferredPrompt;
const installBannerVisibility = document.querySelector(".install_banner_visibility")

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBannerVisibility.style.display = "block";
});

document.querySelector(".install_banner_close").addEventListener("click", (e) => {
  installBannerVisibility.style.display = "none";
});

document.querySelector(".install_banner").addEventListener("click", (e) => {
  alert("TEMP");
});

// TODO ADD SOME ON CLICK ON INSTALL UI TO SHOW DEFERRED PROMPT
