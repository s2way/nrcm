assert = require("assert")
ModelTrigger = require("./../../src/Model/ModelTrigger")

describe "ModelTrigger", ->
    describe "execute", ->
        it "should not call after if operation passes an error", (done) ->
            operationCalled = false
            afterCalled = false
            operation = (callback) ->
                operationCalled = true
                callback "an error", {}
                return

            after = (callback, result, err) ->
                afterCalled = true
                callback result, err
                return

            trigger = new ModelTrigger(null, operation, after, (err) ->
                assert.equal true, operationCalled
                assert.equal false, afterCalled
                assert.equal "an error", err
                done()
                return
            )
            trigger.execute()
            return

        it "should call before, operation and after if no error is passed", (done) ->
            beforeCalled = false
            operationCalled = false
            afterCalled = false
            before = (callback) ->
                beforeCalled = true
                callback true
                return

            operation = (callback) ->
                operationCalled = true
                callback false, {}
                return

            after = (callback, err, result) ->
                afterCalled = true
                assert.equal false, err
                assert.equal JSON.stringify({}), JSON.stringify(result)
                callback err, result
                return

            trigger = new ModelTrigger(before, operation, after, (err, result) ->
                assert.equal true, beforeCalled
                assert.equal true, operationCalled
                assert.equal true, afterCalled
                assert.equal false, err
                assert.equal JSON.stringify({}), JSON.stringify(result)
                done()
                return
            )
            trigger.execute()
            return

        it "should function normally if before, operation and after are not functions", (done) ->
            trigger = new ModelTrigger(null, null, null, ->
                done()
                return
            )
            trigger.execute()
            return

        it "should not call operation and after if false is passed to the before callback", (done) ->
            beforeCalled = false
            operationCalled = false
            afterCalled = false
            before = (callback) ->
                beforeCalled = true
                callback false
                return

            operation = (callback) ->
                operationCalled = true
                callback false, {}
                return

            after = (callback, err, result) ->
                afterCalled = true
                callback err, result
                return

            trigger = new ModelTrigger(before, operation, after, ->
                assert.equal true, beforeCalled
                assert.equal false, operationCalled
                assert.equal false, afterCalled
                done()
                return
            )
            trigger.execute()
            return

        return

    return
