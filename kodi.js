const WebSocket = require('ws')
const { EventEmitter } = require('events')
const options = {
  host: 'localhost',
  port: 9090,
  reconnect: false,
  reconnectSleep: 3000,
  connectionTimeout: 10000,
  sendTimeout: 3000
}
const kodi = new EventEmitter()
let jsonrpcId = 0
let socket

const sentRequests = Object.create(null)

kodi.setOptions = opts => {
  if (opts === undefined) return
  Object.entries(opts).forEach(([ key, value ]) => {
    options[key] = value
  })
}

kodi.close = opts => {
  kodi.setOptions(opts)
  socket.close()
}

kodi.connect = opts => {
  kodi.setOptions(opts)

  socket = new WebSocket(`ws://${options.host}:${options.port}/jsonrpc`)

  const connectionTimeout = setTimeout(() => {
    kodi.emit('error', new Error('Was not able to connect before reaching timeout.'))
    setTimeout(() => socket.terminate(), 1)
  }, options.connectionTimeout)

  socket.on('open', () => {
    clearTimeout(connectionTimeout)
    kodi.emit('connect')
  })

  socket.on('close', () => {
    kodi.emit('close')
    if (options.reconnect) {
      setTimeout(() => {
        kodi.connect(options)
      }, options.reconnectSleep)
    }
  })

  socket.on('error', error => kodi.emit('error', error))

  socket.on('message', message => {
    let data
    try {
      data = JSON.parse(message)
      if (data.id && sentRequests[data.id] === undefined) {
        throw new Error(`Message for unknown id received.`)
      }
    } catch (error) {
      kodi.emit('error', error)
      return
    }
    const { id, method, params } = data
    if (id && sentRequests[id]) {
      sentRequests[id](data)
    } else {
      kodi.emit(method, params)
      kodi.emit('notification', { method, params })
    }
  })
}

kodi.send = (method, params) =>
  new Promise((resolve, reject) => {
    if (socket.readyState !== WebSocket.OPEN) {
      return reject(new Error('Failed to send message. No connection to kodi.'))
    }

    const message = { jsonrpc: '2.0', method, params, id: (jsonrpcId += 1) }

    socket.send(JSON.stringify(message), error => {
      if (error) {
        return reject(error)
      }

      const timeout = setTimeout(() => {
        reject(new Error('Failed to send message. No response within timeout.'))
        delete sentRequests[message.id]
      }, options.sendTimeout)

      sentRequests[message.id] = ({ id, error, result }) => {
        clearTimeout(timeout)
        delete sentRequests[id]
        if (error) {
          return reject(error)
        }
        resolve(result)
      }
    })
  })

module.exports = kodi
