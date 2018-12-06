/*
 * sql.js
 */


module.exports = {
  getUpdateSet,
}

function getUpdateSet(object) {
  return Object.keys(object)
    .filter(key => key !== 'id')
    .map(key => `${key} = @${key}`)
    .join(', ')
}
