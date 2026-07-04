import { eliminar, leer } from "./crud.js";            
import { db } from "./init_DB.js";                                         
import { scrambler, estadoCero } from "../scrambler/scrambler_engine.js"; 
import { crearCaras } from "../scrambler/cube_render.js";         
import { promedios_front } from "../averages/average_render.js";   
import { obtenerStoreActivo } from "../sessions/sessions.js";
import { archivador, contenedor, dataDiv, verificarEstadoVacio } from "./DB_render.js";

/*
  datoCard(index)
  Recorre IndexedDB mediante un cursor hasta encontrar el solve
  correspondiente al índice visual y genera su vista detallada (card).
*/
export async function datoCard(index){

    // Obtiene el almacén de datos (object store) que se encuentra activo en la sesión actual
    let store = await obtenerStoreActivo()
    // Abre una transacción de lectura y escritura en la base de datos para dicho almacén
    let transaccion = db.transaction(store, "readwrite")
    let confirmar = transaccion.objectStore(store)
            
    // Abre un cursor para iterar de manera secuencial sobre los registros del almacén
    let request = confirmar.openCursor()
    // Contador interno para emparejar la posición en IndexedDB con el índice visual (UI)
    let contador = 0

    // Manejador de éxito al abrir o avanzar el cursor
    request.onsuccess = (e) => {
        let cursor = e.target.result
        if (cursor) {
            // Si el contador coincide con el índice solicitado, se procesa el registro actual
            if (contador === index) {
                crearCard(cursor.value, index)
                return // Finaliza la ejecución al encontrar el elemento
            }
            // Incrementa el contador y desplaza el cursor al siguiente registro
            contador++
            cursor.continue()
        }
    }

    // Manejador de errores en la consulta del cursor
    request.onerror = (e) => {
        console.error("Error al buscar por índice:", e.target.error)
    }
}

/*
  crearCard(dato, index, modificable)
  Construye de forma dinámica en el DOM la tarjeta modal interactiva (overlay) 
  con los detalles de un solve específico (tiempo, scramble, penalizaciones, render del cubo).
*/
export const crearCard = (dato, index, modificable) => {

    // Contenedor principal de fondo oscuro (modal/overlay)
    const overlayCard = document.createElement("div")
    overlayCard.classList.add("overlay_card")

    // Contenedor físico de la tarjeta
    const card = document.createElement("div")
    card.classList.add("card")
    overlayCard.appendChild(card)

    // Fila superior para botones de control rápido (Cerrar, Borrar, Copiar)
    const btnsTop = document.createElement("div")
    btnsTop.classList.add("btns_card_top")

    // Botón para copiar la combinación del scramble al portapapeles
    const btnCopy = document.createElement("button")
    btnCopy.classList.add("btn_card_start")
    btnCopy.textContent = "Copy Scramble"

    // Botón para cerrar la modal de la tarjeta
    const btnClose = document.createElement("button")
    btnClose.classList.add("btn_card_start","close_card")
    btnClose.textContent = "x"
    btnClose.style.padding="20px 0px"

    btnsTop.append(btnCopy)
    card.appendChild(btnsTop)

    // Sección central que agrupa la información principal y el tiempo del solve
    const optionsCard = document.createElement("div")
    optionsCard.classList.add("options_card")

    const timeCard = document.createElement("span")
    timeCard.classList.add("time_card")

    // Determina el formato de visualización del tiempo según su estado de penalización (Normal, DNF o +2)
    if (!dato.dnf && !dato.masDos) {
        timeCard.textContent = dato.time
    } else if (dato.dnf) {
        timeCard.textContent = dato.timeDNF
    } else if (dato.masDos) {
        timeCard.textContent = Number(dato.timeMasDos).toFixed(2) + "+"
    }

    optionsCard.appendChild(timeCard)

    // Fila inferior para etiquetas y botones de penalizaciones directas
    const btnsBottom = document.createElement("div")
    btnsBottom.classList.add("btn_card_bottom")

    // Etiqueta indicadora del tipo de cubo (ej. "3x3")
    const btn3x3 = document.createElement("button")
    btn3x3.classList.add("btn_card_end", "masdos")
    btn3x3.textContent = dato.typeCube

    btnsBottom.append(btn3x3)

    // Si la tarjeta permite modificaciones (por defecto sí), se inyectan opciones de edición y borrado
    if(modificable!=false){
        btnClose.style.padding="20px"
        
        const btnMas2 = document.createElement("button")
        btnMas2.classList.add("btn_card_end", "masdos")
        btnMas2.textContent = "+2"

        const btnDNF = document.createElement("button")
        btnDNF.classList.add("btn_card_end", "dnf")
        btnDNF.textContent = "DNF"

        const btnDelete = document.createElement("button")
        btnDelete.classList.add("btn_card_start", "delete")
        btnDelete.textContent = "Delete"

        btnsTop.append(btnDelete)
        btnsBottom.append(btnMas2, btnDNF)
        
        // Evento para eliminar definitivamente el solve de la interfaz y de la base de datos
        btnDelete.addEventListener("click", (e) => {
            e.target.closest(".overlay_card").remove()
            eliminar(index, "card")
        })

        // Evento para conmutar el estado de DNF (Did Not Finish) en IndexedDB
        btnDNF.addEventListener("click", async function (){

            let store = await obtenerStoreActivo()
            let transaccion = db.transaction(store, "readwrite")
            let confirmar = transaccion.objectStore(store)
        
            let request = confirmar.openCursor()
            let contador = 0;

            request.onsuccess = (e) => {
                let cursor = e.target.result;
                if (cursor) {
                    if (contador === index) {
                        let registro = cursor.value;

                        // Alterna el flag de DNF e invalida cualquier penalización de +2 previa
                        registro.dnf = !registro.dnf;
                        registro.masDos = false;

                        // Actualiza dinámicamente los estilos visuales y textos de la tarjeta modal
                        if (registro.dnf) {
                            btnDNF.style.backgroundColor = "red";
                            btnMas2.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                            timeCard.textContent = registro.timeDNF;
                        } else {
                            btnDNF.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                            timeCard.textContent = Number(registro.time).toFixed(2);
                        }

                        // Persiste la actualización en IndexedDB
                        cursor.update(registro);

                        // Vuelve a leer el almacén completo para redibujar el historial general (sidebar/lista)
                        leer((array) => {
                            archivador.innerHTML = ""; 
                            array.forEach((item, idx) => {
                                dataDiv(idx + 1, item.time, item.dnf, item.masDos, item.timeMasDos, item.timeDNF);
                            });
                            verificarEstadoVacio();
                        });

                        return;
                    }
                    contador++;
                    cursor.continue();
                }
            };

            // Intercepta la finalización de la transacción para recalcular los promedios globales en el frontend
            let oldOncomplete = transaccion.oncomplete;
            transaccion.oncomplete = (e) => {
                if (typeof oldOncomplete === "function") oldOncomplete(e);
                promedios_front();
            }
        });

        // Evento para conmutar la penalización de +2 segundos en IndexedDB
        btnMas2.addEventListener("click", async function (){

            let store = await obtenerStoreActivo()
            let transaccion = db.transaction(store, "readwrite")
            let confirmar = transaccion.objectStore(store)
        
            let request = confirmar.openCursor()
            let contador = 0;

            request.onsuccess = (e) => {
                let cursor = e.target.result;
                if (cursor) {
                    if (contador === index) {
                        let registro = cursor.value;

                        // Alterna el flag de +2 segundos e invalida el estado DNF previo
                        registro.masDos = !registro.masDos;
                        registro.dnf = false;

                        // Actualiza dinámicamente los estilos visuales y textos de la tarjeta modal
                        if (registro.masDos) {
                            btnMas2.style.backgroundColor = "orange";
                            btnDNF.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                            timeCard.textContent = Number(registro.timeMasDos).toFixed(2)+"+";
                        } else {
                            btnMas2.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                            timeCard.textContent = Number(registro.time).toFixed(2);
                        }

                        // Persiste la actualización en IndexedDB
                        cursor.update(registro);

                        // Vuelve a leer el almacén completo para redibujar el historial general (sidebar/lista)
                        leer((array) => {
                            archivador.innerHTML = ""; 
                            array.forEach((item, idx) => {
                                dataDiv(idx + 1, item.time, item.dnf, item.masDos, item.timeMasDos, item.timeDNF);
                            });
                            verificarEstadoVacio();
                        });

                        return;
                    }
                    contador++;
                    cursor.continue();
                }
            };
            
            // Intercepta la finalización de la transacción para recalcular los promedios globales en el frontend
            let oldOncomplete = transaccion.oncomplete;
            transaccion.oncomplete = (e) => {
                if (typeof oldOncomplete === "function") oldOncomplete(e);
                promedios_front();
            }
        })
        // Mantiene los colores de estado correctos si el registro ya contaba con penalizaciones activas al abrirse
        if (dato.masDos) btnMas2.style.backgroundColor = "orange"
        if (dato.dnf) btnDNF.style.backgroundColor = "red"
    }
    
    btnsTop.append(btnClose)
    optionsCard.appendChild(btnsBottom)

    // Agrega la fecha de realización del solve a la tarjeta
    const dateCard = document.createElement("span")
    dateCard.classList.add("date_card")
    dateCard.textContent = dato.date
    optionsCard.appendChild(dateCard)

    card.appendChild(optionsCard)

    // Sección para la representación visual y textual del estado del cubo
    const scrambleCard = document.createElement("div")
    scrambleCard.classList.add("scramble_card")

    const cuboCard = document.createElement("div")
    cuboCard.classList.add("cubo_card")

    const mini_cubo = document.createElement("div")
    mini_cubo.classList.add("mini_cubo")

    // Inicializa y dibuja gráficamente el cubo en 2D/3D a partir del scramble guardado
    crearCaras(mini_cubo) // Crea los elementos de las caras
    estadoCero(mini_cubo) // Resetea el cubo al estado resuelto
    scrambler(mini_cubo, dato.scramble.split(" ")) // Aplica los movimientos del algoritmo secuencialmente

    cuboCard.appendChild(mini_cubo)

    // Texto plano que muestra la secuencia de movimientos (scramble)
    const pCombination = document.createElement("p")
    pCombination.classList.add("combination_card")
    pCombination.textContent = dato.scramble

    cuboCard.appendChild(pCombination)
    scrambleCard.appendChild(cuboCard)
    card.appendChild(scrambleCard)

    // Inserta la modal completamente estructurada en el contenedor principal del DOM
    contenedor.appendChild(overlayCard)

    // Evento de cierre manual al pulsar el botón 'x'
    btnClose.addEventListener("click", (e) => {
        e.target.closest(".overlay_card").remove()
    })

    // Evento para copiar el texto del scramble y disparar una animación de confirmación temporal
    btnCopy.addEventListener("click",()=>{
        navigator.clipboard.writeText(dato.scramble);
        btnCopy.classList.add("animacion-copiado");

        setTimeout(() => {
            btnCopy.classList.remove("animacion-copiado");
        }, 800);
    })
}