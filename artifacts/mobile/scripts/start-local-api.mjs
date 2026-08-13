import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const source = process.argv[2] === 'host' ? 'processo Node local' : 'Docker';
const apiPort = process.env.LOCAL_API_PORT?.trim() || '8091';

function isPrivateIpv4(address) {
  if (address.startsWith('10.') || address.startsWith('192.168.')) return true;

  const [first, second] = address.split('.').map(Number);
  return first === 172 && second >= 16 && second <= 31;
}

function findLanAddress() {
  const interfaces = networkInterfaces();
  const preferredNames = ['en0', 'en1'];

  for (const name of preferredNames) {
    const address = interfaces[name]?.find(
      (entry) => entry.family === 'IPv4' && !entry.internal && isPrivateIpv4(entry.address),
    );
    if (address) return address.address;
  }

  for (const entries of Object.values(interfaces)) {
    const address = entries?.find(
      (entry) => entry.family === 'IPv4' && !entry.internal && isPrivateIpv4(entry.address),
    );
    if (address) return address.address;
  }

  return null;
}

const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const explicitHost = process.env.LOCAL_API_HOST?.trim();
const detectedHost = explicitHost || findLanAddress() || 'localhost';
const apiUrl = (explicitApiUrl || `http://${detectedHost}:${apiPort}/api`).replace(/\/+$/, '');

async function assertApiIsAvailable() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${apiUrl}/healthz`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json().catch(() => null);
    if (payload?.status !== 'ok') {
      throw new Error('resposta nao corresponde ao healthcheck da API');
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`\nAPI via ${source} indisponivel em ${apiUrl}/healthz (${reason}).`);
    console.error('Suba a API primeiro e execute este comando novamente.');
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

await assertApiIsAvailable();

console.log(`\nAPI selecionada: ${apiUrl}`);
console.log(`Origem esperada: ${source}`);
console.log('A porta 8091 fica reservada para a API; o Metro pode usar 8081 ou 8082.\n');

if (process.argv.includes('--check')) {
  process.exit(0);
}

const expo = spawn('pnpm', ['exec', 'expo', 'start', '-c'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: apiUrl,
  },
  stdio: 'inherit',
});

expo.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

expo.on('error', (error) => {
  console.error(`Nao foi possivel iniciar o Expo: ${error.message}`);
  process.exit(1);
});
