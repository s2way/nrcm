'use strict';

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        exec: {
            'test': 'mocha test/** -R progress',
            'html-cov': 'mocha test/** -r blanket -R html-cov > report.html',
            'travis-cov': 'mocha test/** -r blanket -R travis-cov '
        },

          // Watches files for changes and runs tasks based on the changed files
        watch: {
            src: {
                files: ['test/**/*.js'],
                tasks: ['test']
            },
            test: {
                files: ['src/**/*.js'],
                tasks: ['test']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
        }        
    });

    grunt.registerTask('default', 'Watch files', function(target) {
        grunt.task.run([
            'watch'
        ]);
    });

    grunt.registerTask('test', 'Testing...', ['exec']);

};