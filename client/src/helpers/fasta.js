/*
 * fasta.js
 */

/**
 * @typedef {Object} Fasta
 * @property {string} description
 * @property {string} genome
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} success
 * @property {any} result
 */


/**
 * @param {Fasta} fasta
 * @param {string} sequence
 */
export function realignFasta(fasta, sequence) {
  let index = fasta.sequence.indexOf(sequence)
  let isReversed = false

  if (index === -1) {
    const reverseSequence = reverseComplement(sequence)
    index = fasta.sequence.indexOf(reverseSequence)
    isReversed = true
  }

  if (index === -1) {
    return { success: false, result: undefined }
  }

  const input = isReversed ? reverseComplement(fasta.sequence) : fasta.sequence

  if (isReversed)
    index = fasta.sequence.length - index - sequence.length

  const newSequence = input.slice(index) + input.slice(0, index)

  return { success: true, result: { ...fasta, sequence: newSequence, isReversed } }
}

export function reverseComplement(sequence) {
  return Array.from(sequence.replace(/./g, (char) => {
    switch (char) {
      case 'A': return 'T'
      case 'T': return 'A'
      case 'G': return 'C'
      case 'C': return 'G'
      default:
        throw new Error('unreachable')
    }
  })).reverse().join('')
}

export function fastaToString(fasta) {
  
}

export function validateFastaFile(text) {
  let isFastaFile = false
  let result = undefined

  const lines = text.split('\n')
  const lastLines = lines.slice(1)

  if (lines[0].startsWith('>') && lastLines.every(isATCGorEmpty)) {
    isFastaFile = true
    result = {
      description: lines[0],
      sequence: lastLines.map(l => l.toUpperCase()).join(''),
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
