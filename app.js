const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []
const colors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2']

app.use(express.static('public'))

function broadcast(data) {
  const message = JSON.stringify(data)

  connects.forEach((socket) => {
    if (socket.readyState === 1) {
      socket.send(message)
    }
  })
}

app.ws('/ws', (ws, req) => {
  ws.username = '匿名ユーザー'
  ws.color = colors[0]
  connects.push(ws)

  ws.on('message', (message) => {
    let data

    try {
      data = JSON.parse(message)
    } catch (error) {
      return
    }

    if (data.type === 'join') {
      const username = String(data.username || '').trim().slice(0, 20)
      const color = colors.includes(data.color) ? data.color : colors[0]
      ws.username = username || '匿名ユーザー'
      ws.color = color
      broadcast({
        type: 'system',
        text: `${ws.username} さんが参加しました`,
        color: ws.color,
      })
      return
    }

    if (data.type === 'message') {
      const text = String(data.text || '').trim()

      if (!text) {
        return
      }

      broadcast({
        type: 'message',
        username: ws.username,
        color: ws.color,
        text,
      })
    }
  })

  ws.on('close', () => {
    connects = connects.filter((conn) => conn !== ws)
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
