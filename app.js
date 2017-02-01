// Create a program that outputs the HTTP method, Path, Port, 
// and Header fields as a JSON object on the body of the Web 
// server's response.

var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db/movies.db');
var shortid = require('shortid');

var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate() + '.' + file.mimetype.split('/')[1]);
    }
});
var upload = multer({ storage: storage });

var allowedMethods = ['GET', 'POST', 'PUT'];


// Register `hbs.engine` with the Express app.
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// db.serialize(function () {
//     db.run("CREATE TABLE if not exists user_info (info TEXT)");
//     var stmt = db.prepare("INSERT INTO user_info VALUES (?)");
//     for (var i = 0; i < 10; i++) {
//         stmt.run("Ipsum " + i);
//     }
//     stmt.finalize();

//     db.each("SELECT rowid AS id, info FROM user_info", function (err, row) {
//         console.log(row.id + ": " + row.info);
//     });
// });

// db.close();

// //Perform SELECT Operation
// db.all("SELECT * from blah blah blah where this=" + that, function (err, rows) {
//     //rows contain values while errors, well you can figure out.
// });

// //Perform INSERT operation.
// db.run("INSERT into table_name(col1,col2,col3) VALUES (val1,val2,val3)");

// //Perform DELETE operation
// db.run("DELETE * from table_name where condition");

// //Perform UPDATE operation
// db.run("UPDATE table_name where condition");

// Handlebars

app.get('/example', function (req, res) {
    console.log('Sample Shortid: ' + shortid.generate());
    //PPBqWA9
    res.render('home');
});

app.get('/movies/create', function (req, res) {
    res.render('create', {
        showTitle: true,
        helpers: {
                namePlaceholder: function () { return 'Enter name'; },
                descriptionPlaceholder: function () { return 'Enter description'; },
                keywordsPlaceholder: function () { return 'Enter keywords'; }
            }
    });
});

app.post('/movies/create', upload.single('picture'), function (req, res) {
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
        res.send('uploaded!');
    }

    // SQLite transaction
    var sampledb = new sqlite3.Database('db/example.db');
    sampledb.serialize(function () {
        sampledb.run("CREATE TABLE if not exists user_info (info TEXT)");
        var stmt = sampledb.prepare("INSERT INTO user_info VALUES (?)");
        for (var i = 0; i < 10; i++) {
            stmt.run("Ipsum " + i);
        }
        stmt.finalize();

        sampledb.each("SELECT rowid AS id, info FROM user_info", function (err, row) {
            console.log(row.id + ": " + row.info);
        });
    });

    sampledb.close();
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

// LISTEN
app.listen(8085, function () {
    console.log('Example app listening on port 8085!');
});