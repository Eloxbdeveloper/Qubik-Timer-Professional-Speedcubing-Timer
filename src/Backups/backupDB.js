
// import { notacion, scrambler, estadoCero } from "../Scrambler/scrambler.js";
// import { cronometro, } from "../Scrambler/timer.js";
// import { crearCaras,colors} from "../Scrambler/cubo.js";
// import {movesRL,movesUD,movesFB,rotacion} from "../Scrambler/rotaciones.js"


// let db;

// let arrayDB=[];

// const archivador= document.querySelector(".archivador")
// const contenedor= document.querySelector(".contenedor")

// const request= indexedDB.open("registros", 1);

// request.onupgradeneeded = function(e) {
//     db = e.target.result;

//     if (!db.objectStoreNames.contains("cube3x3")) {
//         db.createObjectStore("cube3x3", { keyPath: "id", autoIncrement: true });
//     }
// };

// request.onsuccess = function(e) {
//     db = e.target.result;
//     console.log("Base de datos abierta con éxito");

//     leer((array) => {
//         array.forEach((item, idx) => {
//             dataDiv(idx + 1, item.time,item.dnf,item.masDos);
//         });
//     });



// };


// request.onerror = function(e) {
//     console.error("Error al abrir la base de datos", e.target.error);
// };



// export const arrayInfo=()=>{
// 	  let solve = {
// 	time: cronometro.textContent,
// 	scramble: notacion.value,
// 	date: new Date().toLocaleString('en-US', { 
// 		month: 'long', 
// 		day: '2-digit', 
// 		year: 'numeric', 
// 		hour: 'numeric', 
// 		minute: '2-digit', 
// 		hour12: true 
// 	}),

// 	dnf: false,
// 	masDos: false,
// 	timeMasDos: Number(cronometro.textContent)+2,
// 	timeDNF: "DNF",
// 	typeCube:"3x3"
// };


// 	return solve
// }



// export const añadir=(obj)=>{

// 	let transaccion= db.transaction("cube3x3","readwrite")
// 	let confirmar= transaccion.objectStore("cube3x3")
	
// 	let request= confirmar.add(obj)

// 	request.onsuccess=(e)=>{
// 		let datas= document.querySelectorAll(".data")
// 		let idx= datas.length+1
// 		dataDiv(idx, obj.time)
// 		console.log(datas)
// 	}
	
// 	request.onerror=(e)=>{
// 		console.error("error: ", e.target.error)
// 	}

	
// 	transaccion.oncomplete=()=>{
// 		console.log("se agrego el obj")
// 	}

// 	transaccion.onerror=(e)=>{
// 		console.log("Error: ",e.target.error)
// 	}
// }



// const leer = (cb) => {
//     let transaccion = db.transaction("cube3x3", "readonly");
//     let objectStore = transaccion.objectStore("cube3x3");

//     let request = objectStore.openCursor();
//     let arrayDB=[];

//     request.onsuccess = (e) => {
//         let cursor = e.target.result;
//         if (cursor) {
//             arrayDB.push(cursor.value) 
//             cursor.continue();
//         } else {
//             console.log("Se leyeron todos los registros");
//             if(cb) cb(arrayDB)
//         }

       
//     };

//     request.onerror = (e) => {
//         console.error("Error al leer registros:", e.target.error);
//     };

//     return arrayDB
// };



// const dataDiv=(idx,t,dnf,masDos)=>{


//     const data= document.createElement("DIV")
//     const record= document.createElement("DIV")
//     const indice= document.createElement("SPAN")          
//     const time= document.createElement("SPAN") 
//     const btns= document.createElement("DIV") 
//     const btn1= document.createElement("BUTTON") 
//     const btn2= document.createElement("BUTTON")
//     const btn3= document.createElement("BUTTON")

//     data.classList.add("data")
//     record.classList.add("record")
//     indice.classList.add("indice")
//     time.classList.add("tiempo")
//     btns.classList.add("btns")
   
   
//     btn1.classList.add("mini_btn")
//     btn1.classList.add("masdos")
   
//     btn2.classList.add("mini_btn")
//     btn2.classList.add("dnf")
    
//     btn3.classList.add("mini_btn")
//     btn3.classList.add("delete")



//     btns.appendChild(btn1)
//     btns.appendChild(btn2)
//     btns.appendChild(btn3)

//     record.appendChild(indice)
//     record.appendChild(time)

//     data.appendChild(record)
//     data.appendChild(btns)

// 	btn1.textContent= "+2"
// 	btn2.textContent= "DNF"
// 	btn3.textContent= "X"

// 	indice.textContent= idx+".  ";
	
// 	if (dnf === true) {
//     time.textContent = "DNF";
//     time.style.color = "red";
//     btn2.style.color = "red";
// } else if (masDos === true) {
//     time.textContent = (Number(t) + 2).toFixed(2);
//     time.style.color = "orange";
//     btn1.style.color = "orange";
// } else {
//     time.textContent = Number(t).toFixed(2);
// }



// 	btn3.addEventListener("click",()=>{
// 		eliminar(idx-1,"database")
// 	})

// 	btn2.addEventListener("click", () => {
//     marcarDNF(idx - 1, time);
// 	});

// 	btn1.addEventListener("click", () => {
// 	    marcarDos(idx - 1, time);
// 	});


// 	time.addEventListener("click",()=>{
// 		datoCard(idx-1)
// 	})



// 	archivador.prepend(data);
// 	archivador.scrollTop = 0; 

// }


// const eliminar = (index,div) => {
//     let transaccion = db.transaction("cube3x3", "readwrite");
//     let store = transaccion.objectStore("cube3x3");

//     let request = store.openCursor();
//     let contador = 0;

//     request.onsuccess = (e) => {
//         let cursor = e.target.result;
//         if (cursor) {
//             if (contador === index) {
//                 let id = cursor.value.id;  
//                 store.delete(id);

//                 if(div=="database"){
//                 	leer((array) => {
//                     archivador.innerHTML = "";
//                     array.reverse().forEach((item, idx) => {
//                         dataDiv(idx + 1, item.time);
//                     });
//                 });
//                 }
//                 else if(div=="card"){
//                 	leer((array) => {
//                     archivador.innerHTML = "";
//                     array.forEach((item, idx) => {
//                         dataDiv(idx + 1, item.time);
//                     });
//                 });
//                 }

//                 return;
//             }
//             contador++;
//             cursor.continue();
//         }
//     };

//     request.onerror = (e) => {
//         console.error("Error al eliminar por índice:", e.target.error);
//     };
// };



// const marcarDNF = (index, elementoTime) => {
//     let transaccion = db.transaction("cube3x3", "readwrite");
//     let store = transaccion.objectStore("cube3x3");

//     let request = store.openCursor();
//     let contador = 0;

//     request.onsuccess = (e) => {
//         let cursor = e.target.result;

//         if (cursor) {
//             if (contador === index) {
//                 let registro = cursor.value;

               
//                 if (registro.dnf === false) {
//                     registro.dnf = true;
//                     registro.masDos = false; 
//                     elementoTime.textContent = registro.timeDNF;
//                     elementoTime.style.color = "red";

                    
//                     const dataDiv = elementoTime.closest(".data");
//                     dataDiv.querySelector(".dnf").style.color = "red";
//                     dataDiv.querySelector(".masdos").style.color = "#777";
//                 } else {
//                     registro.dnf = false;

                    
//                     if (registro.masDos === false) {
//                         elementoTime.textContent = Number(registro.time).toFixed(2);
//                         elementoTime.style.color = "green";
//                     } else {
//                         elementoTime.textContent = Number(registro.timeMasDos).toFixed(2);
//                         elementoTime.style.color = "orange";
//                     }

//                     const dataDiv = elementoTime.closest(".data");
//                     dataDiv.querySelector(".dnf").style.color = "#777";
//                 }

//                 cursor.update(registro);
//                 return;
//             }

//             contador++;
//             cursor.continue();
//         }
//     };
// };


// const marcarDos = (index, elementoTime) => {
//     let transaccion = db.transaction("cube3x3", "readwrite");
//     let store = transaccion.objectStore("cube3x3");

//     let request = store.openCursor();
//     let contador = 0;

//     request.onsuccess = (e) => {
//         let cursor = e.target.result;

//         if (cursor) {
//             if (contador === index) {
//                 let registro = cursor.value;


//                 if (registro.masDos === false) {
//                     registro.masDos = true;
//                     registro.dnf = false; 
//                     elementoTime.textContent = Number(registro.timeMasDos).toFixed(2);
//                     elementoTime.style.color = "orange";

//                     const dataDiv = elementoTime.closest(".data");
//                     dataDiv.querySelector(".masdos").style.color = "orange";
//                     dataDiv.querySelector(".dnf").style.color = "#777";
//                 } else {
//                     registro.masDos = false;


//                     if (registro.dnf === true) {
//                         elementoTime.textContent = registro.timeDNF;
//                         elementoTime.style.color = "red";
//                     } else {
//                         elementoTime.textContent = Number(registro.time).toFixed(2);
//                         elementoTime.style.color = "green";
//                     }

//                     const dataDiv = elementoTime.closest(".data");
//                     dataDiv.querySelector(".masdos").style.color = "#777";
//                 }

//                 cursor.update(registro);
//                 return;
//             }

//             contador++;
//             cursor.continue();
//         }
//     };
// };

// const datoCard=(index)=>{
// 	let transaccion = db.transaction("cube3x3", "readwrite");
//     let store = transaccion.objectStore("cube3x3");

//     let request = store.openCursor();
//     let contador = 0;

//     request.onsuccess = (e) => {
//         let cursor = e.target.result;
//         if (cursor) {
//             if (contador === index) {
//                 console.log(cursor.value)
//                 crearCard(cursor.value,index)
//                 let info= [cursor.value,index]
//                 return info
//             }
//             contador++;
//             cursor.continue();
//         }
//     };

//     request.onerror = (e) => {
//         console.error("Error al eliminar por índice:", e.target.error);
//     };
// }



// const crearCard=(dato,index)=>{

  
//   const overlayCard = document.createElement("div");
//   overlayCard.classList.add("overlay_card");

//   const card = document.createElement("div");
//   card.classList.add("card");
//   overlayCard.appendChild(card);

//   // --- Botones superiores ---
//   const btnsTop = document.createElement("div");
//   btnsTop.classList.add("btns_card_top");

//   const btnCopy = document.createElement("button");
//   btnCopy.classList.add("btn_card_start");
//   btnCopy.textContent = "Copy Scramble";

//   const btnDelete = document.createElement("button");
//   btnDelete.classList.add("btn_card_start", "delete");
//   btnDelete.textContent = "Delete";

//   const btnClose = document.createElement("button");
//   btnClose.classList.add("btn_card_start");
//   btnClose.textContent = "X";

//   btnsTop.appendChild(btnCopy);
//   btnsTop.appendChild(btnDelete);
//   btnsTop.appendChild(btnClose);
//   card.appendChild(btnsTop);

//   // --- Sección central ---
//   const optionsCard = document.createElement("div");
//   optionsCard.classList.add("options_card");

//   const timeCard = document.createElement("span");
//   timeCard.classList.add("time_card");
  
//   if(dato.dnf==false && dato.masDos==false){
//   	timeCard.textContent = dato.time;
//   }
//   else if(dato.dnf){
//   	timeCard.textContent = dato.timeDNF;
//   }
//   else if(dato.masDos){
//   	timeCard.textContent = dato.timeMasDos+"+";
//   }
  
//   optionsCard.appendChild(timeCard);

//   const btnsBottom = document.createElement("div");
//   btnsBottom.classList.add("btn_card_bottom");

//   const btn3x3 = document.createElement("button");
//   btn3x3.classList.add("btn_card_end", "masdos");
//   btn3x3.textContent = dato.typeCube;

//   const btnMas2 = document.createElement("button");
//   btnMas2.classList.add("btn_card_end", "masdos");
//   btnMas2.textContent = "+2";

//   if(dato.masDos){
//   	btnMas2.style.backgroundColor="orange"
//   }

//   const btnDNF = document.createElement("button");
//   btnDNF.classList.add("btn_card_end", "dnf");
//   btnDNF.textContent = "DNF";
  
//   if(dato.dnf){
//   	btnDNF.style.backgroundColor="red"
//   }

//   btnsBottom.appendChild(btn3x3);
//   btnsBottom.appendChild(btnMas2);
//   btnsBottom.appendChild(btnDNF);
//   optionsCard.appendChild(btnsBottom);

//   const dateCard = document.createElement("span");
//   dateCard.classList.add("date_card");
//   dateCard.textContent = dato.date;
//   optionsCard.appendChild(dateCard);

//   card.appendChild(optionsCard);

//   // --- Scramble y cubo ---
//   const scrambleCard = document.createElement("div");
//   scrambleCard.classList.add("scramble_card");

//   const cuboCard = document.createElement("div");
//   cuboCard.classList.add("cubo_card");

//   const mini_cubo = document.createElement("div");
//   mini_cubo.classList.add("mini_cubo");
//   crearCaras(mini_cubo)
//   let scramble_target= dato.scramble.split(" ")
//   console.log(scramble_target)
//   estadoCero(mini_cubo)
//   scrambler(mini_cubo,scramble_target)
//   cuboCard.appendChild(mini_cubo);
  
  

//   const pCombination = document.createElement("p");
//   pCombination.classList.add("combination_card");
//   pCombination.textContent = dato.scramble;
//   cuboCard.appendChild(pCombination);

//   scrambleCard.appendChild(cuboCard);
//   card.appendChild(scrambleCard);

//   contenedor.appendChild(overlayCard)

// 	//eventos
//   btnClose.addEventListener("click", (e) => {
//   	e.target.closest(".overlay_card").remove();
//   });

//   btnDelete.addEventListener("click", (e) => {
//   	e.target.closest(".overlay_card").remove();
//   	eliminar(index,"card")
//   });

// btnDNF.addEventListener("click", () => {
//   let transaccion = db.transaction("cube3x3", "readwrite");
//   let store = transaccion.objectStore("cube3x3");
//   let request = store.openCursor();
//   let contador = 0;

//   request.onsuccess = (e) => {
//     let cursor = e.target.result;
//     if (cursor) {
//       if (contador === index) {
//         let registro = cursor.value;

//         // Alternar el valor
//         registro.dnf = !registro.dnf;
//         registro.masDos = false;

//         // Actualizar la vista de la card
//         if (registro.dnf) {
//           btnDNF.style.backgroundColor = "red";
//           btnMas2.style.backgroundColor = "#444";
//           timeCard.textContent = registro.timeDNF;
//         } else {
//           btnDNF.style.backgroundColor = "#444";
//           timeCard.textContent = Number(registro.time).toFixed(2);
//         }

//         cursor.update(registro);

//         // Recargar la lista principal
//         leer((array) => {
//           archivador.innerHTML = "";
//           array.forEach((item, idx) => {
//             dataDiv(idx + 1, item.time, item.dnf, item.masDos);
//           });
//         });

//         return;
//       }
//       contador++;
//       cursor.continue();
//     }
//   };

//   request.onerror = (e) => {
//     console.error("Error al actualizar DNF:", e.target.error);
//   };
// });

// btnMas2.addEventListener("click", () => {
//   let transaccion = db.transaction("cube3x3", "readwrite");
//   let store = transaccion.objectStore("cube3x3");
//   let request = store.openCursor();
//   let contador = 0;

//   request.onsuccess = (e) => {
//     let cursor = e.target.result;
//     if (cursor) {
//       if (contador === index) {
//         let registro = cursor.value;

//         // Alternar el valor
//         registro.masDos = !registro.masDos;
//         registro.dnf = false;

//         // Actualizar la vista de la card
//         if (registro.masDos) {
//           btnMas2.style.backgroundColor = "orange";
//           btnDNF.style.backgroundColor = "#444";
//           timeCard.textContent = Number(registro.timeMasDos).toFixed(2)+"+";
//         } else {
//           btnMas2.style.backgroundColor = "#444";
//           timeCard.textContent = Number(registro.time).toFixed(2);
//         }

//         cursor.update(registro);

//         // Recargar la lista principal
//         leer((array) => {
//           archivador.innerHTML = "";
//           array.forEach((item, idx) => {
//             dataDiv(idx + 1, item.time, item.dnf, item.masDos);
//           });
//         });

//         return;
//       }
//       contador++;
//       cursor.continue();
//     }
//   };

//   request.onerror = (e) => {
//     console.error("Error al actualizar Mas DOs:", e.target.error);
//   };
// });

// btnCopy.addEventListener("click",()=>{
// 	navigator.clipboard.writeText(dato.scramble);
// })

// }
