(() => {
  "use strict";

  let deferredPrompt = null;

  const installWindow = document.getElementById("install-window");
  const installButton = document.getElementById("install-button");
  const closeButton = document.getElementById("install-close");

  if (!installWindow || !installButton || !closeButton) {
    return;
  }

  // DETECTAR SI LA APP YA ESTA INSTALADA
  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      navigator.standalone === true
    );
  }

  // CERRAR VENTANA
  function hideWindow() {
    installWindow.hidden = true;
  }

  // MOSTRAR VENTANA
  function showWindow() {
    if (!isInstalled()) {
      installWindow.hidden = false;
    }
  }

  // OCULTAR SI YA ESTA INSTALADA
  if (isInstalled()) {
    hideWindow();
  }

  // DETECTAR INSTALACION DISPONIBLE
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  // DETECTAR CUANDO SE INSTALA
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideWindow();
  });

  // MOSTRAR AL CARGAR LA PAGINA
  window.addEventListener("load", () => {
    if (isInstalled()) {
      hideWindow();
      return;
    }

    setTimeout(() => {
      showWindow();
    }, 900);
  });

  // CERRAR MANUALMENTE
  closeButton.addEventListener("click", () => {
    hideWindow();
  });

  // BOTON INSTALAR
  installButton.addEventListener("click", async () => {

    if (isInstalled()) {
      hideWindow();
      return;
    }

    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;

      await promptEvent.prompt();

      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        hideWindow();
      }

      return;
    }

    // INSTRUCCIONES PARA IPHONE
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {

      alert(
        "Para instalar Radio La Juvenil:\n\n" +
        "1. Pulsa el boton Compartir.\n" +
        "2. Selecciona Añadir a pantalla de inicio.\n" +
        "3. Confirma la instalacion."
      );

      return;
    }

    // INSTRUCCIONES PARA ANDROID
    alert(
      "Para instalar Radio La Juvenil:\n\n" +
      "Abre el menu de Chrome (tres puntos) y selecciona " +
      "'Instalar aplicacion' o 'Agregar a pantalla de inicio'."
    );

  });

  // DETECTAR CAMBIO A MODO INSTALADO
  const displayMode = window.matchMedia("(display-mode: standalone)");

  displayMode.addEventListener?.("change", (event) => {
    if (event.matches) {
      hideWindow();
    }
  });

})();