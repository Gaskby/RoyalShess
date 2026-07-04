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
      lateBoost: 2,              // multiplicador de regeneración en el tramo final
      lateSeconds: 60,           // ... cuando queden estos segundos de partida
    },

    // ---------------- REGLAS ESPECIALES ----------------
    rules: {
      kingGraceMs: 2000,         // tras caer en jaque, el rey no se puede capturar
                                 //   hasta pasado este tiempo (margen para reaccionar)
      queenMinCost: 3,           // la dama se abarata 1 por captura, sin bajar de esto
      rookLineToll: 1,           // energía EXTRA por cruzar un carril ACTIVO de una
                                 //   torre rival (por cada casilla del trayecto que cruce)
      rookLineLen: 4,            // un carril se ACTIVA (se dibuja y cobra) solo en la
                                 //   dirección donde la torre supere estas casillas libres
    },

    // ---------------- PARTIDA ----------------
    match: {
      minutes: 3,                // duración de la partida en minutos
      countdownSeconds: 3,       // cuenta atrás antes de empezar (arranque justo)
    },

    // ---------------- COSTE DE MOVER cada pieza ----------------
    //   (en jaque se suma el checkSurcharge de arriba)
    moveCost: { p: 1, n: 3, b: 3, r: 4, q: 4, k: 2 },

    // ---------------- VALOR de material de cada pieza ----------------
    //   Sirve para: cuánto recuperas al comerla, y quién gana por tiempo.
    //   El rey vale 0 aquí porque capturarlo termina la partida directamente.
    value:    { p: 1, n: 2, b: 2, r: 2, q: 2, k: 0 },

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
