/*
 * fetch-ncbi.js
 */


import axios from 'axios';

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'

export default function fetchNCBI(accession) {
  const url = `${BASE_URL}?db=nucleotide&id=${encodeURIComponent(accession)}&rettype=fasta&retmode=text`
  return axios.post(url)
}
