var fs = require("fs");
var clc = require('cli-color');

function debugging(data, mode){
	var config = global.config;
	var date = new Date();
	var string = '';
	var error = clc.red.bold;
	var info = clc.green;

	string += '[' + String(mode) + ']';
	string += '[' + date.toISOString().slice(0, 19).replace('T', ' ') + ']';
	string += ': ' + String(data);
	string += "\r\n";

	if(config.debug.enable == true){
		if(config.debug.writelog == true){
			fs.writeFileSync('./irc.log', String(string), { flag: 'a+', encoding: 'utf8' });
		}
		switch(mode){
			case 'info':
				console.log(info(string));
			case 'error':
				console.log(error(string));
		}
	}
}

module.exports = {
   debugging :  debugging
}