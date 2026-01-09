import { execSync } from 'node:child_process';
import { runBulkReview } from './bulk-reviewer.js';

export async function batchGitReview() {
  /**
   * Generate the rawDiffOutput
   * This command gets all changes currently in your "staged" area (after git add)
   * compared to the last commit.
   */
  try {
    // We use the --unified=3 flag to ensure standard formatting
    // but the library works with the default output as well.
    const diffOutput = execSync('git diff --cached', { encoding: 'utf-8' });

    if (diffOutput) {
      // Pass the string into the review engine
      console.log('Changes detected. Starting automated review...');
      await runBulkReview(diffOutput);
    } else {
      console.log('No changes detected in the staging area.');
    }
  } catch (error) {
    console.error('Failed to execute git command:', error.message);
  }
}
