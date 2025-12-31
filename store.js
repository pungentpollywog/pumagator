import lancedb from '@lancedb/lancedb';
import ollama from 'ollama';

// Connect to a local file-based vector DB
const db = await lancedb.connect('data/code-review-index');

export async function indexCodebase(chunks) {

  console.log("Generating embeddings and indexing... (this may take a moment)");

  const dataToInsert = [];

  for (const chunk of chunks) {
    // Generate embedding using a dedicated embedding model
    const response = await ollama.embeddings({
      model: 'nomic-embed-text', // Specialized for retrieval
      prompt: chunk.pageContent,
    });

    dataToInsert.push({
      vector: response.embedding,
      text: chunk.pageContent,
      source: chunk.metadata.source,
      lineStart: chunk.metadata.loc?.lines?.from, // If available from splitter
      lineEnd: chunk.metadata.loc?.lines?.to
    });
  }

// NOTE: uncomment the schema definition below to: Define the Schema Explicitly
  // Note: nomic-embed-text uses 768 dimensions. Adjust 'listSize' if using a different model.
  // const schema = new Schema([
  //   new Field("vector", new FixedSizeList(768, new Field("item", new Float32()))),
  //   new Field("text", new Utf8()),
  //   new Field("source", new Utf8()),
  //   new Field("lineStart", new Utf8()), // or Float32/Int32 depending on your data
  //   new Field("lineEnd", new Utf8())
  // ]);

  // Create table AND insert data in one step
  // LanceDB infers schema from 'dataToInsert' automatically here.
  const table = await db.createTable('code_chunks', dataToInsert, { 
    mode: 'overwrite' 
  });

  console.log("Indexing complete.");
  return table;
}
