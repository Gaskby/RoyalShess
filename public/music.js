/* ============================================================================
   RoyalShess — MÚSICA LO-FI PROCEDURAL (Web Audio, sin archivos)
   Un "beat" lo-fi generado en vivo: acordes con séptima filtrados, bajo,
   melodía pentatónica con eco, batería con swing y crujido de vinilo.
   - setIntensity(0..1): al agotarse el reloj sube el tempo, se abre el
     filtro y la batería se vuelve más densa.
   - Variaciones: cada partida elige tonalidad, progresión, tempo y swing
     al azar, y la progresión puede mutar cada 8 compases.
   ============================================================================ */
window.RSMusic = (function () {
  let ctx = null;
  let out = null, master = null, comp = null, lpf = null;
  let padBus = null, drumBus = null, delayIn = null;
  let noiseBuf = null;
  let running = false, timer = null;
  let step = 0, bar = 0, nextT = 0;
  let intensity = 0, target = 0;
  let danger = false;                                      // en jaque: la música se tensa

  // parámetros de la "pista" actual (se rebarajan por partida)
  let key = 57, baseBpm = 76, swing = 0.12;
  let prog = [0, 5, 3, 4];
  const SCALE = [0, 2, 3, 5, 7, 8, 10];                    // menor natural
  const PENTA = [0, 3, 5, 7, 10, 12, 15];                  // pentatónica menor
  const PROGS = [
    [0, 5, 3, 4], [0, 2, 5, 4], [0, 5, 1, 4],
    [0, 3, 5, 4], [0, 4, 5, 3], [0, 2, 3, 4],
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const deg = (d, oct = 0) => key + SCALE[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);

  function newTrack() {
    key = pick([53, 55, 57, 58, 60]);     // F, G, A, Bb, C
    prog = pick(PROGS);
    baseBpm = rnd(70, 80);
    swing = rnd(0.09, 0.17);
    step = 0; bar = 0;
  }

  function build() {
    master = ctx.createGain(); master.gain.value = 0.2;    // techo fijo
    out = ctx.createGain(); out.gain.value = 0;            // fundido in/out
    comp = ctx.createDynamicsCompressor();
    lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 850; lpf.Q.value = 0.5;

    padBus = ctx.createGain(); padBus.gain.value = 0.85;
    drumBus = ctx.createGain(); drumBus.gain.value = 0.9;

    // eco con retroalimentación filtrada (dub suave para la melodía)
    delayIn = ctx.createDelay(1); delayIn.delayTime.value = 0.29;
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
    const vg = ctx.createGain(); vg.gain.value = 0.5;
    vs.connect(vhp); vhp.connect(vg); vg.connect(comp);
    vs.start();
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
    // "sidechain" barato: el pad respira con el bombo
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
    for (const iv of [0, 2, 4, 6]) {                       // acorde con séptima
      const f = hz(deg(d + iv));
      tone(padBus, 'triangle', f, t, 0.35, 3.4, 0.055, rnd(-7, 7));
      tone(padBus, 'triangle', f, t, 0.35, 3.4, 0.045, rnd(-7, 7));
    }
    tone(delayIn, 'sine', hz(deg(d) + 12), t, 0.3, 1.8, 0.03);  // brillo al eco
  }
  const bass = (t, v) => tone(padBus, 'sine', hz(deg(prog[bar % prog.length]) - 24), t, 0.012, 0.5, 0.5 * v);

  let mIdx = 2;                                            // memoria melódica (paseo aleatorio)
  function melody(t) {
    mIdx = Math.max(0, Math.min(PENTA.length - 1, mIdx + pick([-2, -1, -1, 1, 1, 2])));
    tone(delayIn, 'triangle', hz(key + 12 + PENTA[mIdx]), t, 0.012, 0.55, 0.14);
  }

  function scheduleStep(s, t) {
    // en jaque la pista sube un escalón de intensidad y entra un pulso tenso
    const i = Math.min(1, intensity + (danger ? 0.35 : 0));
    if (danger && s % 4 === 2) tone(padBus, 'sawtooth', hz(deg(0) - 12), t, 0.005, 0.13, 0.10);
    // bombo: base en 0 y 8; se densifica con la intensidad
    if (s === 0 || s === 8) kick(t, 1);
    if (s === 10 && i > 0.35 && Math.random() < 0.7) kick(t, 0.8);
    if (s === 6 && i > 0.65 && Math.random() < 0.45) kick(t, 0.7);
    // caja en 4 y 12, fantasmas y redoble al final del bloque
    if (s === 4 || s === 12) snare(t, 1);
    if (s === 15 && i > 0.5 && Math.random() < 0.3) snare(t, 0.3);
    if (bar % 4 === 3 && i > 0.55 && (s === 13 || s === 14 || s === 15) && Math.random() < 0.6) snare(t, 0.25);
    // hats: de casi nada a semicorcheas según intensidad
    if (i < 0.25) { if (s % 4 === 0) hat(t, 0.55); }
    else if (i < 0.55) { if (s % 2 === 0) hat(t, s % 4 === 0 ? 0.8 : 0.5); }
    else hat(t, s % 2 === 0 ? 0.9 : 0.4);
    // armonía y bajo
    if (s === 0) chord(t);
    if (s === 0 || s === 10) bass(t, 1);
    if (s === 7 && i > 0.6 && Math.random() < 0.5) bass(t, 0.6);
    // melodía dispersa (más presente al final)
    if (s % 2 === 0 && Math.random() < 0.08 + i * 0.22) melody(t);
  }

  function tick() {
    intensity += (target - intensity) * 0.06;
    const eff = Math.min(1, intensity + (danger ? 0.35 : 0));
    const bpm = baseBpm + eff * 26;
    const spb = 60 / bpm / 4;                              // duración de semicorchea
    lpf.frequency.setTargetAtTime(750 + eff * 2900, ctx.currentTime, 0.4);
    while (nextT < ctx.currentTime + 0.15) {
      scheduleStep(step, nextT + (step % 2 ? spb * swing : 0));
      step = (step + 1) % 16;
      if (step === 0) {
        bar++;
        if (bar % 8 === 0 && Math.random() < 0.4) prog = pick(PROGS);   // variación
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
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.2);     // fundido de entrada
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
  };
})();
