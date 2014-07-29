/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var NRCM = require('./../src/NRCM');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var sync = require('./../src/Util/sync');
var fs = require('fs');

describe('NRCM.js', function () {

    function clearStructure(dir) {
        fs.rmdirSync(path.join(dir, 'src', 'Component'));
        fs.rmdirSync(path.join(dir, 'src', 'Controller'));
        fs.unlinkSync(path.join(dir, 'src', 'Config', 'acl.json'));
        fs.unlinkSync(path.join(dir, 'src', 'Config', 'core.json'));
        fs.rmdirSync(path.join(dir, 'src', 'Config'));
        fs.rmdirSync(path.join(dir, 'src', 'Model'));
        fs.rmdirSync(path.join(dir, 'src'));

        fs.rmdirSync(path.join(dir, 'test', 'Component'));
        fs.rmdirSync(path.join(dir, 'test', 'Controller'));
        fs.rmdirSync(path.join(dir, 'test', 'Model'));
        fs.rmdirSync(path.join(dir, 'test'));

        fs.unlinkSync('ExceptionsController.js');
        fs.rmdirSync(dir);
    }

    var nrcm = new NRCM();
    nrcm.log = function () { return; };

    describe('configure', function () {

        it('should load the configs without throwing an exception', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, '{ "urlFormat": "/$application/$controller", "requestTimeout" : 10000 }');
            nrcm.configure(configFileName);
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the config file is not a valid JSON file', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, 'this is not a json file');
            try {
                nrcm.configure(configFileName);
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('Configuration file is not a valid JSON', e.message);
            }
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the urlFormat is not a string or it is not defined', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, '{}');
            try {
                nrcm.configure(configFileName);
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('urlFormat has not been specified or it is not a string', e.message);
            }
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the requestTimeout if it is not defined', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, '{ "urlFormat": ""}');
            try {
                nrcm.configure(configFileName);
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('requestTimeout has not been specified or it is not a number', e.message);
            }
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the core configuration file is not a valid JSON', function () {
            sync.createDirIfNotExists(path.join('testing'));
            sync.createDirIfNotExists(path.join('testing', 'src'));
            sync.createDirIfNotExists(path.join('testing', 'src', 'Config'));
            sync.createFileIfNotExists(path.join('testing', 'src', 'Config', 'core.json'), '');

            try {
                nrcm.setUp('testing');
                assert.fail();
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('The core configuration file is not a valid JSON', e.message);
            }

            clearStructure('testing');
        });
    });

    it('should start the application', function () {
        sync.createDirIfNotExists(path.join('testing1'));
        sync.createDirIfNotExists(path.join('testing1', 'src'));
        sync.createDirIfNotExists(path.join('testing1', 'src', 'Controller'));
        sync.createDirIfNotExists(path.join('testing1', 'src', 'Component'));

        var controllerFile = path.join('testing1', 'src', 'Controller', 'MyController.js');
        sync.createFileIfNotExists(controllerFile, 'module.exports = function (){ };');
        var componentFile = path.join('testing1', 'src', 'Component', 'MyComponent.js');
        sync.createFileIfNotExists(componentFile, 'module.exports = function () { };');

        nrcm.setUp('testing1');
        nrcm.start();
        // Nothing to test here
        fs.unlinkSync(path.join('testing1', 'src', 'Controller', 'MyController.js'));
        fs.unlinkSync(path.join('testing1', 'src', 'Component', 'MyComponent.js'));
        clearStructure('testing1');
    });

    it('should create the default internal structure', function () {
        nrcm.setUp('testing2');
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Controller')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Component')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Config', 'acl.json')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Config', 'core.json')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Model')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Controller')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Component')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Model')));
        assert.equal(true, fs.existsSync(path.join('ExceptionsController.js')));
        clearStructure('testing2');
    });

    it('should throw a Fatal exception if the controller does not export a function', function () {
        sync.createDirIfNotExists(path.join('testing3'));
        sync.createDirIfNotExists(path.join('testing3', 'src'));
        sync.createDirIfNotExists(path.join('testing3', 'src', 'Controller'));
        var controllerFile = path.join('testing3', 'src', 'Controller', 'MyController.js');
        sync.createFileIfNotExists(controllerFile, '{}');
        try {
            nrcm.setUp('testing3');
            assert.fail();
        } catch (e) {
            assert.equal('Fatal', e.name);
            assert.equal('Controller does not export a function: MyController', e.message);
        }
        fs.unlinkSync(controllerFile);
        clearStructure('testing3');
    });

    it('should throw a Fatal exception if the model does not export a function', function () {
        sync.createDirIfNotExists(path.join('testing4'));
        sync.createDirIfNotExists(path.join('testing4', 'src'));
        sync.createDirIfNotExists(path.join('testing4', 'src', 'Model'));
        var modelFile = path.join('testing4', 'src', 'Model', 'MyModel.js');
        sync.createFileIfNotExists(modelFile, '{}');
        try {
            nrcm.setUp('testing4');
            assert.fail();
        } catch (e) {
            assert.equal('Fatal', e.name);
            assert.equal('Model does not export a function: MyModel', e.message);
        }
        fs.unlinkSync(modelFile);
        clearStructure('testing4');
    });

    it('should throw a Fatal exception if the component does not export a function', function () {
        sync.createDirIfNotExists(path.join('testing5'));
        sync.createDirIfNotExists(path.join('testing5', 'src'));
        sync.createDirIfNotExists(path.join('testing5', 'src', 'Controller'));
        sync.createDirIfNotExists(path.join('testing5', 'src', 'Component'));
        var componentFile = path.join('testing5', 'src', 'Component', 'MyComponent.js');
        sync.createFileIfNotExists(componentFile, '{}');
        try {
            nrcm.setUp('testing5');
            assert.fail();
        } catch (e) {
            assert.equal('Fatal', e.name);
            assert.equal('Component does not export a function: MyComponent', e.message);
        }
        fs.unlinkSync(componentFile);
        clearStructure('testing5');
    });

    it('should throw a Fatal exception if the controller method is not a function', function () {
        sync.createDirIfNotExists(path.join('testing6'));
        sync.createDirIfNotExists(path.join('testing6', 'src'));
        sync.createDirIfNotExists(path.join('testing6', 'src', 'Controller'));
        var controllerFile = path.join('testing6', 'src', 'Controller', 'MyController.js');
        sync.createFileIfNotExists(controllerFile, 'module.exports = function (){ this.get = 1; };');
        try {
            nrcm.setUp('testing6');
            assert.fail();
        } catch (e) {
            assert.equal('Fatal', e.name);
            assert.equal('MyController.get() must be a function!', e.message);
        }
        fs.unlinkSync(controllerFile);
        clearStructure('testing6');
    });
});
