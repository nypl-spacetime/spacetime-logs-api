'use strict'

const fs = require('fs')
const path = require('path')
const H = require('highland')
const express = require('express')
const glob = require('glob')
const config = require('spacetime-config')

const baseDir = config.data.outputDir
const pattern = path.join(baseDir, '**', '*.log.ndjson')

var logs = {}

const findLogFiles = () => {
  glob(pattern, function (err, filenames) {
    logs = {}

    if (err) {
      console.error('Error finding log files', err.message)
      process.exit(1)
    }

    filenames
      .map((filename) => filename.replace(baseDir, ''))
      .map((filename) => filename.split('/'))
      .forEach((parts) => {
        parts = parts.filter((part) => part.length)
        let dataset = parts[1]
        let step = parts[0]

        if (!logs[dataset]) {
          logs[dataset] = []
        }

        logs[dataset].push(step)
      })
  })
}

// Search for new log files every minute
// TODO: maybe at some point, use https://github.com/paulmillr/chokidar
setInterval(findLogFiles, 60000)
findLogFiles()

var app = express()

app.get('/', function (req, res) {
  res.send(logs)
})

app.get('/:dataset', function (req, res) {
  let dataset = req.params.dataset
  if (!logs[dataset]) {
    res.status(404).send({
      message: `No logs found for dataset '${dataset}'`
    })
  } else {
    res.send(logs[req.params.dataset])
  }
})

app.get('/:dataset/:step', function (req, res) {
  var dataset = req.params.dataset
  var step = req.params.step
  var filename = path.join(baseDir, req.params.step, dataset, `${dataset}.log.ndjson`)

  fs.stat(filename, (err, stats) => {
    if (err) {
      res.status(404).send({
        message: `dataset + step '${dataset}/${step}' not found`
      })
    } else {
      var objects = H(fs.createReadStream(filename))
        .split()
        .compact()
        .intersperse(',')

      H(['[', objects, ']'])
        .flatten()
        .pipe(res)
    }
  })
})

module.exports = app
