ACL = require './../../../src/Component/Builtin/ACL'
assert = require 'assert'

describe "ACL.js", ->
    describe "isAllowed", ->
        describe "complex rules", ->
            it "should return ga when there is a valid rule and a more restrictive rule after", ->
                aclJSON = url: [
                    {
                        controller: "some_controller"
                        group: "some_group"
                        rule: [
                            1
                            1
                            1
                            1
                        ]
                    }
                    {
                        controller: "*"
                        group: "*"
                        rule: [
                            0
                            0
                            0
                            0
                        ]
                    }
                ]
                acl = new ACL(aclJSON)
                assert.equal "ga", acl.isAllowed("some_group", "some_controller", "put")

            it "should return ga when there restrictive rule and a valid rule after", ->
                aclJSON = url: [
                    {
                        controller: "*"
                        group: "*"
                        rule: [
                            0
                            0
                            0
                            0
                        ]
                    }
                    {
                        controller: "some_controller"
                        group: "some_group"
                        rule: [
                            1
                            1
                            1
                            1
                        ]
                    }
                ]
                acl = new ACL(aclJSON)
                assert.equal "ga", acl.isAllowed("some_group", "some_controller", "put")

        describe "simple rules", ->
            it "should throw an exception when the method is invalid", ->
                aclJSON = url: [
                    controller: "*"
                    group: "*"
                    rule: [
                        1
                        1
                        1
                        1
                    ]
                ]
                try
                    acl = new ACL(aclJSON)
                    acl.isAllowed "some_group", "some_controller", "somemethod"
                    assert.fail()
                catch e
                    assert.equal "InvalidMethod", e.name

            it "should return ** when everything is allowed", ->
                aclJSON = url: [
                    controller: "*"
                    group: "*"
                    rule: [
                        1
                        1
                        1
                        1
                    ]
                ]
                acl = new ACL(aclJSON)
                assert.equal "**", acl.isAllowed("some_group", "some_controller", "put")

            it "should return false when everything is allowed except the method", ->
                aclJSON = url: [
                    controller: "*"
                    group: "*"
                    rule: [
                        0
                        0
                        0
                        0
                    ]
                ]
                acl = new ACL(aclJSON)
                assert.equal false, acl.isAllowed("some_group", "some_controller", "put")

            it "should return ga when controller, group, and method match", ->
                aclJSON = url: [
                    controller: "some_controller"
                    group: "some_group"
                    rule: [
                        1
                        1
                        1
                        1
                    ]
                ]
                acl = new ACL(aclJSON)
                assert.equal "ga", acl.isAllowed("some_group", "some_controller", "put")

            it "should return *A when controller, group (any), and method match", ->
                aclJSON = url: [
                    controller: "some_controller"
                    group: "*"
                    rule: [
                        1
                        1
                        1
                        1
                    ]
                ]
                acl = new ACL(aclJSON)
                assert.equal "*A", acl.isAllowed("some_group", "some_controller", "put")

            it "should return G* when group, controller (any), and method match", ->
                aclJSON = url: [
                    controller: "*"
                    group: "some_group"
                    rule: [
                        1
                        1
                        1
                        1
                    ]
                ]
                acl = new ACL(aclJSON)
                assert.equal "G*", acl.isAllowed("some_group", "some_controller", "put")
