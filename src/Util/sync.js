/*jslint devel: true, node: true, indent: 4, stupid: true, vars: true, maxlen: 256 */
'use strict';
var exceptions = require('./../exceptions');
var fs = require('fs');
var path = require('path');
var util = require('util');
var sync = {

    /**
     * Copy a file from a place to another if the destination does not exist
     *
     * @method copyIfNotExists
     * @param {string} src The source file
     * @param {string} src The directory destination
     */
    copyIfNotExists : function (src, dst) {
        var stats;
        if (fs.existsSync(dst)) {
            stats = fs.lstatSync(dst);
            if (stats.isDirectory()) {
                throw new exceptions.Fatal();
            }
            return false;
        }
        return sync.copy(src, dst);
    },
    /**
     * Copy a file from a place to another
     *
     * @method copy
     * @param {string} src The source file
     * @param {string} src The directory destination
     */
    copy : function (src, dst) {
        sync.createFileIfNotExists(dst, fs.readFileSync(src, "utf8"));
        return true;
    },
    /**
     * Load files within directory into an array
     *
     * @method loadNodeFilesIntoArray
     * @param {array} files An array of files
     */
    loadNodeFilesIntoArray : function (files) {
        var jsonFiles = {};
        if (!util.isArray(files)) {
            throw new exceptions.Fatal();
        }
        var name, i, file, extension;
        for (i = 0; i < files.length; i += 1) {
            name = files[i];
            file = files[i];
            extension = path.extname(file);

            if (extension !== '') { // if there is an extension remove it
                name = path.basename(file, extension);
            } else {
                name = path.basename(file);
            }
            jsonFiles[name] = require(fs.realpathSync(file));
        }
        return jsonFiles;
    },
    /**
     * Check if the directory exists, if doesn`t try to create
     *
     * @method createDirIfNotExists
     * @param {string} dir The dir that needs to be created
     */
    createDirIfNotExists : function (dir) {
        var stats;
        var permission = parseInt('0766', 8);
        if (fs.existsSync(dir)) {
            stats = fs.lstatSync(dir);
            if (!stats.isDirectory()) {
                throw new exceptions.Fatal(dir + " exists and is not a directory");
            }
        } else {
            fs.mkdirSync(dir, permission);
        }
    },
    /**
     * Turn a json file into a json object
     *
     * @method fileToJSON
     * @param {string} file The file path
     */
    fileToJSON : function (file) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    },
    /**
     * Check if the file exists, if doesn`t try to create
     *
     * @method createFileIfNotExists
     * @param {string} filePath The file path that needs to be created
     * @param {string} filePath The content of the file
     */
    createFileIfNotExists : function (filePath, fileData) {
        var stats;
        if (fs.existsSync(filePath)) {
            stats = fs.lstatSync(filePath);
            if (!stats.isFile()) {
                throw new exceptions.Fatal(filePath + " is not a file");
            }
        } else {
            fs.writeFileSync(filePath, fileData);
        }
    },
    /**
     * Return a list of files inside a given folder
     *
     * @method listFilesFromDir
     * @param {string} path Path to be searched
     * @return {array} Returns a list of files
     */
    listFilesFromDir : function (dir) {
        var files = fs.readdirSync(dir);
        var result = [];
        if (files.length > 0) {
            files.forEach(function (file) {
                var fullFilePath = path.join(dir, file);
                var stats = fs.lstatSync(fullFilePath);
                if (stats.isFile()) {
                    result.push(fullFilePath);
                }
                if (stats.isSymbolicLink()) { // resolve symlinks
                    stats = fs.lstatSync(fs.realpathSync(fullFilePath));
                    if (stats.isFile()) {
                        result.push(fullFilePath);
                    }
                }
            });
        }
        return result;
    }
};

module.exports = sync;
