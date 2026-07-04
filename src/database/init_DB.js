import { leer, añadir_JSON } from "./crud.js";
import { dataDiv } from "./DB_render.js";
import { checkDBProm } from "./average_DB.js";
import { crearPromedios } from "../averages/average_render.js";
import { checkManualInput } from "../configuration/configuration_render.js";
import { sincronizarSelectConDB } from "../sessions/sessions.js"

const contenedor = document.querySelector(".contenedor");

// export seguro basado en promesa: Variable global que almacenará la instancia de la base de datos
export let db;

// Promesa global para controlar la asincronía y asegurar que la base de datos esté lista antes de operar
export const dbReady = new Promise((resolve, reject) => {

    // Abre la base de datos "registros". Versión 12 (requerida para disparar onupgradeneeded si cambia la estructura)
    const request = indexedDB.open("registros", 12);

    // Evento de ciclo de vida: Se ejecuta si la base de datos no existe o si se incrementa la versión
    request.onupgradeneeded = function (e) {
        db = e.target.result;

        // --- Creación de Object Stores para Solves (Categoría: 3x3 normal) ---
        if (!db.objectStoreNames.contains("cube3x3")) {
            db.createObjectStore("cube3x3", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_session2")) {
            db.createObjectStore("cube3x3_session2", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_session3")) {
            db.createObjectStore("cube3x3_session3", { keyPath: "id", autoIncrement: true });
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

        // --- Creación de Object Stores para Solves (Categoría: 3x3 One-Handed) ---
        if (!db.objectStoreNames.contains("cube3x3_oh")) {
            db.createObjectStore("cube3x3_oh", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_oh_session2")) {
            db.createObjectStore("cube3x3_oh_session2", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_oh_session3")) {
            db.createObjectStore("cube3x3_oh_session3", { keyPath: "id", autoIncrement: true });
        }

        // --- Creación de Object Stores para Solves (Categoría: 3x3 Blindfolded) ---
        if (!db.objectStoreNames.contains("cube3x3_blind")) {
            db.createObjectStore("cube3x3_blind", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_blind_session2")) {
            db.createObjectStore("cube3x3_blind_session2", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("cube3x3_blind_session3")) {
            db.createObjectStore("cube3x3_blind_session3", { keyPath: "id", autoIncrement: true });
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
            let options = ["3x3 Session 1","3x3 Session 2", "3x3 Session 3",
                 "3x3 OH Session 1", "3x3 OH Session 2", "3x3 OH Session 3", 
                 "3x3 Blind Session 1", "3x3 Blind Session 2","3x3 Blind Session 3"];

            // Validación de limpieza si faltan sesiones en el historial
            if (datos.length > 0 && datos.length < options.length) {
                store_selects.clear();
                datos = [];
            }

            // Si el almacén está limpio o incompleto, re-setea "3x3 Session 1" como activa por defecto
            if (datos.length === 0) {
                for (let i = 0; i < options.length; i++) {
                    añadir_JSON(
                        {
                            categoria: options[i],
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