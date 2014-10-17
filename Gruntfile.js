'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    var jslintCommand = "jslint --node --vars --devel --nomen --stupid --indent 4 --maxlen 2048 `find server -regex '.*\\.js$' -type f | tr '\\n' ' '` > lint.out || (cat lint.out && exit 1)";

    // Define the configuration for all the tasks
    grunt.initConfig({
        exec: {
            'jslint' : jslintCommand,
            'test': 'mocha server/test --recursive -R progress',
            'html-cov': 'mocha server/test --recursive -r blanket -R html-cov > report.html',
            'travis-cov': 'mocha server/test --recursive -r blanket -R travis-cov '
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            test: {
                files: ['server/**/*.js'],
                tasks: ['test']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            }
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