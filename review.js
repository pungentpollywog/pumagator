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

  const contextText = results.map(result => 
    `[Source: ${result.source}]\n${result.text}`
  ).join('\n\n');

  // 3. Construct the Prompt
  const prompt = `
  You are a Senior Software Engineer reviewing React code.
  
  ## Project Context
  ${contextText}
  
  ## Code to Review
  ${codeSnippet}
  
  ## Instructions
  1. Use the code in the provided "Project Context" section to understand dependencies, utility functions, and coding patterns used in this project.
  2. Analyze code in the "Code to Review" section for bugs, unused variables, unused parameters, and performance issues.
  3. Ignore comments. 
  4. Functional code is preferred. 
  5. Provide concrete refactoring suggestions.
  `;

  //   4. Check consistency with the patterns seen in the "Project Context" section. Function names do not have to match the context.

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
