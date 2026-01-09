// ast-chunker.js
import fs from 'node:fs';
import { glob } from 'glob';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default; // Handle ESM/CommonJS interop

export async function loadAndChunkFilesAST(directory) {
  const files = await glob(`${directory}/**/*.{js,ts,jsx,tsx}`, { 
    ignore: ['**/node_modules/**', '**/data/**', '*.md', '*.json']
  });

  const documents = [];

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');

    try {
      // Parse Code to AST
      // We enable plugins for TypeScript and JSX to handle modern code
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy']
      });

      // Traverse AST to find logical blocks
      traverse(ast, {
        // Handle Functions (function foo() {})
        FunctionDeclaration(path) {
          addChunk(path, file, code, 'function', documents);
        },
        // Handle Classes (class Bar {})
        ClassDeclaration(path) {
          addChunk(path, file, code, 'class', documents);
        },
        // Handle Object Methods / Class Methods
        ClassMethod(path) {
          addChunk(path, file, code, 'method', documents);
        },
        // Handle Variable Functions (const foo = () => {})
        VariableDeclarator(path) {
          if (
            path.node.init && 
            (path.node.init.type === 'ArrowFunctionExpression' || 
             path.node.init.type === 'FunctionExpression')
          ) {
             // We want the whole variable declaration "const foo = ...", not just the function part
             // So we look up to the VariableDeclaration parent
             addChunk(path.parentPath, file, code, 'function_expression', documents);
          }
        }
      });

    } catch (err) {
      console.warn(`Failed to parse ${file}: ${err.message}. Falling back to text splitter for this file.`);
      // Optional: Insert fallback logic here (call previous text splitter)
    }
  }

  console.log(`Extracted ${documents.length} semantic code blocks.`);
  return documents;
}

/**
 * Helper to extract source code from AST node and push to documents array
 */
function addChunk(path, file, code, type, documents) {
  const { start, end, loc } = path.node;
  const chunkContent = code.slice(start, end);

  // Filter out tiny helpers (e.g., 1-line functions) to reduce noise
  // if (chunkContent.length < 50) return;

  documents.push({
    pageContent: chunkContent,
    metadata: {
      source: file,
      type: type,
      lineStart: loc?.start.line,
      lineEnd: loc?.end.line,
    }
  });
}
