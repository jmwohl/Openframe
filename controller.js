'use strict';

/**
 * The main controller for the frame.
 */

// app dependencies
var util = require('util'),
    debug = require('debug')('frame_controller'),
    EventEmitter = require('events').EventEmitter,
    Swagger = require('swagger-client');

var downloader = require('./downloader'),
    pubsub = require('./pubsub'),
    url = require('url'),
    path = require('path'),
    aw = require('./artwork'),
    proc_man = require('./process-manager'),
    PluginManager = require('./plugin-manager'),
    config = require('./config');

// set all downloads to go to the correct spot
// downloader.setDownloadDir(config('download_dir'));


var fc = module.exports = {};

// inherit from EventEmitter
util.inherits(fc, EventEmitter);

/**
 * Initialize the frame controller
 * - generate Swagger client
 * - login user
 * - connect frame
 * TODO:
 * - load plugins
 */
fc.init = function() {
    debug('init');

    this.config = config;

    this.buildRestClient()
        .then(this.login)
        .then(this.connect)
        .then(this.ready)
        .catch(function(err) {
            debug(err);
        });
};

fc.buildRestClient = function() {
    debug('buildRestClient');

    return new Promise(function(resolve, reject) {
        new Swagger({
            url: 'http://localhost:8888/explorer/swagger.json',
            usePromise: true
        }).then(function(client) {
            // To see all available methods:
            // debug(client);
            fc.client = client;
            resolve(client);
        }).catch(function(err) {
            reject(err);
        });
    });
};

fc.login = function(client) {
    debug('login');

    var creds = fc.config.ofrc.auth;
    return new Promise(function(resolve, reject) {
        client.OpenframeUser.OpenframeUser_login({
                credentials: creds
            })
            .then(function(resp) {
                if (resp.obj.id) {
                    creds.access_token = resp.obj.id;
                    client.clientAuthorizations.add('access_token', new Swagger.ApiKeyAuthorization('access_token', resp.obj.id, 'query'));
                }
                resolve(resp.obj.userId);
            })
            .catch(function(err) {
                console.log('err', err);
                reject(err);
            });
    });
};

/**
 * Connect this Frame. If the Frame has not yet been created, i.e. there is no
 * id on the Frame object in ofrc, create a new Frame.
 *
 * @param  {[type]} userId [description]
 * @return {[type]}        [description]
 */
fc.connect = function(userId) {
    debug('connect', userId);

    return new Promise(function(resolve, reject) {
        // called when frame is ready to connect
        function readyToConnect() {
            fc.pubsub = pubsub.init(fc);
            resolve();
        }

        // do we already have an id? if so pull latest state

        fc.updateFrame()
            .then(readyToConnect)
            .catch(function(err) {
                // In case of 404, we can capture here...
                // var code = err.errObj.response.statusCode;

                // the Frame is either not stored locally, or is missing
                // on the server.
                fc.registerNewFrame(userId)
                    .then(readyToConnect)
                    .catch(reject);
            });
    });
};

/**
 * Grab and store the latest Frame state from the server.
 * @return {Promise}
 */
fc.updateFrame = function() {
    debug('updateFrame', fc.client);

    var frame = fc.config.ofrc.frame;

    return new Promise(function(resolve, reject) {
        if (frame && frame.id) {
            fc.client.Frame.Frame_findById({id: frame.id})
                .then(function(data) {
                    debug('Frame_findById', data);
                    var frame = data.obj;
                    fc.config.ofrc.frame = frame;
                    fc.config.save();
                    resolve(frame);
                })
                .catch(reject);
        } else {
            reject();
        }
    });
};

/**
 * Register this as a new frame for user [userId]. This creates a new
 * Frame object on the server via the REST api.
 *
 * @param  {[type]} userId [description]
 * @return {[type]}        [description]
 */
fc.registerNewFrame = function(userId) {
    debug('registerNewFrame', userId);

    var frame = fc.config.ofrc.frame;
    return new Promise(function(resolve, reject) {
        fc.client.OpenframeUser.OpenframeUser_prototype_create_frames({
                data: {
                    name: frame.name,
                    settings: {}
                },
                id: userId
            })
            .then(function(data) {
                var frame = data.obj;
                fc.config.ofrc.frame = frame;
                fc.config.save();
                resolve(frame);
            })
            .catch(reject);
    });
};

/**
 * Called when the frame has finished initializing.
 */
fc.ready = function() {
    debug('ready', fc.config.ofrc.frame);
    var frame = fc.config.ofrc.frame;

    if (frame && frame._current_artwork) {
        fc.changeArtwork();
    }
};


/**
 * Change the artwork being displayed.
 *
 * TODO: clean this up, for the love of God.
 */
fc.changeArtwork = function() {
    var frame = fc.config.ofrc.frame,
        artwork = frame._current_artwork,
        curArt = aw.getCurrentArtwork();

    if (artwork._format.download) {
        var parsed = url.parse(artwork.url),
            file_name = path.basename(parsed.pathname);

        downloader.downloadFile(artwork.url, artwork._id + file_name, function(file) {
            console.log('file downloaded: ', file);
            var command = artwork._format.start_command + ' ' + file.path;
            console.log(command);
            if (curArt) {
                proc_man.exec(curArt._format.end_command, function() {
                    proc_man.startProcess(command);
                    aw.setCurrentArtwork(artwork);
                });
            } else {
                proc_man.startProcess(command);
                aw.setCurrentArtwork(artwork);
            }
        });
    } else {
        var command = artwork._format.start_command + ' ' + artwork.url;
        console.log(command);
        if (curArt) {
            proc_man.exec(curArt._format.end_command, function() {
                proc_man.startProcess(command);
                aw.setCurrentArtwork(artwork);
            });
        } else {
            proc_man.startProcess(command);
            aw.setCurrentArtwork(artwork);
        }
    }
};