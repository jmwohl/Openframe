'use strict';

/**
 * Configuration module
 */

var jsonfile = require('jsonfile');

var ofrc_file = './.ofrc',
    conf = {};

/**
 * try to detect the device platform (i.e. linux, mac, windows)
 * @return {String} the platform
 */
function getPlatform() {
    console.log(process.platform);

    if (/^linux/.test(process.platform)) {
        return 'linux';
    } else if(/^darwin/.test(process.platform)) {
        return 'mac';
    } else {
        return 'windows';
    }
}

function Config() {
    this.ofrc = {};
}

// Config.prototype.ofrc = {

// };

Config.prototype.save = function() {
    console.log('Config.save', this.ofrc);
    var self = this;
    var p = new Promise(function(resolve, reject) {
        jsonfile.writeFile(ofrc_file, self.ofrc, {
            spaces: 2
        }, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(self.ofrc);
        });
    });

    return p;
};

Config.prototype.load = function() {
    console.log('Config.load');
    var self = this;
    var p = new Promise(function(resolve, reject) {
        jsonfile.readFile(ofrc_file, function(err, ofrc) {
            if (err) {
                reject(err);
                return;
            }
            console.log('ofrc loaded: ', ofrc);
            self.ofrc = ofrc;
            resolve(self.ofrc);
        });
    });

    return p;
};

module.exports = new Config();

// var default_conf = {
//     api_protocol: 'http',
//     api_domain: 'localhost',
//     api_port: '8888',
//     download_dir: './artwork/',
//     platform: getPlatform()
// };

// module.exports = {
//     options: {},
//     set: function(obj) {
//         this.options = obj;
//     }
// };

// module.exports = (function() {
//     var options = {
//         api_protocol: 'http',
//         api_domain: 'localhost',
//         api_port: '8888',
//         download_dir: './artwork/',
//         platform: getPlatform()
//     };

//     function option(name, value) {
//         if (!name) {
//             return undefined;
//         }

//         if (value !== undefined) {
//             options[name] = value;
//         }
//         return options[name];
//     }

//     return option;
// })();
