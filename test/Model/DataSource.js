var assert = require('assert');
var DataSource = require('./../../src/Model/DataSource');

describe('DataSource.js', function() {
	function mockCouchbase()  {
		return {
			'Connection' : function(connOptions, connectionCallback){
				this.shutdown = function(){};
				setTimeout(function(){
					connectionCallback();
				}, 10);
			}
		};
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
			}, function(){
				assert.fail();
			});
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

		it('should call onError if Couchbase connect function returns an error', function(done){
			var ds = new DataSource(configs);
			ds.type = 'Invalid';
			ds.connect(function(){
				assert.fail();
			}, function() {
				done();
			});
		});

		it('should call onError if the connection type is invalid', function(done){
			var ds = new DataSource(configs);
			ds.couchbase = {
				'Connection' : function(connOptions, connectionCallback){
					this.shutdown = function(){};
					setTimeout(function(){
						connectionCallback({'error' : 'error'});
					}, 10);
				}
			};
			ds.connect(function(){
				assert.fail();
			}, function() {
				done();
			});
		})

	});

	describe('disconnect', function() {

		it('should throw an IllegalArgument exception if the parameter passed is not a function', function(){
			try {
				var ds = new DataSource(configs);
				ds.connect(function(){}, function(){});
				ds.disconnect();
			} catch (e){
				assert.equal('IllegalArgument', e.name);
			}
		});

		it('should call Couchbase disconnect if the type is Couchbase and there is an active connection', function(done){

			var ds = new DataSource(configs);
			ds.couchbase = mockCouchbase();
			ds.connect(function(){
				ds.disconnect(function(){
					done();
				}, function(){
					assert.fail();
				});
			}, function(){
				assert.fail();
			});

		});

		it('should call onError if the connection type is invalid', function(done){

			var ds = new DataSource(configs);
			ds.couchbase = mockCouchbase();
			ds.connect(function(){
				ds.type = 'Invalid';
				ds.disconnect(function(){
					assert.fail();
				}, function(){
					done();
				});
			}, function(){});

		});

		it('should call onError if there is no active connection', function(done){
			var ds = new DataSource(configs);
			ds.disconnect(function(){
				assert.fail();
			}, function(){
				done();
			});
		})

	});
});