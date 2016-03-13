# Simple IRC Logbot

[繁體中文](README_zh.md)

## Introdution
This is a very simple IRC Logbot with web interface and plugins support. The web interface can be used to record chats, analyze user behavior, and analyze channel.

In web interface, you can view analysis data, speak as the bot, join/part channel, execute command, edit configuration, and even shutdown the bot.

##Requirement

*   MySQL >= 5.0
*   Node.js >= 0.12.7
*   npm >= 2.12.1

##Installation & Usage
You can easily install the bot by executing following command:

```
git clone https://github.com/s3131212/simple-irc-logbot.git
cd simple-irc-bot
npm install
```

Before you start the bot, please make sure you have filled in the correct configuration in `/config/config.json` and import `irc.sql` into the MySQL Database.

After you get ready, execute following command to start the bot:

```
node app.js
```

And then go to http://localhost:port to access the web interface.

If you want to make sure the bot will keep running without any interruption, use _forever_ instead.

```
npm install -g forever
forever start app.js
```

To shut down the bot, _DO NOT USE Ctrl+C IN CONSOLE_ because the bot would be forced to disconnect, visit the web interface and log in to the admin page, and then you will find the "Shutdown" button in "Action".

##API
Send `HTTP GET` request to API URL to fetch data.

### Message

```
GET /api/message/
```
The above request may return the full chat data in JSON.

Additional parameters:
*   `channel`  
	String  
	To specify a channel. Make sure that the `#` sign is converted into `%23`.  
*   `username`  
	String  
	To specify an user.  
*   `start`  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the `end` parameter.  
*   `end`  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the `start` parameter.  

Note that you must specify channel or username or both.

### Action

```
GET /api/action/
```
The above request may return the full user action data in JSON.

Additional parameters:
*   `channel`  
	String  
	To specify a channel. Make sure that the `#` sign is converted into `%23`.  
*   `username`  
	String  
	To specify an user.  
*   `action`  
	String  
	To specify an action, which is join, quit, part, kill, or kick.  
*   `start`  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the `end` parameter.  
*   `end`  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the `start` parameter.  

### Names

```
GET /api/names/
```
The above request may return the full online users data in specified channel in JSON.

Additional parameters:  
*   `channel`  
	String  
	To specify a channel. Make sure that the `#` sign is converted into `%23`.  
*   `start`  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the `end` parameter.  
*   `end`  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the `start` parameter.  

##Plugins
Place your plugins in `/plugins` directory. You can find the list of plugins in [plugins](https://github.com/s3131212/Simple-IRC-Logbot/tree/plugins) branch.

###Developer Area
Here's the steps to develop your own plugin.

####Directory Structure
```
plugins/your-plugin-name —— main.js (or any filename you want)
                         |
                         —— config.json (required)
                         |
                         —— any other file
```

####config.json
```
{
    "name": "Plugin name",
    "mainfile": "The filename of main code",
    "mainfunc": "The function name to start the plugin",
    "author": {
        "name": "Your name",
        "email": "Your email"
    },
    "repo": "repo name, null for no repo"
}
```
####Plugin Content
Just write your code, export the function you specify in 'mainfunc' and any other function if needed. Isn't it simple ?

Here's the variables you might need:
*   `global.irc`  
	IRC Bot  
	A node-irc resource. See [this API document](http://node-irc.readthedocs.org/en/latest/API.html) for more information.  
*   `global.web`  
	Web Framework  
	A Expressjs resource. See [this API document](http://expressjs.com/en/4x/api.html) for more information.  
*   `global.mysqlcon`  
	MySQL Connection  
	A node-mysql resource. See [this API document](https://github.com/felixge/node-mysql/blob/master/Readme.md) for more information.  

Let's try to write a 'Hello World' !
```javascript
// start a function
function helloworld(){
	//start with the irc
    var bot = global.irc; // global.irc is the variable for IRC Bot
    bot.addListener('message', function(nick, to, text, message) { //Add a listener
        if(text == 'helloworld'){
            bot.say(to, 'helloworld'); // When we get a message 'helloworld', say 'helloworld'
        }
    });
    //let's try the web
    var web = global.web; // global.web is the variable for web framework
    web.get('/helloworld', function (req, res) {
        res.send("helloworld"); // When we get a GET request 'helloworld', say 'helloworld'
    });
}

//Export it!
module.exports = {
   helloworld :  helloworld
}

//And that's all!
```


##License
This project is released under MIT License, please read "[LICENSE](LICENSE)" for more information.

##Screenshot
![Screenshot-1](http://i.imgur.com/HaIw3X5.png)
![Screenshot-2](http://i.imgur.com/19yjq6c.png)
![Screenshot-3](http://i.imgur.com/M7mfWNS.png)
![Screenshot-4](http://i.imgur.com/RPs2VN0.png)
![Screenshot-5](http://i.imgur.com/35dT2rs.png)