SystemInfo = require './../../../src/Component/Builtin/SystemInfo'
assert = require 'assert'

describe "SystemInfo.js", ->
    describe "getAll", ->
        it "should return an updated data", ->
            si = new SystemInfo()
            assert si.getAll()

describe "SystemInfo.js", ->
    describe "variable", ->
        it "should return an updated on variable data", ->
            si = new SystemInfo()
            assert si.variable()

describe "SystemInfo.js", ->
    describe "static", ->
        it "should return an updated on static data", ->
            si = new SystemInfo()
            assert si.static()
