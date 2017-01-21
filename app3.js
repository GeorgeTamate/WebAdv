// Create a program that outputs all of the header fields passed in an HTTP 
// Request message as a JSON object to the console.

var express = require('express')
var app = express()

app.get('*', function (req, res) {
  res.send('Hello World!');
  var jo = JSON.stringify(req.headers);
  console.log();
  console.log(jo);
})

app.listen(8085, function () {
  console.log('Example app listening on port 8085!');
})