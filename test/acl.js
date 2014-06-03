var acl = require('./../lib/acl');
var assert = require('assert');

describe('acl.js', function(){
	describe('isAllowed', function() {
		describe('complex rules', function() {
			it('should return ga when there is a valid rule and a more restrictive rule after', function(){
				var aclJSON = {
					'url': [ {
							'controller' : 'somecontroller',
							'group' : 'somegroup',
							'rule' : [1, 1, 1, 1]
						}, {
							'controller' : '*',
							'group' : '*',
							'rule': [0, 0, 0, 0]
						}
					]
				};
				assert.equal('ga', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
			it('should return ga when there restrictive rule and a valid rule after', function(){
				var aclJSON = {
					'url': [ {
							'controller' : '*',
							'group' : '*',
							'rule': [0, 0, 0, 0]
						}, {
							'controller' : 'somecontroller',
							'group' : 'somegroup',
							'rule' : [1, 1, 1, 1]
						}
					]
				};
				assert.equal('ga', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
		});
		describe('simple rules', function() {
			it('should throw an exception when the method is invalid', function(){
				var aclJSON = {
					'url': [{
						'controller' : '*',
						'group' : '*',
						'rule': [1, 1, 1, 1]
					}]
				};
				try {
					acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'somemethod');
					assert.fail();
				} catch (e) {
					assert.equal('InvalidMethod', e.name);
				}
			});
			it('should return ** when everything is allowed', function(){
				var aclJSON = {
					'url': [{
						'controller' : '*',
						'group' : '*',
						'rule': [1, 1, 1, 1]
					}]
				};
				assert.equal('**', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
			it('should return false when everything is allowed except the method', function(){
				var aclJSON = {
					'url': [{
						'controller' : '*',
						'group' : '*',
						'rule': [0, 0, 0, 0]
					}]
				};
				assert.equal(false, acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
			it('should return ga when controller, group, and method match', function(){
				var aclJSON = {
					'url': [{
						'controller' : 'somecontroller',
						'group' : 'somegroup',
						'rule': [1, 1, 1, 1]
					}]
				};
				assert.equal('ga', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
			it('should return *A when controller, group (any), and method match', function(){
				var aclJSON = {
					'url': [{
						'controller' : 'somecontroller',
						'group' : '*',
						'rule': [1, 1, 1, 1]
					}]
				};
				assert.equal('*A', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});

			it('should return G* when group, controller (any), and method match', function(){
				var aclJSON = {
					'url': [{
						'controller' : '*',
						'group' : 'somegroup',
						'rule': [1, 1, 1, 1]
					}]
				};
				assert.equal('G*', acl.isAllowed(aclJSON, 'somegroup', 'somecontroller', 'put'));
			});
		});
	});
});