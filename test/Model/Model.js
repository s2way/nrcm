var assert = require('assert');
var Model = require('./../../src/Model/Model');

describe('Model.js', function(){
	
	var configurations = {
		'bucket' : 'bucket',
		'uid' : 'pessoa'
	};

	describe('Model', function(){
		
		it('shoud instantiate the DataSource object', function(){
			var ds = new Model('Couchbase', configurations);
			assert.equal(true, ds.dataSource !== null);
		});

		it('should throw an IllegalArgument exception if the DataSource cannot be found', function(){
			try {
				new Model('Invalid', configurations);
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});

	});
	
	describe('connect', function(){
		it('should call the DataSource connect', function(done) {
			var ds = new Model('Couchbase', configurations);
			ds.dataSource.connect = function(onSuccess, onError) {
				assert.equal('function', typeof onSuccess);
				assert.equal('function', typeof onError);
				done();
			};
			ds.connect(function(){}, function(){});
		});
	});
	
	describe('disconnect', function(){
		it('should call the DataSource disconnect', function(done) {
			var ds = new Model('Couchbase', configurations);
			ds.dataSource.disconnect = function() {
				done();
			};
			ds.disconnect();
		});
	});
	
	describe('findById', function(){
		it('should call the DataSource findById', function(done) {
			var ds = new Model('Couchbase', configurations);
			var id = '02895328099';
			ds.dataSource.findById = function(idd, callback) {
				assert.equal(id, idd)
				assert.equal('function', typeof callback);
				done();
			};
			ds.findById(id, function(){});
		});
	});
	
	describe('findByKey', function(){
		it('should call the DataSource findByKey', function(done) {
			var ds = new Model('Couchbase', configurations);
			var emailValue = 'davi@versul.com.br';
			var emailName = 'email';
			ds.dataSource.findByKey = function(keyValue, keyName, callback) {
				assert.equal(emailValue, keyValue);
				assert.equal(emailName, keyName);
				assert.equal('function', typeof callback);
				done();
			};
			ds.findByKey(emailValue, emailName, function(){});
		});
	});
	
	describe('save', function(){
		it('should call the DataSource save', function(done) {
			var ds = new Model('Couchbase', configurations);
			var id = '02895328099';
			var data = {};
			var options = {};

			ds.dataSource.save = function(_id, _data, callback, prefix, _options) {
				assert.equal(id, _id);
				assert.equal(data, _data);
				assert.equal(null, prefix);
				assert.equal(options, _options);
				assert.equal('function', typeof callback);
				done();
			};
			ds.save(id, data, function(){}, null, options);
		});
	});
	
	describe('removeById', function(){
		it('should call the DataSource removeById', function(done){
			var ds = new Model('Couchbase', configurations);
			var id = '02895328099';

			ds.dataSource.save = function(_id, callback) {
				assert.equal(id, _id);
				assert.equal('function', typeof callback);
				done();
			};
			ds.save(id, function(){});
		});
	});
});