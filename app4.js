// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express')
var app = express()

app.get('*', function (req, res) {
  //res.send('Hello World!');
  
  var portnumber =  req.get('host');
  portnumber = portnumber.split(':')[1];

  var myjson = {
      "httpMethod": req.method,
      "path": req.path,
      "port": portnumber,
      "headerFields": req.headers
  }

  res.send(myjson);
  console.log(myjson);
})

app.listen(8085, function () {
  console.log('Example app listening on port 8085!');
})