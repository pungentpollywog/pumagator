import { execSync } from 'node:child_process';
import { runBulkReview } from './bulk-reviewer.js';

export async function batchGitReview(diffFile, src = '.') {
  /**
   * Generate the rawDiffOutput
   * This command gets all changes currently in your "staged" area (after git add)
   * compared to the last commit.
   */

  try {
    let diffOutput = null;
    if (diffFile) {
      diffOutput = execSync(`cat ${diffFile}`, { encoding: 'utf-8' });
    } else {
      // If no diffFile, diff in current repo. 
      // We use the --unified=3 flag to ensure standard formatting
      // but the library works with the default output as well.
      diffOutput = execSync('git diff --cached', { encoding: 'utf-8' });
    }

    if (diffOutput) {
      // Pass the string into the review engine
      console.log('Changes detected. Starting automated review...');
      await runBulkReview(diffOutput, src);
    } else {
      console.log('No changes detected in the staging area.');
    }
  } catch (error) {
    console.error('Failed to execute git command:', error.message);
  }
}
