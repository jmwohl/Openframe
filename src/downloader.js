'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var pexec = require('./process-manager').pexec,
    debug = require('debug')('openframe:downloader'),
    artworkDir = '/tmp';

/**
 * Download a file using HTTP get.
 *
 * @param  {String}   file_url
 * @param  {String}   file_output_name
 */
function downloadFile(file_url, file_output_name) {
    return new Promise(function(resolve, reject) {
        var file_name = file_output_name,
            file_path = artworkDir + '/' + file_name;

        pexec('wget -O ' + file_path + ' ' + file_url)
            .then(function() {
                resolve(file_path);
            })
            .catch(reject);
    });

}

exports.downloadFile = downloadFile;
