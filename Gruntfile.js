'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    var lint = '', build = '', clean = '', test = '';

    clean += 'rm -rf dist';
    lint += "jslint --node --vars --devel --nomen --stupid --indent 4 --maxlen 2048 `find server -regex '.*\\.js$' -type f | tr '\\n' ' '` > lint.out || (cat lint.out && exit 1) ;";
    lint += "coffeelint server";

    build += 'mkdir -p dist ; ';
    build += '(cp -r server/* dist/ && find dist -type f ! -iname "*.js" -delete) ; ';
    build += 'coffee --compile --output dist server';

    test += 'mocha server/test --recursive -R progress ; ';
    test += 'mocha server/test/**/*.coffee --recursive --compilers coffee:coffee-script/register -R progress'

    // Define the configuration for all the tasks
    grunt.initConfig({
        exec: {
            'clean' : clean,
            'lint' : lint,
            'build': build,
            'test': test,
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
    grunt.registerTask('lint', 'Linting...', 'exec:lint');
    grunt.registerTask('test', 'Testing...', 'exec');
    grunt.registerTask('build', 'Building...', 'exec:build');
    grunt.registerTask('clean', 'Cleaning...', 'exec:clean');

};