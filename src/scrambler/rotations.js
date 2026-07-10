/*
 * rotacion(giro, faces)
 * * Rota únicamente la capa superficial correspondiente al movimiento ejecutado.
 * Aplica una permutación cíclica simple (90° horario), doble (180°) o antihoraria (-90°)
 * sobre las 8 pegatinas perimetrales de dicha cara, asegurando que el centro permanezca intacto.
 */
export const rotacion = (giro, faces) => {
  const { white, yellow, green, blue, orange, red } = faces;

  const indice = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const colorMap = {
    F: green, "F'": green, F2: green,
    B: blue, "B'": blue, B2: blue,
    R: red, "R'": red, R2: red,
    L: orange, "L'": orange, L2: orange,
    D: yellow, "D'": yellow, D2: yellow,
    U: white, "U'": white, U2: white,
  };

  const color = colorMap[giro];

  if (!color) return;

  const colorf = indice.map((i) => color[i].className);

  const centerClass = colorf[4];

  const rotaciones = {
    simple: [[0,6],[6,8],[8,2],[2,0],[1,3],[3,7],[7,5],[5,1]],
    doble:  [[0,8],[8,0],[2,6],[6,2],[1,7],[7,1],[3,5],[5,3]],
    anti:   [[0,2],[2,8],[8,6],[6,0],[1,5],[5,7],[7,3],[3,1]],
  };

  let secuencia;

  if (["F", "R", "U", "L", "B", "D"].includes(giro))
    secuencia = rotaciones.simple;
  else if (["R2", "B2", "U2", "L2", "F2", "D2"].includes(giro))
    secuencia = rotaciones.doble;
  else
    secuencia = rotaciones.anti;

  secuencia.forEach(([a, b]) => {
    color[a].classList.replace(colorf[a], colorf[b]);
  });

  color[4].className = centerClass;
};


/*
 * movesRL(move, faces)
 * * Gestiona el movimiento de las capas izquierda (Left) y derecha (Right).
 */
export const movesRL = (move, faces) => {
  const { white, yellow, green, blue, orange, red } = faces;
  if (!white[0] || !yellow[0] || !green[0] || !blue[0]) return;

  let green036 = [green[0].className, green[3].className, green[6].className];
  let green258 = [green[2].className, green[5].className, green[8].className];

  let white036 = [white[0].className, white[3].className, white[6].className];
  let white258 = [white[2].className, white[5].className, white[8].className];

  let yellow036 = [yellow[0].className, yellow[3].className, yellow[6].className];
  let yellow258 = [yellow[2].className, yellow[5].className, yellow[8].className];

  let blue036 = [blue[0].className, blue[3].className, blue[6].className];
  let blue258 = [blue[2].className, blue[5].className, blue[8].className];

  if (move === "L'") {
    for (let i = 0; i < 3; i++) {
      green[i*3].classList.replace(green036[i], yellow036[i]);
      yellow[i*3].classList.replace(yellow036[i], blue258[2-i]);
      blue[i*3+2].classList.replace(blue258[i], white036[2-i]);
      white[i*3].classList.replace(white036[i], green036[i]);
    }
  }
  else if (move === "L") {
    for (let i = 0; i < 3; i++) {
      green[i*3].classList.replace(green036[i], white036[i]);
      yellow[i*3].classList.replace(yellow036[i], green036[i]);
      blue[i*3+2].classList.replace(blue258[i], yellow036[2-i]);
      white[i*3].classList.replace(white036[i], blue258[2-i]);
    }
  }
  else if (move === "R") {
    for (let i = 0; i < 3; i++) {
      green[i*3+2].classList.replace(green258[i], yellow258[i]);
      yellow[i*3+2].classList.replace(yellow258[i], blue036[2-i]);
      blue[i*3].classList.replace(blue036[i], white258[2-i]);
      white[i*3+2].classList.replace(white258[i], green258[i]);
    }
  }
  else if (move === "R'") {
    for (let i = 0; i < 3; i++) {
      green[i*3+2].classList.replace(green258[i], white258[i]);
      yellow[i*3+2].classList.replace(yellow258[i], green258[i]);
      blue[i*3].classList.replace(blue036[i], yellow258[2-i]);
      white[i*3+2].classList.replace(white258[i], blue036[2-i]);
    }
  }

  if (["L", "L'", "R", "R'"].includes(move)) {
    rotacion(move, faces);
  }
};


/*
 * movesUD(move, faces)
 * * Gestiona los movimientos de la capa superior (Up) e inferior (Down).
 */
export const movesUD = (move, faces) => {
  const { white, yellow, green, blue, orange, red } = faces;
  if (!white[0] || !yellow[0] || !green[0] || !blue[0]) return;

  let green012 = [green[0].className, green[1].className, green[2].className];
  let green678 = [green[6].className, green[7].className, green[8].className];

  let red012 = [red[0].className, red[1].className, red[2].className];
  let red678 = [red[6].className, red[7].className, red[8].className];

  let blue012 = [blue[0].className, blue[1].className, blue[2].className];
  let blue678 = [blue[6].className, blue[7].className, blue[8].className];

  let orange012 = [orange[0].className, orange[1].className, orange[2].className];
  let orange678 = [orange[6].className, orange[7].className, orange[8].className];

  if (move === "D'") {
    for (let i = 0; i < 3; i++) {
      green[6+i].classList.replace(green678[i], red678[i]);
      red[6+i].classList.replace(red678[i], blue678[i]);
      blue[6+i].classList.replace(blue678[i], orange678[i]);
      orange[6+i].classList.replace(orange678[i], green678[i]);
    }
  }
  else if (move === "U'") {
    for (let i = 0; i < 3; i++) {
      green[i].classList.replace(green012[i], orange012[i]);
      red[i].classList.replace(red012[i], green012[i]);
      blue[i].classList.replace(blue012[i], red012[i]);
      orange[i].classList.replace(orange012[i], blue012[i]);
    }
  }
  else if (move === "U") {
    for (let i = 0; i < 3; i++) {
      green[i].classList.replace(green012[i], red012[i]);
      red[i].classList.replace(red012[i], blue012[i]);
      blue[i].classList.replace(blue012[i], orange012[i]);
      orange[i].classList.replace(orange012[i], green012[i]);
    }
  }
  else if (move === "D") {
    for (let i = 0; i < 3; i++) {
      green[6+i].classList.replace(green678[i], orange678[i]);
      red[6+i].classList.replace(red678[i], green678[i]);
      blue[6+i].classList.replace(blue678[i], red678[i]);
      orange[6+i].classList.replace(orange678[i], blue678[i]);
    }
  }

  if (["U", "U'", "D", "D'"].includes(move)) {
    rotacion(move, faces);
  }
};


/*
 * movesFB(move, faces)
 * * Gestiona los movimientos de la capa frontal (Front) y trasera (Back).
 */
export const movesFB = (move, faces) => {
  const { white, yellow, green, blue, orange, red } = faces;
  if (!white[0] || !yellow[0] || !green[0] || !blue[0]) return;

  if (move === "F") {
    let whiteVals  = [white[6].className, white[7].className, white[8].className];
    let orangeVals = [orange[2].className, orange[5].className, orange[8].className];
    let yellowVals = [yellow[0].className, yellow[1].className, yellow[2].className];
    let redVals    = [red[0].className, red[3].className, red[6].className];

    for (let i = 0; i < 3; i++) {
      white[6+i].classList.replace(whiteVals[i], orangeVals[2-i]);
      orange[2 + i*3].classList.replace(orangeVals[i], yellowVals[i]);
      yellow[i].classList.replace(yellowVals[i], redVals[2-i]);
      red[i*3].classList.replace(redVals[i], whiteVals[i]);
    }
  }
  else if (move === "F'") {
    let whiteVals  = [white[6].className, white[7].className, white[8].className];
    let orangeVals = [orange[2].className, orange[5].className, orange[8].className];
    let yellowVals = [yellow[0].className, yellow[1].className, yellow[2].className];
    let redVals    = [red[0].className, red[3].className, red[6].className];

    for (let i = 0; i < 3; i++) {
      white[6+i].classList.replace(whiteVals[i], redVals[i]);
      orange[2 + i*3].classList.replace(orangeVals[i], whiteVals[2-i]);
      yellow[i].classList.replace(yellowVals[i], orangeVals[i]);
      red[i*3].classList.replace(redVals[i], yellowVals[2-i]);
    }
  }
  else if (move === "B") {
    let whiteVals  = [white[0].className, white[1].className, white[2].className];
    let orangeVals = [orange[0].className, orange[3].className, orange[6].className];
    let yellowVals = [yellow[6].className, yellow[7].className, yellow[8].className];
    let redVals    = [red[2].className, red[5].className, red[8].className];

    for (let i = 0; i < 3; i++) {
      white[i].classList.replace(whiteVals[i], redVals[i]);
      orange[i*3].classList.replace(orangeVals[i], whiteVals[2-i]);
      yellow[6+i].classList.replace(yellowVals[i], orangeVals[i]);
      red[2 + i*3].classList.replace(redVals[i], yellowVals[2-i]);
    }
  }
  else if (move === "B'") {
    let whiteVals  = [white[0].className, white[1].className, white[2].className];
    let orangeVals = [orange[0].className, orange[3].className, orange[6].className];
    let yellowVals = [yellow[6].className, yellow[7].className, yellow[8].className];
    let redVals    = [red[2].className, red[5].className, red[8].className];

    for (let i = 0; i < 3; i++) {
      white[i].classList.replace(whiteVals[i], orangeVals[2-i]);
      orange[i*3].classList.replace(orangeVals[i], yellowVals[i]);
      yellow[6+i].classList.replace(yellowVals[i], redVals[2-i]);
      red[2 + i*3].classList.replace(redVals[i], whiteVals[i]);
    }
  }

  if (["F", "F'", "B", "B'"].includes(move)) {
    rotacion(move, faces);
  }
};