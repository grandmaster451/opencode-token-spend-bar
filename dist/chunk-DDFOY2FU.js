var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/better-sqlite3/lib/util.js
var require_util = __commonJS({
  "node_modules/better-sqlite3/lib/util.js"(exports) {
    "use strict";
    exports.getBooleanOption = (options, key) => {
      let value = false;
      if (key in options && typeof (value = options[key]) !== "boolean") {
        throw new TypeError(`Expected the "${key}" option to be a boolean`);
      }
      return value;
    };
    exports.cppdb = /* @__PURE__ */ Symbol();
    exports.inspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
  }
});

// node_modules/better-sqlite3/lib/sqlite-error.js
var require_sqlite_error = __commonJS({
  "node_modules/better-sqlite3/lib/sqlite-error.js"(exports, module) {
    "use strict";
    var descriptor = { value: "SqliteError", writable: true, enumerable: false, configurable: true };
    function SqliteError(message, code) {
      if (new.target !== SqliteError) {
        return new SqliteError(message, code);
      }
      if (typeof code !== "string") {
        throw new TypeError("Expected second argument to be a string");
      }
      Error.call(this, message);
      descriptor.value = "" + message;
      Object.defineProperty(this, "message", descriptor);
      Error.captureStackTrace(this, SqliteError);
      this.code = code;
    }
    Object.setPrototypeOf(SqliteError, Error);
    Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
    Object.defineProperty(SqliteError.prototype, "name", descriptor);
    module.exports = SqliteError;
  }
});

// node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS({
  "node_modules/file-uri-to-path/index.js"(exports, module) {
    "use strict";
    var sep = __require("path").sep || "/";
    module.exports = fileUriToPath;
    function fileUriToPath(uri) {
      if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
        throw new TypeError("must pass in a file:// URI to convert to a file path");
      }
      var rest = decodeURI(uri.substring(7));
      var firstSlash = rest.indexOf("/");
      var host = rest.substring(0, firstSlash);
      var path2 = rest.substring(firstSlash + 1);
      if ("localhost" == host) host = "";
      if (host) {
        host = sep + sep + host;
      }
      path2 = path2.replace(/^(.+)\|/, "$1:");
      if (sep == "\\") {
        path2 = path2.replace(/\//g, "\\");
      }
      if (/^.+\:/.test(path2)) {
      } else {
        path2 = sep + path2;
      }
      return host + path2;
    }
  }
});

// node_modules/bindings/bindings.js
var require_bindings = __commonJS({
  "node_modules/bindings/bindings.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var path2 = __require("path");
    var fileURLToPath = require_file_uri_to_path();
    var join2 = path2.join;
    var dirname = path2.dirname;
    var exists = fs2.accessSync && function(path3) {
      try {
        fs2.accessSync(path3);
      } catch (e) {
        return false;
      }
      return true;
    } || fs2.existsSync || path2.existsSync;
    var defaults = {
      arrow: process.env.NODE_BINDINGS_ARROW || " \u2192 ",
      compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
      platform: process.platform,
      arch: process.arch,
      nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
      version: process.versions.node,
      bindings: "bindings.node",
      try: [
        // node-gyp's linked version in the "build" dir
        ["module_root", "build", "bindings"],
        // node-waf and gyp_addon (a.k.a node-gyp)
        ["module_root", "build", "Debug", "bindings"],
        ["module_root", "build", "Release", "bindings"],
        // Debug files, for development (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Debug", "bindings"],
        ["module_root", "Debug", "bindings"],
        // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Release", "bindings"],
        ["module_root", "Release", "bindings"],
        // Legacy from node-waf, node <= 0.4.x
        ["module_root", "build", "default", "bindings"],
        // Production "Release" buildtype binary (meh...)
        ["module_root", "compiled", "version", "platform", "arch", "bindings"],
        // node-qbs builds
        ["module_root", "addon-build", "release", "install-root", "bindings"],
        ["module_root", "addon-build", "debug", "install-root", "bindings"],
        ["module_root", "addon-build", "default", "install-root", "bindings"],
        // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
        ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
      ]
    };
    function bindings(opts) {
      if (typeof opts == "string") {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }
      Object.keys(defaults).map(function(i2) {
        if (!(i2 in opts)) opts[i2] = defaults[i2];
      });
      if (!opts.module_root) {
        opts.module_root = exports.getRoot(exports.getFileName());
      }
      if (path2.extname(opts.bindings) != ".node") {
        opts.bindings += ".node";
      }
      var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      var tries = [], i = 0, l = opts.try.length, n, b, err;
      for (; i < l; i++) {
        n = join2.apply(
          null,
          opts.try[i].map(function(p) {
            return opts[p] || p;
          })
        );
        tries.push(n);
        try {
          b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
          if (!opts.path) {
            b.path = n;
          }
          return b;
        } catch (e) {
          if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
            throw e;
          }
        }
      }
      err = new Error(
        "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
          return opts.arrow + a;
        }).join("\n")
      );
      err.tries = tries;
      throw err;
    }
    module.exports = exports = bindings;
    exports.getFileName = function getFileName(calling_file) {
      var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(e, st) {
        for (var i = 0, l = st.length; i < l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
              if (fileName !== calling_file) {
                return;
              }
            } else {
              return;
            }
          }
        }
      };
      Error.captureStackTrace(dummy);
      dummy.stack;
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;
      var fileSchema = "file://";
      if (fileName.indexOf(fileSchema) === 0) {
        fileName = fileURLToPath(fileName);
      }
      return fileName;
    };
    exports.getRoot = function getRoot(file) {
      var dir = dirname(file), prev;
      while (true) {
        if (dir === ".") {
          dir = process.cwd();
        }
        if (exists(join2(dir, "package.json")) || exists(join2(dir, "node_modules"))) {
          return dir;
        }
        if (prev === dir) {
          throw new Error(
            'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
          );
        }
        prev = dir;
        dir = join2(dir, "..");
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/wrappers.js
var require_wrappers = __commonJS({
  "node_modules/better-sqlite3/lib/methods/wrappers.js"(exports) {
    "use strict";
    var { cppdb } = require_util();
    exports.prepare = function prepare(sql) {
      return this[cppdb].prepare(sql, this, false);
    };
    exports.exec = function exec(sql) {
      this[cppdb].exec(sql);
      return this;
    };
    exports.close = function close() {
      this[cppdb].close();
      return this;
    };
    exports.loadExtension = function loadExtension(...args) {
      this[cppdb].loadExtension(...args);
      return this;
    };
    exports.defaultSafeIntegers = function defaultSafeIntegers(...args) {
      this[cppdb].defaultSafeIntegers(...args);
      return this;
    };
    exports.unsafeMode = function unsafeMode(...args) {
      this[cppdb].unsafeMode(...args);
      return this;
    };
    exports.getters = {
      name: {
        get: function name() {
          return this[cppdb].name;
        },
        enumerable: true
      },
      open: {
        get: function open() {
          return this[cppdb].open;
        },
        enumerable: true
      },
      inTransaction: {
        get: function inTransaction() {
          return this[cppdb].inTransaction;
        },
        enumerable: true
      },
      readonly: {
        get: function readonly() {
          return this[cppdb].readonly;
        },
        enumerable: true
      },
      memory: {
        get: function memory() {
          return this[cppdb].memory;
        },
        enumerable: true
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/transaction.js
var require_transaction = __commonJS({
  "node_modules/better-sqlite3/lib/methods/transaction.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    var controllers = /* @__PURE__ */ new WeakMap();
    module.exports = function transaction(fn) {
      if (typeof fn !== "function") throw new TypeError("Expected first argument to be a function");
      const db = this[cppdb];
      const controller = getController(db, this);
      const { apply } = Function.prototype;
      const properties = {
        default: { value: wrapTransaction(apply, fn, db, controller.default) },
        deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
        immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
        exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
        database: { value: this, enumerable: true }
      };
      Object.defineProperties(properties.default.value, properties);
      Object.defineProperties(properties.deferred.value, properties);
      Object.defineProperties(properties.immediate.value, properties);
      Object.defineProperties(properties.exclusive.value, properties);
      return properties.default.value;
    };
    var getController = (db, self) => {
      let controller = controllers.get(db);
      if (!controller) {
        const shared = {
          commit: db.prepare("COMMIT", self, false),
          rollback: db.prepare("ROLLBACK", self, false),
          savepoint: db.prepare("SAVEPOINT `	_bs3.	`", self, false),
          release: db.prepare("RELEASE `	_bs3.	`", self, false),
          rollbackTo: db.prepare("ROLLBACK TO `	_bs3.	`", self, false)
        };
        controllers.set(db, controller = {
          default: Object.assign({ begin: db.prepare("BEGIN", self, false) }, shared),
          deferred: Object.assign({ begin: db.prepare("BEGIN DEFERRED", self, false) }, shared),
          immediate: Object.assign({ begin: db.prepare("BEGIN IMMEDIATE", self, false) }, shared),
          exclusive: Object.assign({ begin: db.prepare("BEGIN EXCLUSIVE", self, false) }, shared)
        });
      }
      return controller;
    };
    var wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
      let before, after, undo;
      if (db.inTransaction) {
        before = savepoint;
        after = release;
        undo = rollbackTo;
      } else {
        before = begin;
        after = commit;
        undo = rollback;
      }
      before.run();
      try {
        const result = apply.call(fn, this, arguments);
        after.run();
        return result;
      } catch (ex) {
        if (db.inTransaction) {
          undo.run();
          if (undo !== rollback) after.run();
        }
        throw ex;
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/pragma.js
var require_pragma = __commonJS({
  "node_modules/better-sqlite3/lib/methods/pragma.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function pragma(source, options) {
      if (options == null) options = {};
      if (typeof source !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      const simple = getBooleanOption(options, "simple");
      const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
      return simple ? stmt.pluck().get() : stmt.all();
    };
  }
});

// node_modules/better-sqlite3/lib/methods/backup.js
var require_backup = __commonJS({
  "node_modules/better-sqlite3/lib/methods/backup.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var path2 = __require("path");
    var { promisify } = __require("util");
    var { cppdb } = require_util();
    var fsAccess = promisify(fs2.access);
    module.exports = async function backup(filename, options) {
      if (options == null) options = {};
      if (typeof filename !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      filename = filename.trim();
      const attachedName = "attached" in options ? options.attached : "main";
      const handler = "progress" in options ? options.progress : null;
      if (!filename) throw new TypeError("Backup filename cannot be an empty string");
      if (filename === ":memory:") throw new TypeError('Invalid backup filename ":memory:"');
      if (typeof attachedName !== "string") throw new TypeError('Expected the "attached" option to be a string');
      if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
      if (handler != null && typeof handler !== "function") throw new TypeError('Expected the "progress" option to be a function');
      await fsAccess(path2.dirname(filename)).catch(() => {
        throw new TypeError("Cannot save backup because the directory does not exist");
      });
      const isNewFile = await fsAccess(filename).then(() => false, () => true);
      return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
    };
    var runBackup = (backup, handler) => {
      let rate = 0;
      let useDefault = true;
      return new Promise((resolve, reject) => {
        setImmediate(function step() {
          try {
            const progress = backup.transfer(rate);
            if (!progress.remainingPages) {
              backup.close();
              resolve(progress);
              return;
            }
            if (useDefault) {
              useDefault = false;
              rate = 100;
            }
            if (handler) {
              const ret = handler(progress);
              if (ret !== void 0) {
                if (typeof ret === "number" && ret === ret) rate = Math.max(0, Math.min(2147483647, Math.round(ret)));
                else throw new TypeError("Expected progress callback to return a number or undefined");
              }
            }
            setImmediate(step);
          } catch (err) {
            backup.close();
            reject(err);
          }
        });
      });
    };
  }
});

// node_modules/better-sqlite3/lib/methods/serialize.js
var require_serialize = __commonJS({
  "node_modules/better-sqlite3/lib/methods/serialize.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    module.exports = function serialize(options) {
      if (options == null) options = {};
      if (typeof options !== "object") throw new TypeError("Expected first argument to be an options object");
      const attachedName = "attached" in options ? options.attached : "main";
      if (typeof attachedName !== "string") throw new TypeError('Expected the "attached" option to be a string');
      if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
      return this[cppdb].serialize(attachedName);
    };
  }
});

// node_modules/better-sqlite3/lib/methods/function.js
var require_function = __commonJS({
  "node_modules/better-sqlite3/lib/methods/function.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function defineFunction(name, options, fn) {
      if (options == null) options = {};
      if (typeof options === "function") {
        fn = options;
        options = {};
      }
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof fn !== "function") throw new TypeError("Expected last argument to be a function");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      if (!name) throw new TypeError("User-defined function name cannot be an empty string");
      const safeIntegers = "safeIntegers" in options ? +getBooleanOption(options, "safeIntegers") : 2;
      const deterministic = getBooleanOption(options, "deterministic");
      const directOnly = getBooleanOption(options, "directOnly");
      const varargs = getBooleanOption(options, "varargs");
      let argCount = -1;
      if (!varargs) {
        argCount = fn.length;
        if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError("Expected function.length to be a positive integer");
        if (argCount > 100) throw new RangeError("User-defined functions cannot have more than 100 arguments");
      }
      this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
      return this;
    };
  }
});

// node_modules/better-sqlite3/lib/methods/aggregate.js
var require_aggregate = __commonJS({
  "node_modules/better-sqlite3/lib/methods/aggregate.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function defineAggregate(name, options) {
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object" || options === null) throw new TypeError("Expected second argument to be an options object");
      if (!name) throw new TypeError("User-defined function name cannot be an empty string");
      const start = "start" in options ? options.start : null;
      const step = getFunctionOption(options, "step", true);
      const inverse = getFunctionOption(options, "inverse", false);
      const result = getFunctionOption(options, "result", false);
      const safeIntegers = "safeIntegers" in options ? +getBooleanOption(options, "safeIntegers") : 2;
      const deterministic = getBooleanOption(options, "deterministic");
      const directOnly = getBooleanOption(options, "directOnly");
      const varargs = getBooleanOption(options, "varargs");
      let argCount = -1;
      if (!varargs) {
        argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
        if (argCount > 0) argCount -= 1;
        if (argCount > 100) throw new RangeError("User-defined functions cannot have more than 100 arguments");
      }
      this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
      return this;
    };
    var getFunctionOption = (options, key, required) => {
      const value = key in options ? options[key] : null;
      if (typeof value === "function") return value;
      if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
      if (required) throw new TypeError(`Missing required option "${key}"`);
      return null;
    };
    var getLength = ({ length }) => {
      if (Number.isInteger(length) && length >= 0) return length;
      throw new TypeError("Expected function.length to be a positive integer");
    };
  }
});

// node_modules/better-sqlite3/lib/methods/table.js
var require_table = __commonJS({
  "node_modules/better-sqlite3/lib/methods/table.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    module.exports = function defineTable(name, factory) {
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (!name) throw new TypeError("Virtual table module name cannot be an empty string");
      let eponymous = false;
      if (typeof factory === "object" && factory !== null) {
        eponymous = true;
        factory = defer(parseTableDefinition(factory, "used", name));
      } else {
        if (typeof factory !== "function") throw new TypeError("Expected second argument to be a function or a table definition object");
        factory = wrapFactory(factory);
      }
      this[cppdb].table(factory, name, eponymous);
      return this;
    };
    function wrapFactory(factory) {
      return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
        const thisObject = {
          module: moduleName,
          database: databaseName,
          table: tableName
        };
        const def = apply.call(factory, thisObject, args);
        if (typeof def !== "object" || def === null) {
          throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
        }
        return parseTableDefinition(def, "returned", moduleName);
      };
    }
    function parseTableDefinition(def, verb, moduleName) {
      if (!hasOwnProperty.call(def, "rows")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
      }
      if (!hasOwnProperty.call(def, "columns")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
      }
      const rows = def.rows;
      if (typeof rows !== "function" || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
      }
      let columns = def.columns;
      if (!Array.isArray(columns) || !(columns = [...columns]).every((x) => typeof x === "string")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
      }
      if (columns.length !== new Set(columns).size) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
      }
      if (!columns.length) {
        throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
      }
      let parameters;
      if (hasOwnProperty.call(def, "parameters")) {
        parameters = def.parameters;
        if (!Array.isArray(parameters) || !(parameters = [...parameters]).every((x) => typeof x === "string")) {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
        }
      } else {
        parameters = inferParameters(rows);
      }
      if (parameters.length !== new Set(parameters).size) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
      }
      if (parameters.length > 32) {
        throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
      }
      for (const parameter of parameters) {
        if (columns.includes(parameter)) {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
        }
      }
      let safeIntegers = 2;
      if (hasOwnProperty.call(def, "safeIntegers")) {
        const bool = def.safeIntegers;
        if (typeof bool !== "boolean") {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
        }
        safeIntegers = +bool;
      }
      let directOnly = false;
      if (hasOwnProperty.call(def, "directOnly")) {
        directOnly = def.directOnly;
        if (typeof directOnly !== "boolean") {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
        }
      }
      const columnDefinitions = [
        ...parameters.map(identifier).map((str) => `${str} HIDDEN`),
        ...columns.map(identifier)
      ];
      return [
        `CREATE TABLE x(${columnDefinitions.join(", ")});`,
        wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
        parameters,
        safeIntegers,
        directOnly
      ];
    }
    function wrapGenerator(generator, columnMap, moduleName) {
      return function* virtualTable(...args) {
        const output = args.map((x) => Buffer.isBuffer(x) ? Buffer.from(x) : x);
        for (let i = 0; i < columnMap.size; ++i) {
          output.push(null);
        }
        for (const row of generator(...args)) {
          if (Array.isArray(row)) {
            extractRowArray(row, output, columnMap.size, moduleName);
            yield output;
          } else if (typeof row === "object" && row !== null) {
            extractRowObject(row, output, columnMap, moduleName);
            yield output;
          } else {
            throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
          }
        }
      };
    }
    function extractRowArray(row, output, columnCount, moduleName) {
      if (row.length !== columnCount) {
        throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
      }
      const offset = output.length - columnCount;
      for (let i = 0; i < columnCount; ++i) {
        output[i + offset] = row[i];
      }
    }
    function extractRowObject(row, output, columnMap, moduleName) {
      let count = 0;
      for (const key of Object.keys(row)) {
        const index = columnMap.get(key);
        if (index === void 0) {
          throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
        }
        output[index] = row[key];
        count += 1;
      }
      if (count !== columnMap.size) {
        throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
      }
    }
    function inferParameters({ length }) {
      if (!Number.isInteger(length) || length < 0) {
        throw new TypeError("Expected function.length to be a positive integer");
      }
      const params = [];
      for (let i = 0; i < length; ++i) {
        params.push(`$${i + 1}`);
      }
      return params;
    }
    var { hasOwnProperty } = Object.prototype;
    var { apply } = Function.prototype;
    var GeneratorFunctionPrototype = Object.getPrototypeOf(function* () {
    });
    var identifier = (str) => `"${str.replace(/"/g, '""')}"`;
    var defer = (x) => () => x;
  }
});

// node_modules/better-sqlite3/lib/methods/inspect.js
var require_inspect = __commonJS({
  "node_modules/better-sqlite3/lib/methods/inspect.js"(exports, module) {
    "use strict";
    var DatabaseInspection = function Database() {
    };
    module.exports = function inspect(depth, opts) {
      return Object.assign(new DatabaseInspection(), this);
    };
  }
});

// node_modules/better-sqlite3/lib/database.js
var require_database = __commonJS({
  "node_modules/better-sqlite3/lib/database.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var path2 = __require("path");
    var util = require_util();
    var SqliteError = require_sqlite_error();
    var DEFAULT_ADDON;
    function Database(filenameGiven, options) {
      if (new.target == null) {
        return new Database(filenameGiven, options);
      }
      let buffer;
      if (Buffer.isBuffer(filenameGiven)) {
        buffer = filenameGiven;
        filenameGiven = ":memory:";
      }
      if (filenameGiven == null) filenameGiven = "";
      if (options == null) options = {};
      if (typeof filenameGiven !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      if ("readOnly" in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
      if ("memory" in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');
      const filename = filenameGiven.trim();
      const anonymous = filename === "" || filename === ":memory:";
      const readonly = util.getBooleanOption(options, "readonly");
      const fileMustExist = util.getBooleanOption(options, "fileMustExist");
      const timeout = "timeout" in options ? options.timeout : 5e3;
      const verbose = "verbose" in options ? options.verbose : null;
      const nativeBinding = "nativeBinding" in options ? options.nativeBinding : null;
      if (readonly && anonymous && !buffer) throw new TypeError("In-memory/temporary databases cannot be readonly");
      if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
      if (timeout > 2147483647) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
      if (verbose != null && typeof verbose !== "function") throw new TypeError('Expected the "verbose" option to be a function');
      if (nativeBinding != null && typeof nativeBinding !== "string" && typeof nativeBinding !== "object") throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');
      let addon;
      if (nativeBinding == null) {
        addon = DEFAULT_ADDON || (DEFAULT_ADDON = require_bindings()("better_sqlite3.node"));
      } else if (typeof nativeBinding === "string") {
        const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : __require;
        addon = requireFunc(path2.resolve(nativeBinding).replace(/(\.node)?$/, ".node"));
      } else {
        addon = nativeBinding;
      }
      if (!addon.isInitialized) {
        addon.setErrorConstructor(SqliteError);
        addon.isInitialized = true;
      }
      if (!anonymous && !fs2.existsSync(path2.dirname(filename))) {
        throw new TypeError("Cannot open database because the directory does not exist");
      }
      Object.defineProperties(this, {
        [util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
        ...wrappers.getters
      });
    }
    var wrappers = require_wrappers();
    Database.prototype.prepare = wrappers.prepare;
    Database.prototype.transaction = require_transaction();
    Database.prototype.pragma = require_pragma();
    Database.prototype.backup = require_backup();
    Database.prototype.serialize = require_serialize();
    Database.prototype.function = require_function();
    Database.prototype.aggregate = require_aggregate();
    Database.prototype.table = require_table();
    Database.prototype.loadExtension = wrappers.loadExtension;
    Database.prototype.exec = wrappers.exec;
    Database.prototype.close = wrappers.close;
    Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
    Database.prototype.unsafeMode = wrappers.unsafeMode;
    Database.prototype[util.inspect] = require_inspect();
    module.exports = Database;
  }
});

// node_modules/better-sqlite3/lib/index.js
var require_lib = __commonJS({
  "node_modules/better-sqlite3/lib/index.js"(exports, module) {
    "use strict";
    module.exports = require_database();
    module.exports.SqliteError = require_sqlite_error();
  }
});

// src/components/ErrorFallback.tsx
import { createElement, insert, setProp } from "@opentui/solid";
function ErrorFallback(props) {
  console.error("[TokenSpendBar] Error:", props.error.message, props.error.stack);
  const box = createElement("box");
  setProp(box, "flexDirection", "column");
  setProp(box, "borderStyle", "round");
  const title = createElement("text");
  insert(title, "Token spend (error)");
  insert(box, title);
  const msg = createElement("text");
  insert(msg, truncate(props.error.message, 60));
  insert(box, msg);
  return box;
}
function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "\u2026" : str;
}

// src/components/SessionSpendWidget.tsx
import { createElement as createElement3, insert as insert3, setProp as setProp2 } from "@opentui/solid";

// src/components/format-row.ts
var NARROW_THRESHOLD = 40;
function formatRowNormal(row) {
  const remaining = row.remainingFormatted;
  const parts = [`${row.label}  ${remaining}`];
  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }
  if (row.percentage !== null) {
    parts.push(`| ${row.percentage}% used`);
  }
  return parts.join("  ");
}
function formatRowNarrow(row) {
  const remaining = row.remainingFormatted;
  const parts = [`${row.label}:${remaining}`];
  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }
  if (row.percentage !== null) {
    parts.push(`${row.percentage}%`);
  }
  return parts.join("/");
}
function formatRow(row, narrow) {
  return narrow ? formatRowNarrow(row) : formatRowNormal(row);
}

// src/components/AnimatedNumber.tsx
import { createSignal, createEffect, onCleanup, untrack } from "solid-js";
import { createElement as createElement2, insert as insert2 } from "@opentui/solid";
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function shouldSkipAnimation(from, to) {
  const reference = Math.max(Math.abs(from), Math.abs(to), 1);
  return Math.abs(to - from) < reference * 0.01;
}
function interpolateValue(from, to, easedProgress) {
  return from + (to - from) * easedProgress;
}
var DEFAULT_DURATION = 400;
function useAnimatedNumber(getValue, options = {}) {
  const duration = options.duration ?? DEFAULT_DURATION;
  const [displayValue, setDisplayValue] = createSignal(getValue());
  let rafHandle = null;
  createEffect(() => {
    const target = getValue();
    const current = untrack(displayValue);
    if (shouldSkipAnimation(current, target)) {
      setDisplayValue(target);
      return;
    }
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }
    const startValue = current;
    let startTime = null;
    const tick = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayValue(interpolateValue(startValue, target, eased));
      if (progress < 1) {
        rafHandle = requestAnimationFrame(tick);
      } else {
        rafHandle = null;
      }
    };
    rafHandle = requestAnimationFrame(tick);
  });
  onCleanup(() => {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }
  });
  return displayValue;
}

// src/domain/formatter.ts
function formatTokens(count) {
  if (Math.abs(count) < 1e3) {
    return String(count);
  }
  return `${(count / 1e3).toFixed(1)}k`;
}
function formatCost(amount, currency) {
  if (amount === null) {
    return null;
  }
  return `${currency}${amount.toFixed(2)}`;
}
function shouldShowCost(bucket) {
  return bucket !== "chatgpt-plus";
}
function getDisplayValue(remaining, spent, limit) {
  if (remaining !== null && limit !== null && limit > 0) {
    return Math.max(0, remaining);
  }
  return spent;
}
function calculateSpentPercentage(spent, limit) {
  if (limit === null || limit <= 0) {
    return null;
  }
  const percentage = spent / limit * 100;
  return Math.round(percentage * 100) / 100;
}

// src/components/SessionSpendWidget.tsx
function SessionSpendWidget(props) {
  const columns = props.columns ?? 80;
  const narrow = columns < NARROW_THRESHOLD;
  const box = createElement3("box");
  setProp2(box, "flexDirection", "column");
  const heading = createElement3("text");
  insert3(heading, "Remaining");
  insert3(box, heading);
  for (const row of props.viewModel.rows) {
    const displayValue = row.remaining ?? row.tokens;
    const animatedDisplay = useAnimatedNumber(() => displayValue);
    const text = createElement3("text");
    insert3(text, () => {
      const animatedFormatted = formatTokens(animatedDisplay());
      const animatedRow = { ...row, remainingFormatted: animatedFormatted };
      return formatRow(animatedRow, narrow);
    });
    insert3(box, text);
  }
  return box;
}

// src/domain/provider.ts
var PROVIDER_LABELS = {
  minimax: "MM",
  "opencode-go": "OCG",
  "chatgpt-plus": "GPT+"
};
function normalizeProvider(rawProviderID) {
  switch (rawProviderID) {
    case "minimax":
      return "minimax";
    case "opencode-go":
      return "opencode-go";
    case "openai":
      return "chatgpt-plus";
    default:
      return null;
  }
}
function getProviderDisplayLabel(bucket) {
  return PROVIDER_LABELS[bucket];
}
function isProviderBucket(value) {
  return value === "minimax" || value === "opencode-go" || value === "chatgpt-plus";
}

// src/domain/tokens.ts
function getTokenCount(tokens) {
  if (!tokens) {
    return 0;
  }
  if (typeof tokens.total === "number" && Number.isFinite(tokens.total)) {
    return tokens.total;
  }
  const values = [
    tokens.input,
    tokens.output,
    tokens.reasoning,
    tokens.cache?.read,
    tokens.cache?.write
  ].map((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
  return values.reduce((sum, value) => sum + value, 0);
}

// src/adapters/history-scanner.ts
var import_better_sqlite3 = __toESM(require_lib(), 1);
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// src/domain/period.ts
function getCurrentMonthBounds() {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// src/adapters/history-scanner.ts
function getOpencodeDbPath() {
  const configuredPath = process.env.OPENCODE_DB_PATH ?? process.env.TOKEN_SPEND_BAR_OPENCODE_DB_PATH;
  if (configuredPath && configuredPath.trim().length > 0) {
    return configuredPath;
  }
  const dataHome = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
  return path.join(dataHome, "opencode", "opencode.db");
}
function ensureDbExists() {
  return fs.existsSync(getOpencodeDbPath());
}
function queryCurrentMonthMessages(db) {
  const { start, end } = getCurrentMonthBounds();
  const rows = db.prepare(
    `
        SELECT
          id,
          session_id AS sessionID,
          data
        FROM message
        WHERE json_extract(data, '$.time.created') >= ?
          AND json_extract(data, '$.time.created') < ?
      `
  ).all(start.getTime(), end.getTime());
  return rows.flatMap((row) => {
    const parsed = safeParseJson(row.data);
    if (!parsed) {
      return [];
    }
    const time = getOptionalObject(parsed.time);
    const model = getOptionalObject(parsed.model);
    const timestamp = toFiniteNumber(time?.created);
    const providerID = toStringValue(parsed.providerID) ?? toStringValue(model?.providerID);
    const role = toStringValue(parsed.role) ?? "unknown";
    if (timestamp === null || providerID === null) {
      return [];
    }
    return [
      {
        id: row.id,
        sessionID: row.sessionID,
        role,
        providerID,
        cost: toNullableNumber(parsed.cost),
        tokens: toTokenPayload(parsed.tokens),
        timestamp
      }
    ];
  });
}
function queryStepFinishParts(db, messageIds) {
  if (messageIds.length === 0) {
    return [];
  }
  const placeholders = messageIds.map(() => "?").join(", ");
  const rows = db.prepare(
    `
        SELECT
          message_id AS messageID,
          data
        FROM part
        WHERE json_extract(data, '$.type') = 'step-finish'
          AND message_id IN (${placeholders})
      `
  ).all(...messageIds);
  return rows.flatMap((row) => {
    const parsed = safeParseJson(row.data);
    if (!parsed || row.messageID === void 0) {
      return [];
    }
    return [
      {
        messageID: row.messageID,
        cost: toNullableNumber(parsed.cost),
        tokens: toTokenPayload(parsed.tokens)
      }
    ];
  });
}
function normalizeMessageRecord(record) {
  const provider = normalizeProvider(record.providerID);
  if (provider === null) {
    return null;
  }
  const tokens = getTokenCount(record.tokens);
  if (tokens === 0 && record.cost === null) {
    return null;
  }
  return {
    provider,
    tokens,
    cost: record.cost,
    timestamp: record.timestamp
  };
}
function scanCurrentMonthHistory() {
  const dbPath = getOpencodeDbPath();
  if (!ensureDbExists()) {
    console.warn(`[token-spend-bar] OpenCode database not found at ${dbPath}.`);
    return [];
  }
  let db = null;
  try {
    db = new import_better_sqlite3.default(dbPath, { readonly: true });
  } catch (error) {
    console.warn(`[token-spend-bar] Failed to open OpenCode database at ${dbPath}.`, error);
    return [];
  }
  try {
    const messages = queryCurrentMonthMessages(db);
    const stepFinishParts = queryStepFinishParts(
      db,
      messages.map((message) => message.id)
    );
    const stepFinishByMessage = groupStepFinishParts(stepFinishParts);
    return messages.flatMap((message) => {
      const parts = stepFinishByMessage.get(message.id);
      const mergedMessage = parts ? mergeMessageUsage(message, parts) : message;
      const normalized = normalizeMessageRecord(mergedMessage);
      return normalized ? [normalized] : [];
    });
  } catch (error) {
    console.warn(
      "[token-spend-bar] Failed to query usage history from the OpenCode database.",
      error
    );
    return [];
  } finally {
    try {
      db.close();
    } catch (error) {
      console.warn(
        "[token-spend-bar] Failed to close the OpenCode database connection cleanly.",
        error
      );
    }
  }
}
function groupStepFinishParts(parts) {
  const grouped = /* @__PURE__ */ new Map();
  for (const part of parts) {
    const existing = grouped.get(part.messageID);
    if (existing) {
      existing.push(part);
      continue;
    }
    grouped.set(part.messageID, [part]);
  }
  return grouped;
}
function mergeMessageUsage(message, parts) {
  const totalTokens = parts.reduce((sum, part) => sum + getTokenCount(part.tokens), 0);
  const costs = parts.map((part) => part.cost).filter((cost) => cost !== null);
  return {
    ...message,
    cost: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) : message.cost,
    tokens: { total: totalTokens }
  };
}
function safeParseJson(value) {
  try {
    const parsed = JSON.parse(value);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function toTokenPayload(value) {
  if (!isJsonObject(value)) {
    return null;
  }
  const cache = getOptionalObject(value.cache);
  return {
    total: toNullableNumber(value.total) ?? void 0,
    input: toNullableNumber(value.input) ?? void 0,
    output: toNullableNumber(value.output) ?? void 0,
    reasoning: toNullableNumber(value.reasoning) ?? void 0,
    cache: cache ? {
      read: toNullableNumber(cache.read) ?? void 0,
      write: toNullableNumber(cache.write) ?? void 0
    } : void 0
  };
}
function toStringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function toNullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function toFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function getOptionalObject(value) {
  return isJsonObject(value) ? value : null;
}
function isJsonObject(value) {
  return typeof value === "object" && value !== null;
}

// src/domain/row-state.ts
var ROW_ORDER = ["minimax", "opencode-go", "chatgpt-plus"];
function createEmptyRowState(bucket) {
  return {
    bucket,
    tokens: 0,
    cost: 0,
    remaining: null,
    percentage: null
  };
}

// src/state/kv-ledger.ts
var KV_NAMESPACE_PREFIX = "token-spend-bar:v1";
var LEDGER_SCHEMA_VERSION = 1;
var MAX_PROCESSED_FINGERPRINTS = 1e4;
var SCHEMA_VERSION_KEY = `${KV_NAMESPACE_PREFIX}:schema:version`;
var ACTIVE_MONTH_KEY = `${KV_NAMESPACE_PREFIX}:meta:currentMonth`;
var MISSING = /* @__PURE__ */ Symbol("missing");
function getCurrentMonthKey(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function buildLedgerKey(month, type, id) {
  return `${KV_NAMESPACE_PREFIX}:${month}:${type}:${id}`;
}
function createLedger(kv) {
  const loaded = loadLedgerState(kv);
  let state = loaded.state;
  let rebuildRequired = loaded.shouldRebuild;
  return {
    isRecordProcessed(fingerprint) {
      return state.processedFingerprints.has(fingerprint);
    },
    markRecordProcessed(fingerprint) {
      if (state.processedFingerprints.size >= MAX_PROCESSED_FINGERPRINTS) {
        const oldest = state.processedFingerprints.values().next().value;
        if (oldest !== void 0) {
          state.processedFingerprints.delete(oldest);
        }
      }
      state.processedFingerprints.add(fingerprint);
    },
    updateAggregate(provider, tokens, cost) {
      const existing = state.aggregates.find((aggregate) => aggregate.provider === provider);
      if (!existing) {
        state.aggregates.push({
          month: state.currentMonth,
          provider,
          tokens,
          cost
        });
        return;
      }
      existing.tokens += tokens;
      existing.cost = existing.cost === null || cost === null ? null : existing.cost + cost;
    },
    getAggregates() {
      return state.aggregates.map((aggregate) => ({ ...aggregate }));
    },
    shouldRebuild() {
      return rebuildRequired;
    },
    triggerRebuild() {
      state = createEmptyLedgerState(state.currentMonth);
      rebuildRequired = true;
    },
    save() {
      saveLedgerState(kv, state);
      rebuildRequired = false;
    }
  };
}
function loadLedgerState(kv) {
  const currentMonth = getCurrentMonthKey();
  const schemaVersion = kv.get(SCHEMA_VERSION_KEY, MISSING);
  const activeMonth = kv.get(ACTIVE_MONTH_KEY, MISSING);
  const kvIsEmpty = schemaVersion === MISSING && activeMonth === MISSING;
  if (kvIsEmpty) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  if (schemaVersion !== LEDGER_SCHEMA_VERSION) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  if (activeMonth !== currentMonth) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  try {
    const aggregateProviders = readStringArray(
      kv.get(buildLedgerKey(currentMonth, "meta", "aggregateProviders"), [])
    );
    const processedFingerprints = readStringArray(
      kv.get(buildLedgerKey(currentMonth, "meta", "processedFingerprints"), [])
    );
    const aggregates = aggregateProviders.map((provider) => {
      const aggregate = kv.get(buildLedgerKey(currentMonth, "aggregate", provider), null);
      return validateAggregate(aggregate, currentMonth);
    });
    return {
      state: {
        schemaVersion: LEDGER_SCHEMA_VERSION,
        currentMonth,
        aggregates,
        processedFingerprints: new Set(processedFingerprints)
      },
      shouldRebuild: false
    };
  } catch (error) {
    console.warn("[token-spend-bar] Corrupt KV ledger detected, rebuilding state.", error);
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
}
function saveLedgerState(kv, state) {
  kv.set(SCHEMA_VERSION_KEY, state.schemaVersion);
  kv.set(ACTIVE_MONTH_KEY, state.currentMonth);
  kv.set(buildLedgerKey(state.currentMonth, "meta", "lastRebuild"), Date.now());
  const aggregateProviders = state.aggregates.map((aggregate) => aggregate.provider);
  kv.set(buildLedgerKey(state.currentMonth, "meta", "aggregateProviders"), aggregateProviders);
  for (const aggregate of state.aggregates) {
    kv.set(buildLedgerKey(state.currentMonth, "aggregate", aggregate.provider), aggregate);
  }
  const processedFingerprints = [...state.processedFingerprints];
  kv.set(
    buildLedgerKey(state.currentMonth, "meta", "processedFingerprints"),
    processedFingerprints
  );
  for (const fingerprint of processedFingerprints) {
    kv.set(buildLedgerKey(state.currentMonth, "processed", fingerprint), true);
  }
}
function createEmptyLedgerState(currentMonth) {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    currentMonth,
    aggregates: [],
    processedFingerprints: /* @__PURE__ */ new Set()
  };
}
function readStringArray(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Expected string array in KV ledger metadata.");
  }
  return value;
}
function validateAggregate(value, currentMonth) {
  if (!isRecord(value)) {
    throw new Error("Aggregate entry must be an object.");
  }
  const { month, provider, tokens, cost } = value;
  if (month !== currentMonth) {
    throw new Error("Aggregate month mismatch.");
  }
  if (!isProviderBucket(provider)) {
    throw new Error("Aggregate provider is invalid.");
  }
  if (typeof tokens !== "number" || Number.isNaN(tokens)) {
    throw new Error("Aggregate token count is invalid.");
  }
  if (cost !== null && (typeof cost !== "number" || Number.isNaN(cost))) {
    throw new Error("Aggregate cost is invalid.");
  }
  return { month, provider, tokens, cost };
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

// src/services/usage-aggregator.ts
var UsageAggregator = class {
  constructor(ledger, config = { currency: "$" }) {
    this.ledger = ledger;
    this.config = config;
  }
  ledger;
  config;
  async initialize() {
    if (!this.ledger.shouldRebuild()) {
      return;
    }
    let records = [];
    try {
      records = scanCurrentMonthHistory();
    } catch (error) {
      console.warn(
        "[token-spend-bar] History bootstrap skipped; continuing with live session updates.",
        error
      );
    }
    for (const record of records) {
      if (!isProviderBucket(record.provider)) {
        continue;
      }
      this.ledger.updateAggregate(record.provider, record.tokens, record.cost);
      this.ledger.markRecordProcessed(this.createFingerprint(record));
    }
    this.ledger.save();
  }
  processRecord(record) {
    if (!isProviderBucket(record.provider)) {
      return;
    }
    const fingerprint = this.createFingerprint(record);
    if (this.ledger.isRecordProcessed(fingerprint)) {
      return;
    }
    this.ledger.updateAggregate(record.provider, record.tokens, record.cost);
    this.ledger.markRecordProcessed(fingerprint);
    this.ledger.save();
  }
  getViewModel() {
    const aggregates = this.ledger.getAggregates();
    return {
      month: getCurrentMonthKey(),
      rows: this.buildRows(aggregates)
    };
  }
  buildRows(aggregates) {
    const aggregateMap = /* @__PURE__ */ new Map();
    for (const aggregate of aggregates) {
      if (isProviderBucket(aggregate.provider)) {
        aggregateMap.set(aggregate.provider, aggregate);
      }
    }
    return ROW_ORDER.map((bucket) => {
      const aggregate = aggregateMap.get(bucket);
      const emptyState = createEmptyRowState(bucket);
      const state = aggregate ? { ...emptyState, tokens: aggregate.tokens, cost: aggregate.cost } : emptyState;
      const hasRealCost = aggregate !== void 0 && aggregate.cost !== null;
      const showCost = shouldShowCost(bucket) && hasRealCost;
      const limit = state.remaining !== null ? state.remaining + state.tokens : null;
      const displayValue = getDisplayValue(state.remaining, state.tokens, limit);
      const spentPercentage = calculateSpentPercentage(state.tokens, limit);
      return {
        bucket,
        label: getProviderDisplayLabel(bucket),
        tokens: state.tokens,
        tokensFormatted: formatTokens(state.tokens),
        cost: showCost ? state.cost : null,
        costFormatted: showCost ? formatCost(state.cost, this.config.currency) : null,
        showCost,
        remaining: state.remaining,
        remainingFormatted: formatTokens(displayValue),
        percentage: spentPercentage
      };
    });
  }
  createFingerprint(record) {
    return `${record.provider}:${record.timestamp}:${record.tokens}:${record.cost ?? "null"}`;
  }
};
function createAggregator(kv) {
  const ledger = createLedger(kv);
  return new UsageAggregator(ledger);
}

// src/plugin.tsx
var TokenSpendBarPlugin = async (api) => {
  let aggregator = null;
  let initError = null;
  try {
    aggregator = createAggregator(api.kv);
    await aggregator.initialize();
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error("[TokenSpendBar] Initialization failed:", initError.message);
  }
  const handleMessageUpdated = (event) => {
    if (!aggregator) return;
    const record = toUsageRecord(event.properties.info);
    if (!record) {
      return;
    }
    aggregator.processRecord(record);
    api.renderer.requestRender();
  };
  const unsubscribeMessageUpdated = api.event.on("message.updated", handleMessageUpdated);
  api.lifecycle.onDispose(() => {
    unsubscribeMessageUpdated();
  });
  const slotPlugin = {
    order: 150,
    slots: {
      sidebar_content: (_ctx, _props) => {
        if (initError) {
          return ErrorFallback({ error: initError });
        }
        if (!aggregator) {
          return ErrorFallback({ error: new Error("Aggregator not initialized") });
        }
        const viewModel = aggregator.getViewModel();
        return SessionSpendWidget({ viewModel });
      }
    }
  };
  api.slots.register(slotPlugin);
};
function toUsageRecord(message) {
  if (!isCompletedAssistantMessage(message)) {
    return null;
  }
  const provider = normalizeProvider(message.providerID);
  if (provider === null) {
    return null;
  }
  const tokens = getTokenCount(message.tokens);
  return {
    provider,
    tokens,
    cost: Number.isFinite(message.cost) ? message.cost : null,
    timestamp: message.time.completed
  };
}
function isCompletedAssistantMessage(message) {
  return message.role === "assistant" && typeof message.time.completed === "number";
}

export {
  TokenSpendBarPlugin
};
