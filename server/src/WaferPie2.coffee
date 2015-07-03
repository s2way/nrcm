###
# Copyright 2014 Versul Tecnologias Ltda
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

# Dependencies
path = require 'path'
_ = require 'underscore'


class WaferPie

    # Defaults
    @VERSION: '2.0.0'
    @DEFAULT_URL_FORMAT: '/$application/$controller'
    @DEFAULT_LISTEN_PORT: 80
    @DEFAULT_LISTEN_ADDRESS: '0.0.0.0'
    @DEFAULT_LISTEN_FAMILY: 'IPv4'
    @DEFAULT_APPS:
        'default': 'The default WaferPie application.'

    # Configs
    @CONFIG_URL_FORMAT: 'urlFormat'
    @CONFIG_LISTEN_PORT: 'port'
    @CONFIG_LISTEN_ADDRESS: 'address'
    @CONFIG_LISTEN_FAMILY: 'family'
    @CONFIG_APPS: 'apps'

    # Exceptions
    @ERROR_INVALID_CONFIG_FILE: 'Config file is invalid.'
    @ERROR_INVALID_CONFIG_PARAMETER: 'Config parameter is invalid.'
    @ERROR_MISS_CONFIGURATION: 'Missing call configure.'

    constructor: (deps) ->

        # Injectable dependencies
        @Files = deps['Files'] ? require './../src/Component/Builtin/Files'
        @Exceptions = deps['Exceptions'] ? require './../src/Util/Exceptions'

        # Map folder structure
        @_paths =
            root: path.resolve './'

        # Shared object amongst all applications
        @limbo = {}

        # Config
        @config = {}
        @configured = false
        @apps = {}

    # Setup the basic configurations
    configure: (configFileName) ->
        if configFileName
            try
                @config = @Files.file2JSON configFileName
            catch e
                throw new @Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_FILE, e

        #TODO: Create a component to validate and set defaults in a configuration file using Rules class
        # Setup defaults
        @config[WaferPie.CONFIG_URL_FORMAT] = WaferPie.DEFAULT_URL_FORMAT unless @config[WaferPie.CONFIG_URL_FORMAT]
        @config[WaferPie.CONFIG_LISTEN_PORT] = WaferPie.DEFAULT_LISTEN_PORT unless @config[WaferPie.CONFIG_LISTEN_PORT]
        @config[WaferPie.CONFIG_LISTEN_ADDRESS] = WaferPie.DEFAULT_LISTEN_ADDRESS unless @config[WaferPie.CONFIG_LISTEN_ADDRESS]
        @config[WaferPie.CONFIG_LISTEN_FAMILY] = WaferPie.DEFAULT_LISTEN_FAMILY unless @config[WaferPie.CONFIG_LISTEN_FAMILY]
        @config[WaferPie.CONFIG_APPS] = WaferPie.DEFAULT_APPS unless @config[WaferPie.CONFIG_APPS]

        # Check config
        throw new @Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_PARAMETER unless _.isString @config[WaferPie.CONFIG_URL_FORMAT]
        throw new @Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_PARAMETER unless _.isString @config[WaferPie.CONFIG_LISTEN_ADDRESS]
        throw new @Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_PARAMETER unless _.isString @config[WaferPie.CONFIG_LISTEN_FAMILY]
        throw new @Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_PARAMETER unless _.isNumber @config[WaferPie.CONFIG_LISTEN_PORT]

        @_configured = true

    didConfigure: ->
        throw new @Exceptions.Fatal WaferPie.ERROR_MISS_CONFIGURATION unless @_configured

    # Check and build the app
    deploy: (appName) ->

    start: ->
        @didConfigure()

    stop: ->
    restart: ->
    reload: ->


exports = module.exports = WaferPie

# Expose internals
exports.rules = require './../src/Component/Builtin/Rules'
exports.exceptions = require './../src/Util/Exceptions'
exports.files = require './../src/Component/Builtin/Files'
exports.Validator = require './../src/Component/Builtin/Validator'
