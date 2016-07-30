node-xbmc
=========

simple interface to the xbmc jsonrpc api, still a work in progress but it works [:

xbmc api methods available http://wiki.xbmc.org/index.php?title=JSON-RPC_API

```javascript
"use strict";
var xbmc = require('../xbmc');

// Connect to XBMC
// The options below are the defaults
xbmc.connect({
  host: "localhost",
  port: 9090,
  reconnect: false,
  reconnect_sleep: 30000
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

// Closes the connection to XBMC
xbmc.close();
```
