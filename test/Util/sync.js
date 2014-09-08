/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var sync = require('./../../src/Util/sync');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

describe('sync.js', function () {

    describe('isFile', function () {
        it('should return false if the file does not exist or if it exists but it is not a file', function () {
            assert.equal(false, sync.isFile('/this/path/must/not/exist/please'));
        });
        it('should return true if the file exists', function () {
            sync.createFileIfNotExists('here.json', '{}');
            assert.equal(true, sync.isFile('here.json'));
            fs.unlinkSync('here.json');
        });
    });

    describe('copyIfNotExists', function () {
        it('should copy the file if it does not exist', function () {
            sync.createFileIfNotExists('here.json', '{}');
            sync.copyIfNotExists('here.json', 'there.json');
            assert.equal('{}', JSON.stringify(sync.fileToJSON('there.json')));
            fs.unlinkSync('here.json');
            fs.unlinkSync('there.json');
        });
        it('should return false if the file exists', function () {
            sync.createFileIfNotExists('here.json', '{}');
            assert.equal(false, sync.copyIfNotExists('here.json', 'here.json'));
            fs.unlinkSync('here.json');
        });
        it('should throw a Fatal exception if it is not a file', function () {
            sync.createDirIfNotExists('here');
            try {
                assert.equal(false, sync.copyIfNotExists('here', 'here'));
                assert.fail();
            } catch (e) {
                assert.equal('Fatal', e.name);
            }
            fs.rmdirSync('here');
        });
    });

    describe('copy', function () {
        it('should copy the file synchronously', function () {
            sync.createFileIfNotExists('here.json', '{}');
            sync.copy('here.json', 'there.json');
            assert.equal('{}', JSON.stringify(sync.fileToJSON('there.json')));
            fs.unlinkSync('here.json');
            fs.unlinkSync('there.json');
        });
    });

    describe('loadNodeFilesIntoArray', function () {
        it('should throw a Fatal exception if the param is not an array', function () {
            try {
                sync.loadNodeFilesIntoArray();
                assert.fail();
            } catch (e) {
                assert.equal('Fatal', e.name);
            }
        });
        it('should the node files into an array', function () {
            var files = {
                'file0' : 'file0.js',
                'file1' : 'file1.js',
                'file2' : 'file2.js'
            };

            var file, fileName, filesJSON;
            try {
                for (file in files) {
                    if (files.hasOwnProperty(file)) {
                        fileName = files[file];
                        sync.createFileIfNotExists(fileName, 'module.exports = { };');
                    }
                }
                filesJSON = sync.loadNodeFilesIntoArray(files);
            } finally {
                for (file in files) {
                    if (files.hasOwnProperty(file)) {
                        fileName = files[file];
                        fs.unlinkSync(fileName);
                    }
                }
            }
            var fileId;
            for (fileId in filesJSON) {
                if (filesJSON.hasOwnProperty(fileId)) {
                    assert.equal(JSON.stringify({}), JSON.stringify(filesJSON[fileId]));
                }
            }
        });
    });

    describe('fileToJSON', function () {
        it('should return a valid JSON if the input file is a valid JSON file', function () {
            var json = {
                'prop' : 'value',
                'anotherProp' : 'anotherValue'
            };
            var fileName = 'fileToJSON.js';
            fs.writeFileSync(fileName, JSON.stringify(json));
            assert.equal(JSON.stringify(json), JSON.stringify(sync.fileToJSON(fileName)));
            fs.unlinkSync(fileName);
        });
    });
    describe('createDirIfNotExists', function () {
        it('create the directory if it does not exists', function () {
            var dir = 'path';
            sync.createDirIfNotExists(dir);
            assert.equal(true, fs.existsSync(dir));
            fs.rmdirSync(dir);
        });
        it('should work when called twice', function () {
            var dir = 'path';
            sync.createDirIfNotExists(dir);
            sync.createDirIfNotExists(dir);
            assert.equal(true, fs.existsSync(dir));
            fs.rmdirSync(dir);
        });
    });
    describe('createFileIfNotExists', function () {
        it('create the file if it does not exists', function () {
            var dir = 'file.txt';
            sync.createFileIfNotExists(dir);
            assert.equal(true, fs.existsSync(dir));
            fs.unlinkSync(dir);
        });
        it('should work when called twice', function () {
            var dir = 'file.txt';
            sync.createFileIfNotExists(dir);
            sync.createFileIfNotExists(dir);
            assert.equal(true, fs.existsSync(dir));
            fs.unlinkSync(dir);
        });
        it('should throw and exception if the file is a directory', function () {
            var dir = 'file';
            fs.mkdirSync(dir, parseInt('0777', 8));
            try {
                sync.createFileIfNotExists(dir);
            } catch (e) {
                assert.equal('Fatal', e.name);
                return;
            } finally {
                fs.rmdirSync(dir);
            }
            assert.fail();
        });
    });

    describe('listFilesFromDirRecursive', function () {
        it('should return a list of files separated by / when the dir is valid and there are files and folders', function () {
            fs.mkdirSync('dir', parseInt('0777', 8));
            fs.mkdirSync('dir/sub', parseInt('0777', 8));
            var files = [
                path.join('dir', '1.txt'),
                path.join('dir', '2.txt'),
                path.join('dir', '3.txt'),
                path.join('dir', 'sub', '4.txt')
            ];
            var i, list;

            for (i = 0; i < files.length; i += 1) {
                fs.writeFileSync(files[i], '');
            }
            try {
                list = sync.listFilesFromDir('dir');
            } finally {
                for (i = 0; i < files.length; i += 1) {
                    fs.unlinkSync(files[i]);
                }
                fs.rmdirSync(path.join('dir', 'sub'));
                fs.rmdirSync('dir');
            }
            assert.equal(JSON.stringify(files), JSON.stringify(list));
        });

        it('should return an empty list when the dir is empty', function () {
            var dir = 'dir';
            try {
                fs.mkdirSync(dir, parseInt('0777', 8));
                assert.equal('[]', JSON.stringify(sync.listFilesFromDir(dir)));
            } finally {
                fs.rmdirSync(dir);
            }
        });
    });
});