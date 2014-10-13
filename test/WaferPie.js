/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';
var WaferPie = require('./../src/WaferPie');
var assert = require('assert');
var path = require('path');
var sync = require('./../src/Util/Sync');
var fs = require('fs');
var expect = require('expect.js');

describe('WaferPie.js', function () {

    function clearStructure(dir) {
        fs.rmdirSync(path.join(dir, 'src', 'Component'));
        fs.rmdirSync(path.join(dir, 'src', 'Controller'));
        fs.unlinkSync(path.join(dir, 'src', 'Config', 'core.json'));
        fs.rmdirSync(path.join(dir, 'src', 'Config'));
        fs.rmdirSync(path.join(dir, 'src', 'Model'));
        fs.rmdirSync(path.join(dir, 'src'));

        fs.rmdirSync(path.join(dir, 'test', 'Component'));
        fs.rmdirSync(path.join(dir, 'test', 'Controller'));
        fs.rmdirSync(path.join(dir, 'test', 'Model'));
        fs.rmdirSync(path.join(dir, 'test'));

        fs.rmdirSync(path.join(dir, 'logs'));

        fs.unlinkSync('Exceptions.js');
        fs.rmdirSync(dir);
    }

    var wafer;

    beforeEach(function () {
        wafer = new WaferPie();
        wafer.logger = {
            'info' : function () { return; },
            'debug' : function () { return; }
        };
    });

    describe('start', function () {

        it('should throw a Fatal exception if configure() was not called before', function () {
            expect(function () {
                wafer.start();
            }).to.throwException(function (e) {
                expect(e.name).to.be('Fatal');
            });
        });

    });

    describe('configure', function () {

        it('should load the configs without throwing an exception', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, '{ "urlFormat": "/$application/$controller" }');
            wafer.configure(configFileName);
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the config file is not a valid JSON file', function () {
            var configFileName = 'config_test.json';
            sync.createFileIfNotExists(configFileName, 'this is not a json file');
            try {
                wafer.configure(configFileName);
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
                wafer.configure(configFileName);
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('urlFormat has not been specified or it is not a string', e.message);
            }
            fs.unlinkSync(configFileName);
        });

        it('should throw a Fatal exception if the core configuration file is not a valid JSON', function () {
            sync.createDirIfNotExists(path.join('testing'));
            sync.createDirIfNotExists(path.join('testing', 'src'));
            sync.createDirIfNotExists(path.join('testing', 'src', 'Config'));
            sync.createFileIfNotExists(path.join('testing', 'src', 'Config', 'core.json'), '');

            try {
                wafer.setUp('testing');
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

        wafer.setUp('testing1');
        wafer.configure();
        wafer.start();
        fs.unlinkSync(path.join('testing1', 'src', 'Controller', 'MyController.js'));
        fs.unlinkSync(path.join('testing1', 'src', 'Component', 'MyComponent.js'));
        clearStructure('testing1');
    });

    it('should create the default internal structure', function () {
        wafer.setUp('testing2');
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Controller')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Component')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Config', 'core.json')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'src', 'Model')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Controller')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Component')));
        assert.equal(true, fs.existsSync(path.join('testing2', 'test', 'Model')));
        assert.equal(true, fs.existsSync(path.join('Exceptions.js')));
        clearStructure('testing2');
    });

    it('should throw a Fatal exception if the controller does not export a function', function () {
        sync.createDirIfNotExists(path.join('testing3'));
        sync.createDirIfNotExists(path.join('testing3', 'src'));
        sync.createDirIfNotExists(path.join('testing3', 'src', 'Controller'));
        var controllerFile = path.join('testing3', 'src', 'Controller', 'MyController.js');
        sync.createFileIfNotExists(controllerFile, '{}');
        try {
            wafer.setUp('testing3');
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
            wafer.setUp('testing4');
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
            wafer.setUp('testing5');
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
            wafer.setUp('testing6');
            assert.fail();
        } catch (e) {
            assert.equal('Fatal', e.name);
            assert.equal('MyController.get() must be a function!', e.message);
        }
        fs.unlinkSync(controllerFile);
        clearStructure('testing6');
    });

    describe('setUp', function () {

        it('should throw a Fatal exception if the requestTimeout in is not a number', function () {
            var coreFile = path.join('testing7', 'src', 'Config', 'core.json');
            sync.createDirIfNotExists(path.join('testing7'));
            sync.createDirIfNotExists(path.join('testing7', 'src'));
            sync.createDirIfNotExists(path.join('testing7', 'src', 'Config'));
            sync.createFileIfNotExists(coreFile, '{ "requestTimeout": "string" }');

            try {
                wafer.setUp('testing7');
                assert.fail();
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('The requestTimeout configuration is not a number', e.message);
            }
            clearStructure('testing7');
        });

        it('should throw a Fatal exception if the requestTimeout is not defined', function () {
            var coreFile = path.join('testing8', 'src', 'Config', 'core.json');
            sync.createDirIfNotExists(path.join('testing8'));
            sync.createDirIfNotExists(path.join('testing8', 'src'));
            sync.createDirIfNotExists(path.join('testing8', 'src', 'Config'));
            sync.createFileIfNotExists(coreFile, '{ }');

            try {
                wafer.setUp('testing8');
                assert.fail();
            } catch (e) {
                assert.equal('Fatal', e.name);
                assert.equal('The requestTimeout configuration is not defined', e.message);
            }
            clearStructure('testing8');
        });
    });
});
