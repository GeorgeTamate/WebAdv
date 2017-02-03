var express = require('express');
var app = express();
var redis = require('redis');
var sqlite3 = require('sqlite3');
var yamlConfig = require('node-yaml-config');
var redisConfig = yamlConfig.load('./redis.yml');
var sqliteConfig = yamlConfig.load('./sqlite.yml');
var tinifyConfig = yamlConfig.load('./tinify.yml');
var tinify = require('tinify');
var sharp = require('sharp');
var redisClient = redis.createClient(redisConfig.port, redisConfig.host);
redisClient.auth(redisConfig.authKey);
var redisSubsClient = redis.createClient(redisConfig.port, redisConfig.host);
redisSubsClient.auth(redisConfig.authKey);
var db = new sqlite3.Database(sqliteConfig.path, sqlite3.OPEN_READWRITE);
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
                var fileName = reply.split('/');
                fileName = fileName[2];
                
                var compressedFilePath = __dirname + "/generated/compressed_" + fileName;
                var smallFilePath = __dirname + "/generated/small_" + fileName;
                var mediumFilePath = __dirname + "/generated/medium_" + fileName;
                var largeFilePath = __dirname + "/generated/large_" + fileName;
                
                tinify.fromFile(__dirname + '/uploads/' + fullPath).toFile(compressedFilePath, function(err) {
                    if (err) {
                        console.error('Error creating compressed image: ' + err);
                    } else {
                        db.serialize(function() {
                            var statement = db.prepare("UPDATE movies set compressed = (?) where original = (?)");
                            statement.run("/compressed_" + fileName, fullPath);
                            statement.finalize();
                        });
                        console.log('Compressed image created');
                    }
                });
                sharp(__dirname + '/uploads/' + fullPath).resize(80, 120, { centerSampling: true }).toFile(smallFilePath, function(err, info) {
                    if (err) {
                        console.error('Error creating small thumbnail: ' + err);
                    } else {
                        db.serialize(function() {
                            var statement = db.prepare("UPDATE movies set thumb1 = (?) where original = (?)");
                            statement.run("/small_" + fileName, fullPath);
                            statement.finalize();
                        });
                        console.log('Small thumbnail created');
                    }
                });
                sharp(__dirname + '/uploads/' + fullPath).resize(110, 170, { centerSampling: true }).toFile(mediumFilePath, function(err, info) {
                    if (err) {
                        console.error('Error creating medium thumbnail: ' + err);
                    } else {
                        db.serialize(function() {
                            var statement = db.prepare("UPDATE movies set thumb2 = (?) where original = (?)");
                            statement.run("/medium_" + fileName, fullPath);
                            statement.finalize();
                        });
                        console.log('Medium thumbnail created');
                    }
                });
                sharp(__dirname + '/uploads/' + fullPath).resize(150, 210, { centerSampling: true }).toFile(largeFilePath, function(err, info) {
                    if (err) {
                        console.error('Error creating large thumbnail: ' + err);
                    } else {
                        db.serialize(function() {
                            var statement = db.prepare("UPDATE movies set thumb3 = (?) where original = (?)");
                            statement.run("/large_" + fileName, fullPath);
                            statement.finalize();
                        });
                        console.log('Large thumbnail created');
                    }
                });
            } catch (err) {
                console.error('Error creating thumbnails: ' + err);
            }
        }
    });
});