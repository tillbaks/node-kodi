node-xbmc
=========

Simple interface to the XBMC/Kodi JSONRPC API

API methods available here: http://kodi.wiki/view/JSON-RPC_API/v6

Install:
```
npm install git://github.com/tillbaks/node-xbmc.git#master
```

Use:
```javascript
"use strict";
var xbmc = require('xbmc');

// Connect to XBMC
// The options below are the defaults
xbmc.connect({
  host: "localhost",
  port: 9090,
  reconnect: false,
  reconnect_sleep: 3000
});

// Lets you know when we are connected
xbmc.on('connect', function () {
  console.log("connected to xbmc!");
});

// Run any XBMC API command and get the results
// NOTE: If you are not connected the call will be placed in a queue and executed as the connection is restored.
xbmc.run("VideoLibrary.GetTVShows", {limits: {start: 0, end: 2}}, function (res) {
  console.log(res.result);
});

// Get notified on any notifications you desire
xbmc.on("Application.OnVolumeChanged", function (data) {
  console.log(data);
});

// Changes connection options
xbmc.setOptions({
  host: "localhost",
  port: 9090,
  reconnect: true,
  reconnect_sleep: 30000
});

// Closes the connection to XBMC
xbmc.close();
```
