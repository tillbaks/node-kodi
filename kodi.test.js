const test = require('ava')
const sinon = require('sinon')
const kodi = require('./kodi')

// SETUP BEFORE TESTS

test.cb.beforeEach(t => {
  kodi.setOptions({
    host: 'pi',
    port: 9090,
    reconnect: false,
    reconnectSleep: 3000,
    connectionTimeout: 10000,
    sendTimeout: 3000
  })
  t.deepEqual(kodi.eventNames(), [])
  kodi.on('error', console.log)
  t.end()
})

test.cb.afterEach(t => {
  kodi.close({ reconnect: false })
  setTimeout(() => {
    kodi.removeAllListeners()
    t.end()
  }, 1000)
})

// TESTS

test.serial.cb('connection to kodi', t => {
  t.plan(1)

  const connectFunc = sinon.spy()

  kodi.on('connect', connectFunc)

  kodi.connect()

  setTimeout(() => {
    t.is(connectFunc.callCount, 1)
    t.end()
  }, 3000)
})

test.serial.cb('connection timeout', t => {
  t.plan(1)

  kodi.on('error', error => {
    t.is(error.message, 'Was not able to connect before reaching timeout.')
    t.end()
  })

  kodi.connect({ connectionTimeout: 10 })
})

test.serial.cb('sending simple commands', t => {
  t.plan(3)

  kodi.connect()

  kodi.on('connect', async () => {
    const promises = [
      kodi.send('Input.Up'),
      kodi.send('Input.Down')
    ]

    const results = await Promise.all(promises)

    t.is(results.length, 2)
    t.is(results[0], 'OK')
    t.is(results[1], 'OK')
    t.end()
  })
})

// Doesn't work on fast networks - not sure if it's possible to test this..
test.skip.serial.cb('receive response for timed out message', t => {
  t.plan(1)

  kodi.connect({ sendTimeout: 1 })

  kodi.on('connect', async () => {
    const error = await t.throws(kodi.send('Input.Up'))

    t.is(error, 'Failed to send message. No response within timeout.')
    t.end()
  })
})

test.serial.cb('sending advanced commands', t => {
  t.plan(2)

  kodi.connect()

  kodi.on('connect', async () => {
    const result1 = await kodi.send(
      'Application.GetProperties',
      { properties: [ 'volume' ] }
    )

    function isNumeric (n) {
      return !isNaN(parseFloat(n)) && isFinite(n)
    }

    t.true(isNumeric(result1.volume))

    const result2 = await kodi.send(
      'Application.SetVolume',
      { volume: result1.volume }
    )

    t.is(result1.volume, result2)
    t.end()
  })
})

test.serial('sending while not connected', async t => {
  t.plan(2)
  const error = await t.throws(kodi.send('Input.Up'))
  t.is(error.message, 'Failed to send message. No connection to kodi.')
})

test.serial.cb('receives notifications', t => {
  t.plan(3)
  kodi.connect()

  kodi.on('notification', ({ method, params }) => {
    t.is(method, 'Application.OnVolumeChanged')
    t.is(params.data.volume, 99)
  })
  kodi.on('Application.OnVolumeChanged', (params) => {
    t.is(params.data.volume, 99)
  })

  kodi.on('connect', async () => {
    kodi.send('Application.SetVolume', { volume: 99 })
  })

  setTimeout(() => t.end(), 2000)
})
