var assert = require('assert');
var util = require('util');
var CouchbaseInterface = require('./../../src/Model/CouchbaseInterface');
var DataSource = require('./../../src/Model/DataSource');

var controlVars = {};
var data = {
	'email' : 'davi@versul.com.br',
	'senha' : '123456',
	'endereco' : {
		'logradouro' : 'Rua José de Alencar',
		'cep' : '93310210',
	},
	'preferencias' : ['Cerveja', 'Salgadinho']
};

function createDataSource(couchbase) {
	var ds = new DataSource({
		'index' : 'bucket',
		'type' : 'Couchbase',
		'host' : 'localhost',
		'port' : '8091'
	});
	ds.log = function(){};
	if (couchbase === undefined) {
		couchbase = mockCouchbase();
	}
	ds.couchbase = couchbase;
	return ds;	
}

function createModelInterface(couchbase) {
	controlVars = {};
	if (couchbase === undefined) {
		couchbase = mockCouchbase({
			'getResult' : {
				'value' : data
			}
		});
	}
	var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid': 'pessoa'});
	modelInterface.log = function(){};
	return modelInterface;
}

function mockCouchbase(options) {
	if (options === undefined) {
		options = {};
	}
	return {
		'Connection' : function(connOptions, connectionCallback){
			this.set = function(key, value, options, callback) {
				controlVars['setCalled'] = true;
				controlVars['setKey'] = key;
				controlVars['setValue'] = value;
				controlVars['setOptions'] = options;
				controlVars['setCallback'] = callback;
				setTimeout(function() {
					callback();
				}, 10);
			};
			this.shutdown = function() {
				controlVars['disconnected'] = true;
			};
			this.setMulti = function(documents, options, callback) {
				controlVars['setMultiDocuments'] = documents;
				setTimeout(function(){
					callback();
				}, 10);
			};
			this.removeMulti = function(ids, options, callback) {
				controlVars['removeMultiIds'] = ids;
				setTimeout(function(){
					callback();
				}, 10);
			};
			this.get = function(key, getCallback) {
				controlVars['key'] = key;
				getCallback(options.getError, options.getResult);
			};
			this.replace = function(key, data, saveOptions, callback) {
				controlVars['replaceCalled'] = true;
				controlVars['replaceKey'] = key;
				controlVars['replaceData'] = data;
				controlVars['replaceSaveOptions'] = saveOptions;
				controlVars['replaceCallback'] = callback;

				setTimeout(function() {
					callback();
				}, 10);
			};
			this.remove = function(key, options, callback) {
				controlVars['removeCalled'] = true;
				controlVars['removeKey'] = key;
				controlVars['removeOptions'] = options;
				controlVars['removeCallback'] = callback;
				// Assync callback 
				setTimeout(function(){
					callback();
				}, 10);
			};
			if (connectionCallback !== undefined) {
				// Assync callback 
				setTimeout(function(){
					connectionCallback();
					controlVars['connectionCallbackCalled'] = true;
				}, 10);
			}
		}
	};
}

describe('CouchbaseInterface.js', function() {
	describe('CouchbaseInterface', function() {
		it('should throw an exception if the uid is not provided', function(){
			controlVars = {};
			try {
				var ds = new CouchbaseInterface(createDataSource(), {'bucket':'bucket'});
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});
		it('should throw an exception if the configurations parameter is not passed', function(){
			try {
				new CouchbaseInterface();
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});
	});

	describe('findByKey', function() {
		it('should throw an exception if the id is undefined', function(){
			var modelInterface = new CouchbaseInterface(createDataSource(), {'uid': 'pessoa'});
			modelInterface.log = function(){};
			try {
				modelInterface.findByKey();
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});
		it('should find the record by key', function(done){
			var couchbase = mockCouchbase({
				'getResult' : {
					'value' : {
						// Key data
						'key' : 'pessoa_02895328099',
						// Normal data returned when the record is searched by key
						'nome' : 'Davi',
						'email' : 'davi@versul.com.br'
					}
				}
			});
			var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid' :'pessoa'});
			modelInterface.log = function(){};
			modelInterface.findByKey('email', 'davi@versul.com.br', function(err, result){
				assert.equal('Davi', result['value']['nome']);
				assert.equal('davi@versul.com.br', result['value']['email']);
				done();
			});
		});	
	});
	describe('findById', function() {
		var document = {
			'nome' : 'Davi',
			'cpf' : '02895328099'
		};
		var couchbase = mockCouchbase({
			'getResult' : {
				'value' : document
			}
		});
		var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid': 'pessoa'});
		modelInterface.log = function(){};
		it('should throw an exception if the id is not passed or if the callback is not a function', function(){
			try {
				modelInterface.findById();
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});
		it('should find the record by id', function(done){
			controlVars = {};
			modelInterface.findById('02895328099', function(err, result){
				assert.equal(JSON.stringify(document), JSON.stringify(result.value));
				done();
			});
		});
	});
	describe('removeById', function(){
		var document = {
			'nome' : 'Davi'
		};
		var couchbase = mockCouchbase({
			'getResult' : {
				'value' : document
			}
		});
		var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid': 'pessoa'});
		modelInterface.log = function(){};
		it('should throw an IllegalArgument exception if the passed callback is not a function', function(){
			controlVars = {};
			try {
				modelInterface.removeById('02895328099', 'pessoa', null, {});
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});
		it('should call couchbase remove function to remove a document by id from the bucket', function(done){
			controlVars = {};
			modelInterface.removeById('02895328099', function(){
				assert.equal('pessoa_02895328099', controlVars['removeKey']);
				assert.equal('{}', JSON.stringify(controlVars['removeOptions']));
				done();
			});
		});
		it('should call beforeRemove and proceed with the operation if true is passed to the callback', function(done){
			var modelInterface = createModelInterface();
			modelInterface.beforeRemove = function(params, callback) {
				setTimeout(function() {
					assert.equal('02895328099', params['id']);
					controlVars['beforeRemoveCalled'] = true;
					callback(true);
				}, 10);
			};
			modelInterface.removeById('02895328099', function(err, result){
				assert.equal(undefined, result);
				assert.equal(true, controlVars['removeCalled']);
				assert.equal(true, controlVars['beforeRemoveCalled']);
				done();
			});
		});
		it('should call afterRemove and pass the id', function(done){
			var modelInterface = createModelInterface();
			modelInterface.afterRemove = function(params, callback) {
				assert.equal('02895328099', params['id']);
				controlVars['afterRemoveCalled'] = true;
				setTimeout(function(){
					callback();
				}, 10);
			};
			modelInterface.removeById('02895328099', function(err, result) {
				assert.equal(true, controlVars['removeCalled']);
				assert.equal(true, controlVars['afterRemoveCalled']);
				done();
			});
		});
	});

	describe('save', function(){
		it('should throw an IllegalArgument exception if the callback is not a function', function(done){
			var modelInterface = createModelInterface();
			try {
				modelInterface.save({}, {}, {}, {});
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
				done();
			}
		});
		it('should throw an IllegalArgument exception if the id is not defined', function(done){
			var modelInterface = createModelInterface();
			try {
				modelInterface.save(null, {}, function(){});
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
				done();
			}
		});
		it('should connect to the database, read the record and call the callback if the record is found', function(done) {
			var modelInterface = createModelInterface();
			modelInterface.save('02895328099', data, function(err, result){
				assert.equal(undefined, err);
				done();
			});
		});
		it('should call beforeSave and afterSave', function(done) {
			var modelInterface = createModelInterface();
			var beforeCalled = false;
			var afterCalled = false;
			modelInterface.beforeSave = function(params, callback) {
				beforeCalled = true;
				setTimeout(function(){
					callback(true);
				}, 10);
			};
			modelInterface.afterSave = function(params, callback) {
				afterCalled = true;
				setTimeout(function(){
					callback();
				}, 10);
			};
			modelInterface.save('02895328099', data, function(err, result){
				assert.equal(undefined, err);
				assert.equal(true, beforeCalled);
				assert.equal(true, afterCalled);
				done();
			});
		});
		it('should connect to the database, read the record and call the callback if the record is not found', function(done){
			var couchbase = mockCouchbase({
				'getResult' : {
					'value' : undefined
				}
			});
			var modelInterface = createModelInterface(couchbase);
			modelInterface.save('02895328099', data, function(err, result){
				assert.equal(undefined, err);
				done();
			});
		});
		it('should not call replace if the document is being updated and the validation rules do not pass', function(done){
			var modelInterface = createModelInterface();
			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, false, {});
				}, 10);
			};
			modelInterface.save('02895328099', data, function(exception, result){
				assert.equal('ValidationFailed', exception.name);
				assert.equal(undefined, controlVars['replaceCalled']);
				done();
			});
		});
		it('should not call replace if one of the locked fields is being passed', function(done) {
			var modelInterface = createModelInterface();
			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, true, {});
				}, 10);
			};
			modelInterface.locks = {
				'senha' : 'M'
			};
			modelInterface.save('02895328099', data, function(exception, result){
				assert.equal('FieldLocked', exception.name);
				assert.equal(undefined, controlVars['replaceCalled']);
				done();
			});
		});
		it('should not call set if the validation rules do not pass', function(done){
			var couchbase = mockCouchbase({
				'getResult' : {
					'value' : undefined
				}
			});
			var modelInterface = createModelInterface(couchbase);
			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, false, {});
				}, 10);
			};
			modelInterface.save('02895328099', data, function(exception, result){
				assert.equal('ValidationFailed', exception.name);
				assert.equal(undefined, controlVars['setCalled']);
				done();
			});
		});
		
		it('should not call set or replace if one of the required fields is missing', function(done) {
			var couchbase = mockCouchbase({
				'getResult' : {
					'value' : undefined
				}
			});
			var modelInterface = createModelInterface(couchbase);
			modelInterface.requires = {
				'senha' : 'senha'
			};

			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, true, {});
				}, 10);
			};
			var dataWithoutSenha = JSON.parse(JSON.stringify(data));
			delete(dataWithoutSenha['senha']);

			modelInterface.save('02895328099', dataWithoutSenha, function(exception, result){
				assert.equal('FieldRequired', exception.name);
				assert.equal(undefined, controlVars['setCalled']);
				assert.equal(undefined, controlVars['replacedCalled']);
				done();
			});
		});
		it('should save the keys when the document is being created', function(done){
			var document = {
				'email' : 'davi@versul.com.br',
				'senha' : '123456',
				'endereco' : {
					'logradouro' : 'Rua José de Alencar',
					'cep' : '93310210',
				},
				'preferencias' : ['Cerveja', 'Salgadinho']
			};

			var couchbase = mockCouchbase({'getResult' : {'value' : undefined}});
			var modelInterface = createModelInterface(couchbase);
			modelInterface.keys = {
				'email' : 'email'
			};
			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, true, {});
				}, 10);
			};
			modelInterface.save('02895328099', document, function(exception, result){
				var expectedKeys = {
					'pessoa_email_davi@versul.com.br' : {
						'value' : {
							'key' : 'pessoa_02895328099'
						}
					}
				};
				assert.equal(
					JSON.stringify(expectedKeys), 
					JSON.stringify(controlVars['setMultiDocuments'])
				);
				assert.equal(undefined, controlVars['removeMultiIds']);
				done();
			});
		});
		it('should remove the keys and save them again when the document is being updated', function(done){
			var document = {
				'email' : 'davi@versul.com.br',
				'senha' : '123456',
				'endereco' : {
					'logradouro' : 'Rua José de Alencar',
					'cep' : '93310210',
				},
				'preferencias' : ['Cerveja', 'Salgadinho']
			};
			var couchbase = mockCouchbase({'getResult' : {'value' : document}});

			var modelInterface = createModelInterface(couchbase);
			modelInterface.keys = {
				'email' : 'email'
			};
			modelInterface.validator.isValid = function(data, callback){
				setTimeout(function(){
					callback(false, true, {});
				}, 1);
			};
			modelInterface.save('02895328099', document, function(exception, result){
				var expectedKeys = {
					'pessoa_email_davi@versul.com.br' : {
						'value' : {
							'key' : 'pessoa_02895328099'
						}
					}
				};
				var expectedIdsRemove = [
				 	'pessoa_email_davi@versul.com.br'
				];
				assert.equal(
					JSON.stringify(expectedKeys), 
					JSON.stringify(controlVars['setMultiDocuments'])
				);
				assert.equal(
					JSON.stringify(expectedIdsRemove), 
					JSON.stringify(controlVars['removeMultiIds'])
				);
				done();
			});
		});
	});

});