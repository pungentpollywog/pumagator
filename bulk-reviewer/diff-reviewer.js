// review.js (Updated)
import ollama from 'ollama';

export async function reviewDiff(modifiedScope, relevantContext) {
    const { code, changedLines, filePath } = modifiedScope;

    // ... (Annotation logic from previous step) ...
    const lines = code.split('\n');
    const annotatedCode = lines.map((line, index) => {
        // Adjust logic based on your AST parser's line offset
        const currentLineNum = modifiedScope.metadata?.lineStart + index; 
        if (changedLines.includes(currentLineNum)) {
            return `${line}  // <--- MODIFIED HERE`;
        }
        return line;
    }).join('\n');

    const prompt = `
    You are a Code Reviewer. Review the marked changes in: ${filePath}
    
    CONTEXT:
    ${relevantContext}
    
    CODE:
    ${annotatedCode}
    
    Provide a concise critique focusing on bugs and patterns.
    `;

    // Note: stream: false (Wait for full response)
    const response = await ollama.chat({
        model: 'zephyr',
        messages: [{ role: 'user', content: prompt }],
        stream: false 
    });

    return response.message.content;
}