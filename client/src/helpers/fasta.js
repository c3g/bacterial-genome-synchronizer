/*
 * fasta.js
 */


export function validateFastaFile(text) {
  let isFastaFile = false
  let result = undefined

  const lines = text.split('\n')
  const lastLines = lines.slice(1)

  if (lines[0].startsWith('>') && lastLines.every(isATCGorEmpty)) {
    isFastaFile = true
    result = {
      description: lines[0],
      sequence: lastLines.join(''),
    }
  }

  return { success: isFastaFile, result }
}

export function isATCGorEmpty(text) {
  if (text.length === 0)
    return true
  return isATCG(text)
}

export function isATCG(text) {
  for (let i = 0; i < text.length; i++) {
    if (
         text[i] !== 'a'
      && text[i] !== 't'
      && text[i] !== 'c'
      && text[i] !== 'g'
      && text[i] !== 'A'
      && text[i] !== 'T'
      && text[i] !== 'C'
      && text[i] !== 'G'
    )
      return false
  }
  return true
}
