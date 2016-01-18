'use strict';

var faye = require('faye');

var ps = module.exports = {};

ps.init = function(fc) {
    ps.fc = fc;
    var frame = fc.config.ofrc.frame;

    // add a pubsub client for the API server
    ps.client = new faye.Client('http://localhost:8889/faye');

    // handlers for pubsub connection events
    ps.client.on('transport:down', function() {
        // the pubsub client is offline
        console.log('pubsub client dsconnected');
    });

    ps.client.on('transport:up', function() {
        // the pubsub client is online
        console.log('pubsub client connected');
        ps.client.publish('/frame/connected', frame.id);
    });

    ps.client.subscribe('/frame/updated/'+frame.id, function(data) {
        console.log(data);
        ps.fc.updateFrame()
            .then(ps.fc.changeArtwork);
    });

    return ps.client;
};