import ollama from 'ollama';
import lancedb from '@lancedb/lancedb';

export async function reviewCode(codeSnippet) {
  const db = await lancedb.connect('data/code-review-index');
  const table = await db.openTable('code_chunks');
  const modelName = 'gemma3:12b'; // was 'zephyr'

  // 1. Embed the target code to find relevant context
  const queryEmbedding = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: codeSnippet,
  });

  // 2. Retrieve relevant chunks (Vector Search)
  const results = await table.vectorSearch(queryEmbedding.embedding)
    .limit(5) // Get most relevant code blocks
    .toArray();

  const contextText = results.map(result => 
    `[Source: ${result.source}]\n${result.text}`
  ).join('\n\n');

  // 3. Construct the Prompt
  const prompt = `
  You are a Senior Software Engineer reviewing a React project.
  
  ## Project Context
  ${contextText}
  
  ## Code to Review
  ${codeSnippet}
  
  ## Instructions
  1. Use the code in the provided "Project Context" section to understand dependencies, utility functions, and coding patterns used in this project.
  2. Analyze the component in the "Code to Review" section for bugs, unused variables, unused parameters, and performance issues.
  3. Only review the code in the "Code to Review" section.
  4. Ignore comments. 
  5. Functional code is preferred. 
  6. Provide simple refactoring suggestions.

  ## Instructions for AI workflow:
  1.  **Step-by-Step Generation:** Generate the initial result by thinking through the problem thoroughly.
  2.  **Internal Review:** After generating the result, pause and critically evaluate the answer you generated in step 1. Check it against the original task instructions and constraints.
  3.  **Correction:** If you find any errors during the internal review, correct them.
  4.  **Final Output:** Only provide the final, verified answer. Do not show your intermediate steps unless explicitly asked.

  `;

  //   4. Check consistency with the patterns seen in the "Project Context" section. Function names do not have to match the context.

  // 4. Generate Review with model
  console.log(`Consulting ${modelName}...`);
  const response = await ollama.chat({
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    stream: true, // Stream the response for better UX
  });

  // Print stream to console
  for await (const part of response) {
    process.stdout.write(part.message.content);
  }
}
