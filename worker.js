var express = require('express');
var app = express();
var redis = require('redis');
var sqlite = require('sqlite3');
var yamlConfig = require('node-yaml-config');
var redisConfig = yamlConfig.load('./redis.yml');
var sqliteConfig = yamlConfig.load('./sqlite.yml');
var tinifyConfig = yamlConfig.load('./tinify.yml');
var tinify = require('tinify');
var jimp = require('jimp');
var redisClient = redis.createClient(redisConfig.port, redisConfig.host);
redisClient.auth(redisConfig.authKey);
var redisSubsClient = redis.createClient(redisConfig.port, redisConfig.host);
redisSubsClient.auth(redisConfig.authKey);
var database = new sqlite.Database(sqliteConfig.path, sqlite.OPEN_READWRITE);
tinify.key = tinifyConfig.key;
var uploadedImage = null;

app.use(express.static(path.join(__dirname, 'uploads')));

redisSubsClient.on('connect', function() {
    console.log('Redis Subscriber connected');
});
redisClient.on('connect', function() {
    console.log('Redis Publisher connected');
});
redisSubsClient.config('set', 'notify-keyspace-events', 'KEA');
redisSubsClient.subscribe('__keyevent@0__:set', 'george:uploadedImage');



redisSubsClient.on('message', function(channel, key) {
    redisClient.get('george:uploadedImage', function(err, reply) {
        if (err) {
            console.error('Error getting key from redis: ' + err);
        } else if (reply) {
            try {
                redisClient.del('george:uploadedImage');
                var fullPath = reply;
                var imageName = reply.split('/');
                imageName = imageName[2];
                var compressedImagePath = __dirname + "/generated/compressed_" + imageName;
                var smallImagePath = __dirname + "/generated/small_" + imageName;
                var mediumImagePath = __dirname + "/generated/medium_" + imageName;
                var largeImagePath = __dirname + "/generated/large_" + imageName;
                
                tinify.fromFile(__dirname + '/uploads/' + fullPath).toFile(compressedImagePath, function(err) {
                    if (err) {
                        console.error('Error creating compressed image: ' + err);
                    } else {
                        database.serialize(function() {
                            var statement = database.prepare("UPDATE movies set compressed = (?) where original = (?)");
                            statement.run("/compressed_" + imageName, fullPath);
                            statement.finalize();
                        });
                        console.log('Compressed image created.');
                    }
                });
                
                jimp.read(__dirname + '/uploads/' + fullPath).then(function (lenna) {
                    lenna.resize(80, 120)        // resize
                    .quality(60)                 // set quality
                    .write(smallImagePath);      // save

                    database.serialize(function() {
                        var statement = database.prepare("UPDATE movies set thumb1 = (?) where original = (?)");
                            statement.run("/small_" + imageName, fullPath);
                            statement.finalize();
                        });
                        console.log('Small thumbnail image created.');

                }).catch(function (err) {
                    console.error('Error creating small thumbnail image: ' + err);
                });

   
                jimp.read(__dirname + '/uploads/' + fullPath).then(function (lenna) {
                    lenna.resize(110, 170)        // resize
                    .quality(60)                  // set quality
                    .write(mediumImagePath);      // save

                    database.serialize(function() {
                        var statement = database.prepare("UPDATE movies set thumb2 = (?) where original = (?)");
                            statement.run("/medium_" + imageName, fullPath);
                            statement.finalize();
                        });
                        console.log('Medium thumbnail image created.');

                }).catch(function (err) {
                    console.error('Error creating medium thumbnail image: ' + err);
                });

                jimp.read(__dirname + '/uploads/' + fullPath).then(function (lenna) {
                    lenna.resize(110, 170)       // resize
                    .quality(60)                 // set quality
                    .write(largeImagePath);      // save

                    database.serialize(function() {
                        var statement = database.prepare("UPDATE movies set thumb3 = (?) where original = (?)");
                            statement.run("/large_" + imageName, fullPath);
                            statement.finalize();
                        });
                    console.log('Large thumbnail image created.');

                }).catch(function (err) {
                    console.error('Error creating large thumbnail image: ' + err);
                });
       
      
            } catch (err) {
                console.error('Error creating thumbnails images: ' + err);
            }
        }
    });
});