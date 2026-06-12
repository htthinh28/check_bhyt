#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, 'qa_thuoc_icd_hoat_chat_vbhn15_entry.jsx');
const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const IS_WINDOWS = process.platform === 'win32';

const quoteShellArg = (value) => {
  const text = String(value ?? '');
  if (text.length === 0) return '""';
  if (!/[\s"^&|<>]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
};

const run = (command, args, label) => {
  const spawnArgs = { cwd: ROOT, stdio: 'inherit', env: process.env };
  const result = IS_WINDOWS
    ? spawnSync([command, ...args].map(quoteShellArg).join(' '), { ...spawnArgs, shell: true })
    : spawnSync(command, args, spawnArgs);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
};

const main = () => {
  const bundlePath = path.join(os.tmpdir(), `cdss-thuoc-icd-hoat-chat-${Date.now()}.cjs`);
  try {
    run(
      NPX_BIN,
      [
        '--yes',
        'esbuild',
        ENTRY_FILE,
        '--bundle',
        '--platform=node',
        '--format=cjs',
        '--target=node18',
        `--outfile=${bundlePath}`,
        '--alias:react-native=./scripts/stubs/react-native.js',
        '--alias:@react-native-async-storage/async-storage=./scripts/stubs/async-storage.js',
        '--alias:expo-constants=./scripts/stubs/expo-constants.js',
      ],
      'Build thuoc ICD hoat chat QA bundle',
    );
    run(process.execPath, [bundlePath], 'Run thuoc ICD hoat chat QA bundle');
  } finally {
    if (fs.existsSync(bundlePath)) {
      try {
        fs.unlinkSync(bundlePath);
      } catch {
        // ignore temp cleanup errors
      }
    }
  }
};

try {
  main();
} catch (error) {
  console.error('[qa:thuoc-icd-hoat-chat-vbhn15] FAILED');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
