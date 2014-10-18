/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var exceptions = require('./../../exceptions.coffee');

/**
 * @param {object} acl The ACL JSON Object that contains the privileges for groups and controllers
 * @constructor
 */
function ACL(acl) {
    this.acl = acl;
}

/**
 * Check if the user`s group has the right to proceed with the controller requested on url
 *
 * @method isAllowed
 * @param {string} group The active user session group
 * @param {string} controller The controller`s name of the requested url
 * @param {string} method The method of the request url, is supported: post, put, delete, get, path, options and head.
 * @return {string|boolean} Returns false if it is not allowed or a string with the rule that allows to proceed
 */
ACL.prototype.isAllowed = function (group, controller, method) {
    var i = 0;
    var l = 0;
    var methodIndex = 0;
    var validMethods = ['post', 'put', 'delete', 'get', 'patch', 'options', 'head'];
    if (controller !== '' && method !== '') {
        methodIndex = validMethods.indexOf(method);
        if (methodIndex === -1) {
            throw new exceptions.InvalidMethod();
        }
        for (i = 0, l = this.acl.url.length; i < l; i += 1) {
            // Action match
            if (this.acl.url[i].controller === controller) {
                // Group match
                if (this.acl.url[i].group === group) {
                    // Method match
                    if (this.acl.url[i].rule[methodIndex] === 1) {
                        return 'ga';
                    }
                }
                // Any groups
                if (this.acl.url[i].group === '*') {
                    if (this.acl.url[i].rule[methodIndex] === 1) {
                        return '*A';
                    }
                }
            }
            // Group match
            if (this.acl.url[i].group === group) {
                // Any controllers
                if (this.acl.url[i].controller === '*') {
                    if (this.acl.url[i].rule[methodIndex] === 1) {
                        return 'G*';
                    }

                }
            }
            // Any groups, any controllers
            if (this.acl.url[i].group === '*' && this.acl.url[i].controller === '*') {
                if (this.acl.url[i].rule[methodIndex] === 1) {
                    return '**';
                }
            }
        }
    }
    return false;
};

module.exports = ACL;