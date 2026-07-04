import { db } from "../database/init_DB.js";
import { leer } from "../database/crud.js"
import { dataDiv, archivador, verificarEstadoVacio } from "../database/DB_render.js";
import { promedios_front } from "../averages/average_render.js";
import { menuScramble } from "../scrambler/render.js";

// Captura de selectores HTML de categorías y sesiones de resolución
const select_categoria = document.querySelector(".select_categoria")
const select_sessiones = document.querySelector(".select_sesiones")

// Diccionario interno para mapear nombres de categoría a raíces de base de datos
const categoriasDB = {
    "3x3": "cube3x3",
    "3x3 OH": "cube3x3_oh",
    "3x3 Blind": "cube3x3_blind"
};

// Mapeo directo y exacto de los registros de selects_db a tus Object Stores reales de tiempos
const mapaStoresCompleto = {
    "3x3 Session 1": "cube3x3",
    "3x3 Session 2": "cube3x3_session2",
    "3x3 Session 3": "cube3x3_session3",
    "3x3 OH Session 1": "cube3x3_oh",
    "3x3 OH Session 2": "cube3x3_oh_session2",
    "3x3 OH Session 3": "cube3x3_oh_session3",
    "3x3 Blind Session 1": "cube3x3_blind",
    "3x3 Blind Session 2": "cube3x3_blind_session2",
    "3x3 Blind Session 3": "cube3x3_blind_session3"
};

/*
 * actualizarCategoriaActiva(categoriaSeleccionada, sesionSeleccionada)
 * Modifica la persistencia de estado de la sesión actual en la tabla selects_db.
 * Conmuta a verdadero únicamente el registro que coincida con la cadena combinada.
 */
export function actualizarCategoriaActiva(categoriaSeleccionada, sesionSeleccionada) {
    if (!db) return;

    // Construimos el string exacto tal como está en tu base de datos (Ej: "3x3 OH Session 2")
    const stringCompletoDB = `${categoriaSeleccionada} ${sesionSeleccionada}`;

    const tx = db.transaction("selects_db", "readwrite");
    const store = tx.objectStore("selects_db");
    const req = store.getAll();

    req.onsuccess = () => {
        const registros = req.result;

        registros.forEach(item => {
            // Pone true solo al registro que coincida con la combinación exacta de ambos selectores
            item.state = (item.categoria === stringCompletoDB);
            store.put(item);
        });
    };

    tx.oncomplete = () => {

    };

    tx.onerror = (e) => {
        console.error("Error al actualizar estados en selects_db", e.target.error);
    };
}

/*
 * manejarCambioSesion()
 * Callback centralizado que reacciona ante mutaciones de cambio de valor en los selectores.
 * Limpia el contenedor de la lista de tiempos, actualiza la base de datos e invoca el renderizado dinámico.
 */
function manejarCambioSesion() {
    if (!select_categoria || !select_sessiones) return;
    
    archivador.innerHTML = "";
    
    // Pasamos ambos valores para actualizar correctamente el registro combinado en IndexedDB
    actualizarCategoriaActiva(select_categoria.value, select_sessiones.value);
    
    obtenerStoreActivo().then((storeNombre) => {
        leer(storeNombre, (array) => {
            array.forEach((item, idx) => {
                dataDiv(idx + 1, item.time, item.dnf, item.masDos);
            });
            promedios_front();
            verificarEstadoVacio();
        });
    }).catch(err => console.error(err));

    menuScramble[0].click()
}

// Vinculación de escuchadores de eventos change sobre los elementos selectores del DOM
if (select_categoria && select_sessiones) {
    select_categoria.addEventListener("change", manejarCambioSesion);
    select_sessiones.addEventListener("change", manejarCambioSesion);
}

/*
 * obtenerStoreActivo()
 * Resuelve una promesa devolviendo el nombre string del Object Store correspondiente
 * basándose en el registro cuyo atributo state sea estrictamente igual a true.
 */
export function obtenerStoreActivo() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("La base de datos no está lista");
            return;
        }

        const tx = db.transaction("selects_db", "readonly");
        const store = tx.objectStore("selects_db");
        const req = store.getAll();

        req.onsuccess = () => {
            const registros = req.result;
            // Buscamos el elemento que tenga state === true en la base de datos
            const activo = registros.find(item => item.state === true);

            // Si hay un elemento activo y existe en nuestro mapa, resolvemos de inmediato
            if (activo && mapaStoresCompleto[activo.categoria]) {
                resolve(mapaStoresCompleto[activo.categoria]);
            } else {
                // Fallback de seguridad usando el DOM si no se encuentra un registro activo en true
                const catDOM = select_categoria ? select_categoria.value : "3x3";
                const sesDOM = select_sessiones ? select_sessiones.value : "Session 1";
                const combinacionDOM = `${catDOM} ${sesDOM}`;
                
                resolve(mapaStoresCompleto[combinacionDOM] || "cube3x3");
            }
        };

        req.onerror = (e) => {
            console.error("Error al leer selects_db", e.target.error);
            reject(e.target.error);
        };
    });
}

/*
 * sincronizarSelectConDB()
 * Analiza el estado interno de la base de datos al arrancar la sesión de la app
 * y reajusta las propiedades indexadas de los selectores HTML para concordar con la DB.
 */
export function sincronizarSelectConDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("La base de datos no está lista para sincronizar");
            return;
        }

        const tx = db.transaction("selects_db", "readonly");
        const store = tx.objectStore("selects_db");
        const req = store.getAll();

        req.onsuccess = () => {
            const registros = req.result;
            // Buscamos cuál fila combinada tiene el estado activo en true
            const activo = registros.find(item => item.state === true);

            if (activo && select_categoria && select_sessiones) {
                // El item.categoria contiene por ejemplo: "3x3 OH Session 2"
                // Ordenamos las llaves por longitud descendente ("3x3 OH", "3x3 Blind", luego "3x3")
                // Esto evita que "3x3" haga match parcial erróneo con "3x3 OH" o "3x3 Blind"
                const claveEncontrada = Object.keys(categoriasDB)
                    .sort((a, b) => b.length - a.length)
                    .find(clave => activo.categoria.startsWith(clave));
                
                if (claveEncontrada) {
                    select_categoria.value = claveEncontrada; // Setea correctamente la categoría exacta
                    
                    // Extraemos y asignamos la sesión correspondiente al segundo selector visual
                    if (activo.categoria.includes("Session 2")) {
                        select_sessiones.value = "Session 2";
                    } else if (activo.categoria.includes("Session 3")) {
                        select_sessiones.value = "Session 3";
                    } else {
                        select_sessiones.value = "Session 1";
                    }
                    
                }
            }
            resolve();
        };

        req.onerror = (e) => {
            console.error("Error al sincronizar los selects desde selects_db", e.target.error);
            reject(e.target.error);
        };
    });
}