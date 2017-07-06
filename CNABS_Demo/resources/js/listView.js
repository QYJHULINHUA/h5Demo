var news = new Vue({
	el: '#news',
	data: {
		banner: {}, //顶部banner数据
		items: [] //列表信息流数据
	},
	computed: {
		sortedList: function() {
			return this.items.slice(0).sort(function(a, b) {
				if(a.time > b.time) return -1;
				if(a.time < b.time) return 1;
				return 0;
			})
		}
	}
});

var db = database.getDB('news');

//db.news.clear();

var demo = {
	/*发送到到服务端的数据*/
	data: {
		lastId: '',
		column: "id,post_id,title,author_name,cover,published_at" //需要的字段名
	},

	//本地的数据的长度
	_localLengh: 0,

	pulldownRefresh: function() {
		//return;
		var self = this;
		if(window.plus && plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			plus.nativeUI.toast('似乎已断开与互联网的连接', {
				verticalAlign: 'top'
			});
			return;
		}

		//请求顶部banner信息
		mui.getJSON("http://spider.dcloud.net.cn/api/banner/36kr", self.data, function(rsp) {
			news.banner = {
				guid: rsp.post_id,
				title: rsp.title,
				cover: rsp.cover,
				author: rsp.author_name,
				time: rsp.published_at
			};
		});

		var time;
		var end;

		if(self.data.lastId == '') {
			time = new Date().getTime(); //起始时间
			db.news.reverse().sortBy('time').then(function(result) {
				self._localLengh = result.length;
				if(self._localLengh <= 0) {
					_getNews(db);
					return;
				}

				end = new Date().getTime(); //接受时间
				console.log('加载' + result.length + '条数据，耗时' + (end - time) + "ms");

				self.data.lastId = result[0].id;
				self.data.time = new Date(result[0].time).getTime();

				mui('#list').pullRefresh().endPulldown();
				news.items = result;
			});

		} else {
			_getNews(db);
		}

		function _getNews(db) {
			//请求列表信息流
			mui.getJSON("http://spider.dcloud.net.cn/api/news", self.data, function(rsp) {
				mui('#list').pullRefresh().endPulldown();

				if(!(rsp && rsp.length > 0)) {
					mui.toast('还没有新数据');
					return;
				}

				//保存最新消息的id，方便下拉刷新时使用
				var list = convert(rsp);
				self.data.lastId = list[0].id;
				self.data.time = new Date(list[0].time).getTime();

				var distinctList = [];
				//去除重复数据(此处应该由服务端负责，客户端不应该去做数据去重，排序等)
				for(var i = 0; i < list.length; i++) {
					if(_indexOfById(list[i].id)) continue;
					distinctList.push(list[i]);
				}

				if(distinctList.length <= 0) return;

				news.items = news.items.concat(distinctList);

				mui.toast('获取了 ' + distinctList.length + '条新数据');

				var shouldPersistData = [];
				var maxSize = 20;

				//self._localLengh + distinctList.length <= maxSize 则存储list全部
				//distinctList.length >= maxSize 则存储list前maxSize条数据
				//self._localLengh + distinctList.length > maxSize, 则存储list全部且需删除 本地的最后 self._localLengh + distinctList.length - maxSize 条数据
				//console.log(JSON.stringify(distinctList,2,null));

				db.transaction('rw', db.news, function() {

					db.news.toCollection().count().then(function(len) {

						self._localLengh = len;
						if(distinctList.length >= maxSize) {
							shouldPersistData = distinctList.slice(0, maxSize);
							//console.log(JSON.stringify(shouldPersistData));
						} else if(self._localLengh + distinctList.length <= maxSize) {
							shouldPersistData = distinctList;
						} else if(self._localLengh + distinctList.length > maxSize) {
							//删除本地的最后 self._localLengh + distinctList.length - maxSize 条数据
							var deleteIndex = maxSize - distinctList.length - 1;
							db.news.reverse().sortBy('time').then(function(result) {
								db.news.delete(result[deleteIndex].id);
							});

							db.news.where('time').below(distinctList[distinctList.length - 1].time)
								.delete().then(function(deleteCount) {
									self._localLengh = self._localLengh - deleteCount;
								});

							//存储list全部数据
							shouldPersistData = distinctList;
						}

						db.news.bulkPut(shouldPersistData);

					});

				}).catch(function(err) {
					console.error('获取新闻数据出错：' + err.stack);
				});

			});
		}

		function _indexOfById(id) {
			var matches = news.items.filter(function(item, index) {
				return item.id == id;
			})

			if(matches.length > 0) return matches[0];
			return null;
		}

		/**
		 * 1、将服务端返回数据，转换成前端需要的格式
		 * 2、若服务端返回格式和前端所需格式相同，则不需要改功能
		 * 
		 * @param {Array} items 
		 */
		function convert(items) {
			var newItems = [];
			items.forEach(function(item) {
				newItems.push({
					id: item.id,
					guid: item.post_id,
					title: item.title,
					author: item.author_name,
					cover: item.cover,
					time: item.published_at
				});
			});
			return newItems;
		}
	}
}