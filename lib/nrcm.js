/**
* NRCM - Node Request Controller Model
* 
*
* @module nrcm_app
*/
var NRCM_APP = (function() {  
  /*
  * Dependencies
  */
  var fs = require("fs"),
      path = require("path"),
      util = require("util"),
      handler = require("./handler");    
  var basePath = "app" + path.sep,
      controllerPath = path.join(basePath, "controller" + path.sep),      
      aclFile = path.join(basePath, "acl");
  var error = false;
  var controller = {},
      acl= {};

  /**
  * Set up the environment for properly execution of Nrcm framework
  *
  * @method setUpSync
  */
  function setUpSync() {
    console.log("[nrcm] Loading...");
    var defaultAclFile = "{\n    \"url\" : [\n        { \"action\" : \"*\",\n           \"group\" : \"*\",\n            \"rule\" : [0,0,0,0]}\n    ]\n}\n";
    setPathSync(basePath);
    setPathSync(controllerPath); 
    setFileSync(aclFile, defaultAclFile);
    setAppSync(controller, getFileSync(controllerPath));
    acl = jgetSync(aclFile);
    if (!error) {
      console.log("[nrcm] Loaded!");
    } else {
      console.log("[nrcm] Not loaded properly!");
      throw {
        name: "NrcmSetupError",
        message: "Couldn`t setup nrcm environment!"
      };
    }
  }

  /**
  * Check if the file exists, if doesn`t try to create it
  *
  * @method setFileSync
  * @param {String} root The file that needs to be created
  */
  function setFileSync(root, data) {
    var stats;
    try {    
      if (fs.existsSync(root)) {
        stats = fs.lstatSync(root);
        if (!stats.isFile()) {
          throw {
            name: "NrcmFileError",
            message: "File for NRCM is not a file"
          };
        }
      } else {
        fs.writeFileSync(root, data);      
      }
    } catch(e) {
      error = true;
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
            name: "NrcmPathError",
            message: "Path for NRCM is a file"
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
  * Search, inspect for files and subfolders inside a directory
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
  * Turn a json file into a json object
  *
  * @method jgetSync
  * @param {String} file The file to be read
  */
  function jgetSync(file) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
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
        name: "NrcmArgumentError",
        message: "The argument passed doesn`t fit the requirements!"
      };
    }    
    try {
      files.forEach(function(file) { 
        var name = path.extname(file);
        if (name !== '') { // if there is an extension remove it
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
    try {
      handler.onRequest(request, response, controller, acl);
    } catch (e) {
      console.log(e);
    }
  }

  return { // expose info
    onRequest: getRequest
  };

} ());

module.exports = NRCM_APP;