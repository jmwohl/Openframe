#! /usr/bin/env node

var program = require('commander'),
    inquirer = require('inquirer'),
    shell = require('shelljs'),
    debug = require('debug')('openframe:cli'),
    p = require('../package.json'),
    version = p.version.split('.').shift(),
    config = require('../src/config'),
    frame = require('../src/frame'),
    rest = require('../src/rest'),
    frame_controller = require('../src/controller'),
    initializers;

program
    .version(version)
    .option('-r, --reset', 'Reset this frame. Erases current frame data, and registers this as a new frame.')
    .option('-i, --install [extension]', 'Install an extension. The argument should be in the npm package name format, e.g. "openframe-image" or "openframe-image@^0.1.0"')
    .option('-u, --uninstall [extension]', 'Uninstall an extension. The argument should be the npm package name, e.g. "openframe-image"')
    .parse(process.argv);

// load config, frame, and user from local dot files
initializers = [
    config.load(),
    frame.load()
];

Promise.all(initializers)
    .then(rest.init)
    .then(function() {
        debug(config.ofrc);
        debug(frame.state);

        if (program.reset) {
            reset()
                .then(processArgs)
                .catch(debug);
        } else {
            processArgs();
        }

    }).catch(function(err) {
        debug(err);
    });


function processArgs() {
    debug('processArgs');

    debug(frame.state);

    var questions = [];

    if (config.ofrc.autoboot === undefined) {
        // ask frame name
        questions.push({
            name: 'autoboot',
            message: 'Do you want to boot openframe on startup?:',
            type: 'confirm'
        });
    }

    if (questions.length) {
        inquirer.prompt(questions, function(answers) {
            saveAnswers(answers)
                .then(init);
        });
    } else {
        init();
    }
}

/**
 * Reset the frame. This means:
 * - delete current frame state
 * - delete current user state
 *
 * @return {Promise} A promise resolving when the user and frame have been reset
 */
function reset() {
    debug('Reseting frame.');
    return new Promise(function(resolve, reject) {
        frame.state = {};
        delete config.ofrc.autoboot;
        frame.persistStateToFile()
            .then(config.save)
            .then(resolve);
    });
}

/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 * @return {Promise}
 */
function saveAnswers(answers) {
    if (answers) {
        if (answers.autoboot) {
            enableAutoboot();
        } else {
            disableAutoboot();
        }
        config.ofrc.autoboot = answers.autoboot;
    }

    return config.save();
}

function enableAutoboot() {
    debug('----->>> Enable Autoboot');
    disableAutoboot();
    shell.ShellString('source ~/.openframe/autoboot.sh\n').toEnd('~/.bashrc');
}

function disableAutoboot() {
    debug('----->>> Disable Autoboot');
    shell.sed('-i', /^.*openframe.*autoboot.*$/, '', '~/.bashrc');
}

/**
 * Start up the frame
 */
function init() {
    debug('Initializing Frame Controller');

    // if we've gotten here, presumably we have a user/pass
    if (program.install) {
        console.log('\n');
        console.log('[o]   Installing ' + program.install + ' extension...');
        console.log('\n');
        frame_controller.installExtension(program.install);
    } else if (program.uninstall) {
        console.log('\n');
        console.log('[o]   Uninstalling ' + program.uninstall + ' extension...');
        console.log('\n');
        frame_controller.uninstallExtension(program.uninstall);
    } else {
        frame_controller.init();
    }
}
