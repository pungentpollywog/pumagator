import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from 'node:fs';
import { glob } from 'glob';

export async function loadAndChunkFiles(directory) {
  // Find all relevant files (ignoring node_modules, etc.)
  const files = await glob(`${directory}/**/*.{js,ts,jsx,tsx,py}`, { 
    ignore: '**/node_modules/**' 
  });

  const documents = [];

  // Configure Splitter for Code
  // This splitter looks for code separators like "function", "class", "{", etc.
  const splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
    chunkSize: 1000,    // Tokens/Chars per chunk
    chunkOverlap: 200,  // Overlap to maintain context between chunks
  });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Create chunks
    const chunks = await splitter.createDocuments([content], [{ source: file }]);
    documents.push(...chunks);
  }

  console.log(`Processed ${files.length} files into ${documents.length} chunks.`);
  return documents;
}