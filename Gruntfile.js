/*jslint node: true*/
'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    var lint = '', build = '', clean = '', test = '', cc = '';

    clean += 'rm -rf dist';
    //lint += "jslint --node --vars --devel --nomen --stupid --indent 4 --maxlen 2048 `find server -regex '.*\\.js$' -type f | tr '\\n' ' '` > lint.out || (cat lint.out && exit 1) ; rm -rf lint.out ; ";
    lint += "node_modules/.bin/coffeelint server";

    build += 'mkdir -p dist ; ';
    //build += '(cp -r server/* dist/ && find dist -type f ! -iname "*.js" -delete) ; ';
    build += 'node_modules/.bin/coffee --compile --output dist server';

    test += 'node_modules/.bin/mocha server/test --recursive -R progress --compilers coffee:coffee-script/register ';

    cc += 'node_modules/.bin/mocha server/test --recursive -R html-cov -r blanket --compilers coffee:coffee-script/register > report.html';

    // Define the configuration for all the tasks
    grunt.initConfig({
        exec: {
            'clean' : clean,
            'lint' : lint,
            'build': build,
            'test': test,
            'cc': cc,
            'travis-cov': 'node_modules/.bin/mocha server/test --recursive -r blanket -R travis-cov '
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            test: {
                files: ['server/**/*.coffee'],
                tasks: ['build', 'test']
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
    grunt.registerTask('lint', 'Linting...', 'exec:lint');
    grunt.registerTask('test', 'Testing...', 'exec:test');
    grunt.registerTask('build', 'Building...', 'exec:build');
    grunt.registerTask('clean', 'Cleaning...', 'exec:clean');
    grunt.registerTask('cc', 'Generating Code Coverage...', 'exec:cc');

};