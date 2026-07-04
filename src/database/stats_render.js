import { funcGeneral, Mo3, singleAndMedia } from "../averages/average_calculations.js"
import { funcBest } from "../averages/average_Best.js"
import { arrayDB } from "./average_DB.js";
import { contenedor } from "./DB_render.js";
import { crearCard } from "./cards_render.js";

/*
  crearCardStats(stats, actual)
  Genera dinámicamente un componente modal (overlay) que detalla los tiempos
  e índices que componen un promedio específico (Mo3, Ao5, Ao12, etc.),
  diferenciando de forma lógica entre el promedio actual ("Current") y el mejor histórico ("Best").
*/
export async function crearCardStats(stats, actual){
    
    // Contenedor principal de fondo oscuro (modal/overlay) para bloquear la vista trasera
    const overlayCard = document.createElement("div")
    overlayCard.classList.add("overlay_card")
    
    // Contenedor físico de la tarjeta de estadísticas
    const card = document.createElement("div")
    card.classList.add("card_stats")
    overlayCard.appendChild(card)

    // Botón de cierre de la ventana modal
    const btnClose = document.createElement("button")
    btnClose.classList.add("close_stats")
    btnClose.textContent = "x"
    card.appendChild(btnClose)

    // Bloque de texto principal que describe el tipo de estadística
    const textCard = document.createElement("div")
    textCard.classList.add("text_card")

    // Etiqueta para discernir el estado temporal del promedio (Actual vs Mejor)
    const actualStats = document.createElement("span")
    actualStats.classList.add("actual_stats")
    
    if(actual==true){
         actualStats.textContent = "Current "
    }else if(actual==false){
        actualStats.textContent = "Best "
    }
   
    // Contenedor para el nombre descriptivo del promedio (ej. "Average Of 5:")
    const avgText = document.createElement("span")
    avgText.classList.add("avgtext_card")
    
    // Contenedor para el valor numérico final del cálculo del promedio
    const avgStats = document.createElement("span")
    avgStats.classList.add("avg_stats")
    
    textCard.append(actualStats, avgText, avgStats)
    card.appendChild(textCard)

    // Etiqueta de texto encargada de renderizar la fecha del solve de referencia
    const dateStats = document.createElement("span")
    dateStats.classList.add("date_stats")
    card.appendChild(dateStats)

    // Botón informativo del tipo de cubo/evento seleccionado
    const btnCube = document.createElement("button")
    btnCube.classList.add("btn_card_end","typecube_stats")
    btnCube.textContent = "3x3"
    card.appendChild(btnCube)

    // Lista contenedora donde se inyectará secuencialmente cada solve implicado
    const listStats = document.createElement("div")
    listStats.classList.add("list_stats")
    
    // Recupera la colección completa de registros limpios en formato array desde IndexedDB
    let tiempos= await arrayDB(true)

    // Función anidada encargada de iterar, formatear y renderizar los solves requeridos por el promedio
    async function print_solves(idx){ 
        
        // Obtiene el índice de inicio del "Best" solve dentro del array global mediante cálculo analítico
        let contador= await funcBest(idx,true)
        let data = tiempos

        // Lógica de segmentación: Si es el mejor promedio, se extrae el bloque histórico exacto de solves
        if(!actual){
            let new_tiempos = []
            for(let i = 0; i < idx; i++){
                new_tiempos.push(tiempos[contador + i]) // Acumula el subconjunto de solves del récord
            }
            data = new_tiempos
            dateStats.textContent = data[0].date // Asigna la fecha del primer solve del segmento histórico
        }else{
            // Si es el promedio actual, simplemente extrae la fecha del registro base del inicio
            dateStats.textContent = tiempos[0].date
        }
        
        // Loop de renderizado para construir individualmente cada fila de tiempo en la lista
        for(let i=0;i<idx;i++){
        
            const solveStats = document.createElement("div")
            solveStats.classList.add("solve_stats")

            const textList = document.createElement("div")
            textList.classList.add("text_list")

            const indexStats = document.createElement("span")
            indexStats.classList.add("index_stats")
            
            // Calcula de forma inversa el índice visual inequívoco del solve para desplegarlo en la UI
            if(actual){
                indexStats.textContent = data.length-i + ". "
            }else{
                let baseIndex = contador + i
                let realIndex = tiempos.length - baseIndex
                indexStats.textContent = realIndex + ". "
            }
            
            const timeStats = document.createElement("span")
            timeStats.classList.add("time_stats")
            
            textList.append(indexStats, timeStats)

            // Botón interactivo para examinar los detalles específicos de este solve (scramble, cubo en 2D, etc.)
            const btnView = document.createElement("button")
            btnView.classList.add("btn_card_end")
            btnView.textContent = "View Solve"

            solveStats.append(textList, btnView)
            listStats.appendChild(solveStats)
            
            // Asigna estilos cromáticos y textos basados en las penalizaciones de cada solve interno
            if(data[i].masDos==false && data[i].dnf==false){
                timeStats.textContent = data[i].time
                timeStats.style.color= "#00b85c" // Verde para solves válidos sin penalizaciones
            }
            else if(data[i].masDos==true){
                timeStats.textContent = data[i].timeMasDos
                timeStats.style.color= "orange"  // Naranja indicativo de penalización +2 segundos
            }
            else if(data[i].dnf==true){
                timeStats.textContent = data[i].timeDNF
                timeStats.style.color= "red"     // Rojo indicativo de descalificación DNF
            }
            
            // Dispara el visualizador de tarjetas generales al pulsar en ver solve (marcado como no modificable)
            btnView.addEventListener("click",()=>{
                crearCard(data[i],null,false)
            })
        }
    }

    // --- Enrutador de Categorías: Mapea el tipo de estadística solicitada y asigna sus callbacks matemáticos ---
    if(stats=="Media"){
        avgText.textContent = "Global Media: "
        avgStats.textContent = await singleAndMedia("media")
        print_solves(tiempos.length) // Muestra la totalidad de los solves registrados
    }
    else if(stats=="Mo3"){
        avgText.textContent = "Media Of 3: "
        if(actual==true){
            avgStats.textContent= await Mo3()
        }else if(actual==false){
            avgStats.textContent= await funcBest(3)
        }
         print_solves(3) // Muestra la terna correspondiente
    }
    else if(stats=="Ao5"){
        avgText.textContent = "Average Of 5: "
        if(actual==true){
            avgStats.textContent= await funcGeneral(5)
        }else if(actual==false){
            avgStats.textContent= await funcBest(5)
        }
        print_solves(5)
    }
    else if(stats=="Ao12"){
        avgText.textContent = "Average Of 12: "
        if(actual==true){
            avgStats.textContent= await funcGeneral(12)
        }else if(actual==false){
            avgStats.textContent= await funcBest(12)
        }
        print_solves(12)
    }
    else if(stats=="Ao25"){
        avgText.textContent = "Average Of 25: "
        if(actual==true){
            avgStats.textContent= await funcGeneral(25)
        }else if(actual==false){
            avgStats.textContent= await funcBest(25)
        }
        print_solves(25)
    }
    else if(stats=="Ao50"){
        avgText.textContent = "Average Of 50: "
        if(actual==true){
            avgStats.textContent= await funcGeneral(50)
        }else if(actual==false){
            avgStats.textContent= await funcBest(50)
        }
        print_solves(50)
    }
    else if(stats=="Ao100"){
        avgText.textContent = "Average Of 100: "
        if(actual==true){
            avgStats.textContent= await funcGeneral(100)
        }else if(actual==false){
            avgStats.textContent= await funcBest(100)
        }
        print_solves(100)
    }
    
    // Adjunta e inyecta la lista estructurada al contenedor principal y lo acopla al DOM
    card.appendChild(listStats)
    contenedor.appendChild(overlayCard)
    
    // Evento para remover el nodo completo del DOM al cerrar la modal
    btnClose.addEventListener("click", (e) => {
        e.target.closest(".overlay_card").remove()
    })
}