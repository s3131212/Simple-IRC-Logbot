function helloworld(){
    var bot = global.irc;
    bot.addListener('message', function(nick, to, text, message) {
        if(text == 'helloworld'){
            bot.say(to, 'helloworld');
        }
    });

    var web = global.web;
    web.get('/helloworld', function (req, res) {
        res.send("helloworld");
    });
}

module.exports = {
   helloworld :  helloworld
}