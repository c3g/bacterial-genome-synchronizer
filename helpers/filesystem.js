/*
 * filesystem.js
 */

const fs = require('fs')
const { join } = require('path')
const { promisify } = require('util')

const config = require('../config')


const stat = promisify(fs.stat)
const exists = promisify(fs.exists)
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

exports.stat = path => stat(join(config.paths.input, path))
exports.exists = path => exists(join(config.paths.input, path))
exports.readDir = path => readDir(join(config.paths.input, path))
exports.readFile = path => readFile(join(config.paths.input, path))
exports.readJSON = path =>
  readFile(join(config.paths.input, path))
    .then(buffer => JSON.parse(buffer.toString()))

exports.createReadStream = (path, options = {}) => fs.createReadStream(join(config.paths.input, path), options)
