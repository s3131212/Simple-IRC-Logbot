var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("fs");

function web_connect(){
    var config = global.config;
    var debug = global.debug;
    var mysqlcon = global.mysqlcon;
    var bot = global.irc;

    var time = process.hrtime()[0];
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
        if(req.body.username == config.web.admin.username && req.body.password == config.web.admin.password){
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
                    debug.debugging(err, 'error');
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
                    debug.debugging(err, 'error');
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

            config.web.admin.username = req.body.admin_username;
            config.web.admin.password = req.body.admin_password;

            fs.writeFile(__dirname + '/config/config.json', JSON.stringify(config, null, 4), function(err) {
                if(err) {
                    debug.debugging(err, 'error');
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
                debug.debugging(err, 'error');
            });
            bot.disconnect('Quit.');
            debug.debugging('The server is shutting down.' ,'info');
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

    var server = web.listen(config.web.port, function () {
        debug.debugging('IRC Bot Web client listening at http://' + server.address().address + ':' + server.address().port +'.' ,'info');
    });
    return web;
}

module.exports = {
   web_connect :  web_connect
}