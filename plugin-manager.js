'use strict';
var debug = require('debug')('plugin_manager'),
    npmi = require('npmi');

var pm = module.exports = {};

pm.init = function(plugins) {
    debug('init');
    this.plugins = plugins;
};

pm.installPlugins = function() {
    debug('installPlugins');

    var plugins = pm.plugins,
        promises = [];
    // add each plugin to package.json
    for (var key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            promises.push(pm.installPlugin(key, plugins[key]));
        }
    }

    return Promise.all(promises);
};

pm.installPlugin = function(package_name, version) {
    debug('installPlugin', package_name, version);
    var options = {
        name: package_name, // your module name
        npmLoad: { // npm.load(options, callback): this is the "options" given to npm.load()
            loglevel: 'silent' // [default: {loglevel: 'silent'}]
        }
    };
    if (version) {
        options.version = version;
    }
    return new Promise(function(resolve, reject) {
        npmi(options, function(err, result) {
            if (err) {
                /* istanbul ignore if  */
                if (err.code === npmi.LOAD_ERR) {
                    debug('npm load error');
                } else if (err.code === npmi.INSTALL_ERR) {
                    debug('npm install error');
                }
                reject(err);
                return;
            }
            // installed
            debug(options.name + '@' + options.version + ' installed successfully in ' + options.path);
            resolve(result);
        });
    });
};
