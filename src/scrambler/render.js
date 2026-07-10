import { generador, scrambler, estadoCero } from "./scrambler_engine.js";
import { cubo } from "./cube_render.js";
import { select_categoria } from "../sessions/sessions.js";

const notacion = document.querySelector(".notacion");
notacion.readOnly = true;
export let checked = false;
export const menuScramble = document.querySelectorAll(".btn2");

// Función auxiliar para verificar la categoría
const esCategoria3x3 = () => {
    const cat = select_categoria.value;
    return ["3x3", "3x3 OH", "3x3 Blind"].includes(cat);
};

export function eventosScramble() {
    
    // === Botón 1: Generación de un nuevo Scramble ===
    menuScramble[0].addEventListener("click", () => {
        // Validación: si no es 3x3, no hace nada
        if (!esCategoria3x3()) return;

        estadoCero(cubo);
        notacion.value = "";
        scrambler(cubo, generador());
    });

    // === Listener para cambios en la categoría ===
    select_categoria.addEventListener("change", () => {
        if (!esCategoria3x3()) {
            estadoCero(cubo);
            notacion.value = "";
            // Opcional: ocultar el cubo visualmente
            cubo.style.display = "none";
        } else {
            // Si vuelve a ser 3x3, mostramos el cubo y generamos scramble
            cubo.style.display = "grid"; 
            scrambler(cubo, generador());
        }
    });

    // === Botón 2: Activar / Conmutar modo de Edición Manual ===
    menuScramble[1].addEventListener("click", () => {
        checked = !checked;
        notacion.readOnly = !checked;
        if (checked) {
            notacion.focus();
            notacion.classList.add("borde_textarea");
        } else {
            notacion.blur();
            notacion.classList.remove("borde_textarea");
        }
    });

    // === Botón 3: Copiar la combinación ===
    menuScramble[2].addEventListener("click", (e) => {
        if (notacion.value) {
            navigator.clipboard.writeText(notacion.value);
            const boton = e.currentTarget;
            boton.classList.add("animacion-copiado");
            setTimeout(() => boton.classList.remove("animacion-copiado"), 800);
        }
    });
}