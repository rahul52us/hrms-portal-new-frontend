import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const disabledRoutes = [
  {
    from: resolve(rootDir, 'app/courses/[...path]/route.ts'),
    to: resolve(rootDir, 'app/courses/[...path]/route.ts.mobile-disabled'),
  },
  {
    from: resolve(rootDir, 'app/(main)/course/[id]/page.tsx'),
    to: resolve(rootDir, 'app/(main)/course/[id]/page.tsx.mobile-disabled'),
  },
];

function bin(command) {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}

function readDotEnvValue(name) {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) {
    return undefined;
  }

  const pattern = new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`);
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => pattern.test(entry) && !entry.trim().startsWith('#'));

  if (!line) {
    return undefined;
  }

  const value = line.replace(pattern, '$1').trim();
  return value.replace(/^['"]|['"]$/g, '');
}

function getMobileBackendUrl() {
  const explicitBackend =
    process.env.NEXT_PUBLIC_MOBILE_BACKEND_URL ||
    process.env.MOBILE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (explicitBackend) {
    return explicitBackend;
  }

  const envMobileBackend = readDotEnvValue('NEXT_PUBLIC_MOBILE_BACKEND_URL');
  if (envMobileBackend) {
    return envMobileBackend;
  }

  const envBackend = readDotEnvValue('NEXT_PUBLIC_BACKEND_URL');
  if (!envBackend) {
    return undefined;
  }

  try {
    const url = new URL(envBackend);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = '10.0.2.2';
      return url.toString();
    }
  } catch {
    return envBackend;
  }

  return undefined;
}

const mobileBackendUrl = getMobileBackendUrl();

if (process.platform === 'win32') {
  process.env.JAVA_HOME = 'd:\\personal\\dental\\jdk21\\jdk-21.0.6+7';
  process.env.PATH = `d:\\personal\\dental\\jdk21\\jdk-21.0.6+7\\bin;${process.env.PATH}`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      NEXT_OUTPUT_EXPORT: 'true',
      NEXT_PUBLIC_MOBILE_BUNDLE: 'true',
      ...(mobileBackendUrl ? { NEXT_PUBLIC_BACKEND_URL: mobileBackendUrl } : {}),
      CAPACITOR_DEV_SERVER: '',
      CAPACITOR_SERVER_URL: '',
      ...options.env,
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    if (result.error) {
      throw result.error;
    }

    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function disableServerOnlyRoutes() {
  for (const route of disabledRoutes) {
    if (existsSync(route.from)) {
      renameSync(route.from, route.to);
    }
  }
}

function restoreServerOnlyRoutes() {
  for (const route of disabledRoutes) {
    if (existsSync(route.to)) {
      renameSync(route.to, route.from);
    }
  }
}

try {
  disableServerOnlyRoutes();
  try {
    rmSync(resolve(rootDir, '.next'), { recursive: true, force: true });
  } catch (e) {
    // Ignore locked files (like when dev server is running)
  }
  run(bin('npx'), ['next', 'build']);
} finally {
  restoreServerOnlyRoutes();
}

run(bin('npx'), ['cap', 'sync', 'android']);
run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug'], {
  cwd: resolve(rootDir, 'android'),
});
