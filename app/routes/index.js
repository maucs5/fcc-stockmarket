'use strict'

let path = process.cwd()
let request = require('request')
require('dotenv').load()

// let stock_list = ['AAPL', 'VZ', 'GOOGL', 'FISH', 'CAT']
let stock_list = []
let axis = []

module.exports = function (app, websocket) {

  let inform_clients = data => {
    let clients = websocket.getWss().clients
    clients.forEach(c => c.send(data))
  }

  let generate_quandl = stock => `https://www.quandl.com/api/v3/datasets/WIKI/${stock}/data.json?api_key=${process.env['QUANDL_KEY']}&limit=100`

  // generate a dummy data, to help with creating the chart properly
  // without the proper axis, the chart cannot be generated
  request(generate_quandl('AAPL'), (e,r,b) => {
    let data = JSON.parse(b).dataset_data.data
    let price = data.map(v => v[4]).join(';')
    axis = data.map(v => v[0])
    stock_list.push(`AAPL;${price}`)
    console.log('data loaded')
  })

  app.get('/', (req, res) => {
    res.sendFile(path + '/public/index.html')
  })

  app.ws('/', (ws, req) => {
    ws.on('message', msg => {
      msg = msg.toUpperCase().trim()

      if (msg === 'OK START') {
	ws.send(`initial:axis;${axis.join(';')},${stock_list.join(',')}`)
	return
      }
      if (msg.startsWith('REMOVE ')) {
	let [,id] = msg.split(' ')
	let i = stock_list.indexOf(id)
	stock_list.splice(i, 1)
	inform_clients('remove:'+id)
	return
      }
      if (msg === '') {
	ws.send('alert:Empty input')
	return
      }

      let url = `http://d.yimg.com/aq/autoc?query=${msg}&region=US&lang=en-US`
      request(url, (e,r,b) => {
	let d = JSON.parse(b).ResultSet.Result[0]
	if ((d !== undefined) && (d.symbol === msg)) {
	  if (stock_list.indexOf(msg) === -1)
	    request(generate_quandl(d.symbol), (e,r,b) => {
	      let data = JSON.parse(b).dataset_data.data
	      let price = data.map(v => v[4]).join(';')
	      axis = data.map(v => v[0])
	      stock_list.push(`${d.symbol};${price}`)
	      inform_clients('axis:'+axis.join(';'))
	      inform_clients(`add:${d.symbol};${price};`)
	    })
	  else {
	    ws.send('none:')
	  }
	} else {
	  ws.send('alert:Invalid stock')
	}
      })
    })
  })
}
