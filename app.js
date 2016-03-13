var fs = require("fs");

//Get config
global.config = JSON.parse(fs.readFileSync(__dirname + '/config/config.json', 'utf8'));

//Get module
global.debug = require('./debug.js');
global.mysqlcon = require('./mysql.js').mysql_connect();
global.irc = require('./irc.js').irc_connect();
global.web = require('./web.js').web_connect();

//Load Customize Modules
global.plugins = require('./plugins.js').scan_plugins();