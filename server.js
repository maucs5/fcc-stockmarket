'use strict'

let express = require('express')
let routes = require('./app/routes/index.js')

let app = express()
let websocket = require('express-ws')(app)

app.use('/public', express.static(process.cwd() + '/public'))

routes(app, websocket)

let port = process.env.PORT || 8080
app.listen(port, () => console.log('Node.js listening on port ' + port + '...'))
