var util = require('util'),
    xbmc = require('../xbmc');

//xbmc.on('debug', util.log);
//xbmc.on('error', util.log);

xbmc.connect({host: "127.0.0.1", port: 9090, reconnect: false});

xbmc.on('connect', function () {
    
    xbmc.Player.OnPlay(function(result) {
        console.log(result);    
    });
});