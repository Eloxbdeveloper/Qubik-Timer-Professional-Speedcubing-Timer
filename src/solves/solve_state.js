import { db } from "../database/init_DB.js";
import { promedios_front } from "../averages/average_render.js";
import { obtenerStoreActivo } from "../sessions/sessions.js";

/*
 * marcarDNF(index, elementoTime)
 * Alterna el estado de la penalización DNF (Did Not Finish) para un solve específico.
 * - Localiza el registro mediante un cursor asíncrono basándose en su índice posicional.
 * - Si DNF está inactivo: lo activa, remueve cualquier penalización de +2 previa, muta el texto de la UI a "DNF" en color rojo y atenúa los controles secundarios.
 * - Si DNF está activo: lo remueve y restaura el estado temporal previo (tiempo original limpio o penalizado por +2 si correspondía).
 * - Modifica de forma permanente el almacén de datos IndexedDB y dispara el recalculo de promedios globales.
 */
export async function marcarDNF (index, elementoTime){
    let store = await obtenerStoreActivo()
    let transaccion = db.transaction(store, "readwrite")
    let confirmar = transaccion.objectStore(store)
        
    let request = confirmar.openCursor()
    let contador = 0

    request.onsuccess = (e) => {
        let cursor = e.target.result

        if (cursor) {
            if (contador === index) {
                let registro = cursor.value

                if (registro.dnf === false) {
                    registro.dnf = true
                    registro.masDos = false

                    elementoTime.textContent = registro.timeDNF
                    elementoTime.style.color = "red"

                    const dataDiv = elementoTime.closest(".data")
                    dataDiv.querySelector(".dnf").style.color = "red"
                    dataDiv.querySelector(".masdos").style.color = "#777"

                } else {
                    registro.dnf = false

                    if (registro.masDos === false) {
                        elementoTime.textContent = Number(registro.time).toFixed(2)
                        elementoTime.style.color = "#00b85c"
                    } else {
                        elementoTime.textContent = Number(registro.timeMasDos).toFixed(2)
                        elementoTime.style.color = "orange"
                    }

                    const dataDiv = elementoTime.closest(".data")
                    dataDiv.querySelector(".dnf").style.color = "#777"
                }

                cursor.update(registro)
                return
            }

            contador++
            cursor.continue()
        }
    }   

    transaccion.oncomplete = () => {
        promedios_front()
    }
}

/*
 * marcarDos(index, elementoTime)
 * Alterna el estado de la penalización reglamentaria de +2 segundos para un solve específico.
 * - Rastrea de forma secuencial los registros del almacén mediante cursores hasta coincidir con el índice.
 * - Si +2 está inactivo: conmuta la bandera a verdadero, apaga cualquier estado de DNF colindante, inyecta visualmente el valor acumulado (timeMasDos) teñido en color naranja y actualiza los indicadores visuales correspondientes.
 * - Si +2 está activo: remueve la penalización y evalúa si debe retornar al estado base de tiempo normal o a un DNF residual.
 * - Persiste los cambios estructurales en IndexedDB y actualiza los paneles asíncronos de promedios de la interfaz.
 */
export async function marcarDos (index, elementoTime){
    let store = await obtenerStoreActivo()
    let transaccion = db.transaction(store, "readwrite")
    let confirmar = transaccion.objectStore(store)
        
    let request = confirmar.openCursor()
    let contador = 0

    request.onsuccess = (e) => {
        let cursor = e.target.result

        if (cursor) {
            if (contador === index) {
                let registro = cursor.value

                if (registro.masDos === false) {
                    registro.masDos = true
                    registro.dnf = false

                    elementoTime.textContent = Number(registro.timeMasDos).toFixed(2)
                    elementoTime.style.color = "orange"

                    const dataDiv = elementoTime.closest(".data")
                    dataDiv.querySelector(".masdos").style.color = "orange"
                    dataDiv.querySelector(".dnf").style.color = "#777"

                } else {
                    registro.masDos = false

                    if (registro.dnf === true) {
                        elementoTime.textContent = registro.timeDNF
                        elementoTime.style.color = "red"
                    } else {
                        elementoTime.textContent = Number(registro.time).toFixed(2)
                        elementoTime.style.color = "#00b85c"
                    }

                    const dataDiv = elementoTime.closest(".data")
                    dataDiv.querySelector(".masdos").style.color = "#777"
                }

                cursor.update(registro)
                return
            }

            contador++
            cursor.continue()
        }
    }
    transaccion.oncomplete = () => {
        promedios_front()
    }
}