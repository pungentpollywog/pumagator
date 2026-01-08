# pumagator

Automated CR system using ~~Zephyr~~ Gemma3:12b model, Retrieval-Augmented Generation (RAG), Abstract Syntax Tree (AST), and LanceDB (Vector Database). 

## Setup 

Install these models within Ollama:
- ~~zephyr~~ gemma3:12b
- nomic-embed-text

via...
```bash
ollama pull gemma3:12b       # The Chat Model
ollama pull nomic-embed-text # The Embedding Model (smaller, better for code)
```

Install the JavaScript dependencies
```bash
npm install ollama @lancedb/lancedb @langchain/textsplitters glob
```

Install AST parsing deps
```bash
npm install @babel/parser @babel/traverse @babel/types
```

## Usage

Run either `npm run index <directory>` or `npm run review <file>`.

Note: Must index at least once before reviewing.

Example: 
```bash 
npm run index "/c/Users/chris/src/git/lowell/projects/cdemaria/todos-app/src"
# or 
npm run index "/c/Users/chris/src/git/lowell/review/jpennewell/todos-app/src"
```

Then...
```bash 
npm run review "/c/Users/chris/src/git/lowell/projects/cdemaria/todos-app/src/components/Dash.jsx"
# or 
npm run review "/c/Users/chris/src/git/lowell/review/jpennewell/todos-app/src/components/Dash.jsx"
# (respectively)
```
