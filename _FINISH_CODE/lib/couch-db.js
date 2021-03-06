(function() {
  var DB, DESIGN_DOC, DESIGN_NAME, GC_SECONDS, MAX_ITEMS, Q, allTodos_map, nano, _, mainjs, output = {}, res,
    __slice = [].slice;

  Q = require("q");

  _ = require("underscore");

  nano = require("nano");
  mainjs = require("./main");
  watson = require("watson-developer-cloud");
  alchemyLanguage = watson.alchemy_language({
    api_key: process.env.ALCHEMY_API_KEY
<<<<<<< HEAD
    //api_key: 'Add your AlchemyAPI key here if urnning locally'

  });

=======
  });
>>>>>>> origin/master
  Q.longStackSupport = true;

  MAX_ITEMS = 20;

  GC_SECONDS = 30;

  allTodos_map = function(doc) {
    var completed, order, title;
    title = doc.title, completed = doc.completed, order = doc.order;
    if (!((title != null) && (completed != null) && (order != null))) {
      return;
    }
    return emit(order, {
      title: title,
      completed: completed
    });
  };

  DESIGN_NAME = "todos";

  DESIGN_DOC = {
    views: {
      allTodos: {
        map: allTodos_map.toString(),
        reduce: "_count"
      }
    }
  };

  exports.init = function(url) {
    var baseUrl, db, ignore, match, name, nanoBase;
    db = new DB(url);
    match = url.match(/(.*)\/(.*)/);
    if (match == null) {
      return Q.reject(new Error("url must have a path component: " + url));
    }
    ignore = match[0], baseUrl = match[1], name = match[2];
    nanoBase = nano(baseUrl);
    return Q.ninvoke(nanoBase.db, "create", name).fail(function() {
      return null;
    }).then(function() {
      return db._dbCall("get", "_design/" + DESIGN_NAME);
    }).fail(function() {
      return db._dbCall("insert", DESIGN_DOC, "_design/" + DESIGN_NAME);
    }).then(function() {
      setInterval((function() {
        return db.gc();
      }), GC_SECONDS * 1000);
      return db;
    });
  };

  DB = (function() {
    function DB(url) {
      this.nanoDB = nano(url);
    }

    DB.prototype.count = function() {
      var opts;
      opts = {
        reduce: true
      };
      return this._dbCall("view", DESIGN_NAME, "allTodos", opts).then(function(result) {
        var _ref, _ref1;
        return ((_ref = result[0]) != null ? (_ref1 = _ref.rows[0]) != null ? _ref1.value : void 0 : void 0) || 0;
      });
    };

    DB.prototype.search = function() {
      var opts;
      opts = {
        reduce: false,
        limit: MAX_ITEMS
      };
      return this._dbCall("view", DESIGN_NAME, "allTodos", opts).then(function(result) {
        return result[0].rows.map(function(item)
        {
          var _ref, _ref1;

          return {
            id: item.id,
            title: (_ref = item.value) != null ? _ref.title : void 0,
            completed: (_ref1 = item.value) != null ? _ref1.completed : void 0,
            order: item.key
          };

        });
      });
    };

    DB.prototype.create = function(item, WaRes) {
      var err;

      item = this._sanitize(item);
      if (item != null) {
        delete item.id;
      }
      if (item == null) {
        err = new Error("item cannot be null");
        return Q.reject(err);
      }

      return this._dbCall("insert", item)
      .then(function(result) {
        item.id = result[0].id;
        var params = {
          text: item.title
        };
        var deferred = Q.defer();

        // Invoke AlchemyAPI keyword extraction
        alchemyLanguage.keywords(params, function(err, response) {
<<<<<<< HEAD
          console.log("Inside the AlchemyAPI - returned promise");
          var answer;
          if (err){
            deferred.reject(err);
            console.log("Erros while returning result" + JSON.stringify(err, null, 2));
          }
          else {
            var AlcRes = JSON.stringify(response.keywords, null, 2);
            deferred.resolve({
              item: item,
              watsonRes: AlcRes
=======
          console.log("after returned promise");
          var answer;
          if (err)
            deferred.reject(err);
          else {
            deferred.resolve({
              item: item,
              watsonRes: JSON.stringify(response.keywords, null, 2)
>>>>>>> origin/master
            });
          }
        });
        return deferred.promise;
      });
    };

    DB.prototype.read = function(id) {
      var err;
      if (id == null) {
        err = new Error("id cannot be null");
        return Q.reject(err);
      }
      return this._get(id).fail((function(_this) {
        return function(err) {
          if (err.message === "missing") {
            return null;
          }
          throw err;
        };
      })(this)).then((function(_this) {
        return function(item) {
          return _this._sanitize(item);
        };
      })(this));
    };

    DB.prototype.update = function(id, item) {
      var err;
      item = this._sanitize(item);
      if (id == null) {
        err = new Error("id cannot be null");
        return Q.reject(err);
      }
      if (item == null) {
        err = new Error("item cannot be null");
        return Q.reject(err);
      }
      if (id !== item.id) {
        err = new Error("id does not match item.id");
        return Q.reject(err);
      }
      return this._get(id).then((function(_this) {
        return function(item_) {
          delete item.id;
          item._id = item_._id;
          item._rev = item_._rev;
          return _this._dbCall("insert", item);
        };
      })(this)).then((function(_this) {
        return function() {
          item.id = id;

          mainjs.keywords(item.title, res);


          return _this._sanitize(item);
        };
      })(this));
    };

    DB.prototype["delete"] = function(id) {
      var err;
      if (id == null) {
        err = new Error("id cannot be null");
        return Q.reject(err);
      }
      return this._get(id).fail((function(_this) {
        return function(err) {
          if (err.message === "missing") {
            return null;
          }
          throw err;
        };
      })(this)).then((function(_this) {
        return function(item) {
          if (item == null) {
            return null;
          }
          return _this._dbCall("destroy", id, item._rev);
        };
      })(this)).then(function() {
        return {
          id: id
        };
      });
    };

    DB.prototype.gc = function() {
      return this.count().then((function(_this) {
        return function(count) {
          if (count <= MAX_ITEMS) {
            return;
          }
          return _this.search();
        };
      })(this)).then((function(_this) {
        return function(items) {
          if (!items) {
            return;
          }
          if (!items.length) {
            return;
          }
          return _this["delete"](items[0].id);
        };
      })(this)).then((function(_this) {
        return function(id) {
          if (!id) {
            return;
          }
          return process.nextTick(function() {
            return _this.gc();
          });
        };
      })(this)).fail(function(err) {
        return log("gc: error: " + err);
      }).done();
    };

    DB.prototype._get = function(id) {
      return this._dbCall("get", id).then(function(result) {
        return result[0];
      });
    };

    DB.prototype._dbCall = function() {
      var args, method;
      method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return Q.npost(this.nanoDB, method, args);
    };

    DB.prototype._sanitize = function(obj) {
      var completed, id, order, title;
      if (obj == null) {
        return null;
      }
      id = obj.id, title = obj.title, completed = obj.completed, order = obj.order;
      obj = {
        id: id,
        title: title,
        completed: completed,
        order: order
      };
      if ((obj.id == null) && (obj.title == null) && (obj.completed == null) && (obj.order == null)) {
        return null;
      }
      return obj;
    };

    return DB;

  })();


}).call(this);
