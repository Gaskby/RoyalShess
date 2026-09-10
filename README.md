# RoyalShess — 

Ajedrez en **tiempo real** con energía. 
guarda el tablero, la energía y el reloj, valida cada movimiento y
reparte el estado a los clientes. El navegador solo dibuja y pide mover.

## Hoja de configuracion

**Todo lo ajustable está en un solo archivo: `public/config.js`.**
Abre ese archivo, cambia los numeros, guarda y reinicia el servidor
(`Ctrl+C` y de nuevo `npm.cmd start`). Ahí controlas:

- Energía inicial, tope y velocidad de regeneración.
- Recargo de energía al estar en jaque.
- **Cuánto recuperas al comer** (`captureRefund`: 0.5 = la mitad).
- Duración de la partida y segundos de cuenta atrás.
- Coste de mover y valor de cada pieza.
- Velocidad de la CPU, puerto y frecuencia del servidor.

## Reglas
- Empiezas con **10** de energía y regeneras **1 cada 3 s** (continuo, con fracciones).
- Coste de mover: peón 1, caballo 3, alfil 3, torre 5, dama 9, rey 4.
- **Comer** te devuelve la mitad del valor de la pieza comida.
- En **jaque**, mover cualquier pieza cuesta **+1**.
- Sin energía, no puedes mover.
- Ganas capturando el rey; si acaban los **5 minutos**, gana quien tenga más material.

> Omitido por ahora: enroque y captura al paso; el peón corona a dama automáticamente.

## Cómo se enseña a jugar

`Menú → Cómo jugar` abre un **tutorial jugable** (`public/tutorial.js`), no una
lista de reglas: seis lecciones cortas donde mueve el jugador y **no se avanza
hasta que hace lo que se le pide**.

1. **Mover** — que no hay turnos.
2. **Energía** — gastar, quedarse a cero y esperar a que la barra suba.
3. **Comer** — el reembolso, y que los peones no dan nada.
4. **Jaque** — una torre le da jaque de verdad y hay que salir antes de que se
   acabe el margen; si no reacciona, le comen el rey y repite.
5. **Ganar** — el rey rival solo cae tras aguantar en jaque; hay que esperar al
   aviso dorado y capturarlo.
6. **Duelo de prueba** — posición pequeña contra la máquina, con las dos
   energías corriendo a la vez.

Es una isla como el reproductor de repeticiones: tablero propio y bucle propio,
sin servidor. Las cuentas salen del **mismo** `engine.js` y `config.js` que usa
el servidor, así que al cambiar un coste en la hoja de configuración el tutorial
enseña el número nuevo sin tocarlo. El progreso se guarda en `localStorage`
(`rs-learn`) y los textos están en `i18n.js` bajo `learn.`.

Las reglas finas (racha del peón, descuento del caballo, dama que se abarata,
carriles de torre, recaptura gratis, enroque) siguen en **Reglas y trucos**, a
un botón del tutorial: la lista de siempre, donde cada regla se toca y se ve
animada en un mini-tablero.

## Cómo ejecutarlo (local)

Necesitas **Node.js 18+**.

```bash
cd royalshess
npm install        # (o npm.cmd install en Windows PowerShell)
npm start          # (o npm.cmd start)
```

Abre **http://localhost:3000** y elige:
- **Buscar partida:** te empareja con otra persona al azar en tiempo real.
- **Jugar con un amigo:** sala privada con **código/contraseña** (ver abajo).
- **Jugar vs CPU:** practica contra la máquina.

### Salas privadas (jugar con un amigo)
Uno pulsa **Jugar con un amigo → Crear sala**, elige un código (o deja el campo
vacío y se genera uno de 4 caracteres) y lo comparte. El otro entra en
**Jugar con un amigo → Unirse a sala**, escribe el mismo código y la partida
empieza. Así juegan exactamente ustedes dos, sin emparejamiento aleatorio.

### Probar el multijugador en tu PC
Abre **dos pestañas** (o dos navegadores) en `http://localhost:3000` y pulsa
**Buscar partida** en ambas: se emparejarán entre sí. Para que jueguen dos
dispositivos distintos en tu red local, usa la IP de tu equipo
(p. ej. `http://192.168.1.50:3000`).

## Instalar como app (PWA)

RoyalShess se puede instalar en el movil y abrirse a pantalla completa, sin
barra del navegador. No hace falta tienda ni cuenta de desarrollador.

- **iPhone/iPad:** abrelo en **Safari** (Chrome en iOS no puede instalar),
  boton **Compartir** -> **Anadir a pantalla de inicio**.
- **Android:** Chrome ofrece **Instalar aplicacion** solo.
- **Escritorio:** icono de instalar en la barra de direcciones.

Requisito: servirlo por **https** (o `localhost`). Por http plano el navegador
no registra el service worker y no aparece la opcion de instalar.

Que aporta:

- Arranque instantaneo: el shell (html, css, js, iconos) sale de cache.
- Sin conexion la app carga y avisa con **Offline** en vez de dar error del
  navegador. **Jugar sigue necesitando servidor**: el tablero, la energia y la
  CPU viven en `server/lobby.js`, el cliente solo dibuja.
- Respeta el notch y la barra de gestos del iPhone (safe areas en `style.css`).
- El audio se desbloquea al primer toque y se reanuda al volver de segundo
  plano, y el WebSocket reconecta solo al volver a la app.

### Al desplegar cambios del cliente

Sube `VERSION` en `public/sw.js`. Los archivos no llevan hash en el nombre,
asi que ese numero es lo unico que invalida la cache vieja de los navegadores.

### Iconos

Estan en `public/icons/` (192, 512, maskable y el de iOS de 180). Si cambia la
marca hay que regenerarlos; `favicon.svg` es el original de la pieza.

## Estructura

```
royalshess/
├─ package.json
├─ server/
│  ├─ index.js      Express + WebSocket (traduce sockets <-> lobby)
│  ├─ lobby.js      Emparejamiento: cola, salas, colores, abandono
│  └─ game.js       Estado autoritativo: energía, reloj, fases, IA, victoria
└─ public/
   ├─ config.js     HOJA DE CONFIGURACIÓN (edita aquí)
   ├─ emotes.js     Las 6 caras de los emotes, dibujadas en SVG (editable)
   ├─ engine.js     Motor de reglas puro (compartido servidor + cliente)
   ├─ index.html    Interfaz
   ├─ tutorial.js   Tutorial jugable (Cómo jugar)
   ├─ style.css     Estética tipo TETR.IO
   └─ client.js     Cliente WebSocket
```

## Fases del juego (en el servidor)
`lobby` → `countdown` (cuenta atrás justa) → `live` (5 min) → `over`.
Si un jugador se desconecta a media partida, el rival gana por abandono.

## Protocolo WebSocket
Cliente → servidor: `queue` (rival al azar), `cpu` (vs máquina),
`create {code}` / `join {code}` (salas privadas), `cancel`, `leave`,
`move {from:[r,c], to:[r,c]}`, `emote {i}` (emote rápido, solo PvP),
`rematch`.
Servidor → cliente: `welcome`/`lobby`, `queued`, `created {code}`,
`state {...}`, `reject {reason}`, `emote {i, from}`,
`replay-data {moves, names, winner, reason, matchMs, you}` (una vez al terminar).

## Repeticiones y emotes
- **Repeticiones:** al terminar cada partida el servidor manda la cinta
  (coordenadas + tiempos). El cliente guarda las últimas 10 en `localStorage`
  y las reproduce desde **Menú → Repeticiones** o con **Ver repetición** en el
  resultado (velocidad ×1/×2/×4, paso a paso y barra para saltar).
- **Emotes:** 6 caras del juego bajo el tablero, en partidas online contra
  personas. Sin chat libre: nada que moderar. El servidor limita la
  frecuencia (1 cada 1.2 s) y solo recibe el índice, nunca texto.
  El emote **sale del rey** de quien lo manda, en una burbuja sobre su
  casilla que lo sigue si se mueve (si el rey está en la fila de arriba, la
  burbuja se voltea y va debajo). Cada uno tiene su **sonido** corto y
  bajito: el tope es 0.042 de ganancia, por debajo de los efectos del juego.
  Las caras se dibujan en SVG en **`public/emotes.js`** (editable): comparten
  la misma cabeza y cambian cejas, ojos, boca y añadidos (lágrimas, llama,
  manos). Se repintan solas con el tema, incluido el CRT monocromo.
  Están **animadas** (los movimientos viven en `style.css`, busca «animación
  de los emotes»): se mueven al recibir un emote y al pasar el ratón por un
  botón, y están quietas el resto del tiempo para no distraer. Por eso toda
  animación empieza y acaba en la posición neutra: ese fotograma 0 es la
  cara parada del botón.
