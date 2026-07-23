/*
El navegador ejecuta el script del menu-cache antes de cargar el body.
Si el menú está guardado en la vista anterior, el menu cache lo pre-inserta.
Para cuando el DOM llegue a la inyección del menú, el contenido se agregue sin ningún flash.

En la primera vista no hay cache, el fetch en menu.js lo guarda.
Luego en todas las demás vistas el menú aparece al instante porque ya se encuentra guardado en cache.
*/

window.__menuCacheHTML = sessionStorage.getItem("iticket_menu") || null;
