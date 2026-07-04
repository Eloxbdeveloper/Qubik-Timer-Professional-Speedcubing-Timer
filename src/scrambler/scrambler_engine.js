// Importa las funciones que ejecutan las permutaciones matriciales de las caras del cubo
import { movesRL, movesUD, movesFB, rotacion } from "./rotations.js"

// Importa el elemento contenedor del cubo en el DOM y el esquema oficial de colores base
import { cubo, colors } from "./cube_render.js"

// Variables exportadas por si se necesitan heredar o inspeccionar en otros módulos del sistema
export let white, yellow, green, blue, red, orange;

// Input/Textarea de la interfaz donde se muestra la combinación textual del scramble generado
export const notacion = document.querySelector(".notacion")

// Hace que el input sea estrictamente de solo lectura para evitar alteraciones por teclado
notacion.readOnly = true;

// Lista indexada de los 18 movimientos posibles en la notación oficial de la WCA (Singmaster)
export const moves = [
  "R","R'","R2","L","L'","L2","U","U'","U2","D","D'","D2",
  "F","F'","F2","B","B'","B2"
]

/*
 * generador()
 * Genera una secuencia aleatoria de movimientos válida y óptima (entre 20 y 23 giros).
 * Implementa filtros de prevención para evitar movimientos redundantes o cancelaciones lógicas.
 */
export const generador = () => {

  // Rango de longitudes típicas reglamentarias para un scramble eficiente de cubo 3x3
  let moves_scramble = [20,21,22,23]

  // Selecciona un índice pseudoaleatorio para determinar la longitud de la secuencia actual
  let length_scramble = Math.floor(Math.random() * moves_scramble.length)
  let length = moves_scramble[length_scramble]

  let arraySc = [];

  for (let i = 0; i < length; i++) {
    let move;

    // Bucle de validación reactivo: itera hasta que el movimiento seleccionado sea válido
    while (true) {

      // Selecciona un movimiento al azar de la matriz de 18 opciones disponibles
      let num = Math.floor(Math.random() * moves.length);
      move = moves[num];

      // FILTRO 1: Evita repetir consecutivamente la misma cara (ej: R seguido de R')
      if (i >= 1 && move[0] === arraySc[i-1][0]) {
        continue; 
      }
      
      // FILTRO 2: Evita el patrón de sándwich innecesario (ej: R L R), impidiendo reintervenir la cara alterna
      if (i >= 2 && move[0] === arraySc[i-2][0] && move[0] !== arraySc[i-1][0]) {
        continue;
      }

      break; // El movimiento supera los filtros de redundancia de la WCA, se aprueba
    }

    arraySc.push(move);
  }

  // Convierte el array en una cadena de texto separada por espacios y la inyecta en la UI
  notacion.value = arraySc.join(" ")

  return arraySc
}

/*
 * scrambler(cube, comb)
 * Recorre y traduce una secuencia array de movimientos para aplicarla físicamente en el DOM.
 * Divide los strings de movimiento en letra base y modificador para llamar al motor de rotación correspondiente.
 */
export const scrambler = (cube, comb) => {

  // Mapea y captura en tiempo real las colecciones de nodos de pegatinas (stickers) por su clase de color
  const white  = cube.querySelectorAll(".white")
  const blue   = cube.querySelectorAll(".blue")
  const green  = cube.querySelectorAll(".green")
  const yellow = cube.querySelectorAll(".yellow")
  const orange = cube.querySelectorAll(".orange")
  const red    = cube.querySelectorAll(".red")

  // Encapsula las referencias vivas del DOM en un objeto de caras estructurado
  const faces = { white, yellow, green, blue, orange, red };

  // Procesa secuencialmente cada uno de los movimientos contenidos en el scramble
  for (let move of comb) {

    const base = move[0];      // Extrae la letra clave (ej: "R", "L", "U")
    const type = move.slice(1); // Aisla el modificador o tipo de giro ("2" para doble, "'" para antihorario)

    // Enrutador analítico: vincula la letra de la cara con su respectivo controlador en rotations.js
    const map = {
      R: movesRL, L: movesRL,
      U: movesUD, D: movesUD,
      F: movesFB, B: movesFB
    };

    const func = map[base];
    if (!func) continue; // Salvaguarda en caso de caracteres extraños

    // Caso A: Movimiento doble ("2"). Ejecuta dos veces consecutivas el giro de la función base
    if (type === "2") {
      func(base, faces);
      func(base, faces);
    } 
    // Caso B: Movimiento inverso o antihorario ("'"). Añade el sufijo para la lógica interna
    else if (type === "'") {
      func(base + "'", faces); 
    } 
    // Caso C: Movimiento simple de 90° en sentido horario
    else {
      func(base, faces);
    }
  }
}

// Inicialización asíncrona automatizada: genera y aplica un scramble al instanciar el script en memoria
scrambler(cubo, generador())

/*
 * estadoCero(cube)
 * Borra por completo el rastro de clases cromáticas dinámicas en las sub-grillas del cubo
 * y las formatea de vuelta a su estado resuelto basándose en el orden secuencial de la matriz 'colors'.
 */
export const estadoCero = (cube) => {

  const caras = cube.querySelectorAll(".cara");
  
  // Itera sobre los 6 contenedores de cara de forma posicional
  caras.forEach((cara, i) => {

    const fichas = cara.querySelectorAll("div");

    // Reinicia las 9 pegatinas de la cara actual devolviéndolas a su color nativo original
    fichas.forEach((ficha) => {

      // Remueve todas las clases dinámicas de mezcla previas
      ficha.className = "";

      // Reestablece el color original del esquema plano usando el índice cardinal de la cara
      ficha.classList.add(colors[i]); 
    });
  });
};