// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express');
var app = express();
var path = require('path');

app.get('/404', function (req, res) {
    res.statusCode = 404;
    console.log('not found');
    res.send('not found');
})

app.get('/protected', function (req, res) {
    res.statusCode = 401;
    console.log('protected');
    res.send('protected');
})

app.get('/error', function (req, res) {
    res.statusCode = 500;
    console.log('error');
    res.send('error');
})

app.get('/nonimplemented', function (req, res) {
    res.statusCode = 501;
    console.log('nonimplemented');
    res.send('nonimplemented');
})

app.get('/login', function (req, res) {
    res.statusCode = 200;
    console.log('login');
    res.sendFile(path.join(__dirname + '/Resources/login.html'));
})

app.get('*', function (req, res) {
    

    var portNumber = req.get('host');
    portNumber = portNumber.split(':')[1];

    var myjson = {
        "httpMethod": req.method,
        "path": req.path,
        "port": portNumber,
        "headerFields": req.headers
    }

    res.statusCode = 200;
    res.send(myjson);
})

app.post('/login', function (req, res) {
    res.statusCode = 200;
    res.send('Password Cual es.');
})

app.post('*', function (req, res) {
    res.statusCode = 200;
    res.send('No resource found for this path.');
})


app.listen(8085, function () {
    console.log('Example app listening on port 8085!');
})