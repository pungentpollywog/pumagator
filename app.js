import { loadAndChunkFilesAST } from './ast-chunker.js'; 
import { indexCodebase } from './store.js';
import { reviewCode } from './review.js';
import fs from 'node:fs';

async function main() {
  const mode = process.argv[2]; // 'index' or 'review'

  if (mode === 'index') {
    // Usage: node index.js index ./src
    const targetDir = process.argv[3] || './src';
    const chunks = await loadAndChunkFilesAST(targetDir);
    await indexCodebase(chunks);
  } else if (mode === 'review') {
    // Usage: node index.js review ./src/auth/login.ts
    const targetFile = process.argv[3];
    if (!targetFile) {
      console.error('Please provide a file to review.');
      return;
    }
    const code = fs.readFileSync(targetFile, 'utf-8');
    await reviewCode(code, targetFile);
  } else {
    console.log('Usage:');
    console.log('  Index project:  node index.js index <directory>');
    console.log('  Review file:    node index.js review <filepath>');
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
}
