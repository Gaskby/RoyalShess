/* RoyalShess - build del cliente
   Copia public/ a dist/ y ofusca solo los .js del cliente.
   Los comentarios y la estructura legible se pierden en dist/, que es lo que
   se sirve al navegador en produccion. La fuente en public/ queda intacta para
   editar y para que el servidor la siga leyendo (require de config.js/engine.js).

   Uso:  node build.js        (o  npm run build)
   Luego: npm start           sirve dist/ automaticamente si existe. */
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC = path.join(__dirname, 'public');
const OUT = path.join(__dirname, 'dist');

// Ofuscacion fuerte pero segura: NO renombramos globales porque el cliente
// depende de nombres compartidos entre archivos (RSConfig, RSEngine, i18n...).
const OBFUSCATE_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.9,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  renameGlobals: false,   // CRITICO: mantiene RSConfig/RSEngine/etc. accesibles entre archivos
  sourceMap: false,       // sin source map: no regalamos el codigo original
};

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function walk(dir, base = dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs);
    if (entry.isDirectory()) {
      walk(abs, base);
    } else {
      const outPath = path.join(OUT, rel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      if (entry.name.endsWith('.js')) {
        const code = fs.readFileSync(abs, 'utf8');
        const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATE_OPTIONS).getObfuscatedCode();
        fs.writeFileSync(outPath, result);
        console.log('  ofuscado  ' + rel);
      } else {
        fs.copyFileSync(abs, outPath);
        console.log('  copiado   ' + rel);
      }
    }
  }
}

console.log('\nRoyalShess build -> dist/');
rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });
walk(SRC);
console.log('\nListo. El servidor servira dist/ mientras exista.\n');
