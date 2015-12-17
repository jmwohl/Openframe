'use strict';

var faye = require('faye');

// add a pubsub client for the API server
var pubsub = new faye.Client('http://localhost:8889/faye');

// handlers for pubsub connection events
pubsub.on('transport:down', function() {
    // the pubsub client is offline
    console.log('pubsub client dsconnected');
    pubsub.publish('/frame/disconnected', '566b234f0ddfd681376d30fc');
});

pubsub.on('transport:up', function() {
    // the pubsub client is online
    console.log('pubsub client connected');
    pubsub.publish('/frame/connected', '566b234f0ddfd681376d30fc');
});

pubsub.subscribe('/frame/updated/*', function(data) {
    console.log(data);
});

module.exports = pubsub;