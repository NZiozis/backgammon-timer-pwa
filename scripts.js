let deferredPrompt;
const installBanner = document.querySelector(".install_banner_container")

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.style.display = "block";
});

installBanner.addEventListener("click", (e) => {
  alert("TEMP");
});

// TODO ADD SOME ON CLICK ON INSTALL UI TO SHOW DEFERRED PROMPT
