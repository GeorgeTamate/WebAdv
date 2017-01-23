// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express')
var app = express()


app.get('/404', function (req, res) {
    console.log('not found')
    res.send('not found');
})

app.get('/protected', function (req, res) {
    console.log('protected')
    res.send('protected');
})

app.get('/error', function (req, res) {
    console.log('error')
    res.send('error');
})

app.get('/nonimplemented', function (req, res) {
    console.log('nonimplemented')
    res.send('nonimplemented');
})

app.get('/login', function (req, res) {
    console.log('login')
    res.send('login');
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

    res.send(myjson);
})

app.post('/login', function (req, res) {
    res.send('No resource found for this path.');
})

app.post('*', function (req, res) {
    res.send('No resource found for this path.');
})


app.listen(8085, function () {
    console.log('Example app listening on port 8085!');
})