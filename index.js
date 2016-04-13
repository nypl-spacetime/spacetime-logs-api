'use strict'

var fs = require('fs')
var path = require('path')
var H = require('highland')
var express = require('express')
var config = require('spacetime-config')
var app = express()

app.get('/:dataset/:step', function (req, res) {
  var dataset = req.params.dataset
  var step = req.params.step
  var filename = path.join(config.data.outputDir, req.params.step, dataset, `${dataset}.log.ndjson`)

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
