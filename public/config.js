/* ============================================================================
   RoyalShess — HOJA DE CONFIGURACIÓN
   ----------------------------------------------------------------------------
   >>> ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS TOCAR PARA AJUSTAR EL JUEGO. <<<
   Cambia los números, guarda, y reinicia el servidor (Ctrl+C y `npm.cmd start`).
   Todo (servidor y navegador) lee de aquí, así que no hay valores repetidos.
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSConfig = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const CONFIG = {

    // ---------------- ENERGÍA ----------------
    energy: {
      start: 2,                 // energía con la que empiezas
      max: 10,                   // tope máximo (no puede subir de aquí)
      regenSecondsPerPoint: 3,   // segundos para ganar 1 de energía (3 = 1 cada 3 s)
      checkSurcharge: 1,         // energía EXTRA que cuesta mover si estás en jaque
      captureRefund: 0.5,        // al comer recuperas esta fracción del valor comido
                                 //   0.5 = la mitad · 1 = el valor completo · 0 = nada
    },

    // ---------------- PARTIDA ----------------
    match: {
      minutes: 3,                // duración de la partida en minutos
      countdownSeconds: 3,       // cuenta atrás antes de empezar (arranque justo)
    },

    // ---------------- COSTE DE MOVER cada pieza ----------------
    //   (en jaque se suma el checkSurcharge de arriba)
    moveCost: { p: 2, n: 3, b: 4, r: 5, q: 6, k: 2 },

    // ---------------- VALOR de material de cada pieza ----------------
    //   Sirve para: cuánto recuperas al comerla, y quién gana por tiempo.
    //   El rey vale 0 aquí porque capturarlo termina la partida directamente.
    value:    { p: 2, n: 4, b: 4, r: 4, q: 6, k: 0 },

    // ---------------- CPU (modo práctica) ----------------
    ai: {
      tickMs: 650,               // cada cuántos ms decide un movimiento (menor = más rápida)
    },

    // ---------------- SERVIDOR ----------------
    server: {
      port: 3000,                // puerto (se puede sobrescribir con la variable PORT)
      tickHz: 15,                // veces por segundo que el servidor reparte el estado
    },
  };

  return CONFIG;
});
