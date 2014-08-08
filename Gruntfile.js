'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    var jslintCommand = 'node node_modules/jslint/bin/jslint.js --node --vars --devel --nomen --stupid --indent 4 --maxlen 2048 src/*.js test/*.js src/**/*.js test/**/*.js > lint.out || (cat lint.out && exit 1)';

    // Define the configuration for all the tasks
    grunt.initConfig({
        exec: {
            'jslint' : jslintCommand,
            'test': 'mocha test/** -R progress',
            'html-cov': 'mocha test/** -r blanket -R html-cov > report.html',
            'travis-cov': 'mocha test/** -r blanket -R travis-cov '
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            src: {
                files: ['src/**/*.js'],
                tasks: ['test']
            },
            test: {
                files: ['test/**/*.js'],
                tasks: ['test']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
        }
    });

    grunt.registerTask('default', 'Watch files', function () {
        grunt.task.run([
            'watch'
        ]);
    });
    grunt.registerTask('lint', 'JSLint', 'exec:jslint');
    grunt.registerTask('test', 'Testing...', 'exec');

};