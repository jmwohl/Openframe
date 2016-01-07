'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var fs = require('fs'),
    url = require('url'),
    http = require('http'),
    exec = require('child_process').exec;

// unused at present
function _mkdirp(dir) {
    var mkdir = 'mkdir -p ' + dir;
    exec(mkdir, function(err) {
        if (err) {
            throw err;
        }
    });
}

/**
 * Download a file using HTTP get.
 *
 * TODO: use Promises instead of a callback.
 *
 * @param  {String}   file_url
 * @param  {String}   file_output_name
 * @param  {Function} cb
 */
function downloadFile(file_url, file_output_name, cb) {
    var options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    var file_name = file_output_name,
        file_path = './artwork/' + file_name,
        file = fs.createWriteStream(file_path);

    http.get(options, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            cb(file);
            console.log(file_name + ' downloaded to ./artwork/');
        });
    });
}

exports.downloadFile = downloadFile;