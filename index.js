// to start frame, run `$ npm start`
//
//
/**
 *
 * - read config file for email, password, framename
 * - if not found, prompt user for these details and save them to the file
 * - authenticate user
 * - install plugins
 * - initialize plugins
 * - fetch current artwork
 */

'use strict';

var jsonfile = require('jsonfile'),
    inquirer = require('inquirer'),
    config = require('./config'),
    FrameController = require('./controller');

var ofrc_file = './.ofrc';

/**
 * Read ofrc, and ask user about missing info
 */
jsonfile.readFile(ofrc_file, function(err, ofrc) {
    if (err) {
        console.error(err);
        return;
    }
    var auth = ofrc.auth || {},
        settings = ofrc.settings || {},
        questions = [];

    if (!auth.email) {
        // ask for user
        questions.push({
            name: 'email',
            message: 'Enter your Openframe username (email):'
        });
    }

    if (!auth.password) {
        // ask for pass
        questions.push({
            name: 'password',
            message: 'Enter your Openframe password:'
        });
    }

    if (!settings.frame_name) {
        // ask frame name
        questions.push({
            name: 'frame_name',
            message: 'Enter a name for this Frame:'
        });
    }

    if (questions.length) {
        inquirer.prompt(questions, function(answers) {
            saveAnswers(answers, ofrc);
        });
    } else {
        init(ofrc);
    }
});

/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 */
function saveAnswers(answers, ofrc) {
    if (!ofrc.auth) {
        ofrc.auth = {};
    }
    if (!ofrc.settings) {
        ofrc.settings = {};
    }
    if (answers) {
        if (answers.email) {
            ofrc.auth.email = answers.email;
        }
        if (answers.password) {
            ofrc.auth.password = answers.password;
        }
        if (answers.frame_name) {
            ofrc.settings.frame_name = answers.frame_name;
        }
    }

    jsonfile.writeFile(ofrc_file, ofrc, {
        spaces: 2
    }, function(err) {
        console.error(err);
        if (err) {
            return;
        }
        init(ofrc);
    });
}

/**
 * Start up the frame
 */
function init(ofrc) {
    // instantiate the frame controller
    new FrameController(ofrc);
}

