var fs = require("fs");

function scan_modules(){
	var debug = global.debug;
	fs.readdir('modules/', function(err, files){
		if(err){
			debug.debugging('Modules Scan Error: ' + err, 'error');
			return false;
		}
		load_modules(files);
	});
}

function load_modules(files){
	var debug = global.debug;
	files.forEach(function(dir){
		var config = JSON.parse(fs.readFileSync(__dirname + '/modules/' + dir + '/config.json', 'utf8'));
		var loadmodule = require(__dirname + "/modules/" + dir + "/" + config.mainfile)[config.mainfunc]();
		if(loadmodule === false){
			debug.debugging('Module Load Error: ' + dir, 'error');
		}else{
			debug.debugging('Module Load Successfully: ' + config.name, 'info');
		}
	});
}

module.exports = {
   scan_modules : scan_modules,
   load_modules: load_modules
}