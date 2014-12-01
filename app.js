var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var gpio = require("pi-gpio");
var fs = require('fs');
var mysql = require('mysql');

server.listen(80);

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {

  if (global.lastTemp) {
    sendTemp(global.lastTemp);
  }
    //socket.emit('temp', { temp: temp });
  
  //socket.emit('test', { hello: 'world' });
  socket.on('settemp', function (data) {
    console.log(data);
  });
});



//var express = require('express');
//var app = express();
/*
var app = require('express').createServer();
var io = require('socket.io')(app);
*/

global.pin = -1;
global.temp = 0;

//app.use(express.static(__dirname + '/public')).listen(80); //make a file server - ugh, why so easy

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
    sendTemp(temp); 
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

function sendTemp(temp){
 io.sockets.emit('temp', { temp: temp, date: Date() });
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
