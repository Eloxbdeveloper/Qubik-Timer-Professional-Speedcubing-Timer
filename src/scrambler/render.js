import { generador, scrambler, estadoCero } from "./scrambler_engine.js";
import { cubo } from "./cube_render.js";

// Referencia al campo de texto (textarea/input) donde se muestra la combinación del scramble
const notacion = document.querySelector(".notacion");

// Inicializa el campo de texto en modo de solo lectura para evitar ediciones accidentales del usuario
notacion.readOnly = true;

// Bandera de estado (flag) de edición global para alternar entre edición manual o bloqueada
export let checked = false;

// Colección de botones de control para el menú superior del scramble (Nuevo, Editar, Copiar)
export const menuScramble = document.querySelectorAll(".btn2");

/*
 * eventosScramble()
 * Registra y gestiona los escuchadores de eventos (event listeners) para los botones del menú de scramble,
 * controlando la reactividad visual del cubo, los estados de entrada y las animaciones de la interfaz.
 */
export function eventosScramble() {
  
  // === Botón 1: Generación de un nuevo Scramble ===
  menuScramble[0].addEventListener("click", () => {
    // Resetea el cubo físico en el DOM a su estado inicial resuelto (estado cero)
    estadoCero(cubo);

    // CORREGIDO: Limpia por completo el campo de texto asegurando que no queden espacios en blanco iniciales
    notacion.value = "";

    // Invoca al motor para aplicar secuencialmente sobre el cubo la nueva combinación generada aleatoriamente
    scrambler(cubo, generador());
  });

  // === Botón 2: Activar / Conmutar modo de Edición Manual ===
  menuScramble[1].addEventListener("click", () => {
    // Alterna de forma lógica el estado binario de la bandera de edición
    checked = !checked;

    // Sincroniza la propiedad readOnly de la interfaz basándose en la flag invertida de 'checked'
    notacion.readOnly = !checked;

    // Manejo interactivo del foco del cursor y adición de clases estilísticas reactivas
    if (checked) {
      notacion.focus(); // Transfiere el foco del teclado directamente al campo de texto
      notacion.classList.add("borde_textarea"); // Añade un borde o brillo visual resaltado
    } else {
      notacion.blur(); // Retira el foco del cursor del elemento actual
      notacion.classList.remove("borde_textarea"); // Remueve el resaltado visual
    }
  });

  // === Botón 3: Copiar la combinación de movimientos al Portapapeles ===
  menuScramble[2].addEventListener("click", (e) => {
    // Escribe de forma asíncrona la secuencia textual del scramble en el portapapeles del sistema operativo
    navigator.clipboard.writeText(notacion.value);

    // Guardamos la referencia explícita al nodo del botón que capturó el evento de clic
    const boton = e.currentTarget;

    // Añadimos la clase CSS que desencadena el parpadeo verde de confirmación reactiva en la UI
    boton.classList.add("animacion-copiado");

    // Remueve de forma segura la clase CSS una vez transcurrido el tiempo asignado a la transición visual
    setTimeout(() => {
      boton.classList.remove("animacion-copiado");
    }, 800);
  });

}