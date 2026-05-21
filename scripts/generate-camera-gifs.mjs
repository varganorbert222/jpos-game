/** Minimal valid GIF89a placeholders — swap files in public/assets/cameras/ later */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'assets', 'cameras');

const files = [
  'cam-herb-n-0.gif',
  'cam-herb-n-1.gif',
  'cam-herb-s-0.gif',
  'cam-herb-s-1.gif',
  'cam-pred-e-0.gif',
  'cam-pred-e-1.gif',
  'cam-pred-w-0.gif',
  'cam-research.gif',
  'cam-visitor.gif',
];

// 160x120 2-color placeholder (green #5fde5f on black), single frame
const minimalGif = Buffer.from(
  'R0lGODlhqAB4AYAAAAAAAP///wAAACH5BAEAAAAALAAAAACoAHgAAAICAhwAOwAAADs=',
  'base64',
);

mkdirSync(outDir, { recursive: true });
for (const name of files) {
  writeFileSync(join(outDir, name), minimalGif);
  console.log('wrote', name);
}
