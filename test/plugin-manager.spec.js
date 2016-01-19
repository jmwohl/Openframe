var assert = require('assert'),
    npm = require('npm'),
    pm = require('../plugin-manager');

var plugins = {
    "openframe-keystroke": "git+https://git@github.com/jmwohl/Openframe-Keystroke.git"
};

before(function() {
    pm.init(plugins);
});

afterEach(function(done) {
    this.timeout(0);
    npm.load({
        logLevel: 'silent'
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        npm.commands.remove(['openframe-keystroke', 'lodash'], function(err, data) {
            if (err) {
                console.error(err);
            }
            // command succeeded, and data might have some info
            done();
        });
    });
});

describe('init', function() {
    it('should store a local reference to the plugin list', function(done) {
        assert.equal(pm.plugins["openframe-keystroke"], "git+https://git@github.com/jmwohl/Openframe-Keystroke.git");
        done();
    });
});

describe('installPlugin', function() {
    this.timeout(0);
    it('should install an npm package with a version specified', function(done) {
        pm.installPlugin("openframe-keystroke", "git+https://git@github.com/jmwohl/Openframe-Keystroke.git")
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['openframe-keystroke'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        // command succeeded, and data might have some info
                        done();
                    });
                });

            });
    });

    it('should install an npm package without a version specified', function(done) {
        pm.installPlugin("lodash")
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['lodash'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        // command succeeded, and data might have some info
                        done();
                    });
                });

            });
    });

    it('should fail to install an npm package that does not exist', function(done) {

        pm.installPlugin("openframe-this-is-not-real")
            .catch(function(err) {
                console.log(err);
                // assert.equal(err)
                done();
            });
    });

});


describe('installPlugins', function() {
    this.timeout(0);
    it('should install all plugins that were passed in on init', function(done) {
        pm.installPlugins()
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['openframe-keystroke'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        // command succeeded, and data might have some info
                        done();
                    });
                });

            });
    });
});
