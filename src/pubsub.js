var faye = require('faye'),
    config = require('./config'),
    frame = require('./frame'),
    debug = require('debug')('openframe:pubsub'),
    rest = require('./rest'),
    ps = module.exports = {};

ps.client = {};

ps.init = function(fc) {
    return rest.client.OpenframeUser.OpenframeUser_config()
        .then(function(conf_resp) {
            debug(conf_resp);
            config.ofrc.pubsub_url = conf_resp.obj.config.pubsub_url;
            return config.save();
        })
        .then(function() {

            var pubsub_url = config.ofrc.pubsub_url;

            debug(pubsub_url);

            // add a pubsub client for the API server
            ps.client = new faye.Client(pubsub_url);
            // handlers for pubsub connection events
            ps.client.on('transport:down', function() {
                // the pubsub client is offline
                debug('pubsub client dsconnected');
            });

            ps.client.on('transport:up', function() {
                // the pubsub client is online
                debug('pubsub client connected');
                ps.client.publish('/frame/connected', frame.state.id);
            });

            ps.client.subscribe('/frame/' + frame.state.id + '/db_updated', function(data) {
                debug('/frame/' + frame.state.id + '/db_updated', data);

                frame.state = data;
                frame.persistStateToFile().then(fc.updateFrame);
            });

            ps.client.subscribe('/frame/' + frame.state.id + '/paired', function(data) {
                debug('/frame/' + frame.state.id + '/paired', data);
                fc.ready();
                // frame updated event handled, hand off frame updating logic to frame controller
                // fc.updateFrame(data);
            });

            fc.pubsub = ps.client;

            return ps.client;
        });

};
