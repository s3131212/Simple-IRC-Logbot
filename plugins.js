var fs = require("fs");

function scan_plugins(){
	var debug = global.debug;
	fs.readdir('plugins/', function(err, files){
		if(err){
			debug.debugging('Plugins Scan Error: ' + err, 'error');
			return false;
		}
		load_plugins(files);
	});
}

function load_plugins(files){
	var debug = global.debug;
	files.forEach(function(dir){
		var config = JSON.parse(fs.readFileSync(__dirname + '/plugins/' + dir + '/config.json', 'utf8'));
		var loadplugin = require(__dirname + "/plugins/" + dir + "/" + config.mainfile)[config.mainfunc]();
		if(loadplugin === false){
			debug.debugging('Plugin Load Error: ' + dir, 'error');
		}else{
			debug.debugging('Plugin Load Successfully: ' + config.name, 'info');
		}
	});
}

module.exports = {
   scan_plugins : scan_plugins,
   load_plugins: load_plugins
}