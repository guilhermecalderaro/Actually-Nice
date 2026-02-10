const esbuild = require('esbuild');
const fs = require('fs');

// Read existing UserScript block from the root file (or define it here)
// For simplicity, defining it here to ensure build is self-contained:
const metadata = `// ==UserScript==
// @name         Actually NICE – My Schedule Summary
// @version      0.3.3
// @description  Builds a dropdown summary table in the main document.
// @author       Guilherme Calderaro <guilhermecald96@gmail.com>
// @source       https://github.com/guilhermecalderaro/Actually-Nice
// @match        https://equiti-wfm.nicecloudsvc.com/wfm/webstation/my-schedule*
// @noframes
// @grant        none
// ==/UserScript==
`;

esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/actually-nice.user.js', // Renaming output to .user.js for easier install
  minify: false,
  sourcemap: false,
  target: ['es2020'],
  banner: {
      js: metadata,
  },
}).catch(() => process.exit(1));

console.log('Build complete: dist/actually-nice.user.js');
