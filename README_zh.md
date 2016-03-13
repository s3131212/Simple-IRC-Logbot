# Simple IRC Logbot

[English](README.md)

## 簡介
這是一個超級簡單的 IRC bot ，有著好棒棒的網頁介面以及外掛系統。網頁介面也可以用來檢視統計資料、以 Bot 的身份發話、加入 / 退出頻道、執行指令、修改設置，當然也可以關閉 Bot 程序。

##環境

*   MySQL >= 5.0
*   Node.js >= 0.12.7
*   npm >= 2.12.1

##安裝與使用
安裝這個程式非常簡單，只要按照以下步驟就可以了喔。首先執行：

```
git clone https://github.com/s3131212/simple-irc-logbot.git
cd simple-irc-bot
npm install
```

在開始執行之前，請先到 `/config/config.json` 填入設定資料，並且到 MySQL 資料庫匯入 `irc.sql` 喔。

如果你完成上述動作，就可以執行 Bot 囉，請按照下述指令：

```
node app.js
```

然後到 http://localhost:port 就可以看到網頁介面了。

如果你希望你的 Bot 不要意外終止，可以使用 _forever_ 來執行。

```
npm install -g forever
forever start app.js
```

要停止 bot 程序，_絕對不要直接 CTRL+C_ ，請到網頁，登入管理介面，在 "Action" 底下有個 "Shutdown" ，按下去就會才會按照正確步驟關閉程序喔。

##API
請傳送 `HTTP GET` 請求來抓 API 資料

### 訊息

```
GET /api/message/
```
以上請求會以 JSON 格式回傳完整對話。

附加參數
*   `channel`  
	String  
	指定頻道，記得在 URL 列中 `#` 必須以 `%23` 表示。  
*   `username`  
	String  
	指令用戶的對話內容。  
*   `start`  
	UNIX Timestamp  
	指定要抓取的資料中最早的時間點，以 UNIX Timestamp 表示。必須同時指定 `end` 參數。  
*   `end`  
	Unix Timestamp  
	指定要抓取的資料中最晚的時間點，以 UNIX Timestamp 表示。必須同時指定 `start` 參數。  

注意：請至少指定 channel 或是 username ，當然也可以兩個都指定。

### 動作

```
GET /api/action/
```
以上請求會以 JSON 格式回傳完整用戶動作。

附加參數
*   `channel`  
	String  
	指定頻道，記得在 URL 列中 `#` 必須以 `%23` 表示。  
*   `username`  
	String  
	指令用戶的對話內容。  
*   `action`  
	String  
	指定一個動作，包含 join / quit / part / kill / kick.  
*   `start`  
	UNIX Timestamp  
	指定要抓取的資料中最早的時間點，以 UNIX Timestamp 表示。必須同時指定 `end` 參數。  
*   `end`  
	Unix Timestamp  
	指定要抓取的資料中最晚的時間點，以 UNIX Timestamp 表示。必須同時指定 `start` 參數。  

### 線上用戶名單

```
GET /api/names/
```
以上請求會以 JSON 格式回傳完整用戶在線人數。

附加參數
*   `channel`  
	String  
	指定頻道，記得在 URL 列中 `#` 必須以 `%23` 表示。  
*   `username`  
	String  
	指令用戶的對話內容。  
*   `start`  
	UNIX Timestamp  
	指定要抓取的資料中最早的時間點，以 UNIX Timestamp 表示。必須同時指定 `end` 參數。  
*   `end`  
	Unix Timestamp  
	指定要抓取的資料中最晚的時間點，以 UNIX Timestamp 表示。必須同時指定 `start` 參數。 

##外掛
把所有外掛放在 `/plugins` 目錄中。外掛集合放在 [plugins](https://github.com/s3131212/Simple-IRC-Logbot/tree/plugins) branch，可以去看看。

###開發者專區
我們來一步一步寫出一個外掛吧

####目錄結構
```
plugins/your-plugin-name —— main.js (或任何你喜歡的名稱)
                         |
                         —— config.json (這是必要的)
                         |
                         —— any other file
```

####config.json
```
{
    "name": "外掛名稱",
    "mainfile": "外掛主程式檔案名稱",
    "mainfunc": "外掛主程式函數名稱",
    "author": {
        "name": "你的名稱",
        "email": "Email"
    },
    "repo": "Repo 的網址，如果沒有就寫 null"
}
```
####外掛內容
只需要寫點程式，把 'mainfunc' 指定的函數以及其他任何會用到的函數 export 出來就可以囉。

這些是一些需要用到的變數
*   `global.irc`  
	IRC Bot  
	node-irc 資源，詳細請見[此 API 文件](http://node-irc.readthedocs.org/en/latest/API.html)。  
*   `global.web`  
	Web Framework  
	ExpressJS 資源，詳細請見[此 API 文件](http://expressjs.com/en/4x/api.html)。  
*   `global.mysqlcon`  
	MySQL Connection  
	node-mysql 資源，詳細請見[此 API 文件](https://github.com/felixge/node-mysql/blob/master/Readme.md)。  

來試試看一個 'Hello World' 吧！
```javascript
// 首先當然要開一個函數
function helloworld(){
	//從 IRC 開始練習
    var bot = global.irc; // global.irc 是 IRC Bot 的變數名稱
    bot.addListener('message', function(nick, to, text, message) { //增加一個 Listener
        if(text == 'helloworld'){
            bot.say(to, 'helloworld'); // 當我們收到 'helloworld' 就回應 'helloworld'
        }
    });
    //再來試試看 Web 
    var web = global.web; // global.web 是 Expressjs 的變數名稱
    web.get('/helloworld', function (req, res) {
        res.send("helloworld"); // 當我們收到 GET 請求 'helloworld' 就回應 'helloworld'
    });
}

//Export 出來！
module.exports = {
   helloworld :  helloworld
}

//然後就大功告成囉
```
##License
這個專案是用 MIT License 釋出的，請詳閱 "[LICENSE](LICENSE)" 。

##Screenshot
![Screenshot-1](http://i.imgur.com/HaIw3X5.png)
![Screenshot-2](http://i.imgur.com/19yjq6c.png)
![Screenshot-3](http://i.imgur.com/M7mfWNS.png)
![Screenshot-4](http://i.imgur.com/RPs2VN0.png)
![Screenshot-5](http://i.imgur.com/35dT2rs.png)