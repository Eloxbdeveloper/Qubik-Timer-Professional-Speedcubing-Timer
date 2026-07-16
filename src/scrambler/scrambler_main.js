// Importa la referencia viva del contenedor estructural del cubo en el DOM
import { cubo } from "./cube_render.js";

// Importa los componentes motores encargados de la traducción, reinicio y lectura del scramble
import { scrambler, estadoCero, notacion } from "./scrambler_engine.js";

// Importa la función ejecutora que mapea los estados de pulsación del teclado (Espacio) para el cronómetro
import { eventosTimer } from "./timer.js";

// Importa el controlador periférico encargado de acoplar los clicks de la barra de herramientas del scramble
import { eventosScramble } from "./render.js";

/*
 * Listener: 'input' sobre el campo notacion
 * Escucha en tiempo real cada modificación tipográfica efectuada por el usuario dentro del textarea.
 * Tokeniza la cadena de texto y redibuja de forma reactiva la mezcla en el modelo del cubo 2D.
 */
notacion.addEventListener("input", () => {
    // Captura el string completo del flujo de texto actual presente en el input
    let value = notacion.value;

    // Segmenta la cadena de texto usando los espacios en blanco como delimitadores para compilar un array de movimientos
    let array = value.split(" ");

    // Devuelve de forma segura el cubo físico a su esquema resuelto original para evitar desfaces acumulativos
    estadoCero(cubo);

    // Reinterpreta y procesa el nuevo vector de movimientos manuales sobre las pegatinas del DOM
    scrambler(cubo, array);
});

/*
 * Listener: 'DOMContentLoaded' sobre la ventana global (window)
 * Actúa como el orquestador principal de arranque de la aplicación. Garantiza que toda la estructura de nodos
 * HTML esté parseada y disponible en memoria antes de inyectar los escuchadores de eventos interactivos.
 */
window.addEventListener("DOMContentLoaded", () => {
    // Instancia e inicializa los controladores de escucha asincronos para el cronometro principal
    eventosTimer();

    // Acopla los listeners interactivos correspondientes a los botones de manipulacion del scramble (Copia, Nuevo, Edicion)
    eventosScramble();

    /* ======================================================================
     SECCION: CONTROLES RESPONSIVE MOVIL (HAMBURGER + BOTTOM SHEETS)
     ====================================================================== */

    const hamburgerBtn = document.querySelector(".hamburger-btn");
    const navBar = document.querySelector(".navbar");
    const contenedor = document.querySelector(".contenedor");
    const filaFront = document.querySelector(".fila_front");
    const promedios = document.querySelector(".promedios");
    const statsInline = document.querySelector(".stats-inline");

    // --- Hamburger: toggle sidebar off-canvas ---
    hamburgerBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        navBar?.classList.toggle("open");
        contenedor?.classList.toggle("nav-open");
    });

    // --- Cerrar sidebar al hacer clic fuera de ella ---
    contenedor?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!navBar?.classList.contains("open")) return;
        if (!navBar.contains(e.target)) {
            navBar.classList.remove("open");
            contenedor.classList.remove("nav-open");
        }
    });

    // --- Bottom Sheet A (times) ---
    filaFront?.addEventListener("click", function (e) {
        e.stopPropagation();
        const rect = this.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const handleHeight = 44;

        if (clickY <= handleHeight) {
            this.classList.toggle("open");
        }
    });

    // --- Cerrar al hacer clic afuera ---
    document.addEventListener("click", function (e) {
        if (filaFront && !filaFront.contains(e.target)) {
            filaFront.classList.remove("open");
        }
    });

    // --- Bottom Sheet B (stats) ---
    statsInline?.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = promedios?.classList.contains("expanded");
        if (!isExpanded) {
            document.body.appendChild(promedios);
        } else {
            filaFront?.appendChild(promedios);
        }
        promedios?.classList.toggle("expanded");
    });

    promedios?.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!this.classList.contains("expanded")) return;
        const rect = this.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const handleHeight = 36;

        if (clickY <= handleHeight) {
            this.classList.remove("expanded");
            filaFront?.appendChild(promedios);
        }
    });

    document.addEventListener("click", () => {
        if (promedios?.classList.contains("expanded")) {
            promedios.classList.remove("expanded");
            filaFront?.appendChild(promedios);
        }
    });

    // --- Quick Stats: sincronizar stats-inline con los promedios renderizados ---
    function updateQuickStats() {
        const singleH2 = document.querySelector(".dates h2:first-child");
        const mediaH2 = document.querySelector(".dates h2:last-child");
        const mo3El = document.querySelector(
            ".promedios_ao5:nth-child(1) .time_promedio",
        );
        const ao5El = document.querySelector(
            ".promedios_ao5:nth-child(5) .time_promedio",
        );
        const ao12El = document.querySelector(
            ".promedios_ao5:nth-child(2) .time_promedio",
        );

        const bestVal = document.querySelector(
            '.quick-stat[data-type="best"] .quick-stat-value',
        );
        const actualVal = document.querySelector(
            '.quick-stat[data-type="actual"] .quick-stat-value',
        );
        const mo3Val = document.querySelector(
            '.quick-stat[data-type="mo3"] .quick-stat-value',
        );
        const ao5Val = document.querySelector(
            '.quick-stat[data-type="ao5"] .quick-stat-value',
        );
        const ao12Val = document.querySelector(
            '.quick-stat[data-type="ao12"] .quick-stat-value',
        );

        if (singleH2 && bestVal)
            bestVal.textContent = singleH2.textContent.replace("Single: ", "");
        if (mediaH2 && actualVal)
            actualVal.textContent = mediaH2.textContent.replace("Media: ", "");
        if (mo3El && mo3Val) mo3Val.textContent = mo3El.textContent;
        if (ao5El && ao5Val) ao5Val.textContent = ao5El.textContent;
        if (ao12El && ao12Val) ao12Val.textContent = ao12El.textContent;
    }

    // Observer: detecta cuando se renderizan los promedios en el DOM
    if (promedios) {
        const statsObserver = new MutationObserver(() => {
            updateQuickStats();
        });
        statsObserver.observe(promedios, { childList: true, subtree: true });
    }

    // Llamada inicial por si los promedios ya estan renderizados
    updateQuickStats();
});
