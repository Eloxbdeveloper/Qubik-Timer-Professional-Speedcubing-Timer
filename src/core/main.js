import { crearCaras, cubo } from "../scrambler/cube_render.js";
import { scrambler, generador } from "../scrambler/scrambler_engine.js";
import { select_categoria } from "../sessions/sessions.js";

const categorias3x3 = ["3x3", "3x3 OH", "3x3 Blind"];

function gestionarInterfaz() {
    const es3x3 = categorias3x3.includes(select_categoria.value);
    
    if (es3x3) {
        cubo.style.display = "grid"; 
        if (cubo.innerHTML === "") {
            crearCaras(cubo);
            scrambler(cubo, generador());
        }
    } else {
        cubo.style.display = "none";
        cubo.innerHTML = "";
        document.querySelector(".notacion").value = "";
    }
}

select_categoria.addEventListener("change", gestionarInterfaz);
document.addEventListener("DOMContentLoaded", gestionarInterfaz);