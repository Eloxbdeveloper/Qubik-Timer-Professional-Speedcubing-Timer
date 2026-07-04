import { db } from "./init_DB.js"
import { dataDiv, archivador } from "./DB_render.js"
import { promedios_front } from "../averages/average_render.js"
import { verificarEstadoVacio } from "./DB_render.js"
import { obtenerStoreActivo } from "../sessions/sessions.js";

/*
  Añade un objeto a la objectStore especificada.
  No maneja eventos de éxito o error explícitamente (inserción directa en lote).
*/
export const añadir_JSON = (obj, store) => {
    // Abre una transacción de lectura y escritura en el almacén de datos enviado por parámetro
    let transaccion = db.transaction(store, "readwrite")
    let confirmar = transaccion.objectStore(store)
    
    // Ejecuta la petición asíncrona para agregar el objeto a la base de datos
    let request = confirmar.add(obj)
}

/*
  Añade un nuevo registro a la objectStore activa.
  - Al tener éxito, limpia la UI por completo y renderiza de forma
    ordenada y limpia leyendo directamente el array real de IndexedDB.
*/
export async function añadir (obj) {

    // Obtiene de forma asíncrona el almacén correspondiente a la sesión de usuario activa
    let store = await obtenerStoreActivo()
    let transaccion = db.transaction(store, "readwrite")
    let confirmar = transaccion.objectStore(store)
    
    // Envía la petición para añadir el nuevo objeto (solve)
    let request = confirmar.add(obj)

    // Manejador que se dispara inmediatamente cuando el motor de IndexedDB confirma la inserción
    request.onsuccess = (e) => {
        //  SOLUCIÓN CRÍTICA: En lugar de contar el DOM de forma imprecisa, 
        // leemos la base de datos real para re-renderizar todo limpio y en su orden correcto.
        leer((array) => {
            // Elimina los nodos antiguos del contenedor para evitar duplicaciones o desfases visuales
            if (archivador) archivador.innerHTML = ""; // Vaciamos los fantasmas del DOM
            
            // Reconstruye de forma secuencial cada fila en el historial de la interfaz de usuario
            array.forEach((item, idx) => {
                dataDiv(
                    idx + 1, // El índice real e inequívoco (1, 2, 3...) mapeado desde el orden físico del array
                    item.time, 
                    item.dnf, 
                    item.masDos, 
                    item.timeMasDos, 
                    item.timeDNF
                )
            })
        })
    }
    
    // Captura errores específicos ocurridos durante la inserción del registro
    request.onerror = (e) => {
        console.error("error: ", e.target.error)
    }

    // El evento 'oncomplete' garantiza que la transacción se cerró con éxito y los datos se guardaron físicamente
    transaccion.oncomplete = () => {

        // Recalcula y renderiza de nuevo los promedios globales con la información actualizada
        promedios_front()
    }

    // Captura fallas críticas a nivel global de la transacción completa (ej. violación de restricciones o cuotas)
    transaccion.onerror = (e) => {

    }
}

/*
  Lee todos los registros de una objectStore usando un cursor.
  Soporta dos firmas de llamada de forma segura (sobrecarga de parámetros manual):
  1. leer(callback) -> Usa el store activo por defecto.
  2. leer(storeNombre, callback) -> Usa un store específico (útil para eventos de cambio de sesión).
*/
export async function leer (param1, param2) {
    let store;
    let cb;

    // Detectar dinámicamente si el primer parámetro es el nombre del store o la función callback
    if (typeof param1 === "string") {
        store = param1; // Si es string, se asigna como almacén explícito
        cb = param2;    // El segundo parámetro pasa a ser el callback
    } else {
        store = await obtenerStoreActivo(); // Si no es string, asume que es el callback y busca el store activo
        cb = param1;
    }

    // Crea una transacción en modo de solo lectura, optimizando el rendimiento de la consulta
    let transaccion = db.transaction(store, "readonly")
    let objectStore = transaccion.objectStore(store)

    // Inicializa la petición de apertura del cursor
    let request = objectStore.openCursor()
    let arrayDB = [] // Array temporal encargado de acumular todos los registros del almacén

    // Se ejecuta de manera iterativa por cada registro individual localizado por el cursor
    request.onsuccess = (e) => {
        let cursor = e.target.result
        if (cursor) {
            // Inserta el valor actual apuntado por el cursor dentro del array de acumulación
            arrayDB.push(cursor.value)
            // Desplaza el cursor hacia el siguiente elemento del almacén de datos
            cursor.continue()
        } else {
            // Se ejecuta este bloque condicional cuando el cursor ha terminado de recorrer el último registro
            // Valida y ejecuta la función callback retornando el array completo de registros mapeados
            if (cb && typeof cb === "function") cb(arrayDB)
        }
    }

    // Captura errores generados durante la lectura secuencial del cursor
    request.onerror = (e) => {
        console.error("Error al leer registros:", e.target.error)
    }

    return arrayDB
}

/*
  Elimina un registro de la base de datos localizando su id real
  mediante una búsqueda secuencial basada en su índice lógico (posición visual en la UI).
*/
export async function eliminar (index, div){

    let store = await obtenerStoreActivo()
    let transaccion = db.transaction(store, "readwrite")
    let storage = transaccion.objectStore(store)

    // Abre un cursor para recorrer el almacén hasta coincidir con el índice visual seleccionado
    let request = storage.openCursor()
    let contador = 0

    request.onsuccess = (e) => {
        let cursor = e.target.result

        if (cursor) {
            // Si el contador actual coincide con la posición visual de la tarjeta/fila...
            if (contador === index) {
                let id = cursor.value.id // Extrae la clave primaria real (id autoincremental/único)
                storage.delete(id)       // Remueve físicamente el registro usando su clave primaria
                return                   // Interrumpe la iteración del cursor de manera inmediata
            }
            contador++
            cursor.continue()
        }
    }

    // Se dispara una vez que la operación de borrado ha finalizado con éxito en el hilo de la base de datos
    transaccion.oncomplete = () => {
        // Si el borrado se originó desde el historial general o desde una tarjeta de detalle...
        if (div == "database" || div == "card") {
            // Vuelve a leer la base de datos actualizada para sincronizar por completo el DOM
            leer((array) => {
                if (archivador) archivador.innerHTML = "" // Limpia el contenedor visual
                // Redibuja secuencialmente los elementos restantes con sus nuevos números de índice correctos
                array.forEach((item, idx) => {
                    dataDiv(
                        idx + 1, 
                        item.time, 
                        item.dnf, 
                        item.masDos, 
                        item.timeMasDos, 
                        item.timeDNF
                    )
                })

                // Se ejecuta aquí para comprobar si la lista se quedó sin elementos tras borrar
                verificarEstadoVacio();

                // Se ejecuta inmediatamente después de reconstruir el array para refrescar las estadísticas
                promedios_front()
            })
        } else {
            // Si viene de otra sección externa, actualiza los promedios garantizando estabilidad visual
            promedios_front()
        }
    }

    // Captura fallas de ejecución en el proceso de borrado del registro o apertura del cursor
    request.onerror = (e) => {
        console.error("Error al eliminar por índice:", e.target.error)
    }
}