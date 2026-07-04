import { eliminar, leer } from "./crud.js";            
import { marcarDNF, marcarDos } from "../solves/solve_state.js"; 
import { datoCard } from "./cards_render.js"; // Nueva dependencia interna

/*
  Referencias principales del DOM:
  - archivador: contenedor lateral o sección donde se listan de forma secuencial los solves.
  - contenedor: wrapper general de la aplicación donde se inyectan overlays de tipo modal (cards).
*/
export const archivador = document.querySelector(".archivador") 
export const contenedor = document.querySelector(".contenedor")

/*
  dataDiv(idx, t, dnf, masDos, timeMasDos, timeDNF)
  Crea de forma dinámica los nodos HTML del DOM para un solve dentro de la lista principal,
  formateando textos, colores y asociando eventos reactivos basándose en el estado de penalizaciones.
*/
export const dataDiv = (idx, t, dnf, masDos, timeMasDos, timeDNF) => {

    // Al insertar un solve, aseguramos remover la clase de estado vacío para restaurar estilos activos
    if (archivador) archivador.classList.remove("vacio");

    // Creación de elementos y nodos base que conforman un registro visual completo
    const contenedor_data = document.createElement("DIV") 
    const data = document.createElement("DIV")
    const record = document.createElement("DIV")
    const indice = document.createElement("SPAN")
    const time = document.createElement("SPAN")
    const btns = document.createElement("DIV")
    const btn1 = document.createElement("BUTTON") // +2
    const btn2 = document.createElement("BUTTON") // DNF
    const btn3 = document.createElement("BUTTON") // Delete

    // Asignación de clases CSS predefinidas para aplicar los estilos de la interfaz
    contenedor_data.classList.add("contenedor_data")
    data.classList.add("data")
    record.classList.add("record")
    indice.classList.add("indice")
    time.classList.add("tiempo")
    btns.classList.add("btns")

    btn1.classList.add("mini_btn", "masdos")
    btn2.classList.add("mini_btn", "dnf")
    btn3.classList.add("mini_btn", "delete")

    // Ensamblaje jerárquico del bloque de botones de control rápido
    btns.appendChild(btn1)
    btns.appendChild(btn2)
    btns.appendChild(btn3)

    // Agrupación visual del número de solve y el tiempo medido
    record.appendChild(indice)
    record.appendChild(time)

    // Unión de los datos de solve y sus respectivos botones en la fila del registro
    data.appendChild(record)
    data.appendChild(btns)

    // Inyección de textos estáticos y etiquetas visibles para el usuario
    btn1.textContent = "+2"
    btn2.textContent = "DNF"
    btn3.textContent = "X"

    // Formatea el prefijo numérico de orden visual (ej: "1.  ")
    indice.textContent = idx + ".  "

    // Bloque condicional encargado de aplicar el formato visual según el estado del solve
    if (dnf === true) {
        // Estado DNF: Prioriza la cadena formateada previa o aplica el fallback clásico, forzando tipografía roja
        time.textContent = timeDNF || "DNF"
        time.style.color = "red"
        btn2.style.color = "red"
    } else if (masDos === true) {
        // Estado +2: Evalúa si existe el cálculo almacenado, si no, le suma matemáticamente 2 segundos al valor original
        time.textContent = timeMasDos ? Number(timeMasDos).toFixed(2) : (Number(t) + 2).toFixed(2)
        time.style.color = "orange"
        btn1.style.color = "orange"
    } else {
        // Estado Normal: Formatea el tiempo flotante del cronómetro a dos posiciones decimales estrictas
        time.textContent = Number(t).toFixed(2)
    }

    // Evento de eliminación directa desde la lista (resta 1 al índice visual para calzar con la base 0 del cursor)
    btn3.addEventListener("click", () => {
        eliminar(idx - 1, "database")
    })

    // Evento para conmutar el estado de descalificación DNF desde la fila del historial
    btn2.addEventListener("click", () => {
        marcarDNF(idx - 1, time)
    })

    // Evento para conmutar la penalización de +2 segundos en tiempo real sobre la fila seleccionada
    btn1.addEventListener("click", () => {
        marcarDos(idx - 1, time)
    })

    // Al pulsar directamente sobre el texto del tiempo se invoca el renderizador para abrir el modal descriptivo
    time.addEventListener("click", () => {
        datoCard(idx - 1)
    })

    // Inserta el nuevo registro al inicio del archivador (orden descendente para visualizar el solve más reciente arriba)
    archivador.prepend(data)
    // Fuerza el scroll automático al tope superior del contenedor para mantener visibilidad del último tiempo guardado
    archivador.scrollTop = 0
}

/*
  verificarEstadoVacio()
  Realiza una inspección táctica del DOM dentro de la barra lateral de historial; si no encuentra
  ninguna fila renderizada con la clase ".data", conmuta estilos CSS para desplegar un mensaje de estado vacío.
*/
export const verificarEstadoVacio = () => {
    const tieneElementos = archivador.querySelector(".data");
    if (!tieneElementos) {
        archivador.classList.add("vacio");
    } else {
        archivador.classList.remove("vacio");
    }
};

// Ejecución analítica de seguridad inicial para determinar si hay que renderizar el placeholder vacío en el arranque
verificarEstadoVacio()