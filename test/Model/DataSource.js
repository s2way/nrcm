var assert = require('assert');
var DataSource = require('./../../src/Model/DataSource');

describe('DataSource.js', function() {
	var mockCouchbase = {
		'Connection' : function(connOptions, connectionCallback){
			this.shutdown = function(){};
			setTimeout(function(){
				connectionCallback();
			}, 10);
		}
	};

	var configs = {
		'index' : 'cep',
		'host' : '127.0.0.1',
		'port' : '8091',
		'type' : 'Couchbase'
	};

	describe('DataSource', function() {
		
		it('should throw an IllegalArgument exception if one of the parameters is not a string', function(){
			try {
				new DataSource();
				assert.fail();
			} catch (e) {
				assert.equal('IllegalArgument', e.name);
			}
		});

	});

	describe('connect', function() {
		
		it('should throw an IllegalArgument exception if the parameters passed are not functions', function(){
			try {
				var ds = new DataSource(configs);
				ds.connect(null, null);
			} catch (e){
				assert.equal('IllegalArgument', e.name);
			}
		});

		it('should call onSuccess if the connection already exists', function(done) {
			var ds = new DataSource(configs);
			ds.connection = {};
			ds.connect(function(){
				done();
			}, function(){});
		});

		it('should call couchbase connect if the type is Couchbase', function(done){
			var ds = new DataSource(configs);
			ds.couchbase = mockCouchbase();

			ds.connect(function(){
				done();
			}, function(err){
				assert.fail();
			});
		});

	});

	describe('disconnect', function() {

	});
});