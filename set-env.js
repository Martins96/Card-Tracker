const fs = require('fs');

const targetPath = './src/environments/environment.prod.ts';

// 1. Se il file esiste già (es. nel tuo PC in locale), non facciamo nulla!
if (fs.existsSync(targetPath)) {
  console.log(`[config-env] Il file ${targetPath} esiste già. Utilizzo quello locale.`);
  process.exit(0);
}

// 2. Se non esiste (es. su Netlify in CI/CD), lo creiamo usando le variabili d'ambiente
console.log(`[config-env] File non trovato. Genero ${targetPath} dalle variabili d'ambiente...`);

const envConfigFile = `import { environmentBase } from './environment.base';

export const environment = {
  ...environmentBase,
  
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[config-env] File generato con successo!`);