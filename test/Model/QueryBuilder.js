// /*jslint devel: true, node: true, indent: 4, unparam: true */
// /*globals describe, it, beforeEach */
// 'use strict';
// var assert = require('assert');
// var util = require('util');

// var QueryBuilder = require('./../../src/Model/QueryBuilder');

// describe('QueryBuilder.js', function () {

//     var $;

//     beforeEach(function () {
//         $ = new QueryBuilder();
//     });

//     describe('selectStarFrom', function () {

//         it('should output SELECT * FROM + table', function () {
//             assert.equal('SELECT * FROM sky', $.selectStarFrom('sky').build());
//         });

//     });

//     describe('select', function () {

//         it('should output SELECT + the parameters if they are passed', function () {
//             assert.equal('SELECT c1, c2, c3', $.select('c1', 'c2', 'c3').build());
//         });

//     });

//     describe('from', function () {

//         it('should output FROM + table if the parameter is passed', function () {
//             assert.equal('FROM sky', $.from('sky').build());
//         });

//     });

//     describe('deleteFrom', function () {

//         it('should output DELETE FROM + table if the parameter is passed', function () {
//             assert.equal('DELETE FROM sky', $.deleteFrom('sky').build());
//         });

//     });

//     describe('where', function () {
//         return;
//     });

//     describe('join', function () {
//         return;
//     });

//     describe('innerJoin', function () {
//         return;
//     });

//     describe('update', function () {
//         return;
//     });

//     describe('set', function () {
//         return;
//     });

//     describe('insert', function () {
//         return;
//     });

//     describe('groupBy', function () {

//         it('should output GROUP BY + fields if they are passed', function () {
//             assert.equal('GROUP BY c1, c2, c3', $.groupBy('c1', 'c2', 'c3').build());
//         });

//     });

//     describe('having', function () {

//         it('should output HAVING + conditions', function () {
//             assert.equal('HAVING a > 10 AND b < 10', $.having({
//                 'a' : '> 10',
//                 'b' : '< 10'
//             }).build());
//         });

//     });

//     describe('limit', function () {

//         it('should output LIMIT + parameters if they are passed',  function () {
//             assert.equal('LIMIT :limit, 1000', $.limit(':limit', 1000).build());
//         });

//     });

//     // Operations
//     describe('equal', function () {

//         it('should output an equals expression', function () {
//             assert.equal('x = 10', $.equal('x', 10));
//         });

//         it('should output an IS NULL if the right parameter is null', function () {
//             assert.equal('x IS NULL', $.equal('x', null));
//         });

//         it('should throw an IllegalArgument exception if one of the parameters is undefined', function () {
//             try {
//                 $.equal();
//                 assert.fail();
//             } catch (e) {
//                 assert.equal('IllegalArgument', e.name);
//             }
//         });

//     });

//     describe('less', function () {

//         it('should output a less expression', function () {
//             assert.equal('x < 10', $.less('x', 10));
//         });

//     });

//     describe('Integration Tests', function () {

//         it('should output: SELECT c1, c2, c3 FROM sky WHERE x BETWEEN :x1 AND :x2 AND (y = :y OR z < :z)', function () {

//             var sql = $.select('c1', 'c2', 'c3').from('sky').where(
//                 $.equal('y', ':y'),
//                 $.less('z', ':z'),
//                 $.between('x', 'NOW()', 'AAAA'),
//                 $.or(
//                     $.equal('y', 10),
//                     $.equal('z', 20),
//                     $.between('x', 10, 200)
//                 )
//             ).build();
//             var expected = 'SELECT c1, c2, c3 FROM sky WHERE x BETWEEN :x1 AND :x2 AND (y = :y OR z < :z) AND x BETWEEN NOW() AND AAAA';
//             assert.equal(expected, sql);
//         });

//         it('should output: SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000', function () {
//             var sql = $.selectStarFrom('sky').groupBy('x').having().limit(100, 1000).build();
//             var expected = 'SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000';
//             assert.equal(expected, sql);
//         });

//         it('should output: DELETE FROM sky WHERE x = y', function () {
//             var sql = $.deleteFrom('sky').where().build();
//             var expected = 'DELETE FROM sky WHERE x = y';
//             assert.equal(expected, sql);
//         });

//     });


// });