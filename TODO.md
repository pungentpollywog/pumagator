# Project TODOs

## Next steps

- Assess suggestions in `CODE_REVIEW_REPORT_ORIG.md` and implement what seems reasonable.

- Move code files (i.e. *.js into a /src folder. Then update folder passed to `loadAndChunkFilesAST` in `bulk-reviewer.js` from `.` to `/src`. Also, remove all but `/node_modules/` from the `ignore` property in the `glob` pattern in `ast-chunker.js`)

- Test out the batch Git diff review on some other code bases. To enable this, need to add a way to pass in the folder that gets passed to `loadAndChunkFilesAST` in `bulk-reviewer.js`.

- add an `.env` file where the **name** of the **ollam model** used can be specified. Update `reviewDiff` in `diff-reviewer.js` to use the value from the `.env` file.

- Look into refactoring and improving the architecture. 

- Look into allowing more than one concurrent process.

- Make an option that will perform a CR for a given project and MR diff using one of the following Git options:
  - Direct Comparison: `git diff main feature` (or `git diff main..feature`) shows all differences between the tips of the two branches.
  - Merge Base Comparison: `git diff main...feature` shows changes in the feature branch since it originally diverged from main. This is typically what you see in a Pull Request.
  - See: https://www.geeksforgeeks.org/git/how-to-see-the-differences-between-two-branches/

(Back to main [README.md](README.md).)