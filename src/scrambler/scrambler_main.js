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

  // Instancia e inicializa los controladores de escucha asíncronos para el cronómetro principal
  eventosTimer();

  // Acopla los listeners interactivos correspondientes a los botones de manipulación del scramble (Copia, Nuevo, Edición)
  eventosScramble();
});