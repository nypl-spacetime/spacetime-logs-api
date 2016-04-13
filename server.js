var express = require('express')
var app = express()
var config = require('spacetime-config')
var logs = require('./index')

app.use('/', logs)

app.listen(config.api.bindPort, function () {
  console.log(config.logo.join('\n'))
  console.log('Space/Time Logs API listening at port ' + config.api.bindPort)
})
