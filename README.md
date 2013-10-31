node-xbmc
=========

simple interface to the xbmc jsonrpc api, still a work in progress but it works [:

didn't want to abstract away the really good xbmc api so all api methods available on the connected xbmc can be called as they are represented on the xbmc api reference http://wiki.xbmc.org/index.php?title=JSON-RPC_API

when connecting we send a JSONRPC.Introspect to get all methods then add them to this node API, so any additions to the xbmc api should work without any changes

```javascript
var xbmc = require("xbmc");

// Connect to xbmc (we don't want to reconnect after we disconnect so we set it here in the connection options)
xbmc.connect({host: "127.0.0.1", port: 9090, reconnect: false});

// When connected you can do stuff
xbmc.on('connect', function () {

    // Like getting the first 2 tvshows like this
    xbmc.VideoLibrary.GetTVShows({limits: {start: 0, end: 2}}, function (res) {
        // Access result in callback
        console.log(res.result);
        
        xbmc.disconnect();
    });

});
```

Have not decided how to handle notifications yet so they work like this right now:

```javascript
xbmc.on('Player.OnPlay', function(data) {
  // we got some data
  console.log(data);
});
```
