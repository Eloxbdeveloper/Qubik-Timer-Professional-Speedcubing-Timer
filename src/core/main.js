
import { leer  } from "../database/crud.js"
import { dataDiv } from "../database/DB_render.js"
import { checkManualInput } from "../configuration/configuration_render.js"


/*
 Función global que se ejecuta cuando la base de datos
 ya está inicializada y disponible.

 - Llama a leer() para obtener todos los registros guardados.
 - Recorre el array recibido.
 - Renderiza cada registro en el DOM usando dataDiv().
*/
window.onDBReady = (db) => {
    
    // HIDRATACIÓN INICIAL DEL HISTORIAL (DOM):
    // Realiza una lectura asíncrona completa de las resoluciones guardadas y las inyecta en la tabla/vista principal
    leer((array) => {
        array.forEach((item, idx) => {
            // Mapea cada solve asignándole un índice incremental (base 1) junto con sus tiempos y penalizaciones (DNF / +2)
            dataDiv(idx + 1, item.time, item.dnf, item.masDos)
        })
    })

    // CICLO DE VERIFICACIÓN ASÍNCRONO (POLLING INTERVAL):
    // Garantiza que la configuración de la UI se aplique de manera segura una vez que la instancia de 'db' esté completamente resuelta
    const interval = setInterval(() => {

        // Clausura de seguridad: si la conexión no está lista, pospone la ejecución para el siguiente ciclo
        if (!db) return;

        // Evalúa la persistencia para definir si se muestra el cronómetro por teclado o la caja de entrada manual (Stackmat)
        checkManualInput();

        // Destrucción del intervalo para liberar memoria una vez completada la sincronización inicial
        clearInterval(interval);

    }, 50); // Evaluación continua con una tasa de refresco de 50ms
}