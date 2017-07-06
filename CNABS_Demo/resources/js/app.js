
 

var AppFrame={
	navBarTop:'42px',
	fooBarBottom:'50px',
	themeBackColor:'#555555',
	themeFontColor:'#FFFFFF',
	ajaxTimeOut:8000,  //ajax全局超时设置对象
	loginPage:'/modules/account/login.html',
	loadingPage:'/modules/common/loading.html', 
	init:function(){
		this.preLoadLoginView();
		this.preLoadNavigatorView();
	},
	checkNetwork:function(){
		if(window.plus && plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			return false;
		}else{
			return true;
		}
	},
	ajax:function(url,setting){
		//合并参数
		var options={
			async:true,
			dataType:'json',
			type:'post',
			timeout:this.ajaxTimeOut
		}; 
		mui.extend(options,setting);
		 
		//拦截重新处理回调
		var successFunc=options['success'];
		var errorFunc=options['error']; 
	 
	    //发送请求前检查网络情况
		if(!this.checkNetwork()){
			var errorMsg="似乎已断开与互联网的连接了";
			plus.nativeUI.toast(errorMsg, {
				verticalAlign: 'top'
			});
			errorFunc(errorMsg);
		} 
	   
		options['success']=function(response){		 
			if(successFunc)
				successFunc(response); 
		};
		
		options['error']=function(xhr,type,errorThrown){ 
			console.log("Ajax.Status:"+xhr.status+" --------------------");
			var isStop=false;
			if(errorFunc){
				console.log("Ajax请求出错!请求地址:"+url +" 原因:"+errorThrown);
				isStop = errorFunc(xhr,type,errorThrown);			
			}  
			
			//是否终止后续其它判断情况的执行(默认false继续执行,取决于回调方法的返回结果true终止/false继续)
			if(isStop)
				return;
			
			if(xhr.status==401){
				console.log("Ajax未登录认证->跳转NoLogin!请求地址:"+url+" 参数信息:"+JSON.stringify(options)); 
			 	//实现跳转登录窗体代码 ------addcode 
			 	app.onLogin(); 
			 	return;
			}
			
			if(xhr.status==403){  
				console.log("Ajax未授权访问->跳转NoAuth!请求地址:"+url+" 参数信息:"+JSON.stringify(options)); 
			 	//实现跳转登录窗体代码 ------addcode
			 	app.onLogin();
			 	return;
			}
			
			if(xhr.status==404){  
				console.log("Ajax地址不存在->跳转NoFind!请求地址:"+url+" 参数信息:"+JSON.stringify(options)); 
			 	//实现跳转登录窗体代码 ------addcode 
			 	app.onLogin();
			 	return;
			}
			
			
			if(xhr.status==0){  
				console.log("Ajax请求超时->提示服务器繁忙!请求地址:"+url+" 参数信息:"+JSON.stringify(options)); 
			 	var errorMsg="服务器好像有点很忙哦";
				plus.nativeUI.toast(errorMsg, {
					verticalAlign: 'top'
				}); 
				return;
			}  
			
		};
	 
		mui.ajax(url,options);
	},
	checkLogin:function(){
		 
	}, 
	onLogin:function(){
		var viewID='app-login';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView!=null){
			if(!findView.isVisible()){
				setTimeout(function () {
					findView.show("slide-in-right", 300); 
				},150);
			}
		}else{
			this.preLoadLoginView();
		}
	},
	preLoadLoginView:function(){
		var viewID='app-login';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView==null){
			 //原生导航条信息
			var titleNView = { //详情页原生导航配置
				backgroundColor: this.themeBackColor, //导航栏背景色
				titleText: '', //导航栏标题
				titleColor: this.themeFontColor, //文字颜色 
				autoBackButton: true, //自动绘制返回箭头
				/*type: 'transparent', //透明渐变样式*/
				/*splitLine: { //底部分割线
					color: '#cccccc'
				}*/
			}
			
		    findView = mui.preload({
				url: this.loginPage,
				id: viewID,
				styles: {
					"render": "always",
					"popGesture": "hide",
					"bounce": "vertical", 
					"titleNView": titleNView
				}
			});  
		}
		   
	},
	onNavigator:function(url){
		var viewID='app-navigator';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView!=null){
			if(!findView.isVisible()){
				setTimeout(function () {
					findView.loadURL(url);
					findView.show("slide-in-right", 300);  
				},150); 
			}
		}else{
			this.preLoadNavigatorView();			
		}
	},
	preLoadNavigatorView:function(){
		var viewID='app-navigator';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView==null){
			 //原生导航条信息
			var titleNView = { //详情页原生导航配置
				backgroundColor: this.themeBackColor, //导航栏背景色
				titleText: '', //导航栏标题
				titleColor: this.themeFontColor, //文字颜色 
				autoBackButton: false, //自动绘制返回箭头
				progress:{color:'#EC971F'},
				buttons:[ 
					{
						text:'\ue697',
						fontSrc:'_www/resources/fonts/iconfont.ttf', 
						fontSize:'24px',
						float:'left',
						onclick:function(){
							app.onBackNavigator();
						}
					},
					{
						text:'\ue69a',
						fontSrc:'_www/resources/fonts/iconfont.ttf', 
					 	fontSize:'20px', 
						float:'left',
						onclick:function(){
							app.onCloseNavigator();
						}
					},
					{
						text:'\ue71d', 
						fontSize:'20px',
						fontSrc:'_www/resources/fonts/iconfont.ttf', 
						float:'right',
						onclick:function(){
							mui.alert("share");
						}
					}
				],				
				/*type: 'transparent', //透明渐变样式*/
				/*splitLine: { //底部分割线
					color: '#cccccc'
				}*/
			}
			
			 
			
		    findView = mui.preload({
				url: this.loadingPage,
				id: viewID,
				styles: {
					"render": "always",
					"popGesture": "hide",
					"bounce": "vertical", 
					"titleNView": titleNView
				}				 
			}); 		 
			
			/*findView.addEventListener('hide',function(){
				console.log("hide");
			},false);
			findView.addEventListener('close',function(){
				console.log("close");
			},false);
			findView.addEventListener('error',function(){
				console.log("error");
			},false);
			findView.addEventListener('loaded',function(){
				var title=findView.getTitle(); 
				console.log("loaded:"+ title);
			},false);
			findView.addEventListener('maskClick',function(){
				console.log("maskClick");
			},false);
			findView.addEventListener('titleUpdate',function(){
				console.log("titleUpdate");
			},false);*/
		}  
	},
	onCloseNavigator:function(){
		var viewID='app-navigator';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView!=null){
			findView.clear(); 
			findView.hide("slide-out-right",350);
		} 
	},
	onBackNavigator:function(){
		var viewID='app-navigator';
		var findView = plus.webview.getWebviewById(viewID); 
		 
		if(findView!=null){ 
			findView.canBack(function(e){ 
				if(e.canBack==1){
					findView.back();
				}else{
					app.onCloseNavigator();
				}
			});
		} 
	}
 
}

//创建app全局对象
var app= Object.create(AppFrame);
 
 
