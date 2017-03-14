$(document).ready(function() {

  var generate_chart = function(data) {
    // data contains [[axis], [data1], [data2], etc]
    return c3.generate({
      bindto: '#chart',
      data: {
	x: 'axis',
	columns: data
      },
      axis: {
	x: {
          type: 'timeseries',
          tick: {
            format: '%Y-%m-%d'
          }
	}
      }
    })
  }
  var chart = null;

  var sock = new WebSocket("ws://"+location.host)

  var content = $('.content')

  var submit = $('.add-stock')

  var create_stock = function(stock) {
    let data = stock.split(';')
    chart.load({
      columns: [data]
    })
    var c = '<div id='+data[0]+' class="col-2 card-stock"><button type="button" class="btn btn-danger btn-sm">X</button><span> '+data[0]+'</span></div>'
    content.append(c)
  }

  sock.onopen = function(e) {
    sock.send("ok start")
  }

  sock.onmessage = function(e) {
    // enable button
    submit.prop('disabled', false)
    var data = e.data.split(':')

    // error
    if (data[0] === 'alert') {
      alert(data[1])
      return
    }

    // update axis
    // if (data[0] === 'axis') {
    //   var axis = ['x'].concat(data[1].split(';'))
    //   console.log(axis)
    //   chart.load({
    // 	columns: [axis, ['data123', 1, 2]]
    //   })
    //   chart.unload({ids: ['data123']})
    //   return
    // }

    // unbind all binded functions, to rebind them later on
    $('.card-stock button').unbind()

    if (data[0] === 'initial') {
      content.html('')
      var stock_data = data[1].split(',')
      var axis = stock_data.shift().split(';')
      console.log(stock_data)

      // the 'd' data is a dummy, without it the chart wont render properly
      chart = generate_chart([axis, ['d', 0]])
      if (stock_data.length != 0)
	stock_data.forEach(function(s) { create_stock(s) })
      chart.unload({ids: ['d']}) // urgh
    }
    if (data[0] === 'remove') {
      $('#'+data[1]).remove()
      chart.unload({ids: [data[1]]})
    }
    if (data[0] === 'add') {
      create_stock(data[1])
    }

    // bind here because elements do not exist yet
    $('.card-stock button').click(function(e) {
      var parent = $(this).parent()
      var id = parent.attr('id')
      sock.send('remove '+id)
      parent.remove()
    })
  }

  $('form').submit(function(e) {
    // alert error if wrong
    e.preventDefault()

    // disable sending, prevent spamming
    submit.prop('disabled', true)
    let input = $('.input-stock')
    sock.send(input.val())
    input.val('')
  })
})
