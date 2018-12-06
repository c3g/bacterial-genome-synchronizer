/*
 * handlers.js
 */


exports.errorHandler = res => err => {
  res.json({ ok: false, message: err.toString(), stack: err.stack })
  res.end()
}

exports.okHandler = res => () => {
  res.json({ ok: true, data: null })
  res.end()
}

exports.dataHandler = res => data => {
  res.json({ ok: true, data: data })
  res.end()
}

exports.warningHandler = res => ([data, warnings]) => {
  const result = { ok: true, data }
  if (warnings && warnings.length > 0) {
    result.warning = true
    result.warnings = warnings.map(asString)
  }
  res.json(result)
  res.end()
}

function asString(value) {
  if (Array.isArray(value))
    return value.join('\n')
  if (value instanceof Error)
    return value.stack
  return '' + value
}

exports.separateWarnings = values => {
  const data = []
  const errors = []
  values.forEach(value => {
    if (value instanceof Error)
      errors.push(value)
    else
      data.push(value)
  })
  return [data, errors]
}
