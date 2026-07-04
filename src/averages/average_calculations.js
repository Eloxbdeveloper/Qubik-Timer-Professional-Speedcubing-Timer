import { arrayDB } from "../database/average_DB.js"

/*
 Mo3 (Mean of 3)
 Calcula la media de los primeros 3 tiempos.
 Reglas alineadas con formato oficial de la World Cube Association (WCA).
 - Si hay menos de 3 tiempos → "--"
 - Si alguno es "DNF" → "DNF"
 - Si todos son válidos → promedio aritmético con 2 decimales
 */
export async function Mo3(arr){
    let resultado;
    let operacion;
    let db;

    // Si se pasa un arreglo manualmente lo usa, si no consulta la DB
    if(arr){
        db=arr
    }else{
        db= await arrayDB();
    }
    
    // Validación de longitud: Controla que existan al menos 3 tiempos para iniciar el cálculo
    if(db.length<3){
        resultado= "--"
    }

    // Aislamiento de ventana: Toma estrictamente las primeras 3 resoluciones del conjunto de datos dado
    let promedio=[db[0],db[1],db[2]]
    
    // Regla WCA para Mo3: Si una de las 3 resoluciones es No Finalizada (DNF), todo el Mo3 se invalida automáticamete
    if(promedio.includes("DNF")){
       resultado= "DNF"
    }
    // Si la ventana tiene datos suficientes y está limpia de DNFs, calcula la media aritmética
    else if(db.length>=3){
        operacion= (Number(promedio[0])+Number(promedio[1])+Number(promedio[2]))/3;
        resultado= operacion.toFixed(2)
    }

    return resultado
} 


/*
 funcGeneral
 Motor principal para:
 Ao5, Ao12, Ao25, Ao50, Ao100

 Implementa eliminación de mejores y peores tiempos
 y manejo proporcional de DNFs según tamaño.
 */
export async function funcGeneral(num,arr){
    let db;
    
    // Origen de datos adaptable: Permite recibir sub-arrays calculados (ventanas móviles) o leer la base de datos directa
    if(arr){
        db= arr
    }
    else{
        db= await arrayDB(false,101);
    }
    
    // Función encapsulada para procesar la lógica de Average of N (AoN)
    function ao5yao12(num){
        let promedio=[];
        let resultado;

        // Si los tiempos almacenados no cubren el tamaño de la ventana solicitada, se aborta con indicador vacío
        if(db.length<num){
            resultado="--"
        }

        else{
            // Segmentación: Se extraen los primeros N elementos requeridos por la firma del promedio
            for(let i=0;i<num;i++){
                promedio.push(db[i])
            }

            // Mapeo de penalizaciones: Cuenta cuántas resoluciones fallidas (DNF) existen en la ventana actual
            let dnf= promedio.filter(x=>x==="DNF").length

            /*
             BLOQUE DNF >= 2
             Reglas especiales dependiendo del tamaño del average
            */
            if(dnf>=2){

                // Caso Ao100: Permite un límite máximo tolerado de hasta 5 DNFs en la ventana
                if(num==100){
                    promedio= promedio.filter(x => x !== "DNF"); // Remueve DNFs para ordenar aritméticamente los numéricos
                    promedio.sort((a, b) => a - b);

                    // Si excede el 5% de fallos permitidos por la WCA para ventanas de 100, el promedio es inválido (DNF)
                    if(dnf>5){
                        resultado= "DNF"
                    }
                    else if(dnf<6){
                        // Eliminación de extremos: Se descartan los 5 mejores tiempos numéricos del inicio
                        for(let i=0;i<5;i++){
                            promedio.shift();
                        }

                        // Compensación de extremos superiores: Los DNFs actúan como los peores tiempos.
                        // Según la cantidad real de DNFs, se elimina el residuo faltante de los peores tiempos numéricos (pop)
                        // para completar la remoción total de 5 mejores y 5 peores.
                        if(dnf==4){
                            promedio.pop()
                        }
                        else if(dnf==3){
                            for(let i=0;i<2;i++){
                                promedio.pop()
                            }
                        }
                        else if(dnf==2){
                            for(let i=0;i<3;i++){
                                promedio.pop()
                            }
                        }
                    }
                }
                
                // Caso Ao50: Tolerancia proporcional basada en reglas WCA adaptadas (máximo 3 DNFs)
                else if(num==50){
                    promedio= promedio.filter(x => x !== "DNF");
                    promedio.sort((a, b) => a - b);

                    // Si hay exactamente 2 DNFs, actúan como peores tiempos. Se quitan los 3 mejores (shift) y 1 peor numérico (pop)
                    if(dnf==2){
                        for(let i=0;i<3;i++){
                            promedio.shift();
                        }
                        promedio.pop()
                    }
                    // Si hay exactamente 3 DNFs, se remueven los 3 mejores tiempos del array numérico
                    else if(dnf==3){
                        for(let i=0;i<3;i++){
                            promedio.shift();
                        }
                    }
                    // Más de 3 DNFs corrompen el Ao50 por completo
                    else if(dnf>3){
                        resultado= "DNF"
                    }
                }

                // Caso Ao25 con exactamente 2 DNFs: Se eliminan los 2 mejores tiempos; los 2 DNFs cubren el cupo de peores
                else if(dnf==2 && num==25){
                    promedio= promedio.filter(x => x !== "DNF");
                    promedio.sort((a, b) => a - b);
                    promedio.shift();
                    promedio.shift();
                }
                // Casos Ao5, Ao12 o Ao25 (con >2 DNFs): Cualquier cantidad de DNFs >= 2 invalida el promedio automáticamente
                else{
                    resultado= "DNF"
                }
            }

            /*
             BLOQUE DNF == 1
             Se elimina proporcionalmente junto a extremos
            */
            else if(dnf==1){

                promedio= promedio.filter(x => x !== "DNF"); // El único DNF se remueve y absorbe el puesto del peor tiempo absoluto
                promedio.sort((a, b) => a - b);

                // Recorte proporcional para Ao100 con 1 DNF: Quita los 5 mejores (shift) y los 4 peores numéricos restantes (pop)
                if(num==100){
                    for(let i=0;i<5;i++){
                        promedio.shift();
                    }
                    for(let i=0;i<4;i++){
                        promedio.pop();
                    }    
                }
                // Recorte para Ao50 con 1 DNF: Quita 3 mejores (shift) y 2 peores numéricos (pop)
                else if(num==50){
                    for(let i=0;i<3;i++){
                        promedio.shift();
                    }
                    promedio.pop()
                    promedio.pop()
                }
                // Recorte para Ao25 con 1 DNF: Quita 2 mejores (shift) y 1 peor numérico (pop)
                else if(num==25){
                    promedio.shift();
                    promedio.shift();
                    promedio.pop()
                }
                // Recorte estándar para Ao5 y Ao12 con 1 DNF: El DNF cuenta como el peor tiempo, se remueve el mejor (shift)
                else{
                    promedio.shift();
                }
            }

            /*
             BLOQUE DNF == 0
             Eliminación estándar de mejores y peores (Recorte simétrico clásico WCA)
            */
            else if(dnf==0){
                promedio.sort((a, b) => a - b);

                // Ao100: Elimina el 5% de cada extremo (5 mejores y 5 peores)
                if(num==100){
                    for(let i=0;i<5;i++){
                        promedio.shift()
                        promedio.pop()
                    }
                }
                // Ao50: Elimina los 3 mejores y los 3 peores
                else if(num==50){
                    for(let i=0;i<3;i++){
                        promedio.shift();
                        promedio.pop()
                    }
                }
                // Ao25: Elimina los 2 mejores y los 2 peores
                else if(num==25){
                    for(let i=0;i<2;i++){
                        promedio.shift(); 
                        promedio.pop();  
                    }
                }
                // Ao5 y Ao12: Elimina de forma básica el mejor (shift) y el peor (pop) del set ordenado
                else{
                    promedio.shift(); 
                    promedio.pop();  
                }  
            }

            /*
             Cálculo final si no quedó como DNF
            */
            if(resultado!="DNF"){
                let operacion=0;

                // Sumatoria de los tiempos válidos restantes dentro del arreglo truncado
                for(let i=0;i<promedio.length;i++){
                    let suma= Number(promedio[i])
                    operacion= operacion+suma
                }

                let media;

                // Divisores estáticos basados en la cantidad de elementos supervivientes de cada tipo de promedio
                if(num==5){
                    media= operacion/3 // 5 - 2 extremos = 3
                }
                else if(num==12){
                    media= operacion/10 // 12 - 2 extremos = 10
                }
                else if(num==25){
                    media= operacion/21 // 25 - 4 extremos = 21
                }
                else if(num==50){
                    media= operacion/44 // 50 - 6 extremos = 44
                }
                else if(num==100){
                    media= operacion/90 // 100 - 10 extremos = 90
                }

                resultado= media.toFixed(2)
            }
        }

        return resultado
    }

    // Enrutador de llamadas: Dispara la subfunción interna inyectando el tamaño de ventana parametrizado
    if(num==5){
        return ao5yao12(5)
    }
    else if(num==12){
        return ao5yao12(12)
    }
    else if(num==25){
        return ao5yao12(25)
    }
    else if(num==50){
        return ao5yao12(50)
    }
    else if(num==100){
        return ao5yao12(100)
    }
}


/*
 singleAndMedia

 - "single": mejor tiempo individual
 - "media": promedio global considerando reglas proporcionales de DNF
/* */
export async function singleAndMedia(dato,obj){

    let db= await arrayDB(true); // Carga la base de datos completa con los objetos de metadata
    let resultado;

    // Validación elemental de datos existentes en el historial
    if(db.length<1){
        resultado= "--"
    }
    else{
        let promedio=[];

        // Reconstrucción y normalización del array: Aplica penalizaciones guardadas (+2 segundos o DNF)
        for(let i=0;i<db.length;i++){
            if(db[i].masDos==true){
                promedio.push(db[i].timeMasDos) // Inserta tiempo con la penalización de +2s ya sumada
            }else if(db[i].dnf==true){
                promedio.push("DNF")
            }else{
                promedio.push(db[i].time) // Inserta tiempo limpio
            }
        }

        // Sub-lógica para extraer el Mejor Single Válido (PB Individual)
        if(dato=="single"){
            promedio = promedio.filter(x => x !== "DNF") // Se ignoran los DNFs para buscar récords de velocidad
            promedio.sort((a, b) => a - b)  
            let time= promedio[0] // El índice 0 representa el menor tiempo conseguido
            let objeto

            // Escaneo de vinculación: Busca en la base de datos el objeto original que coincide con ese tiempo
            for (let item of db) {
                if (Number(item.time) === Number(time) || Number(item.timeMasDos) === Number(time)) {
                    objeto = item
                    break
                }
            }
            
            // Retorna estructura combinada (el valor numérico y toda su metadata asociada)
            resultado= {
                time: time,
                object: objeto
            } 

            if(resultado==undefined){
                resultado="--"
            }
        }

        // Sub-lógica para la Media Global: Calcula el promedio de todo el historial con escalado dinámico de DNFs
        else if(dato=="media"){

            let total= db.length
            let dnf= promedio.filter(x=>x==="DNF").length

            promedio= promedio.filter(x => x !== "DNF")

            /*
             Reglas escalonadas de tolerancia DNF
             según tamaño total de solves
            */
            if(dnf>0){

                promedio.sort((a, b) => a - b);

                // Regla para historiales pequeños (<= 12 solves): Permite máximo 1 DNF (eliminándolo como peor tiempo)
                if(total<=12){
                    if(dnf==1){
                        promedio.shift()
                    }else if(dnf>=2){
                        resultado="DNF"
                    }
                }

                // Regla macro (Historiales > 100): Implementa penalización proporcional por bloques fractales de 100 solves
                else if(total>100){

                    // Valores base de tolerancia por rangos
                    let cien= 5
                    let sieteCinco= 4
                    let cincuenta= 3
                    let dosCinco= 2
                    
                    let calculo= Math.trunc(total/100) // Cantidad de bloques de 100 enteros
                    let residuo= total- (calculo*100)  // Fracción de solves restantes

                    let dnfTotal=0;
                    
                    // Acumulación de tolerancia permitida por cada 100 solves (5 DNFs de gracia por bloque)
                    if(calculo>0){
                        for(let i=0;i<calculo;i++){
                            dnfTotal= dnfTotal+cien
                        }
                    }

                    // Suma de tolerancia marginal según el residuo restante de solves
                    if(residuo>0 && residuo<=25){
                        dnfTotal= dnfTotal+dosCinco
                    }
                    else if(residuo>25 && residuo<=50){
                        dnfTotal= dnfTotal+cincuenta
                    }
                    else if(residuo>50 && residuo<=75){
                        dnfTotal= dnfTotal+sieteCinco
                    }
                    else if(residuo>75 && residuo<=100){
                        dnfTotal= dnfTotal+cien
                    }

                    // Si los fallos del usuario superan el umbral matemático calculado, la media global cae en "DNF"
                    if(dnf>dnfTotal){
                        resultado= "DNF"
                    }else if(dnf<=dnfTotal){
                        // Si está en el rango de tolerancia, remueve los mejores tiempos numéricos de forma proporcional
                        for(let i=0;i<dnf;i++){
                            promedio.shift()
                        }
                    }
                }
            }

            // Procesamiento aritmético final de la media global
            if (resultado === "DNF" || promedio.length === 0) {
                resultado = "DNF";
            } else {
                let operacion=0;

                for(let i=0;i<promedio.length;i++){
                    let suma= Number(promedio[i])
                    operacion= operacion+suma
                }

                // Promedio directo sobre los elementos procesados en la cola
                resultado= (operacion/promedio.length).toFixed(2);
            }
        }
    }
    
    // Formateo de las salidas de retorno según las banderas opcionales de invocación
    if(dato=="single" && obj){
       return resultado.object // Retorna el objeto completo con la metadata de la sesión (Scramble, fecha, etc.)
    }
    if (dato == "single" && !obj) {
        if (!resultado.object) return "--"

        // Retorna solo el string del tiempo numérico del single, validando si lleva incremento de +2
        if (resultado.object.masDos) {
            return Number(resultado.object.timeMasDos).toFixed(2)
        } else {
            return Number(resultado.object.time).toFixed(2)
        }
    }else{
        return resultado // Retorna el valor string directo ("DNF", "--" o el promedio calculado)
    }
}