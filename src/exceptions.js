/*jslint devel: true, node: true, indent: 4 */
'use strict';
module.exports = {
    Fatal : function (message, cause) {
        this.cause = cause;
        this.name = 'Fatal';
        this.message = message;
        this.stack = new Error().stack;
    },
    ApplicationNotFound : function (message, cause) {
        this.cause = cause;
        this.name = 'ApplicationNotFound';
        this.message = message;
    },
    ControllerNotFound : function (message, cause) {
        this.cause = cause;
        this.name = 'ControllerNotFound';
        this.message = message;
    },
    InvalidUrl : function (message, cause) {
        this.cause = cause;
        this.name = 'InvalidUrl';
        this.message = message;
    },
    InvalidMethod : function (message, cause) {
        this.cause = cause;
        this.name = 'InvalidMethod';
        this.message = message;
    },
    MethodNotFound : function (message, cause) {
        this.cause = cause;
        this.name = 'MethodNotFound';
        this.message = message;
    },
    Timeout : function (message, cause) {
        this.cause = cause;
        this.name = 'Timeout';
        this.message = message;
    },
    IllegalArgument : function (message) {
        this.message = message;
        this.name = 'IllegalArgument';
    },
    OperationInterrupted : function (message) {
        this.message = message;
        this.name = 'OperationInterrupted';
    }
};
