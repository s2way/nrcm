var exceptions = require('./exceptions');
var fs = require('fs');
var path = require('path');
var util = require('util');

var sync = {

    copyIfNotExists : function(src, dst) {
        if (fs.existsSync(dst)) {
            var stats = fs.lstatSync(dst);
            if (stats.isDirectory()) {
                throw new exceptions.Fatal();
            } else {
                return false;
            }
        }
        return sync.copy(src, dst);
    },

    copy : function(src, dst) {
        sync.createFileIfNotExists(dst, fs.readFileSync(src, "utf8"));
        return true;
    },

    loadNodeFilesIntoArray : function(files) {
        var jsonFiles = {};
        if (!util.isArray(files)) {
            throw new exceptions.Fatal();
        }

        for (var i in files) {
            var name;
            var file = files[i];
            var extension = path.extname(file);

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
     * Check if the dir exists, if doesn`t try to create it
     *
     * @method createDirIfNotExists
     * @param {String} dir The dir that needs to be created
     */
    createDirIfNotExists : function(dir) {
        var stats;
        if (fs.existsSync(dir)) {
            stats = fs.lstatSync(dir);
            if (!stats.isDirectory()) {
                throw new exceptions.Fatal(dir + " exists and is not a directory");
            }
        } else {
            fs.mkdirSync(dir, 0766);        
        }
    },

    /**
     * Turn a json file into a json object
     *
     * @method jgetSync
     * @param {String} file The file to be read
     */
    fileToJSON : function(file) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    },

    /**
     * Check if the file exists, if doesn`t try to create it
     *
     * @method createFileIfNotExists
     * @param {String} filePath The file that needs to be created
     */
    createFileIfNotExists : function(filePath, fileData) {
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
     * @param {String} path Path to be searched
     * @return {Array} Returns a list of files
     */
    listFilesFromDir : function(dir) {
        var files = fs.readdirSync(dir);
        var result = [];

        if (files.length > 0) {
            files.forEach(function(file) {
                var fullFilePath = path.join(dir, file);
                var stats = fs.lstatSync(fullFilePath);
                if (stats.isFile()) {
                    result.push(fullFilePath);
                }
                if (stats.isSymbolicLink()) { // resolve symlinks
                    stats = fs.lstatSync(fs.realpathSync(fullFilePath));
                    if(stats.isFile()) {
                        result.push(fullFilePath);
                    }
                }
            });
        }
        return result;          
    }
};

module.exports = sync;