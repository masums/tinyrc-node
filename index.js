// const fs = require('fs')
// const https = require('https')
const shortid = require('shortid')
const WebSocket = require('ws')

// Uncomment these lines and remove the code for insecure WebSocket server
// creation if you want to use HTTPS (highly recommended).
/*
const httpsServer = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, (req, res) => {
  res.writeHead(404)
  res.end()
})

httpsServer.listen(6503, () => {
  console.log(`An HTTPS server is now listening on port 6503.
Press (Ctrl/Cmd)+C to quit.`)
})

const wss = new WebSocket.Server({
  server: httpsServer
})
*/

// FIXME: Use HTTPS here for production. If someone MITMs a device ID, giving
// them remote access to another machine, the possibilites are disastrous.
// However, self-signed certificates don't work with React Native, so use an
// insecure connection for local development.
const wss = new WebSocket.Server({
  port: 6503
}, () => {
  console.log(`An insecure WebSocket server is now listening on port 6503.
Press (Ctrl/Cmd)+C to quit.`)
})

let rooms = {}

function getUniqueShortId () {
  let id = shortid.generate()
  if (typeof rooms[id] === 'undefined') {
    return id
  } else {
    return getUniqueShortId()
  }
}

function onMessage (ws, message) {
  if (typeof message !== 'string') {
    return
  }

  let msg
  try {
    msg = JSON.parse(message)
  } catch (e) {
    return
  }

  switch (msg.type) {
    case 'setlaunchers':
      if (typeof ws.room === 'string' &&
        typeof rooms[ws.room] !== 'undefined') {
        rooms[ws.room].launchers = msg.launchers
        if (rooms[ws.room].client !== null) {
          rooms[ws.room].client.send(JSON.stringify({
            type: 'setlaunchers',
            launchers: rooms[ws.room].launchers
          }))
        }
      }
      break
    case 'getlaunchers':
      if (typeof ws.room === 'string' &&
        typeof rooms[ws.room] !== 'undefined') {
        ws.send(JSON.stringify({
          type: 'setlaunchers',
          launchers: rooms[ws.room].launchers
        }))
      }
      break
    case 'serve':
      // If we are already serving a room, delete it before starting a new one.
      if (typeof ws.room === 'string' &&
        typeof rooms[ws.room] !== 'undefined') {
        delete rooms[ws.room]
      }
      ws.room = getUniqueShortId()
      rooms[ws.room] = {
        server: ws,
        client: null,
        launchers: null
      }
      ws.send(JSON.stringify({
        type: 'setroom',
        room: ws.room
      }))
      break
    case 'join':
      if (typeof msg.room === 'string' &&
        typeof rooms[msg.room] !== 'undefined' &&
        rooms[msg.room].server !== null &&
        rooms[msg.room].client === null) {
        ws.send(JSON.stringify({
          type: 'joinsuccess'
        }))
        ws.room = msg.room
        rooms[msg.room].client = ws
      } else {
        ws.send(JSON.stringify({
          type: 'joinfail'
        }))
      }
      break
    default:
      if (typeof ws.room === 'string' &&
        typeof rooms[ws.room] !== 'undefined') {
        if (ws === rooms[ws.room].server && rooms[ws.room].client !== null) {
          rooms[ws.room].client.send(message)
        } else if (ws === rooms[ws.room].client &&
          rooms[ws.room].server !== null) {
          rooms[ws.room].server.send(message)
        }
      }
  }
}

function onConnection (ws) {
  ws.isAlive = true
  ws.on('pong', function () {
    this.isAlive = true
  })

  ws.on('close', function () {
    if (typeof this.room === 'string' &&
      typeof rooms[this.room] !== 'undefined') {
      // Destroy the entire room if the server hangs up. Don't destroy the
      // entie room if the client hangs up, because they might reconnect later.
      if (this === rooms[this.room].server) {
        this.terminate()
        rooms[this.room].server = null
        if (rooms[this.room].client !== null) {
          rooms[this.room].client.terminate()
          rooms[this.room].client = null
        }
        delete rooms[this.room]
      } else if (this === rooms[this.room].client) {
        this.terminate()
        rooms[this.room].client = null
      }
    }
  })

  // Prevent server from crashing with unhandled exception
  ws.on('error', function (e) {})

  ws.on('message', (message) => onMessage(ws, message))
}

function pingConnections () {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.close()
    }

    ws.isAlive = false
    ws.ping('', false, true)
  })
}

wss.on('connection', onConnection)
setInterval(pingConnections, 30000)
