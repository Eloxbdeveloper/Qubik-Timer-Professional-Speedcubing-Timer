import { movesRL, movesUD, movesFB } from "./rotations.js";
import { colors } from "./cube_render.js";

export const notacion = document.querySelector(".notacion");
notacion.readOnly = true;

export const moves = ["R","R'","R2","L","L'","L2","U","U'","U2","D","D'","D2","F","F'","F2","B","B'","B2"];

export const generador = () => {
    let moves_scramble = [20, 21, 22, 23];
    let length = moves_scramble[Math.floor(Math.random() * moves_scramble.length)];
    let arraySc = [];

    for (let i = 0; i < length; i++) {
        let move;
        while (true) {
            move = moves[Math.floor(Math.random() * moves.length)];
            if (i >= 1 && move[0] === arraySc[i - 1][0]) continue;
            if (i >= 2 && move[0] === arraySc[i - 2][0] && move[0] !== arraySc[i - 1][0]) continue;
            break;
        }
        arraySc.push(move);
    }
    notacion.value = arraySc.join(" ");
    return arraySc;
};

export const scrambler = (cube, comb) => {
    if (!comb || !cube) return;
    const faces = {
        white: cube.querySelectorAll(".white"),
        yellow: cube.querySelectorAll(".yellow"),
        green: cube.querySelectorAll(".green"),
        blue: cube.querySelectorAll(".blue"),
        orange: cube.querySelectorAll(".orange"),
        red: cube.querySelectorAll(".red")
    };

    for (let move of comb) {
        const base = move[0];
        const type = move.slice(1);
        const map = { R: movesRL, L: movesRL, U: movesUD, D: movesUD, F: movesFB, B: movesFB };
        const func = map[base];
        if (!func) continue;

        if (type === "2") { func(base, faces); func(base, faces); }
        else if (type === "'") { func(base + "'", faces); }
        else { func(base, faces); }
    }
};

export const estadoCero = (cube) => {
    cube.querySelectorAll(".cara").forEach((cara, i) => {
        cara.querySelectorAll("div").forEach((ficha) => {
            ficha.className = "";
            ficha.classList.add(colors[i]);
        });
    });
};