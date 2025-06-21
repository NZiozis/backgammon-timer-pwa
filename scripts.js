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
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    deferredPrompt = null;
    installBannerVisibility.style.display = "none";
  });
});

// TODO ADD SOME ON CLICK ON INSTALL UI TO SHOW DEFERRED PROMPT
