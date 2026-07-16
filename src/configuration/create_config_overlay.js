import { contenedor } from "../database/DB_render.js";
import { db } from "../database/init_DB.js";
import { cronometro, refreshManualState } from "../scrambler/timer.js";

// Referencias a los contenedores interactivos globales del DOM para alternar interfaces
const manually_times = document.querySelector(".manually_times");
const settingsButton = document.querySelector(".js-open-settings-modal");

/**
 * Genera de manera dinámica el panel de configuración (Overlay) inyectando elementos en el DOM.
 * Mapea las propiedades de configuración persistidas en IndexedDB a interruptores deslizantes (switches)
 * y gestiona los cambios de estado visual y lógico del temporizador.
 */
export function createConfigOverlay() {
    const donateOverlayExists = contenedor.querySelector(".donate-overlay");
    const configOverlayExists = contenedor.querySelector(
        ".config-overlay:not(.donate-overlay)",
    );
    if (donateOverlayExists) donateOverlayExists.remove();
    if (configOverlayExists) return;

    // Capa de fondo oscura translúcida que aísla la vista de configuración
    const overlay = document.createElement("div");
    overlay.classList.add("config-overlay");

    // Tarjeta contenedora de las opciones
    const card = document.createElement("div");
    card.classList.add("config-card");

    // Botón de cierre superior derecho del modal
    const btnClose = document.createElement("button");
    btnClose.classList.add("config-close");
    btnClose.textContent = "×";

    const title = document.createElement("div");
    title.classList.add("config-title");
    title.textContent = "Settings";

    card.appendChild(btnClose);
    card.appendChild(title);

    // Mapeo estructural de opciones vinculado directamente con las claves del ObjectStore configDB
    const items = [
        {
            text: "Use the inspection (15 seconds)",
            configuration: "inspeccion",
        },
        {
            text: "The time is not displayed during the solution.",
            configuration: "ocultarTiempo",
        },
        {
            text: "Enter the times manually (for stackmat)",
            configuration: "ingresoManual",
        },
        {
            text: "Report errors or inconsistencies",
            configuration: "reportarErrores",
        },
    ];

    // Iteración de elementos para construir la interfaz reactiva
    items.forEach((itemData) => {
        const item = document.createElement("div");
        item.classList.add("config-item");

        const span = document.createElement("span");
        span.classList.add("config-text");
        span.textContent = itemData.text;

        item.appendChild(span);

        // CASO ESPECIAL: Manejo diferenciado para el botón de reporte externo
        if (itemData.configuration === "reportarErrores") {
            const reportBtn = document.createElement("button");
            reportBtn.textContent = "REPORT";
            reportBtn.classList.add("config-report-btn");

            // Redirección directa al canal de soporte oficial
            reportBtn.addEventListener("click", () => {
                window.location.href =
                    "https://www.instagram.com/direct/t/17845540569665882/";
            });

            item.appendChild(reportBtn);
        } else {
            // CONSTRUCCIÓN DE INTERRUPTORES (SWITCHES) PARA PARÁMETROS BOOLEANOS:
            const label = document.createElement("label");
            label.classList.add("config-switch");

            const input = document.createElement("input");
            input.type = "checkbox";

            const slider = document.createElement("span");
            slider.classList.add("config-slider");

            label.appendChild(input);
            label.appendChild(slider);

            item.appendChild(label);

            // HIDRATACIÓN ASÍNCRONA DESDE INDEXEDDB:
            // Abre una transacción de lectura para sincronizar el estado guardado con el checkbox visual
            const tx_read = db.transaction("configDB", "readonly");
            const store_read = tx_read.objectStore("configDB");
            const req_read = store_read.getAll();

            req_read.onsuccess = () => {
                const datos = req_read.result;

                // Busca la coincidencia exacta de configuración en el almacén local
                const config = datos.find(
                    (item) => item.configuration === itemData.configuration,
                );

                if (!config) return;

                // Sincroniza el estado del control binario en el DOM
                input.checked = config.state;

                // Lógica de conmutación de pantallas exclusiva para la modalidad de entrada Stackmat
                if (config.configuration === "ingresoManual") {
                    if (config.state) {
                        cronometro.style.display = "none";
                        manually_times.style.display = "flex";
                    } else {
                        manually_times.style.display = "none";
                        cronometro.style.display = "flex";
                    }
                }
            };

            // CAPTURA DE EVENTO DE CAMBIO (MUTACIÓN ATÓMICA):
            // Escucha las interacciones del usuario y actualiza en caliente los registros en IndexedDB
            input.addEventListener("change", () => {
                const tx = db.transaction("configDB", "readwrite");
                const store = tx.objectStore("configDB");
                const req = store.getAll();

                req.onsuccess = async () => {
                    const datos = req.result;

                    const config = datos.find(
                        (item) => item.configuration === itemData.configuration,
                    );

                    if (!config) return;

                    // Asigna el nuevo booleano proveniente del DOM al objeto de datos
                    config.state = input.checked;

                    // Actualiza el documento en el ObjectStore
                    store.put(config);

                    // Alterna reactivamente la visibilidad de los elementos del front según la opción modificada
                    if (config.configuration === "ingresoManual") {
                        if (config.state) {
                            cronometro.style.display = "none";
                            manually_times.style.display = "flex";
                        } else {
                            manually_times.style.display = "none";
                            cronometro.style.display = "flex";
                        }
                    }

                    // Notifica asíncronamente al motor central del timer para reconfigurar los listeners del teclado
                    await refreshManualState();
                };
            });
        }

        card.appendChild(item);
    });

    overlay.appendChild(card);
    contenedor.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    // Destructor del modal: Remueve el árbol de nodos completo para evitar fugas de memoria (Memory Leaks)
    btnClose.addEventListener("click", () => {
        overlay.remove();
    });
}

// Vincula el inicializador del panel al evento clic del elemento visual correspondiente en la UI
settingsButton.addEventListener("click", createConfigOverlay);

/**
 * Verificación de consistencia del estado de entrada manual.
 * Consulta de forma aislada la base de datos durante la carga de la aplicación para asegurar
 * que la interfaz se acople correctamente a las preferencias guardadas en sesiones previas.
 */
export function checkManualInput() {
    const tx = db.transaction("configDB", "readonly");
    const store = tx.objectStore("configDB");
    const req = store.getAll();

    req.onsuccess = () => {
        const datos = req.result;

        const config = datos.find(
            (item) => item.configuration === "ingresoManual",
        );

        if (!config) return;

        // Forzado explícito de layout de acuerdo con el valor booleano recuperado
        if (config.state) {
            cronometro.style.display = "none";
            manually_times.style.display = "flex";
        } else {
            manually_times.style.display = "none";
            cronometro.style.display = "flex";
        }
    };
}
