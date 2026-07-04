import { menuScramble, checked } from "./render.js";
import { añadir } from "../database/crud.js";
import { arrayInfo } from "../solves/solve_factory.js";
import { dbReady } from "../database/init_DB.js";

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
      item => item.configuration === "ingresoManual"
    );

    const hideConfig = datos.find(
      item => item.configuration === "ocultarTiempo"
    );

    const inspectionConfig = datos.find(
      item => item.configuration === "inspeccion"
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
    console.log("Control preventivo: El Timer ya cuenta con listeners activos.");
    return;
  }
  window.__timerInitialized = true;

  // Carga inicial del estado de IndexedDB al inicializar la sesión del script
  refreshManualState();

  // Intercepta de raíz el comportamiento nativo de desplazamiento en la pantalla al pulsar la barra espaciadora
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      // Si el panel de edición de texto manual está activo, ignora este filtro preventivo por completo
      if (checked) return;

      if (
        document.activeElement.tagName === "INPUT" || 
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    }
  }, { passive: false });

  /* -------------------------------------------------------
      MANEJO DEL KEYDOWN (Captura de presiones / Detención e Inspección)
  ------------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    // Si la edición manual externa está activa en el menú superior, cancela la lógica de arranque
    if (checked) return;

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

    // Si la inserción manual está encendida, se bloquea el uso de la barra espaciadora para cronometrar
    if (manualState && e.code === "Space") return;

    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();

      // CASO 1: El cronómetro está corriendo -> SE DETIENE EL SOLVE DE FORMA INMEDIATA Y SE ARCHIVA
      if (corriendo) {
        clearInterval(intervalo);
        corriendo = false;
        presionado = false;

        // Captura matemática de precisión temporal absoluta
        const rawTime = ((new Date() - inicio) / 1000);
        cronometro.textContent = rawTime.toFixed(2);
        inicio = null;

        // Re-despliega de vuelta los elementos difuminados de la UI
        if (ocultar_elementos) ocultar_elementos.classList.remove("activo");

        // Empaqueta y despacha el solve construido hacia el módulo CRUD de IndexedDB
        const data = arrayInfo();
        if (data) añadir(data);

        resetPenalties(); 
        menuScramble[0].click(); // Genera automáticamente el nuevo scramble consecutivo

        // Bloqueo técnico de retardo (950ms) para neutralizar arranques accidentales al soltar bruscamente
        bloqueoInicio = true;
        setTimeout(() => { bloqueoInicio = false; }, 950);
        return;
      }

      // CASO 2: Cuenta regresiva de Inspección en progreso -> El usuario presiona espacio preparándose para salir
      if (enInspeccion && e.code === "Space" && !preparandoDesdeInspeccion) {
        preparandoDesdeInspeccion = true;
        // Transiciona instantáneamente a color verde: Informa que el timer está listo para dispararse sin demoras
        cronometro.style.color = "green";
        return;
      }

      // CASO 3: Modo de inserción por teclado de tiempos (Manual Mode) activo
      if (manualState && e.code === "Enter") {
        const data = arrayInfo();
        if (data) añadir(data);

        menuScramble[0].click(); // Fuerza la renovación del scramble actual
        manually_times.value = ""; // Formatea de vuelta la caja de texto numérico
        return;
      }

      // CASO 4: Estado estacionario en reposo -> Preparando el arranque directo (Cambio cromático de advertencia a Rojo)
      if (!enInspeccion && !corriendo && !presionado && !bloqueoInicio && e.code === "Space") {
        presionado = true;
        presionInicio = Date.now();
        isArmed = true;
        
        cronometro.style.color = "red";
        if (ocultar_elementos) ocultar_elementos.classList.add("activo"); // Aplica difuminado cinematográfico en el fondo

        // Bucle asíncrono de microtemporización encargado de verificar el delay técnico de seguridad (250ms)
        const verificar = setInterval(() => {
          const duracion = Date.now() - presionInicio;

          // Si el estado interno colapsó o se interrumpió la pulsación en plena verificación, liquida el intervalo
          if (!presionado || corriendo || enInspeccion) {
            clearInterval(verificar);
            isArmed = false;
            return;
          }

          // Si supera el umbral oficial (250ms), el timer se considera "armado de forma válida" y cambia a Verde
          if (duracion >= 250) {
            cronometro.style.color = "green";
            clearInterval(verificar);
            isArmed = false;
          }
        }, 10);
      }
    }

    // Botón de escape de emergencia (Escape): Interrumpe y aborta de cuajo penalizaciones de inspección o solves accidentales
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
      MANEJO DEL KEYUP (Liberación de teclas / Disparo de Inspección o Solve Oficial)
  ------------------------------------------------------- */
  document.addEventListener("keyup", (e) => {
    // Si editar está encendido, cancela de raíz cualquier alteración en la UI
    if (checked) return;

    if (
      document.activeElement.tagName === "INPUT" || 
      document.activeElement.tagName === "TEXTAREA" ||
      document.activeElement.isContentEditable ||
      document.activeElement === notacion
    ) {
      return;
    }

    if (e.code === "Space") {
      // Si el cerrojo post-solve sigue retenido por tiempo, resetea la estética y detiene el flujo
      if (bloqueoInicio) {
        presionado = false;
        cronometro.style.color = "#f5f5f5";
        return;
      }

      // Filtro de redundancia: si el solve ya arrancó, ignora impulsos remanentes
      if (corriendo) {
        presionado = false;
        presionInicio = null;
        return;
      }

      // === SUB-MÁQUINA: LANZAMIENTO INSTANTÁNEO DESDE ESTADO DE INSPECCIÓN WCA ===
      if (enInspeccion && preparandoDesdeInspeccion) {
        preparandoDesdeInspeccion = false;

        // Rompe de raíz el reloj de cuenta regresiva de los 15 segundos reglamentarios
        clearInterval(intervaloInspeccion);
        enInspeccion = false;

        // Conmuta e inicia el cronómetro oficial de la resolución al soltar la barra espaciadora
        corriendo = true;
        inicio = new Date();
        cronometro.textContent = hideTimeState ? "--" : "0.00";
        intervalo = setInterval(actualizar, 10);
        cronometro.style.color = "#f5f5f5";
        return;
      }

      const duracion = presionInicio ? (Date.now() - presionInicio) : 0;

      // === SUB-MÁQUINA: DISPARAR ETAPA DE INSPECCIÓN O ARRANQUE DIRECTO (Desde Reposo Válido) ===
      if (!corriendo && !enInspeccion && duracion >= 250) {
        if (manualState) return;

        // Opción A: Inicializa la cuenta regresiva estricta de 15 segundos de la WCA
        if (useInspection) {
          enInspeccion = true;
          resetPenalties(); 
          let transcurrido = 0; 
          cronometro.textContent = "15";
          cronometro.style.color = "#ffa500"; // Naranja corporativo de inspección activa

          intervaloInspeccion = setInterval(() => {
            // Si el usuario vuelve a presionar espacio reteniendo el conteo visual, pausa el decremento textual
            if (preparandoDesdeInspeccion) return;

            transcurrido++;
            let restante = 15 - transcurrido;

            if (restante > 0) {
              cronometro.textContent = restante;
            } else if (restante === 0) {
              // Ventana crítica: Excedió los 15 segundos -> Aplica penalización reglamentaria +2 segundos
              penalizacionMasDos = true;
              cronometro.textContent = "+2";
              cronometro.style.color = "#ff6347"; 
            } else if (restante === -1) {
              cronometro.textContent = "+2";
            } else {
              // Superó el umbral límite de la ventana límite de inspección de 17s total -> El solve se declara DNF
              penalizacionMasDos = false;
              penalizacionDNF = true;
              cronometro.textContent = "DNF";
              cronometro.style.color = "red";
            }
          }, 1000);

        // Opción B: Disparo limpio directo tradicional (Arranque instantáneo sin inspección previa)
        } else {
          corriendo = true;
          inicio = new Date();
          cronometro.textContent = hideTimeState ? "--" : "0.00";
          intervalo = setInterval(actualizar, 10);
          cronometro.style.color = "#f5f5f5";
        }
        isArmed = false;
      }

      // Caso Borde: El usuario soltó la barra de espacio antes de cumplir el requisito mínimo de 250ms (Falso arranque)
      if (isArmed && !corriendo) {
        cronometro.style.color = "#f5f5f5";
        isArmed = false;
        if (ocultar_elementos) ocultar_elementos.classList.remove("activo");
      }

      // Vacía el buffer de variables temporales de pulsación tras procesar con éxito el levantamiento de tecla
      presionado = false;
      presionInicio = null;
    }
  });
}