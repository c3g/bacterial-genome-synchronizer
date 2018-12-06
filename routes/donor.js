const express = require('express')
const router = express.Router()

const { warningHandler, errorHandler } = require('../helpers/handlers')
const Peer = require('../models/peer')

// Export these
router.findAll = findAll
router.searchVariants = searchVariants
router.listChroms = listChroms

function findAll() {
  return Peer.request({ url: '/api/donor/find-all' })
  .then(([results, errors]) => {

    const finalData = {}
    results.forEach(({ peer, data }) => {
      Object.values(data).forEach(donor => {
        donor.source = peer.id
        finalData[donor.id] = donor
      })
    })

    return [finalData, errors.map(generateMessage)]
  })
}

function searchVariants(params) {
  return Peer.request({ method: 'post', url: '/api/donor/search-variants', body: params })
  .then(([results, errors]) => {

    const finalData = []
    results.forEach(({ peer, data }) => {
      data.forEach(match => {
        match.source = peer.id
        finalData.push(match)
      })

    })

    return [finalData, errors.map(generateMessage)]
  })
}

function listChroms() {
  return Peer.request({ url: '/api/donor/list-chroms' })
  .then(([results, errors]) => {

    const finalData = Array.from(new Set(results.reduce((acc, cur) => acc.concat(cur.data))))

    return [finalData, errors.map(generateMessage)]
  })
}

function generateMessage(error) {
  const message = error.message || ((error.data && error.data.ok === false) ? error.data.message : '') || error.toString()
  if (error.peer)
    return `Peer "${error.peer.id}" (${error.peer.url}) returned: ${message}`
  return message
}

// GET list
router.get('/find-all', (req, res, next) => {
  findAll()
  .then(warningHandler(res))
  .catch(errorHandler(res))
})

// POST search
router.use('/search-variants', (req, res, next) => {
  searchVariants(req.body)
  .then(warningHandler(res))
  .catch(errorHandler(res))
})

// GET chroms
router.use('/list-chroms', (req, res, next) => {
  listChroms()
  .then(warningHandler(res))
  .catch(errorHandler(res))
})

module.exports = router;
