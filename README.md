



# 创建应用

```shell
#升级vue版本

vue create quality-front (有vue版本选择，我选的第一个)

cd quality-front

vue add electron-builder (安装electron-builder)
```

# 编译与调试

自动配置package.jon

```shell
npm install

npm run serve  (试试能否运行vue项目,只有浏览器访问开项目)

npm run electron:serve (可访问浏览器，也会出现electron的程序，独立于浏览器的)

npm run electron:build (打包exe项目)
```



# 接入静默升级

## 安装electron-updater

```shell
npm install electron-updater --save
```

## 修改background.js

```js
import { app, protocol, BrowserWindow, ipcMain  } from 'electron'//加入ipcMain
import { autoUpdater } from "electron-updater" //加入autoUpdater

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  //加入以下代码********************************************
  ipcMain.on("checkUpdate", () => {
    //处理更新操作
    const returnData = {
      error: {
        status: -1,
        msg: '更新时发生意外，无法进行正常更新！'
      },
      checking: {
        status: 0,
        msg: '正在检查更新……'
      },
      updateAva: {
        status: 1,
        msg: '正在升级……'
      },
      updateNotAva: {
        status: 2,
        msg: '开始加载程序……'
      }
    };

    //更新连接，更新包与
    autoUpdater.setFeedURL('http://localhost:7082/');

    //更新错误事件
    autoUpdater.on('error', function (error) {
      sendUpdateMessage(returnData.error)
    });

    //检查事件
    autoUpdater.on('checking-for-update', function () {
      sendUpdateMessage(returnData.checking)
    });

    //发现新版本
    autoUpdater.on('update-available', function (info) {
      sendUpdateMessage(returnData.updateAva)
    });

    //当前版本为最新版本
    autoUpdater.on('update-not-available', function (info) {
      setTimeout(function () {
        sendUpdateMessage(returnData.updateNotAva)
      }, 1000);
    });

    //更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
      win.webContents.send('downloadProgress', progressObj)
    });


    //下载完毕
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
      //退出并进行安装（这里可以做成让用户确认后再调用）
      autoUpdater.quitAndInstall();
    });

    //发送消息给窗口
    function sendUpdateMessage(text) {
      win.webContents.send('message', text)
    }

    //发送请求更新
    autoUpdater.checkForUpdates();
  });
}
```

## 添加vue.config.js

```js
module.exports = {
	pluginOptions: {
		electronBuilder: {
            nodeIntegration: true,    		//必须添加，否则无法做线程间的通信
			builderOptions: {
				"productName": "myproject",//不要出现中文，除非你Apache支持中文路径
				"appId": "com.longteng.test",//可根据个人需要修改
				"win": {
					"publish": [
						{
							"provider": "generic",
							"url": "http://localhost:7082/" //更新服务器地址,可为空
						}
					]
				}
			}
		}
	}
}
```

## 触发更新

该代码可在任意位置，如按钮，或页面的mounted()

```js
    /**
     * 自动更新
     */
    let ipcRenderer = require('electron').ipcRenderer;
    let me = this;
    //请求检查更新
    ipcRenderer.send("checkUpdate");

    //下载中收到的进度信息
    ipcRenderer.on("downloadProgress", (event, data) => {
      me.prograssStyle.width = data.percent.toFixed(2) + "%";//更新进度条样式
      me.stepText = "正在更新中(" + me.prograssStyle.width + ")...";
    });
    //监听请求更新响应，用来处理不同的事件
    ipcRenderer.on("message", (event, data) => {
      me.stepText = data.msg;
      switch (data.status) {
        case -1:
          alert(data.msg);
          //退出程序
          ipcRenderer.send("logout");
          break;
        case 2:
          me.downloadDb();//下载sqlite数据库文件
          break;
      }
    });
```

## 注意

以上提及的http://localhost:7082/为更新地址，该地址放  latest.yml 、新版本.exe、新版本.exe.blockmap

![image-20210602102718999](图片\image-20210602102718999.png)

修改版本号：package.json    ：version  

打包后得到新版本 npm run electron:build  



调试更新问题可以使用 npm run electron:serve  

