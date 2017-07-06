/**J ;
 * 基于DCloud开源框架实现的auth2.0认证登录
 * by lj_liu 2016-05-06
 **/ 
 //引入md5加密文件
 document.write('<script src="public/js/md5.min.js"></sc' + 'ript>');
 
var EdupayServer="http://www.edu-pay.com.cn";
var FileServer="http://file.edu-pay.com.cn";
(function($, owner) { 
	owner.CheckUpdateUrl=EdupayServer+"/index.php/eframe/appversion/checkupdate";	 
	owner.CheckPositionUrl=EdupayServer+"/index.php/eframe/appversion/checkposition";
	owner.GetPackageUrl=EdupayServer+"/index.php/eframe/appversion/getpackage";
	owner.UploadImageUrl=FileServer+"/index.php/eframe/uploadweb/uploadappimage";
	owner.LoginAuth2Url=EdupayServer+"/index.php/passport/applogin/auth2"; 
	owner.LogoutUrl=EdupayServer+"/index.php/passport/applogin/logout"; 
	owner.ShareImageAppLogo=EdupayServer+"/cdn/app/public/images/app-logo.png";
	
	//--------------------------------------cookie处理-----------------------------------//
	owner.getCookie =function (name)
	{
		var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
		if(arr=document.cookie.match(reg))
		return unescape(arr[2]);
		else
		return null;
	}
	
	owner.setCookie =function (name,value,expire) 
	{   
		if(expire==undefined || !parseInt(expire))
		   expire=20*60;
	    var exp = new Date(); 
	    exp.setTime(exp.getTime() + expire*1000); 
	    document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();  
	    
	} 
	
	//------------------------------------用户状态管理----------------------------------------//
	owner.createUserState = function(data, callback) {	
		var token=data.token;
		console.log("创建新的token:"+token);
		owner.setCookie('token',token,60*60*24*7);  
		owner.setUserState(data);
		return callback();
	};  
 
	/**
	 * 获取当前状态
	 **/
	owner.getUserState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		if(stateText==null || stateText=="{}" || stateText=="")
		    return null;
		else
		    return JSON.parse(stateText);
	};
	
	
	owner.getUID=function(){
		var userState=owner.getUserState();
		if(userState==null)
		   return "";
		else
		   return userState.uid;
	}
	owner.getOpenId=function(){
		var userState=owner.getUserState();
		if(userState==null)
		   return "";
		else
		   return userState.openid;
	}
	/**
	 * 设置当前状态
	 **/
	owner.setUserState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state)); 
	}; 
	
	owner.clearUserState = function() {	
		owner.logout();
		var userstate=owner.getUserState(); 
		owner.setCookie("token","",-1); 
		localStorage.setItem('$state', null);   
	}; 

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
	
	
	
	//---------------------------沉浸模式处理--------------------------------------//
	owner.getImmersedStatusbar=function(){
		var data = localStorage.getItem('$immersedstatusbar') || "{}";
		if(data==null || data=="" || data=="{}"){
			return owner.setImmersedStatusbar();
		}else{
			return JSON.parse(data);
		}
		
	}
	
	owner.setImmersedStatusbar=function(){ 
		var layer={};
		layer.defaultHeaderHeight=44;
		layer.headerHeight=layer.defaultHeaderHeight;
		layer.isImmersedStatusbar=false; 
		layer.statusbarHeight=0;
		if(plus.navigator.isImmersedStatusbar()){ 
			layer.isImmersedStatusbar=true; 
    		layer.statusbarHeight=Math.round(plus.navigator.getStatusbarHeight()); 
    		layer.headerPaddingTop=layer.statusbarHeight; 
    		layer.headerHeight= layer.statusbarHeight+layer.defaultHeaderHeight; 
		} 
		 
		localStorage.setItem('$immersedstatusbar', JSON.stringify(layer)); 
		return layer;  
	}
	
	
	//--------------------------------------app启动前的各种数据处理-----------------------------//
	//显示广告
	owner.showAD=function(){
		
	}  
	
	owner.setShowGuide=function(isShow){		 
		plus.storage.setItem("showGuide",isShow.toString());	
	}
	
	owner.getShowGuide=function(){
		var showGuide = plus.storage.getItem("showGuide"); 
		if(showGuide==undefined || showGuide==null)
		   showGuide=true;
		return JSON.parse(showGuide);
	}
	 
	
	//检查App位置，推送，更新等状态
	owner.checkApp=function(){ 
		if(owner.isConnectNetwork()){
			//收集位置信息 
			edupay.checkPosition();
			//接收推送消息
			edupay.checkPush();	  
			//检查更新
			edupay.checkUpdate();
		}else{
			plus.navigator.closeSplashscreen();
			mui.alert("还没有连接网络哦");
		}
	}
	
	//启动App各项检查工作[引导页,广告页,App基本状态位置，推送，更新]
	owner.startApp=function(callback){ 
		var showGuide = owner.getShowGuide();   
		if(!showGuide){	  
			//显示状态栏  使用沉浸模式取消全屏模式
		    //plus.navigator.setFullscreen(false); 
			//关闭启动界面
			plus.navigator.closeSplashscreen();
			setTimeout(function(){
				//检测App状态[位置,推送,检查更新] 
				owner.checkApp(); 
				//回调处理其它请求
				if(callback)
				   	callback();
			},500);  
			
		}else{	 
			//显示启动导航  
			var guideWV = mui.preload({
			    url:'_www/module/home/guide.html',
			    id:'home-guide',//默认使用当前页面的url作为id
			    styles:{ 
			    	popGesture:'none',
			    	render:'always'
			    },//窗口参数
			    extras:{}//自定义扩展参数
			}); 
		 
			guideWV.addEventListener('loading',function(){	 
				setTimeout(function(){					  
				 	guideWV.show('pop-in', 200, function() {  
	    				//关闭启动界面
						plus.navigator.closeSplashscreen(); 
					});  
				},500);
			   
			},false);  
			
			guideWV.addEventListener('close',function(){  
				plus.navigator.closeSplashscreen(); 
				setTimeout(function(){					
					//检测App状态[位置,推送,检查更新] 
					owner.checkApp();
					if(callback)
				   		callback();
				},500); 
			},false);
				 
		}
	} 
	
	
	
	//-------------------------------auth2.0登录功能------------------------------------------//
	/**
	 * 获取本地是否安装客户端
	 **/
	owner.checkAuth2Services = function(id) {
		 
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
	
	owner.checkPayServices=function(pc){
		if(!pc.serviceReady){
			var txt=null;
			switch(pc.id){ 
				default:
				txt="系统未安装“"+pc.description+"”服务，无法完成支付，是否立即安装？";
				break;
			}
			plus.nativeUI.confirm(txt,function(e){
				if(e.index==0){
					pc.installService();
				}
			},pc.description); 
		}
	}
	
	owner.checkUpdate=function(){  
		//设备参数
		var device ={
			uuid:plus.device.uuid,
			model: plus.device.model,
			vendor: plus.device.vendor
		};
		
		//os参数
		var os={
			name: plus.os.name,
			version:plus.os.version,
			language:plus.os.language
		}; 		 
		//推送参数
	    var push=plus.push.getClientInfo(); 
	    
        // 获取本地应用资源版本号
	    plus.runtime.getProperty(plus.runtime.appid,function(app){	 
	    	console.log("当前版本信息:"+JSON.stringify(app));
	        //直接读取本地资源信息提交device,os,app
		    mui.ajax(owner.CheckUpdateUrl,{
				data:{
					device:device,
					os:os, 
					app:app,
					push:push
				},
				dataType:'json',//服务器返回json格式数据
				type:'post',//HTTP请求类型
				timeout:5000,//超时时间设置为5秒；
				success:function(resO){  
					console.log("服务端返回版本信息:"+JSON.stringify(resO)); 
					if(resO==null){ 
						return;
					}
					
					if(resO.state){ 
						if(!resO.data.isupdate){ 
							return;
						}  
							
						if(resO.data.packageurl!=undefined && resO.data.packageurl.trim()!="")
						 	owner.GetPackageUrl=resO.data.packageurl; 
					 	
					 	//是否静默升级
					 	if(resO.data.issilent && resO.data.packagetype=="download"){
					 		plus.downloader.createDownload(owner.GetPackageUrl, {filename:resO.filename}, function(d,status){
						        if ( status == 200 ) {
						            console.log("静默下载更新成功："+d.filename);
						            owner.updatePackage(d.filename,resO.data.showguide,true);
						        } else {
						            console.log("静默下载更新失败！");  
						        } 
					   		}).start();
					 	}else{
				 			var btnArray = ['立即更新', '稍后'];
							mui.confirm('发现新版本啦，快去体验吧？', '校园宝', btnArray, function(e) {
								if (e.index == 0) {	
									if(resO.data.packagetype=="download")
									{
										owner.showWaiting("正在更新中...\n"); 
								    	plus.downloader.createDownload(owner.GetPackageUrl, {filename:resO.filename}, function(d,status){
									        if ( status == 200 ) {
									            console.log("下载更新成功："+d.filename);
									            owner.updatePackage(d.filename,resO.data.showguide,false);
									        } else {
									            console.log("下载更新失败！");
									            mui.alert("下载更新失败,请稍候尝试！"); 
									        }
									        owner.closeWaiting();
								   		}).start();
									}else{
										plus.runtime.openURL(owner.GetPackageUrl); 
									}
									
								} else {
									console.log("选择了稍后更新..."); 
								}
							}); 
					 	} 
					}else{
						console.log("获取更新错误:[服务端返回]"+resO.data);  
					} 
				},
				error:function(xhr,type,errorThrown){					 
					console.log("获取更新错误:[请求异常]"+errorThrown); 
				}
			}); 
	    });	    
	 	
	}
	
	owner.compareVersion = function( ov, nv ){
		if ( !ov || !nv || ov=="" || nv=="" ){
			return false;
		}
		var b=false,
		ova = ov.split(".",4),
		nva = nv.split(".",4);
		for ( var i=0; i<ova.length&&i<nva.length; i++ ) {
			var so=ova[i],no=parseInt(so),sn=nva[i],nn=parseInt(sn);
			if ( nn>no || sn.length>so.length  ) {
				return true;
			} else if ( nn<no ) {
				return false;
			}
		}
		if ( nva.length>ova.length && 0==nv.indexOf(ov) ) {
			return true;
		}
	}


	owner.updatePackage=function(path,showguide,issilent){	 
		if(!issilent)
	    	owner.showWaiting("正在安装更新...\n",{loading:{display:"inline"}});
	    	
	    plus.runtime.install(path,{},function(){ 
   		 	owner.closeWaiting(); 
	        console.log("安装更新成功！");
	        
	        if(issilent){
        		owner.setShowGuide(showguide);	       
	            plus.runtime.restart();
	        }else{
	        	mui.alert("安装更新成功",function(){
	        		owner.setShowGuide(showguide);	       
	            	plus.runtime.restart();
       		 	});
	        }
	      
	    },function(e){
	        owner.closeWaiting();
	        console.log("安装更新失败["+e.code+"]："+e.message);
	        
	        if(!issilent) 
        	  	mui.alert("安装更新失败["+e.code+"]："+e.message);  
	    });		 
	} 
	
	
	owner.logout=function(){
		console.log("logout");
		var userstate=owner.getUserState(); 
		if(userstate==undefined || userstate.authtype==undefined)
			return;
		
		owner.showWaiting("正在注销用户...\n");
		owner.ajax(owner.LogoutUrl,{
			data:{},
			dataType:'json',//服务器返回json格式数据
			type:'post',//HTTP请求类型
			timeout:5000,//超时时间设置为5秒；
			success:function(responseJson){ 
				console.log(responseJson);
				if(responseJson==null || responseJson==""){ 
					owner.closeWaiting();
					mui.toast("注销用户失败,请稍候尝试...[服务端错误]");
					return;
				} 
				 
				//服务器注销成功后处理客户端第三方注销
				if(responseJson.state){ 
					plus.oauth.getServices(function(services) {
						for (var i in services) {
							var service = services[i];
							if(userstate.authtype==service.id){
								var isInstalled = owner.checkAuth2Services(service.id); 
								service.logout(function(){
									owner.closeWaiting();
									mui.toast("注销用户成功");
									console.log("注销"+service.id+"成功");
								},function(){
									owner.closeWaiting();
									mui.toast("注销用户失败,请稍候尝试...[客户端错误]");
									console.log("注销"+service.id+"失败");
								}); 
							}  
						}
					},function(error){
						console.log("注销"+service.id+"出错:"+ error.code+ error.message);
					});  			
				}else{
					owner.closeWaiting();
					mui.toast('注销用户失败,请稍候尝试...[服务端错误]');
				} 
			},
			error:function(xhr,type,errorThrown){
				owner.closeWaiting(); 
				mui.toast("注销用户失败,请稍候尝试...[服务端错误]"); 
				console.log(JSON.stringify(errorThrown));
			}
		}); 	 
	}
	
	owner.login=function(logininfo){
		var device ={
			uuid:plus.device.uuid,
			model: plus.device.model,
			vendor: plus.device.vendor
		};
		
		var data={
			login:logininfo,
			device:device
		};
		console.log("提交登录数据:"+JSON.stringify(data));
		
		owner.showWaiting('正在验证用户...\n');
		owner.ajax(owner.LoginAuth2Url,{
			data:data,
			dataType:'json',//服务器返回json格式数据
			type:'post',//HTTP请求类型
			timeout:5000,//超时时间设置为5秒；
			success:function(responseJson){ 
				if(responseJson==null || responseJson==""){
					console.log("服务器返回认证信息:"+responseJson);
					mui.toast("登录认证失败,请稍候尝试...[404]");
					return;
				}
				console.log("服务器返回登录结果:"+JSON.stringify(responseJson));
				    
				//服务器返回响应，根据响应结果，分析是否登录成功；
				owner.closeWaiting();
				mui.toast('登录认证成功'); 
				if(responseJson.state){ 
					//保存用户认证方式 以方便注销用户认证信息
					var userState=responseJson.data;
					userState.authtype=logininfo.authtype;					 
					//保存用户登录相关信息	
					owner.createUserState(userState, function() { 			  			 
			  	 		mui.back(); 
					});
				}else{
					mui.toast('登录认证失败,请稍候尝试...[403]');
				} 
			},
			error:function(xhr,type,errorThrown){
				owner.closeWaiting();
				//清空认证信息，防止由于上次第三方认证成功无法重新认证
				owner.logout();
				//异常处理；
				mui.toast("登录认证出错啦,请稍候尝试...[401]");				 
			}
		}); 
	}
	
	
	//------------------------------------异步请求处理-------------------------------//
	owner.ajax=function(url,options){ 
		var successFunc=options['success'];
		var errorFunc=options['error'];
		var loginSuccessFunc=options['loginsuccess'];
		var loginErrorFunc=options['loginerror'];
		 
		options['success']=function(response){		 
			if(successFunc)
				successFunc(response);
			
			 
			owner.closeWaiting();
		};
		options['error']=function(xhr,type,errorThrown){ 	 
			if(xhr.status==403){  
				console.log("服务器返回没有权限跳转登录:"+url+"===>参数信息:"+JSON.stringify(options));
				
				owner.closeWaiting();			 
				var loginurl="_www/module/home/login.html"; 
				var loginWV= owner.createWebview(loginurl,'_home-login');				
				loginWV.addEventListener('close',function(){  
					var userstate=owner.getUserState();
					if(userstate!=null){
						if(loginSuccessFunc){  
							loginSuccessFunc();
						} 
					}else{
						if(loginErrorFunc){  
							loginErrorFunc();
						} 
					}
					
				});
				loginWV.show('pop-in',300);
				return;
			}			   
			
			if(errorFunc)   {
				console.log("错误请求地址:"+url +" 原因:"+errorThrown);
				errorFunc(xhr,type,errorThrown);			
			} 
			 
			owner.closeWaiting();
			
		};
	 
		mui.ajax(url,options);
	}
	
 
	//--------------------------------------地理位置上传-----------------------------------------//
	owner.checkPosition=function(){
		plus.geolocation.getCurrentPosition( function(position){
				console.log("地理位置信息:"+JSON.stringify(position));
				var device ={
					uuid:plus.device.uuid,
					model: plus.device.model,
					vendor: plus.device.vendor
				}; 
		
				owner.ajax(owner.CheckPositionUrl,{
					data:{
						device:device,
						position:position
					},
					dataType:'json',//服务器返回json格式数据
					type:'post',//HTTP请求类型
					timeout:5000,//超时时间设置为5秒；
					success:function(responseJson){  
						 console.log("提交地理位置成功:"+JSON.stringify(responseJson));
					},
					error:function(xhr,type,errorThrown){ 
						console.log(type);
						console.log("提交地理位置失败:"+errorThrown);
					}
				});  
			}, function ( e ) {
				console.log( "获取位置失败："+e.message );
			},{geocode:true,provider:'baidu'}
		);
	}
	
	owner.getPosition=function(successCB,errorCB){
		plus.geolocation.getCurrentPosition( function(position){
				console.log("获取地理位置信息:"+JSON.stringify(position)); 
				successCB(position);				 
			}, function ( e ) {
				console.log( "获取位置失败："+e.message );
				errorCB(e.message);
			},{geocode:true,provider:'baidu'}
		);
	}
	
	owner.checkPush=function(){
			// 添加监听从系统消息中心点击某条消息启动应用事件
			plus.push.addEventListener("click", function ( msg ) {
				// 分析msg.payload处理业务逻辑  根据请求转至对应webview处理
				var payload=JSON.parse(msg.payload.payload);	 
				if(payload!=undefined){ 
					if(payload.showtype!=undefined && payload.url!=undefined){ 
						 /*if(floatw){ // 避免快速多次点击创建多个窗口
								return;							
						 	}*/ 
						 switch(payload.showtype){
						 	case "pop": 
								var floatw=plus.webview.create(payload.url,"push-popwin",{
										width:'220px',
										height:'300px',
										margin:"auto", 
										scrollIndicator:'none',
										scalable:false,
										popGesture:'true'
									},{
										payload:payload
									}
								);
								
								
								plus.webview.currentWebview().addEventListener("maskClick",function(){
									plus.webview.currentWebview().setStyle({mask:'none'}); 
									floatw.close();
								},false);
            
								floatw.addEventListener("loaded",function(){ 
									floatw.show('fade-in',300,function(){
										plus.webview.currentWebview().setStyle({mask:'rgba(0,0,0,0.6)'}); 
									});
								},false);
						 	break;
						 	case "link":  
						 	   	owner.openWindow({
									url: payload.url,
									id: "push-linkwin",				 
									show: {
										aniShow: 'pop-in',
										duration: 300
									} 
								});
						 	break;
						 }
					}
				}
			}, false );  
	}
	
	function _sleep(numberMillis) { 
		var now = new Date(); 
		var exitTime = now.getTime() + numberMillis; 
		while (true) { 
			now = new Date(); 
			if (now.getTime() > exitTime) 
				return; 
		} 
	}
	
	owner.getStatusBarStyle=function(isStatusBarStyleBlackOpaque){ 
		if(mui.os.ios){ 
			var OpenerStatusBarStyle=plus.navigator.getStatusBarStyle(); 
			//失效的时候使用默认状态栏
			if(OpenerStatusBarStyle==null){
				mui.alert("当前窗体获取不到状态栏样式，使用默认样式");
				OpenerStatusBarStyle="UIStatusBarStyleDefault";
			}
			
			var StatusBarStyle="UIStatusBarStyleDefault";
			if(isStatusBarStyleBlackOpaque==true)
		   		StatusBarStyle="UIStatusBarStyleBlackOpaque";  
		   
			var statusBarStyle={ openerstatusbarstyle:OpenerStatusBarStyle , statusbarstyle:StatusBarStyle};
			return statusBarStyle; 
		}else
		{
			return {};
		}
		
	}
	
	
	//----------------------------------------------打开窗体的几种方式--------------------------------------------//
	owner.openLoadUrl=function(url,extras,showTitleName){   
		var tmplUrl="_www/module/common/loadurl.html"; 
		var tmplId="common-loadurl";  
		
		var tmplWV=plus.webview.create(tmplUrl,tmplId,{scrollIndicator: 'none'},{});  
		var immersedStatusbar=owner.getImmersedStatusbar();  
		 
		var subWV=plus.webview.create(url,tmplId+"_subpage",{
						top:(immersedStatusbar.headerHeight)+'px',
		    			bottom:'0px',
					},extras); 
		subWV.hide();
		tmplWV.append(subWV); 			
		
		
		subWV.addEventListener('loading',function(){
			subWV.hide();
			mui.fire(tmplWV, 'startProgress', {});
		},false);
		
		subWV.addEventListener('titleUpdate',function(){					 
			 
		},false);
		
		
		subWV.addEventListener('loaded',function(){	 
			subWV.show(); 
			mui.fire(tmplWV, 'endProgress', {}); 	 
		},false);  
		 
		var isFirst=true;
		tmplWV.addEventListener('loaded',function(e){  
			if(isFirst){
				mui.fire(tmplWV, 'startProgress', {});
			}
			 
		}); 
		
		tmplWV.addEventListener('titleUpdate',function(e){  
		 	mui.fire(tmplWV, 'updateHeader', {title:showTitleName});  
		}); 
		
		tmplWV.addEventListener('close',function(e){	
			 
		});  
			
		tmplWV.show('pop-in', 300, function() {   
	    	 
		}); 
	} 
	
	owner.openPullRefreshView=function(url,id,extras,showTitleName,closeCB){   
		var tmplUrl="_www/module/common/pulldownview.html"; 
		var tmplId="";
		if(id!=null || id!="") 
		   tmplId=id;
		else{
			var filename=owner.getUrlFileName(url);
		    tmplId=filename+"_mainpage";
		}
		
		 
		var tmplWV=plus.webview.create(tmplUrl,tmplId,{scrollIndicator: 'none'},{});  
		var immersedStatusbar=owner.getImmersedStatusbar();   
		var subWV=plus.webview.create(url,tmplId+"_subpage",{
						top:(immersedStatusbar.headerHeight)+'px',
		    			bottom:'0px',
					},extras); 
				
			
		subWV.addEventListener('loaded',function(e){  
		 	mui.fire(subWV,'showed',{});	
		});
		
		tmplWV.append(subWV);  
			
		tmplWV.addEventListener('loaded',function(e){  
		 	//mui.fire(tmplWV, 'updateHeader', {title:showTitleName});  
		}); 
		
		tmplWV.addEventListener('titleUpdate',function(e){  
		 	mui.fire(tmplWV, 'updateHeader', {title:showTitleName});  
		}); 
		
		tmplWV.addEventListener('close',function(e){	
			 if(closeCB)
			    closeCB();
		});  
			
		tmplWV.show('pop-in', 300, function() {  
	    	//mui.fire(tmplWV, 'updateHeader', {title:showTitleName});  
		});  
		
		return tmplWV;
	}  
	 
	
	owner.openWindow=function(url,id,options,closeCB){  
		if (typeof url === 'object') {
			options = url;
			url = options.url;
			id = options.id || url;
		} else {
			if (typeof id === 'object') {
				options = id;
				id = url;
			} else {
				if(id==null || id=="")
				    id=owner.getUrlFileName(url);
				else
					id = id;
			}
		}  
		
		if(options==null){
			options={}
		}
		
		if(options.show==null){
			options.show={
				aniShow: 'pop-in',
				duration: 300
			} 
		}
	 
		mui.openWindow(url,id,options);
		var tmplWV=plus.webview.getWebviewById(id); 
		
		
	 
		tmplWV.addEventListener('loaded',function(e){
			 
		});
			
		//监听关闭事件，处理关闭后的状态栏变化
		tmplWV.addEventListener('close',function(e){  
		 	 if(closeCB)
			    closeCB();
		}); 
		
		return tmplWV;
	}  
	
	
	
	 
	
	owner.createWebview=function(url,id,styles,extras,closeCB){  
		mui.extend(styles,{scrollIndicator: 'none'});
		if(id==null || id=="")
		    id=owner.getUrlFileName(url);
		else
			id = id;
			
		var tmplWV = plus.webview.create(url,id,styles,extras); 
	 
		tmplWV.addEventListener('loaded',function(e){
			 
		});
		
		//监听关闭事件，处理关闭后的状态栏变化
		tmplWV.addEventListener('close',function(e){ 			 
		   if(closeCB)
			    closeCB();
		}); 
			
		return tmplWV;
	}  
	 
 
	//------------------------------url传参处理-------------------------------------//
	owner.getQueryString=function(key){
		var url = window.location.search;
	    var re = new RegExp("[?&]" + key + "=([^\\&]*)", "i");
	    var a = re.exec(url);
	    if (a == null) return "";
	    return a[1];
	}
	
	owner.setQueryString=function(url,key,value){
		if(url.indexOf('?')>0)
		    url=url+"&"+key+"="+value;
		else
		    url=url+"?"+key+"="+value;
		    
		return url; 
	}
	
	/*json转参数*/
	owner.jsonToQueryString = function(url,paramJson) {
		var params = "";
		for (var key in paramJson) {
			var _value = paramJson[key];
			if (_value) {
				if (_value != 0) params += "&" + key + "=" + _value;
			}
		}
		params = params.substr(1); 
		
		if(url.indexOf('?')>0)
		    url=url+"&"+params;
		else
		    url=url+"?"+params;
	    
	    return url;
	}
	
	owner.getUrlFileName=function(strUrl){ 
		var arrUrl = strUrl.split("/");
		var strPage = arrUrl[arrUrl.length-1];
		var indexof = strPage.indexOf("?");
		if(indexof != -1){
		  strPage = strPage.substr(0,strPage.indexOf("?"));
		}
		return strPage;
 	}
	 
	 /*多少天前*/
	owner.getDateDiff = function(dateTimeStamp) {
		var minute = 1000 * 60;
		var hour = minute * 60;
		var day = hour * 24;
		var halfamonth = day * 15;
		var month = day * 30;
		//当前时间
		var now = new Date().getTime();
		var diffValue = now - dateTimeStamp;
		if (diffValue <= 0)
			return "刚刚";
		var monthC = diffValue / month;
		var weekC = diffValue / (7 * day);
		var dayC = diffValue / day;
		var hourC = diffValue / hour;
		var minC = diffValue / minute;
		if (monthC >= 1) {
			result = parseInt(monthC) + "个月前";
		} else if (weekC >= 1) {
			result = parseInt(weekC) + "周前";
		} else if (dayC >= 1) {
			result = parseInt(dayC) + "天前";
		} else if (hourC >= 1) {
			result = parseInt(hourC) + "小时前";
		} else if (minC >= 1) {
			result = parseInt(minC) + "分钟前";
		} else
			result = "刚刚";
		return result;
	}
	
	//----------------------------------------html节点元素操作-------------------------------//
	/*根据id查找元素*/
	owner.getEleById = function(id) {
		return document.getElementById(id);
	}
	
	/*根据class查找元素*/
	owner.getEleByCssName = function(className, parentDom) {
		if (parentDom) {
			return parentDom.getElementsByClassName(className);
		} else {
			return document.getElementsByClassName(className);
		}
	}
	
	/*创建元素,并设置类型和id*/
	owner.createEle=function(_tag, _class, _id) {
		var newElement = document.createElement(_tag);
		if (_class != null)
			newElement.setAttribute("class", _class);
		if (_id != null)
			newElement.setAttribute("id", _id);
		return newElement;
	} 
	
	//-------------------------------打开等待窗体------------------------------//
	owner.showWaiting=function(title,options){
		if(mui.os.plus)
			plus.nativeUI.showWaiting(title,options);
	}
	
	owner.closeWaiting=function(){
		if(mui.os.plus)
			plus.nativeUI.closeWaiting();
	} 
	
	//--------------------------------本地存储----------------------------------------//
	
	
	owner.setStoreItem=function(key,data){
	    var value=JSON.stringify(data);
		plus.storage.setItem(key,value);
	}
	
	owner.getStoreItem=function(key){
		var value=plus.storage.getItem(key);
		return JSON.parse(value);
	}
	
	owner.removeStoreItem=function(key){
		plus.storage.removeItem(key);
	}
	
	owner.clearStore=function(key){
		plus.storage.clear();
	} 
	
	owner.removeStoreByPrefixKey=function(keys){
		if (typeof(keys) === "string") {
			keys = [keys];
		}
		 
		var numKeys = plus.storage.getLength();
		//TODO plus.storage是线性存储的，从后向前删除是可以的 
		//稳妥的方案是将查询到的items，存到临时数组中，再删除  
		var tmpks = [];
		var tk,
			i = numKeys - 1;
		for (; i >= 0; i--) {
			tk = plus.storage.key(i);
			Array.prototype.forEach.call(keys, function(k, index, arr) {
				if (tk.toString().indexOf(k) != -1) {
					tmpks.push(tk);
				}
			});
		}
		tmpks.forEach(function(k) {
			plus.storage.removeItem(k);
		});
		
		 
	}
	
	
	//---------------------------网络判断和常用函数----------------------------------------//
	owner.isWifi=function(){
		var networktype =plus.networkinfo.getCurrentType();
		if(plus.networkinfo.CONNECTION_WIFI==networktype)
	    	return true;
		else
		    return false;
	} 
	
	owner.isConnectNetwork=function(){
		var networktype =plus.networkinfo.getCurrentType();
		if(plus.networkinfo.CONNECTION_NONE==networktype || plus.networkinfo.CONNECTION_UNKNOW==networktype)
	    	return false;
		else
		    return true;
	}
	
	owner.log=function(msg){
		console.log(msg);
	}
	
    //----------------------------------------分享功能------------------------------------------//
	var shares=[];
	owner.initShare=function(){
		plus.share.getServices( function(s){
			shares={};
			for(var i in s){
				var t=s[i];
				shares[t.id]=t;
			}
		}, function(e){
			owner.log( "获取分享服务列表失败："+e.message );
		} );
	}
	
	/**
   * 发送分享消息
   * @param {msgJson} msg 要求属于href:链接,content:内容,title:标题,
   */
	owner.openShare=function(msgJson){ 
		if(msgJson==null){
			owner.log("分享对象不能为空!");
			return;
		} 
		if(msgJson.href==null || msgJson.href=="" || 
			msgJson.title==null || msgJson.title=="" || 
			msgJson.content==null || msgJson.content==""){
			   owner.log("分享内容字段:href,content,title都不能为空!")
		}
	    if(msgJson.thumbs==null || msgJson.thumbs=="")
			msgJson.thumbs=[owner.ShareImageAppLogo];
		if(msgJson.pictures==null || msgJson.pictures=="")
			msgJson.pictures=[owner.ShareImageAppLogo];
		
		
		
		var shareBts=[];
		var ss=shares['weixin'];
		ss&&ss.nativeClient&&(
			shareBts.push({title:'微信朋友圈',s:ss,x:'WXSceneTimeline'}),
			shareBts.push({title:'微信好友',s:ss,x:'WXSceneSession'})
		); 
		
		ss=shares['qq'];
		ss&&ss.nativeClient&&shareBts.push({title:'QQ',s:ss});
		
		/*ss=shares['sinaweibo'];
		ss&&shareBts.push({title:'新浪微博',s:ss});*/
	 
		// 弹出分享列表
		shareBts.length>0?plus.nativeUI.actionSheet({title:'分享',cancel:'取消',buttons:shareBts},function(e){
			if(e.index<=0)
				return; 
			var sb=shareBts[e.index-1];
			if(!sb||!sb.s){
			    console.log("分享对象不存在,无法分享可能没有安装客户端!");
				return;
			} 
			
			//特殊处理微信朋友圈分享内容
			if(sb.x=="WXSceneTimeline"){
				msgJson.title=msgJson.content;
			}
			
			msgJson.extra={scene:sb.x}; 
			// 发送分享
			if ( sb.s.authenticated ) { 
				_shareMessage(msgJson,sb.s);
			} else { 
				sb.s.authorize( function(){
						_shareMessage(msgJson,sb.s);
					},function(e){
					owner.log( "认证授权失败："+e.code+" - "+e.message );
				});
			}
		}):mui.alert('当前环境不支持分享操作!');
		
		function _shareMessage(msg,share){
			share.send(msg, function(){
				owner.log("分享到\""+share.description+"\"成功！ " );
			}, function(e){
				owner.log("分享到\""+share.description+"\"失败: "+JSON.stringify(e) );
			} );
		}
	}
	
	
	//----------------------------------------文件操作------------------------------------------//
	owner.compressFile=function(src,successCB,errorCB){ 
		var filename= src.substr(src.lastIndexOf('/')+1);  
		var zipfile = "_doc/zip/"+filename; 		 
		plus.zip.compress(src,zipfile,
			function() {
				if(successCB)
			        successCB(zipfile);
			},function(error) {
				if(errorCB)
					errorCB();
		});
	}  
	 
	
	//-------------------------图片处理压缩剪裁功能--------------------------------------//
	/*缩放图片 异步
	 *imgArr数组 本地图片路径,不支持网络图
	 *success压缩成功后的回调,返回zipImgArr压缩后的本地路径
	 *width 缩小图片的最小宽度,不传默认为屏幕的宽度
	 */
	owner.zoomImgArr = function(imgArr, success,error) {  
		//压缩后的地址
		var zipArr = new Array(imgArr.length);
		var zipCount = 0; //本地图片的总数
		for (var i = 0; i < imgArr.length; i++) {
			var img_src = imgArr[i]; 
			if (img_src.indexOf("http") != -1) {
				//如果是网络图
				zipArr[i] = img_src;
			} else {
				//本地图,md5
				var timestamp=new Date().getTime();
				zipArr[i] = "file://" + plus.io.convertLocalFileSystemURL("_doc/zip/" + timestamp + ".jpg");
				zipCount++;
			}
		}
		//执行压缩
		if (zipCount == 0) { 
			//如果都是网络地址则直接返回
			success(zipArr);
		}else{ 
			//从第0个下标开始
			_zoomSync(imgArr, success, zipArr, zipCount, 0);
		}
	}
	
	/**
	 * 压缩 同步
	 */
	var zoomOkCount=0;
	function _zoomSync(imgArr, success, zipArr, zipCount, zipIndex) { 
		var zipCallBack = function() {
			zipIndex++;
			if (zoomOkCount == zipCount) { 
				zoomOkCount=0;
				success(zipArr); //压缩完,执行回调
			} else {
				_zoomSync(imgArr, success, zipArr, zipCount, zipIndex); //没有压完,继续
			}
		};
		
		if (imgArr[zipIndex].indexOf("http") == -1) {
			//执行压缩
			plus.zip.compressImage({
				src: imgArr[zipIndex],
				dst: zipArr[zipIndex],
				width: "640px",
				overwrite: true,
				quality: 100
			}, zipCallBack, zipCallBack);
			zoomOkCount++;
		}else{
			//压缩下一个
			zipCallBack();
		}
	}
	
		/*
	 * 旋转 异步
	 * imgArr 数组 本地图片路径,不支持网络图
	 * degArr 对应的旋转角度数组
	 * success成功后的回调,返回rateImgArr旋转后的本地绝对路径
	 */
	owner.rotateImgArr = function (imgArr, degArr, success) {
		//旋转后的地址
		var zipArr = new Array(imgArr.length);
		var zipCount = 0; //需旋转的总数
		for (var i = 0; i < imgArr.length; i++) {
			if (degArr[i] != 0) {
				var timestamp=new Date().getTime();
				zipArr[i] = "file://" + plus.io.convertLocalFileSystemURL("_doc/rate/" + timestamp + ".jpg");
				zipCount++;
			} else {
				zipArr[i] = imgArr[i];
			}
		}
		if (zipCount == 0) {
			//如果都不需要旋转,直接回调
			success(zipArr);
		}else{
			//从第0个下标开始
			_rotateSync(imgArr, degArr, success, zipArr, zipCount, 0);
		}
	}
	
	/**
	 * 旋转 同步
	 */
	var rotateOkCount=0;
	function _rotateSync(imgArr, degArr, success, zipArr, zipCount, zipIndex) { 
		var zipCallBack = function() {
			zipIndex++;
			if (rotateOkCount == zipCount) { 
				rotateOkCount=0;
				success(zipArr); //压缩完,执行回调
			} else {
				_rotateSync(imgArr, degArr, success, zipArr, zipCount, zipIndex); //没有压完,继续
			}
		};
		if (degArr[zipIndex] != 0) {
			//执行压缩
			plus.zip.compressImage({
				src: imgArr[zipIndex],
				dst: zipArr[zipIndex],
				rotate: degArr[zipIndex],
				overwrite: true,
				quality: 100
			}, zipCallBack, zipCallBack);
			rotateOkCount++;
		}else{
			//不需要旋转的,压缩下一个
			zipCallBack();
		}
	}
	
	owner.uploadImgArr=function(imgArr,path,successCB,errorCB){
		 
		var task = plus.uploader.createUpload(owner.UploadImageUrl, {
				method: "POST"
			},
			function(t, status) { //上传完成 
				if (status == 200) {
					if(successCB)
					    successCB(t.responseText);
					    
					console.log("上传成功：" + t.responseText); 
				} else {
					if(errorCB)
					    errorCB(t.responseText);
					    
					console.log("上传失败：" + status);
				} 
			}
		); 
		 
		//添加文件上传队列
		for(var i=0;i<imgArr.length;i++){ 
			var imgFile=imgArr[i]; 
			task.addFile(imgFile, {
				key:owner.getFileName(imgFile)
			});
		} 
		task.addData("path", path);  
		 
		owner.log("开始上传图片:"+JSON.stringify(imgArr));
		task.start(); 
	} 
	 
	owner.uploadImgSingle=function(img,path,successCB,errorCB){
		 
		var task = plus.uploader.createUpload(owner.UploadImageUrl, {
				method: "POST"
			},
			function(t, status) { //上传完成 
				if (status == 200) {
					if(successCB)
					    successCB(t.responseText,img);
					    
					console.log("上传成功：" + t.responseText +" 原图地址:"+img); 
				} else {
					if(errorCB)
					    errorCB(t.responseText,img);
					    
					console.log("上传失败：" + status);
				} 
			}
		); 
		 
		//添加文件上传队列 
		task.addFile(img, {			
			key:owner.getFileName(img)
		}); 
		 
		task.addData("path", path);  
		 
		owner.log("开始上传图片:"+JSON.stringify(img));
		task.start(); 
	}
	
	owner.getFileName=function(filepath){
		var fileArr=filepath.split('/');
		if(fileArr==null || fileArr.length<=0)
		    return filepath;
		else
			return fileArr[fileArr.length-1];
	} 
	
	
	//转到应用市场
	owner.goAppMarket=function(idOrUrl){
		if(mui.os.android)
			plus.runtime.openURL("market://details?id="+idOrUrl);
		else
		    plus.runtime.openURL("itms-apps://" + idOrUrl);
	}
	
	//产生一个随机数
	owner.getRandomCode = function() {
		return Math.floor(Math.random() * 100000000 + 10000000).toString();
	};
	
	//异步递归句柄
	owner.asyncRecursive =function(list, cb_exec, cb_end) {
		var each = function(_list, cb) {
			if (_list.length < 1) {
				return cb_end && cb_end();
			}
			cb(_list.shift(), function() {
				each(list, cb);
			})
		}
		each(list, cb_exec)
	};
	
	//------------------图片延迟加载---------------------------------
	owner.lazyLoad = function (doc, cb) { 
		console.log("开始图片懒加载....[页面:]"+window.location.href);
		
		doc = doc ? doc : document;
		var imgs = doc.querySelectorAll('img.lazy');  
		owner.asyncRecursive(Array.prototype.slice.call(imgs), function(img, next) {
			var data_src = img.getAttribute('data-src');
			console.log("懒加载图片->data_src: "+data_src);
			if (data_src && data_src.indexOf('http://') >= 0) {
				edupayFileCache.getFile(data_src, function(localUrl) {
					_imgSetPath(img, localUrl);
					next();
				});
			} else {
				next();
			}
		}, function() {
			cb && cb();
		});

	};
	
	owner.clearImgCache =function(imgurl){
		var FILE_CACHE_KEY = "filePathCache_" + md5(imgurl);
		console.log("清理缓存图片文件:"+FILE_CACHE_KEY+"=>"+imgurl);
		var localUrlObj = edupay.setStoreItem(FILE_CACHE_KEY,'');
	}

	function _imgSetPath(img, src) {
		img.setAttribute('src', src);
		img.classList.remove("lazy");
	}; 
	//------------------图片延迟加载end---------------------------------
	
	//----android--------------------
	//首页返回键处理
	//处理逻辑：1秒内，连续两次按返回键，则退出应用；
	var firstTap=null;
	owner.androidCloseApp = function() { 
		//首次按键，提示‘再按一次退出应用’
		if (!firstTap) {
			firstTap = new Date().getTime();
			mui.toast('再按一次退出应用');
			setTimeout(function() {
				firstTap = null;
			}, 1000);
		} else {
			if (new Date().getTime() - firstTap < 1000) {
				var btnArray = ['取消', '确定'];
				mui.confirm('确定要退出当前应用吗?', '提示', btnArray, function(e) {
					if (e.index == 0) {	 
						return;
					} else {
						plus.runtime.quit();
					}
				});   
			}
		}  
	}
	//----android--------------------
}(mui, window.edupay = {}));
 

 	
(function($, owner) {
	/**
 	* @author 1020450921@qq.com
 	* @link http://www.cnblogs.com/phillyx
 	* @link http://ask.dcloud.net.cn/people/%E5%B0%8F%E4%BA%91%E8%8F%9C
	 *@description 存储当前下载路径
	 */
	 
	owner.options={
		downloadPath:"_downloads/",
		removePrefix:[]
	};
	
	owner.getFile = function(netPath, cb) {
		console.log("通过edupayFileCache.getFile处理加载缓存图片:"+netPath);
		var filePathCache = getLocalFileCache(netPath);
		isExist(filePathCache, function(exist) {
			if (exist) {
				console.log('图片有缓存,显示缓存图片->' + filePathCache)
				cb(filePathCache);
			} else {
				console.log('图片无缓存,下载图片懒加载并缓存->' + filePathCache+"_"+netPath)
				Filedownload(netPath, function(localPath) {
					cb(localPath);
				});
			}
		});
	};
	/**
	 * @description 检查文件是否存在
	 */
	var isExist = function(localpath, cb) {
		if (!localpath) {
			return cb(false);
		}
		plus.io.resolveLocalFileSystemURL(localpath, function() {
			cb(true);
		}, function() {
			cb(false);
		});
	}
	var couDwn = 0;
	//下载
	var Filedownload = function(netPath, callback) {
		var dtask = plus.downloader.createDownload(netPath, {}, function(d, status) {
			// 下载完成	`
			if (status == 200) {
				plus.io.resolveLocalFileSystemURL(d.filename, function(entry) {
					setLocalFileCache(netPath, entry.toLocalURL());
					callback(entry.toLocalURL()); //获取当前下载路径
				});
			} else {
				//console.log('download.state:' + d.state + "____download.status" + status);
				//下载失败 只递归一次，再次失败返回默认图片
				if (++couDwn <= 1) {
					console.log(couDwn);
					arguments.callee(netPath, callback);
				} else {
					//重置
					couDwn = 0;
					//返回默认图片
					callback();
				}
			}
		});
		//TODO 监听当前下载状态，当云服务器中不存在该文件时，查询的特别慢，估计过了3分钟以上才返回status:404，其他时间一直在刷d.state:2
		//具体的报文格式看这http://wenku.baidu.com/link?url=JtC5q4w4D8DCzid6ahpQGgir2JCxuQq_uHfJ-_G9ZxvySL1oStV6oS447QKLEMFT5JpmQCSl4gmYdotk1JfmcUBLPKO_WbaDirQulDWMK7_
		//		dtask.addEventListener( "statechanged", function(d, status){
		//			console.log(d.state);
		//		}, false );
		dtask.start();
	};

	function getLocalFileCache(netPath) {
		var FILE_CACHE_KEY = "filePathCache_" + md5(netPath);
		console.log("获取缓存图片文件:"+FILE_CACHE_KEY+"=>"+netPath);
		var localUrlObj = edupay.getStoreItem(FILE_CACHE_KEY);
		return localUrlObj;
	};

	function setLocalFileCache(netPath, localPath) {
		var FILE_CACHE_KEY = "filePathCache_" + md5(netPath);
		console.log("保存缓存图片文件:"+FILE_CACHE_KEY+"=>"+netPath);
		edupay.setStoreItem(FILE_CACHE_KEY, localPath);
	};
	/**
	 * 清除本地文件及缓存
	 */
	owner.clear = function(cb, waiting) {
		//没有手动设置下载路径，默认的下载路径是"/storage/sdcard0/Android/data/io.dcloud.HBuilder/.HBuilder/downloads/",相对路径如下
		//		plus.io.resolveLocalFileSystemURL("_downloads/", function(entry) {
		//			entry.removeRecursively(function() {
		//				myStorage.removeItemByKeys(null, function() {
		//					cb && cb();
		//				});
		//			}, function() {
		//				cb & cb(false);
		//			});
		//		}, function(e) {
		//			cb & cb(false);
		//		});
		waiting = waiting || plus.nativeUI.showWaiting('缓存清除中...');
		plus.io.resolveLocalFileSystemURL(owner.options.downloadPath, function(entry) {
			var tmpcou = 0;
			var dirReader = entry.createReader();
			dirReader.readEntries(function(entries) {
				var flen = entries.length,
					percent;
				//console.log("flen:" + flen);

				edupay.asyncRecursive(entries, function(fl, next) {
					if (fl.isFile) {
						fl.remove(function(en) {
							percent = Math.floor(++tmpcou / flen * 100);
							waiting.setTitle('已清除' + (percent > 99 ? 99 : percent) + '%')
							next();
						}, function(e) {
							console.log(JSON.stringify(e));
							next();
						});
					}
				}, function() {
					owner.options.removePrefix.concat(["filePathCache_","ajax_cache_"]);
					edupay.removeStoreByPrefixKey(owner.options.removePrefix, function() {
						waiting.setTitle('已清除100%');
						setTimeout(function() {
							waiting.close();
						}, 200);
						cb && cb();
					});
				});

			}, function(e) {
				console.log(e);
			});
		}, function(e) {
			console.log(e);
		});
	};
	/**
	 *@description 查看已下载的文件
	 */
	owner.getDownloadFiles = function() {
		plus.io.resolveLocalFileSystemURL(owner.options.downloadPath, function(entry) {
			console.log(entry.toLocalURL());
			var rd = entry.createReader();
			rd.readEntries(function(entries) {
				entries.forEach(function(f, index, arr) {
					console.log(f.name);
				})
			})
		});
	}
	 
}(mui, window.edupayFileCache = {}));


 