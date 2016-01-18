'use strict';

var rest = require('./rest'),
    Swagger = require('swagger-client');

module.exports = (function() {
    function login(creds) {
        console.log('creds', creds);

        var client = rest.getClient();

        return new Promise(function(resolve, reject) {
            client.OpenframeUser.OpenframeUser_login({credentials: creds})
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
    }

    return {
        login: login
    };
})();