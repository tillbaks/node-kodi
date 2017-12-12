node-kodi
=========

Node.js wrapper for the Kodi JSONRPC API
- A simple API using promises or async/await
- Handles reconnection and timeouts

All Kodi API methods available here: http://kodi.wiki/view/JSON-RPC_API/v8

Install (not released on npm yet):
```
npm install git://github.com/tillbaks/node-kodi.git#master
```

Use:
```javascript
// The options below are the defaults
const kodi = require('kodi')

// Connect to Kodi with spcified options
kodi.connect({
  host: "kodi",
  port: 9090,
  reconnect: false,
  reconnectSleep: 3000,
  connectionTimeout: 10000,
  sendTimeout: undefined
})

// Lets you know when we are connected
kodi.on('connect', function () {
  console.log("connected to kodi!")
})

// Run any Kodi API command and get the results
// NOTE: If you are not connected an error will be thrown
const result = await kodi.send("VideoLibrary.GetTVShows", {limits: {start: 0, end: 2}})
console.log(result)

// Get notified on specific notifications
kodi.on("Application.OnVolumeChanged", function (data) {
  console.log(data)
})

// Get notified on any notifications
kodi.on("notification", function ({ method, params }) {
  console.log('Notification for method:', method)
  console.log('Parameters:', params)
})

// Changes connection options which will be used on next reconnection
kodi.setOptions({
  host: 'pi',
  port: 9090,
  reconnect: false,
  reconnectSleep: 3000,
  connectionTimeout: 10000,
  sendTimeout: 3000
})

// Closes the connection to Kodi
kodi.close()
```

See tests for more usage examples
