// to start frame, run `$ npm start`
//
//
/**
 *
 * - read config file for email, password, framename
 * - if not found, prompt user for these details and save them to the file
 * - authenticate user
 * - if this frame is already registered with user, connect it
 * - if this frame is new, create it and add it to the user
 * - install plugins
 * - initialize plugins
 * - fetch current artwork
 */

'use strict';

var inquirer = require('inquirer'),
    config = require('./config'),
    frame_controller = require('./controller');

/**
 * Read ofrc, and ask user about missing info
 */

config
    .load()
    .then(function(ofrc) {
        console.log('config loaded...', ofrc);
        var auth = ofrc.auth || {},
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
                type: 'password',
                message: 'Enter your Openframe password:'
            });
        }

        if (!ofrc.frame || !ofrc.frame.name) {
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
    })
    .catch(function(err) {
        if (err) {
            console.error(err);
            return;
        }
    });


/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 */
function saveAnswers(answers, ofrc) {
    console.log('saveAnswers');
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
            ofrc.frame = {
                name: answers.frame_name
            };
        }
    }

    config
        .save()
        .then(init);
}

/**
 * Start up the frame
 */
function init() {
    console.log('init');

    frame_controller.init();

    // // instantiate the frame controller
    // new FrameController();
}

