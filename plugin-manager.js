'use strict';
var debug = require('debug')('plugin_manager'),
    npmi = require('npmi'),
    path = require('path'),
    fs = require('fs'),
    execFile = require('child_process').execFile;

var pm = module.exports = {};

/**
 * Initialize plugins module
 *
 * @param  {Object} ofrc config object
 */
pm.init = function(config) {
    debug('init');
    this.config = config;
    this.plugins = config.ofrc.frame.plugins;
};

/**
 * Install all plugins in local plugins hash
 *
 * @return {Promise} A promise resolved with all of the npmi results for each plugin
 */
pm.installPlugins = function(plugins) {
    debug('installPlugins');

    var promises = [];

    // add each plugin to package.json
    for (var key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            promises.push(_installPlugin(key, plugins[key]));
        }
    }

    return Promise.all(promises);
};

/**
 * Add a new plugin to this frame.
 *
 * Installs the plugin, and if that's successful then adds it to the plugins list.
 *
 * TODO: deal with conflicting versions of plugins
 *
 * @param  {String} package_name NPM package name
 * @param  {String} version      NPM package version (or repo URL for plugins not in NPM)
 * @return {Promise} A promise resolving with the result from npmi
 */
pm.addPlugin = function(package_name, version) {
    debug('addPlugin', package_name, version);
    return new Promise(function(resolve, reject) {
        pm.installPlugin(package_name, version)
            .then(function() {
                pm.plugins[package_name] = version;
                pm.config.save();
                resolve(package_name);
            })
            .catch(function(err) {
                debug(err);
                reject(err);
            });
    });
};

/**
 * Initialize plugins.
 *
 * @param  {String} plugin
 * @param  {Object} fc A reference to the FrameController instance
 */
pm.initPlugins = function(plugins, fc) {
    debug('initPlugins', plugins);
    var promises = [];

    // add each plugin to package.json
    for (var key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            promises.push(_initPlugin(key, fc));
        }
    }

    return Promise.all(promises);
};

/**
 * Install a single plugin via NPM
 *
 * Uses npmi module as a programmatic wrapper on npm
 *
 * @private
 *
 * @param  {String} package_name NPM package name
 * @param  {String} version      NPM package version (or repo URL for plugins not in NPM)
 * @return {Promise} A promise resolving with the result from npmi
 */
function _installPlugin(package_name, version) {
    debug('installPlugin', package_name, version);
    var options = {
        pkgName: package_name, // your module name
        forceInstall: false,
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
                // TODO - notify user that installing the npm package failed.
                resolve(result);
            } else {
                // installed
                debug(options.pkgName + '@' + options.version + ' installed successfully');
                resolve(result);
            }
        });
    });
}

/**
 * Initialize a single plugin.
 *
 * If the plugin has an install.sh file, execute it. Then call the plugin's init method
 * passing in a reference to the frame controller.
 *
 * TODO: initialize plugins with sandboxed API?
 * - addFormat
 * - installDeps (?)
 *
 * TODO: should install.sh execute as part of NPM install?
 *
 * @private
 *
 * @param  {String} plugin_name
 * @param  {Object} fc A reference to the frame controller instance
 * @return {Promise}
 */
function _initPlugin(plugin_name, fc) {
    debug('_initPlugin', plugin_name);
    var plugin,
        location = require.resolve(plugin_name),
        plugin_dir,
        install_sh_path;
    if (!location) {
        debug('ERROR - could not resolve plugin... is it installed?');
        return;
    }
    plugin_dir = path.dirname(location);
    install_sh_path = [plugin_dir, 'install.sh'].join(path.sep);

    return new Promise(function(resolve, reject) {

        // once we're ready, do the plugin init dance and resolve
        function _init() {
            debug('_initPlugin _init');
            try {
                plugin = require(plugin_name);
                plugin.init(fc);
                resolve(plugin);
            } catch (e) {
                // problem trying to require plugin
                debug('ERROR - ', e);
                reject(e);
            }
        }

        _init();
        // see if there is an install.sh script included with this plugin
        // fs.access(install_sh_path, fs.F_OK, function(err) {
        //     if (err) {
        //         debug('fs.access', err);
        //         // error, meaning NO install script... ass-u-me all good, init the plugin.
        //         _init();
        //     } else {
        //         debug('fs.access success');
        //         // no error, install.sh found, run install script
        //         _runInstallScript(install_sh_path)
        //             .then(_init);
        //     }
        // });

        // Do we want to let plugins define openframe plugin dependencies like this?
        // if (plugin.dependecies) {

        // }
    });
}

function _runInstallScript(path) {
    return new Promise(function(resolve, reject) {
        execFile('sh', [path], function(err, stdout, stderr) {
            debug('stdout', stdout);
            debug('stderr', stderr);
            if (err) {
                debug(err);
                reject(err);
                return;
            }
            resolve();
        });
    });
}
