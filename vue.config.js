module.exports = {
	pluginOptions: {
		electronBuilder: {
            nodeIntegration: true,    
			builderOptions: {
				"productName": "myproject",//不要出现中文，除非你Apache支持中文路径
				"appId": "com.longteng.test",
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