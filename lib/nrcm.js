/**
* NRCM - Node Request Controller Model
* 
*
* @module nrcm
*/
var NRCM = (function() {  
  /*
  * Dependencies
  */
  var fs = require('fs'),
      path = require('path'),
      util = require('util'),
      handler = require('./handler');    
  var basePath = 'app' + path.sep,
      controllerPath = path.join(basePath, 'controller' + path.sep),
      modelPath = path.join(basePath, 'model' + path.sep);
  var error = false;
  var controller = {},
      model = {};

  /**
  * Set up the environment for properly execution of Nrcm framework
  *
  * @method setUpSync
  */
  function setUpSync() {
    console.log('[nrcm] Loading...');
    setPathSync(basePath);
    setPathSync(controllerPath);
    setPathSync(modelPath); 
    setAppSync(controller, getFileSync(controllerPath)); 
    setAppSync(model, getFileSync(modelPath));
    if (!error) {
      console.log('[nrcm] Loaded!');
    } else {
      console.log('[nrcm] Not loaded properly!');
      throw {
        name: 'NrcmSetupError',
        message: 'Couldn`t setup nrcm environment!'
      };
    }
  }

  /**
  * Check if the path exists, if doesn`t try to create it
  *
  * @method setPathSync
  * @param {String} root The path that needs to be created
  */
  function setPathSync(root) {
    var stats;
    try {    
      if (fs.existsSync(root)) {
        stats = fs.lstatSync(root);
        if (!stats.isDirectory()) {
          throw {
            name: 'NrcmPathError',
            message: 'Path for NRCM is a file'
          };
        }
      } else {
        fs.mkdirSync(root, 0766);      
      }
    } catch(e) {
      error = true;
    }    
  }

  /**
  * Search, inspect for files inside a directory
  *
  * @method getFileSync
  * @param {String} root Path to be searched
  * @return {Array} Returns a list of files
  */
  function getFileSync(root) {
    var files = fs.readdirSync(root),
        result = [];
    try {
      if (files.length > 0) {
        files.forEach(function(file) {
          var file = path.join(controllerPath, file);
          var stats = fs.lstatSync(file);
          if (stats.isFile()) {
            result.push(file);
          }
          if (stats.isSymbolicLink()) { // resolve symlinks
            stats = fs.lstatSync(fs.realpathSync(file));
            if(stats.isFile()) {
              result.push(file);
            }
          }
        });
      }
      return result;    
    } catch (e) {
      error = true;
    }
  }

  /**
  * Turn a list of files into an app sandbox
  *
  * @method setAppSync
  * @param {Array} files The file list to load into sandbox
  */
  function setAppSync(obj, files) {
    if (!util.isArray(files)) {
      throw {
        name: 'NrcmArgumentError',
        message: 'The argument passed doesn`t fit the requirements!'
      };
    }    
    try {
      files.forEach(function(file) { 
        var name = path.extname(file);
        var exec = '';
        if (name != '') { // if there is an extension remove it
          name = path.basename(file, name);
        } else {
          name = path.basename(file);
        }
        name = name.toLowerCase();
        obj[name] = require(fs.realpathSync(file));
      });   
    } catch (e) {
      error = true;
    }
  }
  
  setUpSync();
  
  /**
  * Dispatch the request to handler
  *
  * @method getRequest
  * @param {Object} request Request from http
  * @param {Object} response Response to http
  */
  function getRequest(request, response) {
    handler.onRequest(request, response, controller, model);
  }

  return { // expose info
    onRequest: getRequest
  };

} ());

module.exports = NRCM;