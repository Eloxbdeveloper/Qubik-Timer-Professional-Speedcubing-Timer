import { db } from "../database/init_DB.js"
import { Mo3, funcGeneral, singleAndMedia } from "./average_calculations.js"
import { funcBest } from "./average_Best.js"
import { promedios_p, mediaSingle_p, selects } from "./average_state.js"
import { checkDBProm, arrayDB } from "../database/average_DB.js"
import {   crearCardStats } from "../database/stats_render.js"
import { crearCard } from "../database/cards_render.js"

// Elemento contenedor raíz del DOM donde se inyectarán las estadísticas visuales
const promedios = document.querySelector(".promedios")

/**
 * Genera de forma dinámica la interfaz gráfica de promedios (Single, Media y selectores Mo3/AoN).
 * Realiza la carga inicial de datos y vincula los escuchas de eventos (listeners).
 */
export const crearPromedios = async (dato) => {

    // Bloque estructural para los encabezados globales (Single y Media general)
    const dates = document.createElement("div");
    dates.classList.add("dates");

    // Construcción y almacenamiento referencial del nodo de Mejor Tiempo Individual (Single PB)
    const h2Single = document.createElement("h2");
    let single = await singleAndMedia("single");
    h2Single.textContent = "Single: " + single;

    mediaSingle_p[0] = h2Single // Se respalda en el estado global para actualizaciones reactivas sin re-renderizar todo

    // Construcción y almacenamiento referencial del nodo de Media Global (Media acumulada)
    const h2Media = document.createElement("h2");
    let media = await singleAndMedia("media");
    h2Media.textContent = "Media: " + media;

    dates.appendChild(h2Single);
    dates.appendChild(h2Media);

    mediaSingle_p[1] = h2Media // Respaldo del nodo Media en el objeto de estados

    // Contenedor principal de la rejilla de promedios específicos (Mo3 hasta Ao100)
    const boxPromedios = document.createElement("div");
    boxPromedios.classList.add("box_promedios");

    // Arreglo maestro de iteración para mapear los formatos de estadísticas admitidos
    let medias = ["Mo3", "Ao12", "Ao25", "Ao50", "Ao5", "Ao100"]
    let index = 0;

    for (let i of medias) {

        let idx = index // Aislamiento del índice en el alcance (scope) del bucle para closures de eventos

        // Contenedor individual de la tarjeta del promedio actual
        let prom1 = document.createElement("div");
        prom1.classList.add("promedios_ao5");

        // Lista desplegable para alternar la vista entre el promedio actual (Current) o histórico (Best)
        let sel1 = document.createElement("select");
        sel1.classList.add("select_promedio")

        let opt1a = document.createElement("option");
        opt1a.value = "Current";
        opt1a.textContent = `${i} Current`;

        let opt1b = document.createElement("option");
        opt1b.value = "Best";
        opt1b.textContent = `${i} Best`;

        sel1.appendChild(opt1a);
        sel1.appendChild(opt1b);

        selects[i] = sel1 // Registro global del nodo select para lecturas dinámicas externas

        // Elemento textual donde se pintará el resultado del tiempo calculado
        let p1 = document.createElement("p");
        p1.classList.add("time_promedio", "valido");

        prom1.appendChild(sel1);
        prom1.appendChild(p1);

        promedios_p[i] = p1 // Registro del nodo del párrafo para mutaciones rápidas desde promedios_front()

        let num

        // BIFURCACIÓN DE EVALUACIÓN INICIAL:
        // Verifica en la configuración recuperada si este promedio se configuró para mostrar "Current" (true)
        if (dato[idx].actual === true) {

            // Enrutamiento de cálculos para la racha más reciente (últimos N solves de la base de datos)
            if (i == "Mo3") {
                num = await Mo3()
            }
            if (i == "Ao5") {
                num = await funcGeneral(5)
            }
            if (i == "Ao12") {
                num = await funcGeneral(12)
            }
            if (i == "Ao25") {
                num = await funcGeneral(25)
            }
            if (i == "Ao50") {
                num = await funcGeneral(50)
            }
            if (i == "Ao100") {
                num = await funcGeneral(100)
            }
        }

        // Si se configuró para mostrar el récord histórico personal "Best" (false)
        else if (dato[idx].actual === false) {

            // Enrutamiento de escaneo analítico para hallar la mejor ventana móvil de tamaño N en el historial
            if (i == "Mo3") {
                num = await funcBest(3)
            }
            if (i == "Ao5") {
                num = await funcBest(5)
            }
            if (i == "Ao12") {
                num = await funcBest(12)
            }
            if (i == "Ao25") {
                num = await funcBest(25)
            }
            if (i == "Ao50") {
                num = await funcBest(50)
            }
            if (i == "Ao100") {
                num = await funcBest(100)
            }
        }

        p1.textContent = num; // Asignación visual del tiempo en el DOM

        boxPromedios.appendChild(prom1);

        // PERSISTENCIA EN INTERFAZ Y EVENTOS:
        // Sincroniza visualmente la opción seleccionada del 'select' con el estado guardado
        if (dato) {

            if (dato[idx].actual === true) {
                sel1.value = "Current";
            } else {
                sel1.value = "Best";
            }

            // Manejador de cambio: Actualiza el estado en memoria, escribe en IndexedDB y refresca la vista
            sel1.addEventListener("change", async () => {

                if (sel1.value === "Current") {
                    dato[idx].actual = true;
                } else {
                    dato[idx].actual = false;
                }

                // Apertura de transacción en modo lectura/escritura en el almacén 'promDB'
                const tx = db.transaction("promDB", "readwrite");
                const store = tx.objectStore("promDB");
                store.put(dato[idx]); // Guarda los cambios de preferencia del usuario

                await promedios_front(); // Refresco reactivo e inmediato de todos los textos del front
            });
        }

        // Duplicación de escucha de control (Mantiene consistencia de asignación de variables locales)
        sel1.addEventListener("change", () => {

            if (sel1.value === "Current") {
                dato[idx].actual = true;
            } else {
                dato[idx].actual = false;
            }

            const tx = db.transaction("promDB", "readwrite");
            const store = tx.objectStore("promDB");
            store.put(dato[idx]);

        });

        // Subfunción interactiva: Dispara una tarjeta emergente (Modal/Card) con el desglose de estadísticas
        async function card() {

            // Solo abre si el promedio posee un valor numérico procesable (se descartan vacíos y penalizaciones totales)
            if (p1.textContent != "--" && p1.textContent != "DNF") {

                let info = await checkDBProm(); // Obtiene la metadata guardada para los promedios
                crearCardStats(info[idx].stats, info[idx].actual) // Renderiza la ventana de detalle estadístico
            }
        }

        p1.addEventListener("click", card) // Ejecuta el modal al hacer clic sobre el número del promedio

        index++
    }

    // Listener para la Media Global: Levanta el modal con el reporte completo de la sesión al hacer clic
    h2Media.addEventListener("click", async function () {
        let media_prueba= await singleAndMedia("media")
        if(media!="--"){
            crearCardStats("Media", true)
        }
        
    })

    // Listener para el Single Individual: Al hacer clic, busca el objeto exacto de la resolución 
    // y pinta una tarjeta con los detalles particulares (tiempo, scramble específico, penalización, etc.)
    async function single_obj() {
        let single_obj = await singleAndMedia("single", true)
        crearCard(single_obj, null, false)
    }

    h2Single.addEventListener("click", single_obj)

    // Inyección final de los componentes ensamblados en el contenedor padre del DOM
    promedios.appendChild(dates);
    promedios.appendChild(boxPromedios);
}

/**
 * Función de actualización rápida (Hot-Update).
 * Vuelve a calcular y renderizar los textos de los promedios en la pantalla sin tener que reconstruir los nodos HTML.
 * Es invocada tras finalizar un solve o al alternar los selectores de tipo de vista.
 */
export const promedios_front = async () => {

    // Recalcula los indicadores de cabecera generales
    const media = await singleAndMedia("media")
    const single = await singleAndMedia("single")

    mediaSingle_p[0].textContent = "Single: " + single
    mediaSingle_p[1].textContent = "Media: " + media

    // Mapa de configuraciones estáticas para correlacionar nombres con sus tamaños de ventanas numéricas
    const config = {
        "Mo3": 3,
        "Ao5": 5,
        "Ao12": 12,
        "Ao25": 25,
        "Ao50": 50,
        "Ao100": 100
    }

    // Bucle de actualización reactiva por cada promedio configurado en la pantalla
    for (let key in config) {

        let valor

        // Evaluación dinámica del estado actual del combobox (select) de cada métrica
        if (selects[key].value === "Current") {

            // Optimización de lecturas en DB: Si es Mo3 limita la consulta a 4 elementos. 
            // Para promedios generales lee hasta un margen seguro de 101 elementos de la cola actual.
            if (key === "Mo3") {
                let db = await arrayDB(false, 4);
                valor = await Mo3(db);
            } else {
                let db = await arrayDB(false, 101);
                valor = await funcGeneral(config[key], db)
            }

        } else {
            // Si está seteado en "Best", busca el récord histórico absoluto recalculando las ventanas móviles
            valor = await funcBest(config[key])
        }

        // Actualización directa del texto del nodo correspondiente guardado en promedios_p
        promedios_p[key].textContent = valor
    }
}