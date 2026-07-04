import { db } from "./init_DB.js"
import { obtenerStoreActivo } from "../sessions/sessions.js";

/*
 checkDBProm

 Lee todos los registros almacenados en el objectStore "promDB".
 Utiliza un cursor de IndexedDB para recorrer cada registro.
 Devuelve los datos a través de un callback (cb).
*/
export const checkDBProm = (cb) => {

    // Retorna una Promesa para integrarse fluidamente con arquitecturas async/await en la UI
    return new Promise((resolve, reject) => {

        // Apertura de canal de comunicación transaccional de solo lectura para evitar hilos bloqueantes
        const transaccion = db.transaction("promDB", "readonly");
        const store = transaccion.objectStore("promDB");
        const request = store.openCursor();

        let datosProm = [];

        // Manejador de flujo iterativo del cursor
        request.onsuccess = (e) => {

            const cursor = e.target.result;

            if (cursor) {
                // Acumula la metadata de configuración visual de cada promedio de manera secuencial
                datosProm.push(cursor.value);
                cursor.continue(); // Mueve el puntero del almacén al siguiente registro disponible
            } else {
                // Disparador de callback tradicional para compatibilidad y resolución de la promesa nativa
                if (cb) cb(datosProm);
                resolve(datosProm); // ✅ aquí sí existe y consolida la colección completa
            }
        };

        // Manejador de fallas críticas en la consulta del almacén
        request.onerror = (e) => {
            reject(e.target.error);
        };

    });
};


/*
 arrayDB

 Devuelve una Promise que:
 - Lee todos los solves almacenados en el objectStore "cube3x3"
 - Normaliza el valor según su estado (normal, +2, DNF)
 - Retorna un arreglo con los tiempos listos para cálculos estadísticos
 - Invierte el arreglo para que el solve más reciente quede primero
*/
export async function arrayDB (object, limit = null){

    // Identificación dinámica del almacén según la sesión o categoría de cubo activa del usuario
    let store = await obtenerStoreActivo()

    return new Promise((resolve, reject) => {

        let transaccion = db.transaction(store, "readonly")
        let objectStore = transaccion.objectStore(store)
        
        // OPTIMIZACIÓN: Se inicializa el cursor con la directiva "prev" (Reverse Cursor)
        // Esto lee la base de datos de atrás hacia adelante, asegurando que los solves más recientes se procesen primero.
        const request = objectStore.openCursor(null, "prev");

        const array = [];

        request.onsuccess = (e) => {

            const cursor = e.target.result;
            
            if (cursor) {

                // si ya alcanzaste el límite, cortas
                // Corta de forma anticipada la iteración del cursor para evitar lecturas innecesarias en la memoria (ej. Mo3 o Ao5)
                if (limit !== null && array.length >= limit) {
                    resolve(array)
                    return
                }

                const obj = cursor.value;

                // NORMALIZACIÓN ESTADÍSTICA (REGLAMENTO DE LA WCA):
                // Si 'object' es verdadero, exporta el documento plano con metadatos (scramble, fecha, etc.)
                if (object) {
                    array.push(obj)
                } else {
                    // Si es falso, extrae y purifica estrictamente el string o número final adaptado a la penalización
                    if (obj.masDos) array.push(obj.timeMasDos); // Inserta el tiempo procesado con el castigo de +2.00s
                    else if (obj.dnf) array.push(obj.timeDNF);   // Inserta el flag de descalificación o String "DNF"
                    else array.push(obj.time);                  // Inserta el tiempo puro limpio de penalizaciones
                }

                cursor.continue(); // Continúa el escaneo inverso hacia los registros más antiguos

            } else {

                // Resuelve la estructura de datos procesada cuando el cursor llega al final del almacén
                resolve(array);
            }
        };

        request.onerror = (e) => reject(e.target.error);
    });
};