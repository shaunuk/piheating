var gpio = require("pi-gpio");
var fs = require('fs');
var mysql = require('mysql');
var static = require('node-static');

global.pin = -1;
global.temp = 0;
//
// Create a node-static server instance to serve the './public' folder
//
var file = new static.Server('./public');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(80);



var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'piheating'
});

function getTemp() {
  fs.readFile('/sys/bus/w1/devices/w1_bus_master1/28-000004f90d18/w1_slave', 'utf8', function (err, data) {
    if (err) throw err;
    temp = parseFloat((data.slice(data.search('t=')+2)/1000).toFixed(1));
    console.log('Current Temperature %s last %s',temp,global.lastTemp);
    if (global.lastTemp != temp) { //only do logic and save if the tewmp has changed
      if (temp > 19) {
        relay(11,1);
      } else { 
        relay(11,0);
      }
      connection.query('insert into log values ("0",now(),"T","'+temp+'")', function(err, rows) {
      console.log('written');
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
        global.lastTemp = temp; //set global for next time
        // connected! (unless `err` is set)
      });
    }
  });
}



function relay(pin,position) {
  if (global.pin != position) {
    gpio.open(pin, "output", function(err) {        // Open pin 16 for output
      console.log('setting pin %s to %s',pin,position);
      gpio.write(pin,position, function() {            // Set pin 16 high (1)
	global.pin = position;
        gpio.close(pin);                        // Close pin 16
      });
    });
  }
}

setInterval(function(){
  getTemp();
}, 5000);

console.log('Running');



