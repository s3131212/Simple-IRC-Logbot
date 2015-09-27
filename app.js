var irc = require("irc");
var fs = require("fs");
var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var time = process.hrtime()[0];

/* MySQL Functions*/
function mysql_connect(host, user, password, database){
    var mysqlcon = mysql.createConnection({
        host     : host,
        user     : user,
        password : password,
        database : database
    });
    mysqlcon.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
        }
        console.log('connected as id ' + mysqlcon.threadId);
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


//Get config
var config = JSON.parse(fs.readFileSync(__dirname + '/config/config.json', 'utf8'));

var mysqlcon = mysql_connect(config.sql.host, config.sql.user, config.sql.password, config.sql.database);

/* IRC Bot */
var bot = new irc.Client(config.irc.server, config.botname, {
    channels: config.irc.channels,
    userName: config.irc.username,
    realName: config.irc.realname,
    debug: true
});

bot.addListener('message', function(nick, to, text, message) {
    var data = {
        receiver: to,
        sender: nick,
        text: text,
        message: JSON.stringify(message),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `chat` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    if(text == 'ping'){
        bot.say(to, 'pong');
    }
});
bot.addListener('join', function(channel, nick, message) {
    var data = {
        username: nick,
        action: 'join',
        channel: channel,
        message: JSON.stringify(message),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `action` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    bot.send("names",channel);
});
bot.addListener('part', function(channel, nick, reason, message) {
    var data = {
        username: nick,
        action: 'part',
        channel: channel,
        reason: reason,
        message: JSON.stringify(message),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `action` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    bot.send("names",channel);
});
bot.addListener('quit', function(nick, reason, channels, message) {
    var data = {
        username: nick,
        action: 'quit',
        message: JSON.stringify(message),
        reason: reason,
        channel: channels.join(", "),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `action` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    for(d in config.irc.channels){
        bot.send("names",config.irc.channels[d]);
    }
});
bot.addListener('kick', function(channel, nick, by, reason, message) {
    var data = {
        username: nick,
        action: 'kick',
        channel: channel,
        reason: reason,
        sender: by,
        message: JSON.stringify(message),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `action` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    bot.send("names",channel);
});
bot.addListener('kill', function(nick, reason, channels, message) {
    var data = {
        username: nick,
        action: 'kill',
        reason: reason,
        message: JSON.stringify(message),
        channel: channels.join(", "),
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `action` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
    for(d in config.irc.channels){
        bot.send("names",config.irc.channels[d]);
    }
});
bot.addListener('names', function(channel, nicks) {
    var data = {
        data: JSON.stringify(nicks),
        channel: channel,
        time: Math.floor((new Date()).getTime() / 1000)
    };
    mysqlcon.query('INSERT INTO `names` SET ?', data, function(error){
        if(error){
            console.log('write fail');
        }
    });
});
bot.addListener('error', function(message) {
    console.log('error: ', message);
});

/* Web Server */
var web = express();
web.set('view engine', 'ejs');
web.use('/static', express.static('public'));
web.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
web.use( bodyParser.json() );
web.use(bodyParser.urlencoded({
    extended: true
})); 

//Web
web.get('/', function (req, res) {
    res.render('index',{title: config.irc.username});
});
web.get('/dashboard/:channel', function (req, res) {
    res.render('dashboard',{channel: req.params.channel, botname: config.irc.username});
});

//Admin Area
web.post('/admin/login', function (req, res) {
    if(req.body.username == config.admin.username && req.body.password == config.admin.password){
        req.session.login = true;
        res.send(JSON.stringify({status: 'true'}));
    }else{
        req.session.login = false;
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.get('/admin', function (req, res) {
    if(req.session.login == true){
        res.render('admin',{title: config.irc.username});
    }else{
        res.redirect('/');
    }
});
web.get('/admin/api/fetchdata', function (req, res) {
    if(req.session.login == true){
        res.send(JSON.stringify(config));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/say', function (req, res) {
    if(req.session.login == true){
        bot.say(req.body.to, req.body.context);
        res.send(JSON.stringify({status: 'true'}));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/join', function (req, res) {
    if(req.session.login == true){
        bot.join(req.body.channel);
        config.irc.channels.push(req.body.channel);
        console.log(JSON.stringify(config, null, 4));
        fs.writeFile(__dirname + '/config/config.json', JSON.stringify(config, null, 4), function(err) {
            if(err) {
              console.log(err);
            }
        }); 
        res.send(JSON.stringify({status: 'true'}));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/part', function (req, res) {
    if(req.session.login == true){
        // check if channel joined
        var index = config.irc.channels.indexOf(req.body.channel);
        if (index > -1) {
            config.irc.channels.splice(index, 1);
            bot.part(req.body.channel);
        }
        fs.writeFile(__dirname + '/config/config.json', JSON.stringify(config, null, 4), function(err) {
            if(err) {
              console.log(err);
            }
        }); 
        res.send(JSON.stringify({status: 'true'}));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/edit', function (req, res) {
    if(req.session.login == true){
        config.botname = req.body.botname;
        config.irc.server = req.body.server;
        config.irc.port = req.body.port;
        config.irc.username = req.body.username;
        config.irc.realname = req.body.realname;

        config.admin.username = req.body.admin_username;
        config.admin.password = req.body.admin_password;

        fs.writeFile(__dirname + '/config/config.json', JSON.stringify(config, null, 4), function(err) {
            if(err) {
              console.log(err);
            }
        });
        res.send(JSON.stringify({status: 'true'}));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/command', function (req, res) {
    if(req.session.login == true){
        console.log(req.body.command);
        console.log(req.body.command.split(' '));
        bot.send.apply(bot, String(req.body.command).split(' '));
        res.send(JSON.stringify({status: 'true'}));
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});
web.post('/admin/api/shutdown', function (req, res) {
    if(req.session.login == true){
        res.send(JSON.stringify({status: 'true'}));
        mysqlcon.end(function(err) {
            console.log(err);
        });
        bot.disconnect('Quit.');
        process.exit();
    }else{
        res.send(JSON.stringify({status: 'false'}));
    }
});


//API
web.get('/api/info/', function (req, res) {
    var data = {
        server: config.irc.server,
        botname: config.botname,
        channels: config.irc.channels,
        username: config.irc.username,
        realname: config.irc.realname,
        uptime: ( process.hrtime()[0] - time )
    }
    res.send(JSON.stringify(data));
});
web.get('/api/message/', function (req, res) {
    var time_string = '';
    if(req.query.start != null && req.query.end != null){
        time_string = ' AND time > ' + mysqlcon.escape(req.query.start) + ' AND time < ' + mysqlcon.escape(req.query.end);
    }
    if(req.query.username != null && req.query.channel != null){
        mysqlcon.query('SELECT * FROM `chat` WHERE sender = ? AND receiver = ? ' + time_string + ' ORDER BY `time` ASC ', [ req.query.username , req.query.channel ], function(e, data){
        if(!e){
                res.send(JSON.stringify(data));
            }
        });
    }else if(req.query.username == null && req.query.channel != null){
        mysqlcon.query('SELECT * FROM `chat` WHERE receiver = ? ' + time_string + ' ORDER BY `time` ASC ', [ req.query.channel ], function(e, data){
        if(!e){
                res.send(JSON.stringify(data));
            }
        });
    }else if(req.query.username != null && req.query.channel == null){
        mysqlcon.query('SELECT * FROM `chat` WHERE sender = ? ' + time_string + '  ORDER BY `time` ASC ', [ req.query.username ], function(e, data){
        if(!e){
                res.send(JSON.stringify(data));
            }
        });
    }else{
        res.status(500).send({ error: 'parameters not set' });
    }
});
web.get('/api/action/', function (req, res) {
    var time_string = '';
    if(req.query.start != null && req.query.end != null){
        time_string = ' time > ' + mysqlcon.escape(req.query.start) + ' AND time < ' + mysqlcon.escape(req.query.end) + 'AND ';
    }
    var sql_string = "SELECT * FROM `action` WHERE ";
    if(req.query.username != null){
        sql_string += "username = ";
        sql_string += mysqlcon.escape(req.query.username);
        sql_string += " AND ";
    }
    if(req.query.action != null){
        if(req.query.action == 'join' || req.query.action == 'quit' || req.query.action == 'part' || req.query.action == 'kill' || req.params.action =='kick'){
            sql_string += "action = ";
            sql_string += mysqlcon.escape(req.query.action);
            sql_string += " AND ";
        }
    }
    if(req.query.channel != null){
        sql_string += "channel = ";
        sql_string += mysqlcon.escape(req.query.channel);
        sql_string += " AND ";
    }
    sql_string += time_string;
    sql_string += ' id <> 0 ORDER BY `time` ASC';
    mysqlcon.query(sql_string, function(e, data){
        if(!e){
            res.send(JSON.stringify(data));
        }
    });
});
web.get('/api/names/', function (req, res) {
    var time_string = '';
    if(req.query.start != null && req.query.end != null){
        time_string = 'AND time > ' + mysqlcon.escape(req.query.start) + ' AND time < ' + mysqlcon.escape(req.query.end);
    }
    if(req.query.channel != null){
        mysqlcon.query('SELECT * FROM `names` WHERE channel = ? ' + time_string + ' ORDER BY `time` ASC ', [ req.query.channel ], function(e, data){
        if(!e){
                res.send(JSON.stringify(data));
            }
        });
    }else{
        res.status(500).send({ error: 'parameters not set' });
    }
});

var server = web.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('IRC Bot Web client listening at http://%s:%s', host, port);
});