'use strict';

/**
 * The main controller for the frame.
 */

// app dependencies
var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Swagger = require('swagger-client');

var config = require('./config'),
    downloader = require('./downloader'),
    url = require('url'),
    path = require('path'),
    PluginManager = require('./plugin-manager'),
    pubsub = require('./pubsub'),
    proc_man = require('./process-manager'),
    aw = require('./artwork'),
    brightness = require('brightness');

// set all downloads to go to the correct spot
downloader.setDownloadDir(config('download_dir'));






var FrameController = function() {
    this.pluginManager = new PluginManager(this, pubsub);

    this.rest = new Swagger({
            url: 'http://localhost:8888/explorer/swagger.json',
            usePromise: true
        })
        .then(function(client) {
            console.log('client', client.OpenframeUser.OpenframeUser_login);
            var creds = {
                email: "test@openframe.io",
                password: "asdf"
            };
            client.OpenframeUser.OpenframeUser_login({credentials: creds})
                .then(function(resp) {
                    console.log('resp', resp);
                })
                .catch(function(err) {
                    console.log('err', err);
                });
        });

    if (config('install_plugins')) {
        console.log('loading plugins');
        this.pluginManager.installPlugins();
    } else {
        this.pluginManager.initPlugins(pubsub);
    }
};

// inherit from EventEmitter
util.inherits(FrameController, EventEmitter);

// pubsub.

// // wire up default pubsub 'command' events
// pubsub.on('command:artwork:update', changeArtwork);
// pubsub.on('command:display:rotate', rotateDisplay);
// pubsub.on('command:display:brightness', setBrightness);
// pubsub.on('command:display:on', displayOn);
// pubsub.on('command:display:off', displayOff);

/**
 * Display an artwork.
 * @param  {Object} artwork
 */
FrameController.prototype.changeArtwork = function(artwork) {
    console.log(artwork);

    var curArt = aw.getCurrentArtwork();

    if (artwork.format.download) {
        var parsed = url.parse(artwork.url),
            file_name = path.basename(parsed.pathname);

        downloader.downloadFile(artwork.url, artwork._id + file_name, function(file) {
            console.log('file downloaded: ', file);
            var command = artwork.format.start_command + ' ' + file.path;
            console.log(command);
            if (curArt) {
                proc_man.exec(curArt.format.end_command, function() {
                    proc_man.startProcess(command);
                    // proc_man.killCurrentProcess();
                    aw.setCurrentArtwork(artwork);
                });
            } else {
                proc_man.startProcess(command);
                // proc_man.killCurrentProcess();
                aw.setCurrentArtwork(artwork);
            }
        });
    } else {
        var command = artwork.format.start_command + ' ' + artwork.url;
        console.log(command);
        if (curArt) {
            proc_man.exec(curArt.format.end_command, function() {
                proc_man.startProcess(command);
                // proc_man.killCurrentProcess();
                aw.setCurrentArtwork(artwork);
            });
        } else {
            proc_man.startProcess(command);
            // proc_man.killCurrentProcess();
            aw.setCurrentArtwork(artwork);
        }
    }
};

/**
 * Turn on the frame display.
 */
FrameController.prototype.displayOn = function() {
    switch (config.option('platform')) {
        case 'mac':
            break;
        case 'windows':
            break;
        default:
            // linux
    }
};

/**
 * Turn off the frame display.
 * @return {[type]} [description]
 */
FrameController.prototype.displayOff = function() {
    switch (config.option('platform')) {
        case 'mac':
            break;
        case 'windows':
            break;
        default:
            // linux
    }
};

/**
 * Set the frame brightness.
 * @param {Number} val Brightness value between 0 and 1
 */
FrameController.prototype.setBrightness = function(val) {
    brightness.set(val, function() {
        console.log('brightness set to: ', val);
    });
};

/**
 * Set the frame display rotation.
 * @param  {Number} val Rotation value in degrees: 0, 90, 180, or 270
 */
FrameController.prototype.rotateDisplay = function(val) {
    // TODO
};

module.exports = FrameController;
