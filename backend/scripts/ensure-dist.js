/**
 * Runs before `npm start`. Compiles TypeScript when dist/ is missing
 * (e.g. Nixpacks build phase skipped or devDependencies pruned).
 */
const { existsSync } = require('fs')
const { join } = require('path')
const { execSync } = require('child_process')

const entry = join(__dirname, '..', 'dist', 'index.js')
if (existsSync(entry)) process.exit(0)

console.log('[prestart] dist/index.js missing — running npm run build...')
execSync('npm run build', { stdio: 'inherit', cwd: join(__dirname, '..') })
