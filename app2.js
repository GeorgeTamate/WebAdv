// Create a program that outputs the HTTP Request message as text to the console.

var express = require('express')
var app = express()

app.use (function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
       data += chunk;
    });
    req.on('end', function() {
        req.body = data;
        next();
    });
});

app.get('/', function (req, res) {
  res.send('Hello GET!');
  console.log(req.rawHeaders);
  console.log();
  console.log(req.body);
})

app.post('/', function (req, res) {
  res.send('Hello POST!');
  console.log(req.rawHeaders);
  console.log();
  console.log(req.body);
})

app.listen(8085, function () {
  console.log('Example app listening on port 8085!');
})