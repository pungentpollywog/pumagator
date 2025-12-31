import ollama from 'ollama';
import lancedb from '@lancedb/lancedb';

export async function reviewCode(codeSnippet, filePath) {
  const db = await lancedb.connect('data/code-review-index');
  const table = await db.openTable('code_chunks');

  // 1. Embed the target code to find relevant context
  const queryEmbedding = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: codeSnippet,
  });

  // 2. Retrieve relevant chunks (Vector Search)
  const results = await table.vectorSearch(queryEmbedding.embedding)
    .limit(3) // Get top 3 most relevant code blocks
    .toArray();

  const contextText = results.map(r => 
    `[Source: ${r.source}]\n${r.text}`
  ).join('\n\n');

  // 3. Construct the Prompt
  const prompt = `
  You are a Senior Software Architect. Review the following code snippet.
  
  Use the provided "Project Context" to understand dependencies, utility functions, 
  and coding patterns used in this project.
  
  ## Project Context
  ${contextText}
  
  ## Code to Review (File: ${filePath})
  ${codeSnippet}
  
  ## Instructions
  1. Analyze for bugs, security risks, and performance issues.
  2. Check consistency with the patterns seen in "Project Context".
  3. Provide concrete refactoring suggestions.
  `;

  // 4. Generate Review with Zephyr
  console.log("Consulting Zephyr...");
  const response = await ollama.chat({
    model: 'zephyr',
    messages: [{ role: 'user', content: prompt }],
    stream: true, // Stream the response for better UX
  });

  // Print stream to console
  for await (const part of response) {
    process.stdout.write(part.message.content);
  }
}
