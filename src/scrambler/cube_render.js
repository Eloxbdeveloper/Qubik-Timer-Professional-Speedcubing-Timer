// Contenedor principal del cubo en el DOM (donde se inyectarán las caras).
export const cubo = document.querySelector(".cubo")

// Contenedor de botones o controles interactivos asociados al cubo
export const btns = document.querySelector(".btns")

// Matriz de colores oficiales correspondientes a las 6 caras del cubo 3x3 (esquema estándar de colores)
export const colors = ["white", "blue", "green", "yellow", "red", "orange"]

/*
 * crearCaras(div)
 * Genera dinámicamente las 6 caras del cubo dentro del contenedor HTML proporcionado.
 * Cada cara se modela como un contenedor que aloja exactamente 9 fichas individuales (sub-grilla 3x3).
 */
export function crearCaras(div) {

    // Itera a través del arreglo de colores para construir secuencialmente cada una de las 6 caras
    for (let color of colors) {

        // Crea el elemento contenedor estructural para la cara actual
        let cara = document.createElement("DIV")
        cara.classList.add("cara") // Se asigna la clase base para estilizado CSS (ej. display: grid o flex)

        // Bucle secuencial finito encargado de poblar la cara con sus 9 fichas/stickers reglamentarios
        for (let i = 0; i < 9; i++) {
            let ficha = document.createElement("DIV")
            ficha.classList.add(color) // Aplica la clase de color específica para pintar el sticker mediante CSS
            cara.appendChild(ficha)    // Acopla la ficha al fragmento de la cara actual
        }

        // Inserta la cara completamente armada con sus 9 fichas dentro del contenedor del cubo recibido
        div.appendChild(cara)
    }
}

// Inicialización automática por defecto del cubo en la interfaz al completarse la carga del módulo en memoria
crearCaras(cubo)