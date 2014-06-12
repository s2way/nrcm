var exceptions = require('./exceptions');

/**
 * Check if the user`s group has the right to proceed with the controller requested on url
 *
 * @method isAllowed
 * @param {json} acl The ACL JSON Object that contains the privileges for groups and controllers
 * @param {string} group The active user session group
 * @param {string} controller The controller`s name of the requested url
 * @param {string} method The method of the request url, is supported: post, put, delete, get, path, options and head.
 * @return {mixed} Returns false if it is not allowed or a string with the rule that allows to proceed
 */
exports.isAllowed = function(acl, group, controller, method) {
	var i = 0;
	var l = 0;
	var methodIndex = 0;
	var validMethods = ['post', 'put', 'delete', 'get', 'path', 'options', 'head'];
	// Test if contains
	if (controller !== '' && method !== '') {
		methodIndex = validMethods.indexOf(method);
		if (methodIndex === -1) {
			throw new exceptions.InvalidMethod();
		}
		for (i = 0, l = acl.url.length; i < l; i += 1) {
			// Action match
			if (acl.url[i].controller === controller) {
				// Group match
				if (acl.url[i].group === group) {
					// Method match
					if (acl.url[i].rule[methodIndex] === 1) {
						return 'ga';
					}
				}
				// Any groups
				if (acl.url[i].group === '*') {
					if (acl.url[i].rule[methodIndex] === 1) {
						return '*A';
					}
				}
			}
			// Group match
			if (acl.url[i].group === group) {
				// Any controllers
				if (acl.url[i].controller === '*') {
					if (acl.url[i].rule[methodIndex] === 1) {
						return 'G*';
					}

				}
			}
			// Any groups, any controllers
			if (acl.url[i].group === '*' && acl.url[i].controller === '*') {
				if (acl.url[i].rule[methodIndex] === 1) {
					return '**';
				}
			}
		}
	}
	return false;
}
