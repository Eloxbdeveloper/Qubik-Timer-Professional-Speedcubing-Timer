import { notacion } from "../scrambler/scrambler_engine.js";
// Importamos las referencias de penalización actuales del módulo del cronómetro
import { cronometro, penalizacionMasDos, penalizacionDNF } from "../scrambler/timer.js";

// Referencia al campo de inserción manual de tiempos de la interfaz
const manually_times = document.querySelector(".manually_times");

/*
 * arrayInfo()
 * Factoría encargada de construir, formatear y tipar el objeto de la resolución actual.
 * Procesa tanto el flujo del cronómetro en tiempo real como la entrada manual por teclado,
 * incluyendo el parseo inteligente de enteros para simular temporizadores físicos (Stackmat).
 */
export const arrayInfo = () => {

    let currentTime = "";

    // --- SECCIÓN 1: CAPTURA Y EXTRACCIÓN DEL TIEMPO RAW ---
    if (manually_times.style.display === "flex") {
        currentTime = manually_times.value.trim();
    } else {
        // Si el string incluye (+2) o es DNF lo limpiamos para extraer solo la base numérica del tiempo
        let rawText = cronometro.textContent.trim();
        if (rawText.includes("(+2)")) {
            currentTime = rawText.replace("(+2)", "").trim();
        } else if (rawText === "DNF") {
            currentTime = "0.00"; // Tiempo base de fallback si es DNF directo de inspección
        } else {
            currentTime = rawText;
        }
    }

    // Limpieza reactiva del input manual una vez extraído su valor en memoria
    if (manually_times.style.display === "flex") {
        manually_times.value = "";
    }

    // --- SECCIÓN 2: PARSEO INTELIGENTE DE ENTEROS PUROS (ESTILO STACKMAT) ---
    const isPureInteger = /^\d+$/;
    if (isPureInteger.test(currentTime)) {
        
        if (currentTime.length >= 5) {
            // Caso 5+ dígitos: formato Stackmat con minutos (ej: 101266 -> 1:01.66 -> 61.66)
            const centisegundos = currentTime.slice(-2);
            const segundos = currentTime.slice(-4, -2);
            const minutos = currentTime.slice(0, -4);

            const totalSegundos = (Number(minutos) * 60) + Number(segundos) + (Number(centisegundos) / 100);
            currentTime = totalSegundos.toString();
        } else if (currentTime.length === 3 || currentTime.length === 4) {
            // Caso 3 o 4 dígitos: centisegundos sin punto (ej: 178 -> 1.78, 2666 -> 26.66)
            currentTime = (Number(currentTime) / 100).toString();
        } 
        // Caso 1 o 2 dígitos (ej: 9 o 25): Se quedan igual, abajo se convertirán en 9.00 o 25.00
    }

    // --- SECCIÓN 3: VALIDACIÓN SINTÁCTICA NUMÉRICA Y NORMALIZACIÓN ---
    // Expresión regular para validar formatos aceptados: enteros, decimales y punto inicial (ej: 12, 12.3, .58)
    const validNumber = /^(\d+(\.\d+)?|\.\d+)$/;

    if (!validNumber.test(currentTime)) {
        return null;
    }

    let timeNumber = Number(currentTime);

    // Caso de punto flotante inicial (ej: ".58" -> se normaliza internamente a "0.58")
    if (currentTime.startsWith(".")) {
        timeNumber = Number("0" + currentTime);
    }

    // Formateo estricto a dos posiciones decimales para mantener consistencia visual
    const formattedTime = timeNumber.toFixed(2);

    // --- SECCIÓN 4: CONSTRUCCIÓN DEL OBJETO DE PERSISTENCIA ---
    let solve = {

        // Guardamos como string formateado a 2 decimales para conservar los ceros a la derecha (ej: "2.30", "25.00")
        time: formattedTime,

        scramble: notacion.value,

        // Estructuración de fecha en formato regional estadounidense de lectura natural
        date: new Date().toLocaleString('en-US', { 
            month: 'long', 
            day: '2-digit', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        }),

        // Sincronización automática con los estados generados en la inspección de la WCA
        dnf: penalizacionDNF,
        masDos: penalizacionMasDos,

        // Pre-cálculo alternativo de marcas de tiempo penalizadas para lectura rápida en la UI
        timeMasDos: (timeNumber + 2).toFixed(2),

        timeDNF: "DNF",

        typeCube: "3x3"
    };

    return solve;
};