/*
 * fasta.test.js
 */

import { fastaToString, validateFastaFile, realignFasta, reverseComplement } from './fasta.js'

const file1 =
`>NZ_CP022077.1 Campylobacter jejuni subsp. jejuni strain FDAARGOS_263 chromosome, complete genome
TTTTTCATCTACCAAAGAGTAAGCTCCGATTAAATCCCCAATTTCTATTGCTTCATATTTAGGAGTTTTT
AAACCTTTTAAAAGAGTATTTTCAAGTTCATTTCTACCTATGATCATTTTAGCTCCATTGGGTAATCTTA
AATGACGACCATATTTTAAAAGTTGTGCGTCATTAACCTGCATATCTTTGTCAAATTCTATGAAATCTCG
ATAGGAATTTCTTACATCTATCATTTCAAAATCTGCACCTA`

const file2 =
`>file 2
AAAAAAAAACCGTAAAA`

const badFastaFile =
`>TEST for a bad fasta file
TCTTATGATTTTATCTTAAAATCAGACTTAAAAGAGGAAACCACCCTAAAAHCGATGCTACGTACGTACG
TCTTATGATTTTATCTTAAAATCAGACTTAAAAGAGGAAACCACCCTAAAAGCTAGCATCTAGCATCTAG`

const badFile =
`I am a very bad file`

// Both come from file2
const startSequence    = `CGT`
const startSequenceRev = `ACG`



describe('validateFastaFile()', () => {

  test('works with fasta files', () => {
    const validation = validateFastaFile(file1)
    expect(validation).toEqual({ success: true, result: {
      description: `>NZ_CP022077.1 Campylobacter jejuni subsp. jejuni strain FDAARGOS_263 chromosome, complete genome`,
      sequence: `TTTTTCATCTACCAAAGAGTAAGCTCCGATTAAATCCCCAATTTCTATTGCTTCATATTTAGGAGTTTTTAAACCTTTTAAAAGAGTATTTTCAAGTTCATTTCTACCTATGATCATTTTAGCTCCATTGGGTAATCTTAAATGACGACCATATTTTAAAAGTTGTGCGTCATTAACCTGCATATCTTTGTCAAATTCTATGAAATCTCGATAGGAATTTCTTACATCTATCATTTCAAAATCTGCACCTA`
    }})
  })

  test('works with bad fasta files', () => {
    const validation = validateFastaFile(badFastaFile)
    expect(validation).toEqual({ success: false, result: undefined})
  })

  test('works with bad files', () => {
    const validation = validateFastaFile(badFile)
    expect(validation).toEqual({ success: false, result: undefined})
  })
})

describe('reverseComplement()', () => {
  test('works', () => {
    expect(startSequence).toBe(reverseComplement(startSequenceRev))
  })
})

describe('realignFasta()', () => {

  test('works with original sequence', () => {
    const { result: fasta } = validateFastaFile(file2)

    const newFasta = realignFasta(fasta, startSequence)
    expect(newFasta).toEqual({
      success: true,
      result: {
        description: fasta.description,
        sequence: `CGTAAAAAAAAAAAAAC`,
        isReversed: false,
      }
    })
  })

  test('works with reversed sequence', () => {
    const { result: fasta } = validateFastaFile(file2)

    const newFasta = realignFasta(fasta, startSequenceRev)
    expect(newFasta).toEqual({
      success: true,
      result: {
        description: fasta.description,
        sequence: `ACGGTTTTTTTTTTTTT`,
        isReversed: true,
      }
    })
  })
})

describe('fastaToString()', () => {
  test('works', () => {
    const { result: fasta } = validateFastaFile(file1)
    const string = fastaToString(fasta)
    expect(string).toBe(file1)
  })
})
