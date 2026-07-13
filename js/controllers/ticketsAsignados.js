document.addEventListener("DOMContentLoaded", function () {
  
  document.addEventListener("click", function (e) {

    const tarjetaTicket = e.target.closest(".lista-tickets-asignados");

    if (!tarjetaTicket)
       return;
      
    if (e.target.closest(".badge")) {
      return; 
    }

    window.location.href = "vistaTicket.html";
  });

});