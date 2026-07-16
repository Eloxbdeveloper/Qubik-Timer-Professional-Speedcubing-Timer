import { menuScramble, isEditable } from "./render.js";
import { añadir } from "../database/crud.js";
import { arrayInfo } from "../solves/solve_factory.js";
import { dbReady } from "../database/init_DB.js";
import { contenedor } from "../database/DB_render.js";

// Captura de nodos clave de la UI interactiva del timer
export const cronometro = document.querySelector(".time");
const notacion = document.querySelector(".notacion");
const manually_times = document.querySelector(".manually_times");
const ocultar_elementos = document.querySelector(".ocultar");

// Estados de temporización globales
let inicio = null;
let manualState = false;
let hideTimeState = false;
let useInspection = false;

// Variables de exportación globales que informan de forma síncrona a la factoría de solves (+2 / DNF)
export let penalizacionMasDos = false;
export let penalizacionDNF = false;

/* =========================================================
   ACTUALIZAR TIMER
   Callback recurrente encargado de calcular la diferencia exacta en milisegundos
   y refrescar continuamente el texto del cronómetro.
========================================================= */
function actualizar() {
    if (!inicio) return;

    const ahora = new Date();
    const tiempoTranscurrido = ahora - inicio;
    const segundos = tiempoTranscurrido / 1000;

    // Lógica de privacidad: Si ocultarTiempo está activo, congela la pantalla con un texto plano
    if (hideTimeState) {
        cronometro.textContent = "solving";
    } else {
        // Formatea de forma idéntica a dos decimales de precisión
        cronometro.textContent = segundos.toFixed(2);
    }
}

/* =========================================================
   REFRESH CONFIG
   Consulta de manera asíncrona el almacén de configuración de IndexedDB para
   sincronizar en memoria las preferencias de uso del cronómetro.
========================================================= */
export async function refreshManualState() {
    const db = await dbReady;

    const tx = db.transaction("configDB", "readonly");
    const store = tx.objectStore("configDB");
    const req = store.getAll();

    req.onsuccess = () => {
        const datos = req.result;

        // Preserva estados previos para evaluar mutaciones visuales reactivas
        const prevManual = manualState;
        const prevHide = hideTimeState;

        // Busca de forma selectiva cada bandera de configuración guardada por el usuario
        const manualConfig = datos.find(
            (item) => item.configuration === "ingresoManual",
        );

        const hideConfig = datos.find(
            (item) => item.configuration === "ocultarTiempo",
        );

        const inspectionConfig = datos.find(
            (item) => item.configuration === "inspeccion",
        );

        // Mapea valores recuperados o fallback por defecto en falso
        manualState = manualConfig ? manualConfig.state : false;
        hideTimeState = hideConfig ? hideConfig.state : false;
        useInspection = inspectionConfig ? inspectionConfig.state : false;

        /* =========================================================
        RESET VISUAL STATES
        Alinea el texto del cronómetro de forma limpia si las flags mutaron en plena ejecución
    ========================================================= */
        if (prevManual === true && manualState === false) {
            cronometro.textContent = "0.00";
            cronometro.style.color = "#f5f5f5";
            inicio = null;
        }

        if (prevHide === true && hideTimeState === false) {
            if (cronometro.textContent === "--") {
                cronometro.textContent = "0.00";
                inicio = null;
            }
            cronometro.style.color = "#f5f5f5";
        }
    };
}

/* =========================================================
   RESET PENALTIES
   Limpia las banderas de infracción reglamentaria antes de procesar una nueva solve
========================================================= */
function resetPenalties() {
    penalizacionMasDos = false;
    penalizacionDNF = false;
}

/* =========================================================
   MAIN TIMER EVENTS
   Gestor neurálgico que controla la máquina de estados del cronómetro por teclado.
========================================================= */
export function eventosTimer() {
    let intervalo = null;
    let intervaloInspeccion = null;
    let presionInicio = null;
    let presionado = false;
    let corriendo = false;
    let enInspeccion = false;
    let preparandoDesdeInspeccion = false;
    let bloqueoInicio = false;
    let isArmed = false;

    // CONTROL DE DUPLICADOS: Evita la fuga de memoria y la sobreposición destructiva de listeners globales
    if (window.__timerInitialized) {
        console.log(
            "Control preventivo: El Timer ya cuenta con listeners activos.",
        );
        return;
    }
    window.__timerInitialized = true;

    // Carga inicial del estado de IndexedDB al inicializar la sesión del script
    refreshManualState();

    // Intercepta de raíz el comportamiento nativo de desplazamiento en la pantalla al pulsar la barra espaciadora
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.code === "Space") {
                // Si el panel de edición de texto manual está activo, ignora este filtro preventivo por completo
                if (isEditable) return;

                if (
                    document.activeElement.tagName === "INPUT" ||
                    document.activeElement.tagName === "TEXTAREA" ||
                    document.activeElement.isContentEditable
                ) {
                    return;
                }
                e.preventDefault();
            }
        },
        { passive: false },
    );

    /* -------------------------------------------------------
      MANEJO DEL KEYDOWN (Captura de presiones / Detencion e Inspeccion)
    ------------------------------------------------------- */

    // Funcion compartida: logica de presion (teclado Space + touch)
    function handlePress(e) {
        if (e && e.preventDefault) e.preventDefault();

        // CASO 1: El cronometro esta corriendo -> SE DETIENE EL SOLVE DE FORMA INMEDIATA Y SE ARCHIVA
        if (corriendo) {
            clearInterval(intervalo);
            corriendo = false;
            presionado = false;

            const rawTime = (new Date() - inicio) / 1000;
            cronometro.textContent = rawTime.toFixed(2);
            inicio = null;

            if (ocultar_elementos) ocultar_elementos.classList.remove("activo");

            const data = arrayInfo();
            if (data) añadir(data);

            resetPenalties();
            menuScramble[0].click();

            bloqueoInicio = true;
            setTimeout(() => {
                bloqueoInicio = false;
            }, 950);
            return;
        }

        // CASO 2: Cuenta regresiva de Inspeccion en progreso -> El usuario presiona espacio preparandose para salir
        if (enInspeccion && !preparandoDesdeInspeccion) {
            preparandoDesdeInspeccion = true;
            cronometro.style.color = "green";
            return;
        }

        // CASO 3: Estado estacionario en reposo -> Preparando el arranque directo
        if (!enInspeccion && !corriendo && !presionado && !bloqueoInicio) {
            presionado = true;
            presionInicio = Date.now();
            isArmed = true;

            cronometro.style.color = "red";
            if (ocultar_elementos) ocultar_elementos.classList.add("activo");

            const verificar = setInterval(() => {
                const duracion = Date.now() - presionInicio;

                if (!presionado || corriendo || enInspeccion) {
                    clearInterval(verificar);
                    isArmed = false;
                    return;
                }

                if (duracion >= 250) {
                    cronometro.style.color = "green";
                    clearInterval(verificar);
                    isArmed = false;
                }
            }, 10);
        }
    }

    document.addEventListener("keydown", (e) => {
        // Si la edición manual externa está activa en el menú superior, cancela la lógica de arranque
        if (isEditable || contenedor.classList.contains("nav-open")) return;

        // Cortafuegos secundario para campos editables ajenos a la lógica del cronómetro
        const esInput =
            document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.isContentEditable ||
            document.activeElement === notacion;

        if (esInput) {
            // Si está enfocado en un input de guardado manual, la única tecla admitida para guardar es Enter
            if (!(manualState && e.code === "Enter")) {
                return;
            }
        }

        // Si la insercion manual esta encendida, se bloquea el uso de la barra espaciadora para cronometrar
        if (manualState && e.code === "Space") return;

        if (e.code === "Space") {
            handlePress(e);
            return;
        }

        if (manualState && e.code === "Enter") {
            const data = arrayInfo();
            if (data) añadir(data);

            menuScramble[0].click();
            manually_times.value = "";
            return;
        }

        // Boton de escape de emergencia (Escape): Interrumpe y aborta de cuajo penalizaciones de inspeccion o solves accidentales
        if (e.code === "Escape" && (corriendo || enInspeccion)) {
            clearInterval(intervalo);
            clearInterval(intervaloInspeccion);

            corriendo = false;
            enInspeccion = false;
            preparandoDesdeInspeccion = false;
            presionado = false;
            presionInicio = null;

            resetPenalties();
            cronometro.textContent = "0.00";
            cronometro.style.color = "#f5f5f5";

            if (ocultar_elementos) ocultar_elementos.classList.remove("activo");
        }
    });

    /* -------------------------------------------------------
      MANEJO DEL KEYUP (Liberacion de teclas / Disparo de Inspeccion o Solve Oficial)
    ------------------------------------------------------- */

    // Funcion compartida: logica de liberacion (teclado Space + touch)
    function handleRelease() {
        // Si el cerrojo post-solve sigue retenido por tiempo, resetea la estetica y detiene el flujo
        if (bloqueoInicio) {
            presionado = false;
            cronometro.style.color = "#f5f5f5";
            return;
        }

        // Filtro de redundancia: si el solve ya arranco, ignora impulsos remanentes
        if (corriendo) {
            presionado = false;
            presionInicio = null;
            return;
        }

        // === SUB-MAQUINA: LANZAMIENTO INSTANTANEO DESDE ESTADO DE INSPECCION WCA ===
        if (enInspeccion && preparandoDesdeInspeccion) {
            preparandoDesdeInspeccion = false;

            clearInterval(intervaloInspeccion);
            enInspeccion = false;

            corriendo = true;
            inicio = new Date();
            cronometro.textContent = hideTimeState ? "--" : "0.00";
            intervalo = setInterval(actualizar, 10);
            cronometro.style.color = "#f5f5f5";
            return;
        }

        const duracion = presionInicio ? Date.now() - presionInicio : 0;

        // === SUB-MAQUINA: DISPARAR ETAPA DE INSPECCION O ARRANQUE DIRECTO ===
        if (!corriendo && !enInspeccion && duracion >= 250) {
            if (manualState) return;

            if (useInspection) {
                enInspeccion = true;
                resetPenalties();
                let transcurrido = 0;
                cronometro.textContent = "15";
                cronometro.style.color = "#ffa500";

                intervaloInspeccion = setInterval(() => {
                    if (preparandoDesdeInspeccion) return;

                    transcurrido++;
                    let restante = 15 - transcurrido;

                    if (restante > 0) {
                        cronometro.textContent = restante;
                    } else if (restante === 0) {
                        penalizacionMasDos = true;
                        cronometro.textContent = "+2";
                        cronometro.style.color = "#ff6347";
                    } else if (restante === -1) {
                        cronometro.textContent = "+2";
                    } else {
                        penalizacionMasDos = false;
                        penalizacionDNF = true;
                        cronometro.textContent = "DNF";
                        cronometro.style.color = "red";
                    }
                }, 1000);
            } else {
                corriendo = true;
                inicio = new Date();
                cronometro.textContent = hideTimeState ? "--" : "0.00";
                intervalo = setInterval(actualizar, 10);
                cronometro.style.color = "#f5f5f5";
            }
            isArmed = false;
        }

        // Caso Borde: el usuario solto antes de cumplir el minimo de 250ms
        if (isArmed && !corriendo) {
            cronometro.style.color = "#f5f5f5";
            isArmed = false;
            if (ocultar_elementos) ocultar_elementos.classList.remove("activo");
        }

        presionado = false;
        presionInicio = null;
    }

    document.addEventListener("keyup", (e) => {
        // Si editar está encendido, cancela de raíz cualquier alteración en la UI
        if (isEditable) return;

        if (
            document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.isContentEditable ||
            document.activeElement === notacion
        ) {
            return;
        }

        if (e.code === "Space") {
            handleRelease();
        }
    });

    /* =========================================================
       TOUCH SUPPORT — EQUIVALENTE TACTIL DE LA BARRA ESPACIADORA
       El .contenedor actua como zona tactil para iniciar/detener el timer.
       ========================================================= */

    const touchZone = document.querySelector(".contenedor");

    function isInteractive(el) {
        return el.closest(
            "button, select, textarea, input, .fila_front, .navbar, .promedios, .hamburger-btn, .stats-inline, .sheet-handle--stats, .overlay_card, .config-overlay",
        );
    }

    function sheetIsOpen() {
        return !!(
            document.querySelector(".fila_front.open") ||
            document.querySelector(".promedios.expanded")
        );
    }

    touchZone.addEventListener("touchstart", (e) => {
        if (
            contenedor.classList.contains("nav-open") ||
            isEditable ||
            manualState ||
            isInteractive(e.target) ||
            bloqueoInicio ||
            sheetIsOpen()
        )
            return;
        e.preventDefault();
        handlePress(e);
    });

    touchZone.addEventListener("touchend", (e) => {
        if (
            isEditable ||
            manualState ||
            isInteractive(e.target) ||
            sheetIsOpen()
        )
            return;
        e.preventDefault();
        handleRelease();
    });

    touchZone.addEventListener("touchcancel", () => {
        presionado = false;
        presionInicio = null;
        isArmed = false;
        if (!corriendo && !enInspeccion) {
            clearInterval(intervalo);
            cronometro.textContent = "0.00";
            cronometro.style.color = "#f5f5f5";
            if (ocultar_elementos) ocultar_elementos.classList.remove("activo");
        }
    });
}
