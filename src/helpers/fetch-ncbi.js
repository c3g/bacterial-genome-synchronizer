/*
 * fetch-ncbi.js
 */


import axios from 'axios';

import delay from './delay'

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'

export default function fetchNCBI(accession, retries = 25) {
  const url = `${BASE_URL}?db=nucleotide&id=${encodeURIComponent(accession)}&rettype=fasta&retmode=text`
  return axios.post(url)
  .catch(err => {

    // The response non-deterministically contains the CORS headers,
    // therefore it will sometime fails, sometimes not.
    if (retries > 0 && err.message === 'Network Error')
      return delay(Math.random() * 1000 + 2000).then(() => fetchNCBI(accession, retries - 1))
  })
}
