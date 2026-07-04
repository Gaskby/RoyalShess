/* ============================================================================
   RoyalShess — MOTOR DE REGLAS (compartido servidor + cliente)
   Lógica pura de ajedrez. Los valores (coste/valor de piezas) vienen de
   config.js, así que aquí no hay números que tocar.
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.RSEngine = factory(root.RSConfig);
})(typeof self !== 'undefined' ? self : this, function (CONFIG) {

  const VALUE = CONFIG.value;
  const MOVE_COST = CONFIG.moveCost;

  const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  function newBoard(seed) {
    let id = (seed && seed.start) || 1;
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      b[0][c] = { type: back[c], color: 'b', id: id++ };
      b[1][c] = { type: 'p',     color: 'b', id: id++ };
      b[6][c] = { type: 'p',     color: 'w', id: id++ };
      b[7][c] = { type: back[c], color: 'w', id: id++ };
    }
    return { board: b, nextId: id };
  }

  function genMoves(bd, r, c) {
    const p = bd[r][c];
    if (!p) return [];
    const out = [];
    const add = (rr, cc) => {
      if (!inside(rr, cc)) return false;
      const t = bd[rr][cc];
      if (!t) { out.push({ r: rr, c: cc, cap: false }); return true; }
      if (t.color !== p.color) out.push({ r: rr, c: cc, cap: true });
      return false;
    };
    const slide = (dirs) => dirs.forEach(([dr, dc]) => {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc)) {
        const t = bd[rr][cc];
        if (!t) out.push({ r: rr, c: cc, cap: false });
        else { if (t.color !== p.color) out.push({ r: rr, c: cc, cap: true }); break; }
        rr += dr; cc += dc;
      }
    });

    if (p.type === 'p') {
      const dir = p.color === 'w' ? -1 : 1;
      const start = p.color === 'w' ? 6 : 1;
      if (inside(r + dir, c) && !bd[r + dir][c]) {
        out.push({ r: r + dir, c: c, cap: false });
        if (r === start && !bd[r + 2 * dir][c]) out.push({ r: r + 2 * dir, c: c, cap: false });
      }
      for (const dc of [-1, 1]) {
        const rr = r + dir, cc = c + dc;
        if (inside(rr, cc)) { const t = bd[rr][cc]; if (t && t.color !== p.color) out.push({ r: rr, c: cc, cap: true }); }
      }
    } else if (p.type === 'n') {
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
    } else if (p.type === 'b') {
      slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
    } else if (p.type === 'r') {
      slide([[-1,0],[1,0],[0,-1],[0,1]]);
    } else if (p.type === 'q') {
      slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
    } else if (p.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, c + dc);
      // Enroque: rey sin mover en su casilla inicial (columna 4).
      // Aquí solo comprobamos casillas vacías y torre sin mover; el servidor
      // valida además que no se enroque en/por jaque (ver _castleAllowed).
      if (!p.moved && c === 4) {
        const rk = bd[r][7];   // corto (flanco de rey)
        if (!bd[r][5] && !bd[r][6] && rk && rk.type === 'r' && rk.color === p.color && !rk.moved) {
          out.push({ r: r, c: 6, cap: false, castle: 'k' });
        }
        const rq = bd[r][0];   // largo (flanco de dama)
        if (!bd[r][1] && !bd[r][2] && !bd[r][3] && rq && rq.type === 'r' && rq.color === p.color && !rq.moved) {
          out.push({ r: r, c: 2, cap: false, castle: 'q' });
        }
      }
    }
    return out;
  }

  function findKing(bd, color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = bd[r][c];
      if (p && p.type === 'k' && p.color === color) return { r, c };
    }
    return null;
  }

  function inCheck(bd, color) {
    const k = findKing(bd, color);
    if (!k) return false;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = bd[r][c];
      if (p && p.color !== color) {
        const mv = genMoves(bd, r, c);
        for (const m of mv) if (m.r === k.r && m.c === k.c) return true;
      }
    }
    return false;
  }

  function material(bd, color) {
    let s = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = bd[r][c];
      if (p && p.color === color) s += VALUE[p.type];
    }
    return s;
  }

  return { VALUE, MOVE_COST, inside, newBoard, genMoves, findKing, inCheck, material };
});
