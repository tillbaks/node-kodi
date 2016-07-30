"use strict";

var WebSocket = require("ws");
var async = require("async");
var events = require("events");
var xbmc = new events.EventEmitter();
var jsonrpc_id = 0;
var ws;

var sent_requests = {};
var command_queue = async.queue(function (data, cb) {
  sent_requests[data.id] = function (data) {
    delete sent_requests[data.id];
    cb(data);
  };
  ws.send(JSON.stringify(data));
}, 1);
command_queue.pause();

xbmc.connect = function (options) {

  if (options === undefined) { options = {}; }
  if (options.host === undefined) { options.host = "localhost"; }
  if (options.port === undefined) { options.port = "9090"; }
  if (options.reconnect === undefined) { options.reconnect = false; }
  if (options.reconnect_sleep === undefined) { options.reconnect_sleep = 30000; }

  ws = new WebSocket("ws://" + options.host + ":" + options.port + "/jsonrpc");

  ws.on("open", function onConnect() {
    xbmc.emit("connect");
    command_queue.resume();
  });

  ws.on("close", function onClose() {
    command_queue.pause();
    xbmc.emit("close");
    if (options.reconnect) {
      setTimeout(function () {
        xbmc.connect(options);
      }, options.reconnect_sleep);
    }
  });

  ws.on("error", function onError(err) {
    command_queue.pause();
    xbmc.emit("error", new Error(err));
  });

  ws.on("message", function onData(data) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return;
    }
    if (sent_requests[data.id] !== undefined) {
      sent_requests[data.id](data);
    } else {
      xbmc.emit(data.method, data.params);
    }
  });
};

xbmc.close = function () {
  ws.close();
};

xbmc.run = function (method, params, cb) {

  jsonrpc_id += 1;

  command_queue.push({
    'jsonrpc': '2.0',
    'method': method,
    'params': params,
    'id': jsonrpc_id
  }, cb);
};

module.exports = xbmc;
