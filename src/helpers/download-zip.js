/*
 * download-zip.js
 */

import JSZip from 'jszip'

export default async function downloadZip(files) {
  const zip = new JSZip()

  files.forEach(entry => {
    zip.file(entry.filename, entry.text)
  })

  const fileBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(fileBlob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'files.zip')

  if (document.createEvent) {
    const event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    link.dispatchEvent(event)
  } else {
    link.click()
  }

  // Deallocate resources
  if (URL.revokeObjectURL)
    URL.revokeObjectURL(url)
}
