var exceptions = require('./exceptions');

exports.isAllowed = function(acl, group, controller, method) {
	var i = 0;
	var l = 0;
 	var methodIndex = 0;
 	var validMethods = ['post', 'put', 'delete', 'get', 'path'];

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