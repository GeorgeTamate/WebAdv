// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express');
var exphbs = require('express-handlebars');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
var yamlConfig = require('node-yaml-config');
var redisYml = yamlConfig.load('./redis.yml');
var mongoYml = yamlConfig.load('./mongo.yml');
var shortid = require('shortid');
var uuid = require('uuid-v4');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate() + '.' + file.mimetype.split('/')[1]);
    }
});
var upload = multer({ storage: storage });

var ionicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/img/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var ionicUpload = multer({ storage: ionicStorage });

// REDIS
var redis = require('redis');
var redisClient = redis.createClient(redisYml.port, redisYml.host);
redisClient.auth(redisYml.authKey);
redisClient.on('connect', function () {
    console.log('connected');
});


var port = 8085;
var db;
var allowedMethods = ['GET', 'POST', 'PUT'];
var mongoCollection = mongoYml.collection;


app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'generated')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// LISTEN
MongoClient.connect(mongoYml.url, (err, database) => {
    if (err) return console.log(err);
    db = database;
    app.listen(port, function () {
        console.log('Example app listening on port 8085!');
    });
});

// Handlebars

app.get('/example', function (req, res) {
    console.log('Sample Shortid: ' + shortid.generate());
    res.render('home');
});

app.get('/remove', function (req, res) {
    db.collection(mongoCollection, function (err, collection) {
        collection.remove();
    });
    res.send('Database Collection Removed!');
});

// IMG

app.get('/image', function (req, res) {
    res.statusCode = 404;
    res.send('/image - No image data with GET Method.');
});

app.post('/image', ionicUpload.single('image'), function (req, res, next) {
    if (req.headers['content-type'].includes("multipart")) {
        res.statusCode = 200;
        res.send('/image - Success!!');
    } else if (!req.file) {
        res.statusCode = 400;
        res.send('/image - No Content Type defined.');
    } else {
        res.statusCode = 400;
        res.send('/image - Content Type is not multipart/form-data.');
    }
});

//Movies

app.get('/movies', function (req, res) {
    console.log('/movies');
    db.collection(mongoCollection).find().toArray((err, result) => {
        if (err) return console.log(err);
        res.render('movies', { rows: result });
    });
});

app.get('/movies/json', function (req, res) {
    console.log('/movies/json');
    db.collection(mongoCollection).find().toArray((err, json) => {
        if (err) return console.log(err);
        json.forEach(function (element) {
            element.keywords = element.keywords.split(',');
        }, this);
        res.type('application/json');
        res.send(json);
    });
});

app.get('/movies/list', function (req, res) {
    console.log('/movies/list');
    db.collection(mongoCollection).find().toArray((err, result) => {
        if (err) return console.log(err);
        res.render('list', { rows: result });
    });
});

app.get('/movies/list/json', function (req, res) {
    console.log('/movies/list/json');
    db.collection(mongoCollection).find().toArray((err, json) => {
        if (err) return console.log(err);
        json.forEach(function (element) {
            element.keywords = element.keywords.split(',');
        }, this);
        res.type('application/json');
        res.send(json);
    });
});

app.get('/movies/details', function (req, res) {
    res.statusCode = 404;
    res.send();
});

app.get('/movies/details/:id', function (req, res) {
    if (!req.param("id")) {
        res.statusCode = 404;
        res.send();
    }
    console.log('/movies/details/' + req.param("id"));
    db.collection(mongoCollection).find({ id: req.param("id") }).toArray((err, result) => {
        if (err) return console.log(err);
        if (result == '') {
            res.statusCode = 404;
            res.render('404');
        } else {
            console.log('details success: ' + result);
            res.render('details', { rows: result });
        }
    });
});

app.get('/movies/create', function (req, res) {
    res.statusCode = 200;
    res.render('create', {
        showTitle: true,
        helpers: {
            namePlaceholder: function () { return 'Enter name'; },
            descriptionPlaceholder: function () { return 'Enter description'; },
            keywordsPlaceholder: function () { return 'Enter keywords'; }
        }
    });
});

app.post('/movies/create', upload.single('image'), function (req, res) {
    var isAlert = false;
    var alertMsg = '*It is required to fill this field in order to submit.';
    var fileAlertMsg = '*It is required to upload an image file.';
    var fileMimeAlertMsg = '*Uploaded file is not of a supported image type.';
    var name = {
        "text": req.body.name,
        "error": '',
        "alert": '',
        "placeholder": 'Enter name'
    };
    var description = {
        "text": req.body.description,
        "error": '',
        "alert": '',
        "placeholder": 'Enter description'
    };
    var keywords = {
        "text": req.body.keywords,
        "error": '',
        "alert": '',
        "placeholder": 'Enter keywords'
    };
    var picture = {
        "error": '',
        "message": ''
    };

    console.log();
    console.log('NAME: ' + name.text);
    console.log('DESCRIPTION: ' + description.text);
    console.log('KEYWORDS: ' + keywords.text);

    // Validating form inputs...
    if (name.text == '') {
        isAlert = true;
        name.error = 'has-error';
        name.alert = 'alert alert-danger';
        name.placeholder = alertMsg;
    }
    if (description.text == '') {
        isAlert = true;
        description.error = 'has-error';
        description.alert = 'alert alert-danger';
        description.placeholder = alertMsg;
    }
    if (keywords.text == '') {
        isAlert = true;
        keywords.error = 'has-error';
        keywords.alert = 'alert alert-danger';
        keywords.placeholder = alertMsg;
    }

    if (typeof (req.file) == 'undefined') {
        console.log('FILE IS UNDEFINED!!!');
        isAlert = true;
        picture.error = 'has-error';
        picture.message = fileAlertMsg;
    } else if (typeof (req.file.mimetype) == 'undefined' ||
        req.file.mimetype.substr(0, 6) != 'image/') {
        console.log('FILE HAS UNSUPPORTED MIME TYPE!!!');
        isAlert = true;
        picture.error = 'has-error';
        picture.message = fileMimeAlertMsg;
    } else {
        console.log('FILENAME: ' + req.file.originalname);
        console.log('FILEMIME: ' + req.file.mimetype);
        console.log('DESTNAME: ' + req.file.filename);
    }

    // Response
    if (isAlert) {
        res.statusCode = 200;
        res.render('create', {
            showTitle: true,
            helpers: {
                nameError: function () { return name.error; },
                nameAlert: function () { return name.alert; },
                namePlaceholder: function () { return name.placeholder; },
                descriptionError: function () { return description.error; },
                descriptionAlert: function () { return description.alert; },
                descriptionPlaceholder: function () { return description.placeholder; },
                keywordsError: function () { return keywords.error; },
                keywordsAlert: function () { return keywords.alert; },
                keywordsPlaceholder: function () { return keywords.placeholder; },
                pictureError: function () { return picture.error; },
                pictureAlertMsg: function () { return picture.message; }
            }
        });

    } else {

        var movie = {
            id: uuid(),
            name: req.body.name,
            description: req.body.description,
            keywords: req.body.keywords,
            image: req.file.filename
        };

        // NoSQL transaction
        db.collection(mongoCollection).save(movie, (err, result) => {
            if (err) return console.log(err);
            console.log('saved to database');
        });

        redisClient.set('george:uploadedImage', "uploads/" + req.file.filename);
        res.statusCode = 200;
        res.redirect('/movies');
    }

});


// Assig2,3 //////////////////////////////////////////////////////

app.get('/404', function (req, res) {
    res.statusCode = 404;
    console.log('not found');
    res.send('not found');
});

app.get('/protected', function (req, res) {
    res.statusCode = 401;
    console.log('protected');
    res.send('protected');
});

app.get('/error', function (req, res) {
    res.statusCode = 500;
    console.log('error');
    res.send('error');
});

app.get('/login', function (req, res) {
    res.statusCode = 200;
    console.log('login');
    res.sendFile(path.join(__dirname + '/pages/login.html'));
});

app.post('/login', function (req, res) {
    var jsonObject = {
        "username": req.body.username,
        "password": req.body.password
    };

    res.type('application/json');
    res.statusCode = 200;
    res.send(jsonObject);
});

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
});

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
});

app.post('*', function (req, res) {
    res.statusCode = 200;
    res.send('No resource found for this path.');
});