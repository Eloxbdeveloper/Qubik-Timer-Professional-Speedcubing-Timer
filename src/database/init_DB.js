import { leer, añadir_JSON } from "./crud.js";
import { dataDiv } from "./DB_render.js";
import { checkDBProm } from "./average_DB.js";
import { crearPromedios } from "../averages/average_render.js";
import { checkManualInput } from "../configuration/configuration_render.js";
import { sincronizarSelectConDB } from "../sessions/sessions.js"

const contenedor = document.querySelector(".contenedor");

// export seguro basado en promesa: Variable global que almacenará la instancia de la base de datos
export let db;

let categories= ["cube3x3","cube3x3_oh","cube3x3_blind","cube2x2","cube4x4",
    "cube5x5","cube6x6","cube7x7","cubeMegaminx","cubeClock","cubeSq1","cubePiraminx","cubeSkewb"]   

let categories_sessions=[];

// Promesa global para controlar la asincronía y asegurar que la base de datos esté lista antes de operar
export const dbReady = new Promise((resolve, reject) => {

    // Abre la base de datos "registros". Versión 42 (requerida para disparar onupgradeneeded si cambia la estructura)
    const request = indexedDB.open("registros", 42);

    // Evento de ciclo de vida: Se ejecuta si la base de datos no existe o si se incrementa la versión
    request.onupgradeneeded = function (e) {

          db = e.target.result;

        for(let i=0;i<categories.length;i++){

            for(let session=0;session<3;session++){

                if(session==0){
                    if (!db.objectStoreNames.contains(categories[i])) {
                    db.createObjectStore(categories[i], { keyPath: "id", autoIncrement: true });
                    }  

                    categories_sessions.push(categories[i]);
                }
                else if(session==1){
                    if (!db.objectStoreNames.contains(`${categories[i]}_session2`)) {
                    db.createObjectStore(`${categories[i]}_session2`, { keyPath: "id", autoIncrement: true });
                    }
                    categories_sessions.push(`${categories[i]}_session2`); 
                }

                else if(session==2){
                    if (!db.objectStoreNames.contains(`${categories[i]}_session3`)) {
                    db.createObjectStore(`${categories[i]}_session3`, { keyPath: "id", autoIncrement: true });
                    } 
                    categories_sessions.push(`${categories[i]}_session3`);
                }
            }
            
        }


        // --- Almacén para Historial de Promedios y Estadísticas (Mo3, Ao5, Ao12...) ---
        if (!db.objectStoreNames.contains("promDB")) {
            db.createObjectStore("promDB", { keyPath: "id", autoIncrement: true });
        }

        // --- Almacén para Configuraciones de la App (Inspección, Ocultar Tiempos...) ---
        if (!db.objectStoreNames.contains("configDB")) {
            db.createObjectStore("configDB", { keyPath: "id", autoIncrement: true });
        }

        // --- Almacén para el Estado Activo de las Categorías/Sesiones en los selectores ---
        if (!db.objectStoreNames.contains("selects_db")) {
            db.createObjectStore("selects_db", { keyPath: "id", autoIncrement: true });
        }

    };

    // Evento de éxito: Se ejecuta cuando la conexión y estructura están completamente establecidas
    request.onsuccess = function (e) {
        db = e.target.result;



        // ===== CARGA INICIAL Y POBLADO POR DEFECTO =====
        
        // Verifica si la propiedad de ingreso manual de tiempos está activa en los ajustes
        checkManualInput();

        // Recupera el historial de solves del almacén activo para renderizarlo en el DOM
        let leer_promise = leer((array) => {
            array.forEach((item, idx) => {
                dataDiv(idx + 1, item.time, item.dnf, item.masDos);
            });
        });

        // --- Inicialización del almacén de promedios (promDB) ---
        const tx = db.transaction("promDB", "readwrite");
        const store = tx.objectStore("promDB");
        const req = store.getAll();

        req.onsuccess = () => {
            let datos = req.result;
            let medias = ["Mo3", "Ao12", "Ao25", "Ao50", "Ao5", "Ao100"];

            // Si tiene elementos pero es menor al array maestro, limpia y re-escribe
            if (datos.length > 0 && datos.length < medias.length) {
                store.clear();
                datos = [];
            }

            // Si el almacén está vacío, inyecta la estructura completa
            if (datos.length === 0) {
                for (let i = 0; i < medias.length; i++) {
                    añadir_JSON(
                        { actual: true, stats: medias[i] },
                        "promDB"
                    );
                }
            }

            // Consulta los valores numéricos actuales de los promedios y los renderiza en la UI
            checkDBProm((datosActualizados) => {
                crearPromedios(datosActualizados);
            });
        };

        // --- Inicialización del almacén de opciones de configuración (configDB) ---
        const tx_config = db.transaction("configDB", "readwrite");
        const store_config = tx_config.objectStore("configDB");
        const req_config = store_config.getAll();

        req_config.onsuccess = () => {
            let datos = req_config.result;
            let configurations = ["inspeccion", "ocultarTiempo", "ingresoManual"];

            // Validación de limpieza si faltan configuraciones
            if (datos.length > 0 && datos.length < configurations.length) {
                store_config.clear();
                datos = [];
            }

            // Si no existen configuraciones previas o fue limpiado, inicializa flags en false
            if (datos.length === 0) {
                for (let i = 0; i < configurations.length; i++) {
                    añadir_JSON(
                        {
                            configuration: configurations[i],
                            state: false
                        },
                        "configDB"
                    );
                }
            }
        };

        // --- Inicialización del listado y estado de sesiones/selectores (selects_db) ---
        const tx_selects = db.transaction("selects_db", "readwrite");
        const store_selects = tx_selects.objectStore("selects_db");
        const req_selects = store_selects.getAll();

        req_selects.onsuccess = () => {
            let datos = req_selects.result;

            // Listado secuencial de categorías y subsesiones del temporizador
            

            // Validación de limpieza si faltan sesiones en el historial
            if (datos.length > 0 && datos.length < categories_sessions.length) {
                store_selects.clear();
                datos = [];
            }

            // Si el almacén está limpio o incompleto, re-setea "3x3 Session 1" como activa por defecto
            if (datos.length === 0) {
                for (let i = 0; i < categories_sessions.length; i++) {
                    añadir_JSON(
                        {
                            categoria: categories_sessions[i],
                            state: i === 0
                        },
                        "selects_db"
                    );
                }
            }
        };

        // Sincroniza visualmente los menús desplegables (<select>) basándose en el estado guardado
        sincronizarSelectConDB()

        // Resuelve exitosamente la promesa general entregando la instancia de la base de datos lista
        resolve(db);
    };

    // Manejador en caso de fallos críticos en la apertura (bloqueos del navegador, permisos denegados)
    request.onerror = function (e) {
        reject(e.target.error);
    };
});