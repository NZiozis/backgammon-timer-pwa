/**
 * This hosts code that needs to run after the page loads, or code that would take
 * a long time to load otherwise
 *
 * An example is the code necessary to show the Android PWA banner install prompt
 */
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

customElements.define(
	"action-ui",
	class extends HTMLElement {
		static get observedAttributes() { return ["data-player-id"]; }

		constructor () {
			super();
			const template = document.getElementById("action-ui");
			this.appendChild(template.content.cloneNode(true));
		}
	},
);
