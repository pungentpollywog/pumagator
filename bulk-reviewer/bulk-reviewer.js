import fs from 'node:fs';
import { loadAndChunkFilesAST } from '../ast-chunker.js'; 
import { analyzeDiff } from './diff-engine.js'; 
import { processReviewQueue } from './orchestrator.js'; 
import { indexCodebase } from '../store.js';

export async function runBulkReview(diffOutput, src='.') {
  console.log('1. Parsing Project AST...');
  const astChunks = await loadAndChunkFilesAST(src);

  console.log('Indexing code context from AST');
  // Update context stored in the Lance DB with the current codebase
  await indexCodebase(astChunks);

  console.log('2. Analyzing Diff Scope...');
  const tasks = analyzeDiff(diffOutput, astChunks);

  if (tasks.length === 0) {
    console.log('No relevant code changes found to review.');
    return;
  }

  console.log(`3. Queuing ${tasks.length} reviews...`);
  const results = await processReviewQueue(tasks);

  console.log('4. Generating Report...');
  const report = results
    .filter((r) => r.status === 'success')
    .map(
      (r) => `
## File: ${r.file} (${r.type})
${r.critique}
---
        `
    )
    .join('\n');

  fs.writeFileSync('CODE_REVIEW_REPORT.md', report);
  console.log('Done! Report saved to CODE_REVIEW_REPORT.md');
}

