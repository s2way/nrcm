SystemInfo = require './../../../src/Component/Builtin/SystemInfo'
assert = require 'assert'

describe "SystemInfo.js", ->
    describe "refresh", ->
        it "should return an updated data", ->
            si = new SystemInfo()
            assert si.refresh()
