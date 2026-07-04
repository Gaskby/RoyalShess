# RoyalShess — 

Ajedrez en **tiempo real** con energía. El servidor Node.js es la única fuente
de verdad: guarda el tablero, la energía y el reloj, valida cada movimiento y
reparte el estado a los clientes. El navegador solo dibuja y pide mover.

## ⚙️ Hoja de configuración (lo importante)

**Todo lo ajustable está en un solo archivo: `public/config.js`.**
Abre ese archivo, cambia los números, guarda y reinicia el servidor
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

## Estructura

```
royalshess/
├─ package.json
├─ server/
│  ├─ index.js      Express + WebSocket (traduce sockets <-> lobby)
│  ├─ lobby.js      Emparejamiento: cola, salas, colores, abandono
│  └─ game.js       Estado autoritativo: energía, reloj, fases, IA, victoria
└─ public/
   ├─ config.js     ⚙️ HOJA DE CONFIGURACIÓN (edita aquí)
   ├─ engine.js     Motor de reglas puro (compartido servidor + cliente)
   ├─ index.html    Interfaz
   ├─ style.css     Estética tipo TETR.IO
   └─ client.js     Cliente WebSocket
```

## Fases del juego (en el servidor)
`lobby` → `countdown` (cuenta atrás justa) → `live` (5 min) → `over`.
Si un jugador se desconecta a media partida, el rival gana por abandono.

## Protocolo WebSocket
Cliente → servidor: `queue` (rival al azar), `cpu` (vs máquina),
`create {code}` / `join {code}` (salas privadas), `cancel`, `leave`,
`move {from:[r,c], to:[r,c]}`.
Servidor → cliente: `welcome`/`lobby`, `queued`, `created {code}`,
`state {...}`, `reject {reason}`.

## Siguiente fase
- **Fase 4:** despliegue en un VPS de Hostinger con dominio y HTTPS (wss),
  proceso persistente (PM2) y proxy inverso (Nginx).
