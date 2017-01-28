// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

var allowedMethods = ['GET', 'POST', 'PUT'];

// Register `hbs.engine` with the Express app.
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/home', function (req, res) {
    res.render('home');
});

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

app.get('/login', function (req, res) {
    res.statusCode = 200;
    console.log('login');
    res.sendFile(path.join(__dirname + '/pages/login.html'));
})

app.post('/login', function (req, res) {
    var jsonObject = {
        "username": req.body.username,
        "password": req.body.password
    };

    res.type('application/json');
    res.statusCode = 200;
    res.send(jsonObject);
})

app.all('/notimplemented', function (req, res) {
    switch (req.method) {
        case 'GET':
        case 'POST':
        case 'PUT':
            res.statusCode = 200;
            break;
        default:
            res.statusCode = 501;
            break;
    }

    res.set('Allow', allowedMethods);
    console.log('notimplemented');
    res.send('notimplemented');
})

// DEFAULT
app.get('*', function (req, res) {
    var portNumber = req.get('host');
    var headerFields = [];
    var headerFieldsJson = JSON.parse(JSON.stringify(req.headers));

    portNumber = portNumber.split(':');

    for (var i in headerFieldsJson) {
        headerFields.push(headerFieldsJson[i]);
    }

    var responseJson = {
        "method": req.method,
        "path": req.path,
        "port": portNumber[1],
        "host": portNumber[0],
        "header": headerFields
    };

    res.statusCode = 200;
    res.send(responseJson);
})

app.post('*', function (req, res) {
    res.statusCode = 200;
    res.send('No resource found for this path.');
})

// LISTEN
app.listen(8085, function () {
    console.log('Example app listening on port 8085!');
})