/* RoyalShess LOGROS Y CATÁLOGO DE TEMAS. AQUÍ SE EDITAN LOS LOGROS. <<<
   Cada logro es una fila de LIST. `check` recibe el resumen de la partida que
   arma client.js y devuelve true si toca desbloquearlo. Los textos viven en
   i18n.js (`ach.<id>.n` nombre y `ach.<id>.d` descripción) y el dibujo en
   icons.js, igual que el resto de iconos del juego.

   Lo desbloqueado se guarda en localStorage (`rs-ach`), como la escalera y el
   tema: es un mapa {id: fecha}. Nada de esto viaja al servidor. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSAch = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const KEY = 'rs-ach';

  /* LOS 10 LOGROS, del más asequible al más duro (este es el orden en pantalla).
       id      clave de i18n y de guardado
       icon    nombre en icons.js
       reward  tema que desbloquea, si desbloquea alguno
       check   condición sobre el resumen de la partida (ver client.js) */
  const LIST = [
    { id: 'canibal',    icon: 'achCanibal',
      check: (m) => m.caps >= 5 },

    { id: 'cazador',    icon: 'achCazador',
      check: (m) => m.ladderWin },

    { id: 'sacrificio', icon: 'achSacrificio',
      check: (m) => m.won && m.lostQueen },

    { id: 'remontada',  icon: 'achRemontada',
      check: (m) => m.won && m.maxDeficit >= 9 },

    { id: 'ejecucion',  icon: 'achEjecucion',
      check: (m) => m.won && m.reason === 'king' && m.elapsed > 0 && m.elapsed < 60000 },

    // sin energía para mover ni un peón: el coste más barato del juego es 1
    { id: 'ahogo',      icon: 'achAhogo',
      check: (m) => m.won && m.reason === 'king' && m.foeEnergy < 1 },

    { id: 'reydesnudo', icon: 'achReyDesnudo',
      check: (m) => m.foeStripped },

    // gana por abandono no cuenta: ahi no te ha dado tiempo a perder nada
    { id: 'intocable',  icon: 'achIntocable', reward: 'artico',
      check: (m) => m.won && m.reason !== 'abandon' && !m.lostPiece },

    { id: 'pesadilla',  icon: 'achPesadilla', reward: 'oro',
      check: (m) => m.towerDone && m.loop > 0 },

    { id: 'impecable',  icon: 'achImpecable',
      check: (m) => m.towerDone && m.ladderClean },
  ];

  /* CATÁLOGO DE TEMAS. Los colores viven en style.css (`body.theme-<id>` para
     el juego y `.sw.t-<id>` para el botón del selector); aquí solo está el
     orden en que salen y qué logro hace falta para poder usarlos. */
  const THEMES = [
    { id: 'neon' },
    { id: 'chesscom' },
    { id: 'madera' },
    { id: 'synthwave' },
    { id: 'crt',    needs: 'pesadilla' },
    { id: 'artico', needs: 'intocable' },
    { id: 'oro',    needs: 'pesadilla' },
  ];

  let got = {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') got = raw;
  } catch (_e) { got = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(got)); } catch (_e) {}
  }

  const byId = (id) => LIST.find((a) => a.id === id) || null;
  const has  = (id) => Object.prototype.hasOwnProperty.call(got, id);

  // devuelve true solo la PRIMERA vez: el cliente usa eso para avisar
  function unlock(id) {
    if (!byId(id) || has(id)) return false;
    got[id] = Date.now();
    save();
    return true;
  }

  // repasa los 10 con el resumen de la partida y devuelve los recién ganados
  function evaluate(m) {
    const fresh = [];
    for (const a of LIST) {
      if (has(a.id)) continue;
      let ok = false;
      try { ok = !!a.check(m); } catch (_e) { ok = false; }
      if (ok && unlock(a.id)) fresh.push(a.id);
    }
    return fresh;
  }

  // el tema <id> se puede usar? Los que no piden logro están siempre abiertos
  function themeOpen(id) {
    const t = THEMES.find((x) => x.id === id);
    if (!t) return false;
    return !t.needs || has(t.needs);
  }
  const themeNeeds = (id) => {
    const t = THEMES.find((x) => x.id === id);
    return (t && t.needs) || null;
  };
  // logro -> tema que regala (para pintar la chapa de recompensa)
  const rewardOf = (id) => { const a = byId(id); return (a && a.reward) || null; };

  const done  = () => LIST.filter((a) => has(a.id)).length;
  const total = () => LIST.length;

  /* Quien ya jugó no empieza de cero: el campeón de la pesadilla y el primer
     rival de la escalera se deducen de lo que ya había guardado el juego. */
  function migrate(old) {
    if (old && old.nightmare) unlock('pesadilla');
    if (old && old.ladderProg > 0) unlock('cazador');
  }

  return { LIST, THEMES, has, unlock, evaluate, migrate,
           themeOpen, themeNeeds, rewardOf, done, total };
});
