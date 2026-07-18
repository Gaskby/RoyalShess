/* RoyalShess MÚSICA LO-FI PROCEDURAL Web Audio, sin archivos. Un beat lo-fi generado en vivo: acordes con séptima filtrados, bajo,. melodía pentatónica con eco, batería con swing y crujido de vinilo.. - setIntensity0..1: al agotarse el reloj sube el tempo, se abre el. filtro y la batería se vuelve más densa.. - Variaciones: cada partida elige tonalidad, progresión, tempo y swing. al azar, y la progresión puede mutar cada 8 compases.
   Estilo 'ambient' (setStyle): modo alternativo tipo Duet/Tim Shiel — pads
   de sierras desafinadas con reverb por convolución, arpegios con eco largo,
   sub-bajo y sin batería. Mismo motor, mismas semillas, otro mundo sonoro. */
window.RSMusic = (function () {
  let ctx = null;
  let out = null, master = null, comp = null, lpf = null;
  let padBus = null, drumBus = null, delayIn = null;
  let noiseBuf = null;
  let running = false, timer = null;
  let step = 0, bar = 0, nextT = 0;
  let intensity = 0, target = 0;
  let danger = false;   // en jaque: la música se tensa
  // semilla de la canción: null = pista al azar por partida; un número = SIEMPRE
  // la misma pista. La escalera pone aquí la songSeed del rival de rivals.js
  let songSeed = null;
  let rand = Math.random;   // generador musical actual: azar o semilla
  let style = 'lofi';       // 'lofi' (beat clásico) o 'ambient' (tipo Duet)
  // nodos del modo ambient; se construyen junto al resto en build()
  let ambBus = null, ambLpf = null, ambSubG = null, pluckBus = null;
  let ambDelay = null, revSend = null, vinylGain = null;

  // generador determinista: la misma semilla produce la misma secuencia
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // parámetros de la pista actual se rebarajan por partida
  let key = 57, baseBpm = 76, swing = 0.12;
  let prog = [0, 5, 3, 4];
  const SCALES = [
    [0, 2, 3, 5, 7, 8, 10],   // menor natural: el lo-fi clásico
    [0, 2, 3, 5, 7, 9, 10],   // dórico: menor con luz
    [0, 1, 3, 5, 7, 8, 10],   // frigio: oscuro y tenso
    [0, 2, 3, 5, 7, 8, 11],   // menor armónica: dramática
  ];
  let scaleNow = SCALES[0];
  const PENTA = [0, 3, 5, 7, 10, 12, 15];   // pentatónica menor
  const PROGS = [
    [0, 5, 3, 4], [0, 2, 5, 4], [0, 5, 1, 4],
    [0, 3, 5, 4], [0, 4, 5, 3], [0, 2, 3, 4],
  ];
  // identidad extra de la pista: timbre del lead, patrón de bajo, voicing,
  // densidad de melodía y tiempo del eco. Todo sale de la misma semilla
  let leadType = 'triangle', bassMode = 0, chordExt = [0, 2, 4, 6];
  let melodyBias = 0.08, delayT = 0.29;

  // modo ambient: escalas luminosas que nunca resuelven y acordes sus/add9
  const AMB_SCALES = [
    [0, 2, 4, 6, 7, 9, 11],   // lidio: flotante, la marca de la casa
    [0, 2, 4, 5, 7, 9, 11],   // mayor: cálido y sencillo
  ];
  const AMB_PROGS = [
    [0, 5, 3, 4], [0, 3, 4, 0], [0, 2, 5, 3], [0, 4, 5, 2],
  ];
  const AMB_CHORDS = [[0, 2, 4, 8], [0, 1, 4, 8], [0, 2, 4, 6, 8], [0, 3, 4, 8]];
  let arpMode = 0, arpDensity = 0.5, shimmerProb = 0.2, padDet = 7, arpIdx = 0;

  const rnd = (a, b) => a + rand() * (b - a);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const deg = (d, oct = 0) => key + scaleNow[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);

  function newTrack() {
    // con semilla toda la musica sale del generador determinista: la cancion
    // del rival es siempre la misma, nota a nota en sus decisiones.
    // OJO: el ORDEN de estas derivaciones es parte del contrato de las semillas
    // de rivals.js; añadir dimensiones nuevas siempre AL FINAL
    rand = songSeed != null ? mulberry32(songSeed) : Math.random;
    if (style === 'ambient') {
      // rama aparte: no comparte orden de derivaciones con el lo-fi, así el
      // contrato de semillas de rivals.js queda intacto
      key = pick([50, 52, 54, 55, 57]);   // D, E, F#, G, A
      scaleNow = pick(AMB_SCALES);
      prog = pick(AMB_PROGS);
      baseBpm = rnd(56, 70);
      swing = 0;   // recto e hipnótico, nada de swing
      chordExt = pick(AMB_CHORDS);
      leadType = pick(['sine', 'triangle']);
      arpMode = Math.floor(rand() * 3);
      arpDensity = rnd(0.4, 0.65);
      shimmerProb = rnd(0.15, 0.4);
      padDet = rnd(4, 10);
      if (ambDelay) ambDelay.delayTime.value = 60 / baseBpm * 0.75;   // corchea con puntillo
    } else {
      key = pick([53, 55, 57, 58, 60]);   // F, G, A, Bb, C
      prog = pick(PROGS);
      baseBpm = rnd(66, 84);
      swing = rnd(0.06, 0.19);
      // dimensiones extra para que cada cancion tenga voz propia
      scaleNow = pick(SCALES);
      leadType = pick(['triangle', 'sine', 'square']);
      melodyBias = rnd(0.05, 0.15);
      bassMode = Math.floor(rand() * 3);
      chordExt = pick([[0, 2, 4, 6], [0, 2, 4, 6], [0, 2, 4, 8]]);   // séptima o novena
      delayT = rnd(0.22, 0.38);
      if (delayIn) delayIn.delayTime.value = delayT;
    }
    // el crujido de vinilo solo pinta en el mundo lo-fi
    if (vinylGain) vinylGain.gain.setTargetAtTime(style === 'ambient' ? 0 : 0.5, ctx.currentTime, 0.3);
    step = 0; bar = 0; arpIdx = 0;
  }

  function build() {
    master = ctx.createGain(); master.gain.value = 0.2;   // techo fijo
    out = ctx.createGain(); out.gain.value = 0;   // fundido in/out
    comp = ctx.createDynamicsCompressor();
    lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 850; lpf.Q.value = 0.5;

    padBus = ctx.createGain(); padBus.gain.value = 0.85;
    drumBus = ctx.createGain(); drumBus.gain.value = 0.9;

    // eco con retroalimentación filtrada dub suave para la melodía
    delayIn = ctx.createDelay(1); delayIn.delayTime.value = delayT;
    const fb = ctx.createGain(); fb.gain.value = 0.34;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1500;
    delayIn.connect(dlp); dlp.connect(fb); fb.connect(delayIn);

    padBus.connect(lpf);
    drumBus.connect(lpf);
    dlp.connect(lpf);
    lpf.connect(comp);
    comp.connect(out);
    out.connect(master);
    master.connect(ctx.destination);

    // ruido blanco compartido para percusión
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // crujido de vinilo: pops dispersos + siseo tenue, en bucle constante
    const vb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const vd = vb.getChannelData(0);
    for (let i = 0; i < vd.length; i++) {
      vd[i] = (Math.random() < 0.0008 ? rnd(-1, 1) * 0.5 : 0) + (Math.random() * 2 - 1) * 0.012;
    }
    const vs = ctx.createBufferSource(); vs.buffer = vb; vs.loop = true;
    const vhp = ctx.createBiquadFilter(); vhp.type = 'highpass'; vhp.frequency.value = 1400;
    vinylGain = ctx.createGain(); vinylGain.gain.value = style === 'ambient' ? 0 : 0.5;
    vs.connect(vhp); vhp.connect(vinylGain); vinylGain.connect(comp);
    vs.start();

    // —— cadena del modo ambient tipo Duet ——
    // reverb por convolución: ruido con caída exponencial, ~3.5 s de cola
    const irLen = Math.floor(ctx.sampleRate * 3.5);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3);
    }
    const reverb = ctx.createConvolver(); reverb.buffer = ir;

    ambBus = ctx.createGain();
    ambLpf = ctx.createBiquadFilter(); ambLpf.type = 'lowpass'; ambLpf.frequency.value = 1000; ambLpf.Q.value = 0.3;
    const ambDry = ctx.createGain(); ambDry.gain.value = 0.55;
    revSend = ctx.createGain(); revSend.gain.value = 0.8;
    const revOut = ctx.createGain(); revOut.gain.value = 0.9;
    ambBus.connect(ambLpf);
    ambLpf.connect(ambDry); ambDry.connect(comp);
    ambLpf.connect(revSend); revSend.connect(reverb); reverb.connect(revOut); revOut.connect(comp);

    // el filtro respira solo: LFO lentísimo sobre la frecuencia de corte
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain(); lfoG.gain.value = 240;
    lfo.connect(lfoG); lfoG.connect(ambLpf.frequency); lfo.start();

    // eco largo para los arpegios; el retorno entra al bus y de ahí a la reverb
    ambDelay = ctx.createDelay(1.5); ambDelay.delayTime.value = 0.45;
    const aLp = ctx.createBiquadFilter(); aLp.type = 'lowpass'; aLp.frequency.value = 2200;
    const aFb = ctx.createGain(); aFb.gain.value = 0.45;
    ambDelay.connect(aLp); aLp.connect(aFb); aFb.connect(ambDelay);
    aLp.connect(ambBus);
    pluckBus = ctx.createGain();
    pluckBus.connect(ambBus); pluckBus.connect(ambDelay);

    // el sub-bajo va directo al compresor: sin reverb para que no embarre
    ambSubG = ctx.createGain(); ambSubG.gain.value = 0.9;
    ambSubG.connect(comp);
  }

  function env(g, t, atk, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
  }
  function tone(dest, type, freq, t, atk, dec, peak, detune) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; if (detune) o.detune.value = detune;
    env(g, t, atk, peak, dec);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + atk + dec + 0.1);
  }
  function noiseHit(t, dur, fType, fq, peak) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = fType; f.frequency.value = fq;
    const g = ctx.createGain(); env(g, t, 0.001, peak, dur);
    s.connect(f); f.connect(g); g.connect(drumBus);
    s.start(t); s.stop(t + dur + 0.05);
  }
  function kick(t, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(118, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    env(g, t, 0.002, 0.9 * v, 0.17);
    o.connect(g); g.connect(drumBus);
    o.start(t); o.stop(t + 0.3);
    // sidechain barato: el pad respira con el bombo
    padBus.gain.setTargetAtTime(0.5, t, 0.015);
    padBus.gain.setTargetAtTime(0.85, t + 0.09, 0.12);
  }
  function snare(t, v) {
    noiseHit(t, 0.13, 'bandpass', 1800, 0.5 * v);
    tone(drumBus, 'triangle', 190, t, 0.001, 0.08, 0.25 * v);
  }
  const hat = (t, v) => noiseHit(t, 0.03, 'highpass', 6500, 0.18 * v);

  function chord(t) {
    const d = prog[bar % prog.length];
    for (const iv of chordExt) {   // acorde con séptima o novena según la pista
      const f = hz(deg(d + iv));
      tone(padBus, 'triangle', f, t, 0.35, 3.4, 0.055, rnd(-7, 7));
      tone(padBus, 'triangle', f, t, 0.35, 3.4, 0.045, rnd(-7, 7));
    }
    tone(delayIn, 'sine', hz(deg(d) + 12), t, 0.3, 1.8, 0.03);  // brillo al eco
  }
  // up sube el bajo una octava para los patrones que saltan
  const bass = (t, v, up) => tone(padBus, 'sine', hz(deg(prog[bar % prog.length]) - 24 + (up ? 12 : 0)), t, 0.012, 0.5, 0.5 * v);

  let mIdx = 2;   // memoria melódica paseo aleatorio
  // cada pista canta con su propio timbre; el cuadrado suena fuerte, se baja
  const LEAD_VOL = { triangle: 0.14, sine: 0.17, square: 0.07 };
  function melody(t) {
    mIdx = Math.max(0, Math.min(PENTA.length - 1, mIdx + pick([-2, -1, -1, 1, 1, 2])));
    tone(delayIn, leadType, hz(key + 12 + PENTA[mIdx]), t, 0.012, 0.55, LEAD_VOL[leadType]);
  }

  // —— voces del modo ambient ——
  const chordDeg = () => prog[(bar >> 1) % prog.length];   // acorde cada 2 compases
  function ambChord(t) {
    const d = chordDeg();
    for (const iv of chordExt) {   // dos sierras desafinadas por nota: pad ancho
      const f = hz(deg(d + iv));
      tone(ambBus, 'sawtooth', f, t, 1.6, 6.5, 0.030, -padDet + rnd(-2, 2));
      tone(ambBus, 'sawtooth', f, t, 1.6, 6.5, 0.030, padDet + rnd(-2, 2));
    }
    tone(ambBus, 'triangle', hz(deg(d, -1)), t, 1.8, 6.5, 0.06);   // raíz grave cálida
    tone(ambSubG, 'sine', hz(deg(d, -2)), t, 0.5, 5.5, 0.35);      // sub-bajo
  }
  // destello agudo que entra despacio, casi pura reverb
  const shimmer = (t) => tone(revSend, 'sine', hz(deg(chordDeg()) + 24), t, 1.4, 4, 0.05);
  function arpPluck(t, v) {
    const d = chordDeg();
    const seq = chordExt.map((iv) => d + iv).concat(chordExt.map((iv) => d + iv + 7));
    let n;
    if (arpMode === 0) n = seq[arpIdx % seq.length];              // sube
    else if (arpMode === 1) {                                      // sube y baja
      const m = seq.length * 2 - 2, k = arpIdx % m;
      n = seq[k < seq.length ? k : m - k];
    } else n = pick(seq);                                          // libre
    arpIdx++;
    tone(pluckBus, leadType, hz(deg(n) + 12), t, 0.004, rnd(0.35, 0.55), 0.11 * v);
  }
  // latido sordo para la tensión alta: lo más cerca de un bombo que llega Duet
  function heartbeat(t, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(85, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    env(g, t, 0.003, 0.5 * v, 0.22);
    o.connect(g); g.connect(ambSubG);
    o.start(t); o.stop(t + 0.35);
  }

  function scheduleStepAmb(s, t) {
    const i = Math.min(1, intensity + (danger ? 0.3 : 0));
    if (bar % 2 === 0 && s === 0) {
      ambChord(t);
      if (rand() < shimmerProb) shimmer(t + rnd(1, 3));
    }
    // arpegio en corcheas; con la intensidad entran también semicorcheas
    if (s % 2 === 0 && rand() < arpDensity + i * 0.3) arpPluck(t, 1);
    if (s % 2 === 1 && i > 0.6 && rand() < i - 0.5) arpPluck(t, 0.6);
    // en jaque: pulso grave insistente en contratiempo
    if (danger && s % 8 === 4) tone(ambBus, 'sawtooth', hz(deg(0, -1)), t, 0.008, 0.22, 0.08);
    if (i > 0.55 && (s === 0 || s === 8)) heartbeat(t, 0.5 + i * 0.5);
  }

  function scheduleStep(s, t) {
    if (style === 'ambient') return scheduleStepAmb(s, t);
    // en jaque la pista sube un escalón de intensidad y entra un pulso tenso
    const i = Math.min(1, intensity + (danger ? 0.35 : 0));
    if (danger && s % 4 === 2) tone(padBus, 'sawtooth', hz(deg(0) - 12), t, 0.005, 0.13, 0.10);
    // bombo: base en 0 y 8; se densifica con la intensidad
    if (s === 0 || s === 8) kick(t, 1);
    if (s === 10 && i > 0.35 && rand() < 0.7) kick(t, 0.8);
    if (s === 6 && i > 0.65 && rand() < 0.45) kick(t, 0.7);
    // caja en 4 y 12, fantasmas y redoble al final del bloque
    if (s === 4 || s === 12) snare(t, 1);
    if (s === 15 && i > 0.5 && rand() < 0.3) snare(t, 0.3);
    if (bar % 4 === 3 && i > 0.55 && (s === 13 || s === 14 || s === 15) && rand() < 0.6) snare(t, 0.25);
    // hats: de casi nada a semicorcheas según intensidad
    if (i < 0.25) { if (s % 4 === 0) hat(t, 0.55); }
    else if (i < 0.55) { if (s % 2 === 0) hat(t, s % 4 === 0 ? 0.8 : 0.5); }
    else hat(t, s % 2 === 0 ? 0.9 : 0.4);
    // armonía y bajo: cada pista camina distinto
    if (s === 0) chord(t);
    if (bassMode === 0) {          // clásico: negra y contratiempo
      if (s === 0 || s === 10) bass(t, 1);
    } else if (bassMode === 1) {   // sincopado: empuja hacia delante
      if (s === 0) bass(t, 1);
      if (s === 7 || s === 10) bass(t, 0.7);
    } else {                        // saltarín: responde una octava arriba
      if (s === 0) bass(t, 1);
      if (s === 8) bass(t, 0.6, true);
    }
    if (s === 7 && i > 0.6 && rand() < 0.5) bass(t, 0.6);
    // melodía dispersa, cada pista con su densidad propia
    if (s % 2 === 0 && rand() < melodyBias + i * 0.22) melody(t);
  }

  function tick() {
    intensity += (target - intensity) * 0.06;
    const eff = Math.min(1, intensity + (danger ? 0.35 : 0));
    const amb = style === 'ambient';
    // el ambient apenas acelera: la urgencia la ponen densidad y latido
    const bpm = baseBpm + eff * (amb ? 12 : 26);
    const spb = 60 / bpm / 4;   // duración de semicorchea
    if (amb) ambLpf.frequency.setTargetAtTime(950 + eff * 1700, ctx.currentTime, 0.6);
    else lpf.frequency.setTargetAtTime(750 + eff * 2900, ctx.currentTime, 0.4);
    while (nextT < ctx.currentTime + 0.15) {
      scheduleStep(step, nextT + (step % 2 ? spb * swing : 0));
      step = (step + 1) % 16;
      if (step === 0) {
        bar++;
        if (amb) { if (bar % 16 === 0 && rand() < 0.3) prog = pick(AMB_PROGS); }
        else if (bar % 8 === 0 && rand() < 0.4) prog = pick(PROGS);   // variación
      }
      nextT += spb;
    }
  }

  function start(sharedCtx) {
    if (running) return;
    ctx = ctx || sharedCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (!out) build();
    newTrack();
    running = true;
    nextT = ctx.currentTime + 0.1;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.2);   // fundido de entrada
    timer = setInterval(tick, 60);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    running = false;
    if (out && ctx) {
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.7);   // fundido de salida
    }
  }

  return {
    start, stop,
    setIntensity(x) { target = Math.max(0, Math.min(1, x)); },
    setDanger(d) { danger = !!d; },
    isRunning() { return running; },
    // semilla de la próxima pista: llamar ANTES de start. null vuelve al azar
    setSeed(s) { songSeed = s == null ? null : (s >>> 0); },
    // 'lofi' o 'ambient'; si suena, la pista se regenera al vuelo en el estilo nuevo
    setStyle(s) {
      const v = s === 'ambient' ? 'ambient' : 'lofi';
      if (v === style) return;
      style = v;
      if (running) newTrack();
    },
    // parámetros de la pista sonando, útil para depurar canciones de rivales
    trackInfo() {
      return { style, seed: songSeed, key, bpm: baseBpm, swing, prog: prog.slice(),
               scale: (style === 'ambient' ? AMB_SCALES : SCALES).indexOf(scaleNow),
               lead: leadType, bassMode, melodyBias, delay: delayT,
               arpMode, arpDensity, shimmerProb };
    },
  };
})();
