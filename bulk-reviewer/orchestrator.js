// orchestrator.js
import pLimit from 'p-limit';
import { reviewDiff } from './diff-reviewer.js';
import lancedb from '@lancedb/lancedb';
import ollama from 'ollama';

// CONFIGURATION
// For local LLMs (Zephyr 7b), set this to 1. 
// If you set it higher, the model will split resources, slowing down individual requests significantly.
const MAX_CONCURRENCY = 1;

export async function processReviewQueue(diffReviews) {
  const limit = pLimit(MAX_CONCURRENCY);
  const db = await lancedb.connect('data/code-review-index');
  const table = await db.openTable('code_chunks');

  console.log(`Starting review of ${diffReviews.length} items with concurrency: ${MAX_CONCURRENCY}`);

  // Create an array of Promises, each wrapped by the limiter
  const reviewPromises = diffReviews.map((reviewItem, index) => {
    return limit(async () => {
      const { filePath, chunkType } = reviewItem;
      
      console.log(`[${index + 1}/${diffReviews.length}] Processing ${filePath} (${chunkType})...`);

      try {
        // console.log({code: reviewItem.code});

        // 1. Retrieve Context (RAG)
        // We search for code relevant to the *modified code*, not the whole file
        const context = await retrieveContext(reviewItem.code, table);

        // 2. Perform Review
        // We capture the result instead of streaming directly to stdout here
        // to prevent console logs from overlapping.
        const critique = await reviewDiff(reviewItem, context);

        return {
          status: 'success',
          file: filePath,
          type: chunkType,
          critique: critique
        };

      } catch (error) {
        console.error(`Error reviewing ${filePath}:`, error.message, error);
        return {
          status: 'error',
          file: filePath,
          error: error.message
        };
      }
    });
  });

  // Wait for all to finish
  const results = await Promise.all(reviewPromises);
  return results;
}

// Helper: RAG Context Retrieval
async function retrieveContext(codeSnippet, table) {
  const queryEmbedding = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: codeSnippet,
  });

  const results = await table.vectorSearch(queryEmbedding.embedding)
    .limit(3)
    .toArray();

  console.log({results});

  return results.map(r => `[Source: ${r.source}]\n${r.text}`).join('\n\n');
}