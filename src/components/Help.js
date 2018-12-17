/*
 * Help.js
 */


import React from 'react'
import pure from 'recompose/pure'
import cx from 'classname'

import Icon from './Icon'

import './Help.scss'


function Help(props) {
  return (
    <div className='Help'>
      <div className='Help__content'>
        <h1 className='Help__title'>Help</h1>

        <h2>What is this tool?</h2>
        <p className='Help__text'>
          The Circular DNA Re-aligner allows you to provide your bacterial DNA sequence
          and a desired start sequence, and realign the DNA sequence to match this start.
          It also reverse your DNA sequence if it appears to be in the opposite direction
          to your start sequence.
        </p>

        <h2>How does it work?</h2>
        <p className='Help__text'>
          First, you must provide your input DNA sequences, either as FASTA files, or as NCBI
          accession numbers. <br/>
          Second, you need to provide your start sequence, either from a text file, or in the
          text input. <br/>
          Third, click <code>Re-Align</code> and let the tool run. <br/>
          Lastly, you can download the files that were realigned.
        </p>
      </div>
    </div>
  )
}

export default pure(Help)
