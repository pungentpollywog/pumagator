// diff-engine.js
import parseDiff from 'parse-diff';

export function analyzeDiff(rawDiffOutput, astChunks) {
  
  // Parse the git diff into a structured object
  const files = parseDiff(rawDiffOutput);
  const reviews = [];

  for (const file of files) {
    // Ignore deleted files or renames for now
    if (file.deleted) continue;

    // Identify all changed line numbers in this file
    const changedLines = new Set();
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === 'add' || change.type === 'del') {
          // 'ln' is the line number in the new file
          // For deletions, we might use 'ln1', but for review we focus on current state
          if (change.ln) changedLines.add(change.ln);
        }
      }
    }

    // Find the AST Node (Function/Class) that contains these lines
    // Filter your AST chunks to find those belonging to this file
    const fileChunks = astChunks.filter(chunk => {
      // console.log({source: chunk.metadata.source}, {comparison: file.to});
      return chunk.metadata.source.replaceAll('\\', '/').includes(file.to);
    });

    for (const chunk of fileChunks) {
      const start = chunk.metadata.lineStart;
      const end = chunk.metadata.lineEnd;
      // Check if any changed line falls within this chunk's boundaries
      const isModified = Array.from(changedLines).some(line => line >= start && line <= end);

      if (isModified) {
        reviews.push({
          filePath: file.to,
          chunkType: chunk.metadata.type, // e.g., 'function', 'class'
          code: chunk.pageContent,
          changedLines: Array.from(changedLines).filter(l => l >= start && l <= end)
        });
      }
    }
  }

  // console.log({reviews});

  return reviews;
}