var gpio = require("pi-gpio");
var fs = require('fs');
global.pin = -1;

function getTemp() {
  fs.readFile('/sys/bus/w1/devices/w1_bus_master1/28-000004f90d18/w1_slave', 'utf8', function (err, data) {
    if (err) throw err;
    temp = data.slice(data.search('t=')+2);
    console.log('%s',temp);
    if (temp > 22000) {
      relay(11,1);
    } else { 
      relay(11,0);
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
}, 1000);
