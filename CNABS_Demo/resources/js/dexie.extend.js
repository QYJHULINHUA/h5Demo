function _database() {
	this.name = 'listView1';
	this.version = 2;
	this.stores = {
		news: 'id,guid,title,author,cover,time'
	};
};

_database.prototype = {
	initDB: function(migration) {
		var db = new Dexie(this.name);
		db.version(this.version).stores(this.stores).upgrade(function(trans) {
			alert(22)
			if(migration && typeof migration === 'function') {
				console.log('indexDb 执行了迁移逻辑');
				migration(trans);
			}
		});

		return db;
	},

	/*
	 * 传入store name序列
	 */
	getDB: function() {
		var stores = {},
			self = this;
		//传入 stroe names，如 store1,store2
		for(var i = 0; i < arguments.length; i++) {
			var storeName = arguments[i];
			if(!self.stores[storeName]) continue;

			stores[storeName] = self.stores[storeName];
		}

		var db = new Dexie(this.name);
		db.version(this.version).stores(stores);

		return db;
	}
};

window.database = new _database();