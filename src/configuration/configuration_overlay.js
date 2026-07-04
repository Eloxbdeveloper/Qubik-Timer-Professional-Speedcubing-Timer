
import { contenedor } from "../database/DB_render.js";

// Selección de elementos interactivos del menú lateral o barra de navegación para el manejo de eventos
const label_donate = document.querySelector(".label_donate");
const instagram = document.querySelectorAll(".label_instagram");
const facebook = document.querySelectorAll(".label_facebook");
const github = document.querySelectorAll(".label_github");

/**
 * Crea e inyecta dinámicamente un modal/overlay interactivo en el DOM para la sección de donaciones.
 * Renderiza los contenedores visuales para los métodos de pago (Nacional e Internacional)
 * y gestiona su propia destrucción al cerrar la interfaz.
 */
export function createDonateOverlay() {

    // Capa de fondo oscura/translúcida que bloquea la interacción con el temporizador principal
    const overlay = document.createElement("div");
    overlay.classList.add("config-overlay", "donate-overlay");

    // Tarjeta central contenedora de la información física del modal
    const card = document.createElement("div");
    card.classList.add("config-card", "donate-card");

    // Botón de cierre superior derecho (Manejo de accesibilidad básica)
    const btnClose = document.createElement("button");
    btnClose.classList.add("config-close");
    btnClose.textContent = "×";

    // Espacio visual superior destinado al banner estético de la marca
    const banner = document.createElement("div");
    banner.classList.add("banner");

    const title = document.createElement("h2");
    title.classList.add("donate-title");
    title.textContent = "Support Qubik Timer";

    // Texto informativo que detalla el propósito de la recaudación para la comunidad
    const text = document.createElement("p");
    text.classList.add("text_donate");
    text.textContent =
        "Qubik Timer is an independent project created for the speedcubing community. Therefore, donations help maintain development, add new features, and continue the growth of speedcubing in Latin America.";

    // Contenedor principal flex/grid que agrupa las pasarelas de pago disponibles
    const qrContainer = document.createElement("div");
    qrContainer.classList.add("qr_container");

    // BLOQUE METODO 1: Pasarela Internacional (PayPal)
    const paypalMethod = document.createElement("div");
    paypalMethod.classList.add("donate_method");

    // Div vacío reservado para inyectar o renderizar el código QR de PayPal vía CSS o script
    const qrInternational = document.createElement("div");
    qrInternational.classList.add("qr_international");

    const paypalText = document.createElement("span");
    paypalText.textContent = "International (PayPal)";

    paypalMethod.appendChild(qrInternational);
    paypalMethod.appendChild(paypalText);

    // BLOQUE METODO 2: Pasarela Nacional - Colombia (Bre-B)
    const brebMethod = document.createElement("div");
    brebMethod.classList.add("donate_method");

    // Div vacío reservado para inyectar o renderizar el código QR de la red interbancaria nacional (Bre-B / Nequi / Daviplata)
    const qrNational = document.createElement("div");
    qrNational.classList.add("qr_national");

    const brebText = document.createElement("span");
    brebText.textContent = "Colombia (Bre-B)";

    brebMethod.appendChild(qrNational);
    brebMethod.appendChild(brebText);

    // Ensamble de la estructura interna de métodos de recaudo
    qrContainer.appendChild(paypalMethod);
    qrContainer.appendChild(brebMethod);

    // Construcción jerárquica de la tarjeta informativa
    card.appendChild(btnClose);
    card.appendChild(banner);
    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(qrContainer);

    // Integración final del árbol de nodos en el DOM
    overlay.appendChild(card);
    contenedor.appendChild(overlay);

    // Despachador de evento de cierre: Remueve por completo el overlay del árbol de nodos para liberar memoria
    btnClose.addEventListener("click", () => {
        overlay.remove();
    });
}

// CONTROLADORES DE EVENTOS DE LA APLICACIÓN (LISTENERS):

// Asigna el disparador del modal al botón o etiqueta correspondiente de donación
label_donate.addEventListener("click", createDonateOverlay);

// Redirección segura a la cuenta oficial de Instagram del proyecto en una nueva pestaña
instagram[0].addEventListener("click", () => {
    window.open("https://www.instagram.com/qubik.timer/", "_blank");
});

// Redirección segura a la página oficial de Facebook del proyecto en una nueva pestaña
facebook[0].addEventListener("click", () => {
    window.open("https://www.facebook.com/profile.php?id=61573262690471", "_blank");
});

// Redirección segura al repositorio de código fuente del ecosistema en GitHub
github[0].addEventListener("click", () => {
    window.open("https://github.com/Eloxbdeveloper/Qubik-Timer-Professional-Speedcubing", "_blank");
});