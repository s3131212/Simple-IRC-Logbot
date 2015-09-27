# Simple IRC Logbot

## Introdution
This is a very simple IRC Logbot with web interface that can be used to record chats, analyze user behavior, and analyze channel.

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

Before starting the bot, please make sure you have filled in the correct configuration in /config/config.js and import irc.sql into the MySQL Database.

After getting ready, execute following command to start the bot:

```
node app.js
```

And then go to http://localhost:port to access the web interface.

To shut down the bot, DO NOT USE Ctrl+C IN CONSOLE because the bot would be forced to disconnect, visit the web interface and log in to the admin page, and then you will find the "Shutdown" button in "Action".

##API
Send HTTP Get request to API URL to fetch data.

### Message

```
GET /api/message/
```
The above request may return the full chat data in JSON.

Additional parameters:
*   channel  
	String  
	To specify a channel. Make sure that the '#' sign is converted into '%23'.  
*   username  
	String  
	To specify an user.  
*   start  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the 'end' parameter.  
*   end  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the 'start' parameter.  

Note that you must specify channel or username or both.

### Action

```
GET /api/action/
```
The above request may return the full user action data in JSON.

Additional parameters:
*   channel  
	String  
	To specify a channel. Make sure that the '#' sign is converted into '%23'.  
*   username  
	String  
	To specify an user.  
*   action  
	String  
	To specify an action, which is join, quit, part, kill, or kick.  
*   start  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the 'end' parameter.  
*   end  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the 'start' parameter.  

### Names

```
GET /api/names/
```
The above request may return the full online users data in specified channel in JSON.

Additional parameters:  
*   channel  
	String  
	To specify a channel. Make sure that the '#' sign is converted into '%23'.  
*   start  
	UNIX Timestamp  
	To specify the earliest time, will drop all message before this time. You must also specify the 'end' parameter.  
*   end  
	Unix Timestamp  
	To specify the latest time, will drop all message after this time. You must also specify the 'start' parameter.  

##License
This project is released under MIT License, please read "[LICENSE](LICENSE)" for more information.

##Screenshot
![Screenshot-1](http://i.imgur.com/HaIw3X5.png)
![Screenshot-2](http://i.imgur.com/19yjq6c.png)
![Screenshot-3](http://i.imgur.com/M7mfWNS.png)
![Screenshot-4](http://i.imgur.com/RPs2VN0.png)
![Screenshot-5](http://i.imgur.com/35dT2rs.png)