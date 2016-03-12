var mysql = require("mysql");

function mysql_connect(){
    var config = global.config;
    var debug = global.debug;

    var mysqlcon = mysql.createConnection({
        host     : config.sql.host,
        user     : config.sql.user,
        password : config.sql.password,
        database : config.sql.database
    });
    mysqlcon.connect(function(err) {
        if (err) {
            debug.debugging('MySQL Error: ' + err.stack , 'error');
        }
        debug.debugging('MySQL Connected as ID ' + mysqlcon.threadId , 'info');
    });
    handleDisconnect(mysqlcon);
    return mysqlcon;
};

function handleDisconnect(conn) {
    conn.on('error', function(err) {
        if (!err.fatal) {
            return;
        }
        
        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            console.log(err);
        }
        
        console.log('Re-connecting lost connection: ' + err.stack);
        
        conn = mysql_connect(conn);
        handleDisconnect(conn);
    });
};

module.exports = {
   handleDisconnect :  handleDisconnect,
   mysql_connect : mysql_connect
}