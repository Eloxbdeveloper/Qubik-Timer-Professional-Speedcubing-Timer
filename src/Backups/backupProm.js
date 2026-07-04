
// import { db } from "./database.js"

// const promedios= document.querySelector(".promedios")

// export const checkDBProm = (cb) => {
//     const transaccion = db.transaction("promDB", "readonly");
//     const store = transaccion.objectStore("promDB");

//     const request = store.openCursor();
//     let datosProm = [];

//     request.onsuccess = (e) => {
//         const cursor = e.target.result;

//         if (cursor) {
//             const obj = cursor.value;

//             datosProm.push(obj);

//             cursor.continue();
//         } else {
            
//             cb(datosProm);
//         }
//     };

//     request.onerror = (e) => {
//         console.error("Error:", e.target.error);
//     };
// };

// export let promedios_p= {}
// export let mediaSingle_p={}
// export let selects={}

// export const crearPromedios=async(dato)=>{
    

//     const dates = document.createElement("div");
//     dates.classList.add("dates");

//     const h2Single = document.createElement("h2");
//     let single= await singleAndMedia("single");
//     h2Single.textContent = "Single: "+ single;
//     mediaSingle_p[0]=h2Single

//     const h2Media = document.createElement("h2");
//     let media= await singleAndMedia("media");
//     h2Media.textContent = "Media: "+media;

//     dates.appendChild(h2Single);
//     dates.appendChild(h2Media);
//     mediaSingle_p[1]=h2Media


//     const boxPromedios = document.createElement("div");
//     boxPromedios.classList.add("box_promedios");

//     let medias= ["Mo3","Ao12","Ao25","Ao50","Ao5","Ao100"]
//     let index=0;
//     for(let i of medias){
//         let idx=index
//         let prom1 = document.createElement("div");
//     prom1.classList.add("promedios_ao5");
//     let sel1 = document.createElement("select");
//     sel1.classList.add("select_promedio")
    
//     let opt1a = document.createElement("option");
//     opt1a.value = "Actual";
//     opt1a.textContent = `${i} Actual` ;
    
//     let opt1b = document.createElement("option");
//     opt1b.value = "Best";
//     opt1b.textContent = `${i} Best`;
//     sel1.appendChild(opt1a);
//     sel1.appendChild(opt1b);
//     selects[i]=sel1
    
//     let p1 = document.createElement("p");
//     p1.classList.add("time_promedio");
//     prom1.appendChild(sel1);
//     prom1.appendChild(p1);
//     promedios_p[i]=p1
//     let num
//     if (dato[idx].actual === true){
//         if(i=="Mo3"){
//         num= await Mo3()
//     }
//     if(i=="Ao5"){
//         num= await funcGeneral(5)
//     }
//     if(i=="Ao12"){
//         num= await funcGeneral(12)
//     }
//     if(i=="Ao25"){
//         num= await funcGeneral(25)
//     }
//     if(i=="Ao50"){
//         num= await funcGeneral(50)
//     }
//     if(i=="Ao100"){
//         num= await funcGeneral(100)
//     }
//     }

//     else if(dato[idx].actual === false){
//         if(i=="Mo3"){
//         num= await funcBest(3)
//     }
//     if(i=="Ao5"){
//         num= await funcBest(5)
//     }
//     if(i=="Ao12"){
//         num= await funcBest(12)
//     }
//     if(i=="Ao25"){
//         num= await funcBest(25)
//     }
//     if(i=="Ao50"){
//         num= await funcBest(50)
//     }
//     if(i=="Ao100"){
//         num= await funcBest(100)
//     }
//     }
    
//     p1.textContent= num;
//     boxPromedios.appendChild(prom1);

//     if (dato) {
//     if (dato[idx].actual === true) {
//         sel1.value = "Actual";
        
//     } else {
//         sel1.value = "Best";
//     }

//     sel1.addEventListener("change", async () => {

//     if (sel1.value === "Actual") {
//         dato[idx].actual = true;
//     } else {
//         dato[idx].actual = false;
//     }

//     const tx = db.transaction("promDB", "readwrite");
//     const store = tx.objectStore("promDB");
//     store.put(dato[idx]);

//     await promedios_front();   // ← recalcula inmediatamente
// });
// }

// console.log(mediaSingle_p)

// sel1.addEventListener("change", () => {

//     if (sel1.value === "Actual") {
//         dato[idx].actual = true;
//     } else {
//         dato[idx].actual = false;
//     }

//     const tx = db.transaction("promDB", "readwrite");
//     const store = tx.objectStore("promDB");
//     store.put(dato[idx]);    

// });

//     index++

//     }

//     promedios.appendChild(dates);
//     promedios.appendChild(boxPromedios);

// }



// export const arrayDB = () => {
//     return new Promise((resolve, reject) => {

//         const transaccion = db.transaction("cube3x3", "readonly");
//         const store = transaccion.objectStore("cube3x3");

//         const request = store.openCursor();
//         const array = [];

//         request.onsuccess = (e) => {
//             const cursor = e.target.result;

//             if (cursor) {
//                 const obj = cursor.value;

//                 if (obj.masDos) array.push(obj.timeMasDos);
//                 else if (obj.dnf) array.push(obj.timeDNF);
//                 else array.push(obj.time);

//                 cursor.continue();
//             } else {
//                 resolve(array.reverse()); 
//             }
//         };

//         request.onerror = (e) => reject(e.target.error);
//     });
// };

// export async function Mo3(arr){
//     let resultado;
//     let operacion;
//     let db;

//     if(arr){
//         db=arr
//     }else{
//         db= await arrayDB();
//     }
    
//     if(db.length<3){
//         resultado= "--"
//     }
//     let promedio=[db[0],db[1],db[2]]
    
//     if(promedio.includes("DNF")){
//        resultado= "DNF"
//     }
//     else if(db.length>=3){
//         operacion= (Number(promedio[0])+Number(promedio[1])+Number(promedio[2]))/3;
//         resultado= operacion.toFixed(2)
//     }
//     console.log("Mo3: " + resultado)
//     return resultado
// } 

// export async function funcGeneral(num,arr){
//     let db;
    
//     if(arr){
//         db= arr
//     }
//     else{
//         db= await arrayDB();
//     }
    
//     function ao5yao12(num){
//         let promedio=[];
//         let resultado;

//         if(db.length<num){
//             resultado="--"
//             if(num==5){
//                 console.log("Ao5:"+resultado)
//             }
//             else if(num==12){
//                 console.log("Ao12:"+resultado)
//             }
//             else if(num==25){
//                 console.log("Ao25:"+resultado)
//             }
//             else if(num==50){
//                 console.log("Ao50:"+resultado)
//             }
//             else if(num==100){
//                 console.log("Ao100:"+resultado)
//             }
            
//         }

//         else{
//             for(let i=0;i<num;i++){
//             promedio.push(db[i])
//         }
//         let dnf= promedio.filter(x=>x==="DNF").length

//         if(dnf>=2){

//             if(num==100){
//                 promedio= promedio.filter(x => x !== "DNF");
//                 promedio.sort((a, b) => a - b);

//                 if(dnf>5){
//                     resultado= "DNF"
//                     console.log("Ao100: "+resultado)
//                 }
//                 else if(dnf<6){
//                     for(let i=0;i<5;i++){
//                     promedio.shift();
//                     }
//                     if(dnf==4){
//                         promedio.pop()
//                     }
//                     else if(dnf==3){
//                         for(let i=0;i<2;i++){
//                             promedio.pop()
//                         }
//                     }
//                     else if(dnf==2){
//                         for(let i=0;i<3;i++){
//                             promedio.pop()
//                         }
//                     }

//                 }

//             }
            
//             else if(num==50){
//                 promedio= promedio.filter(x => x !== "DNF");
//                 promedio.sort((a, b) => a - b);

//                 if(dnf==2){
//                     for(let i=0;i<3;i++){
//                     promedio.shift();
//                     }
//                     promedio.pop()
//                 }
//                 else if(dnf>2){
//                     if(dnf==3){
//                         for(let i=0;i<3;i++){
//                         promedio.shift();
//                         }
//                     }
//                     else if(dnf>3){
//                         resultado= "DNF"
//                         console.log("Ao50: "+resultado)
//                     }
//                 }
                
//             }

//             else if(dnf==2 && num==25){
//                 promedio= promedio.filter(x => x !== "DNF");
//                 promedio.sort((a, b) => a - b);
//                 promedio.shift();
//                 promedio.shift();
//             }else{
//                 resultado= "DNF"
//             if(num==5){
//                 console.log("Ao5:"+resultado)
//             }
//             else if(num==12){
//                 console.log("Ao12:"+resultado)
//             }
//             else if(num==25 && dnf>2){
//                 console.log("Ao25:"+resultado)
//             }
//             }
            
//         }
//         else if(dnf==1){

//         promedio= promedio.filter(x => x !== "DNF");
//         promedio.sort((a, b) => a - b);
//             if(num==100){
//                 for(let i=0;i<5;i++){
//                     promedio.shift();
//                     }
//                 for(let i=0;i<4;i++){
//                     promedio.pop();
//                     }    
//             }

//             else if(num==50){
//                 for(let i=0;i<3;i++){
//                     promedio.shift();
//                     }
//                 promedio.pop()
//                 promedio.pop()
//             }
            
//             else if(num==25){
//             promedio.shift();
//             promedio.shift();
//             promedio.pop()

//             }else{
//             promedio.shift();
//             }
            

//         }
//         else if(dnf==0){
//             promedio.sort((a, b) => a - b);
//             if(num==100){
//                 for(let i=0;i<5;i++){
//                     promedio.shift()
//                     promedio.pop()
//                     }
//             }
            
//             else if(num==50){
//                 for(let i=0;i<3;i++){
//                     promedio.shift();
//                     promedio.pop()
//                     }
//             }
            
//             else if(num==25){
//                 for(let i=0;i<2;i++){
//                     promedio.shift(); 
//                     promedio.pop();  
//                 }
//             }else{
//                 promedio.shift(); 
//                 promedio.pop();  
//             }  

//         }

//         if(resultado!="DNF"){
//             let operacion=0;

//             for(let i=0;i<promedio.length;i++){
//                 let suma= Number(promedio[i])
//                 operacion= operacion+suma
//             }

//             let media;
//             if(num==5){
//                 media= operacion/3
//             }
//             else if(num==12){
//                 media= operacion/10
//             }
//             else if(num==25){
//                 media= operacion/21
//             }
//              else if(num==50){
//                 media= operacion/44
//             }
//              else if(num==100){
//                 media= operacion/90
//             }
//             resultado= media.toFixed(2)
//             if(num==5){
//                 console.log("Ao5:"+resultado)
//             }
//             else if(num==12){
//                 console.log("Ao12:"+resultado)
//             }
//             else if(num==25){

//                 console.log("Ao25:"+resultado)
//             }
//             else if(num==50){
//                 console.log("Ao50:"+resultado)
//             }
//             else if(num==100){
//                 console.log("Ao100:"+resultado)
//             }
//         }
//         }
//         return resultado
//     }

//     if(num==5){
//         return ao5yao12(5)
//     }
//     else if(num==12){
//         return ao5yao12(12)
//     }
//     else if(num==25){
//         return ao5yao12(25)
//     }
//     else if(num==50){
//         return ao5yao12(50)
//     }
//     else if(num==100){
//         return ao5yao12(100)
//     }
// }

// export async function singleAndMedia(dato){
//     let db= await arrayDB();
//     let resultado;
//     if(db.length<1){
//         resultado= "--"
//     }
//     else{
//         let promedio=[];

//         for(let i=0;i<db.length;i++){
//             promedio.push(db[i])
//         }
//         if(dato=="single"){
//             promedio.sort((a, b) => a - b);
//             promedio= promedio.filter(x => x !== "DNF")
//             resultado= promedio[0];
//             if(resultado==undefined){
//                 resultado="--"
//             }
//         }
//         else if(dato=="media"){
//             let total= db.length
//             let dnf= promedio.filter(x=>x==="DNF").length
//             console.log("DNFS: "+dnf)
//             promedio= promedio.filter(x => x !== "DNF")
            
//             if(dnf>0){
//                 promedio.sort((a, b) => a - b);
//                 if(total<=12){
//                 if(dnf==1){
//                     promedio.shift()
//                 }else if(dnf>=2){
//                     resultado="DNF"
                    
//                 }
//             }
//             else if(total>12 && total<=25){
//                 if(dnf==1 || dnf==2){
//                     for(let i=0;i<dnf;i++){
//                         promedio.shift()
//                     }
//                 }
//                 else if(dnf>=3){
//                     resultado="DNF"
//                 }
//             }
//             else if(total>25 && total<=50){
//                 if(dnf==1 || dnf==2 || dnf==3){
//                     for(let i=0;i<dnf;i++){
//                         promedio.shift()
//                     }
//                 }
//                 else if(dnf>=4){
//                     resultado="DNF"
//                 }
//             }
//             else if(total>50 && total<=75){
//                 if(dnf==1 || dnf==2 || dnf==3 || dnf==4){
//                     for(let i=0;i<dnf;i++){
//                         promedio.shift()
//                     }
//                 }
//                 else if(dnf>=5){
//                     resultado="DNF"
//                 }
//             }
//             else if(total>75 && total<=100){
//                 if(dnf==1 || dnf==2 || dnf==3 || dnf==4 || dnf==5){
//                     for(let i=0;i<dnf;i++){
//                         promedio.shift()
//                     }
//                 }
//                 else if(dnf>=6){
//                     resultado="DNF"
//                 }
//             }
//             else if(total>100){
//                 let cien= 5
//                 let sieteCinco= 4
//                 let cincuenta= 3
//                 let dosCinco= 2
                
//                 let calculo= Math.trunc(total/100)
//                 let residuo= total- (calculo*100)
//                 console.log("calc: "+calculo)
//                 console.log("residuo: "+residuo)
//                 let dnfTotal=0;
                
//                 if(calculo>0){
                    
//                     for(let i=0;i<calculo;i++){
//                         dnfTotal= dnfTotal+cien
//                     }
//                 }
//                 if(residuo>0 && residuo<=25){
//                     dnfTotal= dnfTotal+dosCinco
//                 }
//                 else if(residuo>25 && residuo<=50){
//                     dnfTotal= dnfTotal+cincuenta
//                 }
//                 else if(residuo>50 && residuo<=75){
//                     dnfTotal= dnfTotal+sieteCinco
//                 }
//                 else if(residuo>75 && residuo<=100){
//                     dnfTotal= dnfTotal+cien
//                 }
//                 console.log("dnfsTotales: "+dnfTotal)

//                 if(dnf>dnfTotal){
//                     resultado= "DNF"
//                 }else if(dnf<=dnfTotal){
//                     for(let i=0;i<dnf;i++){
//                         promedio.shift()
//                     }
//                 }
//             }
//             }
            

//             let operacion=0;
//             for(let i=0;i<promedio.length;i++){
//                 let suma= Number(promedio[i])
//                 operacion= operacion+suma
//             }

//             if(resultado!="DNF"){
//             resultado= (operacion/promedio.length).toFixed(2);
//             }
            
            
            
            
//         }
    
//     }
//     console.log(dato +" "+resultado)
//     return resultado
    
// }

// export async function funcBest(num){
//     let db= await arrayDB()
//     let promedios=[];
//     let calculo=[]
//     let resultado;

//     if(db.length<num){
//         resultado="--"
//         return resultado
//     }
//     else{
//         for(let iO=0;iO<db.length;iO++){
//         for(let i=0;i<num;i++){
//             if(!db[i+iO] || db[i+iO]==undefined || db[i+iO]==NaN){
//                 break
//             }else{
//                 calculo.push(db[i+iO])
//             }
        
//     }

//     let resParcial;
//     if(num==3){
//         resParcial= await Mo3(calculo)
//     }
//     else{
//         resParcial= await funcGeneral(num,calculo)
//     }

//     promedios.push(resParcial)
//     calculo=[];
//     }

//     let savePromedios= promedios;
//     promedios= promedios.filter(x => x !== "DNF")
//     promedios= promedios.filter(x => x !== "--")
//     promedios.sort((a, b) => a - b);
//     console.log(promedios)
//     console.log(savePromedios)
//     if(promedios==[]){
//         resultado="--"
//     }

//     let posicion;
//     for (let i = 0; i < savePromedios.length; i++) {
//     if (savePromedios[i] === promedios[0]) {
//         console.log("posición: " + i);
//         posicion= i
//         break
//     }
    
// }
//     console.log("best:" +savePromedios[41])
//     let bestPromedio=[]
//     for(let i=0;i<num;i++){
//         bestPromedio.push(db[posicion+i])
//     }

//     if(resultado!="--"){
//         resultado={
//         average: promedios[0],
//         times: bestPromedio,
//         posicionDB: db.length-posicion
//     }
    
//     }
    
// }
//     console.log("Best: "+resultado)
//     if(resultado.average==undefined){
//         return "--"
//     }
//     else{
//         return resultado.average
//     }
    
// }

// export const promedios_front = async () => {

//     const media = await singleAndMedia("media")
//     const single = await singleAndMedia("single")

//     mediaSingle_p[0].textContent = "Single: " + single
//     mediaSingle_p[1].textContent = "Media: " + media

//     const config = {
//         "Mo3": 3,
//         "Ao5": 5,
//         "Ao12": 12,
//         "Ao25": 25,
//         "Ao50": 50,
//         "Ao100": 100
//     }

//     for (let key in config) {

//         let valor

//         if (selects[key].value === "Actual") {
//             if (key === "Mo3") {
//                 valor = await Mo3()
//             } else {
//                 valor = await funcGeneral(config[key])
//             }
//         } else {
//             valor = await funcBest(config[key])
//         }

//         promedios_p[key].textContent = valor
//     }
// }