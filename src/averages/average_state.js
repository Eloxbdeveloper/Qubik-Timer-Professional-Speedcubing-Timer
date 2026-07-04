/*
 * Objetos globales exportados para almacenar estado compartido
 * entre módulos del sistema de estadísticas.
 * * Se exportan usando la palabra clave "let" para permitir la reasignación,
 * mutación y sincronización bidireccional desde los archivos importadores del software.
 */

/*
 * promedios_p
 * Objeto contenedor para el almacenamiento de promedios móviles parciales (ej: Ao5, Ao12, Ao50, Ao100).
 * Actúa como una caché en memoria para mitigar la redundancia de procesamiento y evitar recálculos destructivos.
 */
export let promedios_p = {};

/*
 * mediaSingle_p
 * Centraliza las marcas métricas absolutas de la sesión actual:
 * - El mejor registro unitario (Best Single).
 * - La media aritmética global del total de resoluciones (Global Mean).
 * Facilita el acceso directo para el pintado interactivo en los paneles principales de la UI.
 */
export let mediaSingle_p = {};

/*
 * selects
 * Diccionario de referencias para almacenar y transferir punteros del DOM
 * (tales como filtros activos, configuraciones de ordenamiento o variables de entorno del usuario).
 * Asegura la comunicación sin acoplamiento rígido entre la interfaz de usuario y las consultas de la base de datos.
 */
export let selects = {};
