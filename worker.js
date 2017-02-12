var express = require('express');
var app = express();
var redis = require('redis');
var path = require('path');
const MongoClient = require('mongodb').MongoClient;
var yamlConfig = require('node-yaml-config');
var mongoConfig = yamlConfig.load('./mongo.yml');
var redisConfig = yamlConfig.load('./redis.yml');
var tinifyConfig = yamlConfig.load('./tinify.yml');
var tinify = require('tinify');
var jimp = require('jimp');
var redisClient = redis.createClient(redisConfig.port, redisConfig.host);
redisClient.auth(redisConfig.authKey);
var redisSubsClient = redis.createClient(redisConfig.port, redisConfig.host);
redisSubsClient.auth(redisConfig.authKey);
tinify.key = tinifyConfig.key;
var uploadedImage = null;

// app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static('uploads'));

redisSubsClient.on('connect', function () {
    console.log('Redis Subscriber connected');
});
redisClient.on('connect', function () {
    console.log('Redis Publisher connected');
});
redisSubsClient.config('set', 'notify-keyspace-events', 'KEA');
redisSubsClient.subscribe('__keyevent@0__:set', 'george:uploadedImage');



redisSubsClient.on('message', function (channel, key) {
    redisClient.get('george:uploadedImage', function (err, reply) {
        if (err) {
            console.error('Error getting key from redis: ' + err);
        } else if (reply) {
            try {
                redisClient.del('george:uploadedImage');
                var fullPath = reply;
                var fileName = reply.split('/');
                fileName = fileName[1];
                var compressedImagePath = __dirname + '/generated/compressed_' + fileName;
                var smallImagePath = __dirname + '/generated/small_' + fileName;
                var mediumImagePath = __dirname + '/generated/medium_' + fileName;
                var largeImagePath = __dirname + '/generated/large_' + fileName;

                tinify.fromFile(__dirname + '/' + fullPath).toFile(compressedImagePath, function (err) {
                    if (err) {
                        console.error('Error creating compressed image: ' + err);
                    } else {
                        MongoClient.connect(mongoConfig.url, function (err, db) {
                            var moviesCollection = db.collection(mongoConfig.collection).update(
                                { original: fileName },
                                { $set: { compressed: "compressed_" + fileName } });
                            db.close();
                        });
                        console.log('Compressed image created.');
                    }
                });

                jimp.read(__dirname + '/' + fullPath).then(function (lenna) {
                    lenna.resize(80, 120)        // resize
                        .quality(60)                 // set quality
                        .write(smallImagePath);      // save

                    MongoClient.connect(mongoConfig.url, function (err, db) {
                        var moviesCollection = db.collection(mongoConfig.collection).update(
                            { original: fileName },
                            { $set: { thumb1: "small_" + fileName } });
                        db.close();
                    });
                    console.log('Small thumbnail image created.');

                }).catch(function (err) {
                    console.error('Error creating small thumbnail image: ' + err);
                });


                jimp.read(__dirname + '/' + fullPath).then(function (lenna) {
                    lenna.resize(110, 170)        // resize
                        .quality(60)                  // set quality
                        .write(mediumImagePath);      // save

                    MongoClient.connect(mongoConfig.url, function (err, db) {
                        var moviesCollection = db.collection(mongoConfig.collection).update(
                            { original: fileName },
                            { $set: { thumb2: "medium_" + fileName } });
                        db.close();
                    });
                    console.log('Medium thumbnail image created.');

                }).catch(function (err) {
                    console.error('Error creating medium thumbnail image: ' + err);
                });

                jimp.read(__dirname + '/' + fullPath).then(function (lenna) {
                    lenna.resize(110, 170)       // resize
                        .quality(60)                 // set quality
                        .write(largeImagePath);      // save

                    MongoClient.connect(mongoConfig.url, function (err, db) {
                        var moviesCollection = db.collection(mongoConfig.collection).update(
                            { original: fileName },
                            { $set: { thumb3: "large_" + fileName } });
                        db.close();
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