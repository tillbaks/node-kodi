"use strict";
var util = require('util'),
  xbmc = require('../xbmc');

xbmc.connect({
  host: "10.0.0.194",
  port: 9090,
  reconnect: true,
  reconnect_sleep: 5000
});

xbmc.on('connect', function () {
  console.log("connected to xbmc!");
});

xbmc.run("VideoLibrary.GetTVShows", {limits: {start: 0, end: 2}}, function (res) {
  console.log(res.result);
});

xbmc.on("Application.OnVolumeChanged", function (data) {
  console.log(data);
});
