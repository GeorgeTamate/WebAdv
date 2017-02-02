// Create a program that outputs the four parts of an URL: 
// Protocol, Hostname, Port, Path to the console.

var express = require('express')
var app = express()

app.get('*', function (req, res) {
  res.send('Hello World!');
  var portnumber =  req.get('host');
  portnumber = portnumber.split(':')[1];

  console.log();
  console.log('PROTOCOL: ' + req.protocol);
  console.log('HOST: ' + req.hostname);
  console.log('PORT: ' + portnumber);
  console.log('PATH: ' + req.path);
  console.log();
})

app.listen(8085, function () {
  console.log('Example app listening on port 8085!');
})