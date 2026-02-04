import { loadAndChunkFilesAST } from './ast-chunker.js';
import { indexCodebase } from './store.js';
import { reviewCode } from './review.js';
import { batchGitReview } from './bulk-reviewer/git-batch-reviewer.js';
import fs from 'node:fs';

async function singleFileReview(targetFile) {
  if (!targetFile) {
    console.error('Please provide a file to review.');
    return;
  }
  const code = fs.readFileSync(targetFile, 'utf-8');
  await reviewCode(code, targetFile);
}

async function main() {
  const mode = process.argv[2]; // 'index' or 'review'

  switch (mode) {
    case 'index':
      await loadAndChunkFilesAST(process.argv[3] || './src').then(indexCodebase);
      break;
    case 'review':
      await singleFileReview(process.argv[3]);
      break;
    case 'batch':
      await batchGitReview(process.argv[3] || null, process.argv[4] || '.');
      break;
    default:
      console.log('Usage:');
      console.log('  Index project:  npm index <directory>');
      console.log('  Review file:    npm review <filepath>');
      console.log('  Bulk review:    npm batch # from within project to be reviewed');
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
}
