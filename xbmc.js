/*jslint node:true*/
"use strict";
var net = require('net'),
    util = require('util'),
    events = require('events');


function XBMC(options) {

    var xbmc, config,
        self = this,
        jsonrpc_id = 0,
        message_queue = {},
        buffer = '';

    options = options || {};

    config = {
        'port': 9090,
        'reconnect': true,
        'reconnect_sleep': 5
    };
    self.is_connected = false;

    // Main send function
    // Callback will be called when response is received
    // All API methods (fetched from XBMC) call this function
    function send(method, params, callback) {
        var id, message;

        if (self.is_connected) {

            jsonrpc_id += 1;
            id = jsonrpc_id;
            message = JSON.stringify({
                'jsonrpc': '2.0',
                'method': method,
                'params': params,
                'id': id
            });

            xbmc.write(message);

            message_queue[id] = {
                'id': id,
                'method': method,
                'params': params,
                'callback': callback
            };

            self.emit("debug", util.format("Sent command to %s:%s: %j", config.host, config.port, message));
            return true;
        }

        if (typeof callback === 'function') {
            callback(false);
        }
        return false;
    }

    self.connect = function (options) {

        var connection_properties;

        if (typeof options !== 'undefined') {
            if (typeof options.host !== 'undefined') { config.host = options.host; }
            if (typeof options.port !== 'undefined') { config.port = options.port; }
            if (typeof options.reconnect !== 'undefined') { config.reconnect = options.reconnect; }
            if (typeof options.reconnect_sleep !== 'undefined') { config.reconnect_sleep = options.reconnect_sleep; }
        }

        connection_properties = {"host": config.host, "port": config.port};

        self.emit("debug", util.format("Connecting to %s:%s", config.host, config.port));

        if (typeof xbmc === 'undefined') {

            xbmc = net.connect(connection_properties);

            xbmc.on('connect', function () {

                self.is_connected = true;

                // Do a jsonrpc introspect to create all methods
                // so you can call xbmc.Player.Stop(params, callback)
                // instead of xbmc.send('Player.Stop', params, callback)
                send('JSONRPC.Introspect', {}, function (res) {

                    var method, notification;

                    // TODO: Possible to merge method and notification functions?
                    function create_method(method_name) {
                        var parts = method_name.split("."),
                            namespace = parts[0],
                            method = parts[1];

                        if (typeof self[namespace] === 'undefined') {
                            self[namespace] = {};
                        }
                        self[namespace][method] = function (arg1, arg2) {
                            var params = (typeof arg1 !== 'function') ? arg1 : {},
                                callback = (typeof arg1 === 'function') ? arg1 : arg2;
                            send(method_name, params, callback);
                        };
                    }
                    function create_notification(method_name) {
                        var parts = method_name.split("."),
                            namespace = parts[0],
                            method = parts[1];

                        if (typeof self[namespace] === 'undefined') {
                            self[namespace] = {};
                        }
                        self[namespace][method] = function (callback) {
                            self.on(method_name, callback);
                        };
                    }

                    for (method in res.result.methods) {
                        create_method(method);
                    }

                    for (notification in res.result.notifications) {
                        create_notification(notification);
                    }

                    self.emit("debug", util.format("Connected to %s:%s", config.host, config.port));
                    self.emit('connect');
                });
            });

            xbmc.on('close', function () {

                self.is_connected = false;
                self.emit("debug", util.format("Disconnedted from %s:%s", config.host, config.port));
                self.emit('close');

                if (config.reconnect) {

                    setTimeout(self.connect, config.reconnect_sleep * 1000);
                }
            });

            xbmc.on('error', function (err) {

                self.emit("error", util.format("Server error on (%s:%s): %j", config.host, config.port, err));
                xbmc.destroy();
            });

            xbmc.on('data', function (data) {

                self.emit("debug", util.format("Received data from %s:%s: %s", config.host, config.port, data));

                buffer += data;

                try {
                    // Try to parse data in buffer
                    data = JSON.parse(buffer);
                } catch (e) {
                    // Return if not parsable yet (partial data)
                    return;
                }
                buffer = "";

                if (typeof message_queue[data.id] === 'object') {

                    if (typeof message_queue[data.id].callback === 'function') {
                        message_queue[data.id].callback(data);
                    }
                    delete message_queue[data.id];

                } else {

                    self.emit(data.method, data.params);
                }
            });

            return;
        }
        xbmc.connect(connection_properties);
        return;
    };

    self.close = self.disconnect = function () {

        if (self.is_connected) {
            xbmc.destroy();
        }
    };
}
util.inherits(XBMC, events.EventEmitter);

module.exports = new XBMC();