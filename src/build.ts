import { buildSite } from './lib/site-build.js'

buildSite().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
