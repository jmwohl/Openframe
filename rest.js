'use strict';

module.exports = (function() {
    var _client;

    function getClient() {
        return _client;
    }

    function setClient(client) {
        _client = client;
    }

    return {
        getClient: getClient,
        setClient: setClient
    };
})();