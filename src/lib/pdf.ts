/**
 * Shared pdf.js setup.
 *
 * The worker has to be configured exactly once, before anything calls into
 * pdf.js. Keeping it here (rather than as a side effect of importing a
 * component) means any module can pull in pdf.js without depending on some
 * unrelated component having been imported first.
 */

import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export { pdfjs }
