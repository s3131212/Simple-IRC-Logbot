var mysql = require("mysql");

function handleConnection() {
    var config = global.config;
    var debug = global.debug;
    var connection;
    connection = mysql.createConnection({
        host     : config.sql.host,
        user     : config.sql.user,
        password : config.sql.password,
        database : config.sql.database
    });
    connection.connect(function(err) {
        if(err) {
            debug.debugging('MySQL Error: ' + err , 'error');
            setTimeout(handleConnection, 2000);
        }
    });
    connection.on('error', function(err) {
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            debug.debugging('Re-connecting lost connection: ' + err.stack , 'error');
            handleConnection();
        } else {
            debug.debugging('MySQL Error: ' + err , 'error');
        }
    });
    return connection;
}



module.exports = {
   handleConnection : handleConnection
}