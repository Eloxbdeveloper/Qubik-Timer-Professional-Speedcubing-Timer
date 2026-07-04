import { arrayDB } from "../database/average_DB.js"
import { Mo3, funcGeneral } from "./average_calculations.js"

/*
 * funcBest(num, position)
 * Localiza de forma exhaustiva el mejor promedio móvil posible para una ventana de tamaño `num`.
 * - Obtiene secuencialmente el historial completo de tiempos desde el almacén indexado.
 * - Genera subconjuntos iterativos de tamaño `num` utilizando un algoritmo de ventana deslizante.
 * - Evalúa y discrimina los promedios parciales válidos mediante funciones específicas (Mo3 o medias WCA truncadas).
 * - Ordena los resultados para extraer la marca óptima y reconstruir el conjunto de solves que la originaron.
 * - Si el flag `position` es verdadero, retorna el índice inicial de la racha; de lo contrario, retorna el valor del promedio.
 */
export async function funcBest(num, position) {

    // Inicialización de variables para la base de datos local y el manejo de promedios
    let db = await arrayDB()
    let promedios = []
    let calculo = []
    let resultado

    // Validación inicial: Si el total de resoluciones almacenadas es menor que el tamaño 
    // de la ventana solicitado (ej. pedir Ao5 teniendo solo 3 tiempos), no se puede calcular.
    if (db.length < num) {
        resultado = "--"
        return resultado
    } else {

        // Bucle principal: Recorre el historial de tiempos para generar las ventanas móviles (sub-arrays)
        for (let iO = 0; iO < db.length; iO++) {

            // Bucle secundario: Agrupa la cantidad de tiempos requeridos ('num') a partir del índice actual 'iO'
            for (let i = 0; i < num; i++) {

                // Control de desbordamiento y datos corruptos en el array de la base de datos
                if (!db[i + iO] || db[i + iO] == undefined || db[i + iO] == NaN) {
                    break
                } else {
                    calculo.push(db[i + iO])
                }

            }

            let resParcial

            // Bifurcación matemática: Si la ventana es de 3 elementos, aplica la lógica específica de Mean of 3 (Mo3).
            // Para tamaños mayores (Ao5, Ao12, etc.), utiliza la función de promedio general (que descarta el mejor y peor tiempo).
            if (num == 3) {
                resParcial = await Mo3(calculo)
            } else {
                resParcial = await funcGeneral(num, calculo)
            }

            // Almacena el resultado del promedio de la ventana actual y limpia el contenedor temporal
            promedios.push(resParcial)
            calculo = []
        }

        // Se respalda el array de promedios en su estado original (con el mismo orden cronológico de las ventanas)
        // Esto es crítico para poder rastrear los índices reales y la posición de los tiempos más adelante.
        let savePromedios = promedios

        // Filtrado de datos: Se descartan los estados de penalización (DNF) y valores vacíos ("--") 
        // para dejar únicamente los promedios numéricos válidos en el array de ordenamiento.
        promedios = promedios.filter(x => x !== "DNF")
        promedios = promedios.filter(x => x !== "--")

        // Ordenamiento ascendente: El menor tiempo numérico representa el mejor promedio (Best PB) y se posicionará en el índice 0.
        promedios.sort((a, b) => a - b)


        // Si todas las ventanas calculadas dieron como resultado "DNF", el mejor promedio global se marca como "DNF".
        if (promedios.length == 0 && db.length >= num) {
            resultado = "DNF"
        }

        // Búsqueda del índice original: Se localiza en qué parte del historial cronológico (`savePromedios`)
        // se encuentra el valor que coincidió con el mejor promedio (`promedios[0]`).
        let posicion

        for (let i = 0; i < savePromedios.length; i++) {
            if (savePromedios[i] === promedios[0]) {
                posicion = i 
                break
            }
        }


        // Reconstrucción del subconjunto de tiempos: Sabiendo la posición inicial exacta,
        // se extraen de la base de datos los 'num' tiempos individuales que conformaron este mejor promedio.
        let bestPromedio = []

        for (let i = 0; i < num; i++) {
            bestPromedio.push(db[posicion + i])
        }

        // Estructuración del objeto de retorno con toda la metadata del mejor promedio hallado
        if (resultado != "--" && resultado != "DNF") {
            resultado = {
                average: promedios[0],
                times: bestPromedio,
                posicionDB: posicion
            }
        }
    }

    
    // Manejo de retornos según el estado del resultado final
    if (resultado == "DNF") {
        return "DNF"
    }

    // Validación de seguridad por si el objeto de resultado no se construyó correctamente
    if (resultado.average == undefined) {
        return "--"
    }
    // Si la función fue invocada solicitando explícitamente la posición (flag `position` en true), 
    // devuelve el índice del inicio de la racha en la base de datos en lugar del valor del promedio.
    else if (position) {
        return resultado.posicionDB
    }
    // Por defecto, devuelve el valor numérico del mejor promedio calculado.
    else {
        return resultado.average
    }
}