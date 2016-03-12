var irc = require("irc");

function irc_connect(){ 
    var config = global.config;
    var debug = global.debug;
    var mysqlcon = global.mysqlcon;
    var bot = new irc.Client(config.irc.server, config.botname, {
        channels: config.irc.channels,
        userName: config.irc.username,
        realName: config.irc.realname,
        debug: config.debug.enable,
        autoRejoin: true,
        autoConnect: false
    });

    bot.connect(function(){
        debug.debugging('The bot is now up and running.' ,'info');
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
                debug.debugging('SQL Write Fail', 'error');
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
                debug.debugging('SQL Write Fail', 'error');
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
                debug.debugging('SQL Write Fail', 'error');
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
                debug.debugging('SQL Write Fail', 'error');
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
                debug.debugging('SQL Write Fail', 'error');
            }
        });
        if(nick == config.irc.username || nick == config.botname){
            bot.join('channel'); 
        }
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
                debug.debugging('SQL Write Fail', 'error');
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
                debug.debugging('SQL Write Fail', 'error');
            }
        });
    });
    bot.addListener('error', function(message) {
        debug.debugging(message, 'error');
    });

    return bot;
}

module.exports = {
   irc_connect :  irc_connect
}