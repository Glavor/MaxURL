// @license http://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
// ==UserScript==
// @name              Max URL
// @description       Finds larger or original versions of images and videos for 8200+ websites, including a powerful media popup and download feature
// @description:zh-CN 在近万个网站上查找尺寸更大或原版的图像/视频，提供媒体文件小弹窗和下载功能
// @namespace         http://tampermonkey.net/
// @version           2023.3.0
// @author            Glavor
// @homepageURL       https://qsniyg.github.io/maxurl/options.html
// @icon              https://raw.githubusercontent.com/qsniyg/maxurl/b5c5488ec05e6e2398d4e0d6e32f1bbad115f6d2/resources/logo_256.png
// @match             *://*.sinaimg.cn/*
// @match             *://*.twitter.com/*
// @match             *://*.twimg.com/*
// @match             *://*.yande.re/*
// @match             *://*.redditstatic.com/*
// @match             *://*.reddituploads.com/*
// @match             *://*.redditmedia.com/*
// @match             *://*.redd.it/*
// @match             *://*.reddit.com/*
// @match             *://*.mingtuiw.com/*
// @match             *://*.pximg.net/*
// @match             *://*.pixiv.net/*
// @grant             GM.xmlHttpRequest
// @grant             GM_xmlhttpRequest
// @grant             GM.setValue
// @grant             GM_setValue
// @grant             GM.getValue
// @grant             GM_getValue
// @grant             GM_registerMenuCommand
// @grant             GM_unregisterMenuCommand
// @grant             GM_addValueChangeListener
// @grant             GM_download
// @grant             GM_openInTab
// @grant             GM.openInTab
// @grant             GM_notification
// @grant             GM.notification
// @grant             GM_setClipboard
// @grant             GM.setClipboard
// @connect           *
// @run-at            document-start
// @license           Apache-2.0
// @updateURL         https://raw.githubusercontent.com/Glavor/MaxURL/mini/userscript.user.js
// @downloadURL       https://raw.githubusercontent.com/Glavor/MaxURL/mini/userscript.user.js
// ==/UserScript==

var $$IMU_EXPORT$$;
(function() {
	var _nir_debug_ = false;
	if (_nir_debug_) {
		_nir_debug_ = {
			no_request: false,
			no_recurse: false,
			no_redirect: true,
			map: true,
			cache: true,
			bigimage_recursive: true,
			input: true,
			check_image_get: true,
			find_source: true
		};
		console.log("Loaded");
	}
	var nullfunc = function() { };
	var is_extension = false;
	var is_webextension = false;
	var is_extension_bg = false;
	var is_firefox_webextension = false;
	var extension_send_message = null;
	var extension_error_handler = function(context) { };
	var extension_options_page = null;
	var is_terminated = false;
	var is_extension_options_page = false;
	var is_options_page = false;
	var is_maxurl_website = false;
	var window_location = null;
	var options_page = "https://qsniyg.github.io/maxurl/options.html";
	var archive_options_page = "https://web.archive.org/web/20210328063940/https://qsniyg.github.io/maxurl/options.html";
	var preferred_options_page = options_page;
	var firefox_addon_page = "https://addons.mozilla.org/en-US/firefox/addon/image-max-url/";
	var userscript_update_url = "https://raw.githubusercontent.com/Glavor/MaxURL/mini/userscript.user.js";
	var greasyfork_update_url = userscript_update_url;
	var github_issues_page = "https://github.com/qsniyg/maxurl/issues";
	var imu_icon = "https://raw.githubusercontent.com/qsniyg/maxurl/b5c5488ec05e6e2398d4e0d6e32f1bbad115f6d2/resources/logo_256.png";
	var current_version = null;
	var imagetab_ok_override = false;
	var has_ffmpeg_lib = true;
	var require_rules_failed = false;
	var get_raw_window = function() {
		if (typeof (unsafeWindow) !== "undefined")
			return unsafeWindow || this.window || window;
		return this.window || window;
	};
	var get_window = function() {
		var raw_window = get_raw_window();
		if (raw_window.self)
			return raw_window.self;
		else
			return raw_window;
	};
	var termination_hooks = [];
	var is_suspended = function(full) {
		if (is_terminated || !settings.imu_enabled) {
			return true;
		}
		if (full && is_extension) {
			try {
				chrome.runtime.getURL("manifest.json");
			} catch (e) {
				set_terminated(true);
				return true;
			}
		}
		return false;
	};
	var set_terminated = function(terminated) {
		var was_terminated = is_terminated;
		is_terminated = terminated;
		if (terminated && !was_terminated) {
			array_foreach(termination_hooks, function(hook) {
				hook();
			});
		}
	};
	try {
		window_location = window.location.href;
		(function() {
			var our_url = window_location.replace(/^[a-z]+:\/\/web\.archive\.org\/+web\/+[0-9]+\/+(https?:\/\/)/, "$1");
			if (/^https?:\/\/qsniyg\.github\.io\/+maxurl\/+options\.html/.test(our_url) ||
				/^file:\/\/.*\/maxurl\/site\/options\.html/.test(window_location)) {
				is_options_page = true;
				is_maxurl_website = true;
			} else if (/^https?:\/\/qsniyg\.github\.io\/+maxurl\/+/.test(our_url) ||
				/^file:\/\/.*\/maxurl\/site\/(?:index|about|options)\.html/.test(window_location)) {
				is_maxurl_website = true;
			}
		})();
	} catch (e) {
	}
	var is_node = false;
	var is_node_main = false;
	if ((typeof module !== 'undefined' && module.exports) &&
		typeof window === 'undefined' && typeof document === 'undefined') {
		is_node = true;
		try {
			if (require.main === module)
				is_node_main = true;
		} catch (e) { }
	}
	var is_scripttag = false;
	if (typeof imu_variable !== 'undefined' && (typeof (GM_xmlhttpRequest) === 'undefined' &&
		typeof (GM) === 'undefined'))
		is_scripttag = true;
	var is_userscript = false;
	if (!is_node && !is_scripttag && !is_extension)
		is_userscript = true;
	var check_in_iframe = function() {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	};
	var is_in_iframe = check_in_iframe();
	var is_remote_possible = false;
	var is_interactive = (is_extension || is_userscript) && !is_extension_bg;
	var userscript_manager = "unknown";
	var userscript_manager_version = "";
	if (is_userscript) {
		var gm_info = void 0;
		if (typeof GM_info === "function") {
			gm_info = GM_info();
		} else if (typeof GM_info === "object") {
			gm_info = GM_info;
		}
		if (typeof gm_info === "object") {
			if (gm_info.scriptHandler) {
				userscript_manager = gm_info.scriptHandler;
			}
			if (gm_info.version) {
				userscript_manager_version = gm_info.version;
			}
		} else if (typeof GM_fetch === 'function' && gm_info === null) {
			userscript_manager = "FireMonkey";
			gm_info = { scriptHandler: userscript_manager };
		}
		if (_nir_debug_ && false) {
			console.log("GM_info", gm_info);
		}
		try {
			current_version = gm_info.script.version;
		} catch (e) {
			current_version = null;
		}
		;
	}
	var is_native = function(x) {
		var x_str = x.toString();
		if (x_str.length < 80 && /native code/.test(x_str)) {
			return true;
		} else {
			return false;
		}
	};
	var raw_console_log = console.log;
	var console_log = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) {
			args[_i] = arguments[_i];
		}
		if (settings && !settings.enable_console_logging)
			return;
		return raw_console_log.apply(this, arguments);
	};
	var console_error = console.error;
	var console_warn = console.warn;
	var console_trace = console.trace;
	if (!is_native(console_error)) {
		console_error = function() {
			var _args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				_args[_i] = arguments[_i];
			}
			var args = ["[ERROR]"];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			return console_log.apply(this, args);
		};
	}
	var nir_debug = function() {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) {
			args[_i] = arguments[_i];
		}
	};
	if (_nir_debug_) {
		nir_debug = function() {
			var _args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				_args[_i] = arguments[_i];
			}
			var channel = arguments[0];
			if (!_nir_debug_[channel])
				return;
			var args = [];
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			console_log.apply(this, args);
		};
	}
	var JSON_stringify;
	var JSON_parse = JSON.parse;
	var parse_int = function(x) {
		var asnumber = x - 0;
		var floor = asnumber | 0;
		var diff = floor - asnumber;
		if (diff < 0)
			diff = -diff;
		if (diff > 1) {
			var floored_string = (x + "").replace(/\..*/, "");
			return floored_string - 0;
		}
		return floor;
	};
	var base64_decode, base64_encode, is_array, array_indexof, string_indexof, 
	native_blob, native_URL, new_blob, our_EventTarget, our_addEventListener, our_removeEventListener, string_fromcharcode, string_charat, array_reduce, array_reduce_prototype, document_createElement;
	if (is_node) {
		base64_decode = function(a) {
			return Buffer.from(a, 'base64').toString('binary');
		};
		base64_encode = function(a) {
			return Buffer.from(a).toString('base64');
		};
	}
	var get_compat_functions = function() {
		var native_functions_to_get = [];
		var get_json_stringify = function() {
			try {
				JSON_stringify = JSON.stringify;
			} catch (e) {
				console_warn("Cannot use native JSON.stringify, using slow implementation instead", e);
				var is_json_undefined = function(x) {
					return x === void 0 || typeof x === "function";
				};
				JSON_stringify = function(x) {
					if (is_json_undefined(x))
						return void 0;
					if (typeof x === "string") {
						return '"' + x
							.replace(/\\/g, "\\\\")
							.replace(/"/g, '\\"') + '"';
					}
					if (x === null)
						return "null";
					if (typeof x === "number")
						return x + "";
					if (is_array(x)) {
						var els = [];
						for (var i = 0; i < x.length; i++) {
							var stringified = JSON_stringify(x[i]);
							if (stringified === void 0)
								stringified = "null";
							els.push(stringified);
						}
						return "[" + els.join(",") + "]";
					}
					if (typeof x === "object") {
						var els = [];
						for (var key in x) {
							var stringified = JSON_stringify(x[key]);
							if (stringified === void 0)
								continue;
							els.push('"' + key + '":' + JSON_stringify(x[key]));
						}
						return "{" + els.join(",") + "}";
					}
					return void 0;
				};
			}
		};
		get_json_stringify();
		var get_orig_eventtarget = function() {
			var EventTarget_addEventListener, EventTarget_removeEventListener;
			if (is_interactive) {
				our_EventTarget = EventTarget;
				EventTarget_addEventListener = our_EventTarget.prototype.addEventListener;
				EventTarget_removeEventListener = our_EventTarget.prototype.removeEventListener;
			}
			var eventhandler_map = null;
			var init_eventhandler_map = function() {
				if (!eventhandler_map)
					eventhandler_map = new_map();
			};
			our_addEventListener = function(element, event, handler, options) {
				if (element === window && element.unsafeWindow)
					element = element.unsafeWindow;
				var suspended_check = function() { return is_suspended(true); };
				if (event === "mousemove") {
					suspended_check = function() { return is_suspended(false); };
				}
				var real_handler = handler;
				handler = function(e) {
					if (suspended_check()) {
						if (is_terminated)
							our_removeEventListener(element, event, real_handler);
						return;
					}
					return real_handler(e);
				};
				var new_handler = function(e) {
					return handler(e);
				};
				init_eventhandler_map();
				map_set(eventhandler_map, real_handler, new_handler);
				EventTarget_addEventListener.call(element, event, new_handler, options);
			};
			our_removeEventListener = function(element, event, handler, options) {
				init_eventhandler_map();
				var new_handler = map_get(eventhandler_map, handler);
				if (!new_handler) {
					console_warn("Modified handler not found, defaulting to specified handler");
					new_handler = handler;
				} else {
					map_remove(eventhandler_map, new_handler);
				}
				EventTarget_removeEventListener.call(element, event, new_handler, options);
			};
		};
		get_orig_eventtarget();
		var get_orig_createelement = function() {
			var HTMLDocument_createElement;
			if (is_interactive || is_scripttag || typeof HTMLDocument === "function") {
				HTMLDocument_createElement = HTMLDocument.prototype.createElement;
			}
			document_createElement = function(element) {
				if (!HTMLDocument_createElement) {
					console_error("Unable to create element", element, ", HTMLDocument.prototype.createElement does not exist");
					return;
				}
				return HTMLDocument_createElement.call(document, element);
			};
		};
		get_orig_createelement();
		var sanity_test = function(orig, correct, check, native_func) {
			if (!orig)
				return correct;
			if (check) {
				try {
					if (check(orig))
						return orig;
				} catch (e) { }
				;
			}
			if (native_func) {
				native_functions_to_get.push(native_func);
			}
			return correct;
		};
		var get_is_array = function() {
			var is_array_orig = Array.isArray;
			var is_array_correct = function(x) {
				return x instanceof Array;
			};
			if (is_array_orig) {
				is_array = is_array_orig;
			} else {
				is_array = is_array_correct;
			}
		};
		get_is_array();
		var get_compat_string_fromcharcode = function() {
			var string_fromcharcode_orig = null;
			try {
				string_fromcharcode_orig = String.fromCharCode;
			} catch (e) { }
			var fromcharcode_check = function(func) {
				return func(50) === "2" && func(100) === "d" && func("50", "100") === "2d";
			};
			var fromcharcode_correct = function() {
				var unicode = "";
				for (var i = 0; i < arguments.length; i++) {
					unicode += "\\u" + ("0000" + parseInt(arguments[i]).toString(16)).slice(-4);
				}
				return JSON_parse('"' + unicode + '"');
			};
			string_fromcharcode = sanity_test(string_fromcharcode_orig, fromcharcode_correct, fromcharcode_check);
		};
		get_compat_string_fromcharcode();
		var get_compat_string_charat = function() {
			var string_prototype_charat = String.prototype.charAt;
			var string_charat_orig = function(string, x) {
				return string_prototype_charat.call(string, x);
			};
			var string_charat_correct = function(string, x) {
				var result = string[x];
				if (result === void 0)
					result = "";
				return result;
			};
			var string_charat_check = function(func) {
				var test_string = "abc";
				if (func(test_string, 0) === "a" &&
					func(test_string, 1) === "b" &&
					func(test_string, -1) === "" &&
					func(test_string, 3) === "") {
					return true;
				}
				return false;
			};
			string_charat = sanity_test(string_charat_orig, string_charat_correct, string_charat_check);
		};
		get_compat_string_charat();
		var get_compat_base64 = function() {
			if (is_node)
				return;
			var base64_decode_correct = function(s) {
				var e = {}, i, b = 0, c, x, l = 0, a, r = '', w = string_fromcharcode, L = s.length;
				var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
				for (i = 0; i < 64; i++) {
					e[string_charat(A, i)] = i;
				}
				for (x = 0; x < L; x++) {
					c = e[string_charat(s, x)];
					b = (b << 6) + c;
					l += 6;
					while (l >= 8) {
						((a = (b >>> (l -= 8)) & 0xff) || (x < (L - 2))) && (r += w(a));
					}
				}
				return r;
			};
			var base64_decode_test = function(func) {
				if (func("dGVzdA==") === "test") {
					return true;
				}
				return false;
			};
			base64_decode = sanity_test(atob, base64_decode_correct, base64_decode_test, "atob");
			var base64_encode_test = function(func) {
				if (func("test") === "dGVzdA==") {
					return true;
				}
				return false;
			};
			var fake_base64_encode = function(s) {
				console_warn("Using fake base64 encoder");
				return s;
			};
			base64_encode = sanity_test(btoa, fake_base64_encode, base64_encode_test, "btoa");
		};
		get_compat_base64();
		var get_compat_array_indexof = function() {
			var array_prototype_indexof = Array.prototype.indexOf;
			var array_indexof_orig = function(array, x) {
				return array_prototype_indexof.call(array, x);
			};
			var array_indexof_correct = function(array, x) {
				if (typeof array === "string") {
					array = Array.from(array);
				}
				for (var i = 0; i < array.length; i++) {
					if (array[i] === x) {
						return i;
					}
				}
				return -1;
			};
			var array_indexof_check = function(func) {
				var test_array = ["a", "b"];
				var test_string = "abc";
				if (func(test_array, "not here") === -1 &&
					func(test_array, "b") === 1 &&
					func(test_string, "n") === -1 &&
					func(test_string, "b") === 1 &&
					func(test_string, "bc") === -1) {
					return true;
				}
				return false;
			};
			array_indexof = sanity_test(array_indexof_orig, array_indexof_correct, array_indexof_check);
		};
		get_compat_array_indexof();
		var get_compat_array_reduce = function() {
			var array_prototype_reduce = Array.prototype.reduce;
			var array_reduce_orig = function(array, cb, initial) {
				if (typeof initial !== "undefined")
					return array_prototype_reduce.call(array, cb, initial);
				else
					return array_prototype_reduce.call(array, cb);
			};
			var array_reduce_correct = function(array, cb, initial) {
				var firstindex = 0;
				if (typeof initial === "undefined") {
					if (!array.length) {
						throw new TypeError("Reduce of empty array with no initial value");
					}
					initial = array[0];
					firstindex = 1;
				}
				var acc = initial;
				for (var i = firstindex; i < array.length; i++) {
					acc = cb(acc, array[i], i, array);
				}
				return acc;
			};
			var array_reduce_check = function(func) {
				try {
					func([]);
					return false;
				} catch (e) { }
				try {
					func([], function() { });
					return false;
				} catch (e) { }
				var reducer = function(acc, cur, i) { return acc.x + cur.x + i; };
				if (isNaN(func([{ x: 2 }, { x: 2 }, { x: 2 }], reducer)) &&
					func([{ x: 2 }, { x: 6 }], reducer) === 9 &&
					func([{ x: 2 }], reducer).x === 2 &&
					func([{ x: 2 }], reducer, { x: 6 }) === 8) {
					return true;
				}
				return false;
			};
			array_reduce = sanity_test(array_reduce_orig, array_reduce_correct, array_reduce_check);
			array_reduce_prototype = function(cb, initial) {
				return array_reduce(this, cb, initial);
			};
		};
		get_compat_array_reduce();
		var get_compat_string_indexof = function() {
			var string_prototype_indexof = String.prototype.indexOf;
			var string_indexof_orig = function(string, x) {
				return string_prototype_indexof.call(string, x);
			};
			var string_indexof_correct = function(string, x) {
				if (x.length === 0)
					return 0;
				var x_i = 0;
				for (var i = 0; i < string.length; i++) {
					if (string_charat(string, i) === string_charat(x, x_i)) {
						if (x_i + 1 === x.length) {
							return i - x_i;
						} else {
							x_i++;
						}
					} else {
						x_i = 0;
					}
				}
				return -1;
			};
			var string_indexof_check = function(func) {
				var test_string = "abc";
				if (func(test_string, "n") === -1 &&
					func(test_string, "b") === 1 &&
					func(test_string, "bc") === 1 &&
					func(test_string, "bcz") === -1 &&
					func(test_string, "") === 0) {
					return true;
				}
				return false;
			};
			string_indexof = sanity_test(string_indexof_orig, string_indexof_correct, string_indexof_check);
		};
		get_compat_string_indexof();
		var get_compat_url = function() {
			if (is_node)
				return;
			var native_url_check = function(URL) {
				if (typeof URL !== "function" || typeof URL.prototype !== "object")
					return false;
				if (!("searchParams" in URL.prototype))
					return false;
				if (is_interactive) {
					if (!("createObjectURL" in URL) || !("revokeObjectURL" in URL))
						return false;
				}
				return true;
			};
			var orig_URL = URL || webkitURL;
			native_URL = sanity_test(orig_URL, nullfunc, native_url_check, "URL");
		};
		get_compat_url();
		var get_compat_blob = function() {
			if (is_node)
				return;
			var native_blob_check = function(Blob) {
				if (typeof Blob !== "function" || typeof Blob.prototype !== "object")
					return false;
				if (false && Blob.name !== "Blob")
					return false;
				if ( /*!("arrayBuffer" in Blob.prototype) ||*/ // Not implemented in pale moon
				!("slice" in Blob.prototype) ||
					!("size" in Blob.prototype))
					return false;
				return true;
			};
			var fake_blob = function() {
				console_warn("This is a fake Blob object, you will almost certainly encounter problems.");
			};
			new_blob = function(data, cb, options) {
				cb(new native_blob([data], options));
			};
			native_blob = sanity_test(Blob, fake_blob, native_blob_check, "Blob");
			if (native_blob !== Blob) {
				if (typeof Response === "function") {
					new_blob = function(data, cb, options) {
						var response_opt = {};
						if (options && options.type) {
							response_opt.headers = {
								"Content-Type": options.type
							};
						}
						new Response(data, response_opt).blob().then(function(resp) {
							cb(resp);
						});
					};
				} else if (typeof File === "function") {
					new_blob = function(data, cb, options) {
						cb(new File([data], "", options));
					};
				}
			}
		};
		get_compat_blob();
		var native_functions = {};
		var get_native_functions = function(functions) {
			var iframe = document_createElement("iframe");
			iframe.srcdoc = ""; //"javascript:0"
			document.documentElement.appendChild(iframe);
			var frame_window = iframe.contentWindow;
			for (var i = 0; i < functions.length; i++) {
				var func = functions[i];
				native_functions[func] = frame_window[func];
			}
			iframe.parentElement.removeChild(iframe);
		};
		if (native_functions_to_get.length > 0) {
			try {
				get_native_functions(native_functions_to_get);
			} catch (e) {
				console_error(e);
			}
			if ("Blob" in native_functions) {
				native_blob = native_functions["Blob"];
			}
			if ("URL" in native_functions) {
				native_URL = native_functions["URL"];
			}
			if ("atob" in native_functions) {
				base64_decode = native_functions["atob"];
			}
			if ("btoa" in native_functions) {
				base64_encode = native_functions["btoa"];
			}
		}
	};
	get_compat_functions();
	var force_array = function(arrayornot) {
		if (!is_array(arrayornot)) {
			return [arrayornot];
		} else {
			return arrayornot;
		}
	};
	var array_extend = function(array, other) {
		other = force_array(other);
		[].push.apply(array, other);
	};
	var array_foreach = function(array, cb, do_shallow_copy) {
		if (do_shallow_copy) {
			var newarray = [];
			for (var i = 0; i < array.length; i++) {
				newarray.push(array[i]);
			}
			array = newarray;
		}
		for (var i = 0; i < array.length; i++) {
			if (cb(array[i], i) === false)
				return;
		}
	};
	var array_map = function(array, cb) {
		var out = [];
		for (var i = 0; i < array.length; i++) {
			out[i] = cb(array[i]);
		}
		return out;
	};
	var array_or_null = function(array) {
		if (!array || !array.length)
			return null;
		return array;
	};
	var array_upush = function(array, item) {
		if (array_indexof(array, item) < 0)
			array.push(item);
	};
	var string_replaceall = function(str, find, replace) {
		return str.split(find).join(replace);
	};
	var match_all = function(str, regex) {
		var global_regex = new RegExp(regex, "g");
		var matches = str.match(global_regex);
		if (!matches)
			return null;
		var result = [];
		array_foreach(matches, function(match) {
			result.push(match.match(regex));
		});
		return result;
	};
	var obj_foreach = function(obj, cb) {
		for (var key in obj) {
			if (cb(key, obj[key]) === false)
				return;
		}
	};
	var obj_extend = function(obj, otherobj) {
		for (var key in otherobj) {
			obj[key] = otherobj[key];
		}
		return obj;
	};
	var common_functions = {};
	common_functions["nullfunc"] = function() { };
	common_functions["nullobjfunc"] = function() {
		var x = {
			func: function() { }
		};
		return x;
	};
	common_functions["run_arrayd_string"] = function(str, options) {
		str = str.split("");
		options.cb(str);
		return str.join("");
	};
	common_functions["new_vm"] = function() {
		var vm_arch = [
			function(vm) {
				vm.stack.unshift(vm.data);
			},
			function(vm) {
				vm.stack.unshift(vm.arg);
			},
			function(vm) {
				for (var i = 0; i < vm.arg; i++) {
					vm.stack.shift();
				}
			},
			function(vm) {
				vm.stack.unshift(vm.stack[vm.arg]);
			},
			function(vm) {
				vm.stack[0].push(vm.stack[1]);
			},
			function(vm) {
				vm.stack[0].unshift(vm.stack[1]);
			},
			function(vm) {
				vm.stack[0].reverse();
			},
			function(vm) {
				var register = vm.stack[0][vm.stack[2]];
				vm.stack[0][vm.stack[2]] = vm.stack[0][vm.stack[1] % vm.stack[0].length];
				vm.stack[0][vm.stack[1] % vm.stack[0].length] = register;
			},
			function(vm) {
				vm.stack[0].splice(vm.stack[1], 1);
			},
			function(vm) {
				vm.stack[0].splice(0, vm.stack[1]);
			},
			function(vm) {
				vm.stack[0].splice(vm.stack[1], vm.stack[0].length);
			},
			function(vm) {
				vm.stack[0][vm.stack[1]] += vm.stack[2];
			},
			function(vm) {
				vm.stack[0][vm.stack[1]] *= vm.stack[2];
			},
			function(vm) {
				vm.stack[0][vm.stack[1]] *= -1;
			},
		];
		var _run_vm = function(ops, data) {
			var vm = {
				stack: [],
				data: data
			};
			for (var i = 0; i < ops.length; i += 2) {
				var inst = ops[i];
				var arg = ops[i + 1];
				vm.arg = arg;
				vm_arch[inst](vm);
			}
			return data;
		};
		var run_vm = function(ops, data) {
			if (typeof data === "string") {
				return common_functions["run_arrayd_string"](data, {
					cb: function(data) {
						return _run_vm(ops, data);
					}
				});
			} else {
				return _run_vm(ops, data);
			}
		};
		return {
			arch: vm_arch,
			op_start: 4,
			total_instrs: Object.keys(vm_arch).length,
			run: run_vm
		};
	};
	common_functions["create_vm_ops"] = function(instructions) {
		var ops = [];
		for (var i = 0; i < 3; i++) {
			ops.push(1, 0);
		}
		array_foreach(instructions, function(inst) {
			var opcode = inst[0];
			for (var i = 1; i < inst.length; i++) {
				ops.push(1, inst[i]);
			}
			var args_count = inst.length - 1;
			ops.push(
			0, null, 
			opcode, null, 
			2, 1 + args_count);
		});
		ops.push(2, 3);
		return ops;
	};
	var Math_floor, Math_round, Math_random, Math_max, Math_min, Math_abs, Math_pow;
	var get_compat_math = function() {
		if (is_node)
			return;
		try {
			Math_floor = Math.floor;
			Math_round = Math.round;
			Math_random = Math.random;
			Math_max = Math.max;
			Math_min = Math.min;
			Math_abs = Math.abs;
			Math_pow = Math.pow;
		} catch (e) {
			Math_floor = function(x) {
				return x | 0;
			};
			Math_round = function(x) {
				return Math_floor(x + 0.5);
			};
			var math_seed = Date.now();
			var math_vm = null;
			Math_random = function() {
				if (!math_vm) {
					math_vm = common_functions["new_vm"]();
				}
				if (math_vm) {
					var total_instrs = math_vm.total_instrs - math_vm.op_start;
					var bad_instrs = [8, 9, 10, 13];
					var instructions = [];
					var times = math_seed & 0xf;
					if (!times)
						times = 4;
					for (var i = 0; i < times; i++) {
						var instr = (((math_seed >> 4) & 0xf) + ((math_seed >> (i % 8)) & 0xf)) % total_instrs + math_vm.op_start;
						if (array_indexof(bad_instrs, instr) >= 0) {
							times++;
							continue;
						}
						instructions.push([
							instr,
							(math_seed & 0xff) + i,
							((math_seed & 0xf) + i) % 5
						]);
					}
					var ops = common_functions["create_vm_ops"](instructions);
					try {
						var new_math_seed = parseFloat(math_vm.run(ops, math_seed + ""));
						if (!isNaN(new_math_seed))
							math_seed += new_math_seed;
					} catch (e) {
					}
				}
				math_seed += Date.now();
				math_seed %= 1e8;
				return math_seed / 1e8;
			};
			Math_max = function() {
				var max = -Infinity;
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] > max)
						max = arguments[i];
				}
				return max;
			};
			Math_min = function() {
				var min = Infinity;
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] < min)
						min = arguments[i];
				}
				return min;
			};
			Math_abs = function(x) {
				if (x < 0)
					return -x;
				return x;
			};
			Math_pow = function(x, y) {
				for (var i = 1; i < y; i++) {
					x *= x;
				}
				return x;
			};
		}
	};
	get_compat_math();
	var get_random_text = function(length, num) {
		var text = "";
		while (text.length < length) {
			var newnum = Math_floor(Math_random() * 10e8);
			var newtext;
			if (!num) {
				newtext = newnum.toString(26);
			} else {
				newtext = newnum.toString(10);
			}
			text += newtext;
		}
		text = text.substr(0, length);
		return text;
	};
	var get_random_id = function() {
		return get_random_text(10) + Date.now();
	};
	var _version_compare_pad_0 = function(array, amount) {
		if (amount <= 0)
			return;
		for (var i = 0; i < amount; i++) {
			array.push("0");
		}
	};
	function version_compare(a, b) {
		if (typeof a !== "string" || typeof b !== "string")
			return null;
		var version_regex = /^[0-9]+(\.[0-9]+){0,}$/;
		if (!version_regex.test(a) ||
			!version_regex.test(b))
			return null;
		var a_split = a.split(".");
		var b_split = b.split(".");
		if (a_split.length !== b_split.length) {
			_version_compare_pad_0(a_split, b_split.length - a_split.length);
			_version_compare_pad_0(b_split, a_split.length - b_split.length);
		}
		for (var i = 0; i < a_split.length; i++) {
			var an = parse_int(a_split[i]);
			var bn = parse_int(b_split[i]);
			if (an < bn)
				return 1;
			if (an > bn)
				return -1;
		}
		return 0;
	}
	var get_options_page = function() {
		if (is_extension)
			return preferred_options_page;
		if (settings && settings.use_webarchive_for_lib) {
			return archive_options_page;
		} else {
			return preferred_options_page;
		}
	};
	var id_to_iframe = {};
	var get_frame_info = function() {
		return {
			id: current_frame_id,
			url: current_frame_url,
			size: [
				window.innerWidth,
				window.innerHeight
			]
		};
	};
	var find_iframe_for_info = function(info) {
		if (info.id in id_to_iframe)
			return id_to_iframe[info.id];
		var finish = function(iframe) {
			if (!iframe)
				return iframe;
			id_to_iframe[info.id] = iframe;
			return iframe;
		};
		var iframe_els = document.getElementsByTagName("iframe");
		var newiframes = [];
		for (var i = 0; i < iframe_els.length; i++) {
			if (iframe_els[i].src !== info.url)
				continue;
			newiframes.push(iframe_els[i]);
		}
		var ignored_src = false;
		if (newiframes.length === 0) {
			newiframes = [];
			ignored_src = true;
		} else if (newiframes.length <= 1) {
			return finish(newiframes[0]);
		}
		var iframes = newiframes;
		newiframes = [];
		for (var i = 0; i < iframes.length; i++) {
			if (iframes[i].scrollWidth !== info.size[0] ||
				iframes[i].scrollHeight !== info.size[1]) {
				continue;
			}
			newiframes.push(iframes[i]);
		}
		if (newiframes.length <= 1)
			return finish(newiframes[0]);
		return null;
	};
	var iframe_to_id = function(iframe) {
		for (var id in id_to_iframe) {
			if (id_to_iframe[id] === iframe)
				return id;
		}
		return null;
	};
	var id_to_iframe_window = function(id) {
		if (!(id in id_to_iframe))
			return null;
		if (id !== "top") {
			try {
				if (id_to_iframe[id].contentWindow)
					return id_to_iframe[id].contentWindow;
			} catch (e) {
				return false;
			}
		}
		return id_to_iframe[id];
	};
	var remote_send_message = null;
	var remote_send_reply = null;
	var remote_reply_ids = {};
	var current_frame_id = null;
	var current_frame_url = null;
	var raw_remote_send_message = null;
	var remote_send_message = common_functions["nullfunc"];
	var remote_send_reply = common_functions["nullfunc"];
	var imu_message_key = "__IMU_MESSAGE__";
	if (is_extension) {
		raw_remote_send_message = function(to, message) {
			extension_send_message(message);
		};
		is_remote_possible = true;
	} else if (is_interactive) {
		if (is_in_iframe && window.parent) {
			id_to_iframe["top"] = window.parent;
		}
		raw_remote_send_message = function(to, message) {
			if (!to && is_in_iframe)
				to = "top"; // fixme?
			var specified_window;
			if (to && to in id_to_iframe) {
				specified_window = id_to_iframe_window(to);
				if (!specified_window) {
					if (_nir_debug_) {
						console_warn("Unable to find window for", to, { is_in_iframe: is_in_iframe, id_to_iframe: id_to_iframe });
					}
					return;
				}
			}
			message.imu = true;
			var wrapped_message = {};
			wrapped_message[imu_message_key] = message;
			if (!specified_window) {
				for (var i = 0; i < window.frames.length; i++) {
					try {
						window.frames[i].postMessage(wrapped_message, "*");
					} catch (e) {
						if (_nir_debug_) {
							console_warn("Unable to send message to", window.frames[i], e);
						}
						continue;
					}
				}
			} else {
				specified_window.postMessage(wrapped_message, "*");
			}
		};
		is_remote_possible = true;
		if (window.location.hostname === "cafe.daum.net") {
			is_remote_possible = false;
		}
	}
	if (is_remote_possible) {
		current_frame_url = window_location;
		current_frame_id = get_random_id() + " " + current_frame_url;
		if (!is_in_iframe)
			current_frame_id = "top";
		remote_send_message = function(to, data, cb) {
			var id = void 0;
			if (cb) {
				id = get_random_id();
				remote_reply_ids[id] = cb;
			}
			var message = {
				type: "remote",
				data: data,
				to: to,
				from: current_frame_id,
				response_id: id
			};
			if (_nir_debug_) {
				console_log("remote_send_message", to, message);
			}
			raw_remote_send_message(to, message);
		};
		remote_send_reply = function(to, response_id, data) {
			raw_remote_send_message(to, {
				type: "remote_reply",
				data: data,
				response_id: response_id
			});
		};
	}
	var can_use_remote = function() {
		return is_remote_possible && settings.allow_remote;
	};
	var can_iframe_popout = function() {
		return can_use_remote() && settings.mouseover_use_remote;
	};
	var do_request_browser = function(request) {
		if (_nir_debug_) {
			console_log("do_request_browser", request);
		}
		var method = request.method || "GET";
		var xhr = new XMLHttpRequest();
		xhr.open(method, request.url, true);
		if (request.responseType)
			xhr.responseType = request.responseType;
		if (request.headers) {
			obj_foreach(request.headers, function(header_name, header_value) {
				try {
					xhr.setRequestHeader(header_name, header_value);
				} catch (e) { }
			});
		}
		var do_final = function(override, cb) {
			if (_nir_debug_) {
				console_log("do_request_browser's do_final", xhr, cb);
			}
			var resp = {
				readyState: xhr.readyState,
				finalUrl: xhr.responseURL,
				responseHeaders: xhr.getAllResponseHeaders(),
				responseType: xhr.responseType,
				status: xhr.status,
				statusText: xhr.statusText,
				timeout: xhr.timeout
			};
			resp.response = xhr.response;
			try {
				resp.responseText = xhr.responseText;
			} catch (e) { }
			cb(resp);
		};
		var add_handler = function(event, empty) {
			xhr[event] = function() {
				if (empty) {
					return request[event](null);
				}
				do_final({}, function(resp) {
					request[event](resp);
				});
			};
		};
		add_handler("onload");
		add_handler("onerror");
		add_handler("onprogress");
		add_handler("onabort", true);
		add_handler("ontimeout", true);
		try {
			xhr.send(request.data);
		} catch (e) {
			console_error(e);
			xhr.abort();
		}
		return {
			abort: function() {
				xhr.abort();
			}
		};
	};
	try {
		if (typeof XMLHttpRequest !== "function") {
			do_request_browser = null;
		}
	} catch (e) {
		do_request_browser = null;
	}
	var extension_requests = {};
	var do_request_raw = null;
	if (is_extension) {
		do_request_raw = function(data) {
			var reqid;
			var do_abort = false;
			extension_send_message({
				type: "request",
				data: data
			}, function(response) {
				if (response.type !== "id") {
					console_error("Internal error: Wrong response", response);
					return;
				}
				reqid = response.data;
				extension_requests[reqid] = {
					id: reqid,
					data: data
				};
				if (do_abort) {
					extension_send_message({
						type: "abort_request",
						data: reqid
					});
					return;
				}
			});
			return {
				abort: function() {
					if (reqid === void 0) {
						console_warn("abort() was called before the request was initialized");
						do_abort = true;
						return;
					}
					extension_send_message({
						type: "abort_request",
						data: reqid
					});
				}
			};
		};
		var bad_do_request_raw = function(data) {
			var req = null;
			var do_abort = false;
			extension_send_message({ type: "get_request_nonce" }, function(resp_data) {
				if (do_abort)
					return;
				var nonce = resp_data.data;
				data = deepcopy(data);
				if (!data.headers)
					data.headers = {};
				var new_headers = {};
				obj_foreach(data.headers, function(header_name, header_value) {
					if (header_value === null || header_value === "") {
						new_headers["X-IMU-" + nonce + "-D-" + header_name] = "true";
					} else {
						new_headers["X-IMU-" + nonce + "-H-" + header_name] = header_value;
					}
				});
				data.headers = new_headers;
				data.url = "https://" + (window.location.host || "google.com") + "/#IMU-" + nonce + "-" + encodeURIComponent(data.url);
				console_log(data);
				req = do_request_browser(data);
			});
			return {
				abort: function() {
					if (!req) {
						console_warn("abort() was called before the request was initialized");
						do_abort = true;
						return;
					}
					req.abort();
				}
			};
		};
	} else if (typeof (GM_xmlhttpRequest) !== "undefined") {
		if (userscript_manager === "Violentmonkey" && version_compare(userscript_manager_version, "2.12.7") <= 0) {
			do_request_raw = function(data) {
				var orig_cbs = {};
				var is_native = function(x) {
					var x_str = x.toString();
					if (x_str.length < 80 && string_indexof(x_str, "native code") > 0) {
						return true;
					} else {
						return false;
					}
				};
				var revert = [];
				if (Array.prototype.reduce !== array_reduce_prototype && !is_native(Array.prototype.reduce)) {
					var old_reduce = Array.prototype.reduce;
					Array.prototype.reduce = array_reduce_prototype;
					revert.push(function() {
						Array.prototype.reduce = old_reduce;
					});
				}
				var reverted = false;
				var onfinal = function(x, args) {
					if (!reverted) {
						array_foreach(revert, function(revert_func) {
							revert_func();
						});
						reverted = true;
					}
					return orig_cbs[x].apply(this, args);
				};
				if (revert.length) {
					var replace = ["onload", "onabort", "onerror", "ontimeout"];
					array_foreach(replace, function(x) {
						if (x in data) {
							orig_cbs[x] = data[x];
							data[x] = function() {
								return onfinal(x, arguments);
							};
						}
					});
				}
				return GM_xmlhttpRequest(data);
			};
		} else {
			do_request_raw = GM_xmlhttpRequest;
		}
	} else if (typeof (GM) !== "undefined" && typeof (GM.xmlHttpRequest) !== "undefined") {
		do_request_raw = GM.xmlHttpRequest;
	}
	var register_menucommand = common_functions["nullfunc"];
	var unregister_menucommand = common_functions["nullfunc"];
	var num_menucommands = 0;
	if (is_userscript) {
		if (typeof (GM_registerMenuCommand) !== "undefined") {
			register_menucommand = function(name, func) {
				num_menucommands++;
				if (typeof func === "string") {
					var dest = func;
					func = function() {
						if (is_in_iframe)
							return;
						open_in_tab(dest);
					};
				}
				var caption = "[" + num_menucommands + "] " + name;
				var id = GM_registerMenuCommand(caption, func);
				if (id === void 0 || id === null)
					id = caption;
				return id;
			};
		}
		if (typeof (GM_unregisterMenuCommand) !== "undefined") {
			unregister_menucommand = function(id) {
				num_menucommands--;
				return GM_unregisterMenuCommand(id);
			};
		}
	}
	var open_in_tab = common_functions["nullfunc"];
	if (is_userscript) {
		if (typeof (GM_openInTab) !== "undefined") {
			open_in_tab = GM_openInTab;
		} else if (typeof (GM) !== "undefined" && typeof (GM.openInTab) !== "undefined") {
			open_in_tab = GM.openInTab;
		}
		if (open_in_tab !== common_functions["nullfunc"]) {
			register_menucommand("Options", get_options_page());
		}
	}
	var open_in_tab_imu = function(imu, bg, cb) {
		if (is_extension) {
			extension_send_message({
				type: "newtab",
				data: {
					imu: imu,
					background: bg
				}
			}, cb);
		} else if (is_userscript && open_in_tab) {
			open_in_tab(imu.url, bg);
			if (cb) {
				cb();
			}
		}
	};
	var check_tracking_blocked = function(result) {
		if (!result || result.status === 0 || result.status === null) {
			if (result && result.finalUrl && /^file:\/\//.test(result.finalUrl))
				return false;
			return true;
		}
		return false;
	};
	var do_request = null;
	if (do_request_raw) {
		do_request = function(data) {
			if (_nir_debug_) {
				console_log("do_request", deepcopy(data));
			}
			if (!("withCredentials" in data)) {
				data.withCredentials = true;
			}
			if (!("headers" in data)) {
				data.headers = {};
			}
			if (data.imu_mode) {
				var headers_to_set = {};
				if (data.imu_mode === "document" || data.imu_mode === "iframe") {
					headers_to_set["accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9";
					headers_to_set["Sec-Fetch-Dest"] = data.imu_mode === "document" ? "document" : "iframe";
					headers_to_set["Sec-Fetch-Mode"] = "navigate";
					headers_to_set["Sec-Fetch-Site"] = data.imu_mode === "document" ? "none" : "cross-site";
					headers_to_set["Sec-Fetch-User"] = "?1";
				} else if (data.imu_mode === "xhr") {
					headers_to_set["accept"] = "*/*";
					headers_to_set["Sec-Fetch-Dest"] = "empty";
					headers_to_set["Sec-Fetch-Mode"] = "cors";
					headers_to_set["Sec-Fetch-Site"] = "same-origin";
					headers_to_set["origin"] = data.url.replace(/^([a-z]+:\/\/[^/]+)(?:\/+.*)?$/, "$1");
				} else if (data.imu_mode === "image") {
					headers_to_set["accept"] = "image/webp,image/apng,image/*,*/*;q=0.8";
					headers_to_set["Sec-Fetch-Dest"] = "image";
					headers_to_set["Sec-Fetch-Mode"] = "no-cors";
					headers_to_set["Sec-Fetch-Site"] = "same-site";
				} else if (data.imu_mode === "video") {
					headers_to_set["accept"] = "*/*";
					headers_to_set["Sec-Fetch-Dest"] = "video";
					headers_to_set["Sec-Fetch-Mode"] = "no-cors";
					headers_to_set["Sec-Fetch-Site"] = "same-site";
				}
				delete data.imu_mode;
				for (var header in headers_to_set) {
					if (headerobj_get(data.headers, header) === void 0) {
						headerobj_set(data.headers, header, headers_to_set[header]);
					}
				}
			}
			if (data.imu_multipart) {
				var boundary = "----WebKitFormBoundary" + get_random_text(16);
				var postdata = "";
				for (var key in data.imu_multipart) {
					var value = data.imu_multipart[key];
					postdata += "--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + key + "\"\r\n\r\n";
					postdata += value + "\r\n";
				}
				postdata += "--" + boundary + "--\r\n";
				headerobj_set(data.headers, "Content-Type", "multipart/form-data; boundary=" + boundary);
				data.data = postdata;
				delete data.imu_multipart;
			}
			var orig_data = deepcopy(data);
			if (typeof data.url === "string")
				data.url = data.url.replace(/#.*/, "");
			if (!data.onerror)
				data.onerror = data.onload;
			if (!data.ontimeout)
				data.ontimeout = data.onerror;
			var raw_request_do = do_request_raw;
			if (is_userscript && settings.allow_browser_request) {
				if (userscript_manager === "Falkon GreaseMonkey" ||
					(userscript_manager === "USI" && data.need_blob_response)) {
					raw_request_do = do_request_browser;
					delete data.trackingprotection_failsafe;
				}
			}
			if (data.retry_503) {
				if (data.retry_503 === true || typeof data.retry_503 !== "number")
					data.retry_503 = parse_int(settings.retry_503_times);
				if (data.retry_503 > 0) {
					var real_onload_503 = data.onload;
					var real_onerror_503 = data.onerror;
					var finalcb_503 = function(resp, iserror) {
						if (_nir_debug_) {
							console_log("do_request's finalcb_503:", resp, iserror, deepcopy(data));
						}
						if (resp.status === 503) {
							console_warn("Received status 503, retrying request", resp, orig_data);
							orig_data.retry_503 = data.retry_503 - 1;
							setTimeout(function() {
								do_request(orig_data);
							}, parse_int(settings.retry_503_ms) || 1);
						} else {
							if (iserror) {
								real_onerror_503(resp);
							} else {
								real_onload_503(resp);
							}
						}
					};
					data.onload = function(resp) {
						finalcb_503(resp, false);
					};
					data.onerror = function(resp) {
						finalcb_503(resp, true);
					};
				}
			}
			if (data.trackingprotection_failsafe && settings.allow_browser_request && do_request_browser) {
				var real_onload = data.onload;
				var real_onerror = data.onerror;
				var finalcb = function(resp, iserror) {
					if (_nir_debug_) {
						console_log("do_request's finalcb:", resp, iserror);
					}
					if (check_tracking_blocked(resp)) {
						data.onload = null;
						data.onerror = null;
						var newdata = shallowcopy(data);
						newdata.onload = real_onload;
						newdata.onerror = real_onerror;
						if (newdata.imu_responseType === "blob") {
							newdata.responseType = "blob";
						}
						return do_request_browser(newdata);
					} else {
						if (iserror) {
							real_onerror(resp);
						} else {
							real_onload(resp);
						}
					}
				};
				data.onload = function(resp) {
					finalcb(resp, false);
				};
				data.onerror = function(resp) {
					finalcb(resp, true);
				};
			}
			if (data.responseType === "blob" && !settings.use_blob_over_arraybuffer) {
				(function(real_onload) {
					data.onload = function(resp) {
						var newresp = resp;
						var final = function() {
							if (_nir_debug_) {
								console_log("do_request's arraybuffer->blob:", deepcopy(resp), newresp);
							}
							real_onload(newresp);
						};
						if (resp.response) {
							var mime = null;
							if (is_extension && "_responseEncoded" in resp && resp._responseEncoded.type) {
								mime = resp._responseEncoded.type;
							} else if (resp.responseHeaders) {
								var parsed_headers = headers_list_to_dict(parse_headers(resp.responseHeaders));
								if (parsed_headers["content-type"]) {
									mime = parsed_headers["content-type"];
								}
							}
							newresp = shallowcopy(resp);
							var blob_options = void 0;
							if (mime) {
								blob_options = { type: mime };
							}
							new_blob(resp.response, function(blob) {
								newresp.response = blob;
								final();
							}, blob_options);
						} else {
							final();
						}
					};
				})(data.onload);
				data.responseType = "arraybuffer";
				data.imu_responseType = "blob";
			}
			if (_nir_debug_) {
				console_log("do_request (modified data):", deepcopy(data));
			}
			return raw_request_do(data);
		};
	} else if (is_interactive) {
		console.warn("Unable to initialize do_request, most functions will likely fail");
	}
	var fixup_filename = function(filename) {
		var special_regex = /["<>/:?\\*|\^]/g;
		if (settings.filename_replace_special_underscores)
			return filename.replace(special_regex, "_");
		return filename;
	};
	var do_browser_download = function(imu, filename, cb) {
		if (_nir_debug_) {
			console_log("do_browser_download", imu, filename, cb);
		}
		var a = document_createElement("a");
		a.href = imu.url;
		if (filename && filename.length > 0) {
			a.setAttribute("download", fixup_filename(filename));
		} else {
			var attr = document.createAttribute("download");
			a.setAttributeNode(attr);
		}
		a.style.display = "none";
		a.onclick = function(e) {
			e.stopPropagation();
			e.stopImmediatePropagation();
			return true;
		};
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
		}, 500);
		if (cb)
			cb();
	};
	var do_download = function(imu, filename, size, cb) {
		if (true || _nir_debug_) {
			console_log("do_download", imu, filename, size, cb);
		}
		if (false) {
			request_chunked(imu, {
				onload: function(data) {
					console_log("finished", data);
					var blob = new native_blob([data.data], {
						type: data.mime || void 0
					});
					var objurl = create_objecturl(blob);
					do_browser_download({
						url: objurl,
					}, filename, cb);
					setTimeout(function() {
						revoke_objecturl(objurl);
					}, 500);
				},
				onprogress: function(progobj) {
					console_log(progobj.percent, progobj);
				}
			});
			return;
		}
		var use_gm_download = is_userscript && typeof GM_download !== "undefined" && settings.enable_gm_download;
		var gm_download_max = parseFloat(settings.gm_download_max) || 0;
		if (use_gm_download && size && gm_download_max) {
			if ((gm_download_max * 1024 * 1024) < size) {
				use_gm_download = false;
			}
		}
		var is_data = false;
		if (imu && imu.url) {
			is_data = /^data:/.test(imu.url);
		}
		if (is_data) {
			return do_browser_download(imu, filename, cb);
		}
		if (is_extension) {
			extension_send_message({
				type: "download",
				data: {
					imu: imu,
					filename: fixup_filename(filename),
					force_saveas: !!settings.enable_webextension_download
				}
			}, function() {
				if (cb)
					cb();
			});
		} else if (use_gm_download) {
			var headers;
			if (imu.headers)
				headers = headers_dict_to_list(imu.headers);
			var download_obj = {
				url: imu.url,
				headers: headers,
				saveAs: true,
				onerror: function(error) {
					if (error && error.error && error.error !== "not_succeeded") {
						do_browser_download(imu, filename, cb);
					}
				}
			};
			if (filename) {
				download_obj["name"] = fixup_filename(filename);
			} else {
				download_obj["name"] = "download"; // it can't be blank
			}
			if (_nir_debug_) {
				console_log("GM_download", deepcopy(download_obj));
			}
			GM_download(download_obj);
		} else {
			do_browser_download(imu, filename, cb);
		}
	};
	var do_blob_download = function(blob, filename, cb) {
		var objurl = create_objecturl(blob);
		do_browser_download({
			url: objurl,
		}, filename);
		setTimeout(function() {
			revoke_objecturl(objurl);
			if (cb)
				cb();
		}, 500);
	};
	var multiqueue = function(options, cb) {
		var running = false;
		var currently_running = 0;
		var run_single = function() {
			if (!options.queue.length) {
				if (currently_running <= 0) {
					return cb();
				}
				return;
			}
			var item = options.queue.shift();
			currently_running++;
			options.runner(item, function() {
				currently_running--;
				run_single();
			});
		};
		var run = function() {
			if (running)
				return;
			running = true;
			for (var i = options.concurrency; i > 0; i--) {
				run_single();
			}
		};
		return {
			add: function(x) {
				options.queue.push(x);
			},
			start: run
		};
	};
	var ImpreciseProgress = function(options) {
		this.elements_num = options.elements_num || 0;
		this.total_size = options.total_size || 0;
		this.known_elements = {};
		this.finished = false;
		var last_percent = 0;
		this.calc_completion = function() {
			var known_total = 0;
			var known_num = 0;
			var known_progress = 0;
			var approx = [];
			obj_foreach(this.known_elements, function(id, obj) {
				if (!obj.size && obj.progress_ratio) {
					approx.push(obj);
					return;
				}
				known_total += obj.size;
				known_progress += obj.progress;
				known_num++;
			});
			var total = this.total_size;
			var total_accurate = true;
			if (approx.length) {
				total_accurate = false;
				var average_length = 1;
				if (known_num) {
					average_length = known_total / known_num;
				}
				array_foreach(approx, function(obj) {
					known_total += average_length;
					known_progress += obj.progress_ratio * average_length;
					known_num++;
				});
			}
			if (!total) {
				total = known_total;
				var unknown_count = this.elements_num - known_num;
				if (unknown_count > 0 && known_num > 0) {
					total += (known_total / known_num) * unknown_count;
					total_accurate = false;
				}
			}
			var retobj = {
				percent: known_progress / total,
				total: total,
				total_accurate: total_accurate,
				loaded: known_progress
			};
			if (this.finished) {
				retobj.percent = 1;
				retobj.loaded = retobj.total;
			}
			return retobj;
		};
		this._do_cb = function() {
			var completion = this.calc_completion();
			if (completion.percent === last_percent)
				return;
			last_percent = completion.percent;
			options.cb(completion);
		};
		this.update = function(id, progress, size) {
			if (!(id in this.known_elements)) {
				this.known_elements[id] = {
					progress: 0,
					size: 0
				};
			}
			if (size || !progress) {
				this.known_elements[id].progress = progress;
				this.known_elements[id].size = size;
			} else if (this.known_elements[id].size) {
				this.known_elements[id].progress = progress * this.known_elements[id].size;
			} else {
				this.known_elements[id].progress_ratio = progress;
			}
			this._do_cb();
		};
		this.update_progobj = function(id, progobj) {
			this.update(id, progobj.loaded, progobj.total);
		};
		this.finish_id = function(id) {
			this.update(id, 1);
		};
		this.finish = function() {
			this.finished = true;
			this._do_cb();
		};
	};
	var request_chunked = function(xhrobj, options) {
		if (!xhrobj.headers) {
			xhrobj.headers = {};
		}
		xhrobj.responseType = "arraybuffer";
		var do_progress = !!options.onprogress;
		var get_contentrange_length = function(headers) {
			if (!("content-range" in headers)) {
				return null;
			} else {
				var range = headers["content-range"].split("/");
				return parse_int(range[1]);
			}
		};
		var download_chunk = function(start, end, cb, progresscb) {
			var ourobj = deepcopy(xhrobj);
			ourobj.method = "GET";
			var range_value = "bytes=" + start + "-";
			if (end)
				range_value += (end - 1);
			var id = start;
			headerobj_set(ourobj.headers, "Range", range_value);
			if (progresscb) {
				ourobj.onprogress = function(resp) {
					if (resp.loaded && resp.total) {
						var headers = headers_list_to_dict(parse_headers(resp.responseHeaders));
						var contentlength = get_contentrange_length(headers);
						return progresscb(id, resp.loaded, resp.total, contentlength);
					}
				};
				ourobj.onload = function(resp) {
					var length;
					if (end)
						length = end - start;
					if (resp.response)
						length = resp.response.byteLength; // probably the only one that's actually needed?
					if (!length) {
						var headers = headers_list_to_dict(parse_headers(resp.responseHeaders));
						if ("content-length" in headers) {
							length = parse_int(headers["content-length"]);
						}
					}
					progresscb(id, length, length);
					cb(resp);
				};
			} else {
				ourobj.onload = cb;
			}
			do_request(ourobj);
		};
		var ip = null, chunk_progress = null;
		if (do_progress) {
			ip = new ImpreciseProgress({
				cb: options.onprogress,
				elements_num: 1
			});
			chunk_progress = function(id, progress, total, full_total) {
				if (!ip.total_size && full_total)
					ip.total_size = full_total;
				ip.update(id, progress, total);
			};
		}
		var data = null;
		var mime = null;
		var final_cb = function(resp) {
			if (do_progress)
				ip.finish();
			options.onload({
				data: data,
				mime: mime
			}, resp);
		};
		var chunk_size = options.chunk_size;
		if (!chunk_size && chunk_size !== 0)
			chunk_size = 512 * 1024;
		download_chunk(0, chunk_size, function(resp) {
			var headers = headers_list_to_dict(parse_headers(resp.responseHeaders));
			var content_length = 0;
			if (resp.status === 200) {
				content_length = resp.response.byteLength;
			} else if (resp.status === 206) {
				content_length = get_contentrange_length(headers);
				if (content_length === null) {
					console_error("Unable to find length through content-range");
					return options.onload(null, resp);
				}
			} else {
				console_error("Bad status", resp.status, resp);
				return options.onload(null, resp);
			}
			data = new Uint8Array(content_length);
			data.set(new Uint8Array(resp.response), 0);
			if (resp.response.byteLength >= content_length) {
				return final_cb(resp);
			}
			if ("content-type" in headers) {
				mime = headers["content-type"];
			}
			if (do_progress)
				ip.total_size = content_length;
			var queue = [];
			for (var start = resp.response.byteLength;; start += chunk_size) {
				var val = [start];
				var do_break = true;
				if (content_length - start > chunk_size) {
					val.push(start + chunk_size);
					do_break = false;
				}
				queue.push(val);
				if (do_break)
					break;
			}
			if (do_progress)
				ip.elements_num += queue.length;
			var mqueue = multiqueue({
				concurrency: options.chunks || 5,
				queue: queue,
				runner: function(item, cb) {
					download_chunk(item[0], item[1], function(resp) {
						data.set(new Uint8Array(resp.response), item[0]);
						cb();
					}, chunk_progress);
				}
			}, function() {
				final_cb(resp);
			});
			mqueue.start();
		}, chunk_progress);
	};
	var native_clipboard_write = null;
	var browser_clipboard_write = null;
	var browser_clipboard_api_write = null;
	if (is_interactive) {
		browser_clipboard_write = function(data, cb) {
			if (_nir_debug_)
				console_log("clipboard_write execcommand", data);
			var input = document.createElement("textarea");
			input.style.height = "1px";
			input.style.width = "1px";
			input.style.resize = "none";
			input.style.appearance = "none";
			input.style.border = "0";
			input.style.margin = "0";
			input.style.padding = "0";
			input.style.display = "inline";
			input.style.cursor = "default";
			document.body.appendChild(input);
			input.innerText = data.text;
			input.focus();
			input.select();
			setTimeout(function() {
				document.body.removeChild(input);
			}, 100);
			cb(!!document.execCommand("copy"));
		};
		if (navigator.clipboard && (navigator.clipboard.write || navigator.clipboard.writeText)) {
			browser_clipboard_api_write = function(data, cb) {
				if (_nir_debug_)
					console_log("clipboard_write clipboard_api", data);
				var promise;
				var can_use_writetext = data.mime === "text/plain" && navigator.clipboard.writeText;
				if (!can_use_writetext && navigator.clipboard.write && typeof ClipboardItem === "function") {
					var mimes = {};
					mimes[data.mime] = new native_blob([data.text], { type: data.mime });
					var item = new ClipboardItem(mimes);
					promise = navigator.clipboard.write([item]);
				} else if (can_use_writetext) {
					promise = navigator.clipboard.writeText(data.text);
				} else {
					return cb(false);
				}
				promise.then(function() { cb(true); }, function(e) {
					console.error(e);
					cb(false);
				});
			};
		}
	}
	if (is_userscript) {
		if (typeof GM_setClipboard === "function") {
			native_clipboard_write = function(data, cb) {
				GM_setClipboard(data.text, data.mime);
				cb(true);
			};
		} else if (typeof GM === "object" && typeof GM.setClipboard === "function") {
			native_clipboard_write = function(data, cb) {
				GM.setClipboard(data.text);
				cb(true);
			};
		}
	}
	var clipboard_write = function(data, cb) {
		if (!cb)
			cb = nullfunc;
		if (typeof data === "string") {
			data = { text: data };
		}
		if (!data.mime)
			data.mime = "text/plain";
		var writers = [
			native_clipboard_write,
			browser_clipboard_api_write,
			browser_clipboard_write
		];
		var do_write = function() {
			var writer;
			for (var i = 0; i < writers.length; i++) {
				if (!writers[i]) {
					writers.shift();
					i--;
					continue;
				}
				writer = writers[i];
				break;
			}
			writer(data, function(success) {
				if (writers.length > 0 && !success) {
					writers.shift();
					return do_write();
				}
				cb(success);
			});
		};
		do_write();
	};
	var clipboard_write_link = clipboard_write;
	var get_cookies = null;
	if (is_extension) {
		get_cookies = function(url, cb) {
			if (settings.browser_cookies === false) {
				return cb(null);
			}
			extension_send_message({
				type: "getcookies",
				data: { url: url }
			}, function(message) {
				cb(message.data);
			});
		};
	} else if (is_userscript) {
		get_cookies = function(url, cb, options) {
			if (settings.browser_cookies === false) {
				return cb(null);
			}
			if (!options) {
				options = {};
			}
			if (options.need_full) {
				return cb(null);
			}
			var host_domain = get_domain_from_url(window_location);
			var host_domain_nosub = get_domain_nosub(host_domain);
			var url_domain = get_domain_from_url(url);
			var url_domain_nosub = get_domain_nosub(url_domain);
			if (host_domain_nosub === url_domain_nosub) {
				cb(cookies_str_to_list(document.cookie));
			} else {
				cb(null);
			}
		};
	}
	var _localstorage_check_origin = function(url) {
		var url_domain = get_domain_from_url(url);
		var host_domain = get_domain_from_url(window_location);
		return url_domain.toLowerCase() === host_domain.toLowerCase();
	};
	var _localstorage_get_items = function(items, options) {
		if (!options)
			options = {};
		var result = {};
		var storage = localStorage;
		if (options.storage === "session")
			storage = sessionStorage;
		array_foreach(items, function(item) {
			result[item] = storage.getItem(item);
		});
		return result;
	};
	var get_localstorage = null;
	if (is_extension) {
		get_localstorage = function(url, keys, cb, options) {
			extension_send_message({
				type: "get_localstorage",
				data: {
					url: url,
					keys: keys,
					options: options
				}
			}, function(data) {
				if (!data)
					return cb(null);
				cb(data.data);
			});
		};
	} else if (is_userscript) {
		get_localstorage = function(url, keys, cb, options) {
			if (!_localstorage_check_origin(url))
				return cb(null);
			cb(_localstorage_get_items(keys, options));
		};
	}
	var cookies_str_to_list = function(cookiesstr) {
		var cookies = [];
		var splitted = cookiesstr.split(/;\s*/);
		array_foreach(splitted, function(kv) {
			var match = kv.match(/^\s*([^=\s]+)\s*=\s*(?:"([^"]+)"|([^"]\S*))\s*$/);
			if (!match) {
				console_warn("Unable to parse cookie", kv);
				return;
			}
			cookies.push({ name: match[1], value: match[2] || match[3] });
		});
		return cookies;
	};
	var cookies_to_httpheader = function(cookies) {
		var strs = [];
		for (var i = 0; i < cookies.length; i++) {
			var str = cookies[i].name + "=" + cookies[i].value;
			strs.push(str);
		}
		return strs.join("; ");
	};
	var bigimage_filter = function(url) {
		return true;
	};
	if (is_interactive || is_extension_bg) {
		bigimage_filter = function(url) {
			for (var i = 0; i < blacklist_regexes.length; i++) {
				if (blacklist_regexes[i].test(url))
					return false;
			}
			return true;
		};
	}
	var default_options = {
		fill_object: true,
		null_if_no_change: false,
		catch_errors: true,
		use_cache: true,
		use_api_cache: true,
		urlcache_time: 60 * 60,
		iterations: 200,
		exclude_problems: [
			"watermark",
			"smaller",
			"possibly_different",
			"possibly_broken"
		],
		exclude_videos: false,
		include_pastobjs: true,
		force_page: false,
		allow_thirdparty: false,
		allow_thirdparty_libs: true,
		allow_thirdparty_code: false,
		process_format: {},
		filter: bigimage_filter,
		rule_specific: {
			deviantart_prefer_size: false,
			deviantart_support_download: true,
			ehentai_full_image: true,
			imgur_source: true,
			imgur_nsfw_headers: null,
			instagram_use_app_api: false,
			instagram_dont_use_web: false,
			instagram_prefer_video_quality: true,
			instagram_gallery_postlink: false,
			snapchat_orig_media: true,
			teddit_redirect_reddit: true,
			tiktok_no_watermarks: false,
			tiktok_thirdparty: null,
			tumblr_api_key: null,
			twitter_use_ext: false,
			linked_image: false,
		},
		do_request: do_request,
		get_cookies: get_cookies,
		host_url: null,
		document: null,
		window: null,
		element: null,
		cb: null
	};
	var default_object = {
		url: null,
		always_ok: false,
		likely_broken: false,
		can_head: true,
		can_multiple_request: true,
		head_ok_errors: [],
		head_wrong_contenttype: false,
		head_wrong_contentlength: false,
		need_blob: false,
		need_data_url: false,
		waiting: false,
		redirects: false,
		forces_download: false,
		is_private: false,
		is_pagelink: false,
		is_original: false,
		norecurse: false,
		forcerecurse: false,
		can_cache: true,
		bad: false,
		bad_if: [],
		fake: false,
		media_info: {
			type: "image",
			delivery: null // "hls" or "dash"
		},
		video: false,
		album_info: null,
		headers: {},
		cookie_url: null,
		need_credentials: true,
		content_type: null,
		max_chunks: 0,
		referer_ok: {
			same_domain: false,
			same_domain_nosub: false
		},
		extra: {
			page: null,
			caption: null,
			created_date: null,
			updated_date: null,
			author_username: null,
			id: null
		},
		filename: "",
		problems: {
			watermark: false,
			smaller: false,
			possibly_different: false,
			possibly_broken: false,
			possibly_upscaled: false,
			bruteforce: false
		}
	};
	function is_element(x) {
		if (!x || typeof x !== "object")
			return false;
		if (("namespaceURI" in x) && ("nodeType" in x) && ("nodeName" in x) && ("childNodes" in x)) {
			return true;
		}
		if (typeof x.HTMLElement === "function" && typeof x.navigator === "object") {
			return true;
		}
		if (is_interactive) {
			if ((x instanceof Node) ||
				(x instanceof Element) ||
				(x instanceof HTMLDocument) ||
				(x instanceof Window)) {
				return true;
			}
		}
		return false;
	}
	function is_iterable_object(x) {
		return typeof x === "object" && x !== null && !is_array(x) && !is_element(x);
	}
	var shallowcopy_obj = function(x) {
		var result = {};
		for (var key in x) {
			result[key] = x[key];
		}
		return result;
	};
	if ("assign" in Object) {
		shallowcopy_obj = function(x) {
			return Object.assign({}, x);
		};
	}
	var shallowcopy_array = function(x) {
		var result = [];
		for (var i = 0; i < x.length; i++) {
			result.push(x[i]);
		}
		return result;
	};
	function shallowcopy(x) {
		if (is_iterable_object(x)) {
			if (is_array(x)) {
				return shallowcopy_array(x);
			} else if (typeof x === "object") {
				return shallowcopy_obj(x);
			}
		}
		return x;
	}
	function deepcopy(x, options) {
		if (!options)
			options = {};
		if (!options["history"])
			options["history"] = [];
		var result;
		if (typeof x === "string" || x === null || typeof x === "undefined") {
			return x;
		} else if (is_element(x) || x instanceof RegExp) {
			if (options["json"]) {
				return void 0;
			} else {
				return x;
			}
		} else if (typeof x === "function") {
			if (options["json"]) {
				return void 0;
			} else {
				return x;
			}
		} else if (typeof x === "object") {
			if (array_indexof(options["history"], x) >= 0)
				return;
			else
				options["history"].push(x);
			if (is_array(x)) {
				result = [];
				for (var i = 0; i < x.length; i++) {
					var item = x[i];
					result.push(deepcopy(item, options));
				}
			} else {
				result = {};
				for (var key in x) {
					try {
						result[key] = deepcopy(x[key], options);
					} catch (e) {
						result[key] = x[key];
					}
				}
			}
			return result;
		} else {
			return x;
		}
	}
	var serialize_event = function(event) {
		return deepcopy(event, { json: true });
	};
	var get_nonsensitive_settings = function() {
		var new_settings = JSON_parse(JSON_stringify(settings));
		for (var i = 0; i < sensitive_settings.length; i++) {
			delete new_settings[sensitive_settings[i]];
		}
		return new_settings;
	};
	var parse_boolean = function(bool) {
		if (bool === "true" || bool === true || bool === 1)
			return true;
		if (bool === "false" || bool === false || bool === 0)
			return false;
		return;
	};
	function get_language() {
		if (typeof navigator === "undefined")
			return "en";
		if (navigator.languages)
			return navigator.languages[0];
		return navigator.language || navigator.userLanguage;
	}
	var supported_languages = [
		"en",
		"zh-CN"
	];
	var browser_language = "en";
	try {
		browser_language = get_language().toLowerCase();
		if (array_indexof(supported_languages, browser_language) < 0) {
			browser_language = browser_language.replace(/-.*/, "");
			if (array_indexof(supported_languages, browser_language) < 0)
				browser_language = "en";
		}
	} catch (e) {
		console_error(e);
		if (array_indexof(supported_languages, browser_language) < 0)
			browser_language = "en";
	}
	var strings = {
		"$language_native$": {
			"_info": {
				"comments": {
					"en": "Native language name (e.g. Fran\u00E7ais for French, \uD55C\uAD6D\uC5B4 for Korean)"
				}
			},
			"zh-CN": "\u7B80\u4F53\u4E2D\u6587"
		},
		"$description$": {
			"en": "Finds larger or original versions of images and videos for 8200+ websites, including a powerful media popup and download feature",
			"zh-CN": "\u5728\u8FD1\u4E07\u4E2A\u7F51\u7AD9\u4E0A\u67E5\u627E\u5C3A\u5BF8\u66F4\u5927\u6216\u539F\u7248\u7684\u56FE\u50CF/\u89C6\u9891\uFF0C\u63D0\u4F9B\u5A92\u4F53\u6587\u4EF6\u5C0F\u5F39\u7A97\u548C\u4E0B\u8F7D\u529F\u80FD"
		},
		"options_header": {
			"en": "Options",
			"zh-CN": "\u9009\u9879"
		},
		"yes": {
			"en": "Yes",
			"zh-CN": "\u662F"
		},
		"no": {
			"en": "No",
			"zh-CN": "\u5426"
		},
		"Import": {
			"zh-CN": "\u5BFC\u5165"
		},
		"Export": {
			"zh-CN": "\u5BFC\u51FA"
		},
		"Requires:": {
			"zh-CN": "\u9700\u8981:"
		},
		"Or:": {
			"zh-CN": "\u6216\u8005:"
		},
		"Redirection": {
			"zh-CN": "\u91CD\u5B9A\u5411"
		},
		"subcategory_update": {
			"en": "Updates",
			"zh-CN": "\u66F4\u65B0"
		},
		"subcategory_libraries": {
			"en": "3rd-party libraries",
			"zh-CN": "\u7B2C\u4E09\u65B9\u5E93"
		},
		"subcategory_settings": {
			"en": "Settings",
			"zh-CN": "\u8BBE\u7F6E"
		},
		"subcategory_ui": {
			"en": "UI",
			"zh-CN": "\u754C\u9762"
		},
		"subcategory_trigger": {
			"en": "Trigger",
			"zh-CN": "\u89E6\u53D1\u5668"
		},
		"subcategory_popup_source": {
			"en": "Source",
			"zh-CN": "\u5F39\u7A97\u6E90\u5934"
		},
		"subcategory_open_behavior": {
			"en": "Open Behavior",
			"zh-CN": "\u6253\u5F00\u65B9\u5F0F"
		},
		"subcategory_close_behavior": {
			"en": "Close Behavior",
			"zh-CN": "\u5173\u95ED\u65B9\u5F0F"
		},
		"subcategory_behavior": {
			"en": "Popup Behavior",
			"zh-CN": "\u884C\u4E3A"
		},
		"subcategory_video": {
			"en": "Video/Audio",
			"zh-CN": "\u89C6\u9891/\u97F3\u9891"
		},
		"subcategory_gallery": {
			"en": "Gallery",
			"zh-CN": "\u56FE\u5E93"
		},
		"subcategory_popup_other": {
			"en": "Other",
			"zh-CN": "\u5176\u4ED6"
		},
		"subcategory_cache": {
			"en": "Cache",
			"zh-CN": "\u7F13\u5B58"
		},
		"Shortcuts": {
			"zh-CN": "\u5FEB\u6377\u952E"
		},
		"subcategory_keybinds_popup_actions": {
			"en": "Popup actions",
			"zh-CN": "\u64CD\u4F5C\u5F39\u7A97"
		},
		"Mouse cursor": {
			"zh-CN": "\u9F20\u6807\u5149\u6807"
		},
		"Rules": {
			"zh-CN": "\u89C4\u5219"
		},
		"subcategory_rule_specific": {
			"en": "Rule-specific",
			"zh-CN": "\u4E13\u7528\u89C4\u5219"
		},
		"Website": {
			"zh-CN": "\u7F51\u7AD9"
		},
		"Saved! Refresh the target page for changes to take effect": {
			"zh-CN": "\u5DF2\u4FDD\u5B58\uFF0C\u5237\u65B0\u76EE\u6807\u9875\u9762\u4F7F\u66F4\u6539\u751F\u6548"
		},
		"Saved!": {
			"zh-CN": "\u5DF2\u4FDD\u5B58"
		},
		"save": {
			"en": "Save",
			"zh-CN": "\u4FDD\u5B58"
		},
		"Record": {
			"_info": {
				"comments": {
					"en": "Button name for recording key combinations"
				}
			},
			"zh-CN": "\u5F55\u5236"
		},
		"Cancel": {
			"zh-CN": "\u53D6\u6D88"
		},
		"Mouseover popup (%%1) is needed to display the original version": {
			"zh-CN": "\u9700\u8981\u9F20\u6807\u60AC\u505C\u5F39\u7A97\uFF08%%1\uFF09\u6765\u663E\u793A\u539F\u59CB\u7248\u672C"
		},
		"custom headers": {
			"zh-CN": "\u81EA\u5B9A\u4E49\u6807\u9898"
		},
		"forces download": {
			"en": "forces download",
			"zh-CN": "\u5F3A\u5236\u4E0B\u8F7D"
		},
		"Close": {
			"zh-CN": "\u5173\u95ED"
		},
		"Previous": {
			"zh-CN": "\u4E0A\u4E00\u4E2A"
		},
		"Next": {
			"zh-CN": "\u4E0B\u4E00\u4E2A"
		},
		"Left Arrow": {
			"zh-CN": "\u5DE6\u7BAD\u5934"
		},
		"Right Arrow": {
			"zh-CN": "\u53F3\u7BAD\u5934"
		},
		"subcategory_extension": {
			"en": "Extension",
			"zh-CN": "\u6269\u5C55"
		},
		"Rotate Left": {
			"zh-CN": "\u5411\u5DE6\u65CB\u8F6C"
		},
		"Rotate Right": {
			"zh-CN": "\u5411\u53F3\u65CB\u8F6C"
		},
		"Buttons": {
			"_info": {
				"comments": {
					"en": "Settings category name for configuring extra functions, such as \"Replace Images\" and \"Highlight Images\""
				}
			},
			"zh-CN": "\u5176\u4ED6"
		},
		"subcategory_replaceimages": {
			"en": "Replace Images",
			"zh-CN": "\u66FF\u6362\u56FE\u50CF"
		},
		"subcategory_highlightimages": {
			"en": "Highlight Images",
			"zh-CN": "\u9AD8\u4EAE\u56FE\u50CF"
		},
		"General": {
			"zh-CN": "\u901A\u7528"
		},
		"Enable extension": {
			"_info": {
				"instances": [
					{
						"setting": "imu_enabled",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u6269\u5C55"
		},
		"Globally enables or disables the extension": {
			"_info": {
				"instances": [
					{
						"setting": "imu_enabled",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5168\u5C40\u542F\u7528\u6216\u7981\u7528\u6269\u5C55"
		},
		"Language": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8BED\u8A00"
		},
		"Language for this extension": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u6269\u5C55\u7A0B\u5E8F\u7684\u8BED\u8A00"
		},
		"English": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.en.name"
					}
				]
			},
			"zh-CN": "\u82F1\u8BED"
		},
		"Espa\u00F1ol": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.es.name"
					}
				]
			},
			"zh-CN": "\u897F\u73ED\u7259\u8BED"
		},
		"Fran\u00E7ais": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.fr.name"
					}
				]
			},
			"zh-CN": "\u6CD5\u8BED"
		},
		"Italiano": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.it.name"
					}
				]
			},
			"zh-CN": "\u610F\u5927\u5229\u8BED"
		},
		"\uD55C\uAD6D\uC5B4": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.ko.name"
					}
				]
			},
			"zh-CN": "\u97E9\u8BED"
		},
		"\u0420\u0443\u0441\u0441\u043A\u0438\u0439": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.ru.name"
					}
				]
			},
			"zh-CN": "\u4FC4\u8BED"
		},
		"\u7B80\u4F53\u4E2D\u6587": {
			"_info": {
				"instances": [
					{
						"setting": "language",
						"field": "options.zh-CN.name"
					}
				]
			}
		},
		"Dark mode": {
			"_info": {
				"instances": [
					{
						"setting": "dark_mode",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6DF1\u8272\u6A21\u5F0F"
		},
		"Changes the colors to have light text on a dark background": {
			"_info": {
				"instances": [
					{
						"setting": "dark_mode",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u989C\u8272\u66F4\u6539\u4E3A\u5728\u6DF1\u8272\u80CC\u666F\u4E0A\u663E\u793A\u6D45\u8272\u6587\u672C"
		},
		"Description below options": {
			"_info": {
				"instances": [
					{
						"setting": "settings_visible_description",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9009\u9879\u4E0B\u65B9\u663E\u793A\u63CF\u8FF0"
		},
		"Shows the description below the options (otherwise the description is only shown when you hover over the option's name)": {
			"_info": {
				"instances": [
					{
						"setting": "settings_visible_description",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9009\u9879\u4E0B\u65B9\u663E\u793A\u63CF\u8FF0\uFF08\u7981\u7528\u5219\u4EC5\u5F53\u9F20\u6807\u60AC\u505C\u5728\u9009\u9879\u7684\u540D\u79F0\u4E0A\u65F6\u663E\u793A\u8BF4\u660E\uFF09"
		},
		"Show disabled options": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_disabled",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u505C\u7528\u7684\u9009\u9879"
		},
		"If disabled, options that are disabled due to their requirements being unmet will not be displayed": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_disabled",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7981\u7528\u540E\u5C06\u4E0D\u663E\u793A\u56E0\u672A\u6EE1\u8DB3\u8981\u6C42\u800C\u88AB\u505C\u7528\u7684\u9009\u9879"
		},
		"Show disabled trigger profiles": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_disabled_profiles",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u505C\u7528\u7684\u89E6\u53D1\u5668\u914D\u7F6E"
		},
		"If disabled, options for alternate trigger profiles (options with `(#2)` after them) will not be shown if the relevant trigger isn't active": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_disabled_profiles",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u7981\u7528\uFF0C\u5C06\u4E0D\u663E\u793A\u76F8\u5173\u89E6\u53D1\u5668\u672A\u88AB\u6FC0\u6D3B\u7684\u5907\u7528\u89E6\u53D1\u5668\u7684\u914D\u7F6E\u9009\u9879\uFF08\u5E26\u6709 `(#2)` )"
		},
		"Requirements below disabled options": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_requirements",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u505C\u7528\u9009\u9879\u4E0B\u65B9\u663E\u793A\u9700\u6C42"
		},
		"If an option is disabled, the requirements to enable the option will be displayed below it": {
			"_info": {
				"instances": [
					{
						"setting": "settings_show_requirements",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u5DF2\u505C\u7528\u9009\u9879\u7684\u4E0B\u65B9\u663E\u793A\u542F\u7528\u8981\u6C42"
		},
		"Check for updates": {
			"_info": {
				"instances": [
					{
						"setting": "check_updates",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u68C0\u67E5\u66F4\u65B0"
		},
		"Periodically checks for updates. If a new update is available, it will be shown at the top of the options page": {
			"_info": {
				"instances": [
					{
						"setting": "check_updates",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5B9A\u671F\u68C0\u67E5\u66F4\u65B0\u3002\u6709\u53EF\u7528\u7684\u66F4\u65B0\u65F6\u5C06\u5728\u9009\u9879\u9875\u9762\u7684\u9876\u90E8\u663E\u793A"
		},
		"Update check interval": {
			"_info": {
				"instances": [
					{
						"setting": "check_update_interval",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u66F4\u65B0\u68C0\u67E5\u95F4\u9694"
		},
		"How often to check for updates": {
			"_info": {
				"instances": [
					{
						"setting": "check_update_interval",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u591A\u4E45\u68C0\u67E5\u4E00\u6B21\u66F4\u65B0"
		},
		"hours": {
			"_info": {
				"instances": [
					{
						"setting": "check_update_interval",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u5C0F\u65F6"
		},
		"Notify when update is available": {
			"_info": {
				"instances": [
					{
						"setting": "check_update_notify",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6709\u53EF\u7528\u66F4\u65B0\u65F6\u901A\u77E5"
		},
		"Creates a browser notification when an update is available": {
			"_info": {
				"instances": [
					{
						"setting": "check_update_notify",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6709\u53EF\u7528\u66F4\u65B0\u65F6\u5F39\u51FA\u6D4F\u89C8\u5668\u901A\u77E5"
		},
		"Show advanced settings": {
			"_info": {
				"instances": [
					{
						"setting": "advanced_options",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u9AD8\u7EA7\u8BBE\u7F6E"
		},
		"If disabled, settings that might be harder to understand will be hidden": {
			"_info": {
				"instances": [
					{
						"setting": "advanced_options",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7981\u7528\u540E\u5C06\u9690\u85CF\u6BD4\u8F83\u96BE\u4EE5\u7406\u89E3\u7684\u8BBE\u7F6E"
		},
		"Use tabs": {
			"_info": {
				"instances": [
					{
						"setting": "settings_tabs",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6807\u7B7E\u5F0F\u8BBE\u7F6E"
		},
		"If disabled, all settings will be shown on a single page": {
			"_info": {
				"instances": [
					{
						"setting": "settings_tabs",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u7981\u7528\uFF0C\u5C06\u5728\u540C\u4E00\u9875\u4E0A\u663E\u793A\u5168\u90E8\u8BBE\u7F6E"
		},
		"Alphabetical order": {
			"_info": {
				"instances": [
					{
						"setting": "settings_alphabetical_order",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6309\u5B57\u6BCD\u987A\u5E8F"
		},
		"Lists options in alphabetical order": {
			"_info": {
				"instances": [
					{
						"setting": "settings_alphabetical_order",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4EE5\u5B57\u6BCD\u987A\u5E8F\u6392\u5217\u9009\u9879"
		},
		"Allow using browser XHR": {
			"_info": {
				"instances": [
					{
						"setting": "allow_browser_request",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u4F7F\u7528\u6D4F\u89C8\u5668 XHR"
		},
		"This allows XHR requests to be run in the browser's context if they fail in the extension (e.g. when Tracking Protection is set to High)": {
			"_info": {
				"instances": [
					{
						"setting": "allow_browser_request",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u6269\u5C55\u4E2D\u8FD0\u884C XHR \u8BF7\u6C42\u5931\u8D25\u65F6\u5728\u6D4F\u89C8\u5668\u4E0A\u4E0B\u6587\u4E2D\u8FD0\u884C XHR\u3002\u539F\u56E0\u4F8B\u5982\u201C\u8DDF\u8E2A\u4FDD\u62A4\u201D\u88AB\u8BBE\u5B9A\u4E3A\u9AD8\u3002"
		},
		"Retry requests with 503 errors": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_times",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u91CD\u8BD5\u8FD4\u56DE 503 \u9519\u8BEF\u7684\u8BF7\u6C42"
		},
		"Amount of times to retry a request when 503 (service unavailable) is returned by the server": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_times",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u670D\u52A1\u5668\u8FD4\u56DE 503 \u9519\u8BEF\uFF08\u670D\u52A1\u4E0D\u53EF\u7528\uFF09\u65F6\uFF0C\u91CD\u8BD5\u8BF7\u6C42\u6B21\u6570"
		},
		"times": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_times",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u6B21"
		},
		"Delay between 503 retries": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_ms",
						"field": "name"
					}
				]
			},
			"zh-CN": "503 \u91CD\u8BD5\u4E4B\u95F4\u5EF6\u8FDF"
		},
		"Time (in milliseconds) to delay between retrying requests that received 503": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_ms",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6536\u5230 503 \u9519\u8BEF\u540E\u91CD\u8BD5\u8BF7\u6C42\u4E4B\u95F4\u5EF6\u8FDF\u591A\u4E45\uFF08\u6BEB\u79D2\uFF09"
		},
		"Use `Blob` over `ArrayBuffer`": {
			"_info": {
				"instances": [
					{
						"setting": "use_blob_over_arraybuffer",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 Blob \u4EE3\u66FF ArrayBuffer"
		},
		"Uses `Blob`s for XHRs instead of `ArrayBuffer`s. Keep this enabled unless your userscript manager doesn't support blob requests": {
			"_info": {
				"instances": [
					{
						"setting": "use_blob_over_arraybuffer",
						"field": "description"
					}
				]
			},
			"zh-CN": "XHR \u4E2D\u4F7F\u7528 Blob \u4EE3\u66FF ArrayBuffer\u3002\u9664\u975E\u60A8\u7684\u7528\u6237\u811A\u672C\u7BA1\u7406\u5668\u4E0D\u652F\u6301 Blob \u8BF7\u6C42\uFF0C\u5426\u5219\u4FDD\u6301\u542F\u7528"
		},
		"Live settings reloading": {
			"_info": {
				"instances": [
					{
						"setting": "allow_live_settings_reload",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8BBE\u7F6E\u5B9E\u65F6\u751F\u6548"
		},
		"Enables/disables live settings reloading. There shouldn't be a reason to disable this unless you're experiencing issues with this feature": {
			"_info": {
				"instances": [
					{
						"setting": "allow_live_settings_reload",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528/\u7981\u7528\u8BBE\u7F6E\u5B9E\u65F6\u91CD\u65B0\u52A0\u8F7D\u3002\u9664\u975E\u9047\u5230\u6B64\u529F\u80FD\u76F8\u5173\u7684\u95EE\u9898\uFF0C\u5426\u5219\u5E94\u4FDD\u6301\u6B64\u529F\u80FD\u542F\u7528"
		},
		"Disable keybindings when editing text": {
			"_info": {
				"instances": [
					{
						"setting": "disable_keybind_when_editing",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F16\u8F91\u6587\u672C\u6846\u65F6\u7981\u7528\u5FEB\u6377\u952E"
		},
		"Disables shortcuts when key events are sent to an input area on the page": {
			"_info": {
				"instances": [
					{
						"setting": "disable_keybind_when_editing",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u952E\u76D8\u4E8B\u4EF6\u53D1\u9001\u5230\u9875\u9762\u4E0A\u7684\u8F93\u5165\u533A\u57DF\u65F6\uFF0C\u505C\u7528\u5DF2\u8BBE\u7F6E\u7684\u5FEB\u6377\u952E"
		},
		"Use `GM_download` if available": {
			"_info": {
				"instances": [
					{
						"setting": "enable_gm_download",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53EF\u7528\u65F6\u4F7F\u7528 GM_download"
		},
		"Prefers using `GM_download` over simple browser-based downloads, if the function is available. Some userscript managers download the entire file before displaying a save dialog, which can be undesirable for large video files": {
			"_info": {
				"instances": [
					{
						"setting": "enable_gm_download",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F18\u5148\u4F7F\u7528 GM_download \u4EE3\u66FF\u6D4F\u89C8\u5668\u7684\u4E0B\u8F7D\u529F\u80FD\u3002\u90E8\u5206\u7528\u6237\u811A\u672C\u7BA1\u7406\u5668\u4F1A\u5728\u663E\u793A\u201C\u4FDD\u5B58\u201D\u5BF9\u8BDD\u6846\u524D\u4E0B\u8F7D\u6574\u4E2A\u6587\u4EF6\uFF0C\u8FD9\u4E0D\u5229\u4E8E\u4E0B\u8F7D\u5927\u4F53\u91CF\u7684\u89C6\u9891\u6587\u4EF6"
		},
		"Maximum size to `GM_download`": {
			"_info": {
				"instances": [
					{
						"setting": "gm_download_max",
						"field": "name"
					}
				]
			},
			"zh-CN": "GM_download \u5927\u5C0F\u4E0A\u9650"
		},
		"If a file is larger than this size, use a simple browser-based download instead. Set to `0` for unlimited.": {
			"_info": {
				"instances": [
					{
						"setting": "gm_download_max",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6587\u4EF6\u5927\u4E8E\u6B64\u5927\u5C0F\u65F6\u6539\u7528\u57FA\u4E8E\u6D4F\u89C8\u5668\u7684\u4E0B\u8F7D\u529F\u80FD\u3002\u8BBE\u4E3A 0 \u8868\u793A\u65E0\u9650\u5236\u3002"
		},
		"MB": {
			"_info": {
				"instances": [
					{
						"setting": "gm_download_max",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "MB"
		},
		"Force save dialog when downloading": {
			"_info": {
				"instances": [
					{
						"setting": "enable_webextension_download",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u65F6\u5F3A\u5236\u6253\u5F00\u201C\u4FDD\u5B58\u201D\u5BF9\u8BDD\u6846"
		},
		"Tries to ensure the 'save as' dialog displays when downloading. This requires the 'downloads' permission to work, and will sometimes not work when custom headers are required.": {
			"_info": {
				"instances": [
					{
						"setting": "enable_webextension_download",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C1D\u8BD5\u786E\u4FDD\u4E0B\u8F7D\u65F6\u6253\u5F00\u201C\u53E6\u5B58\u4E3A\u201D\u5BF9\u8BDD\u6846\u3002\u6B64\u529F\u80FD\u9700\u8981\u201C\u4E0B\u8F7D\u201D\u6743\u9650\uFF0C\u5E76\u4E14\u642D\u914D\u201C\u81EA\u5B9A\u4E49\u5934\u201D\u65F6\u53EF\u80FD\u65E0\u6548\u3002"
		},
		"Enable logging to console": {
			"_info": {
				"instances": [
					{
						"setting": "enable_console_logging",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u63A7\u5236\u53F0\u65E5\u5FD7"
		},
		"Allows the script to log messages to the browser console.": {
			"_info": {
				"instances": [
					{
						"setting": "enable_console_logging",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u8BB0\u5F55\u65E5\u5FD7\u6D88\u606F\u5230\u6D4F\u89C8\u5668\u7684\u63A7\u5236\u53F0\u3002"
		},
		"Enable writing to clipboard": {
			"_info": {
				"instances": [
					{
						"setting": "write_to_clipboard",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5199\u5165\u526A\u8D34\u677F"
		},
		"This option does nothing on its own, but enabling it allows other functionality that require writing to the clipboard to work": {
			"_info": {
				"instances": [
					{
						"setting": "write_to_clipboard",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u9009\u9879\u672C\u8EAB\u65E0\u529F\u80FD\uFF0C\u4F46\u542F\u7528\u5B83\u624D\u80FD\u4F7F\u5176\u4ED6\u9700\u8981\u5199\u5165\u526A\u8D34\u677F\u7684\u529F\u80FD\u8FD0\u4F5C"
		},
		"Enable redirection": {
			"_info": {
				"instances": [
					{
						"setting": "redirect",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u91CD\u5B9A\u5411"
		},
		"Automatically redirect media opened in their own tab to their larger/original versions": {
			"_info": {
				"instances": [
					{
						"setting": "redirect",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u6253\u5F00\u7684\u5A92\u4F53\u6587\u4EF6\u6807\u7B7E\u9875\u4E2D\u81EA\u52A8\u91CD\u5B9A\u5411\u5230\u5176\u66F4\u6E05\u6670\u7684\u7248\u672C"
		},
		"Allow video": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_video",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u89C6\u9891"
		},
		"Allows redirecting from/to video": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_video",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u89C6\u9891\u88AB\u91CD\u5B9A\u5411"
		},
		"Allow audio": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_audio",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u97F3\u9891"
		},
		"Allows redirecting from/to audio": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_audio",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u97F3\u9891\u88AB\u91CD\u5B9A\u5411"
		},
		"Add to history": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_history",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6DFB\u52A0\u5230\u5386\u53F2\u8BB0\u5F55"
		},
		"Redirection will add a new entry to the browser's history": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_history",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u91CD\u5B9A\u5411\u53D1\u751F\u65F6\u5728\u6D4F\u89C8\u5668\u7684\u5386\u53F2\u8BB0\u5F55\u4E2D\u52A0\u5165\u4E00\u6761\u8BB0\u5F55"
		},
		"Do redirection in extension": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_extension",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u6269\u5C55\u4E2D\u6267\u884C\u91CD\u5B9A\u5411"
		},
		"Performs the redirection in the extension instead of the content script. This is significantly faster and shouldn't cause issues in theory, but this option is kept in case of regressions": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_extension",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u6269\u5C55\u5185\u800C\u975E\u5185\u5BB9\u811A\u672C\u4E2D\u6267\u884C\u91CD\u5B9A\u5411\u3002\u8FD9\u6837\u5FEB\u5F97\u591A\u5E76\u4E14\u7406\u8BBA\u4E0A\u4E0D\u5E94\u8BE5\u5F15\u8D77\u95EE\u9898\uFF0C\u4F46\u8BE5\u9009\u9879\u88AB\u4FDD\u7559\u4EE5\u9632\u7279\u6B8A\u95EE\u9898"
		},
		"Use GET if HEAD is unsupported": {
			"_info": {
				"instances": [
					{
						"setting": "canhead_get",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0D\u652F\u6301 HEAD \u65F6\u6539\u7528 GET"
		},
		"Use a GET request to check an image's availability, if the server does not support HEAD requests": {
			"_info": {
				"instances": [
					{
						"setting": "canhead_get",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u670D\u52A1\u5668\u4E0D\u652F\u6301 HEAD \u8BF7\u6C42\u65F6\u6539\u7528\u4E00\u6761 GET \u8BF7\u6C42\u6765\u68C0\u67E5\u4E00\u4E2A\u56FE\u50CF\u7684\u53EF\u7528\u6027"
		},
		"Try finding extra information": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_force_page",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5C1D\u8BD5\u67E5\u627E\u989D\u5916\u4FE1\u606F"
		},
		"Enables methods that use API calls for finding extra information, such as the original page, caption, or album information. Note that this option does not affect finding the original media.": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_force_page",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u901A\u8FC7 API \u8C03\u7528\u67E5\u627E\u989D\u5916\u4FE1\u606F\u7684\u65B9\u6CD5\uFF0C\u67E5\u627E\u5982\u539F\u59CB\u9875\u9762\u3001\u6807\u9898\u6216\u76F8\u518C\u4FE1\u606F\u3002\u6B64\u9009\u9879\u4E0D\u5F71\u54CD\u67E5\u627E\u539F\u59CB\u7248\u672C\u7684\u5A92\u4F53\u6587\u4EF6\u3002"
		},
		"SmugMug": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_force_page",
						"field": "example_websites[1]"
					}
				]
			},
			"zh-CN": "SmugMug"
		},
		"Enable tooltip": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_enable_infobox",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5DE5\u5177\u63D0\u793A"
		},
		"Enables the 'Mouseover popup is needed to display the original version' tooltip": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_enable_infobox",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u201C\u9700\u8981\u9F20\u6807\u60AC\u505C\u5F39\u7A97\u6765\u663E\u793A\u539F\u59CB\u7248\u672C\u201D\u7684\u5DE5\u5177\u63D0\u793A"
		},
		"Show image URL in tooltip": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_infobox_url",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u5DE5\u5177\u63D0\u793A\u4E2D\u663E\u793A\u56FE\u50CF URL"
		},
		"If the popup is needed to display the larger version of an image, display the image link in the tooltip": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_infobox_url",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u9700\u8981\u5F39\u7A97\u6765\u663E\u793A\u56FE\u50CF\u7684\u8F83\u5927\u7248\u672C\uFF0C\u5728\u5DE5\u5177\u63D0\u793A\u4E2D\u663E\u793A\u56FE\u50CF\u94FE\u63A5"
		},
		"Hide tooltip after": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_infobox_timeout",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9690\u85CF\u5DE5\u5177\u63D0\u793A\u7684\u65F6\u95F4"
		},
		"Hides the tooltip after the specified number of seconds (or when the mouse clicks on it). Set to 0 to never hide automatically": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_infobox_timeout",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u6307\u5B9A\u79D2\u6570\u540E\u9690\u85CF\u5DE5\u5177\u63D0\u793A\u3002\u9F20\u6807\u5355\u51FB\u540E\u4E5F\u4F1A\u9690\u85CF\u3002\u8BBE\u4E3A 0 \u5219\u7981\u7528\u81EA\u52A8\u9690\u85CF"
		},
		"Log info object to console": {
			"_info": {
				"instances": [
					{
						"setting": "print_imu_obj",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8BB0\u5F55\u4FE1\u606F\u5BF9\u8C61\u5230\u63A7\u5236\u53F0"
		},
		"Prints the full info object to the console whenever a popup/redirect is found": {
			"_info": {
				"instances": [
					{
						"setting": "print_imu_obj",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6BCF\u5F53\u53D1\u73B0\u5F39\u51FA/\u91CD\u5B9A\u5411\u65F6\uFF0C\u8BB0\u5F55\u5B8C\u6574\u7684\u4FE1\u606F\u5BF9\u8C61\u5230\u63A7\u5236\u53F0"
		},
		"Disable when response headers need modifying": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_disable_for_responseheader",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9700\u8981\u4FEE\u6539\u54CD\u5E94\u5934\u65F6\u7981\u7528"
		},
		"This option works around Chrome's migration to manifest v3, redirecting some images to being force-downloaded": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_disable_for_responseheader",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u9009\u9879\u662F\u4E3A\u914D\u5408 Chrome \u7684\u8FC1\u79FB\u5230 manifest v3\uFF0C\u91CD\u5B9A\u5411\u4E00\u4E9B\u56FE\u50CF\u6765\u5F3A\u5236\u4E0B\u8F7D"
		},
		"Redirect to largest without issues": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_to_no_infobox",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u65E0\u9700\u6C42\u4E5F\u91CD\u5B9A\u5411\u5230\u6700\u5927\u7248\u672C"
		},
		"Redirects to the largest image found that doesn't require custom headers or forces download": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_to_no_infobox",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u91CD\u5B9A\u5411\u5230\u627E\u5230\u7684\u6700\u5927\u56FE\u50CF\u7248\u672C\uFF0C\u54EA\u6015\u4E0D\u9700\u8981\u81EA\u5B9A\u4E49\u5934\u6216\u5F3A\u5236\u4E0B\u8F7D"
		},
		"Redirect for HTML pages too": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_host_html",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u540C\u65F6\u91CD\u5B9A\u5411 HTML \u9875\u9762"
		},
		"Tries redirection even if the host page is HTML. This option might be useful for dead links. However, this will also result in many normal pages being redirected to images/video, so please avoid enabling this by default!": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_host_html",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C1D\u8BD5\u91CD\u5B9A\u5411\uFF0C\u5373\u4F7F\u4E3B\u9875\u662F HTML\u3002\u6B64\u9009\u9879\u53EF\u80FD\u5BF9\u5931\u6548\u94FE\u63A5\u6709\u7528\u3002\u4F46\u662F\uFF0C\u8FD9\u4E5F\u4F1A\u5BFC\u81F4\u8BB8\u591A\u6B63\u5E38\u7684\u9875\u9762\u88AB\u91CD\u5B9A\u5411\u5230\u56FE\u50CF/\u89C6\u9891\uFF0C\u6240\u4EE5\u8BF7\u907F\u514D\u9ED8\u8BA4\u542F\u7528\u8FD9\u4E2A\uFF01"
		},
		"This will result in many pages being redirected to images/videos.\nI'd recommend only enabling this for the media you need it for, then disabling it after.": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_host_html",
						"field": "warning.true"
					}
				]
			},
			"zh-CN": "\u8FD9\u5C06\u5BFC\u81F4\u8BB8\u591A\u9875\u9762\u88AB\u91CD\u5B9A\u5411\u5230\u56FE\u50CF/\u89C6\u9891\u3002\u6211\u5EFA\u8BAE\u53EA\u4E3A\u60A8\u9700\u8981\u7684\u5A92\u4F53\u542F\u7528\u5B83\uFF0C\u7136\u540E\u518D\u7981\u7528\u5B83\u3002"
		},
		"Enable mouseover popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover",
						"field": "name"
					}
				]
			},
			"en": "Enable image popup",
			"zh-CN": "\u542F\u7528\u9F20\u6807\u60AC\u505C\u5F39\u7A97"
		},
		"Show a popup with the larger image when you mouseover an image with the trigger key held (if applicable)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F53\u9F20\u6807\u60AC\u505C\u5728\u4E00\u4E2A\u56FE\u50CF\u4E0A\u65F6\uFF0C\u7528\u89E6\u53D1\u952E\uFF08\u5982\u679C\u9002\u7528\uFF09\u663E\u793A\u4E00\u4E2A\u5F39\u7A97"
		},
		"Mouseover popup trigger": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "name"
					}
				]
			},
			"en": "Popup trigger",
			"zh-CN": "\u9F20\u6807\u60AC\u505C\u5F39\u7A97\u89E6\u53D1\u5668"
		},
		"How the popup will get triggered": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u89E6\u53D1\u65B9\u5F0F"
		},
		"Mouseover": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.mouse.name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u60AC\u505C"
		},
		"Triggers when your mouse is over the image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.mouse.description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u5728\u56FE\u50CF\u4E0A\u60AC\u505C\u65F6\u89E6\u53D1"
		},
		"Key trigger": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.keyboard.name"
					}
				]
			},
			"zh-CN": "\u6309\u952E\u89E6\u53D1"
		},
		"Triggers when you press a key sequence when your mouse is over an image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.keyboard.description"
					}
				]
			},
			"zh-CN": "\u5F53\u9F20\u6807\u5728\u56FE\u50CF\u4E0A\u60AC\u505C\u65F6\u6309\u6307\u5B9A\u952E\u89E6\u53D1"
		},
		"Disables the popup from being triggered (useful if you only want to use the context menu item)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.none.description"
					}
				]
			},
			"zh-CN": "\u7981\u6B62\u89E6\u53D1\u5F39\u7A97\uFF08\u5982\u679C\u60A8\u53EA\u60F3\u4F7F\u7528\u53F3\u952E\u83DC\u5355\u9879\uFF0C\u5219\u6B64\u9009\u9879\u5F88\u5B9E\u7528\uFF09"
		},
		"Popup trigger key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u89E6\u53D1\u952E"
		},
		"Key sequence to trigger the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u5F39\u7A97\u7684\u6309\u952E\u5E8F\u5217"
		},
		"Popup trigger key (#2)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key_t2",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u89E6\u53D1\u952E (#2)"
		},
		"Key sequence to trigger the popup with alternate options. Search for `(#2)` to find the relevant options": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key_t2",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u5F39\u7A97\u7684\u6309\u952E\u5E8F\u5217\uFF0C\u642D\u914D\u5907\u7528\u9009\u9879\u3002\u641C\u7D22\u201C(#2)\u201D\u627E\u5230\u76F8\u5173\u7684\u9009\u9879"
		},
		"Popup trigger key (#3)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key_t3",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u89E6\u53D1\u952E (#3)"
		},
		"Key sequence to trigger the popup with alternate options. Search for `(#3)` to find the relevant options": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_key_t3",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u5F39\u7A97\u7684\u6309\u952E\u5E8F\u5217\uFF0C\u642D\u914D\u5907\u7528\u9009\u9879\u3002\u641C\u7D22\u201C(#3)\u201D\u627E\u5230\u76F8\u5173\u7684\u9009\u9879"
		},
		"Popup trigger delay": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_delay",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u89E6\u53D1\u952E\u5EF6\u8FDF"
		},
		"Delay (in seconds) before the popup shows": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_delay",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u663E\u793A\u524D\u5EF6\u8FDF\uFF08\u79D2\uFF09"
		},
		"Use mouseover event": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_mouseover",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 mouseover \u4E8B\u4EF6"
		},
		"Uses the mouseover event instead of mousemove to figure out where to trigger the popup. This more closely matches the way other image popup addons work, at the cost of configurability": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_mouseover",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 mouseover \u4E8B\u4EF6\u800C\u4E0D\u662F mousemove \u6765\u786E\u5B9A\u5728\u54EA\u91CC\u89E6\u53D1\u5F39\u7A97\u3002\u8FD9\u66F4\u63A5\u8FD1\u4E8E\u5176\u4ED6\u56FE\u50CF\u5F39\u7A97\u6269\u5C55\u7684\u8FD0\u4F5C\u65B9\u5F0F\uFF0C\u4EE3\u4EF7\u662F\u53EF\u914D\u7F6E\u6027"
		},
		"Enable/disable toggle": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_enabledisable_toggle",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528/\u7981\u7528\u5207\u6362\u5F00\u5173"
		},
		"Controls whether the 'Popup enable/disable key' will enable or disable the popup from opening": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_enabledisable_toggle",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u63A7\u5236\u201C\u5F39\u7A97\u542F\u7528/\u7981\u7528\u952E\u201D\u662F\u5426\u63A7\u5236\u5F39\u7A97\u7684\u6253\u5F00"
		},
		"Enable": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_enabledisable_toggle",
						"field": "options.enable.name"
					}
				]
			},
			"zh-CN": "\u542F\u7528"
		},
		"Disable": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_enabledisable_toggle",
						"field": "options.disable.name"
					}
				]
			},
			"zh-CN": "\u7981\u7528"
		},
		"Popup enable/disable key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_prevent_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u542F\u7528/\u7981\u7528\u952E"
		},
		"Holding down this key will enable or disable the popup from being opened, depending on the 'Enable/disable toggle' setting": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_prevent_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4F4F\u8FD9\u4E2A\u952E\u5C06\u542F\u7528/\u7981\u7528\u5F39\u7A97\u6253\u5F00\uFF0C\u5177\u4F53\u53D6\u51B3\u4E8E\u201C\u542F\u7528/\u7981\u7528\u5207\u6362\u5F00\u5173\u201D\u8BBE\u7F6E"
		},
		"Allow showing partially loaded": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u663E\u793A\u90E8\u5206\u52A0\u8F7D\u7684\u5185\u5BB9"
		},
		"This will allow the popup to open for partially loaded media.\nPartially loaded media will contain the source URL directly (where possible), whereas fully loaded media will use a blob or data URL.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8FD9\u5C06\u5141\u8BB8\u4E3A\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u6253\u5F00\u5F39\u7A97\u3002\n\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u5C06\u76F4\u63A5\u5305\u542B\u6E90 URL\uFF08\u5982\u679C\u53EF\u80FD\uFF09\uFF0C\u800C\u5B8C\u5168\u52A0\u8F7D\u7684\u5A92\u4F53\u4F7F\u7528 blob \u6216\u6570\u636E URL\u3002"
		},
		"This will allow the popup to open for partially loaded media, but this might break images that require custom headers to display properly.\nPartially loaded media will contain the source URL directly (where possible), whereas fully loaded media will use a blob or data URL.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "description_userscript"
					}
				]
			},
			"zh-CN": "\u8FD9\u5C06\u5141\u8BB8\u4E3A\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u6253\u5F00\u5F39\u7A97\uFF0C\u4F46\u8FD9\u53EF\u80FD\u5BFC\u81F4\u9700\u8981\u81EA\u5B9A\u4E49\u6807\u5934\u624D\u80FD\u6B63\u786E\u663E\u793A\u7684\u56FE\u50CF\u51FA\u9519\u3002\n\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u5C06\u76F4\u63A5\u5305\u542B\u6E90 URL\uFF08\u5982\u679C\u53EF\u80FD\uFF09\uFF0C\u800C\u5B8C\u5168\u52A0\u8F7D\u7684\u5A92\u4F53\u4F7F\u7528 blob \u6216\u6570\u636E URL\u3002"
		},
		"Streams": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "options.video.name"
					}
				]
			},
			"zh-CN": "\u6570\u636E\u6D41"
		},
		"Audio and video": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "options.video.description"
					}
				]
			},
			"zh-CN": "\u97F3\u9891\u548C\u89C6\u9891"
		},
		"Media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "options.media.name"
					}
				]
			},
			"zh-CN": "\u591A\u5A92\u4F53"
		},
		"Images, audio, and video": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_partial",
						"field": "options.media.description"
					}
				]
			},
			"zh-CN": "\u56FE\u50CF\u3001\u97F3\u9891\u548C\u89C6\u9891"
		},
		"Avoid HEAD request for partially loaded media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_partial_avoid_head",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u907F\u514D\u5BF9\u5DF2\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u53D1\u51FA HEAD \u8BF7\u6C42"
		},
		"Avoids a possibly unnecessary HEAD request before displaying partially loaded images, which further decreases the delay before opening the popup. This can cause issues if the server returns an error, but still returns an image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_partial_avoid_head",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u5DF2\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u65F6\u907F\u514D\u53EF\u80FD\u4E0D\u5FC5\u8981\u7684 HEAD \u8BF7\u6C42\uFF0C\u8FD9\u80FD\u8FDB\u4E00\u6B65\u51CF\u5C11\u6253\u5F00\u5F39\u7A97\u7684\u5EF6\u8FDF\u3002\u4F46\u5982\u679C\u670D\u52A1\u5668\u8FD4\u56DE\u4E00\u4E2A\u9519\u8BEF\u7684\u540C\u65F6\u4E5F\u8FD4\u56DE\u4E86\u4E00\u4E2A\u56FE\u50CF\uFF0C\u8FD9\u53EF\u80FD\u4F1A\u5BFC\u81F4\u95EE\u9898"
		},
		"Use `blob:` over `data:` URLs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_use_blob_over_data",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 blob: \u4EE3\u66FF data: URL"
		},
		"Blob URLs are more efficient, but aren't supported by earlier browsers. Some websites also block `blob:` URLs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_use_blob_over_data",
						"field": "description"
					}
				]
			},
			"zh-CN": "Blob URL \u6548\u7387\u66F4\u4F73\uFF0C\u4F46\u65E9\u671F\u7248\u672C\u7684\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u3002\u4E00\u4E9B\u7F51\u7AD9\u4E5F\u5C4F\u853D\u4E86 Blob: URL"
		},
		"Load media anonymously": {
			"_info": {
				"instances": [
					{
						"setting": "popup_use_anonymous_crossorigin",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u533F\u540D\u52A0\u8F7D\u5A92\u4F53"
		},
		"Loads the media without sending any cookies or other forms of credentials. This is required to screenshot videos from other sources": {
			"_info": {
				"instances": [
					{
						"setting": "popup_use_anonymous_crossorigin",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u52A0\u8F7D\u5A92\u4F53\u800C\u4E0D\u53D1\u9001\u4EFB\u4F55 Cookie \u6216\u5176\u4ED6\u5F62\u5F0F\u7684\u51ED\u636E\u3002\u8FD9\u9700\u8981\u6709\u5176\u4ED6\u6765\u6E90\u7684\u89C6\u9891\u622A\u56FE"
		},
		"Use `not-allowed` cursor when unsupported": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_notallowed",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0D\u652F\u6301\u65F6\u7ED9\u51FA\u9F20\u6807\u6307\u9488\u201C\u7981\u6B62\u201D"
		},
		"If the image isn't supported, the mouse cursor will change to a `not-allowed` cursor for a brief duration": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_notallowed",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u9047\u5230\u4E0D\u652F\u6301\u7684\u56FE\u50CF\uFF0C\u9F20\u6807\u6307\u9488\u5C06\u6682\u65F6\u53D8\u4E3A\u201C\u7981\u6B62\u201D\u56FE\u6848"
		},
		"Use `not-allowed` cursor when unable to load": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_notallowed_cant_load",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u65E0\u6CD5\u52A0\u8F7D\u65F6\u7ED9\u51FA\u9F20\u6807\u6307\u9488\u201C\u7981\u6B62\u201D"
		},
		"If the image fails to load, the mouse cursor will change to a `not-allowed` cursor for a brief duration": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_notallowed_cant_load",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u56FE\u50CF\u4E0B\u8F7D\u5931\u8D25\uFF0C\u9F20\u6807\u6307\u9488\u5C06\u6682\u65F6\u53D8\u4E3A\u201C\u7981\u6B62\u201D\u56FE\u6848"
		},
		"`not-allowed` cursor duration": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_notallowed_duration",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u201C\u7981\u6B62\u201D\u6307\u9488\u6301\u7EED\u65F6\u95F4"
		},
		"How long the `not-allowed` cursor should last": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_notallowed_duration",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u201C\u7981\u6B62\u201D\u6307\u9488\u7684\u663E\u793A\u6301\u7EED\u591A\u4E45"
		},
		"Exclude page background": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_page_bg",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u9875\u9762\u80CC\u666F"
		},
		"Excludes the page background for the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_page_bg",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u907F\u514D\u4E3A\u9875\u9762\u80CC\u666F\u663E\u793A\u5F39\u7A97"
		},
		"Minimum size": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_minimum_size",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u5C0F\u5C3A\u5BF8"
		},
		"Smallest size acceptable for the popup to open (this option is ignored for background images). This refers to the size of the media to be popped up, which may differ from the source media.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_minimum_size",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u591A\u5C0F\u7684\u56FE\u50CF\u663E\u793A\u5F39\u7A97\u3002\u80CC\u666F\u56FE\u50CF\u4E0D\u88AB\u6B64\u9009\u9879\u6DB5\u76D6\u3002\u8FD9\u6307\u5C06\u8981\u5F39\u7A97\u663E\u793A\u7684\u5A92\u4F53\u5927\u5C0F\uFF0C\u8FD9\u53EF\u80FD\u4E0E\u6E90\u5A92\u4F53\u4E0D\u540C\u3002"
		},
		"Maximum source size": {
			"_info": {
				"instances": [
					{
						"setting": "popup_maximum_source_size",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u5927\u6E90\u5C3A\u5BF8"
		},
		"Maximum size (width/height) for the source media to allow popping up (this option is ignored for background images). Set to `0` for any size.": {
			"_info": {
				"instances": [
					{
						"setting": "popup_maximum_source_size",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4EE5\u6E90\u5A92\u4F53\u663E\u793A\u5F39\u7A97\u7684\u6700\u5927\u5C3A\u5BF8\uFF08\u5BBD\u5EA6/\u9AD8\u5EA6\uFF09\uFF08\u5BF9\u80CC\u666F\u56FE\u50CF\u6765\u8BF4\u6B64\u9009\u9879\u65E0\u6548)\u3002\u8BBE\u4E3A 0 \u8868\u793A\u4EFB\u610F\u5927\u5C0F\u3002"
		},
		"Exclude `background-image`s": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_backgroundimages",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u80CC\u666F\u56FE\u50CF"
		},
		"Excludes `background-image`s for the popup. Might prevent the popup from working on many images": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_backgroundimages",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0D\u4E3A\u80CC\u666F\u56FE\u50CF\u663E\u793A\u5F39\u7A97\u3002\u53EF\u80FD\u4F7F\u5F88\u591A\u56FE\u50CF\u4E0A\u4E0D\u663E\u793A\u5F39\u7A97"
		},
		"Exclude image tabs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_imagetab",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u56FE\u50CF\u6807\u7B7E\u9875"
		},
		"Excludes images that are opened in their own tabs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_imagetab",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u5728\u5355\u72EC\u7684\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u7684\u56FE\u50CF"
		},
		"Exclude if media URL is unchanged": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_sameimage",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u65E0\u53D8\u5316\u7684\u5A92\u4F53 URL"
		},
		"Don't pop up if the new URL is the same as the source": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_sameimage",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u65B0 URL \u4E0E\u6E90 URL \u76F8\u540C\u5219\u4E0D\u5F39\u51FA"
		},
		"Only popup for linked media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_only_links",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4EC5\u5F39\u51FA\u94FE\u63A5\u5F62\u5F0F\u7684\u5A92\u4F53"
		},
		"Don't pop up if the media isn't hyperlinked": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_only_links",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0D\u5F39\u51FA\u975E\u8D85\u94FE\u63A5\u5F62\u5F0F\u7684\u5A92\u4F53"
		},
		"Popup link for linked media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_linked_image",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u94FE\u63A5\u7684\u5A92\u4F53\u5F39\u7A97\u94FE\u63A5"
		},
		"If the linked media cannot be made larger, pop up for the link instead of the media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_linked_image",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u94FE\u63A5\u7684\u5A92\u4F53\u4E0D\u80FD\u53D8\u5927\uFF0C\u5F39\u51FA\u8BE5\u94FE\u63A5\u800C\u975E\u5A92\u4F53"
		},
		"Exclude image maps": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_imagemaps",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6392\u9664\u56FE\u50CF\u96C6"
		},
		"Don't pop up if the image is an image map (image with multiple clickable areas)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_exclude_imagemaps",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0D\u5F39\u51FA\u6709\u591A\u4E2A\u53EF\u70B9\u51FB\u533A\u57DF\u7684\u56FE\u50CF\u96C6\uFF08image map\uFF09"
		},
		"Autoplay": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_autoplay",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u81EA\u52A8\u64AD\u653E"
		},
		"Play automatically once the popup is opened": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_autoplay",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u6253\u5F00\u540E\u81EA\u52A8\u64AD\u653E"
		},
		"Show video controls": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_controls",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u89C6\u9891\u63A7\u4EF6"
		},
		"Shows native video controls. Note that this prevents dragging under Firefox": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_controls",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u663E\u793A\u539F\u751F\u89C6\u9891\u63A7\u4EF6\uFF08\u89C6\u9891\u63A7\u5236\u6309\u94AE\uFF09\u3002\u6CE8\u610F\uFF0C\u8FD9\u4F1A\u963B\u6B62\u5728 Firefox \u4E2D\u62D6\u62FD"
		},
		"Toggle video controls": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_controls_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u89C6\u9891\u63A7\u4EF6"
		},
		"Key to toggle whether the video controls are shown": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_controls_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u662F\u5426\u663E\u793A\u89C6\u9891\u63A7\u4EF6\u7684\u6309\u952E"
		},
		"Loop": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_loop",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5FAA\u73AF"
		},
		"Allows the media to automatically restart to the beginning after finishing playing": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_loop",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u662F\u5426\u5141\u8BB8\u5A92\u4F53\u64AD\u653E\u5B8C\u6BD5\u540E\u81EA\u52A8\u91CD\u65B0\u5F00\u59CB\u64AD\u653E"
		},
		"Max duration for looping": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_autoloop_max",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5FAA\u73AF\u6700\u957F\u6301\u7EED\u65F6\u95F4"
		},
		"Media longer than the specified duration will not be automatically looped. Setting this to `0` will always enable looping, regardless of duration.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_autoloop_max",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8D85\u8FC7\u6307\u5B9A\u65F6\u95F4\u540E\u5A92\u4F53\u4E0D\u518D\u81EA\u52A8\u5FAA\u73AF\u64AD\u653E\u3002\u8BBE\u4E3A 0 \u5219\u59CB\u7EC8\u5FAA\u73AF\uFF0C\u4E0D\u9650\u5236\u6301\u7EED\u65F6\u95F4\u3002"
		},
		"Play/pause key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_playpause_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u64AD\u653E/\u6682\u505C\u952E"
		},
		"Key to toggle whether the media is playing or paused": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_playpause_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u5A92\u4F53\u7684\u64AD\u653E/\u6682\u505C\u7684\u6309\u952E"
		},
		"Mute": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_muted",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9759\u97F3"
		},
		"Mutes the media by default": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_muted",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9ED8\u8BA4\u5C06\u5A92\u4F53\u9759\u97F3"
		},
		"Toggle mute key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_mute_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u9759\u97F3\u952E"
		},
		"Key to toggle mute": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_mute_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u9759\u97F3\u7684\u6309\u952E"
		},
		"Default volume": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9ED8\u8BA4\u97F3\u91CF"
		},
		"Default volume for the media": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5A92\u4F53\u7684\u9ED8\u8BA4\u97F3\u91CF"
		},
		"Volume up key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_up_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u97F3\u91CF\u8C03\u9AD8\u952E"
		},
		"Key to increase the volume": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_up_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u589E\u5927\u97F3\u91CF\u7684\u6309\u952E"
		},
		"Volume down key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_down_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u97F3\u91CF\u8C03\u4F4E\u952E"
		},
		"Key to decrease the volume": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_down_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u51CF\u5C0F\u97F3\u91CF\u7684\u6309\u952E"
		},
		"Volume change amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_change_amt",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u97F3\u91CF\u53D8\u5316\u767E\u5206\u6BD4"
		},
		"Percent for volume to increase/decrease when using the volume up/down keys": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume_change_amt",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u97F3\u91CF\u8C03\u9AD8/\u8C03\u4F4E\u952E\u65F6\uFF0C\u97F3\u91CF\u589E\u51CF\u7684\u767E\u5206\u6BD4"
		},
		"Resume playback from source": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_resume_from_source",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4ECE\u6E90\u5730\u5740\u7EE7\u7EED\u64AD\u653E"
		},
		"If enabled, playback will resume from where the source left off": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_resume_from_source",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u540E\uFF0C\u64AD\u653E\u5C06\u4ECE\u6E90\u5A92\u4F53\u4E2D\u505C\u6B62\u7684\u8FDB\u5EA6\u7EE7\u7EED"
		},
		"Resume if different length": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_resume_if_different",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u957F\u5EA6\u4E0D\u540C\u4E5F\u7EE7\u7EED\u64AD\u653E"
		},
		"If disabled, it will not resume if the source has a different length from the media in the popup (e.g. from a preview video to a full one)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_resume_if_different",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7981\u7528\u540E\uFF0C\u5982\u679C\u6E90\u5A92\u4F53\u4E0E\u5F39\u51FA\u7684\u5A92\u4F53\u7684\u65F6\u957F\u4E0D\u540C\uFF08\u4F8B\u5982\u9884\u89C8\u89C6\u9891\u4E0E\u5B8C\u6574\u89C6\u9891\u7684\u533A\u522B\uFF09\uFF0C\u5219\u4E0D\u7EE7\u7EED\u64AD\u653E"
		},
		"Pause source": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_pause_source",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6682\u505C\u6E90\u5A92\u4F53"
		},
		"Pauses the source once the popup has opened": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_pause_source",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u6253\u5F00\u540E\u6682\u505C\u6E90\u5A92\u4F53"
		},
		"Seek amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_amount",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8FDB\u9000\u8DDD\u79BB"
		},
		"Amount of time to seek forward/back when using the seek keys": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_amount",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u5FEB\u8FDB/\u5FEB\u9000\u6309\u952E\u65F6\u524D\u8FDB/\u540E\u9000\u7684\u65F6\u95F4\u91CF"
		},
		"Seek left key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_left_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5FEB\u9000\u952E"
		},
		"Key to seek backwards by the specified amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_left_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5411\u5DE6\u4FA7\uFF08\u4E4B\u524D\uFF09\u5FEB\u901F\u79FB\u52A8\u6307\u5B9A\u65F6\u957F\u7684\u6309\u952E"
		},
		"Seek right key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_right_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5FEB\u8FDB\u952E"
		},
		"Key to seek forwards by the specified amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_seek_right_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5411\u53F3\u4FA7\uFF08\u4E4B\u540E\uFF09\u5FEB\u901F\u79FB\u52A8\u6307\u5B9A\u65F6\u957F\u7684\u6309\u952E"
		},
		"Previous frame key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_frame_prev_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0A\u4E00\u5E27\u6309\u952E"
		},
		"Rewinds the video one \"frame\" backward. Due to current limitations, the frame size is static (but configurable), and might not match the video's framerate": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_frame_prev_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u89C6\u9891\u5012\u56DE\u524D\u4E00\u5E27\u3002\u7531\u4E8E\u5F53\u524D\u7684\u9650\u5236\uFF0C\u5E27\u5927\u5C0F\u662F\u9759\u6001\u7684\uFF08\u4F46\u53EF\u914D\u7F6E\uFF09\uFF0C\u53EF\u80FD\u4E0E\u89C6\u9891\u7684\u5E27\u901F\u7387\u4E0D\u5339\u914D"
		},
		"Next frame key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_frame_next_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u4E00\u5E27\u6309\u952E"
		},
		"Advances the video one \"frame\" forward. Due to current limitations, the frame size is static (but configurable), and might not match the video's framerate": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_frame_next_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u89C6\u9891\u79FB\u5165\u4E0B\u4E00\u5E27\u3002\u7531\u4E8E\u5F53\u524D\u7684\u9650\u5236\uFF0C\u5E27\u5927\u5C0F\u662F\u9759\u6001\u7684\uFF08\u4F46\u53EF\u914D\u7F6E\uFF09\uFF0C\u53EF\u80FD\u4E0E\u89C6\u9891\u7684\u5E27\u901F\u7387\u4E0D\u5339\u914D"
		},
		"Frame rate": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_framerate",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5E27\u901F\u7387"
		},
		"Frame rate for videos to seek forward/back with the next/previous frame keys": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_framerate",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5E27\u901F\u7387\u7528\u4E8E\u89C6\u9891\u7684\u5FEB\u8FDB/\u5FEB\u9000\u6309\u952E"
		},
		"FPS": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_framerate",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u6BCF\u79D2\u5E27\u6570\uFF08FPS\uFF09"
		},
		"Speed down key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_down_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u51CF\u901F\u952E"
		},
		"Key to decrease playback rate by a specified amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_down_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u952E\u53EF\u4EE5\u5C06\u64AD\u653E\u901F\u7387\u964D\u4F4E\u6307\u5B9A\u7684\u989D\u5EA6"
		},
		"Speed up key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_up_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u52A0\u901F\u952E"
		},
		"Key to increase playback rate by a specified amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_up_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u952E\u53EF\u4EE5\u5C06\u64AD\u653E\u901F\u7387\u63D0\u5347\u6307\u5B9A\u7684\u989D\u5EA6"
		},
		"Speed up/down amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_amount",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u52A0\u901F/\u51CF\u901F\u91CF"
		},
		"How much to increase/decrease the playback rate": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_amount",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u589E\u52A0/\u51CF\u5C11\u7684\u64AD\u653E\u901F\u7387"
		},
		"Reset speed key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_reset_speed_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u91CD\u7F6E\u901F\u5EA6\u952E"
		},
		"Resets the playback rate to normal speed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_reset_speed_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u64AD\u653E\u901F\u5EA6\u91CD\u7F6E\u4E3A\u6B63\u5E38\u901F\u5EA6"
		},
		"Screenshot key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_screenshot_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5C4F\u5E55\u622A\u56FE\u952E"
		},
		"Screenshots the current frame in the video": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_screenshot_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5BF9\u89C6\u9891\u4E2D\u7684\u5F53\u524D\u5E27\u622A\u56FE"
		},
		"Screenshot format": {
			"_info": {
				"instances": [
					{
						"setting": "popup_video_screenshot_format",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u622A\u56FE\u683C\u5F0F"
		},
		"File format to save the screenshot in": {
			"_info": {
				"instances": [
					{
						"setting": "popup_video_screenshot_format",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4FDD\u5B58\u622A\u56FE\u7684\u6587\u4EF6\u683C\u5F0F"
		},
		"PNG": {
			"_info": {
				"instances": [
					{
						"setting": "popup_video_screenshot_format",
						"field": "options.png.name"
					}
				]
			},
			"zh-CN": "PNG"
		},
		"JPG": {
			"_info": {
				"instances": [
					{
						"setting": "popup_video_screenshot_format",
						"field": "options.jpg.name"
					}
				]
			},
			"zh-CN": "JPG"
		},
		"Enable subtitles": {
			"_info": {
				"instances": [
					{
						"setting": "popup_enable_subtitles",
						"field": "name"
					}
				]
			}
		},
		"Enables subtitles to be overlayed on top of the video": {
			"_info": {
				"instances": [
					{
						"setting": "popup_enable_subtitles",
						"field": "description"
					}
				]
			}
		},
		"Popup UI": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u754C\u9762"
		},
		"Enables a UI on top of the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5F39\u7A97\u4E0A\u7684\u754C\u9762"
		},
		"UI Toggle key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_toggle_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u754C\u9762\u5207\u6362\u952E"
		},
		"Toggles the display of the UI": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_toggle_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u754C\u9762\u7684\u663E\u793A\u65B9\u5F0F"
		},
		"Opacity": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_opacity",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0D\u900F\u660E\u5EA6"
		},
		"Opacity of the UI on top of the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_opacity",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u4E0A\u754C\u9762\u7684\u4E0D\u900F\u660E\u5EA6"
		},
		"Use safe glyphs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_use_safe_glyphs",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u5B89\u5168\u5B57\u5F62"
		},
		"Uses glyphs that are more likely to be available on all fonts. Enable this option if the following characters render as boxes: \uD83E\uDC47 \uD83E\uDC50 \uD83E\uDC52. The 'Noto Sans Symbols2' font contains these characters.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_use_safe_glyphs",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u66F4\u53EF\u80FD\u9002\u7528\u4E8E\u6240\u6709\u5B57\u4F53\u7684\u5B57\u5F62\u3002\u542F\u7528\u6B64\u9009\u9879\uFF0C\u5982\u679C\u4E0B\u5217\u5B57\u7B26\u5448\u73B0\u4E3A\u65B9\u6846\uFF1A\uD83E\uDC47 \uD83E\uDC50 \uD83E\uDC52\u3002\u201CNoto Sans symboss2\u201D\u5B57\u4F53\u5305\u542B\u8FD9\u4E9B\u5B57\u7B26\u3002"
		},
		"Media resolution": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_imagesize",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5A92\u4F53\u5206\u8FA8\u7387"
		},
		"Displays the original media dimensions on top of the UI.\nCSS ID: `#sizeinfo`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_imagesize",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u754C\u9762\u4E0A\u663E\u793A\u539F\u59CB\u5A92\u4F53\u5C3A\u5BF8\u3002\nCSS ID: `#sizeinfo`"
		},
		"Zoom percent": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_zoomlevel",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F29\u653E\u767E\u5206\u6BD4"
		},
		"Displays the current zoom level on top of the UI.\nCSS ID: `#sizeinfo`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_zoomlevel",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u754C\u9762\u4E0A\u663E\u793A\u5F53\u524D\u7684\u7F29\u653E\u7EA7\u522B\u3002\nCSS ID: `#sizeinfo`"
		},
		"File size": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_filesize",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6587\u4EF6\u5927\u5C0F"
		},
		"Displays the media's file size on top of the UI. For the moment, this will not work with partially loaded media if 'Avoid HEAD request for partially loaded media' is enabled.\nCSS ID: `#sizeinfo`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_filesize",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u754C\u9762\u4E0A\u663E\u793A\u5A92\u4F53\u7684\u6587\u4EF6\u5927\u5C0F\u3002\u76EE\u524D\uFF0C\u5982\u679C\u542F\u7528\u4E86\u201C\u907F\u514D\u5BF9\u90E8\u5206\u52A0\u8F7D\u7684\u5A92\u4F53\u4F7F\u7528 HEAD \u8BF7\u6C42\u201D\uFF0C\u5219\u6B64\u9879\u65E0\u6548\u3002\nCSS ID: `#sizeinfo`"
		},
		"Gallery counter": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerycounter",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93\u8BA1\u6570\u5668"
		},
		"Enables a gallery counter on top of the UI.\nCSS ID: `#gallerycounter`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerycounter",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u754C\u9762\u4E0A\u7684\u56FE\u5E93\u8BA1\u6570\u5668\u3002\nCSS ID: `#gallerycounter`"
		},
		"Gallery counter max": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerymax",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93\u8BA1\u6570\u5668\u4E0A\u9650"
		},
		"Maximum amount of images to check in the counter (this can be slightly CPU-intensive)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerymax",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8BE5\u8BA1\u6570\u5668\u663E\u793A\u56FE\u50CF\u6570\u91CF\u4E0A\u9650\uFF08\u53EF\u80FD\u6D88\u8017\u8F83\u591A CPU \u8D44\u6E90\uFF09"
		},
		"Gallery buttons": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerybtns",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93\u6309\u94AE"
		},
		"Enables buttons to go left/right in the gallery.\nCSS IDs: `#galleryprevbtn`, `#gallerynextbtn`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerybtns",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5728\u56FE\u5E93\u4E2D\u5411\u5DE6/\u53F3\u79FB\u52A8\u7684\u6309\u94AE\u3002\nCSS IDs: `#galleryprevbtn`, `#gallerynextbtn`"
		},
		"Close Button": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_closebtn",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5173\u95ED\u6309\u94AE"
		},
		"Enables a button to close the popup.\nCSS ID: `#closebtn`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_closebtn",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5173\u95ED\u5F53\u524D\u5F39\u7A97\u7684\u6309\u94AE\u3002\nCSS ID: `#closebtn`"
		},
		"Options Button": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_optionsbtn",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9009\u9879\u6309\u94AE"
		},
		"Enables a button to go to this page.\nCSS ID: `#optionsbtn`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_optionsbtn",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u8BBF\u95EE\u9009\u9879\u9875\u9762\uFF08\u672C\u9875\u9762\uFF09\u7684\u6309\u94AE\u3002\nCSS ID: `#optionsbtn`"
		},
		"Download Button": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_downloadbtn",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u6309\u94AE"
		},
		"Enables a button to download the image.\nCSS ID: `#downloadbtn`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_downloadbtn",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u4E0B\u8F7D\u8BE5\u56FE\u50CF\u7684\u6309\u94AE\u3002\nCSS ID: `#downloadbtn`"
		},
		"Rotation Buttons": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_rotationbtns",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u65CB\u8F6C\u6309\u94AE"
		},
		"Enables buttons on the UI to rotate the image by 90 degrees.\nCSS IDs: `#rotleftbtn`, `#rotrightbtn`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_rotationbtns",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5728\u754C\u9762\u4E0A\u5C06\u56FE\u50CF\u65CB\u8F6C 90 \u5EA6\u7684\u6309\u94AE\u3002\nCSS IDs: `#rotleftbtn`, `#rotrightbtn`"
		},
		"Caption": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_caption",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6807\u9898"
		},
		"Shows the image's caption (if available) at the top.\nCSS ID: `#caption`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_caption",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u9876\u7AEF\u663E\u793A\u56FE\u50CF\u7684\u6807\u9898\uFF08\u5982\u679C\u53EF\u7528\uFF09\u3002\nCSS ID: `#caption`"
		},
		"Wrap caption text": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_wrap_caption",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6807\u9898\u6587\u672C\u6362\u884C"
		},
		"Wraps the caption if it's too long": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_wrap_caption",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6807\u9898\u6587\u672C\u592A\u957F\u65F6\u81EA\u52A8\u6362\u884C"
		},
		"Link original page in caption": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_caption_link_page",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6807\u9898\u94FE\u63A5\u539F\u59CB\u9875\u9762"
		},
		"Links the original page (if it exists) in the caption": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_caption_link_page",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u6807\u9898\u94FE\u63A5\u5230\u539F\u59CB\u9875\u9762\uFF08\u5982\u6709\uFF09"
		},
		"Underline links": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_link_underline",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u94FE\u63A5\u4E0B\u5212\u7EBF"
		},
		"Adds an underline to links (such as the original page)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_link_underline",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5411\u94FE\u63A5\uFF08\u5982\u539F\u59CB\u9875\u9762\uFF09\u6DFB\u52A0\u4E0B\u5212\u7EBF"
		},
		"Keep popup open until": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u5F39\u7A97\u5F00\u542F\u76F4\u5230"
		},
		"Closes the popup when the selected condition is met": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6EE1\u8DB3\u9009\u5B9A\u6761\u4EF6\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Any trigger is released": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_behavior",
						"field": "options.any.name"
					}
				]
			},
			"zh-CN": "\u677E\u5F00\u4EFB\u4F55\u89E6\u53D1\u5668"
		},
		"All triggers are released": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_behavior",
						"field": "options.all.name"
					}
				]
			},
			"zh-CN": "\u677E\u5F00\u5168\u90E8\u89E6\u53D1\u5668"
		},
		"ESC/Close is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_behavior",
						"field": "options.esc.name"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B ESC/Close"
		},
		"Don't close until mouse leaves": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_need_mouseout",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u79FB\u5F00\u524D\u4E0D\u5173\u95ED"
		},
		"If true, this keeps the popup open even if all triggers are released if the mouse is still over the image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_need_mouseout",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u542F\u7528\uFF0C\u677E\u5F00\u6240\u6709\u89E6\u53D1\u5668\u540E\uFF0C\u5047\u5982\u9F20\u6807\u4ECD\u60AC\u505C\u5728\u56FE\u50CF\u4E0A\uFF0C\u5F39\u7A97\u4FDD\u6301\u5F00\u542F"
		},
		"Threshold to leave image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_jitter_threshold",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u79FB\u5F00\u56FE\u50CF\u7684\u95E8\u9650\u503C"
		},
		"How many pixels outside of the image before the cursor is considered to have left the image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_jitter_threshold",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u79BB\u5F00\u56FE\u50CF\u5916\u7F18\u591A\u5C11\u50CF\u7D20\u89C6\u4F5C\u79FB\u5F00\u56FE\u50CF"
		},
		"Leaving thumbnail cancels loading": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_when_elout",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u79BB\u5F00\u7F29\u7565\u56FE\u5219\u53D6\u6D88\u52A0\u8F7D"
		},
		"Cancels the current popup loading when the cursor has left the thumbnail image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_when_elout",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u79BB\u5F00\u7F29\u7565\u56FE\u65F6\u53D6\u6D88\u5F53\u524D\u5F39\u7A97\u7684\u52A0\u8F7D"
		},
		"ESC cancels loading": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_with_esc",
						"field": "name"
					}
				]
			},
			"zh-CN": "ESC \u952E\u53D6\u6D88\u52A0\u8F7D"
		},
		"Cancels the current popup loading if ESC is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_with_esc",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B ESC \u952E\u65F6\u53D6\u6D88\u5F53\u524D\u5F39\u7A97\u7684\u52A0\u8F7D"
		},
		"Releasing triggers cancels loading": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_when_release",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u677E\u5F00\u89E6\u53D1\u5668\u53D6\u6D88\u52A0\u8F7D"
		},
		"Cancels the current popup loading if all/any triggers are released (as set by the \"Keep popup open until\" setting)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_cancel_popup_when_release",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u677E\u5F00\u4E86\u6240\u6709/\u4EFB\u4F55\u89E6\u53D1\u5668\uFF0C\u5E76\u4E14\u8BBE\u7F6E\u4E86\u201C\u4FDD\u6301\u5F39\u7A97\u5F00\u542F\u76F4\u5230\u201D\uFF0C\u53D6\u6D88\u5F53\u524D\u7684\u5F39\u7A97\u52A0\u8F7D"
		},
		"Automatically close after timeout": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_auto_close_popup",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8D85\u65F6\u540E\u81EA\u52A8\u5173\u95ED"
		},
		"Closes the popup automatically after a specified period of time has elapsed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_auto_close_popup",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6307\u5B9A\u65F6\u95F4\u540E\u81EA\u52A8\u5173\u95ED\u5F39\u7A97"
		},
		"Timeout to close popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_auto_close_popup_time",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5173\u95ED\u5F39\u7A97\u7684\u8D85\u65F6"
		},
		"Amount of time to elapse before automatically closing the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_auto_close_popup_time",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u591A\u4E45\u540E\u81EA\u52A8\u5173\u95ED\u5F39\u7A97"
		},
		"Hold key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u952E"
		},
		"Hold key that, when pressed, will keep the popup open": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4F4F\u6B64\u952E\u65F6\u5C06\u4FDD\u6301\u5F39\u7A97\u5F00\u542F"
		},
		"Center popup on hold": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_position_center",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u65F6\u5F39\u7A97\u5C45\u4E2D"
		},
		"Centers the popup to the middle of the page when the popup is held": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_position_center",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u4FDD\u6301\u5448\u73B0\u4E8E\u9875\u9762\u6B63\u4E2D\u5FC3"
		},
		"Override zoom on hold": {
			"_info": {
				"instances": [
					{
						"setting": "popup_hold_zoom",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u65F6\u8986\u76D6\u7F29\u653E"
		},
		"Overrides the zoom when the popup is held": {
			"_info": {
				"instances": [
					{
						"setting": "popup_hold_zoom",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u5F39\u7A97\u65F6\u8986\u76D6\u7F29\u653E\u7EA7\u522B"
		},
		"Close popup on unhold": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_close_unhold",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53D6\u6D88\u4FDD\u6301\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Closes the popup when the hold key is pressed again, after having previously held the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_close_unhold",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u66FE\u7ECF\u4FDD\u6301\u5F39\u7A97\u540E\uFF0C\u518D\u6B21\u6309\u4E0B\u4FDD\u6301\u952E\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Enable pointer events on hold": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_unclickthrough",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u671F\u95F4\u542F\u7528\u6307\u9488\u4E8B\u4EF6"
		},
		"Enables previously disabled pointer events when the popup is held": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hold_unclickthrough",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u4FDD\u6301\u671F\u95F4\u542F\u7528\u5148\u524D\u7981\u7528\u7684\u6307\u9488\u4E8B\u4EF6"
		},
		"Clicking outside the popup closes": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_click_outside",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u70B9\u51FB\u5F39\u7A97\u5916\u5173\u95ED"
		},
		"Closes the popup when the mouse clicks outside of it": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_click_outside",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u5728\u5F39\u7A97\u5916\u5355\u51FB\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Close when leaving": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_el_policy",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u79BB\u5F00\u65F6\u5173\u95ED"
		},
		"Closes the popup when the mouse leaves the thumbnail element, the popup, or both": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_el_policy",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u79FB\u51FA\u7F29\u7565\u56FE\u5143\u7D20\u3001\u5F39\u7A97\u6216\u4E0A\u8FF0\u4E24\u8005\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Thumbnail": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_el_policy",
						"field": "options.thumbnail.name"
					}
				]
			},
			"zh-CN": "\u7F29\u7565\u56FE"
		},
		"Both": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_el_policy",
						"field": "options.both.name"
					}
				]
			},
			"zh-CN": "\u4E0A\u8FF0\u4E24\u8005"
		},
		"Use invisible element when waiting": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_wait_use_el",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7B49\u5F85\u65F6\u4F7F\u7528\u9690\u5F62\u5143\u7D20"
		},
		"Creates an invisible element under the cursor when waiting for the popup instead of a style element (can improve performance on websites with many elements, but prevents the cursor from clicking anything while loading the popup)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_wait_use_el",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u7B49\u5F85\u5F39\u7A97\u65F6\u5728\u9F20\u6807\u6307\u9488\u4E0B\u65B9\u521B\u5EFA\u4E00\u4E2A\u9690\u5F62\u5143\u7D20\uFF08\u800C\u975E\u6837\u5F0F\u5143\u7D20\uFF09\uFF08\u53EF\u4EE5\u6539\u5584\u6709\u5927\u91CF\u5143\u7D20\u7684\u7F51\u7AD9\u6027\u80FD\uFF0C\u4F46\u8FD9\u4F1A\u963B\u6B62\u52A0\u8F7D\u671F\u95F4\u9F20\u6807\u70B9\u51FB\u4EFB\u4F55\u4E1C\u897F\uFF09"
		},
		"Add popup link to history": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_to_history",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6DFB\u52A0\u5F39\u51FA\u7684\u94FE\u63A5\u5230\u5386\u53F2\u8BB0\u5F55"
		},
		"Adds the image/video link opened through the popup to the browser's history": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_to_history",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u901A\u8FC7\u5F39\u7A97\u6253\u5F00\u7684\u56FE\u50CF/\u89C6\u9891\u94FE\u63A5\u6DFB\u52A0\u5230\u6D4F\u89C8\u5668\u7684\u5386\u53F2\u8BB0\u5F55"
		},
		"Allow inter-frame communication": {
			"_info": {
				"instances": [
					{
						"setting": "allow_remote",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u6846\u67B6\u95F4\u901A\u4FE1"
		},
		"Allows communication between frames in windows, improving support for keybindings": {
			"_info": {
				"instances": [
					{
						"setting": "allow_remote",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u7A97\u53E3\u4E2D\u7684\u6846\u67B6\u95F4\u901A\u4FE1\uFF0C\u6539\u5584\u5BF9\u5FEB\u6377\u952E\u7ED1\u5B9A\u7684\u652F\u6301"
		},
		"Allows communication between frames in windows, improving support for keybindings. Can pose a fingerprinting risk when used through the userscript": {
			"_info": {
				"instances": [
					{
						"setting": "allow_remote",
						"field": "description_userscript"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u7A97\u53E3\u4E2D\u7684\u6846\u67B6\u95F4\u901A\u4FE1\uFF0C\u6539\u5584\u5BF9\u5FEB\u6377\u952E\u7ED1\u5B9A\u7684\u652F\u6301\u3002\u901A\u8FC7\u7528\u6237\u811A\u672C\u4F7F\u7528\u65F6\uFF0C\u4E5F\u8BB8\u4F1A\u6784\u6210\u6307\u7EB9\u8BC6\u522B\u7684\u98CE\u9669"
		},
		"Pop out of frames": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_use_remote",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8DF3\u51FA\u6846\u67B6"
		},
		"Opens the popup on the top frame instead of within iframes. This option is still experimental.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_use_remote",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u6846\u67B6\u5916\u800C\u975E\u6846\u67B6\u5185\u6253\u5F00\u5F39\u7A97\u3002\u6B64\u9009\u9879\u4ECD\u5904\u4E8E\u8BD5\u9A8C\u9636\u6BB5\u3002"
		},
		"Popup default zoom": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u9ED8\u8BA4\u7F29\u653E\u7EA7\u522B"
		},
		"How the popup should be initially sized": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u7684\u521D\u59CB\u5C3A\u5BF8"
		},
		"Fit to screen": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "options.fit.name"
					},
					{
						"setting": "popup_hold_zoom",
						"field": "options.fit.name"
					}
				]
			},
			"zh-CN": "\u9002\u5408\u5C4F\u5E55"
		},
		"Fill screen": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "options.fill.name"
					},
					{
						"setting": "popup_hold_zoom",
						"field": "options.fill.name"
					}
				]
			},
			"zh-CN": "\u586B\u6EE1\u5C4F\u5E55"
		},
		"Full size": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "options.full.name"
					},
					{
						"setting": "popup_hold_zoom",
						"field": "options.full.name"
					}
				]
			},
			"zh-CN": "\u5168\u5C3A\u5BF8"
		},
		"Custom size": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_behavior",
						"field": "options.custom.name"
					}
				]
			},
			"zh-CN": "\u81EA\u5B9A\u4E49\u5C3A\u5BF8"
		},
		"Custom zoom percent": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_custom_percent",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u81EA\u5B9A\u4E49\u7F29\u653E\u767E\u5206\u6BD4"
		},
		"Custom percent to initially size the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_custom_percent",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u81EA\u5B9A\u4E49\u76F8\u5BF9\u4E8E\u521D\u59CB\u5F39\u7A97\u5927\u5C0F\u7684\u767E\u5206\u6BD4"
		},
		"%": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_volume",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_video_volume_change_amt",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_ui_opacity",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_zoom_custom_percent",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "%"
		},
		"Use last zoom": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_use_last",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u6700\u540E\u7684\u7F29\u653E\u8BBE\u7F6E"
		},
		"Use the last popup's zoom. Note that this is per-page.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_use_last",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u6700\u540E\u4E00\u4E2A\u5F39\u7A97\u7684\u7F29\u653E\u7EA7\u522B\u3002\u6CE8\u610F\uFF0C\u6B64\u7EA7\u522B\u4E0D\u8DE8\u9875\u5171\u4EAB\u3002"
		},
		"Maximum width": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_max_width",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u5927\u5BBD\u5EA6"
		},
		"Maximum width for the initial popup size. Set to `0` for unlimited.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_max_width",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u521D\u59CB\u5F39\u7A97\u5C3A\u5BF8\u7684\u6700\u5927\u5BBD\u5EA6\u3002\u8BBE\u4E3A 0 \u5219\u65E0\u9650\u5236\u3002"
		},
		"Maximum height": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_max_height",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u5927\u9AD8\u5EA6"
		},
		"Maximum height for the initial popup size. Set to `0` for unlimited.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_max_height",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u521D\u59CB\u5F39\u7A97\u5C3A\u5BF8\u7684\u6700\u5927\u9AD8\u5EA6\u3002\u8BBE\u4E3A 0 \u5219\u65E0\u9650\u5236\u3002"
		},
		"Popup panning method": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u5E73\u79FB\u65B9\u6CD5"
		},
		"How the popup should be panned when larger than the screen": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u6BD4\u5C4F\u5E55\u5927\u65F6\u5E94\u5982\u4F55\u5E73\u79FB"
		},
		"Movement": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "options.movement.name"
					}
				]
			},
			"zh-CN": "\u79FB\u52A8"
		},
		"The popup pans as you move your mouse": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "options.movement.description"
					}
				]
			},
			"zh-CN": "\u79FB\u52A8\u9F20\u6807\u65F6\u5F39\u7A97\u5E73\u79FB"
		},
		"Drag": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "options.drag.name"
					}
				]
			},
			"zh-CN": "\u62D6\u62FD"
		},
		"Clicking and dragging pans the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_pan_behavior",
						"field": "options.drag.description"
					}
				]
			},
			"zh-CN": "\u5355\u51FB\u5E76\u62D6\u62FD\u79FB\u52A8\u5F39\u7A97"
		},
		"Invert movement": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_movement_inverted",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53CD\u8F6C\u79FB\u52A8"
		},
		"Inverts the movement of the mouse. For example, if the mouse moves left, the popup moves right. If disabled, it feels more like the popup is being invisibly dragged.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_movement_inverted",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u53CD\u8F6C\u9F20\u6807\u7684\u79FB\u52A8\u3002\u4F8B\u5982\uFF0C\u5982\u679C\u9F20\u6807\u5411\u5DE6\u79FB\u52A8\uFF0C\u5F39\u7A97\u5411\u53F3\u79FB\u52A8\u3002\u5982\u679C\u7981\u7528\uFF0C\u611F\u89C9\u66F4\u50CF\u662F\u5F39\u51FA\u7A97\u53E3\u5728\u65E0\u5F62\u4E2D\u88AB\u62D6\u52A8\u3002"
		},
		"Minimum drag amount": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_drag_min",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u5C0F\u62D6\u62FD\u8D77\u59CB"
		},
		"How many pixels the mouse should move to start a drag": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_drag_min",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u79FB\u52A8\u591A\u5C11\u50CF\u7D20\u624D\u5F00\u59CB\u62D6\u62FD"
		},
		"pixels": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_minimum_size",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_jitter_threshold",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_drag_min",
						"field": "number_unit"
					},
					{
						"setting": "popup_maximum_source_size",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u50CF\u7D20"
		},
		"Vertical scroll action": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5782\u76F4\u6EDA\u52A8\u64CD\u4F5C"
		},
		"How the popup reacts to a vertical scroll/mouse wheel event": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u5982\u4F55\u5BF9\u5782\u76F4\u6EDA\u52A8/\u9F20\u6807\u6EDA\u8F6E\u4E8B\u4EF6\u505A\u51FA\u53CD\u5E94"
		},
		"Vertical scroll action (hold)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5782\u76F4\u6EDA\u52A8\u52A8\u4F5C(\u4FDD\u6301)"
		},
		"How the popup (when held) reacts to a vertical scroll/mouse wheel event": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u201C\u4FDD\u6301\u201D\u663E\u793A\u7684\u5F39\u7A97\u5982\u4F55\u5BF9\u5782\u76F4\u6EDA\u52A8/\u9F20\u6807\u6EDA\u8F6E\u4E8B\u4EF6\u505A\u51FA\u53CD\u5E94"
		},
		"Zoom": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "options.zoom.name"
					},
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "options.zoom.name"
					}
				]
			},
			"zh-CN": "\u7F29\u653E"
		},
		"Horizontal scroll action": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6C34\u5E73\u6EDA\u52A8\u52A8\u4F5C"
		},
		"How the popup reacts to a horizontal scroll/mouse wheel event": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u5982\u4F55\u5BF9\u6C34\u5E73\u6EDA\u52A8/\u9F20\u6807\u6EDA\u8F6E\u4E8B\u4EF6\u505A\u51FA\u53CD\u5E94"
		},
		"Horizontal scroll action (hold)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6C34\u5E73\u6EDA\u52A8\u52A8\u4F5C(\u4FDD\u6301)"
		},
		"How the popup (when held) reacts to a horizontal scroll/mouse wheel event": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u201C\u4FDD\u6301\u201D\u663E\u793A\u7684\u5F39\u7A97\u5982\u4F55\u5BF9\u6C34\u5E73\u6EDA\u52A8/\u9F20\u6807\u6EDA\u8F6E\u4E8B\u4EF6\u505A\u51FA\u53CD\u5E94"
		},
		"Pan": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "options.pan.name"
					},
					{
						"setting": "mouseover_scrollx_behavior",
						"field": "options.pan.name"
					},
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "options.pan.name"
					},
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "options.pan.name"
					}
				]
			},
			"zh-CN": "\u5E73\u79FB"
		},
		"Gallery": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "options.gallery.name"
					},
					{
						"setting": "mouseover_scrollx_behavior",
						"field": "options.gallery.name"
					},
					{
						"setting": "mouseover_zoom_use_last",
						"field": "options.gallery.name"
					},
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "options.gallery.name"
					},
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "options.gallery.name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93"
		},
		"Vertical video scroll action": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5782\u76F4\u89C6\u9891\u6EDA\u52A8\u52A8\u4F5C"
		},
		"Overrides the vertical scroll action for videos. Set to `Default` to avoid overriding the behavior.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8986\u76D6\u89C6\u9891\u7684\u5782\u76F4\u6EDA\u52A8\u52A8\u4F5C\u3002\u8BBE\u4E3A `\u9ED8\u8BA4` \u6765\u907F\u514D\u8986\u76D6\u8BE5\u884C\u4E3A\u3002"
		},
		"Invert vertical scroll seek": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_invert",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53CD\u8F6C\u5782\u76F4\u6EDA\u52A8\u7684\u5FEB\u8FDB/\u5FEB\u9000"
		},
		"Inverts the seek direction when scrolling vertically: Scrolling up will seek right, scrolling down will seek left.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_invert",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u5782\u76F4\u6EDA\u52A8\u65F6\u53CD\u8F6C\u79FB\u52A8\u65B9\u5411\uFF1A\u5411\u4E0A\u6EDA\u52A8\u5C06\u5411\u53F3\u79FB\u52A8\uFF0C\u5411\u4E0B\u6EDA\u52A8\u5C06\u5411\u5DE6\u79FB\u52A8\u3002"
		},
		"Horizontal video scroll action": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_video_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6C34\u5E73\u89C6\u9891\u6EDA\u52A8\u52A8\u4F5C"
		},
		"Overrides the horizontal scroll action for videos. Set to `Default` to avoid overriding the behavior.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrollx_video_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8986\u76D6\u89C6\u9891\u7684\u6C34\u5E73\u6EDA\u52A8\u52A8\u4F5C\u3002\u8BBE\u4E3A `\u9ED8\u8BA4` \u6765\u907F\u514D\u8986\u76D6\u8BE5\u884C\u4E3A\u3002"
		},
		"Default": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_behavior",
						"field": "options.default.name"
					},
					{
						"setting": "mouseover_scrollx_video_behavior",
						"field": "options.default.name"
					},
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "options.default.name"
					},
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "options.default.name"
					}
				]
			},
			"zh-CN": "\u9ED8\u8BA4"
		},
		"Seek": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_scrolly_video_behavior",
						"field": "options.seek.name"
					},
					{
						"setting": "mouseover_scrollx_video_behavior",
						"field": "options.seek.name"
					}
				]
			},
			"zh-CN": "\u5FEB\u8FDB/\u5FEB\u9000"
		},
		"None": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_trigger_behavior",
						"field": "options.none.name"
					},
					{
						"setting": "mouseover_allow_partial",
						"field": "options.none.name"
					},
					{
						"setting": "mouseover_scrolly_behavior",
						"field": "options.nothing.name"
					},
					{
						"setting": "mouseover_scrollx_behavior",
						"field": "options.nothing.name"
					},
					{
						"setting": "mouseover_scrolly_video_behavior",
						"field": "options.nothing.name"
					},
					{
						"setting": "mouseover_scrollx_video_behavior",
						"field": "options.nothing.name"
					},
					{
						"setting": "popup_hold_zoom",
						"field": "options.none.name"
					},
					{
						"setting": "mouseover_scrolly_hold_behavior",
						"field": "options.nothing.name"
					},
					{
						"setting": "mouseover_scrollx_hold_behavior",
						"field": "options.nothing.name"
					}
				]
			},
			"zh-CN": "\u65E0"
		},
		"Override scroll outside of popup": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_override_page",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8986\u76D6\u5F39\u7A97\u5916\u7684\u6EDA\u52A8"
		},
		"Scrolling outside of the popup will also be overriden by the script": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_override_page",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u540C\u65F6\u8986\u76D6\u5F39\u7A97\u5916\u7684\u6EDA\u52A8"
		},
		"Zoom origin": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_origin",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F29\u653E\u539F\u70B9"
		},
		"The point on the image it's zoomed in/out from": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_origin",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u56FE\u50CF\u653E\u5927/\u7F29\u5C0F\u7684\u539F\u70B9"
		},
		"Cursor": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_origin",
						"field": "options.cursor.name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488"
		},
		"Center": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_origin",
						"field": "options.center.name"
					}
				]
			},
			"zh-CN": "\u4E2D\u5FC3"
		},
		"Zoom out towards page middle": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoomout_pagemiddle",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F29\u5C0F\u5230\u9875\u9762\u4E2D\u95F4"
		},
		"Sets the origin when zooming out to the page middle, overriding the \"Zoom Origin\" option above.": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoomout_pagemiddle",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8BBE\u7F6E\u7F29\u653E\u5230\u9875\u9762\u4E2D\u95F4\u65F6\u7684\u539F\u70B9\uFF0C\u91CD\u5199\u4E0A\u653E\u7684\u201C\u7F29\u653E\u539F\u70B9\u201D\u9009\u9879\u3002"
		},
		"Within viewport": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoomout_pagemiddle",
						"field": "options.viewport.name"
					}
				]
			},
			"zh-CN": "\u5728\u89C6\u91CE\u5185"
		},
		"Zoom behavior": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_behavior",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F29\u653E\u884C\u4E3A"
		},
		"How zooming should work": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7F29\u653E\u5E94\u5982\u4F55\u5DE5\u4F5C"
		},
		"Fit/Full": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_behavior",
						"field": "options.fitfull.name"
					}
				]
			},
			"zh-CN": "\u9002\u5E94/\u5168\u5C3A\u5BF8"
		},
		"Toggles between the full size, and fit-to-screen": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_behavior",
						"field": "options.fitfull.description"
					}
				]
			},
			"zh-CN": "\u5728\u5168\u5C3A\u5BF8\u548C\u9002\u5408\u5C4F\u5E55\u4E4B\u95F4\u5207\u6362"
		},
		"Incremental": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_zoom_behavior",
						"field": "options.incremental.name"
					}
				]
			},
			"zh-CN": "\u589E\u91CF"
		},
		"Incremental zoom multiplier": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_incremental_mult",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u589E\u91CF\u7F29\u653E\u7CFB\u6570"
		},
		"How much to zoom in/out by (for incremental zooming)": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_incremental_mult",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u589E\u91CF\u7F29\u653E\u65F6\u6BCF\u6B21\u653E\u5927/\u7F29\u5C0F\u591A\u5C11"
		},
		"x": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_video_speed_amount",
						"field": "number_unit"
					},
					{
						"setting": "scroll_incremental_mult",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u500D"
		},
		"Move with cursor": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_move_with_cursor",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u968F\u9F20\u6807\u6307\u9488\u79FB\u52A8"
		},
		"Moves the popup as the cursor moves": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_move_with_cursor",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u79FB\u52A8\u65F6\u79FB\u52A8\u5F39\u7A97"
		},
		"Move within page": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_move_within_page",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u9875\u9762\u5185\u79FB\u52A8"
		},
		"Ensures the popup doesn't leave the page": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_move_within_page",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u786E\u4FDD\u5F39\u7A97\u4E0D\u4F1A\u79BB\u5F00\u9875\u9762"
		},
		"Zoom out fully to close": {
			"_info": {
				"instances": [
					{
						"setting": "zoom_out_to_close",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5B8C\u5168\u7F29\u5C0F\u81F3\u5173\u95ED"
		},
		"Closes the popup if you zoom out past the minimum zoom": {
			"_info": {
				"instances": [
					{
						"setting": "zoom_out_to_close",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7F29\u5C0F\u8D85\u8FC7\u6700\u5C0F\u7EA7\u522B\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Scroll past gallery end to close": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_past_gallery_end_to_close",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6EDA\u52A8\u5230\u56FE\u5E93\u672B\u5C3E\u65F6\u5173\u95ED"
		},
		"Closes the popup if you scroll past the end of the gallery": {
			"_info": {
				"instances": [
					{
						"setting": "scroll_past_gallery_end_to_close",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6EDA\u52A8\u5230\u56FE\u5E93\u7684\u7ED3\u5C3E\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Popup position": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u51FA\u4F4D\u7F6E"
		},
		"Where the popup will appear": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u51FA\u73B0\u5728\u54EA\u91CC"
		},
		"Cursor middle": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "options.cursor.name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u4E3A\u4E2D\u5FC3"
		},
		"Underneath the mouse cursor": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "options.cursor.description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u4E0B\u65B9"
		},
		"Beside cursor": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "options.beside_cursor.name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u65C1"
		},
		"Page middle": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_position",
						"field": "options.center.name"
					}
				]
			},
			"zh-CN": "\u9875\u9762\u4E2D\u95F4"
		},
		"Prevent cursor overlap": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_prevent_cursor_overlap",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u907F\u514D\u6307\u9488\u91CD\u53E0"
		},
		"Prevents the image from overlapping with the cursor": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_prevent_cursor_overlap",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u907F\u514D\u56FE\u50CF\u4E0E\u9F20\u6807\u6307\u9488\u91CD\u53E0"
		},
		"Center popup on overflow": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_overflow_position_center",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6EA2\u51FA\u65F6\u5C06\u5F39\u7A97\u7F6E\u4E8E\u4E2D\u5FC3"
		},
		"Centers the popup if its initial size overflows": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_overflow_position_center",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u521D\u59CB\u5927\u5C0F\u6EA2\u51FA\uFF0C\u5C06\u5F39\u7A97\u7F6E\u4E8E\u4E2D\u5FC3\u4F4D\u7F6E"
		},
		"Overflow origin": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_overflow_origin",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6EA2\u51FA\u539F\u70B9"
		},
		"Where the popup will appear in the page if its initial size overflows": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_overflow_origin",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u521D\u59CB\u5927\u5C0F\u6EA2\u51FA\uFF0C\u5F39\u7A97\u5C06\u51FA\u73B0\u5728\u9875\u9762\u7684\u54EA\u4E2A\u4F4D\u7F6E"
		},
		"Hide cursor over popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hide_cursor",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u4E0A\u9690\u85CF\u9F20\u6807\u6307\u9488"
		},
		"Hides the cursor when the mouse is over the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hide_cursor",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u5728\u5F39\u7A97\u4E0A\u60AC\u505C\u65F6\u9690\u85CF\u6307\u9488"
		},
		"Hide cursor after": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hide_cursor_after",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9690\u85CF\u6307\u9488\u5EF6\u8FDF"
		},
		"Hides the cursor over the popup after a specified period of time (in milliseconds), 0 always hides the cursor": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_hide_cursor_after",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u5728\u5F39\u7A97\u4E0A\u505C\u7559\u6307\u5B9A\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09\u540E\u9690\u85CF\u6307\u9488\uFF0C0 \u4E3A\u7ACB\u5373\u9690\u85CF"
		},
		"Mouse jitter threshold": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mouse_inactivity_jitter",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6296\u52A8\u9608\u503C"
		},
		"Threshold for mouse movement before the mouse cursor is shown again, 0 always shows the cursor after any movement": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mouse_inactivity_jitter",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u6307\u9488\u518D\u6B21\u663E\u793A\u524D\u7684\u79FB\u52A8\u9608\u503C\uFF0C0 \u4E3A\u59CB\u7EC8\u663E\u793A\u79FB\u52A8\u540E\u7684\u6307\u9488"
		},
		"px": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_max_width",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_zoom_max_height",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_mouse_inactivity_jitter",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u50CF\u7D20"
		},
		"Disable pointer events": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_clickthrough",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7981\u7528\u6307\u9488\u4E8B\u4EF6"
		},
		"Enabling this option will allow you to click on links underneath the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_clickthrough",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u6B64\u9009\u9879\u5C06\u5141\u8BB8\u60A8\u5355\u51FB\u5F39\u7A97\u4E0B\u65B9\u7684\u94FE\u63A5"
		},
		"Ignore clicks outside popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_ignore_clicks",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5FFD\u7565\u5F39\u7A97\u5916\u7684\u70B9\u51FB"
		},
		"Any mouse event outside the popup will be discarded with this option": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_ignore_clicks",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u6B64\u9009\u9879\u540E\uFF0C\u4EFB\u4F55\u5F39\u7A97\u5916\u7684\u9F20\u6807\u4E8B\u4EF6\u90FD\u5C06\u4E22\u5F03"
		},
		"Enable downloading HLS/DASH streams": {
			"_info": {
				"instances": [
					{
						"setting": "enable_stream_download",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528 HLS/DASH \u6D41\u5A92\u4F53\u7684\u4E0B\u8F7D"
		},
		"Downloads and muxes the contents of the streams rather than the stream information file.\nThis currently does not work under Firefox.": {
			"_info": {
				"instances": [
					{
						"setting": "enable_stream_download",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u548C\u7EC4\u5408\u6D41\u7684\u5185\u5BB9\uFF0C\u4EE3\u66FF\u6D41\u4FE1\u606F\u6587\u4EF6\u3002\n\u76EE\u524D\u4E0D\u80FD\u5728 Firefox \u4E2D\u4F7F\u7528\u3002"
		},
		"Prefer MP4 over MKV": {
			"_info": {
				"instances": [
					{
						"setting": "stream_mux_mp4_over_mkv",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u504F\u597D MP4 \u4EE3\u66FF MKV"
		},
		"Tries to mux the video into mp4 instead of mkv when required. This may slightly slow down muxing as it currently needs to try muxing both.": {
			"_info": {
				"instances": [
					{
						"setting": "stream_mux_mp4_over_mkv",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8BF7\u6C42\u65F6\u5C1D\u8BD5\u7528 mp4 \u4EE3\u66FF mkv\u3002\u8FD9\u53EF\u80FD\u7A0D\u5FAE\u964D\u4F4E\u7EC4\u5408\u5185\u5BB9\u7684\u901F\u5EA6\uFF0C\u56E0\u4E3A\u76EE\u524D\u9700\u8981\u5C1D\u8BD5\u4E24\u7EC4\u64CD\u4F5C\u3002"
		},
		"Link image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_link",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u94FE\u63A5\u56FE\u50CF"
		},
		"Adds a link to the image in the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_link",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u5F39\u7A97\u7684\u56FE\u50CF\u4E2D\u6DFB\u52A0\u94FE\u63A5"
		},
		"Link video": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_video_link",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u94FE\u63A5\u89C6\u9891"
		},
		"Adds a link to the video in the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_add_video_link",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u5F39\u7A97\u7684\u89C6\u9891\u4E2D\u6DFB\u52A0\u94FE\u63A5"
		},
		"Clicking image closes": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_click_image_close",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u70B9\u51FB\u56FE\u7247\u5173\u95ED"
		},
		"Clicking the popup image closes the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_click_image_close",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5355\u51FB\u5F39\u51FA\u56FE\u50CF\u5C06\u5173\u95ED\u5F39\u7A97"
		},
		"Clicking video closes": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_click_video_close",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u70B9\u51FB\u89C6\u9891\u5173\u95ED"
		},
		"Clicking the popup video closes the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_click_video_close",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u70B9\u51FB\u5F39\u51FA\u7684\u89C6\u9891\u65F6\u5173\u95ED\u5F39\u7A97"
		},
		"Clicking link downloads": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_download",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u70B9\u51FB\u94FE\u63A5\u4E0B\u8F7D"
		},
		"Instead of opening the link in a new tab, it will download the image/video instead": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_download",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u56FE\u50CF/\u89C6\u9891\uFF0C\u4EE3\u66FF\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u94FE\u63A5"
		},
		"Close key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5173\u95ED\u952E"
		},
		"Closes the popup when this key is pressed. Currently, ESC will also close the popup regardless of the value of this setting.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_close_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u5173\u95ED\u5F39\u7A97\u3002\u76EE\u524D\uFF0CESC \u4E5F\u5C06\u5173\u95ED\u5F39\u7A97\uFF0C\u5E76\u4E14\u65E0\u89C6\u6B64\u8BBE\u7F6E\u3002"
		},
		"Download key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_download_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u952E"
		},
		"Downloads the image in the popup when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_download_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u4E0B\u8F7D\u5F39\u7A97\u4E2D\u7684\u56FE\u50CF"
		},
		"Open in new tab key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_new_tab_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u65B0\u5EFA\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u7684\u6309\u952E"
		},
		"Opens the image in the popup in a new tab when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_new_tab_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u5728\u65B0\u5EFA\u7684\u6807\u7B7E\u9875\u4E2D\u5F39\u7A97\u4E2D\u7684\u56FE\u50CF"
		},
		"Open in background tab key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_bg_tab_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u540E\u53F0\u6807\u7B7E\u9875\u6253\u5F00\u7684\u6309\u952E"
		},
		"Opens the image in the popup in a new tab without switching to it when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_bg_tab_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u5728\u65B0\u5EFA\u7684\u540E\u53F0\u6807\u7B7E\u9875\u4E2D\u5F39\u7A97\u4E2D\u7684\u56FE\u50CF"
		},
		"Copy link key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_copy_link_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u590D\u5236\u94FE\u63A5\u952E"
		},
		"Copies the link of the media to the clipboard when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_copy_link_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\uFF0C\u5C06\u5A92\u4F53\u94FE\u63A5\u590D\u5236\u5230\u526A\u8D34\u677F"
		},
		"Open options key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_options_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6253\u5F00\u9009\u9879\u952E"
		},
		"Opens this page in a new tab when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_options_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u5728\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u6B64\u9875\u9762"
		},
		"Open original page key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_orig_page_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6253\u5F00\u539F\u59CB\u9875\u9762\u952E"
		},
		"Opens the original page (if available) when this key is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_orig_page_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6B64\u952E\u65F6\u6253\u5F00\u539F\u59CB\u9875\u9762\uFF08\u5982\u679C\u53EF\u7528\uFF09"
		},
		"Rotate left key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_rotate_left_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5411\u5DE6\u65CB\u8F6C\u952E"
		},
		"Rotates the popup 90 degrees to the left": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_rotate_left_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u5F39\u7A97\u5411\u5DE6\u65CB\u8F6C90\u5EA6"
		},
		"Rotate right key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_rotate_right_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5411\u53F3\u65CB\u8F6C\u952E"
		},
		"Rotates the popup 90 degrees to the right": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_rotate_right_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u5F39\u7A97\u5411\u53F3\u65CB\u8F6C90\u5EA6"
		},
		"Horizontal flip key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_flip_horizontal_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6C34\u5E73\u7FFB\u8F6C\u952E"
		},
		"Flips the image horizontally": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_flip_horizontal_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6C34\u5E73\u7FFB\u8F6C\u56FE\u50CF"
		},
		"Vertical flip key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_flip_vertical_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5782\u76F4\u7FFB\u8F6C\u952E"
		},
		"Flips the image vertically": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_flip_vertical_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5782\u76F4\u7FFB\u8F6C\u56FE\u50CF"
		},
		"Zoom in key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_in_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u653E\u5927\u952E"
		},
		"Incrementally zooms into the image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_in_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9010\u6B65\u653E\u5927\u56FE\u50CF"
		},
		"Zoom out key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_out_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F29\u5C0F\u952E"
		},
		"Incrementally zooms out of the image": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_out_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9010\u6B65\u7F29\u5C0F\u56FE\u50CF"
		},
		"Full zoom key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_full_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5168\u5C3A\u5BF8\u7F29\u653E\u952E"
		},
		"Sets the image to be at a 100% zoom, even if it overflows the screen": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_full_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u56FE\u50CF\u8BBE\u7F6E\u4E3A 100% \u7F29\u653E\uFF0C\u5373\u4F7F\u5C06\u6EA2\u51FA\u5C4F\u5E55"
		},
		"Fit screen key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_fit_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9002\u5408\u5C4F\u5E55\u952E"
		},
		"Sets the image to either be at a 100% zoom, or to fit the screen, whichever is smaller": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_fit_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u56FE\u50CF\u8BBE\u7F6E\u4E3A 100% \u7F29\u653E\u6216\u9002\u5408\u5C4F\u5E55\uFF0C\u4EE5\u8F83\u5C0F\u8005\u4E3A\u51C6"
		},
		"Toggle fullscreen key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_fullscreen_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u5168\u5C4F\u952E"
		},
		"Toggles fullscreen mode for the image/video in the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_fullscreen_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u5F39\u7A97\u4E2D\u7684\u56FE\u50CF/\u89C6\u9891\u7684\u5168\u5C4F\u6A21\u5F0F"
		},
		"Popup for plain hyperlinks": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_links",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A\u7EAF\u8D85\u94FE\u63A5\u5F39\u7A97"
		},
		"Whether or not the popup should also open for plain hyperlinks": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_links",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u662F\u5426\u4E3A\u7EAF\u7CB9\u7684\u8D85\u94FE\u63A5\u663E\u793A\u5F39\u7A97"
		},
		"Only for links that look valid": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_only_valid_links",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53EA\u9488\u5BF9\u770B\u8D77\u6765\u6709\u6548\u7684\u94FE\u63A5"
		},
		"Enabling this option will only allow links to be popped up if they look valid (such as if they have a known image/video extension, or are explicitly supported)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_only_valid_links",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u6B64\u9009\u9879\u540E\uFF0C\u5C06\u53EA\u4E3A\u770B\u8D77\u6765\u6709\u6548\u7684\u94FE\u63A5\u663E\u793A\u5F39\u7A97\uFF08\u4F8B\u5982\u6709\u5DF2\u77E5\u7684\u56FE\u50CF/\u89C6\u9891\u6269\u5C55\u540D\uFF0C\u6216\u8005\u660E\u663E\u53D7\u652F\u6301\uFF09"
		},
		"Popup page URL": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_self_pagelink",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A\u9875\u9762\u7F51\u5740\u5F39\u7A97"
		},
		"If no element can be found, try the page URL. Only relevant for pagelink rules, such as image and video hosting websites": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_self_pagelink",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u627E\u4E0D\u5230\u5143\u7D20\uFF0C\u5C1D\u8BD5\u9875\u9762\u7F51\u5740\u3002\u53EA\u4E0E pagelink \u89C4\u5219\u76F8\u5173\uFF0C\u5982\u56FE\u50CF\u6216\u89C6\u9891\u6258\u7BA1\u7F51\u7AD9"
		},
		"Popup for `<iframe>`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_iframe_el",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A <iframe> \u5F39\u7A97"
		},
		"Allows `<iframe>` elements to be popped up as well. Storing images/videos in this way is rather uncommon, but it can allow embeds to be supported": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_iframe_el",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u4E3A `<iframe>` \u5143\u7D20\u663E\u793A\u5F39\u7A97\u3002\u4EE5\u8FD9\u79CD\u65B9\u5F0F\u5B58\u50A8\u56FE\u50CF/\u89C6\u9891\u76F8\u5F53\u7F55\u89C1\uFF0C\u4F46\u603B\u4E4B\u53EF\u4EE5\u652F\u6301"
		},
		"Popup for `<canvas>`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_canvas_el",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A <canvas> \u5F39\u7A97"
		},
		"Allows `<canvas>` elements to be popped up as well. This will likely cause popups with any kind of web-based games, so it's recommended to keep this disabled": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_canvas_el",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u4E3A `<canvas>` \u5143\u7D20\u663E\u793A\u5F39\u7A97\u3002\u8FD9\u53EF\u80FD\u5BFC\u81F4\u5728\u7F51\u9875\u6E38\u620F\u4E0A\u89E6\u53D1\u5F39\u7A97\uFF0C\u6240\u4EE5\u5EFA\u8BAE\u6B64\u9879\u4FDD\u6301\u7981\u7528"
		},
		"Popup for `<svg>`": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_svg_el",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A <svg> \u5F39\u7A97"
		},
		"Allows `<svg>` elements to be popped up as well. These are usually used for icons, and can occasionally cause problems for websites that overlay icons on top of images": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_svg_el",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u4E3A `<svg>` \u5143\u7D20\u663E\u793A\u5F39\u7A97\u3002\u8FD9\u901A\u5E38\u7528\u4E8E\u56FE\u6807\uFF0C\u5E76\u4E14\u5076\u5C14\u4F1A\u5728\u7F51\u7AD9\u4E8E\u56FE\u50CF\u4E0A\u53E0\u52A0\u56FE\u6807\u65F6\u51FA\u73B0\u95EE\u9898"
		},
		"Enable gallery": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_gallery",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u56FE\u5E93"
		},
		"Toggles whether gallery detection support should be enabled": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_gallery",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u662F\u5426\u542F\u7528\u56FE\u5E93\u68C0\u6D4B\u652F\u6301"
		},
		"Cycle gallery": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_cycle",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93\u5FAA\u73AF"
		},
		"Going to the previous image for the first image will lead to the last image and vice-versa": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_cycle",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7B2C\u4E00\u4E2A\u56FE\u50CF\u518D\u5411\u4E0A\u62B5\u8FBE\u6700\u540E\u4E00\u4E2A\u56FE\u50CF\uFF0C\u6700\u540E\u4E00\u4E2A\u56FE\u50CF\u5411\u4E0B\u62B5\u8FBE\u7B2C\u4E00\u4E2A\u56FE\u50CF"
		},
		"Previous gallery item": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_prev_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u524D\u4E00\u4E2A\u56FE\u5E93\u9879"
		},
		"Key to trigger the previous gallery item": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_prev_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u4E0A\u4E00\u4E2A\u56FE\u5E93\u9879\u7684\u6309\u952E"
		},
		"Next gallery item": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_next_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u4E00\u4E2A\u56FE\u5E93\u9879"
		},
		"Key to trigger the next gallery item": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_next_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u4E0B\u4E00\u4E2A\u56FE\u5E93\u9879\u7684\u6309\u952E"
		},
		"Gallery download key": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_download_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u56FE\u5E93\u4E0B\u8F7D\u952E"
		},
		"Key to download the current gallery": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_download_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u5F53\u524D\u56FE\u5E93\u7684\u6309\u952E"
		},
		"Download method": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_method",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u65B9\u6CD5"
		},
		"How the gallery should be downloaded": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_method",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5E94\u5982\u4F55\u4E0B\u8F7D\u56FE\u5E93"
		},
		"Zip file": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_method",
						"field": "options.zip.name"
					}
				]
			},
			"zh-CN": "Zip \u6587\u4EF6"
		},
		"JDownloader": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_method",
						"field": "options.jdownloader.name"
					}
				]
			},
			"zh-CN": "JDownloader"
		},
		"Download unchanged media": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_unchanged",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u672A\u66F4\u6539\u7684\u5A92\u4F53"
		},
		"Includes gallery items that have not been changed. Useful to potentially avoid downloading thumbnails": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_download_unchanged",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5305\u542B\u672A\u66F4\u6539\u7684\u56FE\u5E93\u9879\u76EE\u3002\u6709\u52A9\u4E8E\u6F5C\u5728\u907F\u514D\u4E0B\u8F7D\u7F29\u7565\u56FE"
		},
		"Directory/zip filename format": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_filename_format",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u76EE\u5F55/zip \u6587\u4EF6\u540D\u683C\u5F0F"
		},
		"Format string(s) for the directory (package name for JDownloader) and zip filename (if applicable).\nRefer to \"Filename format\" under the Rules section for documentation. The variables are set from the first loaded media.\nAn additional `items_amt` format variable is supported, which contains the number of items.\n`.zip` will be automatically suffixed for zip filenames.": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_filename_format",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u76EE\u5F55\uFF08JDownloader \u7684\u5305\u540D\uFF09\u548C zip \u6587\u4EF6\u540D\uFF08\u5982\u679C\u9002\u7528\uFF09\u7684\u683C\u5F0F\u5316\u5B57\u7B26\u4E32\u3002\n\u6587\u6863\u53C2\u89C1\u201C\u89C4\u5219\u201D\u90E8\u5206\u4E2D\u7684\u201C\u6587\u4EF6\u540D\u683C\u5F0F\u201D\u3002\u8FD9\u4E9B\u53D8\u91CF\u6765\u81EA\u9996\u4E2A\u5DF2\u52A0\u8F7D\u7684\u5A92\u4F53\u3002\n\u652F\u6301\u4E00\u4E2A\u989D\u5916\u7684 `items_amt` \u683C\u5F0F\u53D8\u91CF\uFF0C\u5176\u4E2D\u5305\u542B\u9879\u76EE\u6570\u91CF\u3002\nzip \u7684\u6587\u4EF6\u540D\u81EA\u52A8\u8FFD\u52A0 `.zip` \u540E\u7F00\u3002"
		},
		"Zip: Store in subdirectory": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_add_tld",
						"field": "name"
					}
				]
			},
			"zh-CN": "Zip: \u5B58\u50A8\u5728\u5B50\u76EE\u5F55\u4E2D"
		},
		"Stores the files in a subdirectory with the same name as the .zip file (without the .zip extension)": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_add_tld",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C06\u6587\u4EF6\u5B58\u50A8\u5728\u4E0E .zip \u6587\u4EF6\u540C\u540D\u7684\u5B50\u76EE\u5F55\u4E2D\uFF08\u76EE\u5F55\u4E0D\u5E26 .zip\uFF09"
		},
		"JD: Autostart": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_jd_autostart",
						"field": "name"
					}
				]
			},
			"zh-CN": "JD: \u81EA\u52A8\u542F\u52A8"
		},
		"Autostarts the download when added to JDownloader": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_jd_autostart",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6DFB\u52A0\u5230 JDownloader \u65F6\u81EA\u52A8\u5F00\u59CB\u4E0B\u8F7D"
		},
		"JD: Referer policy": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_jd_referer",
						"field": "name"
					}
				]
			},
			"zh-CN": "JD: Referer \u7B56\u7565"
		},
		"Due to a current limitation in JDownloader's API, the `Referer` (sic) header can only be set on a per-package basis. This option allows working around it by submitting multiple packages with the same name using different Referer headers. This can result in JD spamming notifications due to the number of packages created.": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_jd_referer",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7531\u4E8E\u76EE\u524D JDownloader API \u7684\u9650\u5236\uFF0C`Referer` (sic) \u5934\u53EA\u80FD\u5728\u6BCF\u4E2A\u5305\u7684\u57FA\u7840\u4E0A\u8BBE\u7F6E\u3002\u6B64\u9009\u9879\u901A\u8FC7\u63D0\u4EA4\u540C\u540D\u4F46\u4E0D\u540C Referer \u5934\u7684\u591A\u4E2A\u5305\u6765\u89C4\u907F\u8BE5\u95EE\u9898\u3002\u8FD9\u53EF\u80FD\u5BFC\u81F4 JD \u7531\u4E8E\u521B\u5EFA\u7684\u5305\u6570\u91CF\u8F83\u591A\u800C\u7ED9\u51FA\u5783\u573E\u6D88\u606F\u901A\u77E5\u3002"
		},
		"Per-domain": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_jd_referer",
						"field": "options.domain.name"
					}
				]
			},
			"zh-CN": "\u6309\u57DF\u540D"
		},
		"Zip: Store info file": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_add_info_file",
						"field": "name"
					}
				]
			},
			"zh-CN": "Zip: \u5B58\u50A8\u4FE1\u606F\u6587\u4EF6"
		},
		"Stores a `info.txt` file in the .zip containing information about the downloaded files and host page.": {
			"_info": {
				"instances": [
					{
						"setting": "gallery_zip_add_info_file",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728 .zip \u4E2D\u5B58\u50A8\u4E00\u4E2A\u5305\u542B\u4E0B\u8F7D\u7684\u6587\u4EF6\u548C\u7F51\u9875\u4FE1\u606F\u7684\u201Cinfo.txt\u201D\u6587\u4EF6\u3002"
		},
		"Move to next when video finishes": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_move_after_video",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u89C6\u9891\u7ED3\u675F\u65F6\u8F6C\u5230\u4E0B\u4E00\u4E2A"
		},
		"Moves to the next gallery item when a video finishes playing": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_gallery_move_after_video",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89C6\u9891\u64AD\u653E\u7ED3\u675F\u65F6\u79FB\u52A8\u5230\u4E0B\u4E00\u4E2A\u56FE\u5E93\u9879\u76EE"
		},
		"Popup CSS style": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_styles",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97 CSS \u6837\u5F0F"
		},
		"Custom CSS styles for the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_styles",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u81EA\u5B9A\u4E49\u5F39\u7A97\u7684 CSS \u6837\u5F0F"
		},
		"Most valid CSS is supported, with these differences:\n<ul><li>Multiline comments (<code>/* ... */</code>) are currently not supported</li>\n<li>Single comments (<code>// ...</code>) are supported, but only at the beginning of a line</li>\n<li><code>%thumburl%</code> is the URL of the thumbnail image. For example, you could use it like this: <code>background-image: url(%thumburl%)</code><br />\nThe URL is properly encoded, so quotes are not necessary (but not harmful either)</li>\n<li><code>%fullurl%</code> is the URL of the full image. If IMU fails to find a larger image, it will be the same as <code>%thumburl%</code></li>\n<li>Styles are <code>!important</code> by default</li></ul>\n<p>For Button CSS style, you can also customize the CSS for individual buttons through their IDs. For example:</p>\n<pre>\n#closebtn {\n  background-color: red;\n  // -imu-text allows you to set the text inside the button\n  -imu-text: \"Close\";\n  // -imu-title allows you to set the tooltip when hovering\n  -imu-title: \"Close the popup\";\n}\n#galleryprevbtn, #gallerynextbtn {\n  border-radius: 100px;\n}\n</pre>": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_styles",
						"field": "documentation.value"
					}
				]
			},
			"zh-CN": "\u652F\u6301\u5927\u591A\u6570\u6709\u6548\u7684 CSS\uFF0C\u4F46\u6709\u4E0B\u5217\u5DEE\u5F02\uFF1A\n<ul><li>\u76EE\u524D\u4E0D\u652F\u6301\u591A\u884C\u6CE8\u91CA\uFF08<code>/* ... */</code>\uFF09</li>\n<li>\u652F\u6301\u5355\u884C\u6CE8\u91CA\uFF08<code>// ...</code>\uFF09\uFF0C\u4F46\u53EA\u80FD\u5728\u884C\u5F00\u5934</li>\n<li><code>%thumburl%</code> \u662F\u7F29\u7565\u56FE\u7684 URL\uFF0C\u4F8B\u5982\u53EF\u4EE5\u8FD9\u6837\u4F7F\u7528\u5B83\uFF1Abackground-image: url(%thumburl%)</code><br />\nURL \u88AB\u6B63\u786E\u7F16\u7801\uFF0C\u6240\u4EE5\u6CA1\u6709\u5FC5\u8981\u4F7F\u7528\u5F15\u53F7\uFF08\u4F46\u4F7F\u7528\u4E5F\u65E0\u5BB3\uFF09</li>\n<li><code>%fullurl%</code> \u662F\u5B8C\u6574\u56FE\u50CF\u7684 URL\u3002\u5982\u679C Image Max URL \u4E0D\u80FD\u627E\u5230\u4E00\u4E2A\u66F4\u5927\u7684\u56FE\u50CF\uFF0C\u5C06\u4E0E <code>%thumburl%</code> \u76F8\u540C</li>\n<li>\u6837\u5F0F\u9ED8\u8BA4 <code>!important</code></li></ul>\n<p>\u5BF9\u4E8E\u6309\u94AE CSS \u6837\u5F0F\uFF0C\u60A8\u4E5F\u53EF\u4EE5\u901A\u8FC7 id \u4E3A\u5355\u4E2A\u6309\u94AE\u5B9A\u5236 CSS\u3002\u4F8B\u5982\uFF1A</p>\n<pre>\n#closebtn {\n  background-color: red;\n  // -imu-text \u5141\u8BB8\u60A8\u8BBE\u7F6E\u6309\u94AE\u5185\u7684\u6587\u672C\n  -imu-text: \"Close\";\n  // -imu-title \u5141\u8BB8\u60A8\u8BBE\u7F6E\u60AC\u505C\u65F6\u7684\u5DE5\u5177\u63D0\u793A\n  -imu-title: \"Close the popup\";\n}\n#galleryprevbtn, #gallerynextbtn {\n  border-radius: 100px;\n}\n</pre>"
		},
		"Enable popup fade": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_fade",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5F39\u7A97\u8FC7\u6E21\u52A8\u753B"
		},
		"Enables a fade in/out effect when the popup is opened/closed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_fade",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5F39\u7A97\u6253\u5F00/\u5173\u95ED\u65F6\u7684\u6DE1\u5165/\u6DE1\u51FA\u6548\u679C"
		},
		"Enable zoom effect": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_zoom_effect",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u7F29\u653E\u6548\u679C"
		},
		"Toggles whether the popup should 'zoom' when opened/closed": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_zoom_effect",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u6253\u5F00/\u5173\u95ED\u5F39\u7A97\u65F6\u662F\u5426\u6709\u7F29\u653E\u6548\u679C"
		},
		"Move from thumbnail when zooming": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_effect_move",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4ECE\u7F29\u7565\u56FE\u4E2D\u8DC3\u51FA\u7684\u7F29\u653E\u6548\u679C"
		},
		"Moves the popup from the thumbnail to the final location while zooming. The animation can be a little rough": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_zoom_effect_move",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4ECE\u7F29\u7565\u56FE\u53D8\u4E3A\u5F39\u7A97\u65F6\u7684\u7F29\u653E\u52A8\u753B\u6548\u679C\u3002\u52A8\u753B\u53EF\u80FD\u6709\u70B9\u7C97\u7CD9"
		},
		"Popup animation time": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_fade_time",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u52A8\u753B\u65F6\u957F"
		},
		"Fade/zoom animation duration (in milliseconds) for the popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_fade_time",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u7684\u6DE1\u51FA/\u7F29\u653E\u52A8\u753B\u6301\u7EED\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09"
		},
		"Enable background CSS": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_mask_styles2",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u80CC\u666F CSS"
		},
		"Toggles whether CSS styles for the background when the popup is active is enabled": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_mask_styles2",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5207\u6362\u5F53\u5F39\u51FA\u7A97\u53E3\u5904\u4E8E\u6D3B\u52A8\u72B6\u6001\u65F6\u662F\u5426\u542F\u7528\u80CC\u666F\u7684 CSS \u6837\u5F0F"
		},
		"On hold": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_mask_styles2",
						"field": "options.hold.name"
					}
				]
			},
			"zh-CN": "\u4FDD\u6301\u73B0\u72B6"
		},
		"No": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_enable_mask_styles2",
						"field": "options.never.name"
					}
				]
			},
			"zh-CN": "\u4E0D\u542F\u7528"
		},
		"Background CSS style": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_styles2",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u80CC\u666F CSS \u6837\u5F0F"
		},
		"CSS style for the background when the popup is active. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_styles2",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97\u5F00\u542F\u65F6\u7528\u4E8E\u80CC\u666F\u7684 CSS \u6837\u5F0F\u3002\u66F4\u591A\u4FE1\u606F\u8BE6\u89C1\u201C\u5F39\u7A97 CSS \u6837\u5F0F\u201D\u6587\u6863\uFF08\u6B64\u5904\u4E0D\u652F\u6301 thumb/full URL \u53D8\u91CF\uFF09"
		},
		"Background fade": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_fade_time",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u80CC\u666F\u6DE1\u5165/\u6DE1\u51FA"
		},
		"Fade in/out time (in milliseconds) for the page background, set to 0 to disable": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_mask_fade_time",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9875\u9762\u80CC\u666F\u7684\u6DE1\u5165/\u6DE1\u51FA\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09 \uFF0C\u8BBE\u4E3A 0 \u5219\u7981\u7528"
		},
		"ms": {
			"_info": {
				"instances": [
					{
						"setting": "retry_503_ms",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_notallowed_duration",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_hide_cursor_after",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_fade_time",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_mask_fade_time",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u6BEB\u79D2"
		},
		"Button CSS style": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_styles",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6309\u94AE CSS \u6837\u5F0F"
		},
		"Custom CSS styles for the popup's UI buttons. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_styles",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E3A\u5F39\u7A97\u4E2D\u754C\u9762\u7684\u6309\u94AE\u81EA\u5B9A\u4E49 CSS \u6837\u5F0F\u3002\u66F4\u591A\u4FE1\u606F\u8BE6\u89C1\u201C\u5F39\u7A97 CSS \u6837\u5F0F\u201D\u6587\u6863\uFF08\u6B64\u5904\u4E0D\u652F\u6301 thumb/full URL \u53D8\u91CF\uFF09"
		},
		"Don't popup blacklisted URLs": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_apply_blacklist",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5DF2\u5217\u5165\u9ED1\u540D\u5355\u7684\u7F51\u5740\u4E0D\u8981\u5F39\u7A97"
		},
		"This option popping up for source media with blacklisted URLs. If this is disabled, the popup will open if the end URL isn't blacklisted, regardless of whether the source is blacklisted.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_apply_blacklist",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u7981\u7528\u6B64\u9009\u9879\uFF0C\u5373\u4FBF\u6E90\u5730\u5740\u88AB\u5217\u5165\u9ED1\u540D\u5355\uFF0C\u53EA\u8981\u672B\u7AEF\u7F51\u5740\u6CA1\u6709\u5217\u5165\u9ED1\u540D\u5355\uFF0C\u5C31\u6253\u5F00\u5F39\u7A97\u3002"
		},
		"Apply blacklist for host websites": {
			"_info": {
				"instances": [
					{
						"setting": "apply_blacklist_host",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5BF9\u7F51\u7AD9\u5E94\u7528\u9ED1\u540D\u5355"
		},
		"This option prevents the script from opening any popups to host websites that are in the blacklist. For example, adding `twitter.com` to the blacklist would prevent any popup from opening on twitter.com. If disabled, this option only applies to image URLs (such as twimg.com), not host URLs": {
			"_info": {
				"instances": [
					{
						"setting": "apply_blacklist_host",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u9009\u9879\u51B3\u5B9A\u662F\u5426\u4E0D\u4E3A\u9ED1\u540D\u5355\u4E2D\u7684\u7F51\u7AD9\u6253\u5F00\u4EFB\u4F55\u5F39\u7A97\u3002\u4F8B\u5982\uFF0C\u5C06 twitter.com \u6DFB\u52A0\u5230\u9ED1\u540D\u5355\u4E2D\u53EF\u4EE5\u907F\u514D\u5728 twitter.com \u4E0A\u51FA\u73B0\u4EFB\u4F55\u5F39\u7A97\u3002\u5982\u679C\u7981\u7528\uFF0C\u9ED1\u540D\u5355\u4EC5\u5E94\u7528\u4E8E\u56FE\u50CF\u7F51\u5740\uFF08\u5982 twimg.com\uFF09\u800C\u4E0D\u9488\u5BF9\u7F51\u9875\u7F51\u5740"
		},
		"Don't popup different media type": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_matching_media_types",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E0D\u8981\u5F39\u51FA\u4E0D\u540C\u7684\u5A92\u4F53\u7C7B\u578B"
		},
		"This option prevents the popup from loading a video when the source was an image or vice-versa": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_matching_media_types",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6B64\u9009\u9879\u53EF\u907F\u514D\u6E90\u662F\u56FE\u50CF\u65F6\u5F39\u7A97\u52A0\u8F7D\u89C6\u9891\uFF0C\u53CD\u4E4B\u4EA6\u7136"
		},
		"Allow popup when fullscreen": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_popup_when_fullscreen",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u5168\u5C4F\u65F6\u5F39\u7A97"
		},
		"Allows the popup to open if an element (such as a video player) is fullscreen.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_popup_when_fullscreen",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u5B58\u5728\u5168\u5C4F\u5143\u7D20\uFF08\u5982\u89C6\u9891\u64AD\u653E\u5668\uFF09\u65F6\u6253\u5F00\u5F39\u7A97\u3002"
		},
		"Element finding mode": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5143\u7D20\u67E5\u627E\u6A21\u5F0F"
		},
		"How IMU should find the media element on the page.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "description"
					}
				]
			},
			"zh-CN": "Image Max URL \u5E94\u5982\u4F55\u67E5\u627E\u9875\u9762\u4E0A\u7684\u5A92\u4F53\u5143\u7D20\u3002"
		},
		"This will result in a much higher CPU load for websites such as Facebook, and will occasionally return the wrong element.\nUse this option with caution.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "warning.full"
					}
				]
			},
			"zh-CN": "\u5BF9\u8BF8\u5982 Facebook \u7B49\u7F51\u7AD9\uFF0C\u8FD9\u5C06\u5BFC\u81F4\u5F88\u9AD8\u7684 CPU \u8D1F\u8F7D\uFF0C\u4E14\u5076\u5C14\u4F1A\u8FD4\u56DE\u9519\u8BEF\u7684\u5143\u7D20\u3002\n\u8C28\u614E\u4F7F\u7528\u6B64\u9009\u9879\u3002"
		},
		"Full": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.full.name"
					}
				]
			},
			"zh-CN": "\u5168\u9762"
		},
		"Manually looks through every element on the page to see if the cursor is above them. This will result in a higher CPU load for websites such as Facebook, and may return the wrong element": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.full.description"
					}
				]
			},
			"zh-CN": "\u9010\u4E00\u68C0\u67E5\u9875\u9762\u4E0A\u7684\u6BCF\u4E2A\u5143\u7D20\uFF0C\u770B\u9F20\u6807\u6307\u9488\u662F\u5426\u5728\u4E0A\u9762\u3002\u8FD9\u5C06\u5BFC\u81F4\u5F88\u9AD8\u7684 CPU \u8D1F\u8F7D\uFF0C\u4E14\u5076\u5C14\u4F1A\u8FD4\u56DE\u9519\u8BEF\u7684\u5143\u7D20"
		},
		"Hybrid": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.hybrid.name"
					}
				]
			},
			"zh-CN": "\u6DF7\u5408"
		},
		"Looks manually through every child element of the last element found by `getElementsAtPoint`. Use this option if in doubt, it'll work on most sites": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.hybrid.description"
					}
				]
			},
			"zh-CN": "\u9010\u4E00\u68C0\u67E5\u7528 `getElementsAtPoint` \u627E\u5230\u7684\u6700\u540E\u4E00\u4E2A\u5143\u7D20\u7684\u6BCF\u4E2A\u5B50\u5143\u7D20\u3002\u5982\u679C\u4E0D\u4E86\u89E3\uFF0C\u4F7F\u7528\u6B64\u9009\u9879\uFF0C\u5B83\u9002\u7528\u4E8E\u7EDD\u5927\u591A\u6570\u7F51\u7AD9"
		},
		"Simple": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.simple.name"
					}
				]
			},
			"zh-CN": "\u7B80\u6613"
		},
		"This is the fastest option, which uses the value of `getElementsAtPoint` without modification. Works for sites that don't use pointer-events:none and shadow DOM": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_find_els_mode",
						"field": "options.simple.description"
					}
				]
			},
			"zh-CN": "\u8FD9\u662F\u6700\u5FEB\u7684\u9009\u9879\uFF0C\u5B83\u4F7F\u7528 `getElementsAtPoint` \u7684\u503C\u800C\u4E0D\u505A\u4FEE\u6539\u3002\u9002\u7528\u4E8E\u4E0D\u4F7F\u7528 pointer-events:none \u548C shadow DOM \u7684\u7F51\u7AD9"
		},
		"Use cache": {
			"_info": {
				"instances": [
					{
						"setting": "popup_allow_cache",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u7F13\u5B58"
		},
		"Allows use of a media cache for the popup. The cache is currently stored per-page and is not persistent across page reloads.": {
			"_info": {
				"instances": [
					{
						"setting": "popup_allow_cache",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u5F39\u7A97\u7F13\u5B58\u5A92\u4F53\u3002\u7F13\u5B58\u76EE\u524D\u4E0D\u8DE8\u9875\u5171\u4EAB\uFF0C\u5E76\u4E14\u4E0D\u4F1A\u6301\u4E45\u5316\uFF08\u91CD\u65B0\u52A0\u8F7D\u5373\u5931\u6548\uFF09\u3002"
		},
		"Cache duration": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_duration",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F13\u5B58\u6301\u7EED\u65F6\u95F4"
		},
		"How long for media to remain cached. Set to `0` for unlimited.": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_duration",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5A92\u4F53\u88AB\u7F13\u5B58\u591A\u4E45\u3002\u8BBE\u4E3A 0 \u5219\u65E0\u9650\u5236\u3002"
		},
		"minutes": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_duration",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u5206\u949F"
		},
		"Cache item limit": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_itemlimit",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F13\u5B58\u6570\u91CF\u9650\u5236"
		},
		"Maximum number of individual media to remain cached. Set to `0` for unlimited.": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_itemlimit",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6700\u591A\u7F13\u5B58\u591A\u5C11\u4E2A\u5A92\u4F53\u3002\u8BBE\u4E3A 0 \u5219\u65E0\u9650\u5236\u3002"
		},
		"items": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_itemlimit",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u9879"
		},
		"Resume videos": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_resume_video",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7EE7\u7EED\u89C6\u9891"
		},
		"If a video popup was closed then reopened, the video will resume from where it left off": {
			"_info": {
				"instances": [
					{
						"setting": "popup_cache_resume_video",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u4E00\u4E2A\u89C6\u9891\u5F39\u7A97\u88AB\u5173\u95ED\u7136\u540E\u518D\u6B21\u6253\u5F00\uFF0C\u8BE5\u89C6\u9891\u5C06\u4ECE\u4E0A\u6B21\u79BB\u5F00\u7684\u8FDB\u5EA6\u7EE7\u7EED\u64AD\u653E"
		},
		"Use userscript": {
			"_info": {
				"instances": [
					{
						"setting": "website_inject_imu",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u7528\u6237\u811A\u672C"
		},
		"Replaces the website's IMU instance with the userscript": {
			"_info": {
				"instances": [
					{
						"setting": "website_inject_imu",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u7528\u6237\u811A\u672C\u66FF\u6362\u8BE5\u7F51\u7AD9\u7684 Image Max URL \u5B9E\u4F8B"
		},
		"Website image preview": {
			"_info": {
				"instances": [
					{
						"setting": "website_image",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7F51\u7AD9\u56FE\u7247\u9884\u89C8"
		},
		"Enables a preview of the image on the Image Max URL website": {
			"_info": {
				"instances": [
					{
						"setting": "website_image",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u5728 Image Max URL \u7F51\u7AD9\u4E0A\u9884\u89C8\u56FE\u7247"
		},
		"IMU entry in context menu": {
			"_info": {
				"instances": [
					{
						"setting": "extension_contextmenu",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53F3\u952E\u83DC\u5355\u4E2D\u7684 Image Max URL \u9879"
		},
		"Enables a custom entry for this extension in the right click/context menu": {
			"_info": {
				"instances": [
					{
						"setting": "extension_contextmenu",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u53F3\u952E\u83DC\u5355/\u4E0A\u4E0B\u6587\u83DC\u5355\u4E2D\u542F\u7528\u672C\u6269\u5C55\u5B9A\u4E49\u7684\u83DC\u5355"
		},
		"Hot (re)load": {
			"_info": {
				"instances": [
					{
						"setting": "extension_hotreload",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u70ED\u91CD\u8F7D"
		},
		"(Re)loads the extension on all existing pages when installing or updating": {
			"_info": {
				"instances": [
					{
						"setting": "extension_hotreload",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5B89\u88C5\u6216\u66F4\u65B0\u540E\uFF0C\u70ED\u91CD\u8F7D\u73B0\u6709\u7684\u5168\u90E8\u9875\u9762\u4E0A\u7684\u672C\u6269\u5C55"
		},
		"Custom XHR for libraries": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u81EA\u5B9A\u4E49\u7A0B\u5E8F\u5E93\u7684 XHR"
		},
		"Allows the use of more powerful XHR (network requests) for 3rd-party libraries. This allows for certain DASH streams to work.": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u7B2C\u4E09\u65B9\u5E93\u4F7F\u7528\u66F4\u5F3A\u5927\u7684 XHR\uFF08\u7F51\u7EDC\u8BF7\u6C42\uFF09\u3002\u67D0\u4E9B DASH \u6D41\u5A92\u4F53\u9700\u8981\u8FD9\u4E2A\u3002"
		},
		"Allows the use of more powerful XHR  (network requests) for 3rd-party libraries. This allows for certain DASH streams to work. Using this with the userscript version currently poses a potential security risk.": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "description_userscript"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u7B2C\u4E09\u65B9\u5E93\u4F7F\u7528\u66F4\u5F3A\u5927\u7684 XHR\uFF08\u7F51\u7EDC\u8BF7\u6C42\uFF09\u3002\u67D0\u4E9B DASH \u6D41\u5A92\u4F53\u9700\u8981\u8FD9\u4E2A\u3002\u5728\u76EE\u524D\u7684\u7528\u6237\u811A\u672C\u7248\u672C\u4E2D\u4F7F\u7528\u8FD9\u79CD\u65B9\u6CD5\u6784\u6210\u6F5C\u5728\u7684\u5B89\u5168\u98CE\u9669\u3002"
		},
		"Kakao": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "Kakao"
		},
		"YouTube": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "example_websites[1]"
					}
				]
			},
			"zh-CN": "YouTube"
		},
		"Instagram (downloading)": {
			"_info": {
				"instances": [
					{
						"setting": "custom_xhr_for_lib",
						"field": "example_websites[2]"
					}
				]
			},
			"zh-CN": "Instagram (\u4E0B\u8F7D)"
		},
		"Use Web Archive for libraries": {
			"_info": {
				"instances": [
					{
						"setting": "use_webarchive_for_lib",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E3A\u7A0B\u5E8F\u5E93\u4F7F\u7528 Web Archive \u7248\u672C"
		},
		"Uses archive.org's web archive instead of github for libraries and other script internals (such as the options page).\nDon't enable this unless you need to.": {
			"_info": {
				"instances": [
					{
						"setting": "use_webarchive_for_lib",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E3A\u7A0B\u5E8F\u5E93\u548C\u811A\u672C\u5185\u7F6E\u7684\u5176\u4ED6\u6587\u4EF6\uFF08\u5982\u8FD9\u4E2A\u9009\u9879\u9875\u9762\uFF09\u4F7F\u7528 archive.org \u7684\u5B58\u6863\u7248\u672C\u800C\u975E github \u7248\u672C\u3002\n\u9664\u975E\u786E\u5B9E\u9700\u8981\uFF0C\u5426\u5219\u65E0\u9700\u542F\u7528\u3002"
		},
		"Enable integrity checks": {
			"_info": {
				"instances": [
					{
						"setting": "lib_integrity_check",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5B8C\u6574\u6027\u68C0\u67E5"
		},
		"Runs integrity checks before loading 3rd-party libraries": {
			"_info": {
				"instances": [
					{
						"setting": "lib_integrity_check",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u52A0\u8F7D\u7B2C\u4E09\u65B9\u5E93\u4E4B\u524D\u8FD0\u884C\u5B8C\u6574\u6027\u68C0\u67E5"
		},
		"HLS/DASH maximum quality": {
			"_info": {
				"instances": [
					{
						"setting": "hls_dash_use_max",
						"field": "name"
					}
				]
			},
			"zh-CN": "HLS/DASH \u6700\u9AD8\u8D28\u91CF"
		},
		"Uses the maximum quality for HLS/DASH streams": {
			"_info": {
				"instances": [
					{
						"setting": "hls_dash_use_max",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5BF9 HLS/DASH \u6D41\u5A92\u4F53\u4F7F\u7528\u6700\u9AD8\u8D28\u91CF"
		},
		"Maximum video quality": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6700\u9AD8\u89C6\u9891\u8D28\u91CF"
		},
		"Maximum quality for videos": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u89C6\u9891\u7684\u6700\u9AD8\u8D28\u91CF"
		},
		"(unlimited)": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.unlimited.name"
					}
				]
			},
			"zh-CN": "\uFF08\u65E0\u9650\u5236\uFF09"
		},
		"4K": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.h2160.name"
					}
				]
			},
			"zh-CN": "4K"
		},
		"1440p": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.h1440.name"
					}
				]
			},
			"zh-CN": "1440p"
		},
		"1080p": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.h1080.name"
					}
				]
			},
			"zh-CN": "1080p"
		},
		"720p": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.h720.name"
					}
				]
			},
			"zh-CN": "720p"
		},
		"480p": {
			"_info": {
				"instances": [
					{
						"setting": "max_video_quality",
						"field": "options.h480.name"
					}
				]
			},
			"zh-CN": "480p"
		},
		"Larger watermarked images": {
			"_info": {
				"instances": [
					{
						"setting": "allow_watermark",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8F83\u5927\u7684\u5E26\u6C34\u5370\u56FE\u50CF"
		},
		"Enables rules that return larger images that include watermarks": {
			"_info": {
				"instances": [
					{
						"setting": "allow_watermark",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89C4\u5219\uFF1A\u8FD4\u56DE\u5305\u542B\u6C34\u5370\u7684\u8F83\u5927\u56FE\u50CF"
		},
		"Stock photo websites": {
			"_info": {
				"instances": [
					{
						"setting": "allow_watermark",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "\u201C\u56FE\u5E93\u7167\u7247\u201D\u7F51\u7AD9"
		},
		"Smaller non-watermarked images": {
			"_info": {
				"instances": [
					{
						"setting": "allow_smaller",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u8F83\u5C0F\u7684\u65E0\u6C34\u5370\u56FE\u50CF"
		},
		"Enables rules that return smaller images without watermarks": {
			"_info": {
				"instances": [
					{
						"setting": "allow_smaller",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89C4\u5219\uFF1A\u8FD4\u56DE\u65E0\u6C34\u5370\u7684\u8F83\u5C0F\u56FE\u50CF"
		},
		"Possibly different images": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_different",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53EF\u80FD\u4E0D\u540C\u7684\u56FE\u50CF"
		},
		"Enables rules that return images that possibly differ, usually due to server-side caching": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_different",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89C4\u5219\uFF1A\u8FD4\u56DE\u53EF\u80FD\u6709\u6240\u4E0D\u540C\u7684\u56FE\u50CF\uFF0C\u4E0D\u540C\u901A\u5E38\u7531\u4E8E\u670D\u52A1\u5668\u4FA7\u7F13\u5B58"
		},
		"Possibly broken images": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_broken",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53EF\u80FD\u7834\u635F\u7684\u56FE\u50CF"
		},
		"Enables rules that return images that are possibly broken": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_broken",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89C4\u5219\uFF1A\u8FD4\u56DE\u53EF\u80FD\u5DF2\u635F\u574F\u7684\u56FE\u50CF"
		},
		"Possibly upscaled images": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_upscaled",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u53EF\u80FD\u6269\u589E\u5C3A\u5BF8\u7684\u56FE\u50CF"
		},
		"Enables rules that return images that are possibly upscaled": {
			"_info": {
				"instances": [
					{
						"setting": "allow_possibly_upscaled",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89C4\u5219\uFF1A\u8FD4\u56DE\u53EF\u80FD\u5DF2\u6269\u589E\u5C3A\u5BF8\u7684\u56FE\u50CF"
		},
		"Rules using 3rd-party websites": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u7B2C\u4E09\u65B9\u7F51\u7AD9\u7684\u89C4\u5219"
		},
		"Enables rules that use 3rd-party websites": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u57FA\u4E8E\u7B2C\u4E09\u65B9\u7F51\u7AD9\u7684\u89C4\u5219"
		},
		"Newsen": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "Newsen"
		},
		"Rules using API calls": {
			"_info": {
				"instances": [
					{
						"setting": "allow_apicalls",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u57FA\u4E8E API \u8C03\u7528\u7684\u89C4\u5219"
		},
		"Enables rules that use API calls. Strongly recommended to keep this enabled": {
			"_info": {
				"instances": [
					{
						"setting": "allow_apicalls",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u57FA\u4E8E API \u8C03\u7528\u7684\u89C4\u5219\u3002\u5F3A\u70C8\u5EFA\u8BAE\u4FDD\u6301\u6B64\u9879\u542F\u7528"
		},
		"Instagram": {
			"_info": {
				"instances": [
					{
						"setting": "allow_apicalls",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "Instagram"
		},
		"Flickr": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_force_page",
						"field": "example_websites[0]"
					},
					{
						"setting": "allow_apicalls",
						"field": "example_websites[1]"
					}
				]
			},
			"zh-CN": "Flickr"
		},
		"...": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_force_page",
						"field": "example_websites[2]"
					},
					{
						"setting": "allow_apicalls",
						"field": "example_websites[2]"
					}
				]
			},
			"zh-CN": "..."
		},
		"Allow 3rd-party libraries": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_libs",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u7B2C\u4E09\u65B9\u5E93"
		},
		"Enables using 3rd-party libraries. This is both used in rules and as a prerequisite for certain functionality.": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_libs",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u7B2C\u4E09\u65B9\u5E93\u7684\u8C03\u7528\u3002\u8FD9\u53EF\u80FD\u7528\u4E8E\u89C4\u5219\u548C\u67D0\u4E9B\u529F\u80FD\u7684\u5148\u51B3\u6761\u4EF6\u3002"
		},
		"Enables using 3rd-party libraries. This is both used in rules and as a prerequisite for certain functionality.\nThere is a possible (but unlikely) security risk for the userscript version.": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_libs",
						"field": "description_userscript"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u7B2C\u4E09\u65B9\u5E93\u7684\u8C03\u7528\u3002\u8FD9\u53EF\u80FD\u7528\u4E8E\u89C4\u5219\u548C\u67D0\u4E9B\u529F\u80FD\u7684\u5148\u51B3\u6761\u4EF6\u3002\n\u8FD9\u5BF9\u4E8E\u7528\u6237\u811A\u672C\u7248\u6765\u8BF4\uFF0C\u6709\u8F83\u4F4E\u7684\u6F5C\u5728\u7684\u5B89\u5168\u98CE\u9669\u3002"
		},
		"Sites using testcookie (slowAES)": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_libs",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 testcokie \u7684\u7F51\u7AD9\uFF08\u6162AES\uFF09"
		},
		"Rules executing 3rd-party code": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_code",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6267\u884C\u7B2C\u4E09\u65B9\u4EE3\u7801\u7684\u89C4\u5219"
		},
		"Enables rules that execute arbitrary 3rd-party code stored on websites.": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_code",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u5C06\u6267\u884C\u5B58\u50A8\u5728\u7F51\u7AD9\u4E0A\u7684\u4EFB\u610F\u7B2C\u4E09\u65B9\u4EE3\u7801\u7684\u89C4\u5219\u3002"
		},
		"This could lead to security risks, please be careful when using this option!": {
			"_info": {
				"instances": [
					{
						"setting": "allow_thirdparty_code",
						"field": "warning.true"
					}
				]
			},
			"zh-CN": "\u8FD9\u53EF\u80FD\u5BFC\u81F4\u5B89\u5168\u98CE\u9669\uFF0C\u614E\u91CD\u4F7F\u7528\u6B64\u9009\u9879\uFF01"
		},
		"Rules using brute-force": {
			"_info": {
				"instances": [
					{
						"setting": "allow_bruteforce",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u66B4\u529B\u7834\u89E3\u7684\u89C4\u5219"
		},
		"Enables rules that require using brute force (through binary search) to find the original image": {
			"_info": {
				"instances": [
					{
						"setting": "allow_bruteforce",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u9700\u8981\u51ED\u501F\u86EE\u529B\uFF08\u4E8C\u8FDB\u5236\u641C\u7D22\uFF09\u627E\u5230\u539F\u59CB\u56FE\u50CF\u7684\u89C4\u5219"
		},
		"Deezer": {
			"_info": {
				"instances": [
					{
						"setting": "allow_bruteforce",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "Deezer"
		},
		"Use browser cookies": {
			"_info": {
				"instances": [
					{
						"setting": "browser_cookies",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u6D4F\u89C8\u5668 Cookie"
		},
		"Uses the browser's cookies for API calls in order to access otherwise private data": {
			"_info": {
				"instances": [
					{
						"setting": "browser_cookies",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8 API \u8C03\u7528\u4F7F\u7528\u6D4F\u89C8\u5668\u7684 Cookie \u6765\u8BBF\u95EE\u975E\u516C\u5F00\u6570\u636E"
		},
		"Private Flickr images": {
			"_info": {
				"instances": [
					{
						"setting": "browser_cookies",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "\u79C1\u4EBA Flickr \u56FE\u50CF"
		},
		"DeviantART: Prefer size over original": {
			"_info": {
				"instances": [
					{
						"setting": "deviantart_prefer_size",
						"field": "name"
					}
				]
			},
			"zh-CN": "DeviantART: \u5C3A\u5BF8\u6BD4\u539F\u7248\u66F4\u91CD\u8981"
		},
		"Prefers a larger (but not upscaled) thumbnail image over a smaller original animated image": {
			"_info": {
				"instances": [
					{
						"setting": "deviantart_prefer_size",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u504F\u597D\u5C3A\u5BF8\u8F83\u5927\uFF08\u4F46\u975E\u6269\u589E\uFF09\u4F46\u975E\u539F\u59CB\u5C3A\u5BF8\u7684\u7F29\u7565\u56FE\u56FE\u50CF\uFF0C\u800C\u4E0D\u662F\u539F\u59CB\u5C3A\u5BF8\u4F46\u5C3A\u5BF8\u8F83\u5C0F\u7684\u52A8\u753B\u56FE\u50CF"
		},
		"DeviantART: Use download links": {
			"_info": {
				"instances": [
					{
						"setting": "deviantart_support_download",
						"field": "name"
					}
				]
			},
			"zh-CN": "DeviantART: \u4F7F\u7528\u4E0B\u8F7D\u94FE\u63A5"
		},
		"Prefers using the download link (if available) by default. Note that this only works if you're logged in to DeviantART": {
			"_info": {
				"instances": [
					{
						"setting": "deviantart_support_download",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u504F\u597D\u9ED8\u8BA4\u4F7F\u7528\u4E0B\u8F7D\u94FE\u63A5\uFF08\u5982\u679C\u53EF\u7528\uFF09\u3002\u6CE8\u610F\uFF0C\u4EC5\u5728\u767B\u5F55 DeviantART \u540E\u6709\u6548"
		},
		"E-Hentai: Use full image": {
			"_info": {
				"instances": [
					{
						"setting": "ehentai_full_image",
						"field": "name"
					}
				]
			},
			"zh-CN": "E-Hentai: \u4F7F\u7528\u5B8C\u6574\u56FE\u50CF"
		},
		"Prefers using full/original images if available (logged in). This is more likely to get you rate limited": {
			"_info": {
				"instances": [
					{
						"setting": "ehentai_full_image",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u504F\u597D\u4F7F\u7528\u5168\u5C3A\u5BF8\u539F\u7248\u56FE\u50CF\u3002\u9700\u8981\u5DF2\u767B\u5F55\u3002\u4F7F\u7528\u5B83\u5C06\u66F4\u5BB9\u6613\u906D\u9047\u901F\u7387\u9650\u5236"
		},
		"Imgur: Use original filename": {
			"_info": {
				"instances": [
					{
						"setting": "imgur_filename",
						"field": "name"
					}
				]
			},
			"zh-CN": "Imgur: \u4F7F\u7528\u539F\u59CB\u6587\u4EF6\u540D"
		},
		"If the original filename (the one used to upload the image) is found, use it instead of the image ID": {
			"_info": {
				"instances": [
					{
						"setting": "imgur_filename",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u627E\u5230\u539F\u59CB\u6587\u4EF6\u540D\uFF08\u4E0A\u4F20\u56FE\u50CF\u65F6\u7684\u6587\u4EF6\u540D\uFF09\uFF0C\u4F7F\u7528\u5B83\u4EE3\u66FF\u56FE\u50CF ID"
		},
		"Imgur: Use source image": {
			"_info": {
				"instances": [
					{
						"setting": "imgur_source",
						"field": "name"
					}
				]
			},
			"zh-CN": "Imgur: \u4F7F\u7528\u6E90\u56FE\u50CF"
		},
		"If a source image is found for Imgur, try using it instead. Only works for old-style Imgur webpages (set `postpagebeta=0; postpagebetalogged=0` as cookies)": {
			"_info": {
				"instances": [
					{
						"setting": "imgur_source",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u627E\u5230 Imgur \u7684\u6E90\u56FE\u50CF\uFF0C\u5C1D\u8BD5\u4F7F\u7528\u5B83\u3002\u4EC5\u9002\u7528\u4E8E\u65E7\u7248 Imgur \u7F51\u9875\uFF08\u8BBE\u7F6E Cookie `postpagebeta=0; postpagebetalogged=0`\uFF09"
		},
		"Instagram: Use native API": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_use_app_api",
						"field": "name"
					}
				]
			},
			"zh-CN": "Instagram: \u4F7F\u7528\u539F\u751F API"
		},
		"Uses Instagram's native API if possible, requires you to be logged into Instagram. This usually allows for higher resolution images (1440x*) to be returned.": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_use_app_api",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C3D\u53EF\u80FD\u4F7F\u7528 Instagram \u7684\u539F\u751F API\uFF0C\u8FD9\u9700\u8981\u60A8\u5DF2\u767B\u5F55 Instagram\u3002\u901A\u5E38\u80FD\u8FD4\u56DE\u66F4\u9AD8\u5206\u8FA8\u7387\u7684\u56FE\u50CF\uFF081440x*\uFF09\u3002"
		},
		"Instagram: Don't use web API": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_dont_use_web",
						"field": "name"
					}
				]
			},
			"zh-CN": "Instagram: \u4E0D\u4F7F\u7528 Web API"
		},
		"Avoids using Instagram's web API if possible, which increases performance, but will occasionally sacrifice quality for videos": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_dont_use_web",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5C3D\u53EF\u80FD\u4E0D\u4F7F\u7528 Instagram \u7684 Web API\uFF0C\u8FD9\u53EF\u4EE5\u63D0\u5347\u6027\u80FD\uFF0C\u4F46\u5076\u5C14\u4F1A\u727A\u7272\u89C6\u9891\u54C1\u8D28"
		},
		"Instagram: Prefer quality over resolution": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_prefer_video_quality",
						"field": "name"
					}
				]
			},
			"zh-CN": "Instagram: \u504F\u597D\u9AD8\u8D28\u91CF\u800C\u4E0D\u662F\u5206\u8FA8\u7387"
		},
		"Prefers lower resolution videos that use a higher bitrate over higher resolution images. This adds a slight performance cost as it needs to fetch headers for multiple videos": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_prefer_video_quality",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u504F\u597D\u9AD8\u6BD4\u7279\u7387\u7684\u4F4E\u5206\u8FA8\u7387\u89C6\u9891\uFF0C\u800C\u4E0D\u662F\u9AD8\u5206\u8FA8\u7387\u56FE\u50CF\u3002\u8FD9\u8F7B\u5FAE\u8D44\u6E90\u6D88\u8017\uFF0C\u56E0\u4E3A\u9700\u8981\u83B7\u53D6\u591A\u4E2A\u89C6\u9891\u7684\u5934\u90E8"
		},
		"Instagram: Use albums for post thumbnails": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_gallery_postlink",
						"field": "name"
					}
				]
			},
			"zh-CN": "Instagram: \u4E3A\u5E16\u5B50\u7F29\u7565\u56FE\u4F7F\u7528\u76F8\u518C"
		},
		"Queries Instagram for albums when using the popup on a post thumbnail": {
			"_info": {
				"instances": [
					{
						"setting": "instagram_gallery_postlink",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E3A\u5E16\u5B50\u7F29\u7565\u56FE\u4F7F\u7528\u5F39\u7A97\u65F6\u67E5\u8BE2 Instagram \u76F8\u518C"
		},
		"Snapchat: Use original media without captions": {
			"_info": {
				"instances": [
					{
						"setting": "snapchat_orig_media",
						"field": "name"
					}
				]
			},
			"zh-CN": "Snapchat: \u4F7F\u7528\u6CA1\u6709\u6807\u9898\u7684\u539F\u59CB\u5A92\u4F53"
		},
		"Prefers using original media instead of media with captions and tags overlayed": {
			"_info": {
				"instances": [
					{
						"setting": "snapchat_orig_media",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u503E\u5411\u4E8E\u4F7F\u7528\u539F\u59CB\u5A92\u4F53\uFF0C\u800C\u4E0D\u662F\u6709\u6807\u9898\u548C\u6807\u7B7E\u8986\u76D6\u7684\u5A92\u4F53"
		},
		"Teddit: Use Reddit for media": {
			"_info": {
				"instances": [
					{
						"setting": "teddit_redirect_reddit",
						"field": "name"
					}
				]
			}
		},
		"Redirects media stored on Teddit to Reddit's servers. Disabling this may prevent finding original images because Teddit's image servers will only cache images fetched from posts, which are deleted after a few minutes.": {
			"_info": {
				"instances": [
					{
						"setting": "teddit_redirect_reddit",
						"field": "description"
					}
				]
			}
		},
		"TikTok: Don't use watermarked videos": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_no_watermarks",
						"field": "name"
					}
				]
			},
			"zh-CN": "TikTok: \u4E0D\u4F7F\u7528\u5E26\u6C34\u5370\u7684\u89C6\u9891"
		},
		"Uses non-watermarked videos for TikTok if possible. This will introduce an extra delay when loading the video as two extra requests need to be performed. It will also fail for any videos uploaded after ~late July 2020": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_no_watermarks",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u679C\u53EF\u80FD\uFF0C\u4E3A TikTok \u4F7F\u7528\u65E0\u6C34\u5370\u89C6\u9891\u3002\u52A0\u8F7D\u89C6\u9891\u65F6\u9700\u6267\u884C\u4E24\u4E2A\u989D\u5916\u7684\u8BF7\u6C42\uFF0C\u8FD9\u5C06\u589E\u52A0\u5EF6\u8FDF\u3002\u5BF92020\u5E747\u6708\u5DE6\u53F3\u4E4B\u540E\u4E0A\u4F20\u7684\u4EFB\u4F55\u89C6\u9891\u4E0D\u8D77\u4F5C\u7528"
		},
		"TikTok: 3rd-party watermark removal": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "name"
					}
				]
			},
			"zh-CN": "TikTok: \u7B2C\u4E09\u65B9\u6C34\u5370\u53BB\u9664"
		},
		"Uses a 3rd-party watermark removal site for TikTok.\nI do not endorse any of the sites supported. They may log your IP address and videos you submit. Use this option with caution.\n`LQ` = Low quality, `PL` = Public log": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528\u4E00\u4E2A\u9002\u7528\u4E8E TikTok \u7684\u7B2C\u4E09\u65B9\u6C34\u5370\u53BB\u9664\u7F51\u7AD9\u3002\n\u8FD9\u4E0D\u4EE3\u8868\u5BF9\u8BE5\u7F51\u7AD9\u7684\u8BA4\u53EF\u3002\u8BE5\u7F51\u7AD9\u53EF\u80FD\u8BB0\u5F55\u60A8\u7684 IP \u5730\u5740\u548C\u63D0\u4EA4\u7684\u89C6\u9891\u3002\u8C28\u614E\u4F7F\u7528\u3002\n`LQ` = \u4F4E\u54C1\u8D28\uFF0C`PL` = \u516C\u4F17\u65E5\u5FD7"
		},
		"(none)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.null.name"
					}
				]
			},
			"zh-CN": "(\u65E0)"
		},
		"ttloader.com": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.ttloader.com:ttt.name"
					}
				]
			},
			"zh-CN": "ttloader.com"
		},
		"onlinetik.com": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.onlinetik.com:ttt.name"
					}
				]
			},
			"zh-CN": "onlinetik.com"
		},
		"tikdowns.com": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.tikdowns.com:ttt.name"
					}
				]
			},
			"zh-CN": "tikdowns.com"
		},
		"ssstiktok.net": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.ssstiktok.net:ttt.name"
					}
				]
			},
			"zh-CN": "ssstiktok.net"
		},
		"keeptiktok.com (LQ)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.keeptiktok.com.name"
					}
				]
			},
			"zh-CN": "keeptiktok.com (LQ)"
		},
		"ssstiktok.io (LQ)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.ssstiktok.io:1.name"
					}
				]
			},
			"zh-CN": "ssstiktok.io (LQ)"
		},
		"musicallydown.com (LQ/PL)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.musicallydown.com:1.name"
					}
				]
			},
			"zh-CN": "musicallydown.com (LQ/PL)"
		},
		"snaptik.app (LQ)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.snaptik.app.name"
					}
				]
			},
			"zh-CN": "snaptik.app (LQ)"
		},
		"tikmate.online (LQ)": {
			"_info": {
				"instances": [
					{
						"setting": "tiktok_thirdparty",
						"field": "options.tikmate.online.name"
					}
				]
			},
			"zh-CN": "tikmate.online (LQ)"
		},
		"Tumblr: API key": {
			"_info": {
				"instances": [
					{
						"setting": "tumblr_api_key",
						"field": "name"
					}
				]
			},
			"zh-CN": "Tumblr: API \u5BC6\u94A5"
		},
		"API key for finding larger images on Tumblr": {
			"_info": {
				"instances": [
					{
						"setting": "tumblr_api_key",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7528\u4E8E\u5728 Tumblr \u4E0A\u67E5\u627E\u66F4\u5927\u56FE\u7247\u7684 API \u5BC6\u94A5"
		},
		"Twitter: Use extension": {
			"_info": {
				"instances": [
					{
						"setting": "twitter_use_ext",
						"field": "name"
					}
				]
			},
			"zh-CN": "Twitter: \u4F7F\u7528\u6269\u5C55\u540D"
		},
		"Prefers `.jpg?name=orig` over `?format=jpg&name=orig`. This will possibly incur extra requests before succeeding. Note that there is no difference in image quality.": {
			"_info": {
				"instances": [
					{
						"setting": "twitter_use_ext",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9996\u9009 `.jpg?name=orig` \u800C\u4E0D\u662F `?format=jpg&name=orig`\u3002\u8FD9\u53EF\u80FD\u5728\u6210\u529F\u524D\u4EA7\u751F\u989D\u5916\u7684\u8BF7\u6C42\u3002\u6CE8\u610F\uFF0C\u56FE\u50CF\u8D28\u91CF\u4E0A\u6CA1\u6709\u5DEE\u5F02\u3002"
		},
		"Blacklist": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9ED1\u540D\u5355"
		},
		"A list of URLs (one per line) that are blacklisted from being processed": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5904\u7406\u8FC7\u7A0B\u7684\u9ED1\u540D\u5355\u7F51\u5740\u5217\u8868\uFF08\u6BCF\u884C\u4E00\u6761\uFF09"
		},
		"The examples below are written for the simple (glob) engine, not the regex engine. The glob engine is generally based on the UNIX glob syntax.<br />\n<ul><br />\n<li><code>google.com</code> will block https://google.com/, https://www.google.com/, https://abcdef.google.com/, https://def.abc.google.com/, etc.</li>\n<li><code>abc.google.com</code> will block https://abc.google.com/, https://def.abc.google.com/, etc.</li>\n<li><code>*.google.com</code> will block https://www.google.com/, https://def.abc.google.com/, etc. but not https://google.com/</li>\n<li><code>google.*/</code> will block https://google.com/, https://www.google.co.uk, etc.</li>\n<li><code>http://google.com</code> will block http://google.com/, but not https://google.com/, http://www.google.com/, etc.</li>\n<li><code>google.com/test</code> will block https://google.com/test, https://www.google.com/test/abcdef, but not https://google.com/, etc.</li>\n<li><code>google.com/*/test</code> will block https://google.com/abc/test, but not https://google.com/test or https://google.com/abc/def/test</li>\n<li><code>google.com/**/test</code> will block https://google.com/abc/test, https://google.com/abc/def/test, https://google.com/abc/def/ghi/test, etc. but not https://google.com/test</li>\n<li><code>g??gle.com</code> will block https://google.com/, https://gaagle.com/, https://goagle.com/, etc.</li>\n<li><code>google.{com,co.uk}</code> will block https://google.com/ and https://google.co.uk/</li>\n<li><code>g[oau]ogle.com</code> will block https://google.com/, https://gaogle.com/, and http://www.guogle.com/</li>\n<li><code>g[0-9]ogle.com</code> will block https://g0ogle.com/, https://g1ogle.com/, etc. (up to https://g9ogle.com/)</li>\n</ul>": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist",
						"field": "documentation.value"
					}
				]
			},
			"zh-CN": "\u4E0B\u9762\u7684\u793A\u4F8B\u662F\u4E3A\u5EFA\u8BAE\uFF08glob\uFF09\u5F15\u64CE\u7F16\u5199\uFF0C\u800C\u975E\u6B63\u5219\u8868\u8FBE\u5F0F\u5F15\u64CE\u3002Glob \u5F15\u64CE\u901A\u5E38\u57FA\u4E8E UNIX glob \u8BED\u6CD5\u3002<br />\n<ul><br />\n<li><code>google.com</code> \u5C06\u5C4F\u853D https://google.com/, https://www.google.com/, https://abcdef.google.com/, https://def.abc.google.com/ \u7B49\u3002</li>\n<li><code>abc.google.com</code> \u5C06\u5C4F\u853D https://abc.google.com/, https://def.abc.google.com/ \u7B49\u3002</li>\n<li><code>*.google.com</code> \u5C06\u5C4F\u853D https://www.google.com/, https://def.abc.google.com/ \u7B49\u3002\u4F46\u4E0D\u542B https://google.com/</li>\n<li><code>google.*/</code> \u5C06\u5C4F\u853D https://google.com/, https://www.google.co.uk \u7B49\u3002</li>\n<li><code>http://google.com</code> \u5C06\u5C4F\u853D http://google.com/, but not https://google.com/, http://www.google.com/ \u7B49\u3002</li>\n<li><code>google.com/test</code> \u5C06\u5C4F\u853D https://google.com/test, https://www.google.com/test/abcdef, but not https://google.com/ \u7B49\u3002</li>\n<li><code>google.com/*/test</code> \u5C06\u5C4F\u853D https://google.com/abc/test\uFF0C\u4F46\u4E0D\u542B https://google.com/test \u6216 https://google.com/abc/def/test</li>\n<li><code>google.com/**/test</code> \u5C06\u5C4F\u853D https://google.com/abc/test, https://google.com/abc/def/test, https://google.com/abc/def/ghi/test \u7B49\u3002 but not https://google.com/test</li>\n<li><code>g??gle.com</code> \u5C06\u5C4F\u853D https://google.com/, https://gaagle.com/, https://goagle.com/ \u7B49\u3002</li>\n<li><code>google.{com,co.uk}</code> \u5C06\u5C4F\u853D https://google.com/ \u548Chttps://google.co.uk/</li>\n<li><code>g[oau]ogle.com</code> \u5C06\u5C4F\u853D https://google.com/, https://gaogle.com/, \u548Chttp://www.guogle.com/</li>\n<li><code>g[0-9]ogle.com</code> \u5C06\u5C4F\u853D https://g0ogle.com/, https://g1ogle.com/ \u7B49\u3002 (up to https://g9ogle.com/)</li>\n</ul>"
		},
		"Blacklist engine": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist_engine",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9ED1\u540D\u5355\u5F15\u64CE"
		},
		"How the blacklist should be processed": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist_engine",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5E94\u5982\u4F55\u5904\u7406\u9ED1\u540D\u5355"
		},
		"Simple (glob)": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist_engine",
						"field": "options.glob.name"
					}
				]
			},
			"zh-CN": "\u7B80\u6613 (glob)"
		},
		"Regex": {
			"_info": {
				"instances": [
					{
						"setting": "bigimage_blacklist_engine",
						"field": "options.regex.name"
					}
				]
			},
			"zh-CN": "\u6B63\u5219\u8868\u8FBE\u5F0F"
		},
		"Filename format": {
			"_info": {
				"instances": [
					{
						"setting": "filename_format",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6587\u4EF6\u540D\u683C\u5F0F"
		},
		"Format string(s) for the filename": {
			"_info": {
				"instances": [
					{
						"setting": "filename_format",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6587\u4EF6\u540D\u683C\u5F0F\u5316\u8981\u7528\u5230\u7684\u5B57\u7B26\u4E32"
		},
		"Documentation": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_styles",
						"field": "documentation.title"
					},
					{
						"setting": "bigimage_blacklist",
						"field": "documentation.title"
					},
					{
						"setting": "filename_format",
						"field": "documentation.title"
					}
				]
			},
			"zh-CN": "\u6587\u6863"
		},
		"<p>Variables are specified between curly brackets (<code>{}</code>).</p>\n<p>Below is a list of valid variables:</p>\n<ul><br />\n<li><code>filename</code> - Original filename (with extension, if applicable)</li>\n<li><code>filename_noext</code> - Original filename (without extension, if applicable)</li>\n<li><code>ext</code> - Extension (with <code>.</code> prefixed)</li>\n<li><code>caption</code> - Popup caption</li>\n<li><code>author_username</code> - Author's username</li>\n<li><code>id</code> - Post ID</li>\n<li><code>host_title</code> - Title of the current tab/window</li>\n<li><code>host_url</code> - URL of the host webpage</li>\n<li><code>host_domain</code> - Domain of the host webpage</li>\n<li><code>host_domain_nosub</code> - Domain (without subdomains) of the host webpage</li>\n<li><code>url</code> - URL of the media</li>\n<li><code>domain</code> - Domain of the media</li>\n<li><code>domain_nosub</code> - Domain (without subdomains) of the media</li>\n<li><code>is_screenshot</code> - Blank, the line will only be processed when screenshotting a video</li>\n<li><code>prefix</code>, <code>suffix</code> - Blank by default, these variables will be automatically prefixed/suffixed to the filename if set using <code>:=</code></li>\n<li><code>created_...</code> - Created date (see note on Date objects below)</li>\n<li><code>updated_...</code> - Updated date, this will use the <code>Last-Modified</code> header if not otherwise specified by the rule (see note on Date objects below)</li>\n<li><code>download_...</code> - Download date (see note on Date objects below)</li>\n<li><code>date_...</code> - Created/updated date (see note on Date objects below)</li>\n</ul><br />\n<p>You can truncate the value of a variable by adding <code>:(number)</code> before the end bracket (<code>}</code>). For example:</p>\n<ul><br />\n<li><code>{caption:10}</code> - Truncates the caption to be at most 10 characters long</li>\n<li><code>{caption:10.}</code> - Same, but will add an ellipsis (\u2026) if the caption was truncated</li>\n</ul><br />\n<p>If a variable doesn't exist, by default it will ignore the current format string and use the one on the next line, unless <code>?</code> is added before the end bracket. For example:</p>\n<ul><br />\n<li><code>{ext?}</code> - Will be replaced with nothing if <code>ext</code> doesn't exist</li>\n<li><code>{caption?no caption}</code> - Will be replaced with <code>no caption</code> if <code>caption</code> doesn't exist</li>\n</ul><br />\n<p>You can check for equality and inequality with <code>==</code> and <code>!=</code> operators respectively. For example:</p>\n<ul><br />\n<li><code>{domain_nosub==cdninstagram.com}{author_username} {id}</code> - Will only run the current format (<code>{author_username} {id}</code> in this case) if the domain is cdninstagram.com</li>\n</ul><br />\n<p>You can check if a variable contains a string with <code>/=</code> (<code>!/=</code> for the opposite). It also supports two flags, <code>r</code> (regex) and <code>c</code> (case-sensitive), if added between <code>/</code> and <code>=</code>. For example:</p>\n<ul><br />\n<li><code>{domain/=instagram}{id}</code> - Will only run the current format (<code>{id}</code>) if the domain contains <code>instagram</code></li>\n<li><code>{domain!/=instagram}{id}</code> - Likewise, but only if the domain does not contain <code>instagram</code></li>\n<li><code>{domain/r=inst.*ram}{id}</code> - Likewise, but only if the domain matches the regex <code>inst.*ram</code></li>\n<li><code>{window_title/c=Instagram}{id}</code> - Likewise, but only if the window's title contains <code>Instagram</code> (case-sensitively)</li>\n<li><code>{window_title!/rc=Inst.*ram}{id}</code> - Likewise, but only if the window's title does not match the case-sensitive regex <code>Inst.*ram</code></li>\n</ul><br />\n<p>You can set a custom variable with <code>:=</code>. For example:</p>\n<ul><br />\n<li><code>{domain_nosub==cdninstagram.com}{foo:=bar}</code> - Sets the variable <code>foo</code> to <code>bar</code> if the domain is <code>cdninstagram.com</code>. The variable can then be accessed with e.g. <code>{foo}</code></li>\n</ul><br />\n<p>Date objects are accessible through a number of properties. Each property can be suffixed with <code>_utc</code> to get the UTC/GMT equivalent.</p>\n<ul><br />\n<li><code>..._iso</code> - Date in ISO format (e.g. <code>2019-12-31T23-30-56</code>). Note that <code>:</code> is replaced with <code>-</code> to avoid issues with paths under NTFS.</li>\n<li><code>..._ago</code> - Human-readable representation of the time elapsed since the date (e.g. <code>1 year and 10 months ago</code>, <code>5 months and 20 days ago</code>)</li>\n<li><code>..._unix</code> - Unix timestamp (e.g. <code>1577912345</code>)</li>\n<li><code>..._unix_ms</code> - Unix timestamp with millisecond accuracy (e.g. <code>1577912345678</code>)</li>\n<li><code>..._yyyymmdd</code> - Date in YYYYMMDD format (e.g. <code>20191230</code>)</li>\n<li><code>..._hhmmss</code> - Time in HHMMSS format (e.g. <code>233056</code>)</li>\n<li><code>..._year</code> - Full year (e.g. <code>2019</code>)</li>\n<li><code>..._month</code> - Zero-padded month (e.g. <code>12</code>)</li>\n<li><code>..._day</code> - Zero-padded day (e.g. <code>31</code>)</li>\n<li><code>..._hours</code> - Zero-padded hours in military/24-hour format (e.g. <code>23</code>)</li>\n<li><code>..._minutes</code> - Zero-padded minutes (e.g. <code>30</code>)</li>\n<li><code>..._seconds</code> - Zero-padded seconds (e.g. <code>56</code>)</li>\n</ul>": {
			"_info": {
				"instances": [
					{
						"setting": "filename_format",
						"field": "documentation.value"
					}
				]
			},
			"zh-CN": "<p>\u5927\u62EC\u53F7\u95F4\u53EF\u4F7F\u7528\u7684\u53D8\u91CF\uFF08<code>{}</code>\uFF09\u3002</p>\n<p>\u4E0B\u8FF0\u4E3A\u6709\u6548\u53D8\u91CF\u5217\u8868\uFF1A</p>\n<ul><br />\n<li><code>filename</code> - \u539F\u59CB\u6587\u4EF6\u540D\uFF08\u542B\u6269\u5C55\u540D\uFF0C\u5982\u9002\u7528\uFF09</li>\n<li><code>filename_noext</code> - \u539F\u59CB\u6587\u4EF6\u540D\uFF08\u65E0\u6269\u5C55\u540D\uFF0C\u5982\u9002\u7528\uFF09</li>\n<li><code>ext</code> - \u6269\u5C55\u540D\uFF08\u542B <code>.</code> \u524D\u7F00\uFF09</li>\n<li><code>caption</code> - \u5F39\u7A97\u7684\u6807\u9898</li>\n<li><code>author_username</code> - \u4F5C\u8005\u7684\u7528\u6237\u540D</li>\n<li><code>id</code> - \u5E16\u5B50 ID</li>\n<li><code>host_title</code> - \u5F53\u524D\u6807\u7B7E\u9875/\u7A97\u53E3\u7684\u6807\u9898</li>\n<li><code>host_url</code> - \u6258\u7BA1\u7F51\u9875\u7684\u7F51\u5740</li>\n<li><code>host_domain</code> - \u6258\u7BA1\u7F51\u9875\u7684\u57DF\u540D</li>\n<li><code>host_domain_nosub</code> - \u6258\u7BA1\u7F51\u9875\u7684\u57DF\u540D\uFF08\u4E0D\u542B\u5B50\u57DF\u540D\uFF09</li>\n<li><code>url</code> - \u5A92\u4F53\uFF08\u6587\u4EF6\uFF09\u7684\u7F51\u5740</li>\n<li><code>domain</code> - \u5A92\u4F53\uFF08\u6587\u4EF6\uFF09\u7684\u57DF\u540D</li>\n<li><code>domain_nosub</code> - \u5A92\u4F53\u7684\u57DF\u540D\uFF08\u4E0D\u542B\u5B50\u57DF\u540D\uFF09</li>\n<li><code>is_screenshot</code> - \u7A7A\u767D\uFF0C\u6B64\u884C\u4EC5\u5728\u5BF9\u89C6\u9891\u622A\u56FE\u65F6\u5904\u7406</li>\n<li><code>prefix</code>, <code>suffix</code> - \u9ED8\u8BA4\u7A7A\u767D\uFF0C\u8FD9\u4E9B\u53D8\u91CF\u5728\u4F7F\u7528 <code>:=</code> \u65F6\u81EA\u52A8\u4F5C\u4E3A\u6587\u4EF6\u540D\u7684\u524D\u7F00/\u540E\u7F00</li>\n<li><code>created_...</code> - \u521B\u5EFA\u65E5\u671F\uFF08\u8BE6\u89C1\u4E0B\u6587\u201C\u65E5\u671F\u201D\u5BF9\u8C61\uFF09</li>\n<li><code>updated_...</code> - \u66F4\u65B0\u65E5\u671F\uFF0C\u89C4\u5219\u672A\u53E6\u884C\u6307\u5B9A\u65F6\u5C06\u4F7F\u7528 <code>Last-Modified</code> \u5934\uFF08\u8BE6\u89C1\u4E0B\u6587\u201C\u65E5\u671F\u201D\u5BF9\u8C61\uFF09</li>\n<li><code>download_...</code> - \u4E0B\u8F7D\u65E5\u671F\uFF08\u8BE6\u89C1\u4E0B\u6587\u201C\u65E5\u671F\u201D\u5BF9\u8C61\uFF09</li>\n<li><code>date_...</code> - \u521B\u5EFA/\u66F4\u65B0\u65E5\u671F\uFF08\u8BE6\u89C1\u4E0B\u6587\u201C\u65E5\u671F\u201D\u5BF9\u8C61\uFF09</li>\n</ul><br />\n<p>\u60A8\u53EF\u4EE5\u5728\u53D8\u91CF\u7684\u53F3\u62EC\u53F7\uFF08<code>}</code>\uFF09\u524D\u6DFB\u52A0 <code>:(number)</code> \u6765\u622A\u65AD\u503C\u3002\u4F8B\u5982\uFF1A</p>\n<ul><br />\n<li><code>{caption:10}</code> - \u5C06\u6807\u9898\u622A\u65AD\u4E3A\u6700\u591A 10 \u4E2A\u5B57\u7B26</li>\n<li><code>{caption:10.}</code> - \u540C\u4E0A\uFF0C\u4F46\u5F53\u6807\u9898\u88AB\u622A\u65AD\u65F6\u8FFD\u52A0\u4E00\u4E2A\u7701\u7565\u53F7\uFF08\u2026\uFF09</li>\n</ul><br />\n<p>\u5982\u679C\u53D8\u91CF\u4E0D\u5B58\u5728\uFF0C\u9ED8\u8BA4\u5C06\u5FFD\u7565\u5F53\u524D\u7684\u683C\u5F0F\u5316\u5B57\u7B26\u4E32\uFF0C\u5E76\u4F7F\u7528\u4E0B\u4E00\u884C\uFF0C\u9664\u975E\u53F3\u62EC\u53F7\u524D\u6DFB\u52A0\u4E86 <code>?</code>\u3002\u4F8B\u5982\uFF1A</p>\n<ul><br />\n<li><code>{ext?}</code> - \u5728 <code>ext</code> \u4E0D\u5B58\u5728\u65F6\u53D8\u4E3A\u7A7A</li>\n<li><code>{caption?\u65E0\u6807\u9898}</code> - <code>caption</code> \u4E0D\u5B58\u5728\u65F6\u53D8\u4E3A <code>\u65E0\u6807\u9898</code></li>\n</ul><br />\n<p>\u53EF\u4EE5\u5206\u522B\u4F7F\u7528 <code>==</code> \u548C <code>!=</code> \u64CD\u4F5C\u7B26\u68C0\u67E5\u76F8\u7B49\u548C\u4E0D\u7B49\u5F0F\u3002\u4F8B\u5982\uFF1A</p>\n<ul><br />\n<li><code>{domain_nosub==cdninstagram.com}{author_username} {id}</code> - \u4EC5\u5728\u57DF\u540D\u4E3A cdninstagram.com \u65F6\u91C7\u7528\u8FD9\u6761\u683C\u5F0F\uFF08<code>{author_username} {id}</code>\uFF09</li>\n</ul><br />\n<p>\u53EF\u4EE5\u7528 <code>/=</code> \u68C0\u67E5\u53D8\u91CF\u662F\u5426\u5305\u542B\u6307\u5B9A\u5B57\u7B26\u4E32\uFF08<code>!/=</code> \u68C0\u67E5\u662F\u5426\u4E0D\u5305\u542B\uFF09\u3002\u5B83\u8FD8\u652F\u6301\u4E24\u4E2A\u6807\u5FD7\uFF0C<code>r</code>\uFF08\u6B63\u5219\u8868\u8FBE\u5F0F\uFF09\u548C <code>c</code>\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09\uFF0C\u52A0\u5728 <code>/</code> \u4E0E <code>=</code> \u4E4B\u95F4\u3002\u4F8B\u5982\uFF1A</p>\n<ul><br />\n<li><code>{domain/=instagram}{id}</code> - \u4EC5\u5728\u57DF\u540D\u5305\u542B <code>instagram</code> \u65F6\u91C7\u7528\u683C\u5F0F\uFF08<code>{id}</code>\uFF09</li>\n<li><code>{domain!/=instagram}{id}</code> - \u4EC5\u5728\u57DF\u540D\u4E0D\u5305\u542B <code>instagram</code> \u65F6</li>\n<li><code>{domain/r=inst.*ram}{id}</code> - \u4EC5\u5728\u57DF\u540D\u5339\u914D\u6B63\u5219\u8868\u8FBE\u5F0F <code>inst.*ram</code> \u65F6</li>\n<li><code>{window_title/c=Instagram}{id}</code> - \u4EC5\u5728\u7A97\u53E3\u6807\u9898\u5305\u542B <code>Instagram</code> \u65F6\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09</li>\n<li><code>{window_title!/rc=Inst.*ram}{id}</code> - \u4EC5\u5728\u7A97\u53E3\u6807\u9898\u4E0D\u5339\u914D\u533A\u5206\u5927\u5C0F\u5199\u7684\u6B63\u5219\u8868\u8FBE\u5F0F <code>Inst.*ram</code> \u65F6</li>\n</ul><br />\n<p>\u53EF\u4EE5\u7528 <code>:=</code> \u8BBE\u7F6E\u4E00\u4E2A\u81EA\u5B9A\u4E49\u53D8\u91CF\u3002\u4F8B\u5982\uFF1A</p>\n<ul><br />\n<li><code>{domain_nosub==cdninstagram.com}{foo:=bar}</code> - \u5982\u679C\u57DF\u540D\u662F <code>cdninstagram.com</code>\uFF0C\u8BBE\u7F6E\u53D8\u91CF <code>foo</code> \u4E3A <code>bar</code>\u3002\u53D8\u91CF\u7684\u8BBF\u95EE\u65B9\u5F0F\u5982 <code>{foo}</code></li>\n</ul><br />\n<p>\u65E5\u671F\u5BF9\u8C61\u53EF\u901A\u8FC7\u4F17\u591A\u5C5E\u6027\u8BBF\u95EE\u3002\u6BCF\u4E2A\u5C5E\u6027\u90FD\u53EF\u4EE5\u540E\u7F00 <code>_utc</code> \u6765\u83B7\u53D6\u7B49\u6548\u7684 UTC/GMT \u65F6\u95F4\u3002</p>\n<ul><br />\n<li><code>..._iso</code> - ISO \u683C\u5F0F\u7684\u65E5\u671F\uFF08\u4F8B\u5982 <code>2019-12-31T23-30-56</code>\uFF09\u3002\u6CE8\u610F\uFF0C<code>:</code> \u88AB\u66FF\u6362\u4E3A <code>-</code> \u4EE5\u907F\u514D\u8FDD\u53CD NTFS \u8DEF\u5F84\u7EA6\u675F\u3002</li>\n<li><code>..._ago</code> - \u6613\u4E8E\u9605\u8BFB\u7684\u5DF2\u7ECF\u8FC7\u65F6\u95F4\uFF08\u4F8B\u5982 <code>1 year and 10 months ago</code>\u3001<code>5 months and 20 days ago</code>\uFF09</li>\n<li><code>..._unix</code> - Unix \u65F6\u95F4\u6233\uFF08\u4F8B\u5982 <code>1577912345</code>\uFF09</li>\n<li><code>..._unix_ms</code> - Unix \u65F6\u95F4\u6233\uFF0C\u6BEB\u79D2\u7CBE\u5EA6\uFF08\u4F8B\u5982 <code>1577912345678</code>\uFF09</li>\n<li><code>..._yyyymmdd</code> - YYYYMMDD \u683C\u5F0F\u65E5\u671F\uFF08\u4F8B\u5982 <code>20191230</code>\uFF09</li>\n<li><code>..._hhmmss</code> - HHMMSS \u683C\u5F0F\u65F6\u95F4\uFF08\u4F8B\u5982 <code>233056</code>\uFF09</li>\n<li><code>..._year</code> - \u5B8C\u6574\u5E74\u4EFD\uFF08\u4F8B\u5982 <code>2019</code>\uFF09</li>\n<li><code>..._month</code> - \u8865\u96F6\u6708\u4EFD\uFF08\u4F8B\u5982 <code>12</code>\uFF09</li>\n<li><code>..._day</code> - \u8865\u96F6\u7684\u65E5\uFF08\u4F8B\u5982 <code>31</code>\uFF09</li>\n<li><code>..._hours</code> - \u8865\u96F6\u7684\u5C0F\u65F6\uFF0C24\u5C0F\u65F6\u5236\uFF08\u4F8B\u5982 <code>23</code>\uFF09</li>\n<li><code>..._minutes</code> - \u8865\u96F6\u7684\u5206\u949F\uFF08\u4F8B\u5982 <code>30</code>\uFF09</li>\n<li><code>..._seconds</code> - \u8865\u96F6\u7684\u79D2\uFF08\u4F8B\u5982 <code>56</code>\uFF09</li>\n</ul>"
		},
		"Replace special characters with underscores": {
			"_info": {
				"instances": [
					{
						"setting": "filename_replace_special_underscores",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7528\u4E0B\u5212\u7EBF\u66FF\u6362\u7279\u6B8A\u5B57\u7B26"
		},
		"Replaces characters such as `/` or `\"` with `_` when downloading. Note that browsers will usually do this automatically, this is just to ensure consistent behavior.": {
			"_info": {
				"instances": [
					{
						"setting": "filename_replace_special_underscores",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D\u65F6\u5C06\u8BF8\u5982 `/`\u3001`\"` \u7B49\u5B57\u7B26\u66FF\u6362\u4E3A `_` \u3002\u6D4F\u89C8\u5668\u901A\u5E38\u4F1A\u81EA\u52A8\u8FD9\u6837\u505A\uFF0C\u8FD9\u53EA\u662F\u4E3A\u4E86\u786E\u4FDD\u4E00\u81F4\u7684\u884C\u4E3A\u3002"
		},
		"Trigger keybinding that will run the Replace Images function": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_keybinding",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u8FD0\u884C\u201C\u66FF\u6362\u56FE\u50CF\u201D\u529F\u80FD\u7684\u89E6\u53D1\u952E"
		},
		"Automatically replace images": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_auto",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u81EA\u52A8\u66FF\u6362\u56FE\u50CF"
		},
		"Automatically replace images to larger versions on pages you view": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_auto",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u60A8\u67E5\u770B\u7684\u9875\u9762\u4E0A\u81EA\u52A8\u5C06\u56FE\u50CF\u66FF\u6362\u4E3A\u8F83\u5927\u7248\u672C"
		},
		"This could lead to rate limiting or IP bans": {
			"_info": {
				"instances": [
					{
						"setting": "allow_bruteforce",
						"field": "warning.true"
					},
					{
						"setting": "replaceimgs_auto",
						"field": "warning.true"
					}
				]
			},
			"zh-CN": "\u8FD9\u53EF\u80FD\u5BFC\u81F4\u901F\u7387\u9650\u5236\u548C\u5C01\u7981 IP"
		},
		"Use data URLs": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_usedata",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 data URL"
		},
		"Uses data:// URLs instead of image links. Disabling this may improve compatibility with some bulk image downloader extensions": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_usedata",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4F7F\u7528 data:// URL \u4EE3\u66FF\u56FE\u50CF\u94FE\u63A5\u3002\u7981\u7528\u6B64\u529F\u80FD\u53EF\u80FD\u6539\u5584\u4E0E\u6279\u91CF\u4E0B\u8F7D\u56FE\u7247\u7684\u6269\u5C55\u7684\u517C\u5BB9\u6027"
		},
		"Wait until image is fully loaded": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_wait_fullyloaded",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7B49\u5F85\u81F3\u56FE\u50CF\u5B8C\u5168\u52A0\u8F7D"
		},
		"Waits until the image being replaced is fully loaded before moving on to the next image": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_wait_fullyloaded",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u79FB\u52A8\u5230\u4E0B\u4E00\u4E2A\u56FE\u50CF\u4E4B\u524D\uFF0C\u7B49\u5F85\u88AB\u66FF\u6362\u7684\u56FE\u50CF\u5B8C\u5168\u52A0\u8F7D"
		},
		"Max images to process at once": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_totallimit",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4E00\u6B21\u6700\u591A\u5904\u7406\u56FE\u50CF"
		},
		"The maximum amount of images to process at once": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_totallimit",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4E00\u6B21\u6700\u591A\u5904\u7406\u591A\u5C11\u4E2A\u56FE\u50CF"
		},
		"Max images per domain at once": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_domainlimit",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6BCF\u4E2A\u57DF\u4E00\u6B21\u6700\u591A\u56FE\u50CF"
		},
		"The maximum amount of images per domain to process at once": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_domainlimit",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6BCF\u4E2A\u57DF\uFF08\u540D\uFF09\u4E00\u6B21\u6700\u591A\u5904\u7406\u591A\u5C11\u4E2A\u56FE\u50CF"
		},
		"images": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_ui_gallerymax",
						"field": "number_unit"
					},
					{
						"setting": "replaceimgs_totallimit",
						"field": "number_unit"
					},
					{
						"setting": "replaceimgs_domainlimit",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u4E2A\u56FE\u50CF"
		},
		"Delay between same-domain images": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_delay",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u540C\u57DF\u56FE\u50CF\u4E4B\u95F4\u5EF6\u8FDF"
		},
		"New requests for images in the same domain will be delayed by this amount of seconds. Useful for avoiding rate limits.": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_delay",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5BF9\u540C\u57DF\u56FE\u50CF\u7684\u65B0\u8BF7\u6C42\u5C06\u5EF6\u8FDF\u6B64\u79D2\u6570\u3002\u6709\u52A9\u907F\u514D\u89E6\u53D1\u9891\u7387\u9650\u5236\u3002"
		},
		"seconds": {
			"_info": {
				"instances": [
					{
						"setting": "redirect_infobox_timeout",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_trigger_delay",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_video_autoloop_max",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_video_seek_amount",
						"field": "number_unit"
					},
					{
						"setting": "mouseover_auto_close_popup_time",
						"field": "number_unit"
					},
					{
						"setting": "replaceimgs_delay",
						"field": "number_unit"
					}
				]
			},
			"zh-CN": "\u79D2"
		},
		"Replace images": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_replaceimgs",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362\u56FE\u7247"
		},
		"Replaces images to their larger versions when the button is pressed": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_replaceimgs",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u6309\u4E0B\u6309\u94AE\u65F6\uFF0C\u5C06\u56FE\u50CF\u66FF\u6362\u4E3A\u8F83\u5927\u7684\u7248\u672C"
		},
		"Add links": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_addlinks",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u6DFB\u52A0\u94FE\u63A5"
		},
		"Adds links around replaced media if a link doesn't already exist": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_addlinks",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5728\u5DF2\u66FF\u6362\u5A92\u4F53\u65C1\u6DFB\u52A0\u94FE\u63A5\uFF08\u5982\u679C\u5C1A\u65E0\uFF09"
		},
		"Replace links": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_replacelinks",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362\u94FE\u63A5"
		},
		"Replaces links if they already exist": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_replacelinks",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u66FF\u6362\u5DF2\u7ECF\u5B58\u5728\u7684\u94FE\u63A5"
		},
		"Plain hyperlinks": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_plainlinks",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7EAF\u7CB9\u8D85\u94FE\u63A5"
		},
		"How to treat plain (non-media) hyperlinks that link to potential media": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_plainlinks",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5982\u4F55\u5904\u7406\u94FE\u63A5\u5230\u6F5C\u5728\u5A92\u4F53\u7684\u7EAF\u7CB9\u8D85\u94FE\u63A5"
		},
		"Replace link+text": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_plainlinks",
						"field": "options.replace_link_text.name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362\u94FE\u63A5\u548C\u6587\u672C"
		},
		"Replace media": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_plainlinks",
						"field": "options.replace_media.name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362\u5A92\u4F53"
		},
		"Links open in new tab": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_links_newtab",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u94FE\u63A5"
		},
		"Clicking on a replaced link will open the media in a new tab": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_links_newtab",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5355\u51FB\u5DF2\u66FF\u6362\u7684\u94FE\u63A5\u5C06\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u5A92\u4F53"
		},
		"Size constraints": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_size_constraints",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5927\u5C0F\u9650\u5236"
		},
		"Removes or enforces height/width specifiers for replaced media": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_size_constraints",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u79FB\u9664\u6216\u5F3A\u5236\u5E94\u7528\u88AB\u66FF\u6362\u5A92\u4F53\u7684\u9AD8\u5EA6/\u5BBD\u5EA6\u8BF4\u660E\u7B26"
		},
		"Ignore": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_plainlinks",
						"field": "options.none.name"
					},
					{
						"setting": "replaceimgs_size_constraints",
						"field": "options.none.name"
					}
				]
			},
			"zh-CN": "\u5FFD\u7565"
		},
		"Remove": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_size_constraints",
						"field": "options.remove.name"
					}
				]
			},
			"zh-CN": "\u79FB\u9664"
		},
		"Force": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_size_constraints",
						"field": "options.force.name"
					}
				]
			},
			"zh-CN": "\u5F3A\u5236"
		},
		"Replacement CSS": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_css",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362 CSS"
		},
		"CSS styles to apply to replaced media. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't yet supported here)": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_css",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5E94\u7528\u5230\u5DF2\u66FF\u6362\u5A92\u4F53\u7684 CSS \u6837\u5F0F\u3002\u66F4\u591A\u4FE1\u606F\u8BE6\u89C1\u201C\u5F39\u7A97 CSS \u6837\u5F0F\u201D\u6587\u6863\uFF08\u6B64\u5904\u4E0D\u652F\u6301 thumb/full URL \u53D8\u91CF\uFF09"
		},
		"Simple progress": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_simple_progress",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u7B80\u5355\u8FDB\u5EA6\u6761"
		},
		"Uses a simpler progress bar that has a fixed size for all media. This is useful to see how many images are replaced, rather than the ETA": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_simple_progress",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5BF9\u6240\u6709\u5A92\u4F53\u4F7F\u7528\u56FA\u5B9A\u5927\u5C0F\u7684\u7B80\u5355\u8FDB\u5EA6\u6761\u3002\u8FD9\u80FD\u770B\u5230\u6709\u591A\u5C11\u56FE\u50CF\u5DF2\u66FF\u6362\uFF0C\u800C\u4E0D\u662F\u53EA\u6709\u5269\u4F59\u65F6\u95F4"
		},
		"Enable trigger key": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_enable_keybinding",
						"field": "name"
					},
					{
						"setting": "highlightimgs_enable_keybinding",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u89E6\u53D1\u952E"
		},
		"Enables the use of the trigger key to run it without needing to use the menu": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_enable_keybinding",
						"field": "description"
					},
					{
						"setting": "highlightimgs_enable_keybinding",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u4F7F\u7528\u89E6\u53D1\u952E\u6765\u8FD0\u884C\uFF0C\u65E0\u9700\u4F7F\u7528\u83DC\u5355"
		},
		"Trigger key": {
			"_info": {
				"instances": [
					{
						"setting": "replaceimgs_keybinding",
						"field": "name"
					},
					{
						"setting": "highlightimgs_keybinding",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u89E6\u53D1\u952E"
		},
		"Trigger keybinding that will run the Highlight Images function": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_keybinding",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u7528\u6765\u8FD0\u884C\u201C\u9AD8\u4EAE\u56FE\u50CF\u201D\u529F\u80FD\u7684\u89E6\u53D1\u952E"
		},
		"Enable button": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_enable",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u6309\u94AE"
		},
		"Enables the 'Highlight Images' button": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_enable",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u201C\u9AD8\u4EAE\u56FE\u50CF\u201D\u6309\u94AE"
		},
		"Automatically highlight images": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u81EA\u52A8\u9AD8\u4EAE\u56FE\u7247"
		},
		"Automatically highlights images as you view pages": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u67E5\u770B\u9875\u9762\u65F6\u81EA\u52A8\u7A81\u51FA\u56FE\u50CF"
		},
		"Always": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "options.always.name"
					},
					{
						"setting": "mouseover_enable_mask_styles2",
						"field": "options.always.name"
					},
					{
						"setting": "mouseover_zoom_use_last",
						"field": "options.always.name"
					},
					{
						"setting": "scroll_zoomout_pagemiddle",
						"field": "options.always.name"
					},
					{
						"setting": "gallery_jd_referer",
						"field": "options.always.name"
					}
				]
			},
			"zh-CN": "\u603B\u662F"
		},
		"Hover": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "options.hover.name"
					}
				]
			},
			"zh-CN": "\u60AC\u505C"
		},
		"When hovering over an image": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "options.hover.description"
					}
				]
			},
			"zh-CN": "\u9F20\u6807\u5728\u56FE\u7247\u4E0A\u60AC\u505C\u65F6"
		},
		"Never": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_auto",
						"field": "options.never.name"
					},
					{
						"setting": "mouseover_zoom_use_last",
						"field": "options.never.name"
					},
					{
						"setting": "scroll_zoomout_pagemiddle",
						"field": "options.never.name"
					},
					{
						"setting": "gallery_jd_referer",
						"field": "options.never.name"
					}
				]
			},
			"zh-CN": "\u4ECE\u4E0D"
		},
		"Only explicitly supported images": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_onlysupported",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u4EC5\u9650\u660E\u786E\u652F\u6301\u7684\u56FE\u50CF"
		},
		"Only highlights images that can be made larger or the original version can be found": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_onlysupported",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u4EC5\u7A81\u51FA\u53EF\u4EE5\u6362\u6210\u66F4\u5927\u5C3A\u5BF8\u7684\u56FE\u50CF"
		},
		"Highlight CSS": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_css",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u9AD8\u4EAE CSS"
		},
		"CSS style to apply for highlight. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)": {
			"_info": {
				"instances": [
					{
						"setting": "highlightimgs_css",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u9AD8\u4EAE\u65F6\u4F7F\u7528\u7684 CSS \u6837\u5F0F\u3002\u66F4\u591A\u4FE1\u606F\u8BE6\u89C1\u201C\u5F39\u7A97 CSS \u6837\u5F0F\u201D\u6587\u6863\uFF08\u6B64\u5904\u4E0D\u652F\u6301 thumb/full URL \u53D8\u91CF\uFF09"
		},
		"Mouseover popup action": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "name"
					}
				]
			},
			"en": "Popup action",
			"zh-CN": "\u79FB\u52A8\u65F6\u5F39\u7A97\u7684\u52A8\u4F5C"
		},
		"Determines how the mouseover popup will open": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "description"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "description"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u51B3\u5B9A\u9F20\u6807\u60AC\u505C\u5F39\u7A97\u5C06\u6253\u5F00"
		},
		"Popup": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.popup.name"
					},
					{
						"setting": "mouseover_close_el_policy",
						"field": "options.popup.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.popup.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.popup.name"
					}
				]
			},
			"zh-CN": "\u5F39\u7A97"
		},
		"New tab": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.newtab.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.newtab.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.newtab.name"
					}
				]
			},
			"zh-CN": "\u65B0\u6807\u7B7E\u9875"
		},
		"New background tab": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.newtab_bg.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.newtab_bg.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.newtab_bg.name"
					}
				]
			},
			"zh-CN": "\u65B0\u540E\u53F0\u6807\u7B7E\u9875"
		},
		"Download": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.download.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.download.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.download.name"
					}
				]
			},
			"zh-CN": "\u4E0B\u8F7D"
		},
		"Copy link": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.copylink.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.copylink.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.copylink.name"
					}
				]
			},
			"zh-CN": "\u590D\u5236\u94FE\u63A5"
		},
		"Replace": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_open_behavior",
						"field": "options.replace.name"
					},
					{
						"setting": "t2_mouseover_open_behavior",
						"field": "options.replace.name"
					},
					{
						"setting": "t3_mouseover_open_behavior",
						"field": "options.replace.name"
					}
				]
			},
			"zh-CN": "\u66FF\u6362"
		},
		"Enable videos": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_video",
						"field": "name"
					},
					{
						"setting": "t2_mouseover_allow_video",
						"field": "name"
					},
					{
						"setting": "t3_mouseover_allow_video",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u652F\u6301\u89C6\u9891"
		},
		"Allows videos to be popped up": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_video",
						"field": "description"
					},
					{
						"setting": "t2_mouseover_allow_video",
						"field": "description"
					},
					{
						"setting": "t3_mouseover_allow_video",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u89C6\u9891\u5F39\u7A97"
		},
		"Enable audio": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_audio",
						"field": "name"
					},
					{
						"setting": "t2_mouseover_allow_audio",
						"field": "name"
					},
					{
						"setting": "t3_mouseover_allow_audio",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u542F\u7528\u97F3\u9891"
		},
		"Allows audio to be popped up. Currently experimental.\nThis only applies to audio files. Videos that contains audio are supported regardless of this setting.": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_audio",
						"field": "description"
					},
					{
						"setting": "t2_mouseover_allow_audio",
						"field": "description"
					},
					{
						"setting": "t3_mouseover_allow_audio",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u97F3\u9891\u5F39\u7A97\u3002\u76EE\u524D\u5904\u4E8E\u5B9E\u9A8C\u9636\u6BB5\u3002\n\u8FD9\u4EC5\u9002\u7528\u4E8E\u97F3\u9891\u6587\u4EF6\u3002\u5305\u542B\u97F3\u9891\u7684\u89C6\u9891\u65E0\u5173\u6B64\u8BBE\u7F6E\u3002"
		},
		"Allow HLS/DASH streams": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "name"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "name"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "name"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8 HLS/DASH \u6D41"
		},
		"Allows playback of HLS/DASH streams": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "description"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "description"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "description"
					}
				]
			},
			"zh-CN": "\u5141\u8BB8\u64AD\u653E HLS/DASH \u6D41"
		},
		"Dailymotion": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "example_websites[0]"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "example_websites[0]"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "example_websites[0]"
					}
				]
			},
			"zh-CN": "Dailymotion"
		},
		"Instagram (higher quality)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "example_websites[1]"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "example_websites[1]"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "example_websites[1]"
					}
				]
			},
			"zh-CN": "Instagram\uFF08\u66F4\u9AD8\u8D28\u91CF\uFF09"
		},
		"Reddit": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "example_websites[2]"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "example_websites[2]"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "example_websites[2]"
					}
				]
			},
			"zh-CN": "Reddit"
		},
		"YouTube (higher quality)": {
			"_info": {
				"instances": [
					{
						"setting": "mouseover_allow_hlsdash",
						"field": "example_websites[3]"
					},
					{
						"setting": "t2_mouseover_allow_hlsdash",
						"field": "example_websites[3]"
					},
					{
						"setting": "t3_mouseover_allow_hlsdash",
						"field": "example_websites[3]"
					}
				]
			},
			"zh-CN": "YouTube\uFF08\u66F4\u9AD8\u8D28\u91CF\uFF09"
		}
	};
	var get_language_aliases = function(language) {
		var aliases = [language];
		var language_nosub = language.replace(/-.*/, "");
		if (language_nosub !== language)
			aliases.push(language_nosub);
		return aliases;
	};
	function _(str) {
		var args = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			args[_i - 1] = arguments[_i];
		}
		if (typeof str !== "string") {
			return str;
		}
		var languages = get_language_aliases(settings.language);
		if (str in strings) {
			var found = false;
			for (var i = 0; i < languages.length; i++) {
				var language = languages[i];
				if (language in strings[str]) {
					str = strings[str][language];
					found = true;
					break;
				}
			}
			if (!found && language !== "en" && "en" in strings[str]) {
				str = strings[str]["en"];
			}
		}
		if (string_indexof(str, "%") < 0) {
			return str;
		}
		var parts = [];
		var currentpart = "";
		for (var i = 0; i < str.length; i++) {
			if (str[i] == '%') {
				if ((i + 2) < str.length) {
					if (str[i + 1] == '%') {
						var num = parse_int(str[i + 2]);
						if (!isNaN(num)) {
							parts.push(currentpart);
							currentpart = "";
							parts.push(arguments[num]);
							i += 2;
							continue;
						}
					}
				}
			}
			currentpart += str[i];
		}
		parts.push(currentpart);
		return parts.join("");
	}
	var old_settings_keys = [
		"mouseover_trigger",
		"mouseover_use_fully_loaded_video",
		"mouseover_use_fully_loaded_image",
		"mouseover_close_on_leave_el",
		"mouseover_scroll_behavior",
		"mouseover_mask_styles",
		"mouseover_video_seek_vertical_scroll",
		"mouseover_video_seek_horizontal_scroll",
		"mouseover_support_pointerevents_none",
		"mouseover_enable_mask_styles",
		"allow_video",
		"allow_audio",
		"replaceimgs_remove_size_constraints"
	];
	var settings = {
		imu_enabled: true,
		language: browser_language,
		check_updates: true,
		check_update_interval: 24,
		check_update_notify: false,
		dark_mode: false,
		settings_tabs: true,
		settings_alphabetical_order: false,
		settings_visible_description: true,
		settings_show_disabled: true,
		settings_show_disabled_profiles: false,
		settings_show_requirements: true,
		advanced_options: false,
		allow_browser_request: true,
		retry_503_times: 3,
		retry_503_ms: 2000,
		use_blob_over_arraybuffer: false,
		allow_live_settings_reload: true,
		allow_remote: true,
		disable_keybind_when_editing: true,
		enable_gm_download: true,
		gm_download_max: 15,
		enable_webextension_download: false,
		enable_console_logging: true,
		write_to_clipboard: false,
		redirect: true,
		redirect_video: true,
		redirect_audio: false,
		redirect_history: true,
		redirect_extension: true,
		canhead_get: true,
		redirect_force_page: false,
		redirect_enable_infobox: true,
		redirect_infobox_url: false,
		redirect_infobox_timeout: 7,
		print_imu_obj: false,
		redirect_disable_for_responseheader: false,
		redirect_to_no_infobox: false,
		redirect_host_html: false,
		mouseover: true,
		mouseover_open_behavior: "popup",
		mouseover_trigger_behavior: "keyboard",
		mouseover_trigger_key: ["shift", "alt", "i"],
		mouseover_trigger_key_t2: [],
		mouseover_trigger_key_t3: [],
		mouseover_trigger_delay: 1,
		mouseover_trigger_mouseover: false,
		mouseover_trigger_enabledisable_toggle: "disable",
		mouseover_trigger_prevent_key: ["shift"],
		mouseover_close_behavior: "esc",
		mouseover_close_need_mouseout: true,
		mouseover_jitter_threshold: 30,
		mouseover_cancel_popup_when_elout: true,
		mouseover_cancel_popup_with_esc: true,
		mouseover_cancel_popup_when_release: true,
		mouseover_auto_close_popup: false,
		mouseover_auto_close_popup_time: 5,
		mouseover_hold_key: ["i"],
		mouseover_hold_position_center: false,
		popup_hold_zoom: "none",
		mouseover_hold_close_unhold: false,
		mouseover_hold_unclickthrough: true,
		mouseover_close_el_policy: "both",
		mouseover_close_click_outside: false,
		mouseover_allow_partial: is_extension ? "media" : "video",
		mouseover_partial_avoid_head: false,
		mouseover_use_blob_over_data: false,
		popup_use_anonymous_crossorigin: false,
		mouseover_enable_notallowed: true,
		mouseover_enable_notallowed_cant_load: true,
		mouseover_notallowed_duration: 300,
		mouseover_minimum_size: 20,
		popup_maximum_source_size: 0,
		mouseover_exclude_backgroundimages: false,
		mouseover_exclude_page_bg: true,
		mouseover_exclude_imagemaps: true,
		mouseover_only_links: false,
		mouseover_linked_image: false,
		mouseover_exclude_sameimage: false,
		mouseover_exclude_imagetab: true,
		mouseover_allow_video: true,
		mouseover_allow_audio: false,
		mouseover_allow_hlsdash: true,
		enable_stream_download: false,
		stream_mux_mp4_over_mkv: false,
		hls_dash_use_max: true,
		max_video_quality: null,
		mouseover_video_autoplay: true,
		mouseover_video_controls: false,
		mouseover_video_controls_key: ["c"],
		mouseover_video_loop: true,
		mouseover_video_autoloop_max: 0,
		mouseover_video_playpause_key: ["space"],
		mouseover_video_muted: false,
		mouseover_video_mute_key: ["m"],
		mouseover_video_volume: 100,
		mouseover_video_volume_down_key: ["9"],
		mouseover_video_volume_up_key: ["0"],
		mouseover_video_volume_change_amt: 5,
		mouseover_video_resume_from_source: false,
		mouseover_video_resume_if_different: false,
		mouseover_video_pause_source: true,
		mouseover_video_seek_amount: 10,
		mouseover_video_seek_left_key: ["shift", "left"],
		mouseover_video_seek_right_key: ["shift", "right"],
		mouseover_video_frame_prev_key: [","],
		mouseover_video_frame_next_key: ["."],
		mouseover_video_framerate: 25,
		mouseover_video_speed_down_key: ["["],
		mouseover_video_speed_up_key: ["]"],
		mouseover_video_speed_amount: 0.25,
		mouseover_video_reset_speed_key: ["backspace"],
		mouseover_video_screenshot_key: ["shift", "s"],
		popup_video_screenshot_format: "png",
		popup_enable_subtitles: true,
		mouseover_ui: true,
		mouseover_ui_toggle_key: ["u"],
		mouseover_ui_opacity: 80,
		mouseover_ui_use_safe_glyphs: false,
		mouseover_ui_imagesize: true,
		mouseover_ui_zoomlevel: true,
		mouseover_ui_filesize: false,
		mouseover_ui_gallerycounter: true,
		mouseover_ui_gallerymax: 50,
		mouseover_ui_gallerybtns: true,
		mouseover_ui_closebtn: true,
		mouseover_ui_optionsbtn: is_userscript ? true : false,
		mouseover_ui_downloadbtn: false,
		mouseover_ui_rotationbtns: false,
		mouseover_ui_caption: true,
		mouseover_ui_wrap_caption: true,
		mouseover_ui_caption_link_page: true,
		mouseover_ui_link_underline: true,
		mouseover_use_remote: false,
		mouseover_zoom_behavior: "fit",
		mouseover_zoom_custom_percent: 100,
		mouseover_zoom_use_last: "gallery",
		mouseover_zoom_max_width: 0,
		mouseover_zoom_max_height: 0,
		mouseover_pan_behavior: "drag",
		mouseover_movement_inverted: true,
		mouseover_drag_min: 5,
		mouseover_scrolly_behavior: "zoom",
		mouseover_scrolly_hold_behavior: "default",
		mouseover_scrollx_behavior: "gallery",
		mouseover_scrollx_hold_behavior: "default",
		mouseover_scrolly_video_behavior: "default",
		mouseover_scrolly_video_invert: false,
		mouseover_scrollx_video_behavior: "default",
		scroll_override_page: false,
		scroll_zoom_origin: "cursor",
		scroll_zoomout_pagemiddle: "never",
		scroll_zoom_behavior: "fitfull",
		scroll_incremental_mult: 1.25,
		mouseover_move_with_cursor: false,
		mouseover_move_within_page: true,
		zoom_out_to_close: false,
		scroll_past_gallery_end_to_close: false,
		mouseover_position: "cursor",
		mouseover_prevent_cursor_overlap: true,
		mouseover_overflow_position_center: false,
		mouseover_overflow_origin: "a11",
		mouseover_add_link: true,
		mouseover_add_video_link: false,
		mouseover_click_image_close: false,
		mouseover_click_video_close: false,
		mouseover_download: false,
		mouseover_hide_cursor: false,
		mouseover_hide_cursor_after: 0,
		mouseover_mouse_inactivity_jitter: 5,
		mouseover_clickthrough: false,
		mouseover_mask_ignore_clicks: false,
		mouseover_links: true,
		mouseover_only_valid_links: true,
		mouseover_allow_self_pagelink: false,
		mouseover_allow_iframe_el: false,
		mouseover_allow_canvas_el: false,
		mouseover_allow_svg_el: false,
		mouseover_enable_gallery: true,
		mouseover_gallery_cycle: false,
		mouseover_gallery_prev_key: ["left"],
		mouseover_gallery_next_key: ["right"],
		mouseover_gallery_move_after_video: false,
		mouseover_gallery_download_key: ["shift", "d"],
		gallery_download_method: "zip",
		gallery_download_unchanged: true,
		gallery_zip_filename_format: "{host_domain_nosub}-{items_amt}-{download_unix}\n{items_amt}-{download_unix}",
		gallery_jd_autostart: false,
		gallery_jd_referer: "domain",
		gallery_zip_add_tld: true,
		gallery_zip_add_info_file: true,
		mouseover_styles: "",
		mouseover_enable_fade: true,
		mouseover_enable_zoom_effect: false,
		mouseover_zoom_effect_move: false,
		mouseover_fade_time: 100,
		mouseover_enable_mask_styles2: "never",
		mouseover_mask_styles2: "background-color: rgba(0, 0, 0, 0.5)",
		mouseover_mask_fade_time: 100,
		mouseover_ui_styles: "",
		mouseover_wait_use_el: false,
		mouseover_add_to_history: false,
		mouseover_close_key: ["esc"],
		mouseover_download_key: [["s"], ["ctrl", "s"]],
		mouseover_open_new_tab_key: ["o"],
		mouseover_open_bg_tab_key: ["shift", "o"],
		mouseover_copy_link_key: ["shift", "c"],
		mouseover_open_options_key: ["p"],
		mouseover_open_orig_page_key: ["n"],
		mouseover_rotate_left_key: ["e"],
		mouseover_rotate_right_key: ["r"],
		mouseover_flip_horizontal_key: ["h"],
		mouseover_flip_vertical_key: ["v"],
		mouseover_zoom_in_key: [["+"], ["="], ["shift", "="]],
		mouseover_zoom_out_key: [["-"]],
		mouseover_zoom_full_key: ["1"],
		mouseover_zoom_fit_key: ["2"],
		mouseover_fullscreen_key: ["f"],
		mouseover_apply_blacklist: true,
		apply_blacklist_host: false,
		mouseover_matching_media_types: false,
		mouseover_allow_popup_when_fullscreen: false,
		mouseover_find_els_mode: "hybrid",
		popup_allow_cache: true,
		popup_cache_duration: 30,
		popup_cache_itemlimit: 20,
		popup_cache_resume_video: true,
		website_inject_imu: true,
		website_image: true,
		extension_contextmenu: true,
		extension_hotreload: true,
		allow_watermark: false,
		allow_smaller: false,
		allow_possibly_different: false,
		allow_possibly_broken: false,
		allow_possibly_upscaled: false,
		allow_thirdparty: false,
		allow_apicalls: true,
		allow_thirdparty_libs: is_userscript ? false : true,
		custom_xhr_for_lib: is_extension ? true : false,
		use_webarchive_for_lib: false,
		lib_integrity_check: true,
		allow_thirdparty_code: false,
		allow_bruteforce: false,
		process_format: {},
		browser_cookies: true,
		deviantart_prefer_size: false,
		deviantart_support_download: true,
		ehentai_full_image: true,
		imgur_filename: false,
		imgur_source: false,
		instagram_use_app_api: false,
		instagram_dont_use_web: false,
		instagram_prefer_video_quality: true,
		instagram_gallery_postlink: false,
		snapchat_orig_media: true,
		teddit_redirect_reddit: true,
		tiktok_no_watermarks: false,
		tiktok_thirdparty: null,
		tumblr_api_key: base64_decode("IHhyTXBMTThuMWVDZUwzb1JZU1pHN0NMQUx3NkVIaFlEZFU2V3E1ZUQxUGJNa2xkN1kx").substr(1),
		twitter_use_ext: false,
		bigimage_blacklist: "",
		bigimage_blacklist_engine: "glob",
		filename_format: "{author_username} {filename}",
		filename_replace_special_underscores: true,
		replaceimgs_enable_keybinding: false,
		replaceimgs_keybinding: ["shift", "alt", "r"],
		replaceimgs_auto: false,
		replaceimgs_replaceimgs: true,
		replaceimgs_addlinks: false,
		replaceimgs_replacelinks: false,
		replaceimgs_plainlinks: "none",
		replaceimgs_links_newtab: false,
		replaceimgs_size_constraints: "none",
		replaceimgs_usedata: is_userscript ? true : false,
		replaceimgs_wait_fullyloaded: true,
		replaceimgs_totallimit: 8,
		replaceimgs_domainlimit: 2,
		replaceimgs_delay: 0,
		replaceimgs_css: "",
		replaceimgs_simple_progress: true,
		highlightimgs_enable_keybinding: false,
		highlightimgs_keybinding: ["shift", "alt", "h"],
		highlightimgs_enable: false,
		highlightimgs_auto: "never",
		highlightimgs_onlysupported: true,
		highlightimgs_css: "outline: 4px solid yellow",
		last_update_check: 0,
		last_update_version: null,
		last_update_url: null
	};
	var sensitive_settings = [
		"tumblr_api_key"
	];
	var user_defined_settings = {};
	var num_profiles = 2;
	var settings_meta = {
		imu_enabled: {
			name: "Enable extension",
			description: "Globally enables or disables the extension",
			category: "general",
			extension_only: true,
			imu_enabled_exempt: true
		},
		language: {
			name: "Language",
			description: "Language for this extension",
			category: "general",
			options: {
				_type: "combo",
				en: {
					name: "English",
					name_gettext: false
				},
				es: {
					name: "Espa\u00F1ol",
					name_gettext: false
				},
				fr: {
					name: "Fran\u00E7ais",
					name_gettext: false
				},
				it: {
					name: "Italiano",
					name_gettext: false
				},
				ko: {
					name: "\uD55C\uAD6D\uC5B4",
					name_gettext: false
				},
				ru: {
					name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
					name_gettext: false
				},
				"zh-CN": {
					name: "\u7B80\u4F53\u4E2D\u6587",
					name_gettext: false
				}
			},
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		dark_mode: {
			name: "Dark mode",
			description: "Changes the colors to have light text on a dark background",
			category: "general",
			onedit: update_dark_mode,
			onupdate: update_dark_mode,
			imu_enabled_exempt: true
		},
		settings_visible_description: {
			name: "Description below options",
			description: "Shows the description below the options (otherwise the description is only shown when you hover over the option's name)",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		settings_show_disabled: {
			name: "Show disabled options",
			description: "If disabled, options that are disabled due to their requirements being unmet will not be displayed",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		settings_show_disabled_profiles: {
			name: "Show disabled trigger profiles",
			description: "If disabled, options for alternate trigger profiles (options with `(#2)` after them) will not be shown if the relevant trigger isn't active",
			category: "general",
			subcategory: "settings",
			requires: {
				settings_show_disabled: true
			},
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		settings_show_requirements: {
			name: "Requirements below disabled options",
			description: "If an option is disabled, the requirements to enable the option will be displayed below it",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			requires: {
				settings_show_disabled: true
			},
			imu_enabled_exempt: true
		},
		check_updates: {
			name: "Check for updates",
			description: "Periodically checks for updates. If a new update is available, it will be shown at the top of the options page",
			category: "general",
			subcategory: "update"
		},
		check_update_interval: {
			name: "Update check interval",
			description: "How often to check for updates",
			category: "general",
			subcategory: "update",
			requires: {
				check_updates: true
			},
			type: "number",
			number_min: 1,
			number_int: true,
			number_unit: "hours"
		},
		check_update_notify: {
			name: "Notify when update is available",
			description: "Creates a browser notification when an update is available",
			category: "general",
			subcategory: "update",
			requires: {
				check_updates: true
			},
			required_permission: "notifications"
		},
		advanced_options: {
			name: "Show advanced settings",
			description: "If disabled, settings that might be harder to understand will be hidden",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		settings_tabs: {
			name: "Use tabs",
			description: "If disabled, all settings will be shown on a single page",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		settings_alphabetical_order: {
			name: "Alphabetical order",
			description: "Lists options in alphabetical order",
			category: "general",
			subcategory: "settings",
			onedit: function() {
				run_soon(do_options);
			},
			imu_enabled_exempt: true
		},
		allow_browser_request: {
			name: "Allow using browser XHR",
			description: "This allows XHR requests to be run in the browser's context if they fail in the extension (e.g. when Tracking Protection is set to High)",
			category: "general",
			imu_enabled_exempt: true,
			advanced: true
		},
		retry_503_times: {
			name: "Retry requests with 503 errors",
			description: "Amount of times to retry a request when 503 (service unavailable) is returned by the server",
			category: "general",
			type: "number",
			number_min: 0,
			number_int: true,
			number_unit: "times",
			imu_enabled_exempt: true,
			advanced: true
		},
		retry_503_ms: {
			name: "Delay between 503 retries",
			description: "Time (in milliseconds) to delay between retrying requests that received 503",
			category: "general",
			type: "number",
			number_min: 0,
			number_int: true,
			number_unit: "ms",
			imu_enabled_exempt: true,
			advanced: true
		},
		use_blob_over_arraybuffer: {
			name: "Use `Blob` over `ArrayBuffer`",
			description: "Uses `Blob`s for XHRs instead of `ArrayBuffer`s. Keep this enabled unless your userscript manager doesn't support blob requests",
			category: "general",
			imu_enabled_exempt: true,
			advanced: true,
			hidden: true
		},
		allow_live_settings_reload: {
			name: "Live settings reloading",
			description: "Enables/disables live settings reloading. There shouldn't be a reason to disable this unless you're experiencing issues with this feature",
			category: "general",
			hidden: is_userscript && typeof GM_addValueChangeListener === "undefined",
			imu_enabled_exempt: true,
			advanced: true
		},
		disable_keybind_when_editing: {
			name: "Disable keybindings when editing text",
			description: "Disables shortcuts when key events are sent to an input area on the page",
			category: "keybinds",
			imu_enabled_exempt: true,
			advanced: true
		},
		enable_gm_download: {
			name: "Use `GM_download` if available",
			description: "Prefers using `GM_download` over simple browser-based downloads, if the function is available. Some userscript managers download the entire file before displaying a save dialog, which can be undesirable for large video files",
			category: "general",
			userscript_only: true,
			imu_enabled_exempt: true,
			advanced: true
		},
		gm_download_max: {
			name: "Maximum size to `GM_download`",
			description: "If a file is larger than this size, use a simple browser-based download instead. Set to `0` for unlimited.",
			category: "general",
			userscript_only: true,
			imu_enabled_exempt: true,
			requires: {
				enable_gm_download: true
			},
			type: "number",
			number_min: 0,
			number_unit: "MB",
			advanced: true
		},
		enable_webextension_download: {
			name: "Force save dialog when downloading",
			description: "Tries to ensure the 'save as' dialog displays when downloading. This requires the 'downloads' permission to work, and will sometimes not work when custom headers are required.",
			category: "general",
			extension_only: true,
			imu_enabled_exempt: true,
			required_permission: "downloads"
		},
		enable_console_logging: {
			name: "Enable logging to console",
			description: "Allows the script to log messages to the browser console.",
			category: "general",
			imu_enabled_exempt: true,
			advanced: true
		},
		write_to_clipboard: {
			name: "Enable writing to clipboard",
			description: "This option does nothing on its own, but enabling it allows other functionality that require writing to the clipboard to work",
			category: "general",
			imu_enabled_exempt: true,
			required_permission: "clipboardWrite"
		},
		redirect: {
			name: "Enable redirection",
			description: "Automatically redirect media opened in their own tab to their larger/original versions",
			category: "redirection"
		},
		redirect_video: {
			name: "Allow video",
			description: "Allows redirecting from/to video",
			requires: {
				redirect: true
			},
			category: "redirection"
		},
		redirect_audio: {
			name: "Allow audio",
			description: "Allows redirecting from/to audio",
			requires: {
				redirect: true
			},
			category: "redirection"
		},
		redirect_history: {
			name: "Add to history",
			description: "Redirection will add a new entry to the browser's history",
			requires: {
				redirect: true
			},
			category: "redirection"
		},
		redirect_extension: {
			name: "Do redirection in extension",
			description: "Performs the redirection in the extension instead of the content script. This is significantly faster and shouldn't cause issues in theory, but this option is kept in case of regressions",
			requires: {
				redirect: true
			},
			extension_only: true,
			advanced: true,
			category: "redirection"
		},
		canhead_get: {
			name: "Use GET if HEAD is unsupported",
			description: "Use a GET request to check an image's availability, if the server does not support HEAD requests",
			requires: {
				redirect: true
			},
			category: "redirection",
			advanced: true
		},
		redirect_force_page: {
			name: "Try finding extra information",
			description: "Enables methods that use API calls for finding extra information, such as the original page, caption, or album information. Note that this option does not affect finding the original media.",
			example_websites: [
				"Flickr",
				"SmugMug",
				"..."
			],
			category: "rules"
		},
		redirect_enable_infobox: {
			name: "Enable tooltip",
			description: "Enables the 'Mouseover popup is needed to display the original version' tooltip",
			category: "redirection",
			requires: {
				redirect: true
			},
			userscript_only: true // tooltip isn't shown in the extension
		},
		redirect_infobox_url: {
			name: "Show image URL in tooltip",
			description: "If the popup is needed to display the larger version of an image, display the image link in the tooltip",
			category: "redirection",
			requires: {
				redirect: true
			},
			userscript_only: true // tooltip isn't shown in the extension
		},
		redirect_infobox_timeout: {
			name: "Hide tooltip after",
			description: "Hides the tooltip after the specified number of seconds (or when the mouse clicks on it). Set to 0 to never hide automatically",
			requires: {
				redirect: true
			},
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "redirection",
			userscript_only: true // tooltip isn't shown in the extension
		},
		print_imu_obj: {
			name: "Log info object to console",
			description: "Prints the full info object to the console whenever a popup/redirect is found",
			category: "rules",
			requires: {
				enable_console_logging: true
			},
			advanced: true
		},
		redirect_disable_for_responseheader: {
			name: "Disable when response headers need modifying",
			description: "This option works around Chrome's migration to manifest v3, redirecting some images to being force-downloaded",
			extension_only: true,
			hidden: true,
			category: "redirection",
			advanced: true
		},
		redirect_to_no_infobox: {
			name: "Redirect to largest without issues",
			description: "Redirects to the largest image found that doesn't require custom headers or forces download",
			userscript_only: true,
			category: "redirection"
		},
		redirect_host_html: {
			name: "Redirect for HTML pages too",
			description: "Tries redirection even if the host page is HTML. This option might be useful for dead links. However, this will also result in many normal pages being redirected to images/video, so please avoid enabling this by default!",
			warning: {
				"true": "This will result in many pages being redirected to images/videos.\nI'd recommend only enabling this for the media you need it for, then disabling it after."
			},
			category: "redirection",
			advanced: true
		},
		mouseover: {
			name: "Enable mouseover popup",
			description: "Show a popup with the larger image when you mouseover an image with the trigger key held (if applicable)",
			category: "popup"
		},
		mouseover_open_behavior: {
			name: "Mouseover popup action",
			description: "Determines how the mouseover popup will open",
			profiled: true,
			hidden: is_userscript && open_in_tab === common_functions["nullfunc"],
			options: {
				_type: "combo",
				popup: {
					name: "Popup"
				},
				newtab: {
					name: "New tab"
				},
				newtab_bg: {
					name: "New background tab",
				},
				download: {
					name: "Download"
				},
				copylink: {
					name: "Copy link"
				},
				replace: {
					name: "Replace"
				}
			},
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_trigger: {
			name: "Popup trigger",
			description: "Trigger key that, when held, will show the popup",
			options: {
				_type: "and",
				_group1: {
					_type: "and",
					ctrl: {
						name: "Ctrl"
					},
					shift: {
						name: "Shift"
					},
					alt: {
						name: "Alt"
					}
				},
				_group2: {
					_type: "or",
					delay_1: {
						name: "Delay 1s"
					},
					delay_3: {
						name: "Delay 3s"
					}
				}
			},
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_behavior: {
			name: "Mouseover popup trigger",
			description: "How the popup will get triggered",
			options: {
				_group1: {
					mouse: {
						name: "Mouseover",
						description: "Triggers when your mouse is over the image"
					},
				},
				_group2: {
					keyboard: {
						name: "Key trigger",
						description: "Triggers when you press a key sequence when your mouse is over an image"
					},
				},
				_group3: {
					none: {
						name: "None",
						description: "Disables the popup from being triggered (useful if you only want to use the context menu item)",
						extension_only: true
					}
				}
			},
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_key: {
			name: "Popup trigger key",
			description: "Key sequence to trigger the popup",
			type: "keysequence",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_key_t2: {
			name: "Popup trigger key (#2)",
			description: "Key sequence to trigger the popup with alternate options. Search for `(#2)` to find the relevant options",
			type: "keysequence",
			keyseq_allow_none: true,
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_key_t3: {
			name: "Popup trigger key (#3)",
			description: "Key sequence to trigger the popup with alternate options. Search for `(#3)` to find the relevant options",
			type: "keysequence",
			keyseq_allow_none: true,
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_delay: {
			name: "Popup trigger delay",
			description: "Delay (in seconds) before the popup shows",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "mouse"
			},
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_mouseover: {
			name: "Use mouseover event",
			description: "Uses the mouseover event instead of mousemove to figure out where to trigger the popup. This more closely matches the way other image popup addons work, at the cost of configurability",
			requires: {
				mouseover_trigger_behavior: "mouse"
			},
			advanced: true,
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_enabledisable_toggle: {
			name: "Enable/disable toggle",
			description: "Controls whether the 'Popup enable/disable key' will enable or disable the popup from opening",
			options: {
				enable: {
					name: "Enable"
				},
				disable: {
					name: "Disable"
				}
			},
			requires: {
				mouseover_trigger_behavior: "mouse"
			},
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_trigger_prevent_key: {
			name: "Popup enable/disable key",
			description: "Holding down this key will enable or disable the popup from being opened, depending on the 'Enable/disable toggle' setting",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "mouse"
			},
			type: "keysequence",
			category: "popup",
			subcategory: "trigger"
		},
		mouseover_allow_partial: {
			name: "Allow showing partially loaded",
			description: "This will allow the popup to open for partially loaded media.\nPartially loaded media will contain the source URL directly (where possible), whereas fully loaded media will use a blob or data URL.",
			description_userscript: "This will allow the popup to open for partially loaded media, but this might break images that require custom headers to display properly.\nPartially loaded media will contain the source URL directly (where possible), whereas fully loaded media will use a blob or data URL.",
			requires: "action:popup",
			options: {
				_type: "or",
				video: {
					name: "Streams",
					description: "Audio and video"
				},
				media: {
					name: "Media",
					description: "Images, audio, and video"
				},
				none: {
					name: "None"
				}
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_partial_avoid_head: {
			name: "Avoid HEAD request for partially loaded media",
			description: "Avoids a possibly unnecessary HEAD request before displaying partially loaded images, which further decreases the delay before opening the popup. This can cause issues if the server returns an error, but still returns an image",
			requires: [
				{ mouseover_allow_partial: "video" },
				{ mouseover_allow_partial: "media" }
			],
			category: "popup",
			subcategory: "open_behavior",
			advanced: true
		},
		mouseover_use_blob_over_data: {
			name: "Use `blob:` over `data:` URLs",
			description: "Blob URLs are more efficient, but aren't supported by earlier browsers. Some websites also block `blob:` URLs",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior",
			advanced: true
		},
		popup_use_anonymous_crossorigin: {
			name: "Load media anonymously",
			description: "Loads the media without sending any cookies or other forms of credentials. This is required to screenshot videos from other sources",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior",
			advanced: true
		},
		mouseover_use_fully_loaded_image: {
			name: "Wait until image is fully loaded",
			description: "Wait until the image has fully loaded before displaying it",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_use_fully_loaded_video: {
			name: "Wait until video is fully loaded",
			description: "Wait until the video has fully loaded before displaying it (this may significantly increase memory usage with larger videos)",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_enable_notallowed: {
			name: "Use `not-allowed` cursor when unsupported",
			description: "If the image isn't supported, the mouse cursor will change to a `not-allowed` cursor for a brief duration",
			requires: {
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_enable_notallowed_cant_load: {
			name: "Use `not-allowed` cursor when unable to load",
			description: "If the image fails to load, the mouse cursor will change to a `not-allowed` cursor for a brief duration",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_notallowed_duration: {
			name: "`not-allowed` cursor duration",
			description: "How long the `not-allowed` cursor should last",
			requires: [
				{ mouseover_enable_notallowed: true },
				{ mouseover_enable_notallowed_cant_load: true }
			],
			type: "number",
			number_min: 0,
			number_int: true,
			number_unit: "ms",
			advanced: true,
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_exclude_page_bg: {
			name: "Exclude page background",
			description: "Excludes the page background for the popup",
			requires: {
				mouseover: true,
				mouseover_exclude_backgroundimages: false
			},
			profiled: true,
			category: "popup",
			subcategory: "source"
		},
		mouseover_minimum_size: {
			name: "Minimum size",
			description: "Smallest size acceptable for the popup to open (this option is ignored for background images). This refers to the size of the media to be popped up, which may differ from the source media.",
			requires: {
				mouseover: true
			},
			profiled: true,
			type: "number",
			number_min: 0,
			number_unit: "pixels",
			category: "popup",
			subcategory: "source"
		},
		popup_maximum_source_size: {
			name: "Maximum source size",
			description: "Maximum size (width/height) for the source media to allow popping up (this option is ignored for background images). Set to `0` for any size.",
			requires: {
				mouseover: true
			},
			profiled: true,
			type: "number",
			number_min: 0,
			number_unit: "pixels",
			category: "popup",
			subcategory: "source"
		},
		mouseover_exclude_backgroundimages: {
			name: "Exclude `background-image`s",
			description: "Excludes `background-image`s for the popup. Might prevent the popup from working on many images",
			requires: {
				mouseover: true
			},
			profiled: true,
			disabled_if: {
				mouseover_trigger_mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_exclude_imagetab: {
			name: "Exclude image tabs",
			description: "Excludes images that are opened in their own tabs",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "mouse"
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_exclude_sameimage: {
			name: "Exclude if media URL is unchanged",
			description: "Don't pop up if the new URL is the same as the source",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_only_links: {
			name: "Only popup for linked media",
			description: "Don't pop up if the media isn't hyperlinked",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_linked_image: {
			name: "Popup link for linked media",
			description: "If the linked media cannot be made larger, pop up for the link instead of the media",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_exclude_imagemaps: {
			name: "Exclude image maps",
			description: "Don't pop up if the image is an image map (image with multiple clickable areas)",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_video_autoplay: {
			name: "Autoplay",
			description: "Play automatically once the popup is opened",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_controls: {
			name: "Show video controls",
			description: "Shows native video controls. Note that this prevents dragging under Firefox",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_controls_key: {
			name: "Toggle video controls",
			description: "Key to toggle whether the video controls are shown",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_loop: {
			name: "Loop",
			description: "Allows the media to automatically restart to the beginning after finishing playing",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			disabled_if: {
				mouseover_gallery_move_after_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_autoloop_max: {
			name: "Max duration for looping",
			description: "Media longer than the specified duration will not be automatically looped. Setting this to `0` will always enable looping, regardless of duration.",
			requires: {
				mouseover_video_loop: true
			},
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_playpause_key: {
			name: "Play/pause key",
			description: "Key to toggle whether the media is playing or paused",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_muted: {
			name: "Mute",
			description: "Mutes the media by default",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_mute_key: {
			name: "Toggle mute key",
			description: "Key to toggle mute",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_volume: {
			name: "Default volume",
			description: "Default volume for the media",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "number",
			number_min: 0,
			number_max: 100,
			number_int: true,
			number_unit: "%",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_volume_up_key: {
			name: "Volume up key",
			description: "Key to increase the volume",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_volume_down_key: {
			name: "Volume down key",
			description: "Key to decrease the volume",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_volume_change_amt: {
			name: "Volume change amount",
			description: "Percent for volume to increase/decrease when using the volume up/down keys",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "number",
			number_min: 0,
			number_max: 100,
			number_int: true,
			number_unit: "%",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_resume_from_source: {
			name: "Resume playback from source",
			description: "If enabled, playback will resume from where the source left off",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_resume_if_different: {
			name: "Resume if different length",
			description: "If disabled, it will not resume if the source has a different length from the media in the popup (e.g. from a preview video to a full one)",
			requires: {
				mouseover_video_resume_from_source: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_pause_source: {
			name: "Pause source",
			description: "Pauses the source once the popup has opened",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_seek_amount: {
			name: "Seek amount",
			description: "Amount of time to seek forward/back when using the seek keys",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_seek_left_key: {
			name: "Seek left key",
			description: "Key to seek backwards by the specified amount",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_seek_right_key: {
			name: "Seek right key",
			description: "Key to seek forwards by the specified amount",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_seek_vertical_scroll: {
			name: "Vertical scroll seeks",
			description: "Scrolling vertically will seek forward/backward",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_seek_horizontal_scroll: {
			name: "Horizontal scroll seeks",
			description: "Scrolling horizontally will seek forward/backward",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_frame_prev_key: {
			name: "Previous frame key",
			description: "Rewinds the video one \"frame\" backward. Due to current limitations, the frame size is static (but configurable), and might not match the video's framerate",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_frame_next_key: {
			name: "Next frame key",
			description: "Advances the video one \"frame\" forward. Due to current limitations, the frame size is static (but configurable), and might not match the video's framerate",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_framerate: {
			name: "Frame rate",
			description: "Frame rate for videos to seek forward/back with the next/previous frame keys",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "number",
			number_min: 0,
			number_unit: "FPS",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_speed_down_key: {
			name: "Speed down key",
			description: "Key to decrease playback rate by a specified amount",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_speed_up_key: {
			name: "Speed up key",
			description: "Key to increase playback rate by a specified amount",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_speed_amount: {
			name: "Speed up/down amount",
			description: "How much to increase/decrease the playback rate",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "number",
			number_min: 0,
			number_unit: "x",
			category: "popup",
			subcategory: "video"
		},
		mouseover_video_reset_speed_key: {
			name: "Reset speed key",
			description: "Resets the playback rate to normal speed",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		mouseover_video_screenshot_key: {
			name: "Screenshot key",
			description: "Screenshots the current frame in the video",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "video"
		},
		popup_video_screenshot_format: {
			name: "Screenshot format",
			description: "File format to save the screenshot in",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			options: {
				_type: "or",
				png: {
					name: "PNG"
				},
				jpg: {
					name: "JPG"
				}
			},
			category: "popup",
			subcategory: "video"
		},
		popup_enable_subtitles: {
			name: "Enable subtitles",
			description: "Enables subtitles to be overlayed on top of the video",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "video"
		},
		mouseover_ui: {
			name: "Popup UI",
			description: "Enables a UI on top of the popup",
			requires: "action:popup",
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_toggle_key: {
			name: "UI Toggle key",
			description: "Toggles the display of the UI",
			type: "keysequence",
			requires: "action:popup",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_ui_opacity: {
			name: "Opacity",
			description: "Opacity of the UI on top of the popup",
			requires: {
				mouseover_ui: true
			},
			type: "number",
			number_unit: "%",
			number_max: 100,
			number_min: 0,
			number_int: true,
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_use_safe_glyphs: {
			name: "Use safe glyphs",
			description: "Uses glyphs that are more likely to be available on all fonts. Enable this option if the following characters render as boxes: \uD83E\uDC47 \ud83e\udc50 \ud83e\udc52. The 'Noto Sans Symbols2' font contains these characters.",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_imagesize: {
			name: "Media resolution",
			description: "Displays the original media dimensions on top of the UI.\nCSS ID: `#sizeinfo`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_zoomlevel: {
			name: "Zoom percent",
			description: "Displays the current zoom level on top of the UI.\nCSS ID: `#sizeinfo`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_filesize: {
			name: "File size",
			description: "Displays the media's file size on top of the UI. For the moment, this will not work with partially loaded media if 'Avoid HEAD request for partially loaded media' is enabled.\nCSS ID: `#sizeinfo`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_gallerycounter: {
			name: "Gallery counter",
			description: "Enables a gallery counter on top of the UI.\nCSS ID: `#gallerycounter`",
			requires: {
				mouseover_ui: true,
				mouseover_enable_gallery: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_gallerymax: {
			name: "Gallery counter max",
			description: "Maximum amount of images to check in the counter (this can be slightly CPU-intensive)",
			requires: {
				mouseover_ui_gallerycounter: true,
				mouseover_enable_gallery: true
			},
			type: "number",
			number_min: 0,
			number_unit: "images",
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_gallerybtns: {
			name: "Gallery buttons",
			description: "Enables buttons to go left/right in the gallery.\nCSS IDs: `#galleryprevbtn`, `#gallerynextbtn`",
			requires: {
				mouseover_ui: true,
				mouseover_enable_gallery: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_closebtn: {
			name: "Close Button",
			description: "Enables a button to close the popup.\nCSS ID: `#closebtn`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_optionsbtn: {
			name: "Options Button",
			description: "Enables a button to go to this page.\nCSS ID: `#optionsbtn`",
			requires: {
				mouseover_ui: true
			},
			userscript_only: true,
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_downloadbtn: {
			name: "Download Button",
			description: "Enables a button to download the image.\nCSS ID: `#downloadbtn`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_rotationbtns: {
			name: "Rotation Buttons",
			description: "Enables buttons on the UI to rotate the image by 90 degrees.\nCSS IDs: `#rotleftbtn`, `#rotrightbtn`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_caption: {
			name: "Caption",
			description: "Shows the image's caption (if available) at the top.\nCSS ID: `#caption`",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_wrap_caption: {
			name: "Wrap caption text",
			description: "Wraps the caption if it's too long",
			requires: {
				mouseover_ui_caption: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_caption_link_page: {
			name: "Link original page in caption",
			description: "Links the original page (if it exists) in the caption",
			requires: {
				mouseover_ui_caption: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_ui_link_underline: {
			name: "Underline links",
			description: "Adds an underline to links (such as the original page)",
			requires: {
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_close_behavior: {
			name: "Keep popup open until",
			description: "Closes the popup when the selected condition is met",
			options: {
				_type: "or",
				_group1: {
					any: {
						name: "Any trigger is released"
					}
				},
				_group2: {
					all: {
						name: "All triggers are released"
					}
				},
				_group3: {
					esc: {
						name: "ESC/Close is pressed"
					}
				}
			},
			requires: {
				_condition: "action:popup",
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_close_need_mouseout: {
			name: "Don't close until mouse leaves",
			description: "If true, this keeps the popup open even if all triggers are released if the mouse is still over the image",
			requires: [
				{ mouseover_close_behavior: "any" },
				{ mouseover_close_behavior: "all" }
			],
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_jitter_threshold: {
			name: "Threshold to leave image",
			description: "How many pixels outside of the image before the cursor is considered to have left the image",
			requires: [
				{
					_condition: "action:popup",
					mouseover_close_need_mouseout: true
				},
				{
					_condition: "action:popup",
					mouseover_trigger_behavior: "mouse"
				}
			],
			type: "number",
			number_unit: "pixels",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_cancel_popup_when_elout: {
			name: "Leaving thumbnail cancels loading",
			description: "Cancels the current popup loading when the cursor has left the thumbnail image",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "mouse"
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_cancel_popup_with_esc: {
			name: "ESC cancels loading",
			description: "Cancels the current popup loading if ESC is pressed",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_cancel_popup_when_release: {
			name: "Releasing triggers cancels loading",
			description: "Cancels the current popup loading if all/any triggers are released (as set by the \"Keep popup open until\" setting)",
			requires: [
				{ mouseover_close_behavior: "any" },
				{ mouseover_close_behavior: "all" }
			],
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_auto_close_popup: {
			name: "Automatically close after timeout",
			description: "Closes the popup automatically after a specified period of time has elapsed",
			requires: "action:popup",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_auto_close_popup_time: {
			name: "Timeout to close popup",
			description: "Amount of time to elapse before automatically closing the popup",
			requires: {
				mouseover_auto_close_popup: true
			},
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_use_hold_key: {
			name: "Use hold key",
			description: "Enables the use of a hold key that, when pressed, will keep the popup open",
			requires: [
				{
					_condition: "action:popup",
					mouseover_trigger_behavior: "mouse"
				},
				{
					_condition: "action:popup",
					mouseover_auto_close_popup: true
				},
				{
					_condition: "action:popup",
					mouseover_close_need_mouseout: true
				},
			],
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_hold_key: {
			name: "Hold key",
			description: "Hold key that, when pressed, will keep the popup open",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_hold_position_center: {
			name: "Center popup on hold",
			description: "Centers the popup to the middle of the page when the popup is held",
			requires: "action:popup",
			category: "popup",
			subcategory: "close_behavior"
		},
		popup_hold_zoom: {
			name: "Override zoom on hold",
			description: "Overrides the zoom when the popup is held",
			options: {
				_type: "combo",
				none: {
					name: "None"
				},
				fit: {
					name: "Fit to screen"
				},
				fill: {
					name: "Fill screen"
				},
				full: {
					name: "Full size"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_hold_close_unhold: {
			name: "Close popup on unhold",
			description: "Closes the popup when the hold key is pressed again, after having previously held the popup",
			requires: "action:popup",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_hold_unclickthrough: {
			name: "Enable pointer events on hold",
			description: "Enables previously disabled pointer events when the popup is held",
			requires: {
				_condition: "action:popup",
				mouseover_clickthrough: true
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_close_on_leave_el: {
			name: "Close when leaving thumbnail",
			description: "Closes the popup when the mouse leaves the thumbnail element (won't close if the mouse instead moves to the popup)",
			requires: {
				_condition: "action:popup",
				mouseover_trigger_behavior: "mouse",
				mouseover_position: "beside_cursor"
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_close_click_outside: {
			name: "Clicking outside the popup closes",
			description: "Closes the popup when the mouse clicks outside of it",
			requires: "action:popup",
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_close_el_policy: {
			name: "Close when leaving",
			description: "Closes the popup when the mouse leaves the thumbnail element, the popup, or both",
			requires: [
				{
					_condition: "action:popup",
					mouseover_trigger_behavior: "mouse"
				},
				{
					_condition: "action:popup",
					mouseover_trigger_behavior: "keyboard",
					mouseover_close_need_mouseout: true
				}
			],
			options: {
				_type: "combo",
				thumbnail: {
					name: "Thumbnail"
				},
				popup: {
					name: "Popup"
				},
				both: {
					name: "Both"
				}
			},
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_wait_use_el: {
			name: "Use invisible element when waiting",
			description: "Creates an invisible element under the cursor when waiting for the popup instead of a style element (can improve performance on websites with many elements, but prevents the cursor from clicking anything while loading the popup)",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "popup_other",
			advanced: true
		},
		mouseover_add_to_history: {
			name: "Add popup link to history",
			description: "Adds the image/video link opened through the popup to the browser's history",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "popup_other",
			required_permission: "history",
			extension_only: true
		},
		allow_remote: {
			name: "Allow inter-frame communication",
			description: "Allows communication between frames in windows, improving support for keybindings",
			description_userscript: "Allows communication between frames in windows, improving support for keybindings. Can pose a fingerprinting risk when used through the userscript",
			requires: {
				mouseover: true
			},
			category: "general",
			advanced: !is_userscript // userscript users may want to disable it for privacy reasons
		},
		mouseover_use_remote: {
			name: "Pop out of frames",
			description: "Opens the popup on the top frame instead of within iframes. This option is still experimental.",
			requires: {
				_condition: "action:popup",
				allow_remote: true
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_zoom_behavior: {
			name: "Popup default zoom",
			description: "How the popup should be initially sized",
			options: {
				_type: "combo",
				fit: {
					name: "Fit to screen"
				},
				fill: {
					name: "Fill screen"
				},
				full: {
					name: "Full size"
				},
				custom: {
					name: "Custom size"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_zoom_custom_percent: {
			name: "Custom zoom percent",
			description: "Custom percent to initially size the popup",
			type: "number",
			number_min: 0,
			number_unit: "%",
			requires: {
				mouseover_zoom_behavior: "custom"
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_zoom_use_last: {
			name: "Use last zoom",
			description: "Use the last popup's zoom. Note that this is per-page.",
			options: {
				_type: "combo",
				always: {
					name: "Always"
				},
				gallery: {
					name: "Gallery"
				},
				never: {
					name: "Never"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_zoom_max_width: {
			name: "Maximum width",
			description: "Maximum width for the initial popup size. Set to `0` for unlimited.",
			type: "number",
			number_min: 0,
			number_unit: "px",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_zoom_max_height: {
			name: "Maximum height",
			description: "Maximum height for the initial popup size. Set to `0` for unlimited.",
			type: "number",
			number_min: 0,
			number_unit: "px",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_pan_behavior: {
			name: "Popup panning method",
			description: "How the popup should be panned when larger than the screen",
			options: {
				_type: "or",
				movement: {
					name: "Movement",
					description: "The popup pans as you move your mouse"
				},
				drag: {
					name: "Drag",
					description: "Clicking and dragging pans the popup"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_movement_inverted: {
			name: "Invert movement",
			description: "Inverts the movement of the mouse. For example, if the mouse moves left, the popup moves right. If disabled, it feels more like the popup is being invisibly dragged.",
			requires: {
				mouseover_pan_behavior: "movement"
			},
			advanced: true,
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_drag_min: {
			name: "Minimum drag amount",
			description: "How many pixels the mouse should move to start a drag",
			type: "number",
			number_min: 0,
			number_int: true,
			number_unit: "pixels",
			requires: {
				mouseover_pan_behavior: "drag"
			},
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrolly_behavior: {
			name: "Vertical scroll action",
			description: "How the popup reacts to a vertical scroll/mouse wheel event",
			options: {
				_type: "combo",
				zoom: {
					name: "Zoom"
				},
				pan: {
					name: "Pan"
				},
				gallery: {
					name: "Gallery",
					requires: [{
							mouseover_enable_gallery: true
						}]
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrolly_hold_behavior: {
			name: "Vertical scroll action (hold)",
			description: "How the popup (when held) reacts to a vertical scroll/mouse wheel event",
			options: {
				_type: "combo",
				default: {
					name: "Default"
				},
				zoom: {
					name: "Zoom"
				},
				pan: {
					name: "Pan"
				},
				gallery: {
					name: "Gallery",
					requires: [{
							mouseover_enable_gallery: true
						}]
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrollx_behavior: {
			name: "Horizontal scroll action",
			description: "How the popup reacts to a horizontal scroll/mouse wheel event",
			options: {
				_type: "combo",
				pan: {
					name: "Pan"
				},
				gallery: {
					name: "Gallery",
					requires: [{
							mouseover_enable_gallery: true
						}]
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrollx_hold_behavior: {
			name: "Horizontal scroll action (hold)",
			description: "How the popup (when held) reacts to a horizontal scroll/mouse wheel event",
			options: {
				_type: "combo",
				default: {
					name: "Default"
				},
				pan: {
					name: "Pan"
				},
				gallery: {
					name: "Gallery",
					requires: [{
							mouseover_enable_gallery: true
						}]
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrolly_video_behavior: {
			name: "Vertical video scroll action",
			description: "Overrides the vertical scroll action for videos. Set to `Default` to avoid overriding the behavior.",
			options: {
				_type: "combo",
				default: {
					name: "Default"
				},
				seek: {
					name: "Seek"
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrolly_video_invert: {
			name: "Invert vertical scroll seek",
			description: "Inverts the seek direction when scrolling vertically: Scrolling up will seek right, scrolling down will seek left.",
			requires: {
				mouseover_scrolly_video_behavior: "seek"
			},
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_scrollx_video_behavior: {
			name: "Horizontal video scroll action",
			description: "Overrides the horizontal scroll action for videos. Set to `Default` to avoid overriding the behavior.",
			options: {
				_type: "combo",
				default: {
					name: "Default"
				},
				seek: {
					name: "Seek"
				},
				nothing: {
					name: "None"
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		scroll_override_page: {
			name: "Override scroll outside of popup",
			description: "Scrolling outside of the popup will also be overriden by the script",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		scroll_zoom_origin: {
			name: "Zoom origin",
			description: "The point on the image it's zoomed in/out from",
			options: {
				_type: "or",
				cursor: {
					name: "Cursor"
				},
				center: {
					name: "Center"
				}
			},
			requires: [
				{ mouseover_scrollx_behavior: "zoom" },
				{ mouseover_scrollx_hold_behavior: "zoom" },
				{ mouseover_scrolly_behavior: "zoom" },
				{ mouseover_scrolly_hold_behavior: "zoom" }
			],
			category: "popup",
			subcategory: "behavior"
		},
		scroll_zoomout_pagemiddle: {
			name: "Zoom out towards page middle",
			description: "Sets the origin when zooming out to the page middle, overriding the \"Zoom Origin\" option above.",
			options: {
				_type: "combo",
				always: {
					name: "Always"
				},
				viewport: {
					name: "Within viewport"
				},
				never: {
					name: "Never"
				}
			},
			requires: [
				{ mouseover_scrollx_behavior: "zoom" },
				{ mouseover_scrollx_hold_behavior: "zoom" },
				{ mouseover_scrolly_behavior: "zoom" },
				{ mouseover_scrolly_hold_behavior: "zoom" }
			],
			category: "popup",
			subcategory: "behavior"
		},
		scroll_zoom_behavior: {
			name: "Zoom behavior",
			description: "How zooming should work",
			options: {
				_type: "or",
				fitfull: {
					name: "Fit/Full",
					description: "Toggles between the full size, and fit-to-screen"
				},
				incremental: {
					name: "Incremental"
				}
			},
			requires: [
				{ mouseover_scrollx_behavior: "zoom" },
				{ mouseover_scrollx_hold_behavior: "zoom" },
				{ mouseover_scrolly_behavior: "zoom" },
				{ mouseover_scrolly_hold_behavior: "zoom" }
			],
			category: "popup",
			subcategory: "behavior"
		},
		scroll_incremental_mult: {
			name: "Incremental zoom multiplier",
			description: "How much to zoom in/out by (for incremental zooming)",
			type: "number",
			number_min: 1,
			number_unit: "x",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_move_with_cursor: {
			name: "Move with cursor",
			description: "Moves the popup as the cursor moves",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_move_within_page: {
			name: "Move within page",
			description: "Ensures the popup doesn't leave the page",
			requires: {
				mouseover_move_with_cursor: true
			},
			category: "popup",
			subcategory: "behavior"
		},
		zoom_out_to_close: {
			name: "Zoom out fully to close",
			description: "Closes the popup if you zoom out past the minimum zoom",
			requires: [
				{ mouseover_scrollx_behavior: "zoom" },
				{ mouseover_scrollx_hold_behavior: "zoom" },
				{ mouseover_scrolly_behavior: "zoom" },
				{ mouseover_scrolly_hold_behavior: "zoom" }
			],
			category: "popup",
			subcategory: "close_behavior"
		},
		scroll_past_gallery_end_to_close: {
			name: "Scroll past gallery end to close",
			description: "Closes the popup if you scroll past the end of the gallery",
			requires: [
				{ mouseover_scrollx_behavior: "gallery" },
				{ mouseover_scrollx_hold_behavior: "gallery" },
				{ mouseover_scrolly_behavior: "gallery" },
				{ mouseover_scrolly_hold_behavior: "gallery" }
			],
			category: "popup",
			subcategory: "close_behavior"
		},
		mouseover_position: {
			name: "Popup position",
			description: "Where the popup will appear",
			options: {
				_type: "or",
				_group1: {
					cursor: {
						name: "Cursor middle",
						description: "Underneath the mouse cursor"
					}
				},
				_group2: {
					beside_cursor: {
						name: "Beside cursor"
					}
				},
				_group3: {
					center: {
						name: "Page middle"
					}
				}
			},
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_prevent_cursor_overlap: {
			name: "Prevent cursor overlap",
			description: "Prevents the image from overlapping with the cursor",
			requires: {
				mouseover_position: "beside_cursor"
			},
			hidden: true,
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_overflow_position_center: {
			name: "Center popup on overflow",
			description: "Centers the popup if its initial size overflows",
			requires: "action:popup",
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_overflow_origin: {
			name: "Overflow origin",
			description: "Where the popup will appear in the page if its initial size overflows",
			requires: [
				{ mouseover_position: "center" },
				{ mouseover_overflow_position_center: true },
				{ mouseover_hold_position_center: true }
			],
			options: {
				_type: "or",
				_group1: {
					"a00": { name: "" },
					"a10": { name: "" },
					"a20": { name: "" }
				},
				_group2: {
					"a01": { name: "" },
					"a11": { name: "" },
					"a21": { name: "" }
				},
				_group3: {
					"a02": { name: "" },
					"a12": { name: "" },
					"a22": { name: "" }
				},
			},
			category: "popup",
			subcategory: "open_behavior"
		},
		mouseover_hide_cursor: {
			name: "Hide cursor over popup",
			description: "Hides the cursor when the mouse is over the popup",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_hide_cursor_after: {
			name: "Hide cursor after",
			description: "Hides the cursor over the popup after a specified period of time (in milliseconds), 0 always hides the cursor",
			requires: {
				mouseover_hide_cursor: true
			},
			type: "number",
			number_unit: "ms",
			number_int: true,
			number_min: 0,
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_mouse_inactivity_jitter: {
			name: "Mouse jitter threshold",
			description: "Threshold for mouse movement before the mouse cursor is shown again, 0 always shows the cursor after any movement",
			requires: {
				mouseover_hide_cursor: true
			},
			type: "number",
			number_unit: "px",
			number_int: true,
			number_min: 0,
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_clickthrough: {
			name: "Disable pointer events",
			description: "Enabling this option will allow you to click on links underneath the popup",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_mask_ignore_clicks: {
			name: "Ignore clicks outside popup",
			description: "Any mouse event outside the popup will be discarded with this option",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		enable_stream_download: {
			name: "Enable downloading HLS/DASH streams",
			description: "Downloads and muxes the contents of the streams rather than the stream information file.\nThis currently does not work under Firefox.",
			requires: {
				_condition: "action:popup",
				mouseover_allow_hlsdash: true
			},
			hidden: !has_ffmpeg_lib,
			category: "popup",
			subcategory: "video"
		},
		stream_mux_mp4_over_mkv: {
			name: "Prefer MP4 over MKV",
			description: "Tries to mux the video into mp4 instead of mkv when required. This may slightly slow down muxing as it currently needs to try muxing both.",
			requires: {
				enable_stream_download: true
			},
			hidden: !has_ffmpeg_lib,
			category: "popup",
			subcategory: "video"
		},
		mouseover_add_link: {
			name: "Link image",
			description: "Adds a link to the image in the popup",
			requires: "action:popup",
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_add_video_link: {
			name: "Link video",
			description: "Adds a link to the video in the popup",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_click_image_close: {
			name: "Clicking image closes",
			description: "Clicking the popup image closes the popup",
			requires: "action:popup",
			disabled_if: [
				{ mouseover_add_link: true },
				{ mouseover_clickthrough: true }
			],
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_click_video_close: {
			name: "Clicking video closes",
			description: "Clicking the popup video closes the popup",
			requires: "action:popup",
			disabled_if: [
				{ mouseover_add_video_link: true },
				{ mouseover_clickthrough: true }
			],
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_download: {
			name: "Clicking link downloads",
			description: "Instead of opening the link in a new tab, it will download the image/video instead",
			requires: [
				{
					_condition: "action:popup",
					mouseover_add_link: true
				},
				{
					_condition: "action:popup",
					mouseover_add_video_link: true
				},
			],
			category: "popup",
			subcategory: "behavior"
		},
		mouseover_close_key: {
			name: "Close key",
			description: "Closes the popup when this key is pressed. Currently, ESC will also close the popup regardless of the value of this setting.",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_download_key: {
			name: "Download key",
			description: "Downloads the image in the popup when this key is pressed",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_open_new_tab_key: {
			name: "Open in new tab key",
			description: "Opens the image in the popup in a new tab when this key is pressed",
			hidden: is_userscript && open_in_tab === common_functions["nullfunc"],
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_open_bg_tab_key: {
			name: "Open in background tab key",
			description: "Opens the image in the popup in a new tab without switching to it when this key is pressed",
			hidden: is_userscript && open_in_tab === common_functions["nullfunc"],
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_copy_link_key: {
			name: "Copy link key",
			description: "Copies the link of the media to the clipboard when this key is pressed",
			requires: {
				_condition: "action:popup",
				write_to_clipboard: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_open_options_key: {
			name: "Open options key",
			description: "Opens this page in a new tab when this key is pressed",
			hidden: is_userscript && open_in_tab === common_functions["nullfunc"],
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_open_orig_page_key: {
			name: "Open original page key",
			description: "Opens the original page (if available) when this key is pressed",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_rotate_left_key: {
			name: "Rotate left key",
			description: "Rotates the popup 90 degrees to the left",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_rotate_right_key: {
			name: "Rotate right key",
			description: "Rotates the popup 90 degrees to the right",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_flip_horizontal_key: {
			name: "Horizontal flip key",
			description: "Flips the image horizontally",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_flip_vertical_key: {
			name: "Vertical flip key",
			description: "Flips the image vertically",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_zoom_in_key: {
			name: "Zoom in key",
			description: "Incrementally zooms into the image",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_zoom_out_key: {
			name: "Zoom out key",
			description: "Incrementally zooms out of the image",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_zoom_full_key: {
			name: "Full zoom key",
			description: "Sets the image to be at a 100% zoom, even if it overflows the screen",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_zoom_fit_key: {
			name: "Fit screen key",
			description: "Sets the image to either be at a 100% zoom, or to fit the screen, whichever is smaller",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_fullscreen_key: {
			name: "Toggle fullscreen key",
			description: "Toggles fullscreen mode for the image/video in the popup",
			requires: "action:popup",
			type: "keysequence",
			category: "keybinds",
			subcategory: "popup"
		},
		mouseover_links: {
			name: "Popup for plain hyperlinks",
			description: "Whether or not the popup should also open for plain hyperlinks",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_only_valid_links: {
			name: "Only for links that look valid",
			description: "Enabling this option will only allow links to be popped up if they look valid (such as if they have a known image/video extension, or are explicitly supported)",
			requires: {
				mouseover_links: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_allow_video: {
			name: "Enable videos",
			description: "Allows videos to be popped up",
			profiled: true,
			category: "popup",
			subcategory: "video"
		},
		mouseover_allow_audio: {
			name: "Enable audio",
			description: "Allows audio to be popped up. Currently experimental.\nThis only applies to audio files. Videos that contains audio are supported regardless of this setting.",
			profiled: true,
			category: "popup",
			subcategory: "video"
		},
		mouseover_allow_hlsdash: {
			name: "Allow HLS/DASH streams",
			description: "Allows playback of HLS/DASH streams",
			example_websites: [
				"Dailymotion",
				"Instagram (higher quality)",
				"Reddit",
				"YouTube (higher quality)"
			],
			requires: [
				{
					mouseover_allow_audio: true,
					allow_thirdparty_libs: true
				},
				{
					mouseover_allow_video: true,
					allow_thirdparty_libs: true
				}
			],
			profiled: true,
			category: "popup",
			subcategory: "video"
		},
		mouseover_allow_self_pagelink: {
			name: "Popup page URL",
			description: "If no element can be found, try the page URL. Only relevant for pagelink rules, such as image and video hosting websites",
			requires: {
				mouseover: true,
				mouseover_trigger_behavior: "keyboard"
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_allow_iframe_el: {
			name: "Popup for `<iframe>`",
			description: "Allows `<iframe>` elements to be popped up as well. Storing images/videos in this way is rather uncommon, but it can allow embeds to be supported",
			requires: {
				mouseover_links: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_allow_canvas_el: {
			name: "Popup for `<canvas>`",
			description: "Allows `<canvas>` elements to be popped up as well. This will likely cause popups with any kind of web-based games, so it's recommended to keep this disabled",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_allow_svg_el: {
			name: "Popup for `<svg>`",
			description: "Allows `<svg>` elements to be popped up as well. These are usually used for icons, and can occasionally cause problems for websites that overlay icons on top of images",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_enable_gallery: {
			name: "Enable gallery",
			description: "Toggles whether gallery detection support should be enabled",
			requires: "action:popup",
			category: "popup",
			subcategory: "gallery"
		},
		mouseover_gallery_cycle: {
			name: "Cycle gallery",
			description: "Going to the previous image for the first image will lead to the last image and vice-versa",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			category: "popup",
			subcategory: "gallery"
		},
		mouseover_gallery_prev_key: {
			name: "Previous gallery item",
			description: "Key to trigger the previous gallery item",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "gallery"
		},
		mouseover_gallery_next_key: {
			name: "Next gallery item",
			description: "Key to trigger the next gallery item",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "gallery"
		},
		mouseover_gallery_download_key: {
			name: "Gallery download key",
			description: "Key to download the current gallery",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true,
				allow_thirdparty_libs: true
			},
			type: "keysequence",
			category: "keybinds",
			subcategory: "gallery"
		},
		gallery_download_method: {
			name: "Download method",
			description: "How the gallery should be downloaded",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			options: {
				_type: "combo",
				"zip": {
					name: "Zip file"
				},
				"jdownloader": {
					name: "JDownloader"
				}
			},
			category: "popup",
			subcategory: "gallery"
		},
		gallery_download_unchanged: {
			name: "Download unchanged media",
			description: "Includes gallery items that have not been changed. Useful to potentially avoid downloading thumbnails",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			category: "popup",
			subcategory: "gallery"
		},
		gallery_zip_filename_format: {
			name: "Directory/zip filename format",
			description: [
				"Format string(s) for the directory (package name for JDownloader) and zip filename (if applicable).",
				"Refer to \"Filename format\" under the Rules section for documentation. The variables are set from the first loaded media.",
				"An additional `items_amt` format variable is supported, which contains the number of items.",
				"`.zip` will be automatically suffixed for zip filenames."
			].join("\n"),
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true
			},
			type: "textarea",
			category: "popup",
			subcategory: "gallery"
		},
		gallery_zip_add_tld: {
			name: "Zip: Store in subdirectory",
			description: "Stores the files in a subdirectory with the same name as the .zip file (without the .zip extension)",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true,
				gallery_download_method: "zip"
			},
			category: "popup",
			subcategory: "gallery"
		},
		gallery_jd_autostart: {
			name: "JD: Autostart",
			description: "Autostarts the download when added to JDownloader",
			requires: {
				gallery_download_method: "jdownloader"
			},
			category: "popup",
			subcategory: "gallery"
		},
		gallery_jd_referer: {
			name: "JD: Referer policy",
			description: "Due to a current limitation in JDownloader's API, the `Referer` (sic) header can only be set on a per-package basis. This option allows working around it by submitting multiple packages with the same name using different Referer headers. This can result in JD spamming notifications due to the number of packages created.",
			requires: {
				gallery_download_method: "jdownloader"
			},
			options: {
				_type: "combo",
				"never": {
					name: "Never"
				},
				"domain": {
					name: "Per-domain"
				},
				"always": {
					name: "Always"
				}
			},
			category: "popup",
			subcategory: "gallery"
		},
		gallery_zip_add_info_file: {
			name: "Zip: Store info file",
			description: "Stores a `info.txt` file in the .zip containing information about the downloaded files and host page.",
			requires: {
				_condition: "action:popup",
				mouseover_enable_gallery: true,
				gallery_download_method: "zip"
			},
			category: "popup",
			subcategory: "gallery"
		},
		mouseover_gallery_move_after_video: {
			name: "Move to next when video finishes",
			description: "Moves to the next gallery item when a video finishes playing",
			requires: {
				_condition: "action:popup",
				mouseover_allow_video: true,
				mouseover_enable_gallery: true
			},
			category: "popup",
			subcategory: "gallery"
		},
		mouseover_styles: {
			name: "Popup CSS style",
			description: "Custom CSS styles for the popup",
			documentation: {
				title: "Documentation",
				value: [
					"Most valid CSS is supported, with these differences:",
					"<ul><li>Multiline comments (<code>/* ... */</code>) are currently not supported</li>",
					"<li>Single comments (<code>// ...</code>) are supported, but only at the beginning of a line</li>",
					"<li><code>%thumburl%</code> is the URL of the thumbnail image. For example, you could use it like this: <code>background-image: url(%thumburl%)</code><br />",
					"The URL is properly encoded, so quotes are not necessary (but not harmful either)</li>",
					"<li><code>%fullurl%</code> is the URL of the full image. If IMU fails to find a larger image, it will be the same as <code>%thumburl%</code></li>",
					"<li>Styles are <code>!important</code> by default</li></ul>",
					"<p>For Button CSS style, you can also customize the CSS for individual buttons through their IDs. For example:</p>",
					"<pre>",
					"#closebtn {",
					"  background-color: red;",
					"  // -imu-text allows you to set the text inside the button",
					"  -imu-text: \"Close\";",
					"  // -imu-title allows you to set the tooltip when hovering",
					"  -imu-title: \"Close the popup\";",
					"}",
					"#galleryprevbtn, #gallerynextbtn {",
					"  border-radius: 100px;",
					"}",
					"</pre>"
				].join("\n")
			},
			type: "textarea",
			requires: "action:popup",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_enable_fade: {
			name: "Enable popup fade",
			description: "Enables a fade in/out effect when the popup is opened/closed",
			requires: "action:popup",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_enable_zoom_effect: {
			name: "Enable zoom effect",
			description: "Toggles whether the popup should 'zoom' when opened/closed",
			requires: "action:popup",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_zoom_effect_move: {
			name: "Move from thumbnail when zooming",
			description: "Moves the popup from the thumbnail to the final location while zooming. The animation can be a little rough",
			requires: {
				mouseover_enable_zoom_effect: true
			},
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_fade_time: {
			name: "Popup animation time",
			description: "Fade/zoom animation duration (in milliseconds) for the popup",
			requires: [
				{ mouseover_enable_fade: true },
				{ mouseover_enable_zoom_effect: true }
			],
			type: "number",
			number_min: 0,
			number_unit: "ms",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_enable_mask_styles2: {
			name: "Enable background CSS",
			description: "Toggles whether CSS styles for the background when the popup is active is enabled",
			requires: "action:popup",
			options: {
				"always": {
					name: "Always"
				},
				"hold": {
					name: "On hold"
				},
				"never": {
					name: "No"
				}
			},
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_mask_styles2: {
			name: "Background CSS style",
			description: "CSS style for the background when the popup is active. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)",
			requires: [
				{ mouseover_enable_mask_styles2: "always" },
				{ mouseover_enable_mask_styles2: "hold" }
			],
			type: "textarea",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_mask_fade_time: {
			name: "Background fade",
			description: "Fade in/out time (in milliseconds) for the page background, set to 0 to disable",
			requires: [
				{ mouseover_enable_mask_styles2: "always" },
				{ mouseover_enable_mask_styles2: "hold" }
			],
			type: "number",
			number_min: 0,
			number_unit: "ms",
			category: "popup",
			subcategory: "popup_other"
		},
		mouseover_ui_styles: {
			name: "Button CSS style",
			description: "Custom CSS styles for the popup's UI buttons. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)",
			type: "textarea",
			requires: {
				_condition: "action:popup",
				mouseover_ui: true
			},
			category: "popup",
			subcategory: "ui"
		},
		mouseover_apply_blacklist: {
			name: "Don't popup blacklisted URLs",
			description: "This option popping up for source media with blacklisted URLs. If this is disabled, the popup will open if the end URL isn't blacklisted, regardless of whether the source is blacklisted.",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		apply_blacklist_host: {
			name: "Apply blacklist for host websites",
			description: "This option prevents the script from opening any popups to host websites that are in the blacklist. For example, adding `twitter.com` to the blacklist would prevent any popup from opening on twitter.com. If disabled, this option only applies to image URLs (such as twimg.com), not host URLs",
			category: "popup",
			subcategory: "source"
		},
		mouseover_matching_media_types: {
			name: "Don't popup different media type",
			description: "This option prevents the popup from loading a video when the source was an image or vice-versa",
			requires: {
				mouseover: true,
				mouseover_allow_video: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_allow_popup_when_fullscreen: {
			name: "Allow popup when fullscreen",
			description: "Allows the popup to open if an element (such as a video player) is fullscreen.",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_support_pointerevents_none: {
			name: "Support `pointer-events:none`",
			description: "Manually looks through every element on the page to see if the cursor is beneath them. Supports more images, but also results in a higher CPU load for websites such as Facebook.",
			requires: {
				mouseover: true
			},
			category: "popup",
			subcategory: "source"
		},
		mouseover_find_els_mode: {
			name: "Element finding mode",
			description: "How IMU should find the media element on the page.",
			requires: {
				mouseover: true
			},
			options: {
				full: {
					name: "Full",
					description: "Manually looks through every element on the page to see if the cursor is above them. This will result in a higher CPU load for websites such as Facebook, and may return the wrong element"
				},
				hybrid: {
					name: "Hybrid",
					description: "Looks manually through every child element of the last element found by `getElementsAtPoint`. Use this option if in doubt, it'll work on most sites"
				},
				simple: {
					name: "Simple",
					description: "This is the fastest option, which uses the value of `getElementsAtPoint` without modification. Works for sites that don't use pointer-events:none and shadow DOM"
				}
			},
			warning: {
				"full": "This will result in a much higher CPU load for websites such as Facebook, and will occasionally return the wrong element.\nUse this option with caution."
			},
			category: "popup",
			subcategory: "source"
		},
		popup_allow_cache: {
			name: "Use cache",
			description: "Allows use of a media cache for the popup. The cache is currently stored per-page and is not persistent across page reloads.",
			requires: "action:popup",
			category: "popup",
			subcategory: "cache"
		},
		popup_cache_duration: {
			name: "Cache duration",
			description: "How long for media to remain cached. Set to `0` for unlimited.",
			requires: {
				popup_allow_cache: true
			},
			type: "number",
			number_min: 0,
			number_unit: "minutes",
			category: "popup",
			subcategory: "cache"
		},
		popup_cache_itemlimit: {
			name: "Cache item limit",
			description: "Maximum number of individual media to remain cached. Set to `0` for unlimited.",
			requires: {
				popup_allow_cache: true
			},
			type: "number",
			number_min: 0,
			number_unit: "items",
			category: "popup",
			subcategory: "cache"
		},
		popup_cache_resume_video: {
			name: "Resume videos",
			description: "If a video popup was closed then reopened, the video will resume from where it left off",
			requires: {
				popup_allow_cache: true
			},
			category: "popup",
			subcategory: "cache"
		},
		website_inject_imu: {
			name: "Use userscript",
			description: "Replaces the website's IMU instance with the userscript",
			userscript_only: true,
			category: "website"
		},
		website_image: {
			name: "Website image preview",
			description: "Enables a preview of the image on the Image Max URL website",
			userscript_only: true,
			requires: {
				website_inject_imu: true
			},
			category: "website"
		},
		extension_contextmenu: {
			name: "IMU entry in context menu",
			description: "Enables a custom entry for this extension in the right click/context menu",
			extension_only: true,
			category: "general",
			subcategory: "extension",
			imu_enabled_exempt: true
		},
		extension_hotreload: {
			name: "Hot (re)load",
			description: "(Re)loads the extension on all existing pages when installing or updating",
			extension_only: true,
			category: "general",
			subcategory: "extension",
			imu_enabled_exempt: true
		},
		custom_xhr_for_lib: {
			name: "Custom XHR for libraries",
			description: "Allows the use of more powerful XHR (network requests) for 3rd-party libraries. This allows for certain DASH streams to work.",
			description_userscript: "Allows the use of more powerful XHR  (network requests) for 3rd-party libraries. This allows for certain DASH streams to work. Using this with the userscript version currently poses a potential security risk.",
			category: "general",
			subcategory: "libraries",
			example_websites: [
				"Kakao",
				"YouTube",
				"Instagram (downloading)"
			],
			requires: {
				allow_thirdparty_libs: true
			},
			needrefresh: true // todo: clear the library cache (or only for xhr ones)
		},
		use_webarchive_for_lib: {
			name: "Use Web Archive for libraries",
			description: "Uses archive.org's web archive instead of github for libraries and other script internals (such as the options page).\nDon't enable this unless you need to.",
			userscript_only: true,
			category: "general",
			subcategory: "libraries"
		},
		lib_integrity_check: {
			name: "Enable integrity checks",
			description: "Runs integrity checks before loading 3rd-party libraries",
			userscript_only: true,
			category: "general",
			subcategory: "libraries"
		},
		hls_dash_use_max: {
			name: "HLS/DASH maximum quality",
			description: "Uses the maximum quality for HLS/DASH streams",
			requires: {
				mouseover_allow_hlsdash: true
			},
			category: "popup",
			subcategory: "video"
		},
		max_video_quality: {
			name: "Maximum video quality",
			description: "Maximum quality for videos",
			requires: {
				mouseover_allow_hlsdash: true // FIXME
			},
			options: {
				_type: "combo",
				"unlimited": {
					name: "(unlimited)",
					is_null: true
				},
				"h2160": {
					name: "4K"
				},
				"h1440": {
					name: "1440p"
				},
				"h1080": {
					name: "1080p"
				},
				"h720": {
					name: "720p"
				},
				"h480": {
					name: "480p"
				}
			},
			category: "popup",
			subcategory: "video"
		},
		allow_watermark: {
			name: "Larger watermarked images",
			description: "Enables rules that return larger images that include watermarks",
			category: "rules",
			example_websites: [
				"Stock photo websites"
			],
			onupdate: update_rule_setting
		},
		allow_smaller: {
			name: "Smaller non-watermarked images",
			description: "Enables rules that return smaller images without watermarks",
			category: "rules",
			onupdate: update_rule_setting
		},
		allow_possibly_different: {
			name: "Possibly different images",
			description: "Enables rules that return images that possibly differ, usually due to server-side caching",
			category: "rules",
			onupdate: update_rule_setting
		},
		allow_possibly_broken: {
			name: "Possibly broken images",
			description: "Enables rules that return images that are possibly broken",
			category: "rules",
			hidden: true,
			onupdate: update_rule_setting
		},
		allow_possibly_upscaled: {
			name: "Possibly upscaled images",
			description: "Enables rules that return images that are possibly upscaled",
			category: "rules",
			onupdate: update_rule_setting
		},
		allow_thirdparty: {
			name: "Rules using 3rd-party websites",
			description: "Enables rules that use 3rd-party websites",
			category: "rules",
			example_websites: [
				"Newsen"
			],
			onupdate: update_rule_setting
		},
		allow_apicalls: {
			name: "Rules using API calls",
			description: "Enables rules that use API calls. Strongly recommended to keep this enabled",
			category: "rules",
			example_websites: [
				"Instagram",
				"Flickr",
				"..."
			],
			onupdate: update_rule_setting
		},
		allow_thirdparty_libs: {
			name: "Allow 3rd-party libraries",
			description: "Enables using 3rd-party libraries. This is both used in rules and as a prerequisite for certain functionality.",
			description_userscript: "Enables using 3rd-party libraries. This is both used in rules and as a prerequisite for certain functionality.\nThere is a possible (but unlikely) security risk for the userscript version.",
			category: "general",
			subcategory: "libraries",
			example_websites: [
				"Sites using testcookie (slowAES)"
			],
			onupdate: function() {
				update_rule_setting();
				real_api_cache.clear();
			}
		},
		allow_thirdparty_code: {
			name: "Rules executing 3rd-party code",
			description: "Enables rules that execute arbitrary 3rd-party code stored on websites.",
			warning: {
				"true": "This could lead to security risks, please be careful when using this option!"
			},
			category: "rules",
			onupdate: function() {
				update_rule_setting();
				real_api_cache.clear();
			},
			hidden: true // not currently used
		},
		allow_bruteforce: {
			name: "Rules using brute-force",
			description: "Enables rules that require using brute force (through binary search) to find the original image",
			warning: {
				"true": "This could lead to rate limiting or IP bans"
			},
			category: "rules",
			example_websites: [
				"Deezer"
			],
			onupdate: update_rule_setting
		},
		browser_cookies: {
			name: "Use browser cookies",
			description: "Uses the browser's cookies for API calls in order to access otherwise private data",
			category: "rules",
			example_websites: [
				"Private Flickr images"
			],
			extension_only: true,
			hidden: true,
			onupdate: update_rule_setting
		},
		deviantart_prefer_size: {
			name: "DeviantART: Prefer size over original",
			description: "Prefers a larger (but not upscaled) thumbnail image over a smaller original animated image",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		deviantart_support_download: {
			name: "DeviantART: Use download links",
			description: "Prefers using the download link (if available) by default. Note that this only works if you're logged in to DeviantART",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		ehentai_full_image: {
			name: "E-Hentai: Use full image",
			description: "Prefers using full/original images if available (logged in). This is more likely to get you rate limited",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		imgur_filename: {
			name: "Imgur: Use original filename",
			description: "If the original filename (the one used to upload the image) is found, use it instead of the image ID",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		imgur_source: {
			name: "Imgur: Use source image",
			description: "If a source image is found for Imgur, try using it instead. Only works for old-style Imgur webpages (set `postpagebeta=0; postpagebetalogged=0` as cookies)",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		instagram_use_app_api: {
			name: "Instagram: Use native API",
			description: "Uses Instagram's native API if possible, requires you to be logged into Instagram. This usually allows for higher resolution images (1440x*) to be returned.",
			category: "rules",
			subcategory: "rule_specific",
			warning: {
			},
			onupdate: update_rule_setting
		},
		instagram_dont_use_web: {
			name: "Instagram: Don't use web API",
			description: "Avoids using Instagram's web API if possible, which increases performance, but will occasionally sacrifice quality for videos",
			requires: [{ instagram_use_app_api: true }],
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		instagram_prefer_video_quality: {
			name: "Instagram: Prefer quality over resolution",
			description: "Prefers lower resolution videos that use a higher bitrate over higher resolution images. This adds a slight performance cost as it needs to fetch headers for multiple videos",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		instagram_gallery_postlink: {
			name: "Instagram: Use albums for post thumbnails",
			description: "Queries Instagram for albums when using the popup on a post thumbnail",
			category: "rules",
			subcategory: "rule_specific"
		},
		snapchat_orig_media: {
			name: "Snapchat: Use original media without captions",
			description: "Prefers using original media instead of media with captions and tags overlayed",
			category: "rules",
			subcategory: "rule_specific"
		},
		teddit_redirect_reddit: {
			name: "Teddit: Use Reddit for media",
			description: "Redirects media stored on Teddit to Reddit's servers. Disabling this may prevent finding original images because Teddit's image servers will only cache images fetched from posts, which are deleted after a few minutes.",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		tiktok_no_watermarks: {
			name: "TikTok: Don't use watermarked videos",
			description: "Uses non-watermarked videos for TikTok if possible. This will introduce an extra delay when loading the video as two extra requests need to be performed. It will also fail for any videos uploaded after ~late July 2020",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		tiktok_thirdparty: {
			name: "TikTok: 3rd-party watermark removal",
			description: "Uses a 3rd-party watermark removal site for TikTok.\nI do not endorse any of the sites supported. They may log your IP address and videos you submit. Use this option with caution.\n`LQ` = Low quality, `PL` = Public log",
			requires: [{
					allow_thirdparty: true
				}],
			options: {
				_type: "combo",
				_randomize: true,
				"null": {
					name: "(none)",
					is_null: true
				},
				"ttloader.com:ttt": {
					name: "ttloader.com"
				},
				"onlinetik.com:ttt": {
					name: "onlinetik.com"
				},
				"tikdowns.com:ttt": {
					name: "tikdowns.com"
				},
				"ssstiktok.net:ttt": {
					name: "ssstiktok.net"
				},
				/*"tiktokdownloader.in:ttt": {
					name: "tiktokdownloader.in"
				},*/
				/*"savevideo.ninja:ttt": {
					name: "savevideo.ninja"
				},*/
				"keeptiktok.com": {
					name: "keeptiktok.com (LQ)"
				},
				"ssstiktok.io:1": {
					name: "ssstiktok.io (LQ)"
				},
				"musicallydown.com:1": {
					name: "musicallydown.com (LQ/PL)"
				},
				"snaptik.app": {
					name: "snaptik.app (LQ)"
				},
				"tikmate.online": {
					name: "tikmate.online (LQ)"
				}
			},
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		tumblr_api_key: {
			name: "Tumblr: API key",
			description: "API key for finding larger images on Tumblr",
			category: "rules",
			subcategory: "rule_specific",
			type: "lineedit",
			onupdate: update_rule_setting
		},
		twitter_use_ext: {
			name: "Twitter: Use extension",
			description: "Prefers `.jpg?name=orig` over `?format=jpg&name=orig`. This will possibly incur extra requests before succeeding. Note that there is no difference in image quality.",
			category: "rules",
			subcategory: "rule_specific",
			onupdate: update_rule_setting
		},
		bigimage_blacklist: {
			name: "Blacklist",
			description: "A list of URLs (one per line) that are blacklisted from being processed",
			category: "rules",
			type: "textarea",
			onupdate: function() {
				update_rule_setting();
				create_blacklist_regexes();
			},
			onedit: function() {
				var errors = create_blacklist_regexes();
				var errordiv;
				try {
					errordiv = document.querySelector("#option_bigimage_blacklist .error");
					errordiv.innerText = "";
					errordiv.classList.add("hidden");
				} catch (e) {
				}
				if (errors) {
					for (var i = 0; i < errors.length; i++) {
						if (errordiv) {
							errordiv.innerText += errors[i].message + "\n";
							errordiv.classList.remove("hidden");
						}
						console.error(errors[i]);
					}
				}
			},
			documentation: {
				title: "Documentation",
				value: [
					"The examples below are written for the simple (glob) engine, not the regex engine. The glob engine is generally based on the UNIX glob syntax.<br />",
					"<ul><br />",
					"<li><code>google.com</code> will block https://google.com/, https://www.google.com/, https://abcdef.google.com/, https://def.abc.google.com/, etc.</li>",
					"<li><code>abc.google.com</code> will block https://abc.google.com/, https://def.abc.google.com/, etc.</li>",
					"<li><code>*.google.com</code> will block https://www.google.com/, https://def.abc.google.com/, etc. but not https://google.com/</li>",
					"<li><code>google.*/</code> will block https://google.com/, https://www.google.co.uk, etc.</li>",
					"<li><code>http://google.com</code> will block http://google.com/, but not https://google.com/, http://www.google.com/, etc.</li>",
					"<li><code>google.com/test</code> will block https://google.com/test, https://www.google.com/test/abcdef, but not https://google.com/, etc.</li>",
					"<li><code>google.com/*/test</code> will block https://google.com/abc/test, but not https://google.com/test or https://google.com/abc/def/test</li>",
					"<li><code>google.com/**/test</code> will block https://google.com/abc/test, https://google.com/abc/def/test, https://google.com/abc/def/ghi/test, etc. but not https://google.com/test</li>",
					"<li><code>g??gle.com</code> will block https://google.com/, https://gaagle.com/, https://goagle.com/, etc.</li>",
					"<li><code>google.{com,co.uk}</code> will block https://google.com/ and https://google.co.uk/</li>",
					"<li><code>g[oau]ogle.com</code> will block https://google.com/, https://gaogle.com/, and http://www.guogle.com/</li>",
					"<li><code>g[0-9]ogle.com</code> will block https://g0ogle.com/, https://g1ogle.com/, etc. (up to https://g9ogle.com/)</li>",
					"</ul>"
				].join("\n")
			}
		},
		bigimage_blacklist_engine: {
			name: "Blacklist engine",
			description: "How the blacklist should be processed",
			category: "rules",
			options: {
				glob: {
					name: "Simple (glob)"
				},
				regex: {
					name: "Regex"
				}
			}
		},
		filename_format: {
			name: "Filename format",
			description: "Format string(s) for the filename",
			type: "textarea",
			category: "rules",
			documentation: {
				title: "Documentation",
				value: [
					"<p>Variables are specified between curly brackets (<code>{}</code>).</p>",
					"<p>Below is a list of valid variables:</p>",
					"<ul><br />",
					"<li><code>filename</code> - Original filename (with extension, if applicable)</li>",
					"<li><code>filename_noext</code> - Original filename (without extension, if applicable)</li>",
					"<li><code>ext</code> - Extension (with <code>.</code> prefixed)</li>",
					"<li><code>caption</code> - Popup caption</li>",
					"<li><code>author_username</code> - Author's username</li>",
					"<li><code>id</code> - Post ID</li>",
					"<li><code>host_title</code> - Title of the current tab/window</li>",
					"<li><code>host_url</code> - URL of the host webpage</li>",
					"<li><code>host_domain</code> - Domain of the host webpage</li>",
					"<li><code>host_domain_nosub</code> - Domain (without subdomains) of the host webpage</li>",
					"<li><code>url</code> - URL of the media</li>",
					"<li><code>domain</code> - Domain of the media</li>",
					"<li><code>domain_nosub</code> - Domain (without subdomains) of the media</li>",
					"<li><code>is_screenshot</code> - Blank, the line will only be processed when screenshotting a video</li>",
					"<li><code>prefix</code>, <code>suffix</code> - Blank by default, these variables will be automatically prefixed/suffixed to the filename if set using <code>:=</code></li>",
					"<li><code>created_...</code> - Created date (see note on Date objects below)</li>",
					"<li><code>updated_...</code> - Updated date, this will use the <code>Last-Modified</code> header if not otherwise specified by the rule (see note on Date objects below)</li>",
					"<li><code>download_...</code> - Download date (see note on Date objects below)</li>",
					"<li><code>date_...</code> - Created/updated date (see note on Date objects below)</li>",
					"</ul><br />",
					"<p>You can truncate the value of a variable by adding <code>:(number)</code> before the end bracket (<code>}</code>). For example:</p>",
					"<ul><br />",
					"<li><code>{caption:10}</code> - Truncates the caption to be at most 10 characters long</li>",
					"<li><code>{caption:10.}</code> - Same, but will add an ellipsis (\u2026) if the caption was truncated</li>",
					"</ul><br />",
					"<p>If a variable doesn't exist, by default it will ignore the current format string and use the one on the next line, unless <code>?</code> is added before the end bracket. For example:</p>",
					"<ul><br />",
					"<li><code>{ext?}</code> - Will be replaced with nothing if <code>ext</code> doesn't exist</li>",
					"<li><code>{caption?no caption}</code> - Will be replaced with <code>no caption</code> if <code>caption</code> doesn't exist</li>",
					"</ul><br />",
					"<p>You can check for equality and inequality with <code>==</code> and <code>!=</code> operators respectively. For example:</p>",
					"<ul><br />",
					"<li><code>{domain_nosub==cdninstagram.com}{author_username} {id}</code> - Will only run the current format (<code>{author_username} {id}</code> in this case) if the domain is cdninstagram.com</li>",
					"</ul><br />",
					"<p>You can check if a variable contains a string with <code>/=</code> (<code>!/=</code> for the opposite). It also supports two flags, <code>r</code> (regex) and <code>c</code> (case-sensitive), if added between <code>/</code> and <code>=</code>. For example:</p>",
					"<ul><br />",
					"<li><code>{domain/=instagram}{id}</code> - Will only run the current format (<code>{id}</code>) if the domain contains <code>instagram</code></li>",
					"<li><code>{domain!/=instagram}{id}</code> - Likewise, but only if the domain does not contain <code>instagram</code></li>",
					"<li><code>{domain/r=inst.*ram}{id}</code> - Likewise, but only if the domain matches the regex <code>inst.*ram</code></li>",
					"<li><code>{window_title/c=Instagram}{id}</code> - Likewise, but only if the window's title contains <code>Instagram</code> (case-sensitively)</li>",
					"<li><code>{window_title!/rc=Inst.*ram}{id}</code> - Likewise, but only if the window's title does not match the case-sensitive regex <code>Inst.*ram</code></li>",
					"</ul><br />",
					"<p>You can set a custom variable with <code>:=</code>. For example:</p>",
					"<ul><br />",
					"<li><code>{domain_nosub==cdninstagram.com}{foo:=bar}</code> - Sets the variable <code>foo</code> to <code>bar</code> if the domain is <code>cdninstagram.com</code>. The variable can then be accessed with e.g. <code>{foo}</code></li>",
					"</ul><br />",
					"<p>Date objects are accessible through a number of properties. Each property can be suffixed with <code>_utc</code> to get the UTC/GMT equivalent.</p>",
					"<ul><br />",
					"<li><code>..._iso</code> - Date in ISO format (e.g. <code>2019-12-31T23-30-56</code>). Note that <code>:</code> is replaced with <code>-</code> to avoid issues with paths under NTFS.</li>",
					"<li><code>..._ago</code> - Human-readable representation of the time elapsed since the date (e.g. <code>1 year and 10 months ago</code>, <code>5 months and 20 days ago</code>)</li>",
					"<li><code>..._unix</code> - Unix timestamp (e.g. <code>1577912345</code>)</li>",
					"<li><code>..._unix_ms</code> - Unix timestamp with millisecond accuracy (e.g. <code>1577912345678</code>)</li>",
					"<li><code>..._yyyymmdd</code> - Date in YYYYMMDD format (e.g. <code>20191230</code>)</li>",
					"<li><code>..._hhmmss</code> - Time in HHMMSS format (e.g. <code>233056</code>)</li>",
					"<li><code>..._year</code> - Full year (e.g. <code>2019</code>)</li>",
					"<li><code>..._month</code> - Zero-padded month (e.g. <code>12</code>)</li>",
					"<li><code>..._day</code> - Zero-padded day (e.g. <code>31</code>)</li>",
					"<li><code>..._hours</code> - Zero-padded hours in military/24-hour format (e.g. <code>23</code>)</li>",
					"<li><code>..._minutes</code> - Zero-padded minutes (e.g. <code>30</code>)</li>",
					"<li><code>..._seconds</code> - Zero-padded seconds (e.g. <code>56</code>)</li>",
					"</ul>"
				].join("\n")
			}
		},
		filename_replace_special_underscores: {
			name: "Replace special characters with underscores",
			description: "Replaces characters such as `/` or `\"` with `_` when downloading. Note that browsers will usually do this automatically, this is just to ensure consistent behavior.",
			category: "rules"
		},
		replaceimgs_enable_keybinding: {
			name: "Enable trigger key",
			description: "Enables the use of the trigger key to run it without needing to use the menu",
			category: "extra",
			subcategory: "replaceimages",
		},
		replaceimgs_keybinding: {
			name: "Trigger key",
			description: "Trigger keybinding that will run the Replace Images function",
			requires: {
				replaceimgs_enable_keybinding: true
			},
			type: "keysequence",
			category: "extra",
			subcategory: "replaceimages"
		},
		replaceimgs_auto: {
			name: "Automatically replace images",
			description: "Automatically replace images to larger versions on pages you view",
			warning: {
				"true": "This could lead to rate limiting or IP bans"
			},
			needrefresh: true,
			category: "extra",
			subcategory: "replaceimages"
		},
		replaceimgs_usedata: {
			name: "Use data URLs",
			description: "Uses data:// URLs instead of image links. Disabling this may improve compatibility with some bulk image downloader extensions",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_wait_fullyloaded: {
			name: "Wait until image is fully loaded",
			description: "Waits until the image being replaced is fully loaded before moving on to the next image",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_usedata: false
			},
			imu_enabled_exempt: true
		},
		replaceimgs_totallimit: {
			name: "Max images to process at once",
			description: "The maximum amount of images to process at once",
			type: "number",
			number_min: 1,
			number_int: true,
			number_unit: "images",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_domainlimit: {
			name: "Max images per domain at once",
			description: "The maximum amount of images per domain to process at once",
			type: "number",
			number_min: 1,
			number_int: true,
			number_unit: "images",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_delay: {
			name: "Delay between same-domain images",
			description: "New requests for images in the same domain will be delayed by this amount of seconds. Useful for avoiding rate limits.",
			type: "number",
			number_min: 0,
			number_unit: "seconds",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_replaceimgs: {
			name: "Replace images",
			description: "Replaces images to their larger versions when the button is pressed",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_addlinks: {
			name: "Add links",
			description: "Adds links around replaced media if a link doesn't already exist",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		replaceimgs_replacelinks: {
			name: "Replace links",
			description: "Replaces links if they already exist",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_addlinks: true
			},
			imu_enabled_exempt: true
		},
		replaceimgs_plainlinks: {
			name: "Plain hyperlinks",
			description: "How to treat plain (non-media) hyperlinks that link to potential media",
			category: "extra",
			subcategory: "replaceimages",
			options: {
				_type: "combo",
				none: {
					name: "Ignore"
				},
				replace_link_text: {
					name: "Replace link+text"
				},
				replace_media: {
					name: "Replace media"
				}
			},
			requires: {
				replaceimgs_replaceimgs: true
			},
			imu_enabled_exempt: true
		},
		replaceimgs_links_newtab: {
			name: "Links open in new tab",
			description: "Clicking on a replaced link will open the media in a new tab",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_addlinks: true
			},
			imu_enabled_exempt: true
		},
		replaceimgs_remove_size_constraints: {
			name: "Remove size constraints",
			description: "Removes height/width specifiers for replaced media",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_replaceimgs: true
			},
			imu_enabled_exempt: true
		},
		replaceimgs_size_constraints: {
			name: "Size constraints",
			description: "Removes or enforces height/width specifiers for replaced media",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_replaceimgs: true
			},
			options: {
				_type: "combo",
				none: {
					name: "Ignore"
				},
				remove: {
					name: "Remove"
				},
				force: {
					name: "Force"
				}
			},
			imu_enabled_exempt: true
		},
		replaceimgs_css: {
			name: "Replacement CSS",
			description: "CSS styles to apply to replaced media. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't yet supported here)",
			type: "textarea",
			category: "extra",
			subcategory: "replaceimages",
			requires: {
				replaceimgs_replaceimgs: true
			},
			imu_enabled_exempt: true
		},
		replaceimgs_simple_progress: {
			name: "Simple progress",
			description: "Uses a simpler progress bar that has a fixed size for all media. This is useful to see how many images are replaced, rather than the ETA",
			category: "extra",
			subcategory: "replaceimages",
			imu_enabled_exempt: true
		},
		highlightimgs_enable_keybinding: {
			name: "Enable trigger key",
			description: "Enables the use of the trigger key to run it without needing to use the menu",
			category: "extra",
			subcategory: "highlightimages",
		},
		highlightimgs_keybinding: {
			name: "Trigger key",
			description: "Trigger keybinding that will run the Highlight Images function",
			requires: {
				highlightimgs_enable_keybinding: true
			},
			type: "keysequence",
			category: "extra",
			subcategory: "highlightimages"
		},
		highlightimgs_enable: {
			name: "Enable button",
			description: "Enables the 'Highlight Images' button",
			category: "extra",
			subcategory: "highlightimages",
			imu_enabled_exempt: true
		},
		highlightimgs_auto: {
			name: "Automatically highlight images",
			description: "Automatically highlights images as you view pages",
			options: {
				_type: "or",
				always: {
					name: "Always"
				},
				hover: {
					name: "Hover",
					description: "When hovering over an image"
				},
				never: {
					name: "Never"
				}
			},
			category: "extra",
			subcategory: "highlightimages"
		},
		highlightimgs_onlysupported: {
			name: "Only explicitly supported images",
			description: "Only highlights images that can be made larger or the original version can be found",
			requires: [
				{ highlightimgs_enable: true },
				{ highlightimgs_auto: "always" },
				{ highlightimgs_auto: "hover" }
			],
			category: "extra",
			subcategory: "highlightimages"
		},
		highlightimgs_css: {
			name: "Highlight CSS",
			description: "CSS style to apply for highlight. See the documentation for Popup CSS style for more information (the thumb/full URL variables aren't supported here)",
			type: "textarea",
			requires: [
				{ highlightimgs_enable: true },
				{ highlightimgs_auto: "always" },
				{ highlightimgs_auto: "hover" }
			],
			category: "extra",
			subcategory: "highlightimages",
			imu_enabled_exempt: true
		}
	};
	var option_to_problems = {
		allow_watermark: "watermark",
		allow_smaller: "smaller",
		allow_possibly_different: "possibly_different",
		allow_possibly_broken: "possibly_broken",
		allow_possibly_upscaled: "possibly_upscaled",
		allow_bruteforce: "bruteforce"
	};
	var categories = {
		"general": "General",
		"redirection": "Redirection",
		"popup": "Popup",
		"keybinds": "Shortcuts",
		"rules": "Rules",
		"website": "Website",
		"extra": "Buttons"
	};
	var subcategories = {
		"general": {
			"settings": "subcategory_settings",
			"update": "subcategory_update",
			"libraries": "subcategory_libraries",
			"extension": "subcategory_extension"
		},
		"popup": {
			"trigger": "subcategory_trigger",
			"source": "subcategory_popup_source",
			"open_behavior": "subcategory_open_behavior",
			"close_behavior": "subcategory_close_behavior",
			"behavior": "subcategory_behavior",
			"cache": "subcategory_cache",
			"gallery": "subcategory_gallery",
			"video": "subcategory_video",
			"ui": "subcategory_ui",
			"popup_other": "subcategory_popup_other"
		},
		"keybinds": {
			"popup": "subcategory_keybinds_popup_actions",
			"gallery": "subcategory_gallery",
			"video": "subcategory_video"
		},
		"rules": {
			"rule_specific": "subcategory_rule_specific"
		},
		"extra": {
			"replaceimages": "subcategory_replaceimages",
			"highlightimages": "subcategory_highlightimages"
		}
	};
	var settings_conditions = {
		"action:popup": {
			"mouseover_open_behavior": "popup"
		}
	};
	var obj_insertafter = function(obj, oldkey, newkey, value) {
		var newobj = {};
		for (var key in obj) {
			newobj[key] = obj[key];
			if (key === oldkey) {
				newobj[newkey] = value;
			}
		}
		return newobj;
	};
	(function() {
		for (var setting in settings_meta) {
			var orig_meta = settings_meta[setting];
			if (!orig_meta.profiled)
				continue;
			var default_value = settings[setting];
			for (var i = 0; i < num_profiles; i++) {
				var trigger_id = i + 2;
				var profiled_setting_name = "t" + trigger_id + "_" + setting;
				var setting_before = setting;
				if (i > 0) {
					setting_before = "t" + (trigger_id - 1) + "_" + setting;
				}
				settings = obj_insertafter(settings, setting_before, profiled_setting_name, default_value);
				var profiled_meta = deepcopy(orig_meta);
				settings_meta[profiled_setting_name] = profiled_meta;
				if (is_interactive) {
					profiled_meta.name = _(profiled_meta.name) + " (#" + trigger_id + ")";
					profiled_meta.description = null;
					profiled_meta.example_websites = null;
				}
				if (profiled_meta.requires) {
					var requires = profiled_meta.requires;
					if (!is_array(requires))
						requires = [requires];
					array_foreach(requires, function(srequire) {
						srequire["mouseover_trigger_key_t" + trigger_id] = true;
					});
					profiled_meta.requires = requires;
				}
			}
		}
	})();
	var orig_settings = deepcopy(settings);
	var do_process_strings = false;
	var process_strings = function() {
		/*for (var string in strings) {
			if (!("en" in strings[string])) {
				strings[string]["en"] = string;
			}
		}*/
		for (var setting in settings_meta) {
			var meta = settings_meta[setting];
			if (!(setting in settings)) {
				continue;
			}
			var add_info_field = function(setting, fieldname, value) {
				if (!value)
					return;
				if (!(value in strings)) {
					strings[value] = {};
				}
				if (!("_info" in strings[value])) {
					strings[value]._info = {};
				}
				if (!("instances" in strings[value]._info)) {
					strings[value]._info.instances = [];
				}
				var instance = {
					setting: setting,
					field: fieldname
				};
				var instancejson = JSON_stringify(instance);
				var instances = strings[value]._info.instances;
				var found = false;
				for (var i = 0; i < instances.length; i++) {
					if (JSON_stringify(instances[i]) === instancejson) {
						found = true;
						break;
					}
				}
				if (!found)
					instances.push(instance);
			};
			add_info_field(setting, "name", meta.name);
			add_info_field(setting, "description", meta.description);
			add_info_field(setting, "description_userscript", meta.description_userscript);
			add_info_field(setting, "number_unit", meta.number_unit);
			if (meta.warning) {
				for (var key in meta.warning) {
					add_info_field(setting, "warning." + key, meta.warning[key]);
				}
			}
			if (meta.options) {
				var process_options = function(options) {
					for (var key in options) {
						if (/^_group/.test(key)) {
							process_options(options[key]);
						} else if (key[0] !== "_") {
							add_info_field(setting, "options." + key + ".name", options[key].name);
							add_info_field(setting, "options." + key + ".description", options[key].description);
						}
					}
					;
				};
				process_options(meta.options);
			}
			if (meta.documentation) {
				add_info_field(setting, "documentation.title", meta.documentation.title);
				add_info_field(setting, "documentation.value", meta.documentation.value);
			}
			if (meta.example_websites) {
				for (var i = 0; i < meta.example_websites.length; i++) {
					add_info_field(setting, "example_websites[" + i + "]", meta.example_websites[i]);
				}
			}
		}
		var string_order = ["_info", "en"];
		for (var string in strings) {
			var value = strings[string];
			strings[string] = {};
			var keys = Object.keys(value).sort(function(a, b) {
				var a_index = array_indexof(string_order, a);
				var b_index = array_indexof(string_order, b);
				if (a_index < 0) {
					if (b_index >= 0)
						return 1;
					else
						return a.localeCompare(b);
				} else {
					if (b_index < 0)
						return -1;
					else
						return a_index - b_index;
				}
			});
			if (keys[0] !== "_info") {
				console_error("'_info' should be first", string, keys);
			}
			for (var i = 0; i < keys.length; i++) {
				strings[string][keys[i]] = value[keys[i]];
			}
		}
		return strings;
	};
	if (do_process_strings)
		console_log(process_strings());
	for (var option in option_to_problems) {
		var problem = option_to_problems[option];
		settings[option] = array_indexof(default_options.exclude_problems, problem) < 0;
	}
	var settings_history = {};
	var new_map = function() {
		var map;
		try {
			map = new Map();
		} catch (e) {
			map = {
				imu_map: true,
				object: {},
				array: []
			};
		}
		return map;
	};
	var _map_is_key_primitive = function(key) {
		return typeof key === "string" || typeof key === "number";
	};
	var _map_indexof = function(map, key) {
		for (var i = 0; i < map.array.length; i++) {
			if (map.array[i].key === key) {
				return i;
			}
		}
		return -1;
	};
	var _map_is_emu = function(map) {
		return !!map.imu_map;
	};
	var _map_set_native = function(map, key, value) {
		map.set(key, value);
	};
	var _map_set_emu = function(map, key, value) {
		if (_map_is_key_primitive(key)) {
			map.object[key] = value;
		} else {
			var index = _map_indexof(map, key);
			if (index < 0) {
				map.array.push({ key: key, value: value });
			} else {
				map.array[index].value = value;
			}
		}
	};
	var map_set = function(map, key, value) {
		nir_debug("map", "map_set", deepcopy(key), deepcopy(value));
		if (!_map_is_emu(map)) {
			_map_set_native(map, key, value);
		} else {
			_map_set_emu(map, key, value);
		}
		return value;
	};
	var _map_get_native = function(map, key) {
		return map.get(key);
	};
	var _map_get_emu = function(map, key) {
		if (_map_is_key_primitive(key)) {
			return map.object[key];
		} else {
			var index = _map_indexof(map, key);
			if (index >= 0) {
				return map.array[index].value;
			} else {
				return void 0;
			}
		}
	};
	var map_get = function(map, key) {
		if (!_map_is_emu(map)) {
			return _map_get_native(map, key);
		} else {
			return _map_get_emu(map, key);
		}
	};
	var _map_has_native = function(map, key) {
		return map.has(key);
	};
	var _map_has_emu = function(map, key) {
		if (_map_is_key_primitive(key)) {
			return key in map.object;
		} else {
			return _map_indexof(map, key) >= 0;
		}
	};
	var map_has = function(map, key) {
		if (!_map_is_emu(map)) {
			return _map_has_native(map, key);
		} else {
			return _map_has_emu(map, key);
		}
	};
	var _map_remove_native = function(map, key) {
		map.delete(key);
	};
	var _map_remove_emu = function(map, key) {
		if (_map_is_key_primitive(key)) {
			delete map.object[key];
		} else {
			var index = _map_indexof(map, key);
			if (index >= 0) {
				map.array.splice(index, 1);
			}
		}
	};
	var map_remove = function(map, key) {
		if (!_map_is_emu(map)) {
			return _map_remove_native(map, key);
		} else {
			return _map_remove_emu(map, key);
		}
	};
	var _map_foreach_native = function(map, cb) {
		var keys = map.keys();
		while (true) {
			var key_it = keys.next();
			if (key_it.done)
				break;
			var key = key_it.value;
			cb(key, map.get(key));
		}
	};
	var _map_foreach_emu = function(map, cb) {
		for (var key in map.object) {
			cb(key, map.object[key]);
		}
		for (var i = 0; i < map.array.length; i++) {
			cb(map.array[i].key, map.array[i].value);
		}
	};
	var map_foreach = function(map, cb) {
		if (!_map_is_emu(map)) {
			return _map_foreach_native(map, cb);
		} else {
			return _map_foreach_emu(map, cb);
		}
	};
	var _map_size_native = function(map) {
		return map.size;
	};
	var _map_size_emu = function(map) {
		return Object.keys(map.object).length + map.array.length;
	};
	var map_size = function(map) {
		if (!_map_is_emu(map)) {
			return _map_size_native(map);
		} else {
			return _map_size_emu(map);
		}
	};
	var new_set = function() {
		return new_map();
	};
	var set_add = function(set, key) {
		return map_set(set, key, true);
	};
	var set_has = function(set, key) {
		return map_has(set, key);
	};
	var IMUCache = /** @class */ (function() {
		function IMUCache(options) {
			this.data = new_map();
			this.times = new_map();
			this.fetches = new_map();
			this.options = {};
			if (options)
				this.options = options;
		}
		IMUCache.prototype.set = function(key, value, time) {
			nir_debug("cache", "Cache.set key:", key, ", time=" + time + ", value:", deepcopy(value));
			this.remove(key);
			if (this.options.max_keys) {
				var current_size = map_size(this.data);
				if (current_size > this.options.max_keys) {
					var all_keys = [];
					map_foreach(this.times, function(key, value) {
						all_keys.push({ key: key, end_time: value.end_time, added_time: value.added_time });
					});
					all_keys.sort(function(a, b) {
						if (a.end_time) {
							if (!b.end_time)
								return -1;
							return a.end_time - b.end_time;
						} else {
							if (b.end_time)
								return 1;
							return a.added_time - b.added_time;
						}
					});
					var keys_to_remove = current_size - this.options.max_keys;
					var key_id = 0;
					while (key_id < all_keys.length && keys_to_remove > 0) {
						this.remove(all_keys[key_id++].key);
						keys_to_remove--;
					}
				}
			}
			map_set(this.data, key, value);
			var added_time = Date.now();
			if (typeof time === "number" && time > 0) {
				var cache = this;
				var timer = setTimeout(function() {
					cache.remove(key);
				}, time * 1000);
				if (is_node && typeof timer !== "number" && "unref" in timer) {
					timer.unref();
				}
				map_set(this.times, key, {
					timer: timer,
					time: time,
					added_time: added_time,
					end_time: added_time + time
				});
			} else {
				map_set(this.times, key, {
					added_time: added_time
				});
			}
		};
		IMUCache.prototype.has = function(key) {
			var has_key = map_has(this.data, key);
			nir_debug("cache", "Cache.has key:", key, has_key);
			return has_key;
		};
		IMUCache.prototype.get = function(key) {
			var value = map_get(this.data, key);
			nir_debug("cache", "Cache.get key:", key, deepcopy(value));
			return value;
		};
		IMUCache.prototype.fetch = function(key, done, fetcher) {
			var exists = map_has(this.data, key);
			nir_debug("cache", "Cache.fetch key:", key, ", exists=" + exists);
			if (!exists) {
				if (map_has(this.fetches, key)) {
					map_get(this.fetches, key).push(done);
				} else {
					map_set(this.fetches, key, []);
					var _this = this;
					fetcher(function(data, time) {
						if (time !== false)
							_this.set.bind(_this)(key, data, time);
						done(data);
						var our_fetches = map_get(_this.fetches, key);
						for (var i = 0; i < our_fetches.length; i++) {
							our_fetches[i](data);
						}
						map_remove(_this.fetches, key);
					});
				}
			} else {
				done(map_get(this.data, key));
			}
		};
		IMUCache.prototype.remove = function(key) {
			nir_debug("cache", "Cache.remove key:", key);
			if (map_has(this.times, key)) {
				var timeobj = map_get(this.times, key);
				if ("timer" in timeobj)
					clearTimeout(timeobj.timer);
			}
			if (this.options.destructor && map_has(this.data, key)) {
				this.options.destructor(key, map_get(this.data, key));
			}
			map_remove(this.times, key);
			map_remove(this.data, key);
		};
		IMUCache.prototype.clear = function() {
			nir_debug("cache", "Cache.clear");
			map_foreach(this.times, function(key, value) {
				if ("timer" in value) {
					clearTimeout(value.timer);
				}
			});
			if (this.options.destructor) {
				map_foreach(this.data, function(key, value) {
					this.options.destructor(key, value);
				});
			}
			this.times = new_map();
			this.data = new_map();
		};
		return IMUCache;
	}());
	;
	var url_cache = new IMUCache();
	var real_api_cache = new IMUCache();
	var lib_cache = new IMUCache();
	var cookie_cache = new IMUCache();
	var real_api_query = function(api_cache, do_request, key, request, cb, process) {
		api_cache.fetch(key, cb, function(done) {
			if (!("method" in request))
				request.method = "GET";
			request.onload = function(resp) {
				if (resp.status !== 200) {
					if (!request.silent)
						console_error(key, resp);
					return done(null, false);
				}
				try {
					var out_resp = resp;
					var resptext = resp.responseText;
					if (request.jsonp) {
						resptext = resptext.replace(/^[$_a-zA-Z][$_a-zA-Z0-9]+\(({[\s\S]*})\);?$/, "$1");
					}
					if (request.json || request.jsonp) {
						out_resp = JSON_parse(resptext);
					}
					return process(done, out_resp, key);
				} catch (e) {
					console_error(key, e, resp);
					return done(null, false);
				}
			};
			do_request(request);
		});
	};
	var compat_match = function(str, regex) {
		var real_regex = regex;
		if (regex.regex && regex.groups) {
			real_regex = regex.regex;
		}
		var matched = str.match(real_regex);
		if (!matched)
			return matched;
		if (real_regex !== regex) {
			if (!matched.groups)
				matched.groups = {};
			array_foreach(regex.groups, function(group, i) {
				matched.groups[group] = matched[i + 1];
			});
		}
		return matched;
	};
	var real_website_query = function(options) {
		if (!is_array(options.website_regex)) {
			options.website_regex = [options.website_regex];
		}
		var website_match = null;
		for (var i = 0; i < options.website_regex.length; i++) {
			website_match = compat_match(options.url, options.website_regex[i]);
			if (website_match)
				break;
		}
		if (!website_match)
			return null;
		var page_nullobj = {
			url: options.url,
			is_pagelink: true
		};
		if (!options.do_request || !options.cb) {
			return page_nullobj;
		}
		var domain = options.url.replace(/^[a-z]+:\/\/([^/]+)\/+.*$/, "$1");
		var domain_nosub = get_domain_nosub(domain);
		if (!options.cache_key) {
			options.cache_key = domain_nosub;
		}
		var cb = function(data) {
			if (!data) {
				return options.cb(page_nullobj);
			} else {
				if (!is_array(data)) {
					data = [data];
				}
				data.push(page_nullobj);
				return options.cb(data);
			}
		};
		if (!options.override_cb) {
			options.override_cb = function(cb, data) {
				cb(data);
			};
		}
		if (!options.run) {
			options.run = function(cb, website_match, options) {
				var id = website_match[1];
				if (website_match.groups && website_match.groups.id) {
					id = website_match.groups.id;
				}
				var fill_string_vars = function(str) {
					return str
						.replace(/\${id}/g, id)
						.replace(/\${([^/]+)}/g, function(_, x) {
						if (/^[0-9]+$/.test(x))
							return website_match[x];
						return website_match.groups[x];
					});
				};
				if (options.id) {
					id = fill_string_vars(options.id);
				}
				var query = options.query_for_id;
				if (typeof options.query_for_id === "string") {
					query = {
						url: query
					};
				}
				if (typeof query === "object" && query.url) {
					query.url = fill_string_vars(query.url);
				} else {
					query = query(id, website_match);
				}
				real_api_query(options.api_cache, options.do_request, options.cache_key + ":" + id, query, cb, function(done, resp, cache_key) {
					return options.process(done, resp, cache_key, website_match, options);
				});
			};
		}
		options.run(function(data) {
			options.override_cb(cb, data);
		}, website_match, options);
		return {
			waiting: true
		};
	};
	var is_invalid_url = function(url) {
		if (!url)
			return false;
		for (var i = 0; i < url.length; i++) {
			if (url.charCodeAt(i) === 0) {
				return true;
			}
		}
		return false;
	};
	function mod(n, m) {
		return ((n % m) + m) % m;
	}
	var string_to_int = function(str, alpha) {
		var base = 0;
		for (var i = 0; i < str.length; i++) {
			var index = string_indexof(alpha, str[i]);
			base *= alpha.length;
			base += index;
		}
		return base;
	};
	function urlsplit(a) {
		var protocol_split = a.split("://");
		var protocol = protocol_split[0];
		var splitted = protocol_split[1].split("/");
		var domain = splitted[0];
		var start = protocol + "://" + domain;
		return {
			protocol: protocol,
			domain: domain,
			url: a
		};
	}
	function urlnorm(a) {
		var protocol_split = a.split("://");
		var splitted = protocol_split[1].split("/");
		var newsplitted = [];
		for (var i = 0; i < splitted.length; i++) {
			if (splitted[i] === "..")
				newsplitted.pop();
			else
				newsplitted.push(splitted[i]);
		}
		return protocol_split[0] + "://" + newsplitted.join("/");
	}
	var is_valid_resource_url = function(url) {
		var match = url.match(/^([-a-z]+):/);
		if (match) {
			var valid_schemes = ["http", "https", "ftp", "data", "x-raw-image", "blob", "chrome", "file"];
			return array_indexof(valid_schemes, match[1].toLowerCase()) >= 0;
		}
		return true;
	};
	var norm_url = function(url) {
		return url
			.replace(/^([a-z]+:\/\/[^/]+)(\?.*)/, "$1/$2")
			.replace(/^([a-z]+:\/\/[^/]+\.[^/]+)\.([?#/].*)?$/, "$1$2");
	};
	function urljoin(a, b, browser) {
		if (b.length === 0)
			return a;
		if (b.match(/^[-a-z]*:\/\//) || b.match(/^(?:data|x-raw-image|blob|about|javascript):/))
			return b;
		var protocol_split = a.split("://");
		if (protocol_split.length < 2) {
			return a;
		}
		var protocol = protocol_split[0];
		var splitted = protocol_split[1].split("/");
		var domain = splitted[0];
		var start = protocol + "://" + domain;
		if (!browser) {
			return a.replace(/\/*$/, "") + "/" + b.replace(/^\/*/, "");
		} else {
			if (b.length >= 2 && b.slice(0, 2) === "//")
				return protocol + ":" + b;
			if (b.length >= 1 && b.slice(0, 1) === "/")
				return start + b;
			if (b.length >= 2 && b.slice(0, 2) === "./")
				b = b.substring(2);
			if (!a.match(/\/$/))
				a = a.replace(/^([^?]*)\/.*?$/, "$1/");
			return urlnorm(a + b.replace(/^\/*/, ""));
		}
	}
	var fullurl = function(url, x) {
		if (x === void 0 || x === null)
			return x;
		var a = document_createElement(a);
		a.href = x;
		return a.href;
	};
	var url_basename = function(url, options) {
		var basename = url.replace(/.*\//, "");
		if (!options)
			options = {};
		if (!("remove_queryhash" in options))
			options.remove_queryhash = true;
		if (!options.remove_queryhash)
			return basename;
		basename = basename.replace(/[?#].*$/, "");
		if (!options.split_ext)
			return basename;
		var match;
		if (options.known_ext) {
			match = basename.match(/(.*?)\.(mp4|mpe?g|jpe?g|jfif|png|tiff|og[agv]|m4[av]|web[pm]|mkv|avi|gif|mpd|m3u8|zip)$/i);
		} else {
			match = basename.match(/(.*)\.([^.]*)$/);
		}
		if (!match)
			return [basename];
		return [match[1], match[2]];
	};
	var basic_fillobj = function(obj) {
		var mobj = force_array((obj || {}));
		array_foreach(mobj, function(sobj, i) {
			if (typeof sobj === "string") {
				mobj[i] = { url: sobj };
			}
		});
		return mobj;
	};
	var fillobj = function(p_obj, p_baseobj) {
		var obj = basic_fillobj(p_obj);
		var baseobj = basic_fillobj(deepcopy(p_baseobj))[0];
		for (var i = 0; i < obj.length; i++) {
			if (typeof (obj[i]) === "undefined") {
				continue;
			}
			var item;
			if (!obj[i].url || !baseobj.url || baseobj.url === obj[i].url) {
				for (item in baseobj) {
					if (!(item in obj[i])) {
						obj[i][item] = baseobj[item];
					}
				}
			}
			for (item in default_object) {
				if (!(item in obj[i])) {
					obj[i][item] = deepcopy(default_object[item]);
				}
			}
			if (obj[i].video && obj[i].media_info.type === "image") {
				if (obj[i].video === true) {
					obj[i].media_info = {
						type: "video"
					};
				} else if (typeof obj[i].video === "string") {
					obj[i].media_info = {
						type: "video",
						delivery: obj[i].video
					};
				} else {
					obj[i].media_info = deepcopy(obj[i].video);
					obj[i].media_info.delivery = obj[i].media_info.type;
					obj[i].media_info.type = "video";
				}
			}
		}
		return obj;
	};
	var fillobj_urls = function(urls, obj, overwrite) {
		var newobj = [];
		for (var i = 0; i < urls.length; i++) {
			var currentobj = deepcopy(obj);
			if (typeof urls[i] === "string") {
				currentobj.url = urls[i];
			} else {
				for (var key in urls[i]) {
					if (!overwrite || !(key in currentobj))
						currentobj[key] = urls[i][key];
				}
			}
			newobj.push(currentobj);
		}
		return newobj;
	};
	var add_full_extensions = function(obj, extensions, prefer_order) {
		if (!extensions)
			extensions = [
				"jpg", "jpeg", "png", "gif", "webp", "avif",
				"JPG", "JPEG", "PNG", "GIF"
			];
		if (!is_array(obj)) {
			obj = [obj];
		}
		var result = [];
		for (var i = 0; i < obj.length; i++) {
			var currentobj = obj[i];
			var url = currentobj;
			if (typeof currentobj !== "string") {
				url = currentobj.url;
			}
			var regex = /(.*)\.([^/.]*?)([?#].*)?$/;
			if (!url.match(regex)) {
				result.push(currentobj);
				continue;
			}
			var ext = url.replace(regex, "$2");
			var basename = url.replace(regex, "$1");
			var query = url.replace(regex, "$3");
			if (!prefer_order)
				result.push(currentobj);
			for (var i = 0; i < extensions.length; i++) {
				if (!prefer_order && ext === extensions[i])
					continue;
				var currenturl = basename + "." + extensions[i] + query;
				if (typeof currentobj === "string") {
					result.push(currenturl);
				} else {
					var newobj = deepcopy(currentobj);
					newobj.url = currenturl;
					result.push(newobj);
				}
			}
			if (prefer_order && array_indexof(result, currentobj) < 0)
				result.push(currentobj);
		}
		return result;
	};
	var add_extensions = function(url) {
		return add_full_extensions(url, ["jpg", "png"]);
	};
	var add_extensions_jpeg = function(url) {
		return add_full_extensions(url, ["jpeg", "png"]);
	};
	var add_extensions_with_jpeg = function(url) {
		return add_full_extensions(url, ["jpg", "jpeg", "png"]);
	};
	var add_extensions_gif = function(url) {
		return add_full_extensions(url, ["jpg", "png", "gif"]);
	};
	var add_extensions_upper = function(url) {
		return add_full_extensions(url, ["jpg", "png", "JPG", "PNG"]);
	};
	var add_extensions_upper_jpeg = function(url) {
		return add_full_extensions(url, ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"]);
	};
	var add_http = function(url) {
		if (!url.match(/^[a-z]+:\/\//))
			return "http://" + url;
		return url;
	};
	var force_https = function(url) {
		return url.replace(/^http:\/\//, "https://");
	};
	var decodeuri_ifneeded = function(url) {
		if (url.match(/^https?:\/\//))
			return url;
		if (url.match(/^https?%3[aA]/) || /^[^/]*%2[fF]/.test(url))
			return decodeURIComponent(url);
		if (url.match(/^https?%253[aA]/))
			return decodeURIComponent(decodeURIComponent(url));
		return url;
	};
	var encodeuri_ifneeded = function(url) {
		if (string_indexof(url, "%") < 0) {
			return encodeURI(url);
		}
		return url;
	};
	var replace_sizes = function(src, sizes, keep_orig_if_empty) {
		var current_problems = null;
		var orig_obj = null;
		for (var i = 0; i < sizes.length; i++) {
			var url = sizes[i];
			if (typeof url === "object")
				url = url.url;
			if (url === src) {
				if (typeof sizes[i] === "object" && sizes[i].problems)
					current_problems = sizes[i].problems;
				orig_obj = sizes[i];
				sizes.splice(i, sizes.length);
				break;
			}
		}
		if (current_problems) {
			for (var i = 0; i < sizes.length; i++) {
				if (typeof sizes[i] !== "object")
					continue;
				if (sizes[i].problems) {
					for (var problem in sizes[i].problems) {
						if (sizes[i].problems[problem] === current_problems[problem]) {
							delete sizes[i].problems[problem];
						}
					}
				}
			}
		}
		if (keep_orig_if_empty && !sizes.length) {
			sizes.push(orig_obj);
		}
		return sizes;
	};
	var zpadnum = function(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	};
	function hex_to_ascii(str1) {
		var hex = str1.toString();
		var str = '';
		for (var n = 0; n < hex.length; n += 2) {
			str += string_fromcharcode(parseInt(hex.substr(n, 2), 16));
		}
		return str;
	}
	function hex_to_numberarray(str) {
		var result = [];
		for (var i = 0; i < str.length; i += 2) {
			result.push(parseInt(str.substr(i, 2), 16));
		}
		return result;
	}
	function numberarray_to_hex(arr) {
		var str = "";
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] < 16)
				str += "0";
			str += arr[i].toString(16);
		}
		return str;
	}
	function reverse_str(str) {
		return common_functions["run_arrayd_string"](str, {
			cb: function(arr) {
				return arr.reverse();
			}
		});
	}
	function decode_entities(str) {
		var match = str.match(/^\s*<!\[CDATA\[([\s\S]+)\]\]>\s*$/);
		if (match)
			return match[1];
		return str
			.replace(/&nbsp;/g, " ")
			.replace(/&#([0-9]+);/g, function(full, num) { return string_fromcharcode(num); })
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, "&");
	}
	function encode_entities(str) {
		return str.replace(/&/g, "&amp;");
	}
	function encode_regex(str) {
		return str.replace(/([\^$])/g, "\\$1");
	}
	function get_queries(url, options) {
		var querystring = url
			.replace(/#.*/, "")
			.replace(/^.*?\?/, "");
		if (!querystring || querystring === url)
			return {};
		if (!options) {
			options = {};
		}
		var queries = {};
		var splitted = querystring.split("&");
		for (var i = 0; i < splitted.length; i++) {
			var name = splitted[i];
			var value = true;
			var match = splitted[i].match(/^(.*?)=(.*)/);
			if (match) {
				name = match[1];
				value = match[2];
			}
			if (name.length === 0)
				continue;
			if (options.decode && typeof value === "string") {
				value = decodeURIComponent(value);
			}
			queries[name] = value;
		}
		return queries;
	}
	function stringify_queries(queries, encode) {
		var queriesstr = [];
		for (var query in queries) {
			if (query.length === 0)
				continue;
			var current_query = query;
			var queryval = queries[query];
			if (encode)
				queryval = encodeURIComponent(queryval);
			if (queries[query] !== true) {
				current_query += "=" + queryval;
			}
			queriesstr.push(current_query);
		}
		return queriesstr.join("&");
	}
	function remove_queries(url, queries) {
		if (!is_array(queries)) {
			queries = [queries];
		}
		var beforequery = url.replace(/^([^#]*?)\?(.*)$/, "$1");
		var afterquery = url.replace(/^([^#]*?)\?(.*)$/, "$2");
		if (beforequery === url)
			return url;
		var splitted = afterquery.split("&");
		var newsplitted = [];
		for (var i = 0; i < splitted.length; i++) {
			var property = splitted[i].replace(/^(.*?)=.*/, "$1");
			if (array_indexof(queries, property) < 0) {
				newsplitted.push(splitted[i]);
			}
		}
		if (newsplitted.length === 0) {
			afterquery = "";
		} else {
			afterquery = "?" + newsplitted.join("&");
		}
		return beforequery + afterquery;
	}
	function keep_queries(url, queries, options) {
		if (!is_array(queries)) {
			queries = [queries];
		}
		if (!options) {
			options = {};
		}
		var url_queries = get_queries(url);
		var kept_queries = [];
		var has_queries = new_set();
		array_foreach(queries, function(query) {
			if (query in url_queries) {
				var querystr = query + "=";
				if (options.overwrite && query in options.overwrite) {
					querystr += options.overwrite[query];
				} else {
					querystr += url_queries[query];
				}
				kept_queries.push(querystr);
				set_add(has_queries, query);
			}
		});
		if (options.required) {
			if (options.required === true)
				options.required = queries;
			var required_total = 0;
			array_foreach(options.required, function(query) {
				if (set_has(has_queries, query)) {
					required_total++;
				} else {
					return false;
				}
			});
			if (required_total < options.required.length)
				return url;
		}
		if (options.overwrite) {
			for (var query in options.overwrite) {
				if (!set_has(has_queries, query)) {
					kept_queries.push(query + "=" + options.overwrite[query]);
				}
			}
		}
		var afterquery;
		if (kept_queries.length === 0)
			afterquery = "";
		else
			afterquery = "?" + kept_queries.join("&");
		return url.replace(/\?.*/, "") + afterquery;
	}
	function add_queries(url, queries) {
		var parsed_queries = get_queries(url);
		for (var query in queries) {
			parsed_queries[query] = queries[query];
		}
		var newquerystring = stringify_queries(parsed_queries);
		if (newquerystring) {
			return url.replace(/^([^#]*?)(?:\?.*)?$/, "$1?" + newquerystring);
		} else {
			return url;
		}
	}
	var raw_do_notify = null;
	if (is_userscript) {
		if (typeof GM_notification !== "undefined") {
			raw_do_notify = GM_notification;
		} else if (typeof GM !== "undefined" && GM.notification) {
			raw_do_notify = GM.notification;
		}
	} else if (is_extension) {
		raw_do_notify = function(details, ondone) {
			var jsoned_details = deepcopy(details, { json: true });
			if (details.onclick)
				jsoned_details.onclick = true;
			extension_send_message({
				type: "notification",
				data: jsoned_details
			}, function(response) {
				if (!response || !response.data)
					return;
				if (response.data.action === "clicked") {
					if (details.onclick) {
						details.onclick();
					}
				} else if (response.data.action === "closed") {
					ondone = details.ondone || ondone;
					if (ondone) {
						ondone();
					}
				}
			});
		};
	}
	var do_notify = function(details) {
		if (!raw_do_notify)
			return;
		if (!details.title) {
			details.title = _("Image Max URL");
		}
		if (!details.image) {
			details.image = imu_icon;
		}
		raw_do_notify(details, details.ondone || null);
	};
	function fuzzify_text(str) {
		return str
			.replace(/(?:[-=_!?$#"'’‘”“]|\[|])/g, " ")
			.replace(/\s+/g, " ")
			.replace(/^\s+|\s+$/g, "");
	}
	var check_updates_firefox = function(cb) {
		do_request({
			url: firefox_addon_page,
			method: "GET",
			onload: function(resp) {
				if (resp.readyState < 4)
					return;
				if (resp.status !== 200)
					return cb(null);
				var match = resp.responseText.match(/<script[^>]*id=["']redux-store-state["']\s*>\s*({.*?})\s*<\/script>/);
				if (!match) {
					return cb(null);
				}
				try {
					var json = JSON_parse(match[1]);
					var addoninfo = json.addons.byID["1003321"];
					var versionid = addoninfo.currentVersionId;
					var versioninfo = json.versions.byId[versionid];
					var version = versioninfo.version;
					var downloadurl = versioninfo.platformFiles.all.url.replace(/\?src=.*/, "?src=external-updatecheck");
					cb({
						version: version,
						downloadurl: downloadurl
					});
				} catch (e) {
					console_error("Unable to parse mozilla addon info", e);
					return cb(null);
				}
			}
		});
	};
	var check_updates_github = function(cb) {
		do_request({
			url: "https://api.github.com/repos/qsniyg/maxurl/tags",
			method: "GET",
			headers: {
				Referer: ""
			},
			onload: function(resp) {
				if (resp.readyState < 4)
					return;
				if (resp.status !== 200)
					return cb(null);
				try {
					var json = JSON_parse(resp.responseText);
					for (var i = 0; i < json.length; i++) {
						var version = json[i].name;
						if (!version.match(/^v[0-9.]+$/)) {
							continue;
						}
						return cb({
							version: version.replace(/^v([0-9])/, "$1")
						});
					}
				} catch (e) {
					console_error("Unable to parse github info", e);
				}
				return cb(null);
			}
		});
	};
	var check_updates = function(cb) {
		if (false && is_firefox_webextension) {
			check_updates_firefox(function(data) {
				if (!data) {
					check_updates_github(cb);
				} else {
					cb(data);
				}
			});
		} else {
			check_updates_github(cb);
		}
	};
	var get_update_url = function() {
		var link = settings.last_update_url;
		if (!link) {
			if (is_firefox_webextension) {
				link = firefox_addon_page;
			} else if (is_userscript) {
				link = userscript_update_url;
			} else {
				link = null;
			}
		}
		return link;
	};
	var check_updates_if_needed = function() {
		if (!settings.imu_enabled || !settings.check_updates || !current_version || !settings.last_update_check) {
			return;
		}
		var update_check_delta = Date.now() - settings.last_update_check;
		if (update_check_delta > (settings.check_update_interval * 60 * 60 * 1000)) {
			check_updates(function(data) {
				update_setting("last_update_check", Date.now());
				if (!data || !data.version)
					return;
				if (!data.downloadurl) {
					update_setting("last_update_url", null);
				} else {
					update_setting("last_update_url", data.downloadurl);
				}
				update_setting("last_update_version", data.version);
				if (settings.check_update_notify && !is_in_iframe && version_compare(current_version, data.version) === 1) {
					var notify_obj = {
						text: _("Update available (%%1)", data.version)
					};
					var downloadurl = get_update_url();
					if (downloadurl) {
						notify_obj.onclick = function() {
							open_in_tab_imu({
								url: downloadurl
							});
						};
					}
					do_notify(notify_obj);
				}
			});
		}
	};
	function _fuzzy_compare_rollover(a, b, lim) {
		if (a === b)
			return true;
		if (a - 1 === b || a + 1 === b)
			return true;
		for (var i = 0; i < lim.length; i++) {
			if (a === lim[i]) {
				if (b === 1)
					return true;
			} else if (b === lim[i]) {
				if (a === 1)
					return true;
			}
		}
		return false;
	}
	function _is_larger_rollover(a, b, end) {
		if (a === 1 && array_indexof(end, b) >= 0)
			return true;
		if (b === 1 && array_indexof(end, a) >= 0)
			return true;
		return false;
	}
	function fuzzy_date_compare(a, b) {
		if (a === b)
			return true;
		if (a.length !== 8 || b.length !== 8)
			return false;
		var a_d = parse_int(a.substr(6, 2));
		var b_d = parse_int(b.substr(6, 2));
		if (!_fuzzy_compare_rollover(a_d, b_d, [28, 29, 30, 31]))
			return false;
		var a_m = parse_int(a.substr(4, 2));
		var b_m = parse_int(b.substr(4, 2));
		var d_rollover = _is_larger_rollover(a_d, b_d, [28, 29, 30, 31]);
		if (a_m !== b_m) {
			if (!d_rollover)
				return false;
			if (!_fuzzy_compare_rollover(a_m, b_m, [12]))
				return false;
		}
		var a_y = parse_int(a.substr(0, 4));
		var b_y = parse_int(b.substr(0, 4));
		if (a_y !== b_y) {
			if (!d_rollover || !_is_larger_rollover(a_m, b_m, [12]))
				return false;
			if (!_fuzzy_compare_rollover(a_y, b_y, []))
				return false;
		}
		return true;
	}
	function run_soon(func) {
		setTimeout(func, 1);
	}
	if (is_node || true) {
		fullurl = function(url, x) {
			return urljoin(url, x, true);
		};
	}
	var blacklist_regexes = [];
	function update_rule_setting() {
		url_cache.clear();
	}
	function create_blacklist_regexes() {
		blacklist_regexes = [];
		var blacklist_str = settings.bigimage_blacklist || "";
		if (typeof blacklist_str !== "string") {
			console_warn("Invalid blacklist", blacklist_str);
			return;
		}
		var blacklist = blacklist_str.split("\n");
		for (var i = 0; i < blacklist.length; i++) {
			var current = blacklist[i].replace(/^\s+|\s+$/, "");
			if (current.length === 0)
				continue;
			if (settings.bigimage_blacklist_engine === "regex") {
				try {
					blacklist_regexes.push(new RegExp(current));
				} catch (e) {
					return [e];
				}
			} else if (settings.bigimage_blacklist_engine === "glob") {
				var newcurrent = "";
				var sbracket = -1;
				var cbracket = -1;
				for (var j = 0; j < current.length; j++) {
					if (sbracket >= 0) {
						if (current[j] === "]") {
							newcurrent += current.substr(sbracket, j - sbracket + 1);
							sbracket = -1;
						}
						continue;
					}
					if (cbracket >= 0) {
						if (current[j] === "}") {
							var options = current.substr(cbracket + 1, j - cbracket - 1).split(",");
							var newoptions = [];
							for (var k = 0; k < options.length; k++) {
								newoptions.push(options[k].replace(/(.)/g, "[$1]"));
							}
							if (newoptions.length > 0 && (newoptions.length > 1 || newoptions[0].length > 0))
								newcurrent += "(?:" + newoptions.join("|") + ")";
							cbracket = -1;
						}
						continue;
					}
					if (current[j] !== "*") {
						if (current[j] === "{") {
							cbracket = j;
						} else if (current[j] === "[") {
							sbracket = j;
						} else if (current[j] === "?") {
							newcurrent += "[^/]";
						} else if (current[j] === ".") {
							newcurrent += "\\.";
						} else {
							newcurrent += current[j];
						}
						continue;
					}
					var doublestar = false;
					if ((j + 1) < current.length) {
						if (current[j + 1] === "*") {
							doublestar = true;
							j++;
						}
					}
					if (doublestar)
						newcurrent += ".+";
					else
						newcurrent += "[^/]+";
				}
				current = newcurrent;
				if (current[0] !== "*") {
					newcurrent = current.replace(/^[a-z]*:\/\//, "[a-z]+://");
					if (newcurrent !== current) {
						current = newcurrent;
					} else {
						current = "[a-z]+://[^/]*" + current;
					}
				}
				current = "^" + current;
				try {
					blacklist_regexes.push(new RegExp(current));
				} catch (e) {
					return [e];
				}
			}
		}
	}
	var parse_headers = function(headerstr) {
		var headers = [];
		var splitted = headerstr.split("\r\n");
		for (var i = 0; i < splitted.length; i++) {
			var header_name = splitted[i].replace(/^\s*([^:]*?)\s*:[\s\S]*/, "$1").toLowerCase();
			var header_value = splitted[i].replace(/^[^:]*?:\s*([\s\S]*?)\s*$/, "$1");
			if (header_name === splitted[i] || header_value === splitted[i])
				continue;
			var value_split = header_value.split("\n");
			for (var j = 0; j < value_split.length; j++) {
				headers.push({ name: header_name, value: value_split[j] });
			}
		}
		if (_nir_debug_)
			console_log("parse_headers", headerstr, deepcopy(headers));
		return headers;
	};
	var headers_list_to_dict = function(headers) {
		var dict = {};
		for (var i = 0; i < headers.length; i++) {
			dict[headers[i].name.toLowerCase()] = headers[i].value;
		}
		return dict;
	};
	var headers_dict_to_list = function(headers) {
		var list = [];
		for (var header in headers) {
			list.push({ name: header, value: headers[header] });
		}
		return list;
	};
	var parse_cookieheader = function(cookieheader) {
		var cookies = {};
		do {
			var match = cookieheader.match(/^\s*([^=]*?)\s*=\s*([^;]*?)\s*(?:;\s*(.*))?$/);
			if (!match)
				break;
			cookies[match[1]] = match[2];
			cookieheader = match[3];
		} while (cookieheader);
		if (_nir_debug_)
			console_log("parse_cookieheader", cookieheader, deepcopy(cookies));
		return cookies;
	};
	var create_cookieheader_from_headers = function(headers, cookieheader) {
		headers = parse_headers(headers);
		var cookies = {};
		for (var i = 0; i < headers.length; i++) {
			if (headers[i].name !== "set-cookie")
				continue;
			var cookie_match = headers[i].value.match(/^\s*([^=]*?)\s*=\s*([^;]*?)\s*;.*/);
			if (!cookie_match) {
				console_error("Unable to match cookie: ", headers[i]);
				continue;
			}
			cookies[cookie_match[1]] = cookie_match[2];
		}
		if (_nir_debug_)
			console_log("create_cookieheader_from_headers", headers, cookieheader, deepcopy(cookies));
		if (cookieheader) {
			var parsed = parse_cookieheader(cookieheader);
			for (var key in parsed) {
				if (!(key in cookies)) {
					cookies[key] = parsed[key];
				}
			}
		}
		var cookies_array = [];
		for (var key in cookies) {
			cookies_array.push(key + "=" + cookies[key]);
		}
		return cookies_array.join("; ");
	};
	var headerobj_get = function(headerobj, header) {
		for (var key in headerobj) {
			if (key.toLowerCase() === header.toLowerCase()) {
				return headerobj[key];
			}
		}
	};
	var headerobj_set = function(headerobj, header, value) {
		for (var key in headerobj) {
			if (key.toLowerCase() === header.toLowerCase()) {
				return headerobj[key] = value;
			}
		}
		return headerobj[header] = value;
	};
	var get_resp_finalurl = function(resp) {
		var parsed = parse_headers(resp.responseHeaders);
		if (!parsed)
			return resp.finalUrl;
		var dict = headers_list_to_dict(parsed);
		if (!dict || !dict["location"])
			return resp.finalUrl;
		return dict["location"];
	};
	var contenttype_map = {
		"image/jpeg": "jpg",
		"application/dash+xml": "mpd"
	};
	var get_ext_from_contenttype = function(contenttype) {
		contenttype = contenttype.replace(/^\s*\[?([^/]+)\/([^/]+?)\]?\s*$/, "$1/$2");
		if (contenttype in contenttype_map)
			return contenttype_map[contenttype];
		var split = contenttype.match(/^([^/]+)\/([^/]+)$/);
		if (!split)
			return null;
		if (split[1] !== "image" && split[1] !== "video")
			return null;
		return split[2];
	};
	var makeCRCTable = function() {
		var c;
		var crcTable = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) {
				c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
			}
			crcTable[n] = c;
		}
		return crcTable;
	};
	var cached_crc_table = null;
	var crc32 = function(str) {
		var crcTable = cached_crc_table || (cached_crc_table = makeCRCTable());
		var crc = 0 ^ (-1);
		for (var i = 0; i < str.length; i++) {
			crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
		}
		return (crc ^ (-1)) >>> 0;
	};
	var custom_xhr = function() {
		this._headers = {};
		this._response_headers = {};
		this._reqobj = null;
		this._last_readyState = null;
		this.open = function(method, url, synchronous) {
			this._method = method;
			this._url = url;
		};
		this.setRequestHeader = function(headername, headervalue) {
			headerobj_set(this._headers, headername, headervalue);
		};
		this.getResponseHeader = function(headername) {
			return headerobj_get(this._response_headers, headername);
		};
		this.getAllResponseHeaders = function() {
			return this._response_headers_raw;
		};
		var _handle_event = function(_this, name, data) {
			if (data) {
				_this.status = data.status || 0;
				_this.statusText = data.statusText;
				_this.response = data.response;
				_this.readyState = data.readyState;
				_this.responseText = data.responseText;
				_this.responseType = data.responseType;
				_this.responseURL = data.finalUrl;
				this._response_headers_raw = data.responseHeaders;
			}
			var event = {
				currentTarget: _this,
				target: _this,
				loaded: _this.loaded,
				lengthComputable: _this.lengthComputable,
				total: _this.total
			};
			if (data && data.responseHeaders) {
				this._response_headers = headers_list_to_dict(parse_headers(data.responseHeaders));
			} else if (data) {
				this._response_headers = null;
			}
			if (_this.readyState !== this._last_readyState) {
				if (_this.onreadystatechange)
					_this.onreadystatechange.bind(_this)(event);
				this._last_readyState = _this.readyState;
			}
			if (name === "load") {
				if (_this.onload)
					_this.onload.bind(_this)(event);
				if (_this.onloadend)
					_this.onloadend.bind(_this)(event);
			}
			if (name === "error") {
				if (_this.onerror)
					_this.onerror.bind(_this)(event);
				if (_this.onloadend)
					_this.onloadend.bind(_this)(event);
			}
			if (name === "abort") {
				if (_this.onabort)
					_this.onabort.bind(_this)(event);
				if (_this.onloadend)
					_this.onloadend.bind(_this)(event);
			}
			if (name === "progress") {
				if (_this.onprogress)
					_this.onprogress.bind(_this)(event);
			}
			if (name === "timeout") {
				if (_this.ontimeout)
					_this.ontimeout.bind(_this)(event);
			}
		};
		this.send = function(_this, data, do_request) {
			var reqobj = {
				method: this._method,
				url: this._url,
				data: data,
				timeout: _this.timeout || 0,
				withCredentials: _this.withCredentials || true,
				responseType: _this.responseType
			};
			if (Object.keys(this._headers).length > 0)
				reqobj.headers = this._headers;
			var add_listener = function(our_this, event) {
				reqobj["on" + event] = function(resp) {
					_handle_event.bind(our_this)(_this, event, resp);
				};
			};
			add_listener(this, "load");
			add_listener(this, "error");
			add_listener(this, "abort");
			add_listener(this, "progress");
			add_listener(this, "timeout");
			this._reqobj = do_request(reqobj);
		};
		this.abort = function() {
			if (!this._reqobj)
				return;
			this._reqobj.abort();
		};
	};
	custom_xhr.do_request = do_request;
	var custom_xhr_wrap = function() {
		var real = new imu_xhr.custom_xhr();
		var copy = ["open", "setRequestHeader", "getResponseHeader", "getAllResponseHeaders", "abort"];
		for (var i = 0; i < copy.length; i++) {
			var item = copy[i];
			(function(item) {
				var real_item = real[item];
				this[item] = function() {
					return real_item.apply(real, arguments);
				};
			}).bind(this)(item);
		}
		this.send = function(data) {
			return real.send(this, data, XMLHttpRequest.do_request);
		};
	};
	var run_sandboxed_lib = function(fdata, xhr) {
		if (true) {
			if (!xhr) {
				return new Function(fdata + ";return lib_export;")();
			} else {
				var overridden_xhr = true;
				if (!settings.custom_xhr_for_lib)
					overridden_xhr = false;
				var endshim = ";return {lib: lib_export, xhr: XMLHttpRequest, overridden_xhr: " + overridden_xhr + "};";
				if (overridden_xhr) {
					var startshim = "var XMLHttpRequest=null;(function(imu_xhr){XMLHttpRequest=" + custom_xhr_wrap.toString() + ";XMLHttpRequest.do_request = imu_xhr.do_request;})(imu_xhr);imu_xhr = undefined;";
					return new Function("imu_xhr", startshim + fdata + endshim)({
						custom_xhr: custom_xhr,
						do_request: do_request
					});
				} else {
					return new Function(fdata + endshim)();
				}
			}
		} else {
			var frame = document_createElement('iframe');
			frame.srcdoc = ""; //"javascript:0"
			document.body.appendChild(frame);
			var result = frame.contentWindow.Function(fdata + ";return lib_export;")();
			frame.parentElement.removeChild(frame);
			return result;
		}
	};
	var run_sandboxed_lib_safe = function(fdata, xhr) {
		try {
			var result = run_sandboxed_lib(fdata, xhr);
			return result;
		} catch (e) {
			console_error(e);
			return null;
		}
	};
	var lib_urls = {
		"testcookie_slowaes": {
			name: "testcookie_slowaes",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/e90366f4b6c998614509472717fd18ca8050c1fa/lib/testcookie_slowaes.js",
			archive_time: "20210403210438",
			size: 30462,
			crc32: 1012990654,
			crc32_size: 2369381957
		},
		"shaka": {
			name: "shaka.debug",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/588bef6bf443ee9b00f07ce77638c1bf435101c6/lib/shaka.debug.js",
			archive_time: "20210215220612",
			size: 1067495,
			crc32: 2828102141,
			crc32_size: 3777086751,
			xhr: true
		},
		"cryptojs_aes": {
			name: "cryptojs_aes",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/22df70495741c2f90092f4cc0c504a1a2f6e6259/lib/cryptojs_aes.js",
			archive_time: "20210215220612",
			size: 13453,
			crc32: 4282597182,
			crc32_size: 3521118067
		},
		"stream_parser": {
			name: "stream_parser",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/0655c317844fb7a652c6ee9f88ab65514c53b482/lib/stream_parser.js",
			archive_time: "20210403204309",
			size: 115544,
			crc32: 270289712,
			crc32_size: 2967398805
		},
		"ffmpeg": {
			name: "ffmpeg",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/2178819a193656245ce1a2bd885ff12aaaa04ea9/lib/ffmpeg.js",
			archive_time: "20210403204304",
			size: 285642,
			crc32: 2587771391,
			crc32_size: 2632494853,
			xhr: true
		},
		"jszip": {
			name: "jszip",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/04ded19e6a25408d7a272420778a2147983949bc/lib/jszip.js",
			archive_time: "20210403204254",
			size: 99574,
			crc32: 2493372642,
			crc32_size: 624003151
		},
		"BigInteger": {
			name: "BigInteger",
			url: "https://raw.githubusercontent.com/qsniyg/maxurl/b0a4ba6c28f0c0b7c665e76e3767bde59e900ab6/lib/BigInteger.js",
			archive_time: " 20220629185936",
			size: 21482,
			crc32: 337445473,
			crc32_size: 2641711624
		}
	};
	var get_library = function(name, options, do_request, cb) {
		if (!options.allow_thirdparty_libs) {
			console_warn("Refusing to request library " + name + " due to 3rd-party library support being disabled");
			return cb(null);
		}
		if (!(name in lib_urls)) {
			console_error("Invalid library", name);
			return cb(null);
		}
		var lib_obj = lib_urls[name];
		if (is_scripttag) {
			return cb(null);
		} else if (is_node) {
			try {
				var libname = "./lib/" + lib_obj.name + ".js";
				var lib = require(/* webpackIgnore: true */ libname);
				return cb(lib);
			} catch (e) {
				console.error(e);
				return cb(null);
			}
		}
		if (is_extension || is_userscript) {
			lib_cache.fetch(name, cb, function(done) {
				if (is_extension) {
					extension_send_message({
						type: "get_lib",
						data: {
							name: lib_obj.name
						}
					}, function(response) {
						if (!response || !response.data || !response.data.text)
							return done(null, 0); // 0 instead of false because it will never be available
						done(run_sandboxed_lib(response.data.text, lib_obj.xhr), 0);
					});
				} else {
					var lib_url = lib_obj.url;
					if (!lib_url) {
						console_error("No URL for library", lib_obj);
						return done(null, 0);
					}
					if (options.use_webarchive_for_lib) {
						if (lib_obj.archive_url) {
							lib_url = lib_obj.archive_url;
						} else {
							var time = lib_obj.archive_time;
							if (!time) {
								var date = new Date();
								time = "" + date.getFullYear();
								time += zpadnum(date.getMonth() + 1, 2);
								time += zpadnum(date.getDate(), 2);
								time += zpadnum(date.getHours(), 2);
								time += zpadnum(date.getMinutes(), 2);
								time += "00";
							}
							lib_url = "https://web.archive.org/web/" + time + "js_/" + lib_obj.url;
						}
					}
					do_request({
						method: "GET",
						url: lib_url,
						headers: {
							Referer: ""
						},
						onload: function(result) {
							if (result.readyState !== 4)
								return;
							if (result.status !== 200) {
								console_error(result);
								return done(null, false);
							}
							var libcontents = result.responseText;
							if (options.use_webarchive_for_lib) {
								libcontents = libcontents
									.replace(/^\s*var _____WB\$wombat\$assign\$function_____[\s\S]*_____WB\$wombat\$assign\$function_____[(].*[)];\n\n/, "")
									.replace(/\n\n}\n\/\*\s*FILE ARCHIVED ON[\s\S]*/, "")
									.replace(/(["'])https:\/\/web.archive.org\/web\/[0-9]+(?:[a-z]+_)?\/+(https?:\/\/)/g, "$1$2")
									.replace(/(["'])\/\/web.archive.org\/web\/[0-9]+(?:[a-z]+_)?\/+https?:(\/\/)/g, "$1$2");
							}
							if (settings.lib_integrity_check) {
								var is_dev = false;
								if (false) {
									is_dev = true;
									var start_time = 0;
									if (is_dev) {
										console_log("Size:", libcontents.length);
										console_log("Crc32:", crc32(libcontents));
										console_log("Crc32_2:", crc32(libcontents + (libcontents.length + "")));
										start_time = Date.now();
									}
								}
								if (libcontents.length !== lib_obj.size) {
									console_error("Wrong response length for " + name + ": " + libcontents.length + " (expected " + lib_obj.size + ")");
									return done(null, false);
								}
								var crc = crc32(libcontents);
								if (crc !== lib_obj.crc32) {
									console_error("Wrong crc32 for " + name + ": " + crc + " (expected " + lib_obj.crc32 + ")");
									return done(null, false);
								}
								crc = crc32(libcontents + (lib_obj.size + ""));
								if (crc !== lib_obj.crc32_size) {
									console_error("Wrong crc32 #2 for " + name + ": " + crc + " (expected " + lib_obj.crc32_size + ")");
									return done(null, false);
								}
								if (is_dev)
									console_log("Check time:", Date.now() - start_time);
							}
							done(run_sandboxed_lib_safe(libcontents, lib_obj.xhr), 0);
						}
					});
				}
			});
		} else {
			return cb(null);
		}
	};
	if (false) {
		for (var lib_name in lib_urls) {
			(function(lib_name) {
				get_library(lib_name, {
					allow_thirdparty_libs: true,
					use_webarchive_for_lib: true
				}, do_request, function(lib) {
					if (!lib)
						console_error("Unable to load", lib_name);
				});
			})(lib_name);
		}
	}
	var normalize_whitespace = function(str) {
		return str
			.replace(/[\u200B-\u200D\uFEFF]/g, '')
			.replace(/[\u2800]/g, ' ');
	};
	var strip_whitespace_simple = function(str) {
		if (!str || typeof str !== "string") {
			return str;
		}
		return str
			.replace(/^\s+/, "")
			.replace(/\s+$/, "");
	};
	var strip_whitespace = function(str) {
		if (!str || typeof str !== "string") {
			return str;
		}
		return strip_whitespace_simple(normalize_whitespace(str));
	};
	var get_image_size = function(url, cb) {
		var image = new Image(url);
		var timeout = null;
		var finalcb = function(e) {
			image.onload = null;
			image.onerror = null;
			clearTimeout(timeout);
			var x, y;
			if (!image.naturalHeight || !image.naturalWidth) {
				x = null;
				y = null;
			}
			x = parse_int(image.naturalWidth);
			y = parse_int(image.naturalHeight);
			image.src = ""; // stop loading
			cb(x, y);
		};
		image.onload = image.onerror = finalcb;
		timeout = setInterval(function() {
			if (image.naturalHeight && image.naturalWidth) {
				finalcb();
			}
		}, 10);
		image.src = url;
	};
	if (is_node || typeof "Image" === "undefined") {
		get_image_size = null;
	}
	var sort_by_key = function(array, key, indexer, options) {
		if (!options)
			options = {};
		return array.sort(function(a, b) {
			var a_key = a[key];
			var b_key = b[key];
			if (indexer) {
				a_key = indexer(a_key);
				b_key = indexer(b_key);
			} else {
				a_key = parseFloat(a_key) || 0;
				b_key = parseFloat(b_key) || 0;
			}
			if (options.reverse)
				return b_key - a_key;
			else
				return a_key - b_key;
		});
	};
	var sort_by_array = function(array, key) {
		array.sort(function(a, b) {
			var a_index = array_indexof(key, a);
			var b_index = array_indexof(key, b);
			if (a_index < 0) {
				if (b_index >= 0)
					return 1;
				else
					return a.localeCompare(b);
			} else {
				if (b_index < 0)
					return -1;
				else
					return a_index - b_index;
			}
		});
		return array;
	};
	var parse_tag_def = function(tag) {
		var match = tag.match(/^<([-a-zA-Z0-9]+)((?:\s+[-a-z0-9A-Z]+(?:=(?:"[^"]+"|'[^']+'|[-_a-zA-Z0-9]+))?)*)\s*(\/?)>/);
		if (!match) {
			return null;
		}
		var parsed = {
			tagname: match[1],
			selfclosing: !!match[3],
			args: {},
			args_array: []
		};
		var args_regex = /\s+([-a-z0-9A-Z]+)(?:=("[^"]+"|'[^']+'|[-_a-zA-Z0-9]+))?/;
		var args = match[2];
		match = args.match(new RegExp(args_regex, "g"));
		if (!match)
			return parsed;
		for (var i = 0; i < match.length; i++) {
			var submatch = match[i].match(args_regex);
			var argname = submatch[1].toLowerCase();
			var argvalue = submatch[2];
			if (!argvalue) {
				argvalue = "";
			} else {
				argvalue = decode_entities(argvalue.replace(/^["'](.*)["']$/, "$1"));
			}
			parsed.args[argname] = argvalue;
			parsed.args_array.push({ name: submatch[1], value: argvalue });
		}
		return parsed;
	};
	var get_meta = function(text, property) {
		var regex = new RegExp("<meta\\s+(?:(?:property|name|itemprop)=[\"']?" + property + "[\"']?\\s+(?:content|value|href)=[\"']([^'\"]+)[\"']|(?:content|value|href)=[\"']([^'\"]+)[\"']\\s+(?:property|name|itemprop)=[\"']?" + property + "[\"']?)\\s*\/?>");
		var match = text.match(regex);
		if (!match)
			return null;
		return decode_entities(match[1] || match[2]);
	};
	var fixup_js_obj = function(objtext) {
		return objtext
			.replace(/([{,])\s*([^[{,"'\s:]+)\s*:/g, "$1 \"$2\":")
			.replace(/(\"[^\s:"]+?\":)\s*'([^']*)'(\s*[,}])/g, "$1 \"$2\"$3")
			.replace(/,\s*}$/, "}");
	};
	var js_obj_token_types = {
		whitespace: /\s+/,
		jvarname: /[$_a-zA-Z][$_a-zA-Z0-9]*/,
		jpropname: /[$_a-zA-Z0-9]+/,
		number: /-?(?:[0-9]*\.[0-9]+|[0-9]+|[0-9]+\.)(?:e[0-9]+)?/,
		objstart: /{/,
		objend: /}/,
		object: ["objstart", "whitespace?", "kvcw*", "objend"],
		arrstart: /\[/,
		arrend: /]/,
		array: ["arrstart", "whitespace?", "valuecw*", "arrend"],
		true: /true/,
		false: /false/,
		null: /null/,
		value: [["array"], ["object"], ["sstring"], ["dstring"], ["number"], ["true"], ["false"], ["null"]],
		valuew: ["value", "whitespace?"],
		valuec: ["valuew", "comma?"],
		valuecw: ["valuec", "whitespace?"],
		comma: /,/,
		colon: /:/,
		squote: /'/,
		dquote: /"/,
		sstring: ["squote", "sliteral", "squote"],
		dstring: ["dquote", "dliteral", "dquote"],
		propname: [["jpropname"], ["sstring"], ["dstring"]],
		kv: ["propname", "whitespace?", "colon", "whitespace?", "value"],
		kvw: ["kv", "whitespace?"],
		kvc: ["kvw", "comma?"],
		kvcw: ["kvc", "whitespace?"],
		doc: [["object"], ["array"]]
	};
	var parse_js_obj = function(objtext, js_obj_token_types) {
		/*var is_array = function(x) {
			return Array.isArray(x);
		};

		var array_extend = function(array, other) {
			[].push.apply(array, other);
		};*/
		js_obj_token_types = deepcopy(js_obj_token_types);
		for (var key in js_obj_token_types) {
			var value = js_obj_token_types[key];
			if (value instanceof RegExp) {
				js_obj_token_types[key] = {
					type: "regex",
					value: new RegExp("^" + value.source)
				};
			} else if (is_array(value)) {
				if (is_array(value[0])) {
					js_obj_token_types[key] = {
						type: "or",
						value: value
					};
				} else {
					js_obj_token_types[key] = {
						type: "and",
						value: value
					};
				}
			}
		}
		var times_ran = 0;
		var token_frequency = {};
		var stack_frequency = {};
		var find_token_regex = function(token_type, tt, i) {
			var text = objtext.substring(i);
			var match = text.match(tt);
			if (!match || match.index !== 0) {
				return null;
			} else {
				return [{
						name: token_type,
						i: i,
						ni: i + match[0].length,
						value: match[0],
						length: match[0].length
					}];
			}
		};
		var find_token_sliteral = function(token_type, i) {
			var quote = token_type === "dliteral" ? '"' : "'";
			var text = "";
			var escaping = false;
			var j;
			for (j = i; j < objtext.length; j++) {
				var ch = objtext[j];
				if (escaping) {
					escaping = false;
					if (ch === "x") {
						text += "\\u00" + objtext.substr(j + 1, 2);
						j += 2;
					} else if (ch !== '"' && ch !== "'") {
						text += "\\" + ch;
					} else {
						text += ch;
					}
					continue;
				}
				if (ch === quote) {
					break;
				} else if (ch === "\\") {
					escaping = true;
				} else {
					text += ch;
				}
			}
			return [{
					name: token_type,
					i: i,
					ni: j,
					value: text,
					length: j - i
				}];
		};
		var find_token = function(token_type, i, stack) {
			times_ran++;
			if (!(token_type in token_frequency))
				token_frequency[token_type] = 0;
			token_frequency[token_type]++;
			if (!(stack in stack_frequency))
				stack_frequency[stack] = 0;
			stack_frequency[stack]++;
			if (token_type === "sliteral" || token_type === "dliteral") {
				return find_token_sliteral(token_type, i);
			}
			var tt = js_obj_token_types[token_type];
			if (tt.type === "and") {
				return find_token_array_and(tt, i, stack);
			} else if (tt.type === "or") {
				return find_token_array_or(tt, i, stack);
			} else {
				return find_token_regex(token_type, tt.value, i);
			}
		};
		var find_token_array = function(array, i, stack) {
			var tokens = [];
			for (var j = 0; j < array.length; j++) {
				var token_type = array[j];
				var lastchar = token_type[token_type.length - 1];
				var minuslast = token_type.substring(0, token_type.length - 1);
				if (lastchar === "?") {
					var token = find_token(minuslast, i, stack + 1);
					if (!token || token.length === 0)
						continue;
					array_extend(tokens, token);
					i = token[token.length - 1].ni;
				} else if (lastchar === "*") {
					while (true) {
						var token = find_token(minuslast, i, stack + 1);
						if (!token || token.length === 0)
							break;
						array_extend(tokens, token);
						i = token[token.length - 1].ni;
					}
				} else {
					var token = find_token(token_type, i, stack + 1);
					if (!token || token.length === 0) {
						if (tokens.length > 10 && false)
							console.log(tokens, token_type, i);
						return null;
					}
					array_extend(tokens, token);
					i = token[token.length - 1].ni;
				}
			}
			return tokens;
		};
		var find_token_array_and = function(tt, i, stack) {
			return find_token_array(tt.value, i, stack);
		};
		var find_token_array_or = function(tt, i, stack) {
			for (var j = 0; j < tt.value.length; j++) {
				var token = find_token_array(tt.value[j], i, stack);
				if (token && token.length) {
					return token;
				}
			}
			return null;
		};
		var outer_tokens = find_token("doc", 0, 0);
		return outer_tokens;
	};
	var fixup_js_obj_proper = function(objtext) {
		var parsed = parse_js_obj(objtext, js_obj_token_types);
		if (!parsed)
			throw "unable to parse";
		var token_types = {
			whitespace: " ",
			jvarname: function(x) { return '"' + x + '"'; },
			jpropname: function(x) { return '"' + x + '"'; },
			squote: "\"",
			sliteral: function(x) { return x.replace(/"/g, "\\\""); },
			dliteral: function(x) { return x.replace(/"/g, "\\\""); },
			comma: function(x, next) {
				if (!next || next.name === "objend" || next.name === "arrend") {
					return "";
				} else {
					return x;
				}
			}
		};
		var stringified = "";
		for (var i = 0; i < parsed.length; i++) {
			var token = parsed[i];
			if (token.name in token_types) {
				var tt = token_types[token.name];
				if (typeof tt === "function") {
					var n = 1;
					var next_token = parsed[i + (n++)];
					while (next_token && next_token.name === "whitespace") {
						next_token = parsed[i + (n++)];
					}
					stringified += tt(token.value, next_token);
				} else {
					stringified += tt;
				}
			} else {
				stringified += token.value;
			}
		}
		return stringified;
	};
	common_functions["twitter_normalize_status_link"] = function(link) {
		var match = link.match(/\/status\/+([0-9]+)(?:\/+(?:retweets|likes|photo|video)(?:\/+.*)?|\/*)(?:[?#].*)?$/);
		if (match) {
			return link.replace(/(\/status\/+[0-9]+)\/*.*(?:[?#].*)?$/, "$1");
		}
		return null;
	};
	common_functions["get_twitter_tweet_link"] = function(el) {
		var currentel = el;
		while ((currentel = currentel.parentElement)) {
			if (currentel.tagName === "A") {
				var norm = common_functions["twitter_normalize_status_link"](currentel.href);
				if (norm)
					return norm;
			}
			if (currentel.tagName === "ARTICLE") {
				var our_as = currentel.querySelectorAll("a[role='link']");
				for (var i = 0; i < our_as.length; i++) {
					var our_href = our_as[i].href;
					if (!our_href)
						continue;
					var norm = common_functions["twitter_normalize_status_link"](our_href);
					if (norm)
						return norm;
				}
				break;
			}
		}
		return null;
	};
	common_functions["get_twitter_caption"] = function(el) {
		var currentel = el;
		while ((currentel = currentel.parentElement)) {
			if (currentel.tagName === "ARTICLE") {
				var captiondiv = currentel.querySelectorAll("div[lang]");
				if (captiondiv && captiondiv.length === 1) {
					return captiondiv[0].innerText;
				}
				break;
			}
		}
		return null;
	};
	common_functions["get_twitter_video_tweet"] = function(el, window) {
		if (el.tagName !== "VIDEO" || !el.src.match(/^blob:/))
			return null;
		var poster = el.poster;
		if (!poster)
			return null;
		if (!/\/ext_tw_video_thumb\/+[0-9]+\/+pu\/+img\//.test(poster))
			return null;
		var href = window.location.href;
		var match = href.match(/\/i\/+videos\/+tweet\/+([0-9]+)(?:[?#].*)?$/);
		if (match) {
			return {
				id: match[1]
			};
		}
		var currentel = el;
		while ((currentel = currentel.parentElement)) {
			if (currentel.tagName === "ARTICLE") {
				var our_as = currentel.querySelectorAll("a[role='link']");
				for (var i = 0; i < our_as.length; i++) {
					var our_href = our_as[i].href;
					if (!our_href)
						continue;
					var match = our_href.match(/\/status\/+([0-9]+)(?:\/+(?:retweets|likes)|\/*)(?:[?#].*)?$/);
					if (match) {
						return {
							id: match[1]
						};
					}
				}
				break;
			}
		}
		return null;
	};
	common_functions["get_largest_twimg"] = function(url, options) {
		var fill_obj_filename = function(obj, url) {
			var format = get_queries(url).format;
			if (format) {
				var basename = url.match(/\/([^/.?#]+)(?:\.[^/.]+)?(?:[?#].*)?$/);
				obj.filename = basename[1] + "." + format;
			}
		};
		var use_ext = false;
		if (options && options.rule_specific && options.rule_specific.twitter_use_ext) {
			use_ext = true;
		}
		var obj = {
			url: url,
			can_head: false // 503 sometimes
		};
		var newsrc, match;
		if (string_indexof(obj.url, "/profile_images/") >= 0) {
			newsrc = obj.url
				.replace(/[?#].*$/, "")
				.replace(/_(?:bigger|normal|mini|reasonably_small|[0-9]*x[0-9]+)(\.[^/_]*)$/, "$1");
			if (newsrc !== obj.url) {
				obj.url = newsrc;
				return obj;
			} else {
				return;
			}
		}
		if (string_indexof(obj.url, "/profile_banners/") >= 0) {
			newsrc = obj.url.replace(/\/[0-9]+x[0-9]+(?:[?#].*)?$/, "");
			if (newsrc !== obj.url) {
				obj.url = newsrc;
				return obj;
			} else {
				return;
			}
		}
		fill_obj_filename(obj, obj.url);
		newsrc = obj.url
			.replace(/:([^/?]+)(.*)?$/, "$2?name=$1")
			.replace(/(\?.*)\?name=/, "$1&name=");
		if (newsrc !== obj.url) {
			obj.url = newsrc;
		}
		if (false && !(/\/(?:card|ad|semantic_core)_img\//.test(obj.url))) {
			if (false) {
				newsrc = obj.url
					.replace(/(\/[^/.?]+)\?(.*?&)?format=([^&]*)(.*?$)?/, "$1.$3?$2$4")
					.replace(/\?&/, "?")
					.replace(/[?&]+$/, "");
			}
		}
		if (/:\/\/[^/]+\/+media\//.test(obj.url)) {
			match = obj.url.match(/^([^?#]+\/[^/.?#]+)\.([^/.?#]+)([?#].*)?$/);
			if (match) {
				newsrc = add_queries(match[1] + (match[3] || ""), { format: match[2] });
			}
			newsrc = newsrc.replace(/([?&]format=)webp(&.*)?$/, "$1jpg$2");
			if (newsrc !== obj.url) {
				fill_obj_filename(obj, newsrc);
				obj.url = newsrc;
			}
		}
		match = obj.url.match(/\/tweet_video_thumb\/+([^/.?#]+)\./);
		if (match) {
			return {
				url: obj.url.replace(/\/tweet_video_thumb\/+[^/]+\.[^/.]+(?:[?#].*)?$/, "/tweet_video/" + match[1] + ".mp4"),
				video: true
			};
		}
		var names = ["orig", "4096x4096", "large", "medium"];
		var baseobj = obj;
		var mobj = [];
		var name_match = baseobj.url.match(/[?&]name=([^&]+)/);
		var name = name_match ? name_match[1] : null;
		var end = array_indexof(names, name);
		if (end < 0)
			end = names.length;
		var obj_add = function(x) {
			var newobj = deepcopy(baseobj);
			newobj.url = x;
			fill_obj_filename(newobj, newobj.url);
			mobj.push(newobj);
		};
		var format_to_ext = function(src, format) {
			src = keep_queries(src, ["name"]);
			src = src.replace(/(\/[^/?&#.]+)(?:\.[^/?&#.]+)?(\?.*)?$/, "$1." + format + "$2");
			return src;
		};
		for (var i = 0; i < end; i++) {
			newsrc = baseobj.url
				.replace(/(\.[a-z]+)\?(?:(.*)&)?format=[^&]+/, "$1?$2&")
				.replace(/&$/, "");
			newsrc = add_queries(newsrc, { name: names[i] });
			/*if (false) {
				newsrc = src.replace(/([?&]name=)[^&]+(&.*)?$/, "$1" + names[i] + "$2");
				if (newsrc === src)
					newsrc = src
						.replace(/(\?.*)?$/, "$1?name=" + names[i])
						.replace(/(\?.*)\?name=/, "$1&name=");
			}*/
			var queries = get_queries(newsrc);
			if (queries.format === "png" || queries.format === "jpg") {
				if (use_ext)
					obj_add(format_to_ext(newsrc, "png"));
				obj_add(add_queries(newsrc, { format: "png" }));
				if (use_ext)
					obj_add(format_to_ext(newsrc, "jpg"));
				obj_add(add_queries(newsrc, { format: "jpg" }));
			} else {
				if (use_ext && queries.format)
					obj_add(format_to_ext(newsrc, queries.format));
				obj_add(newsrc);
			}
		}
		obj_add(baseobj.url);
		if (mobj.length > 1)
			return mobj;
	};
	var get_domain_from_url = function(url) {
		return url.replace(/^[a-z]+:\/\/([^/]*)(?:\/+.*)?$/, "$1");
	};
	var get_origin_from_url = get_domain_from_url;
	var get_domain_nosub = function(domain) {
		var domain_nosub = domain.replace(/^.*\.([^.]*\.[^.]*)$/, "$1");
		if (/^(?:(?:com?|org|net|edu)\.[a-z]{2}|(?:ne|or)\.jp)$/.test(domain_nosub)) {
			domain_nosub = domain.replace(/^.*\.([^.]*\.[^.]*\.[^.]*)$/, "$1");
		}
		return domain_nosub;
	};
	var looks_like_valid_link = function(src, el) {
		if (/\.(?:jpe?g|png|web[mp]|gif|mp4|mkv|og[gv]|svg)(?:[?#].*)?$/i.test(src))
			return true;
		if (el && check_highlightimgs_supported_image(el))
			return true;
		return false;
	};
	function bigimage(src, options) {
		if (!src) {
			src = "data:";
		}
		if (!src.match(/^(?:https?|x-raw-image):\/\//) && !src.match(/^(?:data|blob):/))
			return src;
		var origsrc = src;
		src = norm_url(src);
		var protocol;
		var domain;
		var port;
		if (!src.match(/^(?:data|x-raw-image|blob):/)) {
			if (src.length >= 65535)
				return src;
			var protocol_split = src.split("://");
			protocol = protocol_split[0];
			var splitted = protocol_split[1].split("/");
			domain = splitted[0];
			port = domain.replace(/.*:([0-9]+)$/, "$1");
			if (port === domain)
				port = "";
			domain = domain.replace(/(.*):[0-9]+$/, "$1");
		} else {
			protocol = "data";
			domain = "";
			src = ""; // FIXME: this isn't great
		}
		var domain_nowww = domain.replace(/^www\./, "");
		var domain_nosub = get_domain_nosub(domain);
		var amazon_container = null;
		if (string_indexof(domain, ".amazonaws.com") >= 0) {
			if (domain.match(/^s3(?:-website)?(?:\.dualstack)?(?:[-.][-a-z0-9]+)?\.amazonaws\.com/))
				amazon_container = src.replace(/^[a-z]*:\/\/[^/]*\/+([^/]*)\/.*/, "$1");
			else if (domain.match(/[^/]*\.s3(?:-website)?(?:\.dualstack)?(?:[-.][-a-z0-9]+)?\.amazonaws\.com/))
				amazon_container = src.replace(/^[a-z]*:\/\/([^/]*)\.s3(?:-website)?(?:\.dualstack)?(?:[-.][-a-z0-9]+)?\.amazonaws\.com\/.*/, "$1");
		}
		var googleapis_container = null;
		if (string_indexof(domain, ".googleapis.com") >= 0) {
			googleapis_container = src.replace(/^[a-z]*:\/\/[^/]*\/([^/]*)\/.*/, "$1");
		}
		var googlestorage_container = null;
		if (domain_nosub === "googleapis.com" &&
			(domain === "storage.googleapis.com" ||
				domain.match(/\.storage\.googleapis\.com$/) ||
				domain === "commondatastorage.googleapis.com" ||
				domain.match(/\.commondatastorage\.googleapis\.com$/))) {
			if (domain.match(/\.[a-z]+\.googleapis\.com$/)) {
				googlestorage_container = src.replace(/^[a-z]*:\/\/([^/]*)\.[a-z]+\.googleapis\.com\/.*/, "$1");
			} else {
				googlestorage_container = src.replace(/^[a-z]*:\/\/[^/]*\/([^/]*)\/.*/, "$1");
			}
		}
		var digitalocean_container = null;
		if (domain_nosub === "digitaloceanspaces.com") {
			if (/^[a-z]{3}[0-9]+\.(?:cdn\.)?digitaloceanspaces\./.test(domain)) {
				digitalocean_container = src.replace(/^[a-z]*:\/\/[^/]*\/+([^/]*)\/.*/, "$1");
			} else {
				digitalocean_container = domain.replace(/^([^/.]+)\..*/, "$1");
			}
		}
		var host_domain = "";
		var host_domain_nowww = "";
		var host_domain_nosub = "";
		if (options.host_url) {
			host_domain = options.host_url.replace(/^[a-z]+:\/\/([^/]*?)(?::[0-9]+)?(?:\/.*)?$/, "$1");
			host_domain_nowww = host_domain.replace(/^www\./, "");
			host_domain_nosub = host_domain.replace(/^.*\.([^.]*\.[^.]*)$/, "$1");
			if (host_domain_nosub.match(/^co\.[a-z]{2}$/)) {
				host_domain_nosub = host_domain.replace(/^.*\.([^.]*\.[^.]*\.[^.]*)$/, "$1");
			}
		}
		try {
			if (options.document)
				document = options.document;
			if (options.window)
				window = options.window;
		} catch (e) {
		}
		var problem_excluded = function(problem) {
			if (!options.exclude_problems)
				return false;
			if (typeof options.exclude_problems === "string" && options.exclude_problems === problem)
				return true;
			if (!is_array(options.exclude_problems))
				return false;
			return array_indexof(options.exclude_problems, problem) >= 0;
		};
		var api_cache = real_api_cache;
		if (options.use_api_cache === false) {
			api_cache = new IMUCache();
		}
		if (!options.api_cache) {
			options.api_cache = api_cache;
		}
		var api_query = function(key, request, cb, process) {
			return real_api_query(api_cache, options.do_request, key, request, cb, process);
		};
		var website_query = function(_options) {
			_options.do_request = options.do_request;
			_options.api_cache = api_cache;
			if (!_options.cb)
				_options.cb = options.cb;
			if (!_options.url)
				_options.url = src;
			return real_website_query(_options);
		};
		var newsrc, i, id, size, origsize, regex, match;
		if (string_indexof(src, "/g00/") >= 0 && /\.g0[0-9]\./.test(domain)) {
			var str = "";
			for (i = 0; i < src.length; i++) {
				if (src[i] == 'x') {
					var char = parseInt(src[i + 1] + src[i + 2], 16);
					str += string_fromcharcode(char);
					i += 2;
				} else {
					str += src[i];
				}
			}
			str = str.split("/").slice(5).join("/").split("$").slice(1).join("$");
			if (str && string_indexof(str, "://") < 10 && str[1] == str[2]) {
				var diff = mod(str.charCodeAt(0) - 'h'.charCodeAt(0), 26);
				var str1 = "";
				for (i = 0; i < str.length; i++) {
					var code = str.charCodeAt(i);
					if (code > 47 && code < 58) {
						/* number */
						code = (mod((code - 48 - diff), 10) + 48);
					} else if (code > 64 && code < 91) {
						/* uppercase */
						code = (mod((code - 65 - diff), 26) + 65);
					} else if (code > 96 && code < 123) {
						/* lowercase */
						code = (mod((code - 97 - diff), 26) + 97);
					}
					str1 += string_fromcharcode(code);
				}
				var urlparts = str1;
				if (urlparts && string_indexof(urlparts, "http") === 0) {
					var $s = urlparts.replace(/.*?([$/]*)$/, "$1");
					if ($s !== urlparts && $s) {
						var count = $s.split("$").length - 1;
						if (count > 0) {
							var newurl = urlparts.split("/").slice(0, count + 2).join("/");
							newurl = newurl.replace(/[?&]i10c\.mark[^/]*$/, "");
							if (newurl)
								return newurl;
						}
					}
				} else {
					console_log(urlparts);
				}
			}
		}



		// 规则开始
		if ((host_domain_nowww === "google.com" ||
			domain_nowww === "google.com") && /^[a-z]+:\/\/[^/]+\/+recaptcha\//.test(options.host_url)) {
			return {
				url: origsrc,
				bad: "mask"
			};
		}
		if (host_domain === "assets.hcaptcha.com" || domain === "assets.hcaptcha.com" || domain === "imgs.hcaptcha.com") {
			return {
				url: origsrc,
				bad: "mask"
			};
		}
		if (domain_nosub === "sinaimg.cn") {
			if (src.match(/:\/\/[^/]*\/+max(?:width|height)\.[0-9]+\//)) {
				return {
					url: src.replace(/(:\/\/[^/]*\/+)[^/]*\//, "$1original/"),
					can_head: false
				};
			}
			if (domain.match(/^ss/)) {
				src = src.replace(/\.sinaimg\.cn\/+[^/]*\/+([^/]*)\/*$/, ".sinaimg.cn/orignal/$1");
			} else {
				src = src.replace(/\.sinaimg\.cn\/+[^/]*\/+([^/]*)\/*$/, ".sinaimg.cn/large/$1");
			}
			if (domain.match(/^n\./)) {
				newsrc = src.replace(/(\/ent\/+[0-9]+_)img(\/+upload\/)/, "$1ori$2");
				if (newsrc !== src)
					return newsrc;
			}
			newsrc = src.replace(/(\/autoimg\/+serial\/+[0-9]{2}\/+[0-9]{2}\/+[0-9]+)_[0-9]+(\.[^/.]+)(?:[?#].*)?$/, "$1_src$2");
			if (newsrc !== src)
				return newsrc;
			newsrc = src.replace(/\/slidenews\/+([^/_]*)_[^/_]*\//, "/slidenews/$1_img/"); // there's also _ori, but it seems to be smaller?
			if (newsrc !== src)
				return newsrc;
			return {
				url: src,
				headers: {
					Referer: "https://weibo.com/"
				},
				referer_ok: {
					same_domain: true
				}
			};
		}
		if (domain_nosub === "sina.com.cn" && domain.match(/^static[0-9]\.photo\.sina\.com\.cn/)) {
			return src.replace(/:\/\/static([0-9]*)\.photo\.sina\.com\.cn\//, "://ss$1.sinaimg.cn/");
		}
		if (domain === "sinaimg.acgsoso.com") {
			return src.replace(/:\/\/[^/]+\/+/, "://wx4.sinaimg.cn/");
		}
		if (domain === "pbs.twimg.com" ||
			(domain === "ton.twitter.com" && string_indexof(src, "/ton/data/dm/") >= 0)) {
			newsrc = common_functions["get_largest_twimg"](src, options);
			if (newsrc)
				return newsrc;
		}
		if (domain_nowww === "twitter.com") {
			var _query_twitter_webapi = function(url, cookies, cb) {
				if (!cookies || !cookies.ct0) {
					console_warn("Cookies are needed for Twitter API calls", cookies);
					return cb(null);
				}
				var headers = {
					Accept: "*/*",
					Authorization: base64_decode("YWJjZEJlYXJlciBBQUFBQUFBQUFBQUFBQUFBQUFBQUFOUklMZ0FBQUFBQW5Od0l6VWVqUkNPdUg1RTZJOHhuWno0cHVUcyUzRDFadjd0dGZrOExGODFJVXExNmNIamhMVHZKdTRGQTMzQUdXV2pDcFRuQQ==").substr(4),
					Referer: "https://twitter.com/",
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-origin",
					"x-csrf-token": cookies.ct0,
					"x-twitter-client-language": cookies.lang || "en",
					"x-twitter-active-user": "yes"
				};
				if (cookies.twid) { // don't use auth_token, it doesn't exist on non-httponly-side
					headers["x-twitter-auth-type"] = "OAuth2Session";
				} else {
					if (cookies.gt) {
						headers["x-guest-token"] = cookies.gt;
					} else {
						console_warn("Guest token not found");
						return cb(null);
					}
				}
				api_query("twitter_api:" + url, {
					url: url,
					method: "GET",
					imu_mode: "xhr",
					headers: headers,
					json: true
				}, cb, function(done, resp, cache_key) {
					done(resp, 60 * 60);
				});
			};
			var query_twitter_webapi = function(url, cb) {
				if (options.get_cookies) {
					options.get_cookies("https://www.twitter.com/", function(cookies) {
						if (cookies)
							cookies = headers_list_to_dict(cookies);
						_query_twitter_webapi(url, cookies, cb);
					});
				} else {
					_query_twitter_webapi(url, null, cb);
				}
			};
			var query_tweet = function(tweet_id, cb) {
				var url = "https://twitter.com/i/api/2/timeline/conversation/" + tweet_id + ".json";
				var queries = {
					include_profile_interstitial_type: "1",
					include_blocking: "1",
					include_blocked_by: "1",
					include_followed_by: "1",
					include_want_retweets: "1",
					include_mute_edge: "1",
					include_can_dm: "1",
					include_can_media_tag: "1",
					skip_status: "1",
					cards_platform: "Web-12",
					include_cards: "1",
					include_ext_alt_text: "true",
					include_quote_count: "true",
					include_reply_count: "1",
					tweet_mode: "extended",
					include_entities: "true",
					include_user_entities: "true",
					include_ext_media_color: "true",
					include_ext_media_availability: "true",
					send_error_codes: "true",
					simple_quoted_tweet: "true",
					count: "20",
					include_ext_has_birdwatch_notes: "false",
					ext: "mediaStats%2ChighlightedLabel"
				};
				url = add_queries(url, queries);
				query_twitter_webapi(url, function(data) {
					if (!data)
						return cb(null);
					try {
						var tweet_data = data.globalObjects.tweets[tweet_id];
						data.globalObjects.tweet = tweet_data;
						cb(data.globalObjects);
					} catch (e) {
						console_error(e, data);
						cb(null);
					}
				});
			};
			var get_baseobj_from_tweet = function(tweet, users) {
				var obj = {
					can_head: false,
					extra: {}
				};
				if (tweet.created_at) {
					obj.extra.created_date = new Date(tweet.created_at).getTime();
				}
				if (users && tweet.id_str && tweet.user_id_str) {
					var username = users[tweet.user_id_str].screen_name;
					obj.extra.author_username = username;
					obj.extra.page = "https://twitter.com/" + username + "/status/" + tweet.id_str;
				}
				if (tweet.full_text) {
					obj.extra.caption = tweet.full_text;
				}
				return obj;
			};
			var get_single_media_obj = function(media) {
				var urls = [];
				if (array_indexof(["photo", "animated_gif", "video"], media.type) < 0) {
					console_warn("Unknown media type", media);
					return null;
				}
				if (media.video_info && media.video_info.variants) {
					var added_mimes = new_set();
					media.video_info.variants.sort(function(a, b) {
						if (a.content_type === "application/x-mpegURL")
							return -1;
						if (b.content_type === "application/x-mpegURL")
							return 1;
						if (a.bitrate && b.bitrate)
							return b.bitrate - a.bitrate;
						return 0;
					});
					array_foreach(media.video_info.variants, function(variant) {
						if (set_has(added_mimes, variant.content_type))
							return;
						set_add(added_mimes, variant.content_type);
						var unshift = false;
						var video = true;
						if (variant.content_type === "video/mp4") {
							video = true;
						} else if (variant.content_type === "application/x-mpegURL") {
							video = "hls";
							unshift = true;
						} else {
							console_warn("Unknown content type", variant, media);
							return;
						}
						var obj = {
							url: variant.url,
							video: video
						};
						urls.push(obj);
					});
				}
				var media_url = media.media_url_https;
				if (false && media.type === "photo") {
					var largest_size = null;
					var largest_size_br = 0;
					obj_foreach(media.sizes, function(key, size) {
						var our_br = size.w * size.h;
						if (our_br > largest_size_br) {
							largest_size = key;
							largest_size_br = our_br;
						}
					});
					if (largest_size) {
						media_url += "?name=" + largest_size;
					}
					if (largest_size !== "orig") {
						urls.push(media_url.replace(/\?.*$/, "?name=orig"));
					}
				}
				var larger_media = common_functions["get_largest_twimg"](media_url, options);
				if (larger_media) {
					array_extend(urls, larger_media);
				} else {
					urls.push(media_url);
				}
				return urls;
			};
			newsrc = website_query({
				website_regex: [
					/^[a-z]+:\/\/[^/]+\/+[^/]+\/+status\/+([0-9]+)(?:\/.*)?(?:[?#].*)?$/,
					/^[a-z]+:\/\/[^/]+\/+i\/+web\/+status\/+([0-9]+)(?:[?#].*)?$/
				],
				run: function(cb, match) {
					var id = match[1];
					query_tweet(id, function(data) {
						if (!data) {
							return cb(null);
						}
						var tweet = data.tweet;
						var obj = get_baseobj_from_tweet(tweet, data.users);
						var media_id = 0;
						var media_id_match = src.match(/#imu-media-id=([0-9]+)$/);
						if (media_id_match)
							media_id = media_id_match[1];
						var imu_url_id = null;
						var imu_url_match = src.match(/#imu-url=(.*)$/);
						if (imu_url_match) {
							var imu_url = imu_url_match[1];
							imu_url_match = imu_url.match(/.*\/([^/.?#]+)(?:\.[^/]+)?(?:[?#].*)?$/);
							if (imu_url_match) {
								imu_url_id = imu_url_match[1];
							}
						}
						var medias = [];
						var currenturls = [];
						var album_links = [];
						if (tweet.extended_entities && tweet.extended_entities.media) {
							array_foreach(tweet.extended_entities.media, function(media, i) {
								var singleobj = get_single_media_obj(media);
								if (!singleobj)
									return;
								var is_current = i == media_id;
								if (imu_url_id) {
									array_foreach(singleobj, function(ourobj) {
										var url = ourobj.url || ourobj;
										var our_id = url.match(/.*\/([^/.?#]+)(?:\.[^/]+)?(?:[?#].*)?$/)[1];
										is_current = our_id === imu_url_id;
										if (is_current)
											return;
									});
								}
								album_links.push({
									url: obj.extra.page + "#imu-media-id=" + i,
									is_current: is_current
								});
								medias[i] = singleobj;
								if (is_current)
									currenturls = singleobj;
							});
							if (album_links.length > 1) {
								obj.album_info = {
									type: "links",
									links: album_links
								};
							}
						}
						if (tweet.card && !currenturls.length) {
							var card = tweet.card;
							var card_url = card.url;
							var card_image = null;
							if (card.binding_values) {
								if (card.binding_values.player_url) {
									card_url = card.binding_values.player_url.string_value;
								}
								if (card.binding_values.player_image) {
									card_image = card.binding_values.player_image.image_value.url;
								}
							}
							currenturls.push({
								url: card_url,
								is_pagelink: true
							});
							if (card_image)
								currenturls.push(card_image);
						}
						if (tweet.quoted_status_permalink && !currenturls.length) {
							return cb({
								url: tweet.quoted_status_permalink.expanded,
								is_pagelink: true
							});
						}
						return cb(fillobj_urls(currenturls, obj));
					});
				}
			});
			if (newsrc)
				return newsrc;
		}
		if (host_domain_nowww === "twitter.com" && options.element) {
			var tweet_link = common_functions["get_twitter_tweet_link"](options.element);
			page_nullobj = null;
			if (tweet_link) {
				page_nullobj = {
					url: tweet_link,
					is_pagelink: true
				};
				if (src) {
					page_nullobj.url += "#imu-url=" + src;
				} else {
					return page_nullobj;
				}
			}
			var caption = common_functions["get_twitter_caption"](options.element);
			if (caption) {
				var newobj = {
					url: src,
					extra: {
						caption: caption
					}
				};
				if (page_nullobj) {
					return [page_nullobj, newobj];
				} else {
					return newobj;
				}
			} else if (page_nullobj) {
				return page_nullobj;
			}
		}
		if (domain === "files.yande.re") {
			return add_extensions(src
				.replace(/\/(?:sample|jpeg)\/+([0-9a-f]+\/)/, "/image/$1"));
		}
		if (domain === "assets.yande.re") {
			return add_extensions(src.replace(/:\/\/assets.yande.re\/data\/preview\/[0-9a-f]+\/[0-9a-f]+\//, "://files.yande.re/image/"));
		}
		if (domain_nowww === "redditstatic.com") {
			if (/^[a-z]+:\/\/[^/]+\/+(?:sprite|sidebar|icon)[-_][^/]+\./.test(src))
				return {
					url: src,
					bad: "mask"
				};
			return src.replace(/(\/gold\/+awards\/+icon\/+[^/]+)_[1-4]?[0-9]{2}\./, "$1_512.");
		}
		if (domain === "preview.redd.it") {
			return src.replace(/:\/\/preview\.redd\.it\/(award_images\/+t[0-9]*_[0-9a-z]+\/+)?(?:[-0-9a-z]+-)?([^/.]*\.[^/.?]*)\?.*$/, "://i.redd.it/$1$2");
		}
		if (domain === "i.redd.it" && src.match(/^[a-z]+:\/\/[^/]*\/[0-9a-z]+\.[^-/._?#]*$/)) {
			return {
				url: src,
				is_original: true
			};
		}
		if (domain === "i.reddituploads.com") {
			newsrc = src.replace(/(:\/\/[^/]*\/[0-9a-f]+)\?.*$/, "$1");
			if (newsrc !== src)
				return newsrc;
		}
		if (host_domain_nosub === "reddit.com" && options.element) {
			if (src === "" && options.element.tagName === "A" && options.element.classList.contains("image")) {
				return {
					url: origsrc,
					bad: "mask"
				};
			}
		}
		if (domain_nosub === "redditmedia.com" && options.element) {
			if (options.element.tagName === "DIV") {
				if (options.element.classList.contains("arrow")) {
					return {
						url: origsrc,
						bad: "mask"
					};
				}
			}
		}
		if (domain === "v.redd.it") {
			newsrc = website_query({
				website_regex: /^[a-z]+:\/\/[^/]+\/+([a-z0-9]+)(?:[?#].*)?$/,
				query_for_id: {
					url: "https://v.redd.it/${id}",
					method: "HEAD"
				},
				process: function(done, resp, cache_key) {
					return done({
						url: resp.finalUrl,
						is_pagelink: true
					}, 6 * 60 * 60);
				}
			});
			if (newsrc)
				return newsrc;
		}
		if (domain_nosub === "reddit.com" || domain_nowww === "redd.it") {
			var request_reddit_api = function(id, cb) {
				api_query("reddit_api:" + id, {
					url: "https://www.reddit.com/api/info.json?id=" + id,
					headers: {
						"User-Agent": ""
					},
					json: true
				}, cb, function(done, resp, cache_key) {
					console_log(resp);
					var item = resp.data.children[0].data;
					if (_nir_debug_) {
						console_log(id, item);
					}
					done(item, 60 * 60);
				});
			};
			var request_reddit = function(id, cb) {
				request_reddit_api(id, function(item) {
					if (!item) {
						return cb(null);
					}
					if (item.crosspost_parent) {
						return request_reddit(item.crosspost_parent, cb);
					}
					var urls = [];
					var obj = {
						extra: {}
					};
					if (item.permalink) {
						obj.extra.page = urljoin("https://www.reddit.com/", item.permalink, true);
					}
					if (item.title) {
						obj.extra.caption = item.title;
					}
					var is_selfpost = item.domain && /^self\./.test(item.domain) && item.url && /^[a-z]+:\/\/[^/]*reddit\.com\/r\//.test(item.url);
					if (!is_selfpost && item.preview && item.preview.images) {
						var preview_image;
						if (item.preview.images[0].variants.gif)
							preview_image = item.preview.images[0].variants.gif.source.url;
						else
							preview_image = item.preview.images[0].source.url;
						preview_image = preview_image.replace(/&amp;/g, "&");
						urls.push(preview_image);
					}
					if (item.secure_media && item.secure_media.reddit_video) {
						var rv = item.secure_media.reddit_video;
						if (rv.fallback_url) {
							urls.unshift({
								url: rv.fallback_url,
								video: true
							});
						}
						if (rv.hls_url) {
							urls.unshift({
								url: rv.hls_url,
								video: "hls"
							});
						}
						if (rv.dash_url) {
							urls.unshift({
								url: rv.dash_url,
								video: "dash"
							});
						}
					}
					if (item.gallery_data && item.gallery_data.items) {
						var first_url = null;
						var album_links = [];
						array_foreach(item.gallery_data.items, function(item) {
							var url = "https://i.redd.it/" + item.media_id + ".jpg";
							if (!first_url)
								first_url = url;
							album_links.push({
								url: url,
								is_current: first_url === url
							});
						});
						if (first_url) {
							urls.unshift({
								url: first_url,
								album_info: {
									type: "links",
									links: album_links
								}
							});
						}
					}
					if (!/^[a-z]+:\/\/(?:[^/]*\.)?reddit\.com\/+gallery\//.test(item.url) &&
						looks_like_valid_link(item.url, item.url)) {
						urls.unshift(item.url);
					}
					return cb(fillobj_urls(urls, obj));
				});
			};
			newsrc = website_query({
				website_regex: /^[a-z]+:\/\/[^/]+\/+(?:(?:(?:r|u(?:ser)?)\/+[^/]+\/+comments|gallery)\/+)?([a-z0-9]+)(?:\/+.*)?(?:[?#].*)?$/,
				run: function(cb, match) {
					var id = match[1];
					request_reddit("t3_" + id, function(data) {
						cb(data);
					});
				}
			});
			if (newsrc)
				return newsrc;
		}
		if ((domain_nosub === "redditmedia.com" ||
			domain_nosub === "redd.it" ||
			(domain_nosub === "reddit.com" && /:\/\/[^/]+\/+[ru]\/+/.test(src)) ||
			string_indexof(origsrc, "blob:") === 0) &&
			host_domain_nosub === "reddit.com" && options.element) {
			var get_reddit_link = function(id) {
				id = id.replace(/^t[0-9]+_/, "");
				return {
					url: "https://redd.it/" + id,
					is_pagelink: true
				};
			};
			var current = options.element;
			do {
				if (current.tagName === "DIV") {
					var testid = current.getAttribute("data-testid") || current.getAttribute("data-fullname") || current.getAttribute("id");
					if (testid && testid === "post-container") {
						testid = current.getAttribute("id");
					}
					if (testid) {
						match = testid.match(/^t3_([a-z0-9]{2,8})$/);
						if (match) {
							return get_reddit_link(match[1]);
						}
					}
				}
			} while (current = current.parentElement);
		}
		if (domain_nowww === "mingtuiw.com" && /\/wp-content\/+uploads\//.test(src)) {
			return src.replace(/-[0-9]+x[0-9]+(?:@[0-9]+x)?(\.[^/.]+(?:[?#].*)?)$/, "$1");
		}
		if (domain === "i.pximg.net" ||
			domain === "pixiv.pximg.net" ||
			domain === "i.pixiv.re" ||
			(domain_nosub === "techorus-cdn.com" && /^tc-pximg[0-9]*\./.test(domain))) {
			newsrc = src
				.replace(/(\/user-profile\/+img\/.*\/[0-9]+_[0-9a-f]{20,})_[0-9]+(\.[^/.]+)(?:[?#].*)?$/, "$1$2")
				.replace(/\/c\/[0-9]+x[0-9]+(?:_[0-9]+)?(?:_[ag][0-9]+)*\//, "/")
				.replace(/\/(?:img-master|custom-thumb)\//, "/img-original/")
				.replace(/(\/[0-9]+_p[0-9]+)_[^/]*(\.[^/.]*)$/, "$1$2");
			var referer_url = "https://www.pixiv.net/";
			if (domain === "pixiv.pximg.net" || domain_nosub === "pixiv.re") {
				referer_url = null;
			}
			match = src.match(/\/([0-9]+)_p([0-9]+)(?:_[^/.]+)?\.[^/.]+$/);
			if (!match) {
				id = null;
			} else {
				id = match[1];
				referer_url = "https://www.pixiv.net/artworks/" + id;
			}
			obj = {};
			if (referer_url && domain_nosub !== "pixiv.re") {
				obj.headers = {
					Referer: referer_url
				};
			}
			if (id) {
				obj.extra = {
					page: referer_url
				};
			}
			var urls = [src];
			if (newsrc !== src) {
				urls = add_extensions(newsrc);
			}
			var retobj = fillobj_urls(urls, obj);
			if (id && options && options.force_page && options.cb && options.do_request) {
				retobj.unshift({
					url: referer_url + "#imu-page=" + match[2],
					is_pagelink: true
				});
			}
			return retobj;
		}
		if (domain_nowww === "pixiv.net") {
			var query_pixiv_page = function(id, page, cb) {
				var url = "https://www.pixiv.net/artworks/" + id;
				api_query("pixiv_page:" + id, {
					url: url
				}, function(obj) {
					if (!obj)
						return cb(null);
					if (obj[0].album_info) {
						var links = obj[0].album_info.links;
						for (var i = 0; i < links.length; i++) {
							if (i != page) {
								links[i].is_current = false;
								continue;
							}
							links[i].is_current = true;
							obj[0].url = links[i].url;
						}
					}
					return cb(obj);
				}, function(done, resp, cache_key) {
					var match = resp.responseText.match(/<meta\s+name=\"preload-data\"\s+id=\"meta-preload-data\"\s+content='(.*?)'>/);
					if (!match) {
						console_error(cache_key, "Unable to find match", resp);
						return done(null, false);
					}
					var json = JSON_parse(decode_entities(match[1]));
					var illust = json.illust[id];
					var obj = {
						extra: {
							page: resp.finalUrl
						},
						headers: {
							Referer: resp.finalUrl
						}
					};
					if (illust.illustTitle) {
						obj.extra.caption = illust.illustTitle;
					}
					var urls = [];
					var urltypes = ["original", "regular", "small", "thumb", "mini"];
					var unsorted_urls = [];
					for (var type in illust.urls) {
						unsorted_urls.push({
							type: type,
							url: illust.urls[type]
						});
					}
					unsorted_urls.sort(function(a, b) {
						var a_index = array_indexof(urltypes, a.type);
						var b_index = array_indexof(urltypes, b.type);
						if (a_index < 0)
							return 1;
						if (b_index < 0)
							return -1;
						return a_index - b_index;
					});
					for (var i = 0; i < unsorted_urls.length; i++) {
						if (array_indexof(urltypes, unsorted_urls[i].type) >= 0)
							urls.push(unsorted_urls[i].url);
					}
					if (urls.length === 0) {
						console_error(cache_key, "Unable to find valid urls from", json, illust);
						return done(null, false);
					}
					var url = urls[0];
					if (illust.pageCount && illust.pageCount > 1) {
						obj.album_info = {
							type: "links",
							links: []
						};
						for (var i = 0; i < illust.pageCount; i++) {
							obj.album_info.links.push({
								url: url.replace(/(_p)[0-9]+(_[^/.]+)?(\.[^/.]+)$/, "$1" + i + "$2$3")
							});
						}
					}
					return done(fillobj_urls([urls[0]], obj), 60 * 60);
				});
			};
			newsrc = website_query({
				website_regex: [
					/^[a-z]+:\/\/[^/]+\/+(?:[^/]+\/+)?artworks\/+([0-9]+)\/*(?:[?#].*)?$/,
					/^[a-z]+:\/\/[^/]+\/+member_illust\.php\?(?:.*&)?illust_id=([0-9]+)/
				],
				run: function(cb, match, website_options) {
					var page = 0;
					var pagematch = website_options.url.match(/#imu-page=([0-9]+)/);
					if (pagematch)
						page = pagematch[1];
					query_pixiv_page(match[1], page, cb);
				}
			});
			if (newsrc)
				return newsrc;
		}
		if (domain_nosub === "booth.pm" && domain.match(/s[0-9]*\.booth\.pm/) ||
			domain === "booth.pximg.net") {
			newsrc = src
				.replace(/\/c\/[a-z]_[0-9]+\//, "/")
				.replace(/_c_[0-9]+x[0-9]+(\.[^/.]*)$/, "$1");
			if (newsrc !== src) {
				return add_full_extensions(newsrc);
			}
			newsrc = src.replace(/(:\/\/[^/]*\/)c\/[0-9]+x[0-9]+(?:_[^/]*)?\//, "$1");
			if (newsrc !== src)
				return add_full_extensions(newsrc);
			newsrc = src.replace(/(\/[-0-9a-f]+)_[^/.]*(\.[^/.]*)$/, "$1$2");
			if (newsrc !== src)
				return add_full_extensions(newsrc);
		}
		// 规则结束
		if (options.null_if_no_change) {
			if (src !== origsrc)
				return src;
			return null;
		}
		return src;
	}
	var get_helpers = function(options) {
		var host_domain = "";
		var host_domain_nowww = "";
		var host_domain_nosub = "";
		if (options.host_url) {
			host_domain = options.host_url.replace(/^[a-z]+:\/\/([^/]*)(?:\/.*)?$/, "$1");
			host_domain_nowww = host_domain.replace(/^www\./, "");
			host_domain_nosub = host_domain.replace(/^.*\.([^.]*\.[^.]*)$/, "$1");
			if (host_domain_nosub.match(/^co\.[a-z]{2}$/)) {
				host_domain_nosub = host_domain.replace(/^.*\.([^.]*\.[^.]*\.[^.]*)$/, "$1");
			}
		}
		try {
			if (options.document)
				document = options.document;
			if (options.window)
				window = options.window;
		} catch (e) {
		}
		var new_image = function(src) {
			var img = document_createElement("img");
			img.src = src;
			return img;
		};
		var new_video = function(src) {
			var video = document_createElement("video");
			video.src = src;
			return video;
		};
		var new_media = function(src, is_video) {
			if (is_video)
				return new_video(src);
			else
				return new_image(src);
		};
		var get_nextprev_el = function(el, nextprev) {
			if (nextprev) {
				return el.nextElementSibling;
			} else {
				return el.previousElementSibling;
			}
		};
		var get_nextprev_from_list = function(el, list, nextprev) {
			var el_src = get_img_src(el);
			var index = -1;
			for (var i = 0; i < list.length; i++) {
				if (typeof list[i] === "string") {
					if (el_src === list[i]) {
						index = i;
						break;
					}
				} else {
					if (el === list[i]) {
						index = i;
						break;
					}
				}
			}
			if (index === -1)
				return null;
			if (nextprev) {
				if ((index + 1) >= list.length)
					return null;
				else
					return list[index + 1];
			} else {
				if ((index - 1) < 0)
					return null;
				else
					return list[index - 1];
			}
		};
		var get_nextprev_from_tree = function(el, nextprev, tree, selector) {
			var current = el;
			for (var i = 0; i < tree.length; i++) {
				if (tree[i].tagName !== current.tagName)
					return "default";
				if (tree[i].classList) {
					for (var _i = 0, _a = tree[i].classList; _i < _a.length; _i++) {
						var cls = _a[_i];
						if (!current.classList.contains(cls)) {
							return "default";
						}
					}
				}
				current = current.parentElement;
			}
			var items = current.querySelectorAll(selector);
			return get_nextprev_from_list(el, items, nextprev);
		};
		var get_nextprev_from_thumbs = function(el, nextprev, options) {
			if (!options.compare_els) {
				if (!options.compare_urls) {
					if (options.id_for_url) {
						if (typeof options.id_for_url !== "function") {
							var id_for_url = options.id_for_url;
							options.id_for_url = function(x) {
								var match = x.match(id_for_url);
								if (!match)
									return null;
								return match[1];
							};
						}
						options.compare_urls = function(a, b) {
							if (!a || !b)
								return false;
							return options.id_for_url(a) === options.id_for_url(b);
						};
					}
				}
				if (!options.get_img_src) {
					options.get_img_src = get_img_src;
				}
				if (options.compare_urls) {
					options.compare_els = function(a, b) {
						if (!a || !b)
							return false;
						return options.compare_urls(options.get_img_src(a), options.get_img_src(b));
					};
				}
			}
			if (!options.compare_els) {
				console_error("compare_els/compare_urls/id_for_url not present");
				return false;
			}
			var thumbs_el = null;
			if (!options.thumbs_selector_global) {
				var current = el;
				while (current = current.parentElement) {
					thumbs_el = current.querySelector(options.thumbs_selector);
					if (thumbs_el)
						break;
				}
			} else {
				thumbs_el = document.querySelector(options.thumbs_selector);
			}
			if (!thumbs_el) {
				console_error("Unable to find thumbs element for", el);
				return false;
			}
			var thumbs = thumbs_el.querySelectorAll(options.thumb_selector);
			if (!thumbs) {
				console_error("No thumbs for", thumbs_el);
				return false;
			}
			var thumb = null;
			array_foreach(thumbs, function(thumb_el) {
				if (options.compare_els(el, thumb_el)) {
					thumb = thumb_el;
					return false;
				}
			});
			if (!thumb) {
				console_error("Unable to find thumb for", el, "in", thumbs_el);
				return false;
			}
			return get_next_in_gallery(thumb, nextprev);
		};
		if (host_domain_nowww === "twitter.com") {
			return {
				gallery: function(el, nextprev) {
					var is_photo_a = function(el) {
						return el.tagName === "A" && el.href && /\/status\/+[0-9]+\/+photo\/+/.test(el.href);
					};
					var get_img_from_photo_a = function(el) {
						var imgel = el.querySelector("img");
						if (imgel) {
							var prev = imgel.previousElementSibling;
							if (prev && prev.tagName === "DIV" && prev.style.backgroundImage)
								return prev;
						}
						return imgel;
					};
					var get_nextprev = function(el) {
						if (nextprev) {
							return el.nextElementSibling;
						} else {
							return el.previousElementSibling;
						}
					};
					var get_photoel_from_photo_container = function(nextel) {
						if (nextel.tagName === "A") {
							return get_img_from_photo_a(nextel);
						} else if (nextel.tagName === "DIV") {
							var childid = nextprev ? 0 : (nextel.children.length - 1);
							if (nextel.children.length > 0 && is_photo_a(nextel.children[childid])) {
								return get_img_from_photo_a(nextel.children[childid]);
							}
						} else {
							return "default";
						}
					};
					var current = el;
					while ((current = current.parentElement)) {
						if (is_photo_a(current)) {
							var nextel = get_nextprev(current);
							if (nextel) {
								return get_photoel_from_photo_container(nextel);
							} else {
								var parent = current.parentElement;
								var sibling = get_nextprev(parent);
								if (sibling) {
									return get_photoel_from_photo_container(sibling);
								}
							}
							return null;
						}
					}
					return "default";
				},
				element_ok: function(el) {
					if (el.tagName === "VIDEO") {
						var tweet = common_functions["get_twitter_tweet_link"](el);
						if (tweet) {
							return true;
						}
					}
					return "default";
				}
			};
		}
		return null;
	};
	var _get_album_info_gallery = function(album_info, el, nextprev) {
		if (album_info.type === "links") {
			var current_link_id = -1;
			array_foreach(album_info.links, function(link, i) {
				if (link.is_current) {
					current_link_id = i;
					return false;
				}
			});
			if (current_link_id < 0)
				return null;
			for (var i = 0; i < album_info.links.length; i++) {
				delete album_info.links[i].is_current;
			}
			current_link_id += nextprev ? 1 : -1;
			if (current_link_id < 0 || current_link_id >= album_info.links.length)
				return false; // or null if we want to be able to move past the current gallery
			album_info.links[current_link_id].is_current = true;
			return album_info.links[current_link_id].url;
		}
		return null;
	};
	var get_album_info_gallery = function(popup_obj, el, nextprev) {
		var album_info;
		if (popup_obj)
			album_info = popup_obj.album_info;
		if (el) {
			var album_info_json = el.getAttribute("imu-album-info");
			if (album_info_json) {
				try {
					album_info = JSON_parse(album_info_json);
				} catch (e) {
					console_error(e);
				}
			}
		}
		if (!album_info)
			return null;
		album_info = deepcopy(album_info);
		var result = _get_album_info_gallery(album_info, el, nextprev);
		if (!result)
			return result;
		if (typeof result === "string") {
			var url = result;
			result = document_createElement("img");
			result.setAttribute("data-imu-fake-src", url);
		}
		if (!result.hasAttribute("imu-album-info")) {
			result.setAttribute("imu-album-info", JSON_stringify(album_info));
		}
		return result;
	};
	var get_next_in_gallery = null;
	var fullurl_obj = function(currenturl, obj) {
		if (!obj)
			return obj;
		if (!is_array(obj)) {
			obj = [obj];
		}
		var newobj = [];
		array_foreach(obj, function(url) {
			if (typeof (url) === "string") {
				newobj.push(fullurl(currenturl, url));
			} else {
				if (url.url) {
					if (is_array(url.url)) {
						for (var i = 0; i < url.url.length; i++) {
							url.url[i] = fullurl(currenturl, url.url[i]);
						}
					} else {
						url.url = fullurl(currenturl, url.url);
					}
				}
				newobj.push(url);
			}
		});
		return newobj;
	};
	var same_url = function(url, obj) {
		obj = fillobj(obj);
		if (obj[0] && obj[0].url === url)
			return true;
		return false;
	};
	var get_bigimage_extoptions_first = function(options) {
		var our_settings = [
			"allow_thirdparty",
			"allow_apicalls",
			"allow_thirdparty_libs",
			"allow_thirdparty_code",
			{
				our: "process_format",
				settings: "process_format",
				obj: true
			}
		];
		for (var i = 0; i < our_settings.length; i++) {
			var our_setting_obj = our_settings[i];
			var our_setting;
			var settings_setting;
			var is_obj = false;
			if (typeof our_setting_obj === "string") {
				our_setting = our_setting_obj;
				settings_setting = our_setting;
			} else {
				our_setting = our_setting_obj.our;
				settings_setting = our_setting_obj.settings;
				is_obj = !!our_setting_obj.obj;
			}
			if (!is_obj) {
				if (!(our_setting in options)) {
					options[our_setting] = (settings[settings_setting] + "") === "true";
				}
			} else {
				if (!(our_setting in options)) {
					options[our_setting] = {};
				}
				obj_foreach(settings[settings_setting], function(key, value) {
					if (!(key in options[our_setting])) {
						options[our_setting][key] = value;
					}
				});
			}
		}
		return options;
	};
	var get_bigimage_extoptions = function(options) {
		if ("exclude_problems" in options) {
			for (var option in settings) {
				if (option in option_to_problems) {
					var problem = option_to_problems[option];
					var index = array_indexof(options.exclude_problems, problem);
					if (settings[option]) {
						if (index >= 0)
							options.exclude_problems.splice(index, 1);
					} else {
						if (index < 0)
							options.exclude_problems.push(problem);
					}
				}
			}
		}
		if (!options.allow_apicalls) {
			options.do_request = null;
		}
		if ("rule_specific" in options) {
			var rule_specific_map = {
				"deviantart_prefer_size": true,
				"deviantart_support_download": true,
				"ehentai_full_image": true,
				"imgur_filename": true,
				"imgur_source": true,
				"instagram_use_app_api": true,
				"instagram_dont_use_web": true,
				"instagram_prefer_video_quality": true,
				"instagram_gallery_postlink": true,
				"snapchat_orig_media": true,
				teddit_redirect_reddit: true,
				"tiktok_no_watermarks": true,
				"tiktok_thirdparty": true,
				"tumblr_api_key": true,
				"twitter_use_ext": true,
				"mouseover_linked_image": "linked_image"
			};
			for (var rule_specific in rule_specific_map) {
				var rule_specific_value = rule_specific_map[rule_specific];
				if (rule_specific_value === true) {
					rule_specific_value = rule_specific;
				}
				options.rule_specific[rule_specific_value] = settings[rule_specific];
			}
		}
		if (false && !settings.allow_video) {
			options.exclude_videos = true;
		} else {
			options.exclude_videos = false;
		}
		return options;
	};
	var bigimage_recursive = function(url, options) {
		if (false && !url)
			return url;
		if (!options)
			options = {};
		if (is_userscript || is_extension) {
			get_bigimage_extoptions_first(options);
		}
		for (var option in bigimage_recursive.default_options) {
			if (!(option in options)) {
				options[option] = deepcopy(bigimage_recursive.default_options[option]);
				continue;
			}
			if (is_iterable_object(options[option])) {
				for (var rsoption in bigimage_recursive.default_options[option]) {
					if (!(rsoption in options[option])) {
						options[option][rsoption] = deepcopy(bigimage_recursive.default_options[option][rsoption]);
					}
				}
			}
		}
		if (is_userscript || is_extension) {
			get_bigimage_extoptions(options);
		}
		var waiting = false;
		var forcerecurse = false;
		var url_is_data = false;
		var origurl = url;
		if (typeof url === "string" && /^(?:data|blob):/.test(url)) {
			url_is_data = true;
		}
		var newhref = url;
		var endhref;
		var currenthref = url;
		var pasthrefs = [url];
		var pastobjs = [];
		var currentobj = null;
		var used_cache = false;
		var loop_i = 0;
		var our_bigimage = options._internal_bigimage || bigimage;
		var do_cache = function() {
			nir_debug("bigimage_recursive", "do_cache (endhref, currentobj):", deepcopy(endhref), deepcopy(currentobj));
			if (!endhref)
				return;
			if (!get_currenthref(endhref))
				return;
			var cache_endhref = fillobj(endhref, currentobj);
			if (!cache_endhref || !cache_endhref.can_cache) {
				nir_debug("bigimage_recursive", "do_cache: skipping cache because cache_endhref.can_cache == false");
				return;
			}
			currenthref = get_currenthref(cache_endhref);
			if (!currenthref)
				return;
			if (!used_cache && (options.use_cache === true) && !waiting) {
				for (var i = 0; i < pasthrefs.length; i++) {
					var href = pasthrefs[i];
					if (href) {
						nir_debug("bigimage_recursive", "do_cache:", href, "=", deepcopy(cache_endhref));
						url_cache.set(href, deepcopy(cache_endhref), options.urlcache_time);
					}
				}
			}
		};
		var get_currenthref = function(objified) {
			if (!objified) {
				return objified;
			}
			if (is_array(objified)) {
				objified = objified[0];
			}
			if (!objified) {
				return objified;
			}
			if (is_array(objified.url))
				currenthref = objified.url[0];
			else
				currenthref = objified.url;
			return currenthref;
		};
		var prop_in_objified = function(prop, objified) {
			if (!is_array(objified)) {
				objified = [objified];
			}
			var found_prop = false;
			array_foreach(objified, function(obj) {
				if (typeof obj !== "object")
					return;
				if (prop in obj) {
					found_prop = true;
					return false;
				}
			});
			return found_prop;
		};
		var parse_bigimage = function(big) {
			nir_debug("bigimage_recursive", "parse_bigimage (big)", deepcopy(big));
			if (!big) {
				if (newhref === url && options.null_if_no_change)
					newhref = big;
				return false;
			}
			var newhref1 = fullurl_obj(currenthref, big);
			nir_debug("bigimage_recursive", "parse_bigimage (newhref1)", deepcopy(newhref1));
			if (!newhref1) {
				return false;
			}
			var copy_props = ["extra", "album_info"];
			var important_properties = {};
			if (pastobjs.length > 0) {
				if (pastobjs[0].likely_broken)
					important_properties.likely_broken = pastobjs[0].likely_broken;
				if (pastobjs[0].fake)
					important_properties.fake = pastobjs[0].fake;
				array_foreach(copy_props, function(prop) {
					if (prop in pastobjs[0]) {
						important_properties[prop] = deepcopy(pastobjs[0][prop]);
					}
				});
			}
			var objified = fillobj(deepcopy(newhref1), important_properties);
			nir_debug("bigimage_recursive", "parse_bigimage (objified)", deepcopy(objified));
			for (var i = 0; i < objified.length; i++) {
				var obj = objified[i];
				var remove_obj = function() {
					objified.splice(i, 1);
					if (is_array(newhref1)) {
						newhref1.splice(i, 1);
					}
					i--;
				};
				if (obj.url === null && !obj.waiting) {
					remove_obj();
					continue;
				}
				if (obj.url === "" && url_is_data) {
					obj.url = origurl;
				}
				for (var problem in obj.problems) {
					if (obj.problems[problem] &&
						array_indexof(options.exclude_problems, problem) >= 0) {
						nir_debug("bigimage_recursive", "Removing problematic:", obj.url, "because of", problem);
						remove_obj();
						continue;
					}
				}
				if (obj.url && options.filter && !options.filter(obj.url)) {
					console_log("Blacklisted:", obj.url);
					remove_obj();
					continue;
				}
				if (options.exclude_videos && obj.media_info.type === "video") {
					remove_obj();
					continue;
				}
				if (pastobjs[0]) {
					if (obj._copy_old_props) {
						for (var j = 0; j < obj._copy_old_props.length; j++) {
							var prop = obj._copy_old_props[j];
							obj[prop] = deepcopy(pastobjs[0][prop]);
						}
					}
				}
			}
			nir_debug("bigimage_recursive", "parse_bigimage (objified, processed)", deepcopy(objified));
			if (objified.length === 0) {
				nir_debug("bigimage_recursive", "parse_bigimage: objified.length == 0");
				return false;
			}
			waiting = false;
			forcerecurse = false;
			var temp_newhref1 = newhref1;
			if (is_array(newhref1))
				temp_newhref1 = newhref1[0];
			if (typeof (temp_newhref1) === "object") {
				currentobj = newhref1;
				if (temp_newhref1.waiting) {
					waiting = true;
					if (!temp_newhref1.url) {
						newhref = newhref1;
						return false;
					}
				}
				if (temp_newhref1.forcerecurse) {
					forcerecurse = true;
				}
			} else {
				currentobj = null;
			}
			if (same_url(currenthref, objified) && !forcerecurse) {
				nir_debug("bigimage_recursive", "parse_bigimage: sameurl(currenthref, objified) == true (newhref, nh1, pastobjs)", deepcopy(currenthref), deepcopy(objified), deepcopy(newhref), deepcopy(newhref1), deepcopy(pastobjs));
				try {
					var cond = !options.fill_object || (newhref[0].waiting === true && !objified[0].waiting);
					if (cond) {
						newhref = objified;
					} else {
						var _apply = function(newobj) {
							array_foreach(basic_fillobj(newobj), function(sobj, i) {
								sobj = deepcopy(sobj);
								if (!sobj.url) {
									sobj.url = currenthref;
								}
								array_foreach(pastobjs, function(psobj) {
									if (psobj.url === sobj.url) {
										for (prop in sobj) {
											psobj[prop] = sobj[prop];
										}
										return false;
									}
								});
							});
						};
						/*
						apply(newhref);
						apply(newhref1);
						newhref = null;
						currentobj = pastobjs[0];
						*/
					}
					if (false) {
						if (!cond) {
							array_foreach(copy_props, function(prop) {
								if (!(prop in newhref[0]) && (prop in important_properties) /*&& prop_in_objified(prop, newhref1)*/) {
									cond = true;
									return false;
								}
							});
						}
						if (cond)
							newhref = objified;
					}
				} catch (e) { }
				return false;
			} else {
				if (!forcerecurse) {
					for (var i = 0; i < pasthrefs.length; i++) {
						if (same_url(pasthrefs[i], objified)) {
							nir_debug("bigimage_recursive", "parse_bigimage: sameurl(pasthrefs[" + i + "], objified) == true", deepcopy(pasthrefs[i]), deepcopy(objified), deepcopy(newhref));
							var cond = false;
							if (false && newhref && newhref.length) {
								array_foreach(copy_props, function(prop) {
									if (!(typeof newhref[0] === "object" && (prop in newhref[0])) && (prop in important_properties) && prop_in_objified(prop, newhref1)) {
										cond = true;
										return false;
									}
								});
							}
							if (cond || true)
								newhref = objified;
							return false;
						}
					}
				}
				nir_debug("bigimage_recursive", "parse_bigimage: setting currenthref and newhref");
				currenthref = get_currenthref(objified);
				newhref = newhref1;
			}
			pasthrefs.push(currenthref);
			var current_pastobjs = [];
			array_extend(current_pastobjs, objified);
			array_extend(current_pastobjs, pastobjs);
			pastobjs = current_pastobjs;
			if (false && !waiting) {
			}
			if (objified[0].norecurse)
				return false;
			if (_nir_debug_ && _nir_debug_.no_recurse) {
				return false;
			}
			return true;
		};
		var do_bigimage = function() {
			nir_debug("bigimage_recursive", "do_bigimage", currenthref, deepcopy(options));
			if (options.use_cache && url_cache.has(currenthref) && !forcerecurse) {
				nir_debug("bigimage_recursive", "do_bigimage: newhref = url_cache[" + currenthref + "]", deepcopy(url_cache.get(currenthref)));
				newhref = url_cache.get(currenthref);
				used_cache = true;
				return false;
			}
			if (options.filter) {
				if (!options.filter(currenthref)) {
					console_log("Blacklisted: " + currenthref);
					return false;
				}
			}
			var big;
			if (options.catch_errors) {
				try {
					big = our_bigimage(currenthref, options);
				} catch (e) {
					console_error(e);
					console_error(e.stack);
				}
			} else {
				big = our_bigimage(currenthref, options);
			}
			return parse_bigimage(big);
		};
		var finalize = function() {
			if (options.fill_object) {
				nir_debug("bigimage_recursive", "finalize (fillobj(newhref, currentobj), pastobjs)", deepcopy(newhref), deepcopy(currentobj), deepcopy(pastobjs));
				if ( /*used_cache &&*/newhref === null) {
					endhref = basic_fillobj(deepcopy(currentobj));
				} else {
					endhref = fillobj(deepcopy(newhref), currentobj);
				}
				if (options.include_pastobjs) {
					for (var i = 0; i < pastobjs.length; i++) {
						if (obj_indexOf(endhref, pastobjs[i].url) < 0 && !pastobjs[i].fake)
							endhref.push(deepcopy(pastobjs[i]));
					}
				}
			} else {
				nir_debug("bigimage_recursive", "finalize (newhref)", deepcopy(newhref));
				endhref = deepcopy(newhref);
			}
			nir_debug("bigimage_recursive", "endhref =", deepcopy(endhref));
		};
		var cb = null;
		if (options.cb) {
			var orig_cb = options.cb;
			options.cb = function(x) {
				if (false) {
					for (var i = 0; i < pastobjs.length; i++) {
						if (pastobjs[i].url === null && pastobjs[i].waiting) {
							pastobjs.splice(i, 1);
							i--;
						}
					}
					;
				}
				nir_debug("bigimage_recursive", "options.cb", deepcopy(x));
				var do_end = function() {
					nir_debug("bigimage_recursive", "do_end");
					finalize();
					do_cache();
					var blankurl = null;
					if (!options.null_if_no_change)
						blankurl = pasthrefs[pasthrefs.length - 1];
					if (!endhref || (is_array(endhref) && !endhref[0])) {
						endhref = blankurl;
					} else if (typeof endhref === "string") {
						endhref = blankurl;
					} else if (is_array(endhref) && typeof endhref[0] === "string") {
						endhref[0] = blankurl;
					} else if (is_array(endhref) && endhref[0] && !endhref[0].url) {
						endhref[0].url = blankurl;
					}
					if (!is_array(endhref)) {
						endhref = [endhref];
					}
					nir_debug("bigimage_recursive", "do_end (endhref, pasthrefs, pastobjs)", deepcopy(endhref), deepcopy(pasthrefs), deepcopy(pastobjs));
					orig_cb(endhref);
				};
				var parseresult = parse_bigimage(x);
				if ((!parseresult || (loop_i + 1) >= options.iterations) && !forcerecurse) {
					do_end();
				} else {
					for (; loop_i < options.iterations; loop_i++) {
						if (!do_bigimage()) {
							break;
						}
					}
					if (!waiting) {
						do_end();
					}
				}
			};
		}
		options._internal_info = {};
		for (loop_i = 0; loop_i < options.iterations; loop_i++) {
			if (!do_bigimage())
				break;
		}
		nir_debug("bigimage_recursive", "return finalize");
		finalize();
		do_cache();
		newhref = null;
		if (options.cb && !waiting) {
			options.cb(endhref);
		}
		return deepcopy(endhref);
	};
	bigimage_recursive.default_options = default_options;
	bigimage_recursive.internal = {
		settings: settings,
		settings_meta: settings_meta,
		strings: strings
	};
	function is_internet_url(url) {
		if (!url || typeof url !== "string")
			return false;
		if (!/^https?:\/\//.test(url))
			return false;
		if (/^[a-z]+:\/\/(127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(?:1[6-9]|2[0-9]|3[01])\.[0-9]+\.[0-9]+|localhost|[^/.]+)\//.test(url))
			return false;
		if (/^[a-z]+:\/\/(?:[0-9a-f]*\:){1,}\//.test(url))
			return false;
		return true;
	}
	bigimage_recursive.is_internet_url = is_internet_url;
	function clear_all_caches() {
		url_cache.clear();
		real_api_cache.clear();
		cookie_cache.clear();
	}
	bigimage_recursive.clear_caches = clear_all_caches;
	if (false) {
		var fake_bigimage = function(src, options) {
			var origsrc = src;
			var nodomain = src.replace(/^[a-z]+:\/\/[^/]+\/+/, "");
			if (nodomain === "test1") {
				return "out_test1"; // should return https://www.example.com/out_test1
			}
			if (options.null_if_no_change) {
				if (src !== origsrc)
					return src;
				return null;
			}
		};
	}
	var obj_to_simplelist = function(obj) {
		var out = [];
		for (var i = 0; i < obj.length; i++) {
			out.push(obj[i].url);
		}
		return out;
	};
	var obj_indexOf = function(obj, url) {
		return array_indexof(obj_to_simplelist(obj), url);
	};
	var obj_merge = function(newobj, oldobj) {
		var newobj_simple = obj_to_simplelist(newobj);
		for (var i = 0; i < oldobj.length; i++) {
			var index = array_indexof(newobj_simple, oldobj[i].url);
			if (index >= 0) {
				for (var key in oldobj[i]) {
					var old_value = oldobj[i][key];
					var new_value = newobj[index][key];
					if (new_value !== old_value && JSON_stringify(new_value) === JSON_stringify(default_object[key])) {
						newobj[index][key] = old_value;
					}
				}
				continue;
			}
			newobj.push(oldobj[i]);
		}
		return newobj;
	};
	var bigimage_recursive_loop = function(url, options, query, fine_urls, tried_urls, oldobj) {
		var newoptions = {};
		if (!fine_urls) {
			fine_urls = [];
		}
		if (!tried_urls) {
			tried_urls = [];
		}
		if (!oldobj) {
			oldobj = [];
		}
		for (var option in options) {
			if (option === "cb") {
				newoptions.cb = function(obj) {
					if (_nir_debug_) {
						console_log("bigimage_recursive_loop's cb: obj:", deepcopy(obj));
						console_log("bigimage_recursive_loop's cb: oldobj:", deepcopy(oldobj));
					}
					obj = obj_merge(obj, oldobj);
					var images = obj_to_simplelist(obj);
					for (var i = 0; i < obj.length; i++) {
						if (obj[i].bad) {
							var obj_url = obj[i].url;
							var orig_url = null;
							obj.splice(i, 1);
							images.splice(i, 1);
							i--;
							for (var j = 0; j < tried_urls.length; j++) {
								if (tried_urls[j].newurl === obj_url) {
									var orig_url = tried_urls[j].newobj.url;
									var index = array_indexof(images, orig_url);
									tried_urls[j].unk = true;
									if (index >= 0) {
										obj.splice(index, 1);
										images.splice(index, 1);
										if (index < i)
											i -= 2;
										else if (index === i)
											i--;
									}
									break;
								}
							}
						}
					}
					if (_nir_debug_) {
						console_log("bigimage_recursive_loop's cb: obj after:", deepcopy(obj));
						console_log("bigimage_recursive_loop's cb: images after:", deepcopy(images));
						console_log("bigimage_recursive_loop's cb: fine_urls:", deepcopy(fine_urls));
						console_log("bigimage_recursive_loop's cb: tried_urls:", deepcopy(tried_urls));
					}
					for (var i = 0; i < fine_urls.length; i++) {
						var index = array_indexof(images, fine_urls[i].url);
						if (index >= 0) {
							obj = [obj[index]];
							if (_nir_debug_) {
								console_log("bigimage_recursive_loop's cb: returning fine_url", deepcopy(obj), deepcopy(fine_urls[i]));
							}
							return options.cb(obj, fine_urls[i].data);
						}
					}
					var try_any = false;
					for (var i = 0; i < tried_urls.length; i++) {
						if (tried_urls[i].url === url || try_any) {
							if (tried_urls[i].unk === true) {
								try_any = true;
								continue;
							}
							var index = array_indexof(images, tried_urls[i].newurl);
							if (index >= 0) {
								obj = [obj[index]];
								if (_nir_debug_) {
									console_log("bigimage_recursive_loop's cb: returning tried_url", deepcopy(obj), deepcopy(tried_urls[i]), try_any);
								}
								return options.cb(obj, tried_urls[i].data);
							} else {
								if (_nir_debug_) {
									console_log("bigimage_recursive_loop's cb: returning null tried_url", deepcopy(tried_urls[i]), try_any);
								}
								return options.cb(null, tried_urls[i].data);
							}
						}
					}
					if (_nir_debug_) {
						console_log("bigimage_recursive_loop: about to query", deepcopy(obj));
					}
					query(obj, function(newurl, newobj, data) {
						if (_nir_debug_) {
							console_log("bigimage_recursive_loop (query: newurl, newobj, data):", deepcopy(newurl), deepcopy(newobj), data);
						}
						if (!newurl) {
							if (_nir_debug_) {
								console_log("bigimage_recursive_loop (query): returning null", data);
							}
							return options.cb(null, data);
						}
						fine_urls.push({
							url: newurl,
							data: data
						});
						tried_urls.push({
							url: url,
							data: data,
							newurl: newurl,
							newobj: deepcopy(newobj),
							unk: false
						});
						var newurl_index = array_indexof(images, newurl);
						if (newurl_index < 0 || !obj[newurl_index].norecurse) {
							bigimage_recursive_loop(newurl, options, query, fine_urls, tried_urls, obj);
						} else {
							obj = [obj[newurl_index]];
							if (_nir_debug_) {
								console_log("bigimage_recursive_loop (query): returning", deepcopy(obj), data);
							}
							options.cb(obj, data);
						}
					});
				};
			} else {
				newoptions[option] = options[option];
			}
		}
		if (_nir_debug_) {
			console_log("bigimage_recursive_loop", url, deepcopy(options), query, deepcopy(fine_urls), deepcopy(tried_urls), deepcopy(oldobj));
		}
		return bigimage_recursive(url, newoptions);
	};
	bigimage_recursive.loop = bigimage_recursive_loop;
	var get_tagname = function(el) {
		return el.tagName.toUpperCase();
	};
	var get_computed_style = function(el) {
		return el.currentStyle || window.getComputedStyle(el);
	};
	var get_svg_src = function(el) {
		var remove_attributes = [
			"class",
			"id",
			"tabindex",
			"style"
		];
		var newel = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		newel.innerHTML = el.innerHTML;
		newel.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		var attrs = el.attributes;
		for (var i = 0; i < attrs.length; i++) {
			var attr_name = attrs[i].name;
			if (array_indexof(remove_attributes, attr_name) >= 0 || /^on/.test(attr_name) || /^aria-/.test(attr_name)) {
				continue;
			}
			newel.setAttribute(attr_name, attrs[i].value);
		}
		var computed_style = get_computed_style(el);
		var fillval = el.getAttribute("fill") || computed_style.fill;
		if (fillval) {
			newel.setAttribute("fill", fillval);
		}
		var header = ""; // unneeded
		var svgdoc = header + newel.outerHTML;
		return "data:image/svg+xml," + encodeURIComponent(svgdoc);
	};
	var get_canvas_src = function(el, format) {
		try {
			return el.toDataURL(format);
		} catch (e) {
			console_error(e);
			return;
		}
	};
	var is_valid_src = function(src, isvideo) {
		return src && (!(/^blob:/.test(src)) || !isvideo);
	};
	var get_img_src = function(el) {
		if (typeof el === "string")
			return el;
		var el_tagname = get_tagname(el);
		if (el_tagname === "A")
			return el.href;
		if (el_tagname === "IFRAME") {
			return el.src.replace(/^javascript:window\.location\.replace\(["']([^"']+)["']\)$/, "$1");
		}
		if (el_tagname === "CANVAS") {
			return get_canvas_src(el, "image/png");
		}
		if (el_tagname === "SVG") {
			if (settings.mouseover_allow_svg_el) {
				return get_svg_src(el);
			} else {
				return null;
			}
		}
		if (el_tagname === "VIDEO") {
			return el.currentSrc || el.src || el.poster;
		}
		if (el_tagname === "AUDIO") {
			return el.currentSrc || el.src;
		}
		if (el_tagname === "SOURCE") {
			if (el.parentElement) {
				var newsrc = get_img_src(el.parentElement);
				if (newsrc && is_valid_src(newsrc, true))
					return newsrc;
			}
			return el.currentSrc || el.src;
		}
		if (el_tagname === "IMAGE") {
			var xlink_href = el.getAttribute("xlink:href");
			if (xlink_href) {
				return xlink_href;
			} else {
				return null;
			}
		}
		var src = el.currentSrc || el.src;
		if (!src && el.tagName === "IMG") {
			var fake_src = el.getAttribute("data-imu-fake-src");
			if (fake_src)
				return fake_src;
		}
		return src;
	};
	var check_highlightimgs_supported_image = function(el) {
		var src = get_img_src(el);
		var options = {
			fill_object: true,
			exclude_problems: [],
			use_cache: "read",
			use_api_cache: false,
			cb: function() { },
			do_request: function() { }
		};
		if (is_interactive) {
			options.host_url = window.location.href;
			options.element = el;
			options.document = document;
			options.window = window;
		}
		var imu_output = bigimage_recursive(src, options);
		if (imu_output.length !== 1)
			return true;
		var imu_obj = imu_output[0];
		if (imu_obj.url !== src)
			return true;
		for (var key in imu_obj) {
			if (key === "url")
				continue;
			if (!(key in default_object))
				return true;
			if (JSON_stringify(default_object[key]) !== JSON_stringify(imu_obj[key]))
				return true;
		}
		return false;
	};
	var send_redirect = function(obj, cb, tabId) {
		if (is_extension) {
			extension_send_message({
				type: "redirect",
				data: {
					obj: obj,
					tabId: tabId
				}
			}, function() {
				cb();
			});
		} else {
			cb();
		}
	};
	var redirect = function(url, obj) {
		if (_nir_debug_) {
			console_log("redirect", url, obj);
		}
		if (_nir_debug_ && _nir_debug_.no_redirect)
			return;
		if (url === window.location.href)
			return;
		try {
			window.stop();
		} catch (e) {
		}
		send_redirect(obj, function() {
			if (settings.redirect_history) {
				window.location.assign(url);
			} else {
				window.location.replace(url);
			}
		});
	};
	var cursor_wait = function() {
		if (document.documentElement)
			document.documentElement.style.cursor = "wait";
	};
	var cursor_default = function() {
		if (document.documentElement)
			document.documentElement.style.cursor = "default";
	};
	var infobox_timer = null;
	var show_image_infobox = function(text) {
		var div = document_createElement("div");
		div.style.backgroundColor = "#fffabb";
		div.style.color = "#000";
		div.style.position = "absolute";
		div.style.top = "0px";
		div.style.left = "0px";
		div.style.padding = ".3em .8em";
		div.style.boxShadow = "0px 0px 20px rgba(0,0,0,.6)";
		div.style.margin = ".8em";
		div.style.lineHeight = "1.5em";
		div.innerHTML = text;
		div.onclick = function() {
			document.body.removeChild(div);
			if (infobox_timer) {
				clearTimeout(infobox_timer);
				infobox_timer = null;
			}
		};
		document.body.appendChild(div);
		var do_timeout = function() {
			if (infobox_timer || settings.redirect_infobox_timeout <= 0)
				return;
			infobox_timer = setTimeout(function() {
				document.body.removeChild(div);
			}, settings.redirect_infobox_timeout * 1000);
		};
		if (document.hasFocus()) {
			do_timeout();
		} else {
			document.onfocus = function() {
				do_timeout();
				document.onfocus = null;
			};
			window.onfocus = function() {
				do_timeout();
				window.onfocus = null;
			};
		}
	};
	var check_ok_error = function(ok_errors, error) {
		if (ok_errors && is_array(ok_errors)) {
			for (var i = 0; i < ok_errors.length; i++) {
				if (error.toString() === ok_errors[i].toString()) {
					return true;
				}
			}
			return false;
		}
		return null;
	};
	var get_single_trigger_key_text = function(list) {
		list = list.sort(function(a, b) {
			if (a === b)
				return 0;
			if (a === "ctrl")
				return -1;
			if (b === "ctrl")
				return 1;
			if (a === "shift")
				return -1;
			if (b === "shift")
				return 1;
			if (a === "super")
				return -1;
			if (b === "super")
				return 1;
			if (a === "alt")
				return -1;
			if (b === "alt")
				return 1;
			if (a < b)
				return -1;
			if (b > a)
				return 1;
		});
		var newlist = [];
		for (var i = 0; i < list.length; i++) {
			var capitalized = string_charat(list[i], 0).toUpperCase() + list[i].slice(1);
			if (list.length === 1 && (capitalized === "Left" || capitalized === "Right" || capitalized === "Up" || capitalized === "Down")) {
				capitalized += " Arrow";
			}
			newlist.push(_(capitalized));
		}
		return newlist.join("+");
	};
	var get_trigger_key_texts = function(list) {
		if (!is_array(list[0])) {
			list = [list];
		}
		var result = [];
		for (var i = 0; i < list.length; i++) {
			result.push(get_single_trigger_key_text(list[i]));
		}
		return result;
	};
	var get_trigger_key_text = function(list) {
		return get_trigger_key_texts(list).join(" / ");
	};
	var truncate_with_ellipsis = function(text, maxchars) {
		var truncate_regex = new RegExp("^((?:.{" + maxchars + "}|.{0," + maxchars + "}[\\r\\n]))[\\s\\S]+?$");
		return text.replace(truncate_regex, decodeURIComponent("%241%E2%80%A6"));
	};
	var size_to_text = function(size) {
		var sizes = ["", "K", "M", "G", "T", "P"];
		while (size > 1024 && sizes.length > 1) {
			size /= 1024.;
			sizes.shift();
		}
		return size.toFixed(2).replace(/\.00$/, "") + sizes[0] + "B";
	};
	var check_image = function(obj, page_url, err_cb, ok_cb, no_infobox) {
		if (_nir_debug_)
			console_log("check_image", deepcopy(obj), page_url, no_infobox);
		if (is_array(obj)) {
			obj = obj[0];
		}
		if (!obj || !obj.url) {
			ok_cb(obj);
			return;
		}
		var print_orig = function() {
			if (obj && obj.extra) {
				if (obj.extra.page) {
					console_log("Original page: " + obj.extra.page);
				}
				if (obj.extra.caption) {
					console_log("Caption: " + obj.extra.caption);
				}
				if (obj.extra.created_date) {
					console_log("Created date: " + new Date(obj.extra.created_date));
				}
				if (obj.extra.updated_date) {
					console_log("Updated date: " + new Date(obj.extra.updated_date));
				}
			}
		};
		var url = obj.url;
		var err_txt;
		if (url === page_url) {
			print_orig();
			if (_nir_debug_)
				console_log("(check_image) url == page_url", url, page_url);
			ok_cb(url);
		} else {
			var headers = obj.headers;
			console_log(obj.url);
			print_orig();
			if (obj) {
				if (obj.bad) {
					err_txt = "Bad image";
				} else if (obj.media_info.type === "video" && obj.media_info.delivery) {
					err_txt = "Can't redirect to streaming video type " + JSON_stringify(obj.media_info.delivery);
				} else if (obj.is_pagelink) {
					err_txt = "Can't redirect to page";
				}
				if (err_txt) {
					if (err_cb) {
						err_cb(err_txt);
					} else {
						console_error(err_txt);
					}
					return;
				}
			}
			var mouseover_text = function(reason) {
				if (!is_interactive)
					return;
				if (no_infobox) {
					return err_cb(reason, true);
				}
				if (!settings.redirect_enable_infobox)
					return;
				var trigger_behavior = get_single_setting("mouseover_trigger_behavior");
				var mouseover;
				if (!settings.mouseover) {
					mouseover = "disabled";
				} else if (trigger_behavior === "keyboard") {
					mouseover = get_trigger_key_text(settings.mouseover_trigger_key);
				} else if (trigger_behavior === "mouse") {
					mouseover = "delay " + settings.mouseover_trigger_delay + "s";
				}
				imagetab_ok_override = true;
				var trigger_options_link = "<a style='color:blue; font-weight:bold' href='" + options_page + "' target='_blank' rel='noreferrer'>" + mouseover + "</a>";
				var infobox_text = _("Mouseover popup (%%1) is needed to display the original version", trigger_options_link) + " (" + _(reason) + ")";
				if (settings.redirect_infobox_url) {
					var link = document_createElement("a");
					link.href = url;
					link.innerText = truncate_with_ellipsis(url, 80);
					link.setAttribute("target", "_blank");
					infobox_text += "<br />" + link.outerHTML;
				}
				try {
					show_image_infobox(infobox_text);
				} catch (e) {
					console_error(e);
				}
			};
			if (!_nir_debug_ || !_nir_debug_.no_request) {
				if (is_interactive)
					cursor_wait();
				var url_domain = url.replace(/^([a-z]+:\/\/[^/]*).*?$/, "$1");
				var origheaders = deepcopy(headers);
				var customheaders = true;
				if (!headers || Object.keys(headers).length === 0) {
					headers = {};
					customheaders = false;
				}
				var specified_headers = new_set();
				for (var header in headers) {
					set_add(specified_headers, header.toLowerCase());
				}
				var base_headers = {
					"referer": page_url,
					"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
					"sec-fetch-dest": "document",
					"sec-fetch-mode": "navigate",
					"sec-fetch-site": "cross-site"
				};
				for (var header in base_headers) {
					if (!set_has(specified_headers, header)) {
						headers[header] = base_headers[header];
					}
				}
				if (customheaders && Object.keys(origheaders).length === 1 && ("Referer" in origheaders)) {
					var domain = page_url;
					domain = domain.replace(/^[a-z]+:\/\/([^/]*).*?$/, "$1");
					var url_domain = url.replace(/^[a-z]+:\/\/([^/]*).*?$/, "$1");
					if (obj.referer_ok.same_domain && domain === url_domain) {
						customheaders = false;
					} else if (obj.referer_ok.same_domain_nosub && get_domain_nosub(domain) === get_domain_nosub(url_domain)) {
						customheaders = false;
					}
				}
				if (customheaders && !is_extension) {
					document.documentElement.style.cursor = "default";
					console_log("Custom headers needed, currently unhandled");
					mouseover_text("custom headers");
					return;
				}
				if (_nir_debug_)
					console_log("(check_image) headers", headers);
				if (obj.always_ok ||
					(!obj.can_head && !settings.canhead_get)) {
					if (_nir_debug_) {
						console_log("(check_image) always_ok || !can_head", url, deepcopy(obj));
					}
					return ok_cb(url);
				}
				var method = "HEAD";
				if (!obj.can_head && settings.canhead_get) {
					if (_nir_debug_)
						console_log("Trying GET");
					method = "GET";
				}
				var handled = false;
				var onload_cb = function(resp) {
					if (handled)
						return;
					handled = true;
					if (_nir_debug_)
						console_log("(check_image) resp", resp);
					if (is_userscript && userscript_manager === "FireMonkey" && !resp) {
						err_txt = "Error: resp == null (tracking protection blocked, FireMonkey bug)";
						if (err_cb) {
							err_cb(err_txt);
						} else {
							console_error(err_txt);
						}
						return;
					}
					if (resp.readyState < 2) {
						return;
					}
					if (is_userscript && !resp.status && resp.readyState < 4) {
						handled = false;
						return;
					}
					if (resp.readyState < 4) {
						if (req && req.abort)
							req.abort();
					}
					if (resp.status === 0 ||
						check_tracking_blocked(resp)) {
						err_txt = "Error: status == 0";
						if (err_cb) {
							err_cb(err_txt);
						} else {
							console_error(err_txt);
						}
						return;
					}
					cursor_default();
					if (resp.finalUrl === page_url) {
						console_log(resp.finalUrl);
						console_log("Same URL");
						return;
					}
					var headers_list = parse_headers(resp.responseHeaders);
					var headers = headers_list_to_dict(headers_list);
					if (_nir_debug_)
						console_log("(check_image) resp headers", headers);
					var digit = resp.status.toString()[0];
					var ok_error = check_ok_error(obj.head_ok_errors, resp.status);
					if (((digit === "4" || digit === "5") &&
						resp.status !== 405) &&
						ok_error !== true) {
						err_txt = "Error: " + resp.status;
						if (err_cb) {
							err_cb(err_txt);
						} else {
							console_error(err_txt);
						}
						return;
					}
					var content_type = headers["content-type"];
					if (!content_type)
						content_type = "";
					content_type = content_type.toLowerCase();
					if ((content_type.match(/text\/html/) || !content_type) && !obj.head_wrong_contenttype &&
						ok_error !== true) {
						var err_txt = "Error: Not an image: " + (content_type || "(no content-type)");
						if (err_cb) {
							err_cb(err_txt);
						} else {
							console_error(err_txt);
						}
						return;
					}
					if (!is_extension || settings.redirect_disable_for_responseheader) {
						if (obj.forces_download || ((content_type.match(/(?:binary|application|multipart|text)\//) ||
							content_type === "image/tiff" ||
							content_type.match(/^ *\[/)) && !obj.head_wrong_contenttype) ||
							(headers["content-disposition"] &&
								headers["content-disposition"].toLowerCase().match(/^ *attachment/))) {
							console_error("Forces download");
							mouseover_text("forces download");
							return;
						}
					}
					if (headers["content-length"] && headers["content-length"] == "0" && !obj.head_wrong_contentlength) {
						console_error("Zero-length image");
						return;
					}
					if (check_bad_if(obj.bad_if, resp)) {
						console_error("Bad image (bad_if)", obj.bad_if, resp);
						return err_cb("bad image");
					}
					if (!customheaders || is_extension) {
						if (_nir_debug_) {
							console_log("(check_image) finalUrl", resp.finalUrl || url, resp, deepcopy(obj));
						}
						ok_cb(resp.finalUrl || url);
					} else {
						console_log("Custom headers needed, currently unhandled");
					}
				};
				var req = do_request({
					method: method,
					url: url,
					headers: headers,
					trackingprotection_failsafe: true,
					onprogress: function(resp) {
						if (resp.readyState >= 2 && resp.responseHeaders) {
							onload_cb(resp);
						}
					},
					onload: onload_cb
				});
			}
		}
	};
	function do_export() {
		$$IMU_EXPORT$$ = bigimage_recursive;
		if (is_node) {
			module.exports = bigimage_recursive;
		} else if (is_scripttag) {
			imu_variable = bigimage_recursive;
		}
	}
	function contenttype_can_be_redirected(contentType) {
		if (/^video\//.test(contentType))
			return !!settings.redirect_video;
		if (/^audio\//.test(contentType))
			return !!settings.redirect_audio;
		return !(/^(?:text|application)\//.test(contentType));
	}
	function currenttab_is_image() {
		return contenttype_can_be_redirected(document.contentType);
	}
	function do_redirect_sub(page_url, force_page, redirect) {
		var bigimage_obj = {
			fill_object: true,
			force_page: force_page,
			cb: function(newhref) {
				if (_nir_debug_) {
					console_log("do_redirect (final)", newhref);
				}
				cursor_default();
				if (!newhref) {
					return;
				}
				if (is_interactive && settings.print_imu_obj)
					console_log(newhref);
				var newurl = newhref[0].url;
				if (false && newhref[0].extra && newhref[0].extra.page) {
					console_log("Original page: " + newhref[0].extra.page);
				}
				if (newurl === page_url)
					return;
				if (!newurl)
					return;
				if (_nir_debug_)
					console_log("redirect (recursive loop)", newhref);
				redirect(newurl, newhref);
			}
		};
		if (is_interactive) {
			bigimage_obj.document = document;
			bigimage_obj.window = get_window();
		}
		bigimage_recursive_loop(page_url, bigimage_obj, function(newhref, real_finalcb) {
			if (_nir_debug_) {
				console_log("do_redirect", newhref);
			}
			var currentobj = null;
			var finalcb = function(newurl, data, newobj) {
				real_finalcb(newurl, newobj || currentobj, data);
			};
			if (false && (!newhref[0].can_head || newhref[0].always_ok)) {
				var newurl = newhref[0].url;
				if (newurl === window.location.href) {
					cursor_default();
					return;
				}
				if (_nir_debug_) {
					console_log("Not checking due to can_head == false || always_ok == true");
				}
				finalcb(newurl);
				return;
			}
			var new_newhref = [];
			for (var i = 0; i < newhref.length; i++) {
				if (!settings.redirect_video && is_probably_video(newhref[i]) &&
					!(settings.redirect_audio && is_probably_audio(newhref[i]))) {
					continue;
				}
				if (!settings.redirect_audio && is_probably_audio(newhref[i]) &&
					!(settings.redirect_video && is_probably_video(newhref[i]))) {
					continue;
				}
				new_newhref.push(newhref[i]);
			}
			var no_infobox = settings.redirect_to_no_infobox;
			var infobox_urls = [];
			var use_infobox = false;
			var index = 0;
			var cb = function(err_txt, is_infobox) {
				if (_nir_debug_) {
					console_log("do_redirect_sub's err_cb:", err_txt, is_infobox);
				}
				if (is_infobox)
					infobox_urls.push(new_newhref[index]);
				index++;
				var array = new_newhref;
				if (use_infobox)
					array = infobox_urls;
				if (index >= array.length) {
					if (no_infobox && infobox_urls.length > 0) {
						use_infobox = true;
						no_infobox = false;
						index = 0;
					} else {
						cursor_default();
						console_error(err_txt);
						return;
					}
				}
				if (same_url(window.location.href, array[index]) && no_infobox && infobox_urls.length > 0) {
					use_infobox = true;
					no_infobox = false;
					index = 0;
				}
				currentobj = array[index];
				check_image(currentobj, page_url, cb, finalcb, no_infobox);
			};
			currentobj = new_newhref[0];
			check_image(currentobj, page_url, cb, finalcb, no_infobox);
		});
	}
	function do_redirect() {
		if (!settings.redirect_host_html && !currenttab_is_image()) {
			return;
		}
		cursor_wait();
		var force_page = false;
		if ((settings["redirect_force_page"] + "") === "true")
			force_page = true;
		do_redirect_sub(window.location.href, force_page, redirect);
	}
	function onload(cb) {
		if (document.readyState === "complete" ||
			document.readyState === "interactive") {
			cb();
		} else {
			var state_cb = function() {
				if (document.readyState === "complete" ||
					document.readyState === "interactive") {
					cb();
					our_removeEventListener(document, "readystatechange", state_cb);
				}
			};
			our_addEventListener(document, "readystatechange", state_cb);
		}
	}
	function get_keystrs_map(event, value) {
		var keys = {};
		if (event.ctrlKey) {
			keys["ctrl"] = true;
		} else {
			keys["ctrl"] = false;
		}
		/*if (event.metaKey) {
			keys["super"] = true;
		} else {
			keys["super"] = false;
		}*/
		if (event.altKey) {
			keys["alt"] = true;
		} else {
			keys["alt"] = false;
		}
		if (event.shiftKey) {
			keys["shift"] = true;
		} else {
			keys["shift"] = false;
		}
		if (event.buttons !== void 0) {
			var buttonnames = ["button1", "button2", "button3", "button4", "button5"];
			var buttons = event.buttons;
			while (buttonnames.length > 0) {
				if (buttons & 1) {
					keys[buttonnames[0]] = true;
				} else {
					keys[buttonnames[0]] = false;
				}
				buttons >>= 1;
				buttonnames.shift();
			}
		}
		if (event.type === "wheel") {
			if (event.deltaY < 0) {
				keys["wheelUp"] = true;
			} else if (event.deltaY > 0) {
				keys["wheelDown"] = true;
			}
			if (event.deltaX < 0) {
				keys["wheelLeft"] = true;
			} else if (event.deltaX > 0) {
				keys["wheelRight"] = true;
			}
		}
		var str = keycode_to_str(event);
		if (str === void 0) {
			return keys;
		}
		keys[str] = value;
		return keys;
	}
	var keystr_is_wheel = function(keystr) {
		return /^wheel/.test(keystr);
	};
	var keystr_is_button12 = function(keystr) {
		return keystr === "button1"; // || keystr === "button2";
	};
	var chord_is_only_wheel = function(chord) {
		for (var i = 0; i < chord.length; i++) {
			if (!keystr_is_wheel(chord[i]) && !keystr_is_button12(chord[i])) {
				return false;
			}
		}
		return true;
	};
	var keysequence_bad = function(keyseq) {
		if (chord_is_only_wheel(keyseq))
			return true;
		if (keyseq.length !== 1)
			return false;
		return keystr_is_button12(keyseq[0]);
	};
	var keysequence_valid = function(keyseq) {
		if (keyseq.length === 0)
			return false;
		if (keysequence_bad(keyseq))
			return false;
		if (keyseq.length > 1)
			return true;
		return true;
	};
	var prefers_dark_mode = function() {
		try {
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		} catch (e) {
			return false;
		}
	};
	function update_dark_mode() {
		if (!is_maxurl_website && !is_options_page) {
			return;
		}
		if (prefers_dark_mode()) {
			set_default_value("dark_mode", true);
		}
		if (settings.dark_mode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}
	var request_permission = function(permission, cb) {
		if (!is_extension)
			return cb(false);
		if (true) {
			try {
				chrome.permissions.request({
					permissions: [permission]
				}, function(granted) {
					if (granted) {
						extension_send_message({
							type: "permission_handler",
							data: {
								permission: permission
							}
						});
					}
					cb(granted);
				});
			} catch (e) {
				console_error(e);
				cb(false);
			}
		} else {
			extension_send_message({
				type: "permission",
				data: {
					permission: permission
				}
			}, function(result) {
				cb(result.data.granted);
			});
		}
	};
	var current_options_tab = "general";
	if (is_interactive) {
		var hash = window.location.hash;
		if (hash) {
			var hashmatch = hash.match(/^#?cat(?:_fake)?_(.*)$/);
			if (hashmatch) {
				current_options_tab = hashmatch[1];
			}
		}
	}
	function do_options() {
		update_dark_mode();
		var recording_keys = false;
		var options_chord = [];
		var current_options_chord = [];
		function update_options_chord(event, value) {
			if (!recording_keys)
				return;
			var map = get_keystrs_map(event, value);
			if ((keycode_to_str(event) || event.type === "mousedown") &&
				current_options_chord.length === 0) {
				if (event.button !== 0 && event.button !== 2)
					options_chord = [];
			}
			var old_options_chord = deepcopy(options_chord);
			for (var key in map) {
				update_options_chord_sub(key, map[key]);
			}
			if (keysequence_bad(options_chord))
				options_chord = old_options_chord;
			recording_keys();
		}
		function update_options_chord_sub(str, value) {
			if (value) {
				if (array_indexof(options_chord, str) < 0) {
					options_chord.push(str);
				}
				if (array_indexof(current_options_chord, str) < 0) {
					current_options_chord.push(str);
				}
			} else {
				if (array_indexof(current_options_chord, str) >= 0) {
					current_options_chord.splice(array_indexof(current_options_chord, str), 1);
				}
			}
		}
		document.addEventListener('keydown', function(event) {
			update_options_chord(event, true);
			if (recording_keys) {
				event.preventDefault();
				return false;
			}
		});
		document.addEventListener('mousedown', function(event) {
			update_options_chord(event, true);
			if (recording_keys) {
				event.preventDefault();
				return false;
			}
		});
		document.addEventListener('wheel', function(event) {
			update_options_chord(event, true);
			if (recording_keys) {
				event.preventDefault();
				event.stopImmediatePropagation();
				event.stopPropagation();
				return false;
			}
		}, {
			capture: true,
			passive: false
		});
		document.addEventListener("contextmenu", function(event) {
			if (recording_keys) {
				event.preventDefault();
				event.stopImmediatePropagation();
				return false;
			}
		});
		document.addEventListener('keyup', function(event) {
			update_options_chord(event, false);
			if (recording_keys) {
				event.preventDefault();
				return false;
			}
		});
		document.addEventListener('mouseup', function(event) {
			if (event.button === 1)
				return;
			update_options_chord(event, false);
			if (recording_keys) {
				event.preventDefault();
				event.stopImmediatePropagation();
				return false;
			}
		});
		var options_el_real = document.getElementById("options");
		options_el_real.textContent = "";
		var options_el = document.createDocumentFragment();
		if (!is_extension_options_page) {
			var options_header_el = document_createElement("h1");
			options_header_el.textContent = _("options_header");
			options_el.appendChild(options_header_el);
		}
		var saved_el = document.getElementById("saved");
		if (!saved_el) {
			saved_el = document_createElement("div");
			saved_el.style.visibility = "hidden";
			saved_el.id = "saved";
			saved_el.classList.add("topsaved");
		}
		var get_default_saved_text = function(meta) {
			var text = "Saved! Refresh the target page for changes to take effect";
			if (meta && meta.needrefresh)
				return text;
			if (is_extension || typeof GM_addValueChangeListener !== "undefined") {
				text = "Saved!";
			}
			return text;
		};
		var set_saved_text = function(id) {
			var p_el = document_createElement("p");
			p_el.textContent = _(id);
			saved_el.textContent = "";
			saved_el.appendChild(p_el);
		};
		set_saved_text(get_default_saved_text());
		var saved_timeout = null;
		var create_update_available = function() {
			var update_available_el = document_createElement("div");
			update_available_el.classList.add("update-available");
			update_available_el.innerHTML = "Update available: v" + current_version + " -&gt; ";
			var link = get_update_url();
			if (link) {
				update_available_el.innerHTML += "<a href=\"" + link + "\" target=\"_blank\" rel=\"noreferer\">v" + settings.last_update_version + "</a>";
			} else {
				update_available_el.innerHTML += "v" + settings.last_update_version;
			}
			return update_available_el;
		};
		if (settings.check_updates && version_compare(current_version, settings.last_update_version) === 1) {
			options_el.appendChild(create_update_available());
		}
		var rules_failed_el = document.createElement("p");
		if (set_require_rules_failed_el(rules_failed_el)) {
			options_el.appendChild(rules_failed_el);
		}
		var topbtns_holder = document_createElement("div");
		topbtns_holder.id = "topbtns";
		options_el.appendChild(topbtns_holder);
		var importexport_ocontainer = document_createElement("div");
		importexport_ocontainer.id = "importexport";
		importexport_ocontainer.classList.add("center-outer");
		importexport_ocontainer.style.display = "none";
		options_el.appendChild(importexport_ocontainer);
		var importexport_container = document_createElement("div");
		importexport_container.classList.add("center-inner");
		importexport_ocontainer.appendChild(importexport_container);
		var importexport_text = document_createElement("textarea");
		importexport_container.appendChild(importexport_text);
		var safe_import_json = function(json) {
			json = strip_whitespace_simple(json);
			var append = false;
			if (json[0] === "+") {
				append = true;
				json = json.substring(1);
			}
			var value = null;
			try {
				value = JSON_parse(json);
			} catch (e) {
				console_error(e);
			}
			return {
				value: value,
				append: append
			};
		};
		var fetch_import_json = function(import_text, cb) {
			if (/^https?:\/\//.test(import_text)) {
				do_request({
					method: "GET",
					url: import_text,
					onload: function(resp) {
						if (resp.status !== 200) {
							console.error(resp);
							return cb(null);
						}
						cb(safe_import_json(resp.responseText));
					}
				});
			} else {
				cb(safe_import_json(import_text));
			}
		};
		var real_import_btn = document_createElement("button");
		real_import_btn.innerText = _("Import");
		real_import_btn.onclick = function() {
			if (real_import_btn.classList.contains("disabled"))
				return;
			real_import_btn.classList.add("disabled");
			var import_text = importexport_text.value;
			import_text = strip_whitespace_simple(import_text);
			fetch_import_json(import_text, function(data) {
				if (!data || !data.value) {
					importexport_text.value = "Error!";
					real_import_btn.classList.remove("disabled");
					return;
				}
				var value = data.value;
				var append = data.append;
				var changed = false;
				var current_settings = deepcopy(settings);
				var new_settings;
				if (!append)
					new_settings = deepcopy(orig_settings);
				else
					new_settings = deepcopy(settings);
				var settings_version;
				for (var key in value) {
					if (!(key in settings)) {
						if (key === "settings_version") {
							settings_version = value[key];
							continue;
						} else {
							console_warn("Unknown key in imported settings:", key);
						}
					}
					new_settings[key] = value[key];
				}
				for (var key in new_settings) {
					if (JSON_stringify(new_settings[key]) !== JSON_stringify(current_settings[key])) {
						settings[key] = new_settings[key];
						set_value(key, new_settings[key]);
						changed = true;
					}
				}
				if (settings_version === void 0) {
					settings_version = 1;
				}
				upgrade_settings_with_version(settings_version, new_settings, function(new_changed) {
					real_import_btn.classList.remove("disabled");
					if (changed || new_changed) {
						console_log("Settings imported");
						setTimeout(function() {
							do_options();
						}, 1);
					} else {
						console_log("No settings changed");
					}
					show_importexport(false);
				});
			});
		};
		importexport_container.appendChild(real_import_btn);
		var export_container = document_createElement("div");
		var export_txt_btn = document_createElement("button");
		export_txt_btn.innerText = _("Save");
		export_txt_btn.onclick = function() {
			var data = importexport_text.value;
			var url = "data:text/plain," + encodeURIComponent(data);
			var obj = {
				url: url,
				filename: "settings.txt"
			};
			do_download(obj, obj.filename, data.length);
		};
		export_container.appendChild(export_txt_btn);
		importexport_container.appendChild(export_container);
		var show_importexport = function(show, importexport) {
			if (show) {
				importexport_ocontainer.style.display = "block";
			} else {
				importexport_state = null;
				importexport_ocontainer.style.display = "none";
			}
			if (importexport) {
				if (show)
					importexport_state = "import";
				real_import_btn.style.display = "inline-block";
				export_container.style.display = "none";
			} else {
				if (show)
					importexport_state = "export";
				real_import_btn.style.display = "none";
				export_container.style.display = "block";
			}
		};
		var importexport_state = null;
		var import_btn = document_createElement("button");
		import_btn.id = "importbtn";
		import_btn.innerText = _("Import");
		import_btn.title = _("Import settings");
		import_btn.onclick = function() {
			if (importexport_state === "import")
				return show_importexport(false);
			importexport_text.value = "";
			show_importexport(true, true);
		};
		topbtns_holder.appendChild(import_btn);
		var export_btn = document_createElement("button");
		export_btn.id = "exportbtn";
		export_btn.innerText = _("Export");
		export_btn.title = _("Export settings");
		export_btn.onclick = function() {
			if (importexport_state === "export")
				return show_importexport(false);
			var newsettings = deepcopy(settings);
			get_value("settings_version", function(value) {
				if (value !== void 0)
					newsettings.settings_version = value;
				importexport_text.value = JSON_stringify(newsettings);
				show_importexport(true, false);
			});
		};
		topbtns_holder.appendChild(export_btn);
		var enabled_map = {};
		var reason_map = {};
		var check_sub_option = function(meta, reason) {
			if (typeof reason === "undefined") {
				reason = {};
			}
			var enabled = true;
			var prepare_array = function(value) {
				var result = deepcopy(value);
				if (!result) {
					return null;
				}
				if (typeof result === "string") {
					result = deepcopy(settings_conditions[result]);
				}
				if (!is_array(result)) {
					result = [result];
				}
				var newresult = [];
				array_foreach(result, function(single) {
					if (single._condition) {
						var cond = deepcopy(settings_conditions[single._condition]);
						if (!is_array(cond))
							cond = [cond];
						array_foreach(cond, function(scond) {
							obj_foreach(single, function(key, value) {
								if (key === "_condition")
									return;
								scond[key] = value;
							});
							newresult.push(scond);
						});
					} else {
						newresult.push(single);
					}
				});
				result = [];
				array_foreach(newresult, function(single) {
					result.push(single);
					var profiled_keys = [];
					obj_foreach(single, function(key, value) {
						var meta = settings_meta[key];
						if (!meta)
							return;
						if (meta.profiled) {
							profiled_keys.push(key);
						}
					});
					if (profiled_keys.length) {
						for (var i = 0; i < num_profiles; i++) {
							var new_single = deepcopy(single);
							array_foreach(profiled_keys, function(key) {
								var profiled_key = "t" + (i + 2) + "_" + key;
								new_single[profiled_key] = new_single[key];
								delete new_single[key];
							});
							new_single._auto = true;
							result.push(new_single);
						}
					}
				});
				return result;
			};
			var requires = prepare_array(meta.requires);
			var disabled_if = prepare_array(meta.disabled_if);
			if (!meta.imu_enabled_exempt) {
				if (!settings.imu_enabled) {
					enabled = false;
				}
			}
			reason.good = [];
			reason.bad = [];
			if (enabled && requires) {
				enabled = check_validity(requires, reason);
				reason.good = [];
			}
			if (enabled && disabled_if) {
				reason.good = [];
				reason.bad = [];
				enabled = !check_validity(disabled_if, reason);
				reason.bad = [];
			}
			return enabled;
		};
		var check_option = function(setting) {
			var meta = settings_meta[setting];
			enabled_map[setting] = "processing";
			reason_map[setting] = {};
			var enabled = check_sub_option(meta, reason_map[setting]);
			enabled_map[setting] = enabled;
			return enabled;
		};
		var check_validity = function(array, reason) {
			for (var i = 0; i < array.length; i++) {
				var current = array[i];
				var current_valid = true;
				var good_reason, bad_reason;
				if (typeof reason !== "undefined") {
					good_reason = [];
					bad_reason = [];
				}
				for (var required_setting in current) {
					if (required_setting[0] === "_")
						continue;
					var required_value = current[required_setting];
					var value = settings[required_setting];
					if (is_array(value) && !is_array(required_value))
						value = value[0];
					if (!(required_setting in enabled_map)) {
						check_option(required_setting);
					}
					if (enabled_map[required_setting] === "processing") {
						console_error("Dependency cycle detected for:", current, ",", required_setting);
						return;
					}
					var current_reason = {
						setting: required_setting,
						required_value: required_value,
						current_value: value,
						enabled: enabled_map[required_setting],
						auto: !!current._auto
					};
					var value_is_required = value === required_value;
					if (!value_is_required && settings_meta[required_setting].type === "keysequence" && required_value === true) {
						value_is_required = value && !!value.length;
					}
					if (enabled_map[required_setting] && value_is_required) {
						if (typeof good_reason !== "undefined") {
							good_reason.push(current_reason);
						}
					} else {
						current_valid = false;
						if (typeof bad_reason !== "undefined") {
							bad_reason.push(current_reason);
						}
					}
					if (!current_valid && typeof reason === "undefined") {
						break;
					}
				}
				if (typeof reason !== "undefined") {
					reason.good.push(good_reason);
					reason.bad.push(bad_reason);
				}
				if (current_valid) {
					return true;
				}
			}
			return false;
		};
		var get_option_from_options = function(options, option) {
			if (option in options)
				return options[option];
			for (var option_name in options) {
				if (/^_group/.test(option_name)) {
					return get_option_from_options(options[option_name], option);
				}
			}
			return null;
		};
		var is_nonempty_reason = function(goodbad) {
			for (var i = 0; i < goodbad.length; i++) {
				if (goodbad[i].length !== 0)
					return true;
			}
			return false;
		};
		var is_reason_goodbad = function(reason) {
			if (is_nonempty_reason(reason.good))
				return "good";
			if (is_nonempty_reason(reason.bad))
				return "bad";
			return null;
		};
		var fill_requirements = function(reason, div) {
			div.textContent = "";
			if (!settings.settings_show_requirements)
				return;
			var goodbad = is_reason_goodbad(reason);
			if (!goodbad)
				return;
			var requires_p = document_createElement("p");
			requires_p.innerText = _("Requires:");
			div.appendChild(requires_p);
			var els = [];
			var array = reason[goodbad];
			for (var i = 0; i < array.length; i++) {
				if (array[i].length === 0)
					continue;
				var ul = document_createElement("ul");
				var ul_valid = false;
				for (var j = 0; j < array[i].length; j++) {
					var single_reason = array[i][j];
					if (single_reason.auto)
						continue;
					var option_meta = null;
					var option_name = single_reason.setting;
					var option_cat = null;
					if (single_reason.setting in settings_meta) {
						option_meta = settings_meta[single_reason.setting];
						option_name = _(option_meta.name);
						option_cat = option_meta.category || null;
						if (option_cat) {
							option_cat = _(categories[option_cat]);
						}
					}
					var cat_prefix = "";
					var wanted_value = single_reason.required_value;
					var input_id = "input_" + single_reason.setting + "_" + single_reason.required_value;
					if (input_id in label_texts) {
						wanted_value = label_texts[input_id];
					} else if (option_cat) { // FIXME: really hacky check to see if in same tab or not
						cat_prefix = "(" + option_cat + ") ";
					}
					var equals = "=";
					if (goodbad === "good")
						equals = "!=";
					var li = document_createElement("li");
					li.innerText = cat_prefix + option_name + " " + equals + " " + wanted_value;
					ul.appendChild(li);
					ul_valid = true;
				}
				if (ul_valid)
					els.push(ul);
			}
			var newels = [];
			for (var i = 0; i < els.length - 1; i++) {
				newels.push(els[i]);
				var or_p = document_createElement("p");
				or_p.innerText = _("Or:");
				newels.push(or_p);
			}
			newels.push(els[els.length - 1]);
			for (var i = 0; i < newels.length; i++) {
				div.appendChild(newels[i]);
			}
		};
		function check_disabled_options() {
			var options = options_el.querySelectorAll("div.option");
			enabled_map = {};
			for (var i = 0; i < options.length; i++) {
				var setting = options[i].id.replace(/^option_/, "");
				var enabled = check_option(setting);
				if (enabled) {
					options[i].classList.remove("disabled");
					options[i].classList.remove("disabled-hidden");
					options[i].getElementsByClassName("requirements")[0].classList.add("hidden");
					var meta = settings_meta[setting];
					var meta_options = meta.options;
					var regexp = new RegExp("^input_" + setting + "_");
					var els = options[i].querySelectorAll("input, textarea, button, select, option");
					for (var j = 0; j < els.length; j++) {
						var input = els[j];
						input.disabled = false;
						if (meta_options) {
							var option_name = input.id.replace(regexp, "");
							if (option_name !== input.id) {
								var option_value = get_option_from_options(meta_options, option_name);
								if (option_value) {
									if (!check_sub_option(option_value)) {
										input.disabled = true;
									}
								}
							}
						}
					}
				} else {
					options[i].classList.add("disabled");
					if (!settings.settings_show_disabled) {
						options[i].classList.add("disabled-hidden");
					} else if (!settings.settings_show_disabled_profiles && /^t[0-9]+_/.test(setting)) {
						var trigger_value = settings["mouseover_trigger_key_" + setting.replace(/^(t[0-9]+)_.*/, "$1")];
						if (trigger_value.length <= 0) {
							options[i].classList.add("disabled-hidden");
						}
					}
					var els = options[i].querySelectorAll("input, textarea, button, select");
					for (var j = 0; j < els.length; j++) {
						var input = els[j];
						input.disabled = true;
					}
					var requirements_div = options[i].getElementsByClassName("requirements")[0];
					requirements_div.classList.remove("hidden");
					fill_requirements(reason_map[setting], requirements_div);
				}
			}
		}
		function show_warnings() {
			var options = options_el.querySelectorAll("div.option");
			for (var i = 0; i < options.length; i++) {
				var setting = options[i].id.replace(/^option_/, "");
				var meta = settings_meta[setting];
				if (meta.warning) {
					var warning = meta.warning[settings[setting] + ""];
					var el = options[i].querySelector(".warning");
					if (!el)
						continue;
					if (warning) {
						el.innerText = warning;
						el.style.display = "block";
					} else {
						el.style.display = "none";
					}
				}
			}
		}
		function show_saved_message(meta) {
			set_saved_text(get_default_saved_text(meta));
			saved_el.setAttribute("style", "");
			saved_el.classList.remove("fadeout");
			if (saved_timeout)
				clearTimeout(saved_timeout);
			saved_timeout = setTimeout(function() {
				saved_el.classList.add("fadeout");
			}, 2000);
		}
		function md_to_html(parent, text) {
			var current_el = null;
			var current_text = "";
			var current_tag = null;
			var apply_tag = function() {
				if (current_text.length === 0)
					return;
				if (current_tag === "`") {
					current_el = document_createElement("code");
				} else {
					current_el = document_createElement("span");
				}
				current_el.innerText = current_text;
				current_text = "";
				parent.appendChild(current_el);
			};
			if (string_indexof(text, "`") < 0 && string_indexof(text, "\n") < 0) {
				current_text = text;
				apply_tag();
				return;
			}
			for (var i = 0; i < text.length; i++) {
				if (text[i] === current_tag) {
					apply_tag();
					current_tag = null;
					continue;
				}
				if (text[i] === "`") {
					apply_tag();
					current_tag = text[i];
					continue;
				}
				if (text[i] === "\n") {
					apply_tag();
					parent.appendChild(document_createElement("br"));
					continue;
				}
				current_text += text[i];
			}
			apply_tag();
		}
		var tabscontainer;
		if (settings.settings_tabs) {
			tabscontainer = document_createElement("div");
			tabscontainer.id = "tabs";
			options_el.appendChild(tabscontainer);
		}
		var category_els = {};
		var subcategory_els = {};
		if (!(current_options_tab in categories)) {
			current_options_tab = "general";
		}
		for (var category in categories) {
			var catname = _(categories[category]);
			var div = document_createElement("div");
			div.id = "cat_" + category;
			div.classList.add("category");
			category_els[category] = [div];
			if (settings.settings_tabs) {
				div.classList.add("tabbed");
				var tab = document_createElement("span");
				tab.classList.add("tab");
				tab.id = "tab_cat_" + category;
				tab.innerText = catname;
				(function(category) {
					tab.onclick = function() {
						current_options_tab = category;
						window.location.hash = "cat_fake_" + category;
						do_options();
					};
				})(category);
				if (category === current_options_tab) {
					tab.classList.add("active");
				} else {
					div.style.display = "none";
				}
				category_els[category].push(tab);
				tabscontainer.appendChild(tab);
			} else {
				var h2 = document_createElement("h2");
				h2.innerText = catname;
				div.appendChild(h2);
			}
			var subdiv = document_createElement("div");
			subdiv.id = "subcat_" + category;
			subdiv.classList.add("subcat");
			subdiv.classList.add("frame");
			div.appendChild(subdiv);
			subcategory_els[category] = subdiv;
			if (category in subcategories) {
				for (var subcat in subcategories[category]) {
					var newsubdiv = document_createElement("div");
					var subcat_full = category + "_" + subcat;
					newsubdiv.id = "subcat_" + subcat_full;
					newsubdiv.classList.add("subcat");
					newsubdiv.classList.add("frame");
					var h3 = document_createElement("h3");
					h3.innerText = _(subcategories[category][subcat]);
					newsubdiv.appendChild(h3);
					div.appendChild(newsubdiv);
					subcategory_els[subcat_full] = newsubdiv;
				}
			}
			options_el.appendChild(div);
		}
		var show_advanced = settings.advanced_options;
		var normalize_value = function(value) {
			if (is_array(value) && value.length === 1) {
				return JSON_stringify(value[0]);
			}
			return JSON_stringify(value);
		};
		var category_settings = {};
		var label_texts = {};
		var add_setting_dom = function(setting) {
			var meta = settings_meta[setting];
			if (!meta) {
				return;
			}
			if (!(setting in orig_settings))
				return;
			var value = settings[setting];
			var orig_value = orig_settings[setting];
			if (meta.hidden)
				return;
			if (meta.userscript_only && !is_userscript)
				return;
			if (meta.extension_only && !is_extension)
				return;
			if (meta.advanced && !show_advanced)
				return;
			category_settings[meta.category] = true;
			if (settings.settings_tabs && meta.category !== current_options_tab)
				return;
			var option = document_createElement("div");
			option.classList.add("option");
			option.id = "option_" + setting;
			if (/^t[0-9]+_/.test(setting) || /_t[0-9]+$/.test(setting)) {
				option.classList.add("trigger_profile");
			}
			var table = document_createElement("table");
			table.classList.add("option-table");
			var tr = document_createElement("tr");
			table.appendChild(tr);
			var name = document_createElement("strong");
			md_to_html(name, _(meta.name));
			var description = _(meta.description);
			if (meta.description_userscript && is_userscript)
				description = _(meta.description_userscript);
			if (description) {
				name.title = description;
			} else {
				name.classList.add("no-title");
			}
			var name_td = document_createElement("td");
			name_td.classList.add("name_td");
			name_td.classList.add("name_td_va_middle");
			var revert_btn = document.createElement("button");
			revert_btn.innerText = "\u2b8c";
			revert_btn.classList.add("revert-button");
			revert_btn.title = _("Revert");
			revert_btn.onclick = function() {
				if (revert_btn.disabled)
					return;
				do_update_setting(setting, orig_value, meta);
				run_soon(do_options);
			};
			var check_value_orig_different = function(value) {
				var value_norm = normalize_value(value);
				var orig_norm = normalize_value(orig_value);
				if (meta.type === "keysequence") {
					value_norm = JSON_stringify(normalize_keychord(value));
					orig_norm = JSON_stringify(normalize_keychord(orig_value));
				}
				var value_orig_different = value_norm !== orig_norm;
				if (value_orig_different) {
					name_td.classList.add("value_modified");
					name_td.appendChild(revert_btn);
				} else {
					name_td.classList.remove("value_modified");
					if (revert_btn.parentElement === name_td)
						name_td.removeChild(revert_btn);
				}
			};
			var do_update_setting_real = function(setting, new_value, meta) {
				update_setting(setting, new_value);
				run_soon(function() {
					check_value_orig_different(new_value);
				});
				show_saved_message(meta);
			};
			var do_update_setting = function(setting, new_value, meta) {
				if (is_extension && meta.required_permission) {
					request_permission(meta.required_permission, function(granted) {
						if (granted) {
							do_update_setting_real(setting, new_value, meta);
						} else {
							do_options();
						}
					});
				} else {
					do_update_setting_real(setting, new_value, meta);
				}
			};
			name_td.appendChild(name);
			check_value_orig_different(value);
			tr.appendChild(name_td);
			var value_td = document_createElement("td");
			value_td.classList.add("value_td");
			var type = "options";
			var option_list = {};
			if (typeof orig_value === "boolean") {
				type = "options";
				option_list["true"] = { name: _("yes") };
				option_list["false"] = { name: _("no") };
				if (value)
					option_list["true"].checked = true;
				else
					option_list["false"].checked = true;
			} else if (meta.options) {
				if (meta.options._randomize) {
					var keys = Object.keys(meta.options);
					var new_options = {};
					for (var option_name in meta.options) {
						if (option_name[0] == "_" || meta.options[option_name].is_null) {
							new_options[option_name] = meta.options[option_name];
						}
					}
					keys.sort(function() {
						return (Math_floor(Math_random() * 2) ? 1 : -1);
					});
					for (var i = 0; i < keys.length; i++) {
						if (keys[i] in new_options)
							continue;
						new_options[keys[i]] = meta.options[keys[i]];
					}
					meta.options = new_options;
				}
				if (meta.options._type === "combo") {
					type = "combo";
				} else {
					type = "options";
					option_list = deepcopy(meta.options);
					var check_optionlist = function(val, list) {
						if (val in list) {
							list[val].checked = true;
						} else {
							for (var item in list) {
								if (item.match(/^_group/)) {
									check_optionlist(val, list[item]);
								}
							}
						}
					};
					if (is_array(value)) {
						array_foreach(value, function(val) {
							check_optionlist(val, option_list);
						});
					} else {
						check_optionlist(value, option_list);
					}
				}
			} else if (meta.type) {
				if (meta.type === "textarea" ||
					meta.type === "keysequence" ||
					meta.type === "number" ||
					meta.type === "lineedit")
					type = meta.type;
			}
			if (type === "options") {
				var option_type = option_list._type;
				if (!option_type)
					option_type = "or";
				var add_setting = function(parent, op, val, option_type, group, group_type) {
					var id = "input_" + setting + "_" + op;
					var name = setting;
					if (group && group_type === "and")
						name += "_" + group;
					var input = document_createElement("input");
					if (option_type === "or" && false)
						input.setAttribute("type", "radio");
					else if (option_type === "and" || true)
						input.setAttribute("type", "checkbox");
					input.name = name;
					input.value = op;
					input.id = id;
					if (val.checked)
						input.setAttribute("checked", "true");
					input.addEventListener("change", function(event) {
						var value = this.value;
						if (value === "true") {
							value = true;
						}
						if (value === "false")
							value = false;
						if (this.checked) {
							if (group && group_type === "or") {
								for (var child_i = 0; child_i < value_td.children.length; child_i++) {
									var child = value_td.children[child_i];
									if (child.id !== (setting + group)) {
										for (var subchild_i = 0; subchild_i < child.children.length; subchild_i++) {
											var subchild = child.children[subchild_i];
											if (subchild.tagName === "INPUT") {
												subchild.checked = false;
											}
										}
									}
								}
							}
							if (option_type === "or") {
								for (var child_i = 0; child_i < parent.children.length; child_i++) {
									var child = parent.children[child_i];
									if (child.tagName === "INPUT" && child.id != input.id) {
										child.checked = false;
									}
								}
							}
						} else {
							var onechecked = false;
							for (var child_i = 0; child_i < value_td.children.length; child_i++) {
								var child = value_td.children[child_i];
								for (var subchild_i = 0; subchild_i < child.children.length; subchild_i++) {
									var subchild = child.children[subchild_i];
									if (subchild.tagName === "INPUT") {
										if (subchild.checked) {
											onechecked = true;
											break;
										}
									}
								}
								if (onechecked)
									break;
							}
							if (!onechecked) {
								this.checked = true;
							}
						}
						var new_value = value;
						if (group || option_type !== "or") {
							var out_value = [];
							var inputs = value_td.getElementsByTagName("input");
							for (var child_i = 0; child_i < inputs.length; child_i++) {
								var child = inputs[child_i];
								if (child.checked) {
									out_value.push(child.value);
								}
							}
							new_value = out_value;
							do_update_setting(setting, new_value, meta);
						} else {
							do_update_setting(setting, value, meta);
						}
						check_disabled_options();
						show_warnings();
					});
					parent.appendChild(input);
					var label = document_createElement("label");
					label.setAttribute("for", id);
					label_texts[id] = _(val.name);
					if (label_texts[id]) {
						label.innerText = label_texts[id];
					} else {
						label.innerHTML = "&nbsp;";
					}
					if (val.description) {
						label.title = _(val.description);
					}
					parent.appendChild(label);
				};
				for (var op in option_list) {
					if (option_list[op].extension_only && !is_extension)
						continue;
					if (op.match(/^_group/)) {
						var option_type1 = option_list[op]._type;
						if (!option_type1)
							option_type1 = "or";
						var sub = document_createElement("div");
						sub.classList.add("group");
						sub.id = setting + op;
						for (var op1 in option_list[op]) {
							if (!op1.match(/^_/))
								add_setting(sub, op1, option_list[op][op1], option_type1, op, option_type);
						}
						value_td.appendChild(sub);
					} else if (!op.match(/^_/)) {
						add_setting(value_td, op, option_list[op], option_type);
					}
				}
			} else if (type === "textarea") {
				var sub = document_createElement("table");
				var sub_tr = document_createElement("tr");
				var sub_ta_td = document_createElement("td");
				sub_ta_td.style.verticalAlign = "middle";
				var sub_button_tr = document_createElement("tr");
				var sub_button_td = document_createElement("td");
				sub_button_td.style.textAlign = "center";
				var textarea = document_createElement("textarea");
				textarea.style.height = "5em";
				textarea.style.width = "20em";
				if (value)
					textarea.value = value;
				var savebutton = document_createElement("button");
				savebutton.innerText = _("save");
				savebutton.onclick = function() {
					do_update_setting(setting, textarea.value, meta);
					check_disabled_options();
				};
				sub_ta_td.appendChild(textarea);
				sub_button_td.appendChild(savebutton);
				sub_button_tr.appendChild(sub_button_td);
				sub_tr.appendChild(sub_ta_td);
				sub.appendChild(sub_tr);
				sub.appendChild(sub_button_tr);
				value_td.appendChild(sub);
			} else if (type === "number" || type === "lineedit") {
				var sub = document_createElement("table");
				var sub_tr = document_createElement("tr");
				var sub_in_td = document_createElement("td");
				sub_in_td.style = "display:inline";
				var input = document_createElement("input");
				if (false && type === "number") {
					input.type = "number";
				} else {
					input.type = "text";
				}
				input.setAttribute("spellcheck", false);
				if (type === "number") {
					input.style = "text-align:right";
					if (meta.number_max !== void 0)
						input.setAttribute("max", meta.number_max.toString());
					if (meta.number_min !== void 0)
						input.setAttribute("min", meta.number_min.toString());
					if (meta.number_int)
						input.setAttribute("step", "1");
				}
				if (value !== void 0)
					input.value = value;
				input.oninput = input.onblur = function(e) {
					var need_correct = false;
					var do_update = true;
					if (e.type === "blur") {
						need_correct = true;
						do_update = false;
					}
					var value = input.value.toString();
					if (type === "number") {
						value = parseFloat(value);
						var orig_value = value;
						if (isNaN(value)) {
							if (!need_correct)
								return;
							value = 0;
						}
						if (meta.number_int) {
							value = parseInt(value);
						}
						if (meta.number_max !== void 0)
							value = Math_min(value, meta.number_max);
						if (meta.number_min !== void 0)
							value = Math_max(value, meta.number_min);
						if (isNaN(value)) {
							console_error("Error: number is NaN after min/max");
							return;
						}
						if (meta.number_int || value !== orig_value)
							input.value = value;
						value = parseFloat(value);
						if (e.type === "blur" && value !== orig_value) {
							do_update = true;
						}
					}
					if (do_update)
						do_update_setting(setting, value, meta);
				};
				var sub_units_td = document_createElement("td");
				sub_units_td.classList.add("number_units");
				if (meta.number_unit)
					sub_units_td.innerText = _(meta.number_unit);
				sub_tr.appendChild(input);
				sub_tr.appendChild(sub_units_td);
				sub.appendChild(sub_tr);
				value_td.appendChild(sub);
			} else if (type === "keysequence") {
				var sub = document_createElement("table");
				var values = deepcopy(value);
				if (values.length > 0 && !is_array(values[0]))
					values = [values];
				var indices = [];
				for (var i = 0; i < values.length; i++) {
					indices.push(i);
				}
				var is_only_keyseq = function() {
					var active_indices = 0;
					for (var i = 0; i < indices.length; i++) {
						if (indices[i] >= 0)
							active_indices++;
					}
					return active_indices < 2;
				};
				var update_keyseq_setting = function() {
					var result = [];
					for (var i = 0; i < indices.length; i++) {
						if (indices[i] >= 0 && values[i].length > 0) {
							result.push(values[i]);
						}
					}
					do_update_setting(setting, result, meta);
					check_disabled_options();
				};
				var recalculate_removebtns = function() {
					var do_remove = !meta.keyseq_allow_none && is_only_keyseq();
					for (var i = 0; i < sub.children.length; i++) {
						var child = sub.children[i];
						var removebtns = child.getElementsByClassName("removebtn");
						if (removebtns.length > 0) {
							if (do_remove) {
								removebtns[0].style.display = "none";
							} else {
								removebtns[0].style.display = "initial";
							}
						}
					}
				};
				var add_keyseq_tr = function(index, start_recording) {
					var sub_tr = document_createElement("tr");
					sub_tr.classList.add("keyseq");
					var sub_key_td = document_createElement("td");
					sub_key_td.classList.add("record_keybinding");
					if (value) {
						sub_key_td.innerText = get_trigger_key_texts(values)[index];
					}
					var sub_record_td = document_createElement("td");
					sub_record_td.style = "display:inline";
					var sub_record_btn = document_createElement("button");
					sub_record_btn.innerText = _("Record");
					var do_record = function() {
						if (recording_keys) {
							if (keysequence_valid(options_chord)) {
								values[index] = options_chord;
								update_keyseq_setting();
								do_cancel();
							}
						} else {
							options_chord = [];
							current_options_chord = [];
							recording_keys = function() {
								var our_chord = options_chord;
								if (our_chord.length === 0)
									our_chord = values[index];
								sub_key_td.innerText = get_trigger_key_texts(our_chord);
								if (keysequence_valid(options_chord)) {
									sub_record_btn.classList.remove("disabled");
								} else {
									sub_record_btn.classList.add("disabled");
								}
							};
							sub_record_btn.innerText = _("save");
							sub_cancel_btn.style = "display:inline-block";
						}
					};
					sub_record_btn.onmousedown = do_record;
					var sub_cancel_btn = document_createElement("button");
					sub_cancel_btn.innerText = _("Cancel");
					sub_cancel_btn.style = "display:none";
					var do_cancel = function() {
						recording_keys = false;
						sub_record_btn.innerText = _("Record");
						sub_record_btn.classList.remove("disabled");
						sub_cancel_btn.style = "display:none";
						sub_key_td.innerText = get_trigger_key_texts(values)[index];
					};
					sub_cancel_btn.onmousedown = do_cancel;
					var sub_remove_btn = document_createElement("button");
					sub_remove_btn.innerText = "\xD7";
					sub_remove_btn.title = _("Remove");
					sub_remove_btn.classList.add("removebtn");
					sub_remove_btn.classList.add("small");
					if (!meta.keyseq_allow_none && is_only_keyseq()) {
						sub_remove_btn.style = "display:none";
					}
					sub_remove_btn.onclick = function() {
						if (!meta.keyseq_allow_none && is_only_keyseq())
							return;
						recording_keys = false;
						indices[index] = -1;
						for (var i = index + 1; i < indices.length; i++) {
							indices[i]--;
						}
						sub_tr.parentElement.removeChild(sub_tr);
						recalculate_removebtns();
						update_keyseq_setting();
					};
					sub_tr.appendChild(sub_key_td);
					sub_record_td.appendChild(sub_record_btn);
					sub_record_td.appendChild(sub_cancel_btn);
					sub_record_td.appendChild(sub_remove_btn);
					sub_tr.appendChild(sub_record_td);
					if (start_recording)
						do_record();
					return sub_tr;
				};
				for (var i = 0; i < indices.length; i++) {
					sub.appendChild(add_keyseq_tr(i));
				}
				var sub_add_tr = document_createElement("tr");
				var sub_add_td = document_createElement("td");
				var sub_add_btn = document_createElement("button");
				sub_add_btn.innerText = "+";
				sub_add_btn.title = _("Add keybinding");
				sub_add_btn.classList.add("small");
				sub_add_btn.onclick = function() {
					var last_index = -1;
					for (var i = indices.length - 1; i >= 0; i--) {
						if (indices[i] >= 0) {
							last_index = indices[i];
							break;
						}
					}
					indices.push(last_index + 1);
					values.push([]);
					sub.insertBefore(add_keyseq_tr(indices.length - 1, true), sub_add_tr);
					recalculate_removebtns();
				};
				sub_add_td.appendChild(sub_add_btn);
				sub_add_tr.appendChild(sub_add_td);
				sub.appendChild(sub_add_tr);
				value_td.appendChild(sub);
			} else if (type === "combo") {
				var sub = document_createElement("select");
				var null_option = null;
				for (var coption in meta.options) {
					if (!coption || coption[0] === '_')
						continue;
					var coption_obj = meta.options[coption];
					var trans_name = coption_obj.name;
					if (!("name_gettext" in coption_obj) || coption_obj.name_gettext) {
						trans_name = _(trans_name);
					}
					var optionid = "input_" + setting + "_" + coption;
					label_texts[optionid] = trans_name;
					var optionel = document_createElement("option");
					optionel.innerText = trans_name;
					optionel.value = coption;
					optionel.id = optionid;
					if (coption_obj.description) {
						optionel.title = _(coption_obj.description);
					}
					if (coption_obj.is_null)
						null_option = coption;
					sub.appendChild(optionel);
				}
				var sub_value = settings[setting];
				if (sub_value === null && null_option) {
					sub_value = null_option;
				}
				sub.value = sub_value;
				sub.onchange = function() {
					var value = sub.value;
					if (value in meta.options && meta.options[value].is_null) {
						value = null;
					}
					do_update_setting(setting, value, meta);
					check_disabled_options();
					show_warnings();
				};
				value_td.appendChild(sub);
			}
			tr.appendChild(value_td);
			option.appendChild(table);
			if (description && settings.settings_visible_description) {
				var description_el = document_createElement("p");
				md_to_html(description_el, description);
				description_el.classList.add("description");
				option.appendChild(description_el);
			}
			if (meta.warning) {
				var warning = document_createElement("p");
				warning.style.display = "none";
				warning.classList.add("warning");
				option.appendChild(warning);
			}
			var requirements = document_createElement("div");
			requirements.classList.add("requirements");
			requirements.classList.add("hidden");
			option.appendChild(requirements);
			if (meta.example_websites) {
				var examples = document_createElement("ul");
				examples.classList.add("examples");
				for (var example_i = 0; example_i < meta.example_websites.length; example_i++) {
					var example_text = meta.example_websites[example_i];
					var example_el = document_createElement("li");
					example_el.innerText = _(example_text);
					examples.appendChild(example_el);
				}
				option.appendChild(examples);
			}
			if (meta.documentation) {
				var get_title = function(expanded) {
					var arrow = "%E2%AF%88";
					if (expanded) {
						arrow = "%E2%AF%86";
					}
					return decodeURIComponent(arrow) + " " + _(meta.documentation.title);
				};
				var text = get_title(false);
				var spoiler_title = document_createElement("span");
				spoiler_title.classList.add("spoiler-title");
				spoiler_title.innerText = text;
				var expanded = false;
				spoiler_title.onclick = function() {
					expanded = !expanded;
					if (expanded) {
						spoiler_contents.style.display = "block";
					} else {
						spoiler_contents.style.display = "none";
					}
					spoiler_title.innerText = get_title(expanded);
				};
				var spoiler_contents = document_createElement("div");
				spoiler_contents.classList.add("spoiler-contents");
				spoiler_contents.style.display = "none";
				spoiler_contents.innerHTML = meta.documentation.value;
				option.appendChild(spoiler_title);
				option.appendChild(spoiler_contents);
			}
			var errordiv = document_createElement("div");
			errordiv.classList.add("error");
			errordiv.classList.add("hidden");
			option.appendChild(errordiv);
			if (meta.category) {
				var subcat = meta.category;
				if (meta.subcategory)
					subcat += "_" + meta.subcategory;
				subcategory_els[subcat].appendChild(option);
			} else {
				options_el.appendChild(option);
			}
		};
		var settingslist = Object.keys(settings);
		if (settings.settings_alphabetical_order) {
			settingslist.sort(function(a, b) {
				var a_meta = settings_meta[a];
				var b_meta = settings_meta[b];
				if (!a_meta || !b_meta || !a_meta.name || !b_meta.name) {
					return a.localeCompare(b);
				}
				return _(a_meta.name).localeCompare(_(b_meta.name));
			});
		}
		for (var i = 0; i < settingslist.length; i++) {
			add_setting_dom(settingslist[i]);
		}
		check_disabled_options();
		show_warnings();
		for (var category in category_els) {
			var our_els = category_els[category];
			if (!(category in category_settings)) {
				for (var i = 0; i < our_els.length; i++) {
					our_els[i].parentNode.removeChild(our_els[i]);
				}
			}
		}
		for (var subcategory in subcategory_els) {
			var our_el = subcategory_els[subcategory];
			if (our_el.querySelectorAll(".option").length === 0) {
				our_el.parentNode.removeChild(our_el);
			}
		}
		document.body.appendChild(saved_el);
		options_el_real.appendChild(options_el);
		options_el = options_el_real;
	}
	function get_single_setting_raw(value) {
		if (is_array(value))
			return value[0];
		return value;
	}
	function get_single_setting(setting) {
		return get_single_setting_raw(settings[setting]);
	}
	function parse_value(value) {
		try {
			if (value === void 0) {
				return value;
			} else if (value === "true") {
				return true;
			} else if (value === "false") {
				return false;
			}
			return JSON_parse(value);
		} catch (e) {
			return value;
		}
	}
	function serialize_value(value) {
		return JSON_stringify(value);
	}
	function get_values(keys, cb) {
		if (is_extension) {
			extension_send_message({
				type: "getvalue",
				data: keys
			}, function(response) {
				response = response.data;
				obj_foreach(response, function(key, value) {
					response[key] = parse_value(value);
				});
				cb(response);
			});
		} else if (typeof GM_getValue !== "undefined" &&
			userscript_manager !== "FireMonkey") {
			var response = {};
			array_foreach(keys, function(key) {
				response[key] = parse_value(GM_getValue(key, void 0));
			});
			return cb(response);
		} else if (typeof GM !== "undefined" && GM.getValue) {
			var total_keys = 0;
			var response = {};
			array_foreach(keys, function(key) {
				GM.getValue(key, void 0).then(function(value) {
					response[key] = parse_value(value);
					if (++total_keys >= keys.length) {
						cb(response);
					}
				}, function(error) {
					console_error(error);
					if (++total_keys >= keys.length) {
						cb(response);
					}
				});
			});
		} else {
			cb({});
		}
	}
	function get_value(key, cb) {
		return get_values([key], function(data) {
			return cb(data[key]);
		});
	}
	var updating_options = 0;
	function set_value(key, value, cb) {
		if (key in settings_meta && settings_meta[key].onedit) {
			settings_meta[key].onedit(value);
		}
		value = serialize_value(value);
		if (is_extension) {
			var kv = {};
			kv[key] = value;
			updating_options++;
			extension_send_message({
				type: "setvalue",
				data: kv
			}, function() {
				updating_options--;
				cb && cb();
			});
		} else if (typeof GM_setValue !== "undefined") {
			GM_setValue(key, value);
			cb && cb();
		} else if (typeof GM !== "undefined" && GM.setValue) {
			GM.setValue(key, value).then(function() {
				cb && cb();
			});
		} else {
			cb && cb();
		}
	}
	function update_setting(key, value) {
		if (value === settings[key])
			return false;
		value = deepcopy(value);
		settings[key] = value;
		if (is_extension) {
			if (!(key in settings_history))
				settings_history[key] = [];
			settings_history[key].push(value);
		}
		set_value(key, value);
		return true;
	}
	function set_default_value(key, value) {
		if (!(key in user_defined_settings)) {
			settings[key] = value;
		}
	}
	function settings_updated_cb(changes) {
		if (!settings.allow_live_settings_reload)
			return;
		var changed = false;
		for (var key in changes) {
			if (changes[key].newValue === void 0)
				continue;
			var newvalue = JSON_parse(changes[key].newValue);
			if (key in settings_history) {
				var index = array_indexof(settings_history[key], newvalue);
				var pass = false;
				if (index >= 0 && index < settings_history[key].length - 1) {
					pass = true;
				}
				settings_history[key].splice(index, 1);
				if (pass)
					continue;
			}
			var setting_updated = update_setting_from_host(key, newvalue);
			changed = setting_updated || changed;
			if (setting_updated && key in settings_meta && "onupdate" in settings_meta[key]) {
				settings_meta[key].onupdate();
			}
		}
		if (changed && updating_options <= 0 && is_options_page) {
			do_options();
		}
	}
	;
	function upgrade_settings_with_version(version, new_settings, cb) {
		if (!version) {
			version = 0;
		} else if (typeof version !== "number") {
			version = parseInt(version);
			if (isNaN(version))
				version = 0;
		}
		if (new_settings === void 0)
			new_settings = settings;
		var changed = false;
		if (version === 0) {
			if (new_settings.mouseover_trigger) {
				var trigger_keys = [];
				for (var i = 0; i < new_settings.mouseover_trigger.length; i++) {
					var trigger = new_settings.mouseover_trigger[i];
					if (trigger.match(/^delay_[0-9]+/)) {
						var delay = parse_int(new_settings.mouseover_trigger[i].replace(/^delay_([0-9]+).*?$/, "$1"));
						if (delay <= 0 || isNaN(delay))
							delay = false;
						if (typeof delay === "number" && delay >= 10)
							delay = 10;
						update_setting("mouseover_trigger_delay", delay);
						continue;
					}
					trigger_keys.push(trigger);
				}
				if (trigger_keys.length === 0) {
					update_setting("mouseover_trigger_key", orig_settings["mouseover_trigger_key"]);
					update_setting("mouseover_trigger_behavior", "mouse");
				} else {
					update_setting("mouseover_trigger_key", trigger_keys);
					update_setting("mouseover_trigger_behavior", "keyboard");
				}
			}
			update_setting("settings_version", 1);
			changed = true;
			version = 1;
		}
		if (version === 1) {
			var partial_setting = "none";
			var partial_setting_set = new_settings.mouseover_use_fully_loaded_video !== void 0 ||
				new_settings.mouseover_use_fully_loaded_image !== void 0;
			if (partial_setting_set) {
				if (new_settings.mouseover_use_fully_loaded_video === false ||
					new_settings.mouseover_use_fully_loaded_video === void 0) {
					partial_setting = "video";
				}
				if (new_settings.mouseover_use_fully_loaded_image === void 0) {
					if (!orig_settings.mouseover_use_fully_loaded_image) {
						partial_setting = "media";
					}
				} else if (new_settings.mouseover_use_fully_loaded_image === false) {
					partial_setting = "media";
				}
				update_setting("mouseover_allow_partial", partial_setting);
			}
			update_setting("settings_version", 2);
			changed = true;
			version = 2;
		}
		if (version === 2) {
			if ("mouseover_close_on_leave_el" in new_settings) {
				var policy;
				if (new_settings.mouseover_close_on_leave_el) {
					policy = "both";
				} else {
					policy = "popup";
				}
				update_setting("mouseover_close_el_policy", policy);
			}
			update_setting("settings_version", 3);
			changed = true;
			version = 3;
		}
		if (version === 3) {
			if ("mouseover_scroll_behavior" in new_settings) {
				if (get_single_setting_raw(new_settings.mouseover_scroll_behavior) !== "zoom") {
					update_setting("mouseover_scrollx_behavior", new_settings.mouseover_scroll_behavior);
				}
				update_setting("mouseover_scrolly_behavior", new_settings.mouseover_scroll_behavior);
			}
			update_setting("settings_version", 4);
			changed = true;
			version = 4;
		}
		if (version === 4) {
			if ("mouseover_mask_styles" in new_settings && new_settings.mouseover_mask_styles) {
				update_setting("mouseover_mask_styles2", new_settings.mouseover_mask_styles);
				update_setting("mouseover_enable_mask_styles", true);
			}
			update_setting("settings_version", 5);
			changed = true;
			version = 5;
		}
		if (version === 5) {
			if ("mouseover_video_seek_vertical_scroll" in new_settings && new_settings.mouseover_video_seek_vertical_scroll) {
				update_setting("mouseover_scrolly_video_behavior", "seek");
			}
			if ("mouseover_video_seek_horizontal_scroll" in new_settings && new_settings.mouseover_video_seek_horizontal_scroll) {
				update_setting("mouseover_scrollx_video_behavior", "seek");
			}
			update_setting("settings_version", 6);
			changed = true;
			version = 6;
		}
		if (version === 6) {
			if ("mouseover_support_pointerevents_none" in new_settings && new_settings.mouseover_support_pointerevents_none) {
				update_setting("mouseover_find_els_mode", "full");
			}
			update_setting("settings_version", 7);
			changed = true;
			version = 7;
		}
		if (version === 7) {
			if ("mouseover_enable_mask_styles" in new_settings && new_settings.mouseover_enable_mask_styles) {
				update_setting("mouseover_enable_mask_styles2", "always");
			}
			update_setting("settings_version", 8);
			changed = true;
			version = 8;
		}
		if (version === 8) {
			if ("allow_video" in new_settings && !new_settings.allow_video) {
				update_setting("mouseover_allow_video", false);
				for (var i = 0; i < num_profiles; i++) {
					update_setting("t" + (i + 2) + "_mouseover_allow_video", false);
				}
				update_setting("redirect_video", false);
			}
			update_setting("settings_version", 9);
			changed = true;
			version = 9;
		}
		if (version === 9) {
			if ("allow_audio" in new_settings && new_settings.allow_audio) {
				update_setting("mouseover_allow_audio", true);
				for (var i = 0; i < num_profiles; i++) {
					update_setting("t" + (i + 2) + "_mouseover_allow_audio", true);
				}
				update_setting("redirect_audio", true);
			}
			update_setting("settings_version", 10);
			changed = true;
			version = 10;
		}
		if (version === 10) {
			if ("replaceimgs_remove_size_constraints" in new_settings && new_settings.replaceimgs_remove_size_constraints) {
				update_setting("replaceimgs_size_constraints", "remove");
			}
			update_setting("settings_version", 11);
			changed = true;
			version = 11;
		}
		cb(changed);
	}
	function upgrade_settings(cb) {
		try {
			create_blacklist_regexes();
		} catch (e) {
			console_error(e);
		}
		if (!settings.last_update_check) {
			update_setting("last_update_check", Date.now());
		}
		check_updates_if_needed();
		get_value("settings_version", function(version) {
			upgrade_settings_with_version(version, settings, cb);
		});
	}
	function update_setting_from_host(setting, value) {
		if (value !== void 0) {
			if (typeof settings[setting] === "number") {
				value = parseFloat(value);
			}
			user_defined_settings[setting] = value;
			if (value !== settings[setting]) {
				settings[setting] = value;
				return true;
			}
		}
		return false;
	}
	function do_config() {
		if (_nir_debug_) {
			console_log("do_config");
		}
		if (is_userscript || is_extension) {
			var settings_done = 0;
			var total_settings = Object.keys(settings).length + old_settings_keys.length;
			var add_value_change_listeners = function(cb) {
				if (typeof GM_addValueChangeListener === "undefined") {
					return cb();
				}
				setTimeout(function() {
					for (var setting in settings) {
						GM_addValueChangeListener(setting, function(name, oldValue, newValue, remote) {
							if (remote === false)
								return;
							var updated = {};
							updated[name] = { newValue: newValue };
							settings_updated_cb(updated);
						});
					}
				}, 1);
				cb();
			};
			var process_settings = function(settings) {
				get_values(settings, function(values) {
					settings_done += settings.length;
					obj_foreach(values, function(key, value) {
						update_setting_from_host(key, value);
					});
					if (settings_done >= total_settings) {
						upgrade_settings(function(value) {
							add_value_change_listeners(function() {
								start( /*value*/); // commenting out because start doesn't need any arguments
							});
						});
					}
				});
			};
			process_settings(Object.keys(settings));
			process_settings(old_settings_keys);
		} else {
			start();
		}
	}
	var can_use_subzindex = true;
	try {
		if (/^[a-z]+:\/\/[^/]*txxx\.com\//.test(window.location.href)) {
			can_use_subzindex = false;
		}
	} catch (e) { }
	function set_el_all_initial(el) {
		if (can_use_subzindex) {
			el.style.all = "initial";
		} // removing zIndex doesn't work if all = "initial";
		el.style.removeProperty("offset-inline-start");
		el.style.setProperty("transition-duration", "0s", "important");
	}
	function check_bad_if(badif, resp) {
		if (_nir_debug_)
			console_log("check_bad_if", badif, resp);
		if (!badif || !is_array(badif) || badif.length === 0) {
			if (_nir_debug_)
				console_log("check_bad_if (!badif)");
			return false;
		}
		var headers = parse_headers(resp.responseHeaders);
		var check_single_badif = function(badif) {
			if (badif.headers) {
				for (var header in badif.headers) {
					var header_lower = header.toLowerCase();
					var found = false;
					for (var i = 0; i < headers.length; i++) {
						if (headers[i].name.toLowerCase() === header_lower) {
							if (typeof (badif.headers[header]) === "function") {
								found = badif.headers[header](headers[i].value);
							} else if (typeof (badif.headers[header]) === "string") {
								found = headers[i].value === badif.headers[header];
							}
							if (found) {
								break;
							} else {
								return false;
							}
						}
					}
					if (!found)
						return false;
				}
			}
			return true;
		};
		for (var j = 0; j < badif.length; j++) {
			if (check_single_badif(badif[j]))
				return true;
		}
		return false;
	}
	bigimage_recursive.check_bad_if = check_bad_if;
	var mediadelivery_support = {};
	var is_probably_video = function(obj) {
		if (obj.media_info.type === "video")
			return true;
		if (/\.(?:mp4|webm|mkv|mpg|ogv|wmv|m3u8|mpd)(?:[?#].*)?$/i.test(obj.url))
			return true;
		return false;
	};
	var is_probably_audio = function(obj) {
		if (obj.media_info.type === "audio")
			return true;
		if (/\.(?:mp3|m4a|oga|mkv|wma|mp4|ogg)(?:[?#].*)?$/i.test(obj.url))
			return true;
		return false;
	};
	var is_probably_stream = function(obj) {
		return is_probably_video(obj) || is_probably_audio(obj);
	};
	var get_delivery_from_url = function(url) {
		var split_ext = url_basename(url, { split_ext: true });
		if (split_ext[1] === "mpd")
			return "dash";
		if (split_ext[1] === "m3u8")
			return "hls";
		return null;
	};
	var get_mediainfo_from_contenttype = function(contenttype) {
		contenttype = contenttype.replace(/^\s*\[?\s*(.*?)\s*\]?\s*$/, "$1");
		var mediainfo = {
			type: null,
			delivery: null
		};
		if (/^audio\//.test(contenttype))
			mediainfo.type = "audio";
		if (/^video\//.test(contenttype))
			mediainfo.type = "video";
		if (contenttype === "application/oga")
			mediainfo.type = "audio";
		if (contenttype === "application/ogv")
			mediainfo.type = "video";
		if (contenttype === "application/ogg")
			mediainfo.type = "video"; // FIXME?
		if (contenttype === "application/x-mpegurl") {
			mediainfo.type = "video"; // FIXME?
			mediainfo.delivery = "hls";
		}
		return mediainfo.type ? mediainfo : null;
	};
	var is_media_type_supported = function(media_info, processing) {
		if (!media_info) {
			console_error("is_media_type_supported called without media_info");
			return true;
		}
		if (media_info.type !== "image" && media_info.type !== "video" && media_info.type !== "audio") {
			return false;
		}
		if (media_info.type === "video" && processing.deny_video) {
			return false;
		}
		if (media_info.type === "audio" && processing.deny_audio) {
			return false;
		}
		if (!media_info.delivery) {
			return true;
		}
		if (media_info.need_custom_xhr) {
			if (!settings.custom_xhr_for_lib)
				return false;
		}
		if (media_info.delivery) {
			if (media_info.delivery in mediadelivery_support) {
				if (mediadelivery_support[media_info.delivery].active()) {
					return true;
				}
			}
		}
		return false;
	};
	function get_event_error(e) {
		var error = e;
		if (e.path && e.path[0]) {
			error = e.path[0].error;
		}
		if (e.originalTarget) {
			error = e.originalTarget.error;
		}
		return error;
	}
	var trigger_gallery;
	var override_request = function(data, obj) {
		if (!data.method)
			data.method = "GET";
		if (!data.headers)
			data.headers = {};
		if (obj.headers) {
			for (var header in obj.headers) {
				headerobj_set(data.headers, header, obj.headers[header]);
			}
		}
		if (data.url === obj.url) {
			if (!obj.can_head && data.method === "HEAD") {
				data.method = "GET";
			}
		}
		return data;
	};
	var set_common_el_properties = function(el, obj) {
		if (settings.popup_use_anonymous_crossorigin || (obj && !obj.need_credentials)) {
			el.setAttribute("crossorigin", "anonymous");
		}
	};
	function serialize_img(img) {
		var obj = {
			tag: img.tagName.toLowerCase(),
			src: img.src,
			autoplay: img.getAttribute("autoplay"),
			controls: img.getAttribute("controls"),
			loop: img.getAttribute("loop"),
			muted: img.muted,
			volume: img.volume
		};
		if (img.hasAttribute("crossorigin")) {
			obj["crossorigin"] = img.getAttribute("crossorigin");
		}
		return obj;
	}
	function deserialize_img(obj, cb) {
		var el = document_createElement(obj.tag);
		if (obj.tag === "video" || obj.tag === "audio") {
			if (obj.autoplay)
				el.setAttribute("autoplay", obj.autoplay);
			if (obj.controls)
				el.setAttribute("controls", obj.controls);
			if (obj.loop)
				el.setAttribute("loop", obj.loop);
			if (obj.muted)
				el.muted = obj.muted;
			if (obj.volume !== void 0)
				el.volume = obj.volume;
			el.onloadedmetadata = function() {
				cb(el);
			};
		}
		if (obj.crossorigin)
			el.setAttribute("crossorigin", obj.crossorigin);
		el.src = obj.src;
		if (obj.tag !== "video" && obj.tag !== "audio") {
			cb(el);
		}
	}
	var get_window_url = function() {
		return native_URL; // || window.URL || window.webkitURL;
	};
	var create_dataurl = function(blob, cb) {
		var a = new FileReader();
		a.onload = function(e) {
			try {
				cb(e.target.result);
			} catch (e) {
				console_error(e);
				console_error(e.stack);
				cb(null);
			}
		};
		a.readAsDataURL(blob);
	};
	var create_objecturl = function(blob) {
		return get_window_url().createObjectURL(blob);
	};
	var revoke_objecturl = function(objecturl) {
		if (is_element(objecturl))
			objecturl = objecturl.src;
		return get_window_url().revokeObjectURL(objecturl);
	};
	var is_video_el = function(el) {
		if (el.tagName === "VIDEO")
			return true;
		if (el.tagName !== "SOURCE")
			return false;
		if (el.parentElement && el.parentElement.tagName === "VIDEO")
			return true;
		return false;
	};
	var el_media_type_single = function(el) {
		if (!el)
			return null;
		var tagname = get_tagname(el);
		if (tagname === "VIDEO")
			return "video";
		if (tagname === "AUDIO")
			return "audio";
		if (tagname === "PICTURE" || tagname === "IMG")
			return "image";
		return null;
	};
	var el_media_type = function(el) {
		var single = el_media_type_single(el);
		if (single)
			return single;
		if (get_tagname(el) === "SOURCE")
			return el_media_type_single(el.parentElement);
		return null;
	};
	var destroy_image = function(image) {
		if (_nir_debug_)
			console_log("destroy_image", image);
		revoke_objecturl(image.src);
		image.setAttribute("imu-destroyed", "true");
	};
	var create_streaming_el = function(obj, type, processing, good_cb, err_cb) {
		var video = document_createElement(type);
		set_common_el_properties(video, obj);
		if (settings.mouseover_video_autoplay)
			video.setAttribute("autoplay", "autoplay");
		if (settings.mouseover_video_controls || type === "audio")
			video.setAttribute("controls", "controls");
		if (settings.mouseover_video_loop && !settings.mouseover_gallery_move_after_video)
			video.setAttribute("loop", true);
		var volume = parseInt(settings.mouseover_video_volume);
		volume = Math_max(Math_min(volume, 100), 0);
		video.volume = volume / 100.;
		if (settings.mouseover_video_muted) {
			video.muted = true;
		}
		var remove_loaded_metadata_listener = function() {
			video.onloadedmetadata = null;
			video.removeEventListener("loadedmetadata", loaded_metadata_listener);
		};
		var errorhandler = function(e) {
			console_error("Error loading video", get_event_error(e));
			remove_loaded_metadata_listener();
			err_cb();
		};
		var ran_loadedmetadata_listener = false;
		var loaded_metadata_listener = function() {
			if (!ran_loadedmetadata_listener) {
				ran_loadedmetadata_listener = true;
			} else {
				return;
			}
			video.removeEventListener("error", errorhandler, true);
			remove_loaded_metadata_listener();
			if (!processing.running) {
				return err_cb(true);
			}
			if (video.hasAttribute("loop")) {
				if (settings.mouseover_video_autoloop_max && settings.mouseover_video_autoloop_max < video.duration)
					video.removeAttribute("loop");
			}
			var source_video = null;
			if (processing.source && processing.source.el) {
				var source_el = processing.source.el;
				if (source_el.tagName === "SOURCE") {
					source_el = source_el.parentElement;
				}
				if (source_el.tagName === "VIDEO") {
					source_video = source_el;
				}
			}
			if (settings.mouseover_video_resume_from_source && source_video && source_video.currentTime) {
				if (settings.mouseover_video_resume_if_different ||
					Math_abs(source_video.duration - video.duration) < 1 || Math_abs(1 - (source_video.duration / video.duration)) < 0.01) {
					video.currentTime = source_video.currentTime;
				}
			}
			if (settings.mouseover_video_pause_source && source_video) {
				source_video.pause();
			}
			run_soon(function() {
				good_cb(video);
			});
		};
		video.onloadedmetadata = loaded_metadata_listener;
		video.addEventListener("loadedmetadata", loaded_metadata_listener);
		video.onended = function() {
			if (settings.mouseover_enable_gallery && settings.mouseover_gallery_move_after_video) {
				trigger_gallery(1);
			}
		};
		video.addEventListener("error", errorhandler, true);
		return video;
	};
	var create_image_el = function(obj, good_cb, err_cb) {
		var img = document_createElement("img");
		set_common_el_properties(img, obj);
		var end_cbs = function() {
			clearInterval(height_interval);
			img.onload = null;
			img.onerror = null;
		};
		img.onload = function() {
			end_cbs();
			if (img.naturalWidth === 0 || img.naturalHeight === 0) {
				if (_nir_debug_)
					console_log("naturalWidth or naturalHeight == 0", img);
				return err_cb();
			}
			good_cb(img);
		};
		img.onerror = function(e) {
			if (_nir_debug_)
				console_log("Error loading image", img, e);
			end_cbs();
			err_cb();
		};
		var height_interval = setInterval(function() {
			if (img.naturalWidth !== 0 && img.naturalHeight !== 0) {
				end_cbs();
				good_cb(img);
			}
		}, 15);
		return img;
	};
	var set_direct_src = function(el, src, info_obj) {
		if (!el)
			return;
		var set_src = function(el, src) {
			el.src = src;
		};
		var is_incomplete = typeof src === "string" && /^https?:\/\//i.test(src);
		if (is_extension && is_incomplete) {
			extension_send_message({
				type: "override_next_headers",
				data: {
					url: src,
					method: "GET",
					headers: info_obj.headers,
					anonymous: el.getAttribute("crossorigin") === "anonymous",
					content_type: info_obj.content_type || null
				}
			}, function() {
				set_src(el, src);
			});
		} else {
			set_src(el, src);
		}
	};
	var create_media_el = function(obj, type, processing, good_cb, err_cb) {
		if (type === "image") {
			return create_image_el(obj, good_cb, err_cb);
		} else if (type === "video" || type === "audio") {
			return create_streaming_el(obj, type, processing, good_cb, err_cb);
		} else {
			console_error("Currently unsupported media type", type);
			err_cb();
			return null;
		}
	};
	var check_image_refs = new_map();
	var check_image_ref = function(image) {
		if (map_has(check_image_refs, image)) {
			var refs = map_get(check_image_refs, image);
			refs++;
			map_set(check_image_refs, image, refs);
		} else {
			map_set(check_image_refs, image, 1);
		}
	};
	var check_image_unref = function(image) {
		if (!map_has(check_image_refs, image))
			return;
		var refs = map_get(check_image_refs, image);
		refs--;
		if (refs <= 0) {
			destroy_image(image);
			map_remove(check_image_refs, image);
		} else {
			map_set(check_image_refs, image, refs);
		}
	};
	var check_image_cache = null;
	var check_image_cbs = {};
	function check_image_get(obj, cb, processing) {
		nir_debug("check_image_get", "check_image_get", deepcopy(obj), cb, deepcopy(processing));
		if (!obj || !obj[0] || !obj[0].url) {
			return cb(null);
		}
		if (!processing.running) {
			return cb(null);
		}
		var err_cb_real = function(_no_propagate) {
			revoke_objecturl(last_objecturl);
			obj.shift();
			nir_debug("check_image_get", "check_image_get(err_cb):", obj, processing);
			return check_image_get(obj, cb, processing);
		};
		var err_cb = err_cb_real;
		if (processing.set_cache || processing.use_cache) {
			if (!check_image_cache) {
				var maximum_items = settings.popup_cache_itemlimit;
				if (maximum_items <= 0)
					maximum_items = null;
				check_image_cache = new IMUCache({
					max_keys: maximum_items,
					destructor: function(key, value) {
						if (value && value.img)
							check_image_unref(value.img);
					}
				});
			}
		}
		if (!obj[0].media_info) {
			console_warn("No media info", obj[0]);
			obj[0].media_info = deepcopy(default_object.media_info);
		}
		if (!is_media_type_supported(obj[0].media_info, processing)) {
			console_warn("Media type", obj[0].media_info, "is not supported");
			return err_cb();
		}
		if (processing.use_cache) {
			if (check_image_cache.has(obj[0].url)) {
				var cached_result = check_image_cache.get(obj[0].url);
				nir_debug("check_image_get", "check_image_get(cached):", cached_result.img, cached_result.resp, obj[0]);
				var img = cached_result.img;
				var destroyed = false;
				if (img) {
					if ((img.tagName === "VIDEO" || img.tagName === "AUDIO") && !settings.popup_cache_resume_video) {
						img.currentTime = cached_result.currentTime || 0;
					}
					if (img.hasAttribute("imu-destroyed"))
						destroyed = true;
				}
				if (!destroyed) {
					if (cached_result.filesize && !obj[0].filesize) {
						obj[0].filesize = cached_result.filesize;
					}
					if (processing.head) {
						cb(cached_result.resp, obj[0]);
					} else {
						cb(cached_result.img, cached_result.resp.finalUrl, obj[0], cached_result.resp);
					}
					return;
				}
			}
		}
		var method = "GET";
		var responseType = "blob";
		var last_objecturl = null;
		var obj_is_probably_video = is_probably_video(obj[0]);
		var obj_is_probably_stream = is_probably_stream(obj[0]);
		var incomplete_request = false;
		if (processing.incomplete_image || (obj_is_probably_stream && processing.incomplete_video) || processing.head)
			incomplete_request = true;
		if (obj[0].need_blob || obj[0].need_data_url)
			incomplete_request = false;
		if (obj_is_probably_stream && !obj[0].media_info.delivery) {
			obj[0].media_info.delivery = get_delivery_from_url(obj[0].url);
		}
		if (processing.head || incomplete_request) {
			if (incomplete_request && !obj[0].can_head) {
				method = "GET";
			} else {
				method = "HEAD";
			}
			responseType = void 0;
		}
		if (obj[0].url.match(/^data:/) && !obj[0].media_info.delivery) {
			var img = document_createElement("img");
			set_common_el_properties(img, obj[0]);
			img.src = obj[0].url;
			img.onload = function() {
				cb(img, obj[0].url, obj[0]);
			};
			img.onerror = function(e) {
				console_log("Error loading image", e);
				err_cb();
			};
			return;
		}
		var run_cbs = function(our_this, args, no_propagate) {
			if (no_propagate) {
				return final_cb.apply(our_this, args);
			}
			var cbs = check_image_cbs[cb_key];
			if (!cbs) {
				console_error("Already ran cbs?", our_this, args, cb_key);
				return;
			}
			delete check_image_cbs[cb_key];
			array_foreach(cbs, function(cb) {
				cb(our_this, args);
			});
		};
		var final_cb = cb;
		var url = obj[0].url;
		console_log("Trying " + url);
		/*if (false) {
			var video_allowed = settings.allow_video && !processing.deny_video;

			if (obj[0] && obj[0].media_info.type === "video") {
				if (!video_allowed) {
					console_log("Video, skipping due to user setting");
					return err_cb();
				}
			}
		}*/
		if (obj[0].url && /^blob:/.test(obj[0].url)) {
			console_log("Blob URL");
			return err_cb();
		}
		if (obj[0].bad) {
			console_log("Bad image");
			return err_cb();
		}
		if (obj[0].is_pagelink) {
			console_log("Page link");
			return err_cb();
		}
		if (is_invalid_url(obj[0].url)) {
			console_log("Invalid URL");
			return err_cb();
		}
		var url_domain = url.replace(/^([a-z]+:\/\/[^/]*).*?$/, "$1");
		var headers = obj[0].headers;
		if (!headers || Object.keys(headers).length === 0) {
			var referer_host = window.location.href;
			if (!/^https?:\/\//.test(referer_host)) // e.g. file://
				referer_host = "";
			headers = {
				"Referer": referer_host
			};
		} else if (!headers.Origin && !headers.origin) {
		}
		var handled = false;
		var onload_cb = function(resp) {
			if (handled) {
				return;
			}
			handled = true;
			if (!processing.running) {
				return final_cb(null);
			}
			if (false && resp.readyState !== 4)
				return;
			nir_debug("check_image_get", "check_image_get(onload)", deepcopy(resp), resp.readyState);
			var digit = resp.status.toString()[0];
			var ok_error = check_ok_error(obj[0].head_ok_errors, resp.status);
			if ((digit === "4" || digit === "5") &&
				resp.status !== 405 && ok_error !== true) {
				if (err_cb) {
					console_log("Bad status: " + resp.status + " ( " + url + " )");
					err_cb();
				} else {
					console_error("Error: " + resp.status);
				}
				return;
			}
			if (check_bad_if(obj[0].bad_if, resp)) {
				console_log("Bad image (bad_if)", resp, obj[0].bad_if);
				return err_cb();
			}
			if (processing.head) {
				final_cb(resp, obj[0]);
				return;
			}
			var parsed_headers = headers_list_to_dict(parse_headers(resp.responseHeaders));
			var media_info = obj[0].media_info;
			if (media_info.type === "image" && parsed_headers["content-type"]) {
				var detected_mediainfo = get_mediainfo_from_contenttype(parsed_headers["content-type"]);
				if (detected_mediainfo) {
					media_info.type = detected_mediainfo.type;
					if (detected_mediainfo.delivery)
						media_info.delivery = detected_mediainfo.delivery;
				}
			}
			if (false) {
				/*if (media_info.type === "video" && !video_allowed) {
					console_log("Video, skipping due to user setting");
					return err_cb();
				}*/
			}
			if (!is_media_type_supported(media_info, processing)) {
				console_warn("Media type", media_info, "is not supported");
				return err_cb();
			}
			if (settings.mouseover_matching_media_types && processing && processing.source && processing.source.el) {
				var source_mediatype = el_media_type(processing.source.el);
				if (source_mediatype) {
					if (source_mediatype !== media_info.type) {
						console_log("Source was ", source_mediatype, ", this is", media_info.type, "skipping");
						return err_cb();
					}
				}
			}
			var good_cb = function(img) {
				nir_debug("check_image_get", "check_image_get(good_cb):", img, resp.finalUrl, obj[0], resp);
				if (processing.set_cache) {
					var cache_obj = {
						img: img,
						resp: resp,
						filesize: obj[0].filesize
					};
					if (img.tagName === "VIDEO" || img.tagName === "AUDIO")
						cache_obj.currentTime = img.currentTime;
					check_image_cache.set(obj[0].url, cache_obj, (parseFloat(settings.popup_cache_duration) || 0) * 60);
				}
				if (img)
					check_image_ref(img);
				final_cb(img, resp.finalUrl, obj[0], resp);
			};
			if (parsed_headers["content-length"] && parseInt(parsed_headers["content-length"]) > 100) {
				obj[0].filesize = parseInt(parsed_headers["content-length"]);
			}
			var set_src = function(el, src) {
				if (media_info.type === "image" || !media_info.delivery || processing.deny_nondirect_delivery) {
					set_direct_src(el, src, obj[0]);
				} else {
					if (media_info.delivery in mediadelivery_support) {
						var module = mediadelivery_support[media_info.delivery];
						if (module.active()) {
							module.el_init({
								success: function() { },
								fail: err_cb,
								info_obj: obj[0],
								el: el,
								src: src
							});
							return;
						}
					}
				}
			};
			var create_media = function(src, mediatype) {
				var our_err_cb = err_cb;
				if (!mediatype && obj[0].head_wrong_contenttype && media_info.type !== "audio") {
					our_err_cb = function() {
						var all_mediatypes = ["video", "image"];
						all_mediatypes.splice(array_indexof(all_mediatypes, media_info.type), 1);
						create_media(src, all_mediatypes[0]);
					};
				}
				if (!mediatype)
					mediatype = media_info.type;
				var el = create_media_el(obj[0], mediatype, processing, good_cb, our_err_cb);
				set_src(el, src);
				return el;
			};
			if (incomplete_request) {
				create_media(resp.finalUrl);
				return;
			}
			if (!resp.response) {
				err_cb();
				return;
			}
			var loadcb = function(urldata) {
				if (_nir_debug_) {
					console_log("check_image_get's loadcb", urldata, media_info);
				}
				last_objecturl = urldata;
				if (!urldata) {
					return err_cb();
				}
				create_media(urldata);
			};
			if (obj[0].need_data_url || (!settings.mouseover_use_blob_over_data && !obj[0].need_blob)) {
				create_dataurl(resp.response, loadcb);
			} else {
				var objecturl = create_objecturl(resp.response);
				loadcb(objecturl);
			}
		};
		var req = null;
		if ((!obj[0].can_multiple_request || settings.mouseover_partial_avoid_head) && incomplete_request
			&& (!obj[0].bad_if || obj[0].bad_if.length === 0)) {
			onload_cb({
				status: 200,
				responseHeaders: "Content-Type: " + (obj_is_probably_video ? "video/mp4" : "image/jpeg"),
				readyState: 3,
				finalUrl: obj[0].url
			});
			return;
		}
		var cb_key = method + " " + incomplete_request + " " + url;
		err_cb = function(no_propagate) {
			run_cbs(null, null, no_propagate);
		};
		final_cb = function() {
			run_cbs(this, arguments);
		};
		if (!(cb_key in check_image_cbs))
			check_image_cbs[cb_key] = [];
		check_image_cbs[cb_key].push(function(our_this, args) {
			if (!args && !our_this) {
				return err_cb_real();
			}
			return cb.apply(our_this, args);
		});
		if (check_image_cbs[cb_key].length > 1)
			return;
		var start_req = function() {
			req = do_request({
				method: method,
				url: url,
				responseType: responseType,
				headers: headers,
				trackingprotection_failsafe: true,
				need_blob_response: method == "GET",
				retry_503: true,
				onprogress: function(resp) {
					var do_abort = function() {
						if (!req || !req.abort) {
							console_warn("Unable to abort request");
							return;
						}
						req.abort();
					};
					if (!processing.running) {
						do_abort();
					}
					if (processing.progress_cb && resp.lengthComputable && resp.loaded && resp.total) {
						processing.progress_cb({
							total: resp.total,
							loaded: resp.loaded
						});
					}
					if (incomplete_request && resp.readyState >= 2 && resp.responseHeaders) {
						do_abort();
						onload_cb(resp);
					}
				},
				onload: onload_cb
			});
		};
		if (obj[0].cookie_url && get_cookies) {
			get_cookies(obj[0].cookie_url, function(cookies) {
				if (!cookies) {
					return start_req();
				}
				headerobj_set(headers, "cookie", cookies_to_httpheader(cookies));
				start_req();
			}, { need_full: true });
		} else {
			start_req();
		}
	}
	var str_to_keycode_table = {
		backspace: 8,
		enter: 13,
		shift: 16,
		ctrl: 17,
		alt: 18,
		esc: 27,
		space: 32,
		left: 37,
		up: 38,
		right: 39,
		down: 40,
		";": 186,
		"=": 187,
		",": 188,
		"-": 189,
		".": 190,
		"/": 191,
		"`": 192,
		"[": 219,
		"\\": 220,
		"]": 221,
		"'": 222
	};
	var keycode_to_str_table = {
		8: "backspace",
		13: "enter",
		16: "shift",
		17: "ctrl",
		18: "alt",
		19: "pause",
		27: "esc",
		32: "space",
		37: "left",
		38: "up",
		39: "right",
		40: "down",
		44: "prntscreen",
		97: "1",
		98: "2",
		99: "3",
		100: "4",
		101: "5",
		102: "6",
		103: "7",
		104: "8",
		105: "9",
		111: "/",
		106: "*",
		107: "+",
		109: "-",
		110: ".",
		145: "scrlock",
		186: ";",
		187: "=",
		188: ",",
		189: "-",
		190: ".",
		191: "/",
		192: "`",
		219: "[",
		220: "\\",
		221: "]",
		222: "'",
		226: "\\" // IntlBackslash, VK_OEM_102 (thanks to Noodlers for reporting)
	};
	var MAX_SAFE_INTEGER = 9007199254740991; // Number.MAX_SAFE_INTEGER
	var maxzindex = MAX_SAFE_INTEGER;
	var sans_serif_font = '"Noto Sans", Arial, Helvetica, sans-serif';
	var get_safe_glyph = function(font, glyphs) {
		if (settings.mouseover_ui_use_safe_glyphs)
			return glyphs[glyphs.length - 1];
		try {
			for (var i = 0; i < glyphs.length; i++) {
				if (document.fonts.check(font, glyphs[i]))
					return glyphs[i];
			}
		} catch (e) {
			console_error(e);
		}
		return glyphs[glyphs.length - 1];
	};
	function keycode_to_str(event) {
		var x = event.which;
		if (event.code) {
			var match = event.code.match(/^Numpad([0-9]+)$/);
			if (match) {
				return match[1];
			}
			;
		}
		if (x in keycode_to_str_table) {
			return keycode_to_str_table[x];
		}
		if (!((x >= 65 && x <= 90) ||
			(x >= 48 && x <= 57))) {
			return;
		}
		return string_fromcharcode(x).toLowerCase();
	}
	function str_to_keycode(x) {
		if (x in str_to_keycode_table) {
			return str_to_keycode_table[x];
		}
		return x.toUpperCase().charCodeAt(0);
	}
	function normalize_keychord(keychord) {
		if (keychord.length === 0)
			return [[]];
		if (!is_array(keychord[0]))
			return [keychord];
		return keychord;
	}
	function general_extension_message_handler(message, sender, respond) {
		if (_nir_debug_) {
			console_log("general_extension_message_handler", message);
		}
		if (message.type === "settings_update") {
			settings_updated_cb(message.data.changes);
		} else if (message.type === "request") {
			var response = message.data;
			if (!(response.id in extension_requests)) {
				if (_nir_debug_) {
					console_log("Request ID " + response.id + " not in extension_requests");
				}
				return;
			}
			var request_final = function() {
				var reqdata = extension_requests[response.id].data;
				var events = [
					"onload",
					"onerror",
					"onprogress",
					"onabort",
					"ontimeout"
				];
				var handled = false;
				for (var i = 0; i < events.length; i++) {
					var event = events[i];
					if (response.event === event && reqdata[event]) {
						if (_nir_debug_) {
							console_log("Running " + event + " for response", response);
						}
						reqdata[event](response.data);
						handled = true;
					}
				}
				if (_nir_debug_ && !handled) {
					console_warn("No event handler for", response);
				}
				if (response.final) {
					delete extension_requests[response.id];
				}
			};
			if (response.data && response.data.responseType === "blob") {
				var enc = response.data._responseEncoded;
				if (enc) {
					var wanted_responseType = "blob";
					if (response.data._wanted_responseType === "arraybuffer")
						wanted_responseType = "arraybuffer";
					if (enc.value) {
						var value_array = new Uint8Array(enc.value.length);
						for (var i = 0; i < enc.value.length; i++) {
							value_array[i] = enc.value.charCodeAt(i);
						}
						if (wanted_responseType === "blob") {
							try {
								response.data.response = new native_blob([value_array.buffer], { type: enc.type });
							} catch (e) {
								console_error(e);
								response.data.response = null;
							}
						} else {
							response.data.response = value_array.buffer;
						}
					} else if (enc.objurl) {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", enc.objurl);
						xhr.responseType = wanted_responseType;
						xhr.onload = function() {
							revoke_objecturl(enc.objurl);
							response.data.response = xhr.response;
							request_final();
						};
						xhr.onerror = function() {
							revoke_objecturl(enc.objurl);
							console_error("Unable to load blob for", enc, xhr);
							response.data.response = null;
							request_final();
						};
						xhr.send();
						return;
					}
				} else {
					response.data.response = null;
				}
			} else if (response.data && response.data.responseText && !response.data.response) {
				response.data.response = response.data.responseText;
			}
			request_final();
		} else if (message.type === "bg_redirect") {
			if (settings.redirect && settings.redirect_extension && settings.imu_enabled) {
				try {
					var headers = headers_list_to_dict(message.data.responseHeaders);
					if (headers["content-type"] && contenttype_can_be_redirected(headers["content-type"])) {
						do_redirect_sub(message.data.url, false, function(newurl, obj) {
							send_redirect(obj, function() {
								chrome.tabs.update(message.data.tabId, {
									url: newurl
								});
							}, message.data.tabId);
						});
					}
				} catch (e) {
					console_error(e);
				}
			}
		} else if (message.type === "get_localstorage") {
			if (_localstorage_check_origin(message.data.url)) {
				respond(_localstorage_get_items(message.data.keys, message.data.options));
			} else {
				respond(null);
			}
		}
	}
	var stackoverflow_guard = function(func, i, count) {
		if (i % count !== (count - 1)) {
			func();
		} else {
			setTimeout(func, 0);
		}
	};
	function do_mouseover() {
		if (_nir_debug_)
			console_log("do_mouseover ran");
		var mouseover_base_enabled = function() {
			if (!settings.imu_enabled)
				return false;
			if (settings.apply_blacklist_host && !bigimage_filter(window.location.href))
				return false;
			return true;
		};
		var mouseover_enabled = function() {
			return mouseover_base_enabled() && settings.mouseover;
		};
		var mouseover_mouse_enabled = function() {
			return mouseover_enabled() && delay !== false && typeof delay === "number" && delay_mouseonly;
		};
		var mousepos_initialized = false;
		var mouseX = 0;
		var mouseY = 0;
		var mouseAbsX = 0;
		var mouseAbsY = 0;
		var mouse_frame_id = "top";
		var mouseContextX = null;
		var mouseContextY = null;
		var mouseAbsContextX = 0;
		var mouseAbsContextY = 0;
		var mouse_in_image_yet = false;
		var mouseDelayX = 0;
		var mouseDelayY = 0;
		var lastX = 0;
		var lastY = 0;
		var processing_list = [];
		var popups = [];
		var trigger_id = null;
		var mask_el = null;
		var popup_obj = null;
		var previous_album_links = null;
		var popup_contentlength = null;
		var popup_el = null;
		var popup_el_mediatype = null;
		var popup_el_is_stream = false;
		var popup_orig_url = null;
		var resetpopup_timeout = null;
		var real_popup_el = null;
		var next_popup_el = null;
		var last_popup_el = null;
		var popup_orig_el = null;
		var popup_el_automatic = false;
		var popup_el_remote = false;
		var popups_active = false;
		var popup_trigger_reason = null;
		var can_close_popup = [false, false];
		var popup_hold = false;
		var popup_hold_func = common_functions["nullfunc"];
		var popup_zoom_func = common_functions["nullfunc"];
		var popup_createui_func = common_functions["nullfunc"];
		var popup_wheel_cb = null;
		var popup_update_pos_func = null;
		var popup_update_zoom_func = null;
		var popup_hidecursor_func = common_functions["nullfunc"];
		var popup_hidecursor_timer = null;
		var popup_cursorjitterX = 0;
		var popup_cursorjitterY = 0;
		var popup_is_fullscreen = false;
		var popup_last_zoom = null;
		var popup_client_rect_cache = null;
		var last_popup_client_rect_cache = 0;
		var popup_media_client_rect_cache = null;
		var last_popup_media_client_rect_cache = 0;
		var dragstart = false;
		var dragstartX = null;
		var dragstartY = null;
		var dragoffsetX = null;
		var dragoffsetY = null;
		var popupOpenX = null;
		var popupOpenY = null;
		var popupOpenLastX = null;
		var popupOpenLastY = null;
		var dragged = false;
		var waiting = false;
		var waitingel = null;
		var waitingstyleel = null;
		var waitingel_cursor = null;
		var elwaitingstyleclass = null;
		var elwaitingstyleel = null;
		var waitingsize = 200;
		var current_chord = [];
		var current_chord_timeout = {};
		var release_ignore = [];
		var editing_text = false;
		var host_location = window_location;
		var host_domain = get_domain_from_url(host_location);
		var host_domain_nosub = get_domain_nosub(host_domain);
		function resetifout(e) {
			if (!trigger_complete(settings.mouseover_trigger_key)) {
				stop_waiting();
				resetpopups();
			}
		}
		/*document.addEventListener("focusout", resetifout);
		  document.addEventListener("blur", resetifout);
		  unsafeWindow.addEventListener("focusout", resetifout);
		  unsafeWindow.addEventListener("blur", resetifout);*/
		if (false) {
			var disable_click = false;
			document.addEventListener("click", function(e) {
				if (disable_click && popups_active && false) {
					e.stopPropagation();
					e.stopImmediatePropagation();
					return true;
				}
			}, true);
		}
		var delay = false;
		var delay_handle = null;
		var delay_handle_triggering = false;
		var delay_mouseonly = true;
		var delay_el = null;
		function get_tprofile_setting_name(setting_name) {
			if (trigger_id) {
				var new_settingname = "t" + trigger_id + "_" + setting_name;
				if (new_settingname in settings)
					setting_name = new_settingname;
			}
			return setting_name;
		}
		function get_tprofile_setting(setting_name) {
			return settings[get_tprofile_setting_name(setting_name)];
		}
		function get_tprofile_single_setting(setting) {
			return get_single_setting_raw(get_tprofile_setting(setting));
		}
		function update_waiting() {
			if (!waitingel)
				return;
			var x = mouseX; //mouseAbsX;
			var y = mouseY; //mouseAbsY;
			waitingel.style.left = (x - (waitingsize / 2)) + "px";
			waitingel.style.top = (y - (waitingsize / 2)) + "px";
		}
		var start_waiting = function(el, cursor) {
			if (!cursor)
				cursor = "wait";
			waitingel_cursor = cursor;
			waiting = true;
			if (!settings.mouseover_wait_use_el) {
				if (waitingstyleel) {
					stop_waiting();
				}
				waitingstyleel = document_createElement("style");
				waitingstyleel.innerText = "*,a,img,video {cursor: " + cursor + "!important}";
				document.documentElement.appendChild(waitingstyleel);
				return;
			}
			if (!waitingel) {
				waitingel = document_createElement("div");
				set_el_all_initial(waitingel);
				waitingel.style.zIndex = maxzindex;
				waitingel.style.cursor = cursor;
				waitingel.style.width = waitingsize + "px";
				waitingel.style.height = waitingsize + "px";
				waitingel.style.position = "fixed"; //"absolute";
				var simevent = function(e, eventtype) {
					waitingel.style.display = "none";
					document.elementFromPoint(e.clientX, e.clientY).dispatchEvent(new MouseEvent(eventtype, e));
					waitingel.style.display = "block";
				};
				our_addEventListener(waitingel, "click", function(e) {
					return simevent(e, "click");
				});
				our_addEventListener(waitingel, "contextmenu", function(e) {
					return simevent(e, "contextmenu");
				});
				document.documentElement.appendChild(waitingel);
			}
			waitingel.style.cursor = cursor;
			waitingel.style.display = "block";
			update_waiting();
		};
		function start_progress(el) {
			start_waiting(el, "progress");
		}
		var stop_waiting = function() {
			if (_nir_debug_) {
				console_log("stop_waiting");
			}
			waiting = false;
			if (!settings.mouseover_wait_use_el) {
				if (waitingstyleel) {
					waitingstyleel.parentElement.removeChild(waitingstyleel);
					waitingstyleel = null;
				}
			}
			if (waitingel)
				waitingel.style.display = "none";
		};
		function dont_wait_anymore() {
			stop_waiting();
		}
		var not_allowed_timer = null;
		function cursor_not_allowed() {
			if (_nir_debug_) {
				console_log("cursor_not_allowed");
			}
			start_waiting(void 0, "not-allowed");
			if (not_allowed_timer) {
				clearTimeout(not_allowed_timer);
			}
			not_allowed_timer = setTimeout(function() {
				not_allowed_timer = null;
				if (waitingel_cursor === "not-allowed")
					dont_wait_anymore();
			}, settings.mouseover_notallowed_duration);
		}
		function stop_waiting_cant_load() {
			if (settings.mouseover_enable_notallowed_cant_load) {
				cursor_not_allowed();
			} else {
				stop_waiting();
			}
		}
		function in_clientrect(mouseX, mouseY, rect, border) {
			if (isNaN(border) || border === void 0)
				border = 0;
			if (mouseX >= (rect.left - border) && mouseX <= (rect.right + border) &&
				mouseY >= (rect.top - border) && mouseY <= (rect.bottom + border)) {
				return true;
			} else {
				return false;
			}
		}
		function stop_processing() {
			for (var i = 0; i < processing_list.length; i++) {
				processing_list[i].running = false;
			}
		}
		var clear_resetpopup_timeout = function() {
			if (resetpopup_timeout) {
				clearTimeout(resetpopup_timeout);
				resetpopup_timeout = null;
			}
		};
		var add_resetpopup_timeout = function() {
			if (!settings.mouseover_auto_close_popup || !settings.mouseover_auto_close_popup_time)
				return;
			clear_resetpopup_timeout();
			resetpopup_timeout = setTimeout(resetpopups, settings.mouseover_auto_close_popup_time * 1000);
		};
		var removepopups_timer = null;
		function removepopups() {
			array_foreach(popups, function(popup) {
				var els = popup.querySelectorAll("img, video, audio");
				for (var i = 0; i < els.length; i++) {
					if (els[i].tagName === "VIDEO" || els[i].tagName === "AUDIO")
						els[i].pause();
					check_image_unref(els[i]);
				}
				if (popup.parentNode)
					popup.parentNode.removeChild(popup);
				var index = array_indexof(popups, popup);
				if (index > -1) {
					popups.splice(index, 1);
				}
			});
			if (removepopups_timer) {
				clearTimeout(removepopups_timer);
				removepopups_timer = null;
			}
		}
		var remove_mask = function() {
			if (mask_el) {
				if (mask_el.parentElement)
					mask_el.parentElement.removeChild(mask_el);
				mask_el = null;
			}
			if (removemask_timer) {
				clearTimeout(removemask_timer);
				removemask_timer = null;
			}
		};
		var removemask_timer = null;
		function resetpopups(options) {
			if (_nir_debug_) {
				console_log("resetpopups(", options, ")");
			}
			if (!options) {
				options = {};
			}
			var from_remote = !!options.from_remote;
			array_foreach(popups, function(popup) {
				if (settings.mouseover_fade_time > 0 && (settings.mouseover_enable_fade || settings.mouseover_enable_zoom_effect)) {
					if (settings.mouseover_enable_fade) {
						popup.style.opacity = 0;
					}
					if (settings.mouseover_enable_zoom_effect) {
						popup.style.transform = "scale(0)";
					}
					if (!removepopups_timer) {
						removepopups_timer = setTimeout(removepopups, settings.mouseover_fade_time);
					}
				} else {
					removepopups();
				}
			});
			if (mask_el) {
				set_important_style(mask_el, "pointer-events", "none");
				if (settings.mouseover_mask_fade_time > 0) {
					set_important_style(mask_el, "opacity", 0);
					if (!removemask_timer) {
						removemask_timer = setTimeout(remove_mask, settings.mouseover_mask_fade_time);
					}
				} else {
					remove_mask();
				}
			}
			if (!from_remote && can_use_remote()) {
				if (is_in_iframe) {
					remote_send_message("top", { type: "resetpopups" });
				} else if (popup_el_remote) {
					remote_send_message(popup_el_remote, { type: "resetpopups" });
				}
			}
			disable_click = false;
			popups_active = false;
			delay_handle_triggering = false;
			clear_resetpopup_timeout();
			next_popup_el = null;
			if (popup_el)
				last_popup_el = popup_el;
			popup_el = null;
			real_popup_el = null;
			popup_el_automatic = false;
			popup_el_remote = false;
			popup_el_mediatype = null;
			popup_el_is_stream = false;
			popup_orig_url = null;
			popup_hold_func = common_functions["nullfunc"];
			popup_zoom_func = common_functions["nullfunc"];
			popup_createui_func = common_functions["nullfunc"];
			popup_wheel_cb = null;
			popup_update_pos_func = null;
			popup_update_zoom_func = null;
			popup_client_rect_cache = null;
			popup_is_fullscreen = false;
			last_popup_client_rect_cache = 0;
			popup_media_client_rect_cache = null;
			last_popup_media_client_rect_cache = 0;
			if (!options.automatic) {
				popup_hold = false;
			}
			if (!options.new_popup) {
				can_close_popup = [false, false];
			}
			stop_processing();
			if (!options.new_popup || settings.mouseover_wait_use_el) {
				stop_waiting();
			}
			if (!delay_mouseonly && delay_handle) {
				clearTimeout(delay_handle);
				delay_handle = null;
			}
		}
		termination_hooks.push(resetpopups);
		function get_viewport() {
			if (window.visualViewport) {
				return [
					window.visualViewport.width,
					window.visualViewport.height
				];
			} else {
				return [
					window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
					window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
				];
			}
		}
		var get_download_urls_from_infoobj;
		(function() {
			var parse_stream = function(delivery, text, url, cb) {
				get_library("stream_parser", settings, do_request, function(sp) {
					if (!sp)
						return cb(null);
					var parser_obj = sp[delivery];
					var parse;
					if (delivery === "dash") {
						parse = parser_obj.parse;
					} else if (delivery === "hls") {
						parse = function(text) {
							var parser = new parser_obj.Parser();
							parser.push(text);
							parser.end();
							return parser.manifest;
						};
					}
					try {
						var parsed = parse(text, url);
					} catch (e) {
						console_error(e);
						return cb(null);
					}
					return cb(parsed);
				});
			};
			var request_parsed_stream = function(info_obj, manifest_url, cb) {
				var requestobj = override_request({
					url: manifest_url,
					onload: function(resp) {
						if (resp.status !== 200) {
							console_error("Unable to load", resp);
							return cb(null);
						}
						parse_stream(info_obj.media_info.delivery, resp.responseText, resp.finalUrl || manifest_url, function(data) {
							cb(data);
						});
					}
				}, info_obj);
				do_request(requestobj);
			};
			var sort_playlists = function(playlists) {
				return playlists.sort(function(a_obj, b_obj) {
					var a = a_obj.attributes;
					var b = b_obj.attributes;
					if (a.BANDWIDTH && b.BANDWIDTH) {
						return b.BANDWIDTH - a.BANDWIDTH;
					}
					if (a.RESOLUTION && b.RESOLUTION) {
						var a_res = a.RESOLUTION.width * a.RESOLUTION.height;
						var b_res = b.RESOLUTION.width * b.RESOLUTION.height;
						return b_res - a_res;
					}
					return 0;
				});
			};
			var get_actual_best_playlist = function(info_obj, playlists, cb) {
				if (!is_array(playlists))
					playlists = [playlists];
				sort_playlists(playlists);
				var resolve_uri = function(uri) {
					return urljoin(info_obj.url, uri, true);
				};
				var resolve_playlist = function(playlist, cb) {
					if (playlist.uri) {
						playlist.uri = resolve_uri(playlist.uri);
						var uri = playlist.uri;
						request_parsed_stream(info_obj, uri, function(data) {
							if (!data)
								return cb(null);
							var origattrs = playlist.attributes;
							obj_extend(playlist, data);
							if (origattrs)
								playlist.attributes = origattrs;
							playlist.base_uri = uri;
							playlist.uri = null; // to avoid possible re-requests
							cb(playlist);
						});
					} else {
						cb(playlist);
					}
				};
				var do_process = function(playlist_id, cb) {
					var playlist = playlists[playlist_id];
					if (!playlist)
						return cb(null);
					resolve_playlist(playlist, function(new_playlist) {
						if (!new_playlist)
							return do_process(playlist_id + 1, cb);
						return cb(new_playlist);
					});
				};
				do_process(0, cb);
			};
			var get_downloadable_playlists = function(info_obj, manifest, cb) {
				get_actual_best_playlist(info_obj, manifest.playlists, function(playlist) {
					if (!playlist)
						return cb(null);
					var audio = playlist.attributes.AUDIO;
					if (audio && audio in manifest.mediaGroups.AUDIO) {
						audio = manifest.mediaGroups.AUDIO[audio];
						audio = audio[Object.keys(audio)[0]];
					} else {
						audio = null;
					}
					var retobj = {
						video: playlist
					};
					if (!audio)
						return cb(retobj);
					get_actual_best_playlist(info_obj, audio.playlists || audio, function(audio_pl) {
						if (!audio_pl)
							return cb(null);
						retobj.audio = audio_pl;
						return cb(retobj);
					});
				});
			};
			var get_download_urls_from_playlist = function(info_obj, playlist) {
				var resolve_uri = function(uri) {
					return urljoin(playlist.base_uri || info_obj.url, uri, true);
				};
				if (false && playlist.attributes) {
					var progressive = playlist.attributes["PROGRESSIVE-URI"];
					if (progressive)
						return [resolve_uri(progressive)];
				}
				var urls = [];
				var push_url = function(url) {
					if (!url)
						return;
					url = resolve_uri(url);
					array_upush(urls, url);
				};
				var push_segment = function(segment) {
					if (segment.map) {
						push_url(segment.map.uri || segment.map.resolvedUri);
					}
					push_url(segment.uri || segment.resolvedUri);
				};
				if (playlist.sidx) {
					push_segment(playlist.sidx);
				}
				array_foreach(playlist.segments, push_segment);
				return urls;
			};
			var get_download_urls_from_playlists = function(info_obj, playlists) {
				var newobj = {};
				obj_foreach(playlists, function(key, value) {
					newobj[key] = get_download_urls_from_playlist(info_obj, value);
				});
				return newobj;
			};
			get_download_urls_from_infoobj = function(info_obj, cb) {
				request_parsed_stream(info_obj, info_obj.url, function(manifest) {
					if (!manifest)
						return cb(null);
					get_downloadable_playlists(info_obj, manifest, function(playlists) {
						if (!playlists)
							return cb(null);
						var urls = get_download_urls_from_playlists(info_obj, playlists);
						return cb(urls);
					});
				});
			};
		})();
		var check_sharedarraybuffer;
		(function() {
			var check_sharedarraybuffer_inner = function(cb) {
				if (typeof SharedArrayBuffer !== "function") {
					console_warn("SharedArrayBuffer doesn't exist");
					return cb(false);
				}
				try {
					var sab = new SharedArrayBuffer(1);
					var array = new Uint8Array(sab);
					array[0] = 30;
					var workersource = "self.addEventListener('message', function(m) {try {var a = new Uint8Array(m.data); postMessage(a[0] === 30);} catch (e) {postMessage(false);}});";
					new_blob(workersource, function(blob) {
						if (!blob) {
							console_warn("Unable to create blob");
							return cb(false);
						}
						var objurl = create_objecturl(blob);
						var worker = new Worker(objurl);
						worker.onmessage = function(m) {
							cb(!!m.data);
						};
						worker.postMessage(sab);
						setTimeout(function() {
							revoke_objecturl(objurl);
						}, 10);
					});
				} catch (e) {
					console_error(e);
					return cb(false);
				}
			};
			var cached_sab_success = null;
			check_sharedarraybuffer = function(cb) {
				if (cached_sab_success !== null)
					return cb(cached_sab_success);
				check_sharedarraybuffer_inner(function(success) {
					cached_sab_success = success;
					cb(success);
				});
			};
		})();
		var ffmpeg_progress_cb = null;
		var get_ffmpeg_inner = function(cb) {
			get_library("ffmpeg", settings, do_request, function(ffmpeg_lib) {
				if (!ffmpeg_lib)
					return cb(null);
				if (ffmpeg_lib._imu_failed_loading)
					return cb(null);
				var ffmpeg;
				if (!ffmpeg_lib._imu_instance) {
					if (ffmpeg_lib.overridden_xhr) {
						ffmpeg_lib.xhr.do_request = function(req) {
							req = override_request(req, {
								headers: {
									Referer: "",
									Origin: ""
								}
							});
							if (/\/ffmpeg-core(?:\.worker)?\.js$/.test(req.url)) {
								req.url = "data:application/javascript,void%200";
							} else if (false && /\/ffmpeg-core\.wasm$/.test(req.url)) {
								req.responseType = "blob";
								if (true) {
									return do_request(req);
								}
								request_chunked(req, {
									onload: function(data, resp) {
										console_log("onload", data, resp);
										if (!data) {
											resp.status = 500;
											resp.response = null;
											return req.onload(resp);
										}
										resp.response = data.data;
										return req.onload(resp);
									}
								});
								return;
							}
							return do_request(req);
						};
					}
					ffmpeg = ffmpeg_lib.lib.createFFmpeg({
						log: true,
						progress: function(progress) {
							if (ffmpeg_progress_cb) {
								ffmpeg_progress_cb(progress.ratio);
							}
						}
					});
					ffmpeg_lib._imu_instance = ffmpeg;
				} else {
					ffmpeg = ffmpeg_lib._imu_instance;
				}
				if (!ffmpeg.isLoaded()) {
					ffmpeg.load().then(function() {
						cb(ffmpeg);
					}, function(err) {
						console_error(err);
						ffmpeg_lib._imu_failed_loading = true; // untested
						cb(null);
					});
				} else {
					cb(ffmpeg);
				}
			});
		};
		var get_ffmpeg = function(cb) {
			if (!has_ffmpeg_lib) {
				console_error("Unable to load FFmpeg library: disabled for this build");
				return cb(null);
			}
			check_sharedarraybuffer(function(success) {
				if (!success) {
					console_error("Unable to load FFmpeg library: SharedArrayBuffer is missing or unusable");
					return cb(null);
				}
				get_ffmpeg_inner(cb);
			});
		};
		var ffmpeg_join;
		(function() {
			var ffmpeg_ops = [];
			var ffmpeg_running = false;
			var ffmpeg_run_single = function(ffmpeg) {
				var opobj = ffmpeg_ops.shift();
				var end = function(no_ops) {
					ffmpeg_progress_cb = null;
					ffmpeg_running = false;
					if (ffmpeg_ops.length) {
						if (!no_ops) {
							ffmpeg_run_single(ffmpeg);
						} else {
							array_foreach(ffmpeg_ops, function(op) {
								run_soon(op.fail);
							});
						}
					}
				};
				ffmpeg_progress_cb = function(percent) {
					if (percent > 1)
						percent = 1;
					opobj.progress(percent);
				};
				ffmpeg_running = true;
				var promise = null;
				try {
					promise = ffmpeg.run.apply(this, opobj.op);
				} catch (e) {
					console_error(e);
					end(true);
					opobj.fail(false);
					return;
				}
				promise.then(function(data) {
					end();
					opobj.success(data);
				}, function(data) {
					end(true);
					opobj.fail(false);
				});
			};
			var ffmpeg_run = function(ffmpeg, op, progress, success, fail) {
				ffmpeg_ops.push({
					op: op,
					progress: progress,
					success: success,
					fail: fail
				});
				if (ffmpeg_running)
					return;
				ffmpeg_run_single(ffmpeg);
			};
			var get_ffmpeg_prefix = function(prefix) {
				return prefix + "_" + get_random_text(10) + "_";
			};
			var ffmpeg_concat = function(ffmpeg, files, cb) {
				if (true) {
					var total_size = 0;
					array_foreach(files, function(file) {
						total_size += file.data.byteLength;
					});
					var out = new Uint8Array(total_size);
					var current_size = 0;
					array_foreach(files, function(file) {
						out.set(file.data, current_size);
						current_size += file.data.byteLength;
					});
					var ourfilename = get_ffmpeg_prefix("concat");
					ffmpeg.FS("writeFile", ourfilename, out);
					return cb(ourfilename);
				} else {
					if (!ffmpeg)
						cb(null);
					var prefix = get_ffmpeg_prefix("concat");
					var files_txt_filename = prefix + "files.txt";
					var files_txt_files = [];
					var filenames = [];
					array_foreach(files, function(file, i) {
						var filename = prefix + i;
						if (file.mime) {
							filename += file.mime.replace(/.*\//, ".");
						}
						filenames.push(filename);
						files_txt_files.push("file '" + filename + "'");
						ffmpeg.FS("writeFile", filename, file.data);
					});
					ffmpeg.FS("writeFile", files_txt_filename, files_txt_files.join("\n"));
					var out_filename = prefix + "out";
					var cleanup = function(out) {
						array_foreach(filenames, function(filename) {
							ffmpeg.FS("unlink", filename);
						});
						ffmpeg.FS("unlink", files_txt_filename);
						if (out) {
							try {
								ffmpeg.FS("unlink", out_filename);
							} catch (e) { }
						}
					};
					ffmpeg_run(ffmpeg, ["-f", "concat", "-safe", "0", "-i", files_txt_filename, "-c", "copy", out_filename], null, function() {
						cleanup();
						cb(out_filename);
					}, function(err) {
						console_error(err);
						cleanup(true);
						cb(null);
					});
				}
			};
			var ffmpeg_fs_size = function(ffmpeg, file) {
				try {
					var stat = ffmpeg.FS("stat", file);
					if (!stat)
						return null;
					return stat.size;
				} catch (e) {
					return null;
				}
				;
			};
			var ffmpeg_mux_single = function(ffmpeg, video_file, audio_file, out_filename, progress, success, fail) {
				var failfunc = function(err) {
					try {
						ffmpeg.FS("unlink", out_filename);
					} catch (e) { }
					fail(err);
				};
				var args = [];
				if (video_file)
					args.push("-i", video_file);
				if (audio_file)
					args.push("-i", audio_file);
				args.push("-c", "copy", out_filename);
				ffmpeg_run(ffmpeg, args, progress, function(data) {
					if (!ffmpeg_fs_size(ffmpeg, out_filename)) {
						return failfunc();
					}
					success(data);
				}, failfunc);
			};
			var ffmpeg_mux = function(ffmpeg, video_file, audio_file, progress, cb) {
				if (!ffmpeg)
					return cb(null);
				var prefix = get_ffmpeg_prefix("out");
				var mux_final = function() {
					ffmpeg_mux_single(ffmpeg, video_file, audio_file, prefix + ".mkv", progress, function() { cb(prefix + ".mkv"); }, function(err) {
						console_error("Error muxing into .mkv", err);
						cb(null);
					});
				};
				if (settings.stream_mux_mp4_over_mkv) {
					var mp4_filename = prefix + ".mp4";
					ffmpeg_mux_single(ffmpeg, video_file, audio_file, mp4_filename, function(ratio) {
						if (ratio >= 0.95)
							ratio = 0.95; // hack to avoid removing the progress element on error
						progress(ratio);
					}, function() { cb(mp4_filename); }, function(err) {
						if (err === false) {
							return cb(null);
						}
						mux_final();
					});
				} else {
					mux_final();
				}
			};
			ffmpeg_join = function(ffmpeg, datas, progress, cb) {
				var streams = [];
				if (datas.video)
					streams.push(datas.video);
				if (datas.audio)
					streams.push(datas.audio);
				if (!streams.length)
					return cb(null);
				var files = [];
				var prefix = get_ffmpeg_prefix("join");
				var cleanup = function() {
					array_foreach(files, function(filename) {
						ffmpeg.FS("unlink", filename);
					});
					progress(1);
				};
				var err = function() {
					cleanup();
					cb(null);
				};
				var process_stream = function(i) {
					if (i >= streams.length) {
						return mux_files();
					} else {
						progress((i / streams.length) * 0.5);
					}
					var stream = streams[i];
					if (!stream.length) {
						console_warn("No stream data for", i);
						process_stream(i + 1);
					} else if (stream.length === 1) {
						var filename = prefix + "stream" + i;
						ffmpeg.FS("writeFile", filename, stream[0].data);
						files.push(filename);
						process_stream(i + 1);
					} else {
						ffmpeg_concat(ffmpeg, stream, function(filename) {
							if (!filename)
								return err();
							files.push(filename);
							process_stream(i + 1);
						});
					}
				};
				var mux_files = function() {
					progress(0.5);
					if (!files.length) {
						console_warn("No files");
						return err();
					}
					if (false && files.length === 1) {
						return cb(files[0]);
					}
					if (files.length > 2) {
						console_error("Unknown extra file(s)", files);
						return err();
					}
					ffmpeg_mux(ffmpeg, files[0], files[1], function(percent) {
						progress(0.5 + (percent * 0.5));
					}, function(out_file) {
						if (!out_file)
							return err();
						cleanup();
						return cb(out_file);
					});
				};
				process_stream(0);
			};
		})();
		var download_playlist_urls;
		(function() {
			var download_single_urls = function(info_obj, single_urls, progress, cb) {
				var ip = new ImpreciseProgress({
					elements_num: single_urls.length,
					cb: progress
				});
				var urls_data = {};
				var max_run = Math_min(3, single_urls.length);
				var chunks = Math_max(1, ((max_run / 3) * 5) | 0);
				var chunk_size = 2 * 1024 * 1024;
				if (info_obj.max_chunks)
					chunks = Math_min(chunks, info_obj.max_chunks);
				if (chunks === 1)
					chunk_size = 0;
				var running = 0;
				var current_url_i = 0;
				var finished = 0;
				var do_stop = false;
				var request_url = function(url, cb) {
					running++;
					request_chunked({
						url: url,
						headers: info_obj.headers,
						can_head: info_obj.can_head,
						head_wrong_contentlength: info_obj.head_wrong_contentlength
					}, {
						chunks: chunks,
						chunk_size: chunk_size,
						onload: function(data) {
							running--;
							if (!data)
								cb(false);
							urls_data[url] = data;
							cb(true);
						},
						onprogress: function(progobj) {
							ip.update_progobj(url, progobj);
						}
					});
				};
				var stop = function() {
					do_stop = true;
				};
				var run = function() {
					if (do_stop)
						return;
					if (finished >= single_urls.length) {
						var out_urls = [];
						array_foreach(single_urls, function(url) {
							out_urls.push(urls_data[url]);
						});
						return cb(out_urls);
					} else if (current_url_i >= single_urls.length) {
						return;
					}
					for (var i = running; i < max_run; i++) {
						request_url(single_urls[current_url_i++], function(succeeded) {
							finished++;
							if (do_stop)
								return;
							if (!succeeded) {
								stop();
								return cb(null);
							} else {
								run();
							}
						});
					}
				};
				run();
				return {
					abort: stop
				};
			};
			download_playlist_urls = function(info_obj, urls, progress, cb) {
				var ip = new ImpreciseProgress({
					elements_num: Object.keys(urls).length,
					cb: progress
				});
				var final_data = {};
				var handles = {};
				var do_stop = false;
				var stop = function() {
					do_stop = true;
					obj_foreach(handles, function(k, obj) {
						obj.abort();
					});
				};
				obj_foreach(urls, function(type, single_urls) {
					handles[type] = download_single_urls(info_obj, single_urls, function(progobj) {
						ip.update_progobj(type, progobj);
					}, function(urls_data) {
						if (do_stop)
							return;
						if (!urls_data) {
							stop();
							return cb(null);
						}
						final_data[type] = urls_data;
						if (Object.keys(final_data).length === Object.keys(urls).length) {
							cb(final_data);
						}
					});
				});
			};
		})();
		var shaka_module = function() {
			var get_max_video_quality = function() {
				var max_video_quality = get_single_setting("max_video_quality");
				if (max_video_quality) {
					max_video_quality = parseInt(max_video_quality.substr(1));
				}
				return max_video_quality;
			};
			var get_variant_within_max_quality = function(variants, max_video_quality) {
				var wanted_variant = -1;
				array_foreach(variants, function(variant, i) {
					if (variant.height === max_video_quality) {
						wanted_variant = i;
						return false;
					}
					if (variant.height > max_video_quality) {
						if (i === 0) {
							wanted_variant = i;
						} else {
							wanted_variant = i - 1;
						}
						return false;
					}
				});
				return wanted_variant;
			};
			var add_xhr_hook = function(lib, info_obj) {
				if (lib.overridden_xhr) {
					lib.xhr.do_request = function(data) {
						do_request(override_request(data, info_obj));
					};
				}
			};
			var create_shaka = function(info_obj, el, src, success, fail) {
				get_library("shaka", settings, do_request, function(_shaka) {
					if (!_shaka)
						return fail();
					var shaka = _shaka.lib;
					if (true) {
						shaka.log.setLevel(shaka.log.Level.ERROR);
					} else {
						shaka.log.setLevel(shaka.log.Level.DEBUG);
					}
					if (!shaka.Player.isBrowserSupported()) {
						console_warn("Unsupported browser for Shaka");
						return fail();
					}
					add_xhr_hook(_shaka, info_obj);
					var player = new shaka.Player(el);
					var shaka_error_handler = function(e) {
						console_error(e);
						return fail();
					};
					player.addEventListener("error", shaka_error_handler);
					player.load(src).then(function() {
						if (info_obj.subtitles) {
							var selected = false;
							for (var _i = 0, _a = info_obj.subtitles; _i < _a.length; _i++) {
								var subtitle = _a[_i];
								var kind = "subtitle";
								var language = subtitle.language_code || "en-US";
								var title = subtitle.title || null;
								var mime = subtitle.mime || undefined;
								var forced = false;
								player.addTextTrack(subtitle.url, language, kind, mime, undefined, title, forced);
							}
						}
						var text_tracks = player.getTextTracks();
						if (text_tracks && text_tracks.length) {
							player.selectTextTrack(text_tracks[0]); // TODO
						}
						player.setTextTrackVisibility(!!settings.popup_enable_subtitles);
						var variants = player.getVariantTracks();
						if (settings.hls_dash_use_max) {
							variants.sort(function(a, b) {
								return b.bandwidth - a.bandwidth;
							});
							player.configure("abr.enabled", false);
							player.selectVariantTrack(variants[0], true, 0);
						}
						var max_video_quality = get_max_video_quality();
						if (max_video_quality) {
							variants.sort(function(a, b) {
								var diff = a.height - b.height;
								if (diff)
									return diff;
								return a.bandwidth - b.bandwidth;
							});
							var wanted_variant = get_variant_within_max_quality(variants, max_video_quality);
							if (wanted_variant >= 0) {
								player.configure("abr.enabled", false);
								player.selectVariantTrack(variants[wanted_variant], true, 0);
							}
						}
						return success();
					}, shaka_error_handler);
				});
			};
			var shaka_info = {
				el_init: function(info) {
					create_shaka(info.info_obj, info.el, info.src, info.success, info.fail);
				},
				active: function() {
					return settings.allow_thirdparty_libs && get_tprofile_setting("mouseover_allow_hlsdash");
				}
			};
			mediadelivery_support.dash = shaka_info;
			mediadelivery_support.hls = shaka_info;
		};
		shaka_module();
		var parse_styles = function(str, multi) {
			if (typeof str !== "string")
				return;
			str = strip_whitespace(str);
			if (!str)
				return;
			var blocks = {};
			var current_block = "default";
			var splitted = str.split("\n");
			for (var i = 0; i < splitted.length; i++) {
				var current = strip_whitespace(splitted[i]);
				if (!current)
					continue;
				if (/^\/\//.test(current))
					continue;
				var match = current.match(/^(#[-a-zA-Z0-9]+(?:\s*,\s*#[-a-zA-Z0-9]+){0,})\s*{/);
				if (match) {
					if (current_block !== "default") {
						console_error("Nested blocks aren't supported");
						return;
					}
					current_block = match[1].split(/\s*,\s*/);
					splitted[i--] = current.substr(match[0].length);
					continue;
				}
				if (current[0] === "}") {
					if (current_block === "default") {
						console_error("No block to escape from");
						return;
					}
					current_block = "default";
					continue;
				}
				if (string_indexof(current, ":") < 0)
					continue;
				var next_block = current_block;
				if (current_block !== "default" && /}$/.test(current)) {
					current = strip_whitespace(current.replace(/}$/, ""));
					next_block = "default";
				}
				var property = strip_whitespace(current.replace(/^(.*?)\s*:.*/, "$1"));
				var value = strip_whitespace(current.replace(/^.*?:\s*(.*)$/, "$1"));
				var scolon_pos = string_indexof(value, ";");
				if (scolon_pos >= 0) {
					var quote_pos = value.search(/['"]/);
					if (quote_pos < 0) {
						splitted[i--] = value.substr(scolon_pos + 1);
						value = strip_whitespace(value.substr(0, scolon_pos));
					} else {
						var new_quote_pos = value.substr(quote_pos + 1).search(/['"]/) + quote_pos + 1;
						scolon_pos = string_indexof(value.substr(new_quote_pos + 1), ";");
						if (scolon_pos >= 0) {
							scolon_pos += new_quote_pos + 1;
							splitted[i--] = value.substr(scolon_pos + 1);
							value = strip_whitespace(value.substr(0, scolon_pos));
						}
					}
				}
				var important = false;
				if (value.match(/!important$/)) {
					important = true;
					value = strip_whitespace(value.replace(/!important$/, ""));
				}
				var c_blocks = current_block;
				if (!is_array(c_blocks))
					c_blocks = [c_blocks];
				array_foreach(c_blocks, function(block) {
					var prop_obj = { property: property, value: value, important: important };
					if (!(block in blocks))
						blocks[block] = {};
					if (multi) {
						if (!(property in blocks[block]))
							blocks[block][property] = [];
						blocks[block][property].push(prop_obj);
					} else {
						blocks[block][property] = prop_obj;
					}
				});
				current_block = next_block;
			}
			return blocks;
		};
		function get_processed_styles(str) {
			if (!str || typeof str !== "string" || !strip_whitespace(str))
				return;
			var styles = {};
			var splitted = str.split(/[;\n]/);
			for (var i = 0; i < splitted.length; i++) {
				var current = strip_whitespace(splitted[i]);
				if (!current)
					continue;
				if (string_indexof(current, ":") < 0)
					continue;
				if (/^\s*\/\//.test(current))
					continue;
				var property = strip_whitespace(current.replace(/^(.*?)\s*:.*/, "$1"));
				var value = strip_whitespace(current.replace(/^.*?:\s*(.*)$/, "$1"));
				var important = false;
				if (value.match(/!important$/)) {
					important = true;
					value = strip_whitespace(value.replace(/!important$/, ""));
				}
				styles[property] = { value: value, important: important };
			}
			return styles;
		}
		function get_styletag_styles(str) {
			var styles = get_processed_styles(str);
			if (!styles)
				return;
			var styles_array = [];
			for (var property in styles) {
				var current = property + ": " + styles[property].value;
				if (styles[property].important || true) {
					current += " !important";
				}
				styles_array.push(current);
			}
			return styles_array.join("; ");
		}
		function apply_styles(el, str, options) {
			var style_blocks = parse_styles(str, true);
			if (!style_blocks)
				return;
			if (options.allow_revert) {
				var oldstyle = el.getAttribute("style"); // this can be expensive for `all: initial` styles
				if (oldstyle) {
					el.setAttribute("data-imu-oldstyle", oldstyle);
				}
			}
			var styles = {};
			if ("default" in style_blocks)
				styles = style_blocks["default"];
			if (options.id && ("#" + options.id) in style_blocks) {
				var block = style_blocks["#" + options.id];
				for (var property in block) {
					if (!(property in styles))
						styles[property] = [];
					array_extend(styles[property], block[property]);
				}
			}
			var format_vars = shallowcopy(options.format_vars);
			var iter = function(property, obj) {
				var value = obj.value;
				if (value.match(/^['"].*['"]$/)) {
					value = value.replace(/^["'](.*)["']$/, "$1");
				}
				if (options.old_variables) {
					for (var variable in options.old_variables) {
						value = string_replaceall(value, variable, options.old_variables[variable]);
					}
				}
				if (options.format_vars) {
					var formatted = format_string_single(value, format_vars);
					if (!formatted)
						return;
					value = formatted;
				}
				if (options.properties) {
					if (property in options.properties) {
						options.properties[property](value, property);
					}
				}
				if (obj.important || options.force_important) {
					el.style.setProperty(property, value, "important");
				} else {
					el.style.setProperty(property, value);
				}
				el.setAttribute("data-imu-newstyle", true);
			};
			for (var property in styles) {
				array_foreach(styles[property], function(obj) {
					iter(property, obj);
				});
			}
		}
		function revert_styles(el) {
			var oldstyle = el.getAttribute("data-imu-oldstyle");
			if (oldstyle) {
				el.setAttribute("style", oldstyle);
				el.removeAttribute("data-imu-oldstyle");
			} else if (el.getAttribute("style") && el.getAttribute("data-imu-newstyle")) {
				el.removeAttribute("style");
			}
			el.removeAttribute("data-imu-newstyle");
		}
		function set_important_style(el, property, value) {
			el.style.setProperty(property, value, "important");
		}
		function get_caption(obj, el) {
			if (obj && obj.extra && obj.extra.caption) {
				return strip_whitespace(obj.extra.caption);
			}
			if (el) {
				do {
					var el_title = el.getAttribute("title");
					var el_alt = el.getAttribute("alt");
					if (el_title || el_alt) {
						var caption = el_title || el_alt;
						if (caption === el.src)
							return null;
						return strip_whitespace(caption);
					}
				} while ((el = el.parentElement));
			}
			return null;
		}
		function get_el_dimensions(el) {
			var el_tagname = get_tagname(el);
			if (el_tagname === "VIDEO") {
				return [
					el.videoWidth,
					el.videoHeight
				];
			} else if (el_tagname === "CANVAS") {
				return [
					el.width,
					el.height
				];
			} else if (el_tagname === "SVG") {
				return [
					el.width.animVal.value,
					el.height.animVal.value
				];
			} else if (el_tagname === "IMG" || el_tagname === "PICTURE") {
				return [
					el.naturalWidth,
					el.naturalHeight
				];
			} else { // e.g. <audio>
				return [
					el.offsetWidth || getUnit(el.style.width),
					el.offsetHeight || getUnit(el.style.height)
				];
			}
		}
		function add_link_to_history(link) {
			if (is_extension) {
				extension_send_message({
					type: "add_to_history",
					data: {
						url: link
					}
				});
			}
		}
		var parse_format = function(formatstr) {
			var segments = [];
			var push_segment = function() {
				if (!current.length)
					return;
				if (in_bracket) {
					segments.push({ text: current, type: "var" });
				} else {
					segments.push(current);
				}
				current = "";
			};
			var current = "";
			var in_bracket = false;
			var escape = false;
			for (var i = 0; i < formatstr.length; i++) {
				var c = formatstr[i];
				if (c === '\\') {
					if (escape) {
						current += '\\';
					} else {
						escape = true;
					}
					continue;
				}
				if (escape) {
					current += c;
					continue;
				}
				if (c === '{') {
					if (!in_bracket) {
						push_segment();
						in_bracket = true;
						continue;
					}
				} else if (c === '}') {
					if (in_bracket) {
						push_segment();
						in_bracket = false;
						continue;
					}
				}
				current += c;
			}
			push_segment();
			return segments;
		};
		var format_string_single = function(formatstr, vars) {
			formatstr = formatstr.replace(/\/\/.*/, "");
			formatstr = strip_whitespace(formatstr);
			if (!formatstr)
				return null;
			var parsed = parse_format(formatstr);
			var str = "";
			for (var i = 0; i < parsed.length; i++) {
				if (typeof parsed[i] === "string") {
					str += parsed[i];
				} else {
					var varname = parsed[i].text;
					var default_value = null;
					var compare_value = null;
					var compare_not = false;
					var op = null;
					var compare_flags = [];
					var match = varname.match(/^([^?]+)[?](.*)$/);
					if (match) {
						varname = match[1];
						default_value = match[2];
					}
					match = varname.match(/^([^!/:=]+)([!=]=)(.*)$/);
					if (match) {
						varname = match[1];
						compare_value = match[3];
						compare_not = match[2] === "!=";
						op = "eq";
					}
					match = varname.match(/^([^!/:=]+)(!)?\/([rc]{0,2})=(.*)$/);
					if (match) {
						varname = match[1];
						compare_value = match[4];
						compare_not = match[2] === "!";
						op = "contains";
						var flags = match[3];
						if (string_indexof(flags, "r") >= 0)
							compare_flags.push("regex");
						if (string_indexof(flags, "c") >= 0)
							compare_flags.push("nicase");
					}
					match = varname.match(/^([^!/:=]+):=(.*)$/);
					if (match) {
						varname = match[1];
						compare_value = match[2];
						op = "set";
					}
					var varvalue = vars[varname];
					var match = varname.match(/^(.*?):([0-9]+)(\.)?$/);
					if (match) {
						varvalue = vars[match[1]];
						if (varvalue) {
							var newvalue = varvalue.substr(0, parseInt(match[2]));
							if (match[3]) {
								if (newvalue !== varvalue) {
									newvalue += "\u2026";
								}
							}
							varvalue = newvalue;
						}
					}
					var usevar = !!varvalue;
					if (varvalue && typeof varvalue === "object") {
						var varobj = varvalue;
						varvalue = "";
						if ("usable" in varobj) {
							usevar = varobj.usable;
						}
						if ("value" in varobj) {
							varvalue = varobj.value;
						}
					}
					if (op) {
						if (usevar) {
							if (op === "eq") {
								usevar = varvalue === compare_value;
							} else if (op === "contains") {
								if (array_indexof(compare_flags, "nicase") < 0) {
									varvalue = varvalue.toLowerCase();
									compare_value = compare_value.toLowerCase(); // fixme: this might not be good for regex
								}
								if (array_indexof(compare_flags, "regex") >= 0) {
									usevar = (new RegExp(compare_value)).test(varvalue);
								} else {
									usevar = string_indexof(varvalue, compare_value) >= 0;
								}
							}
						}
						if (op === "set") {
							vars[varname] = compare_value;
							usevar = true;
						}
						if (compare_not)
							usevar = !usevar;
						varvalue = "";
					}
					if (!usevar) {
						if (typeof default_value === "string") {
							varvalue = default_value;
						} else {
							return null;
						}
					}
					str += varvalue;
				}
			}
			return strip_whitespace(str);
		};
		var pluralify = function(number, forms) {
			if (number === 1) {
				return forms[0];
			} else {
				return forms[1];
			}
		};
		var format_ago = function(delta, max_units) {
			if (!max_units)
				max_units = 2;
			delta = (delta / 1000) | 0;
			var units = {
				seconds: delta % 60,
				minutes: ((delta / 60) | 0) % 60,
				hours: ((delta / 60 / 60) | 0) % 24,
				days: ((delta / 60 / 60 / 24) | 0),
				months: ((delta / 60 / 60 / 24 / 30.4375) | 0),
				years: ((delta / 60 / 60 / 24 / 365.25) | 0) // (365 * 3 + 366) / 4
			};
			var mod_units = {
				months_years: 12,
				days_years: 365.25,
				days_months: 30.4375,
				days_weeks: 7
			};
			var unit_names = {
				seconds: "second",
				minutes: "minute",
				hours: "hour",
				days: "day",
				weeks: "week",
				months: "month",
				years: "year"
			};
			var unit_keys = Object.keys(units).reverse();
			var valid_units = [];
			array_foreach(unit_keys, function(unit) {
				if (valid_units.length >= max_units)
					return false;
				var value = units[unit];
				var last_valid = valid_units[valid_units.length - 1];
				if (last_valid) {
					var mod = mod_units[unit + "_" + last_valid[0]];
					if (mod) {
						value = (value % mod) | 0;
					}
				}
				if (!value) {
					if (valid_units.length)
						return false;
					return;
				}
				valid_units.push([unit, value]);
			});
			if (!valid_units.length) {
				return null;
			}
			var formatted_units = [];
			array_foreach(valid_units, function(unit_value) {
				var unit = unit_value[0];
				var value = unit_value[1];
				var unit_name = unit_names[unit];
				var proper_name = pluralify(value, [unit_name, unit_name + "s"]);
				formatted_units.push(value + " " + proper_name);
			});
			return formatted_units.join(" and ") + " ago";
		};
		var format_string = function(formatstrs, vars) {
			if (!is_array(formatstrs))
				formatstrs = formatstrs.split("\n");
			for (var i = 0; i < formatstrs.length; i++) {
				var formatted = format_string_single(formatstrs[i], vars);
				if (formatted)
					return formatted;
			}
			return null;
		};
		var fill_obj_filename = function(newobj, url, respdata) {
			if (typeof newobj.filename !== "string")
				newobj.filename = "";
			var modified_date = null;
			var contenttype_ext = null;
			var orig_filename = null;
			var wanted_ext = null;
			if (respdata) {
				try {
					var headers = parse_headers(respdata.responseHeaders);
					for (var h_i = 0; h_i < headers.length; h_i++) {
						var header_name = headers[h_i].name.toLowerCase();
						var header_value = headers[h_i].value;
						if (header_name === "content-disposition") {
							var loops = 0;
							while (loops < 100 && typeof header_value === "string" && header_value.length > 0) {
								var current_value = header_value.replace(/^\s*([^;]*?)\s*(?:;.*)?$/, "$1");
								var attr = current_value.replace(/^\s*([^=;]*?)\s*(?:[=;].*)?$/, "$1").toLowerCase();
								var a_match = header_value.match(/^[^=;]*(?:(?:=\s*(?:(?:["']([^'"]*?)["'])|([^;]*?))\s*(;.*)?\s*)|;\s*(.*))?$/);
								if (!a_match) {
									console_error("Header value does not match pattern:", header_value);
									break;
								}
								var a_value = a_match[1] || a_match[2];
								/*if (attr === "filename*") {
									newobj.filename = a_value;
								}*/
								if (newobj.filename.length === 0 && attr === "filename" && typeof a_value === "string" && a_value.length > 0) {
									newobj.filename = a_value;
								}
								header_value = a_match[3] || a_match[4];
								loops++;
							}
						} else if (header_name === "content-type") {
							contenttype_ext = get_ext_from_contenttype(header_value);
						} else if (header_name === "last-modified") {
							modified_date = new Date(header_value);
							if (isNaN(modified_date.getTime()))
								modified_date = null;
						}
						if (newobj.filename.length > 0 && contenttype_ext && modified_date) {
							break;
						}
					}
				} catch (e) {
					console_error(e);
				}
				var is_data = /^data:/.test(url);
				if (is_data)
					newobj.filename = "";
				var found_filename_from_url = false;
				if (newobj.filename.length === 0 && !is_data) {
					newobj.filename = url.replace(/.*\/([^?#/]*)(?:[?#].*)?$/, "$1");
					found_filename_from_url = true;
					if (false && (newobj.filename.split(".").length - 1) === 1) {
						newobj.filename = newobj.filename.replace(/(.*)\.[^.]*?$/, "$1");
					}
				}
				if (found_filename_from_url) {
					newobj.filename = decodeURIComponent(newobj.filename);
				}
				orig_filename = newobj.filename;
				if (newobj.filename.length === 0) {
					newobj.filename = "download";
				}
				var filename_split = url_basename(newobj.filename, {
					split_ext: true,
					known_ext: true
				});
				if (contenttype_ext && !filename_split[1]) {
					if (orig_filename.length)
						orig_filename += "." + contenttype_ext;
					newobj.filename += "." + contenttype_ext;
				}
				filename_split = url_basename(newobj.filename, {
					split_ext: true,
					known_ext: true
				});
				if (filename_split[1])
					wanted_ext = filename_split[1];
			}
			if (!("_orig_filename" in newobj))
				newobj._orig_filename = orig_filename;
			var format_vars = {
				filename: newobj._orig_filename
			};
			format_vars.host_url = window_location;
			format_vars.host_domain = get_domain_from_url(window_location);
			format_vars.host_domain_nosub = get_domain_nosub(format_vars.host_domain);
			try {
				format_vars.host_title = document.title;
			} catch (e) {
			}
			if (newobj.url && /^https?:\/\//i.test(newobj.url)) {
				format_vars.url = newobj.url;
				format_vars.domain = get_domain_from_url(newobj.url);
				format_vars.domain_nosub = get_domain_nosub(format_vars.domain);
			}
			var create_date = function(name, date) {
				var map = {
					"year": "FullYear",
					"month": "Month",
					"day": "Date",
					"hours": "Hours",
					"minutes": "Minutes",
					"seconds": "Seconds"
				};
				var values = [];
				for (var x in map) {
					var local_value = date["get" + map[x]]();
					var utc_value = date["getUTC" + map[x]]();
					if (x === "month") {
						local_value++;
						utc_value++;
					}
					local_value = zpadnum(local_value, 2);
					utc_value = zpadnum(utc_value, 2);
					values[x] = local_value;
					values[x + "_utc"] = utc_value;
					format_vars[name + "_" + x] = local_value;
					format_vars[name + "_" + x + "_utc"] = utc_value;
				}
				format_vars[name + "_iso"] = values.year + "-" + values.month + "-" + values.day + "T" + values.hours + "-" + values.minutes + "-" + values.seconds;
				format_vars[name + "_iso_utc"] = values.year_utc + "-" + values.month_utc + "-" + values.day_utc + "T" + values.hours_utc + "-" + values.minutes_utc + "-" + values.seconds_utc;
				format_vars[name + "_yyyymmdd"] = values.year + values.month + values.day;
				format_vars[name + "_yyyymmdd_utc"] = values.year_utc + values.month_utc + values.day_utc;
				format_vars[name + "_hhmmss"] = values.hours + values.minutes + values.seconds;
				format_vars[name + "_hhmmss_utc"] = values.hours_utc + values.minutes_utc + values.seconds_utc;
				var ago;
				if (name !== "download" && (ago = format_ago(Date.now() - date.getTime()))) {
					format_vars[name + "_ago"] = ago;
				}
				format_vars[name + "_unix_ms"] = date.getTime();
				format_vars[name + "_unix"] = (date.getTime() / 1000) | 0;
			};
			var created_date = null;
			var updated_date = null;
			var download_date = new Date();
			if (newobj.extra) {
				var extra_copy = [
					"caption",
					"author_username",
					"id"
				];
				array_foreach(extra_copy, function(prop) {
					format_vars[prop] = newobj.extra[prop];
				});
				if (newobj.extra.created_date)
					created_date = new Date(newobj.extra.created_date);
				if (newobj.extra.updated_date)
					updated_date = new Date(newobj.extra.updated_date);
			}
			if (!updated_date && modified_date)
				updated_date = modified_date;
			if (created_date)
				create_date("created", created_date);
			if (updated_date || created_date)
				create_date("updated", updated_date || created_date);
			if (download_date)
				create_date("download", download_date);
			if (created_date || updated_date)
				create_date("date", created_date || updated_date);
			if (format_vars.filename) {
				var ext_split = url_basename(format_vars.filename, {
					split_ext: true,
					known_ext: true
				});
				format_vars.filename_noext = ext_split[0];
				if (wanted_ext)
					format_vars.ext = "." + wanted_ext;
			}
			newobj.format_vars = shallowcopy(format_vars);
			var new_filename = get_filename_from_format(settings.filename_format, format_vars);
			if (new_filename) {
				newobj.filename = new_filename;
			} else {
				newobj.filename = add_filename_ext(newobj.filename, format_vars);
			}
		};
		var format_string_post = function(str, vars) {
			if (str) {
				if (vars.prefix)
					str = vars.prefix + str;
				if (vars.suffix)
					str += vars.suffix;
			}
			return str;
		};
		var add_filename_ext = function(filename, format_vars) {
			filename = format_string_post(filename, format_vars);
			var filename_split = url_basename(filename, {
				split_ext: true,
				known_ext: true
			});
			if (!filename_split[1] && format_vars.ext) {
				filename += format_vars.ext;
			}
			return filename;
		};
		var get_filename_from_format = function(format, format_vars) {
			var formatted = format_string(format, format_vars);
			if (!formatted)
				return null;
			return add_filename_ext(formatted, format_vars);
		};
		function makePopup(obj, orig_url, processing, data) {
			if (_nir_debug_) {
				console_log("makePopup", obj, orig_url, processing, data);
			}
			if (settings.mouseover_add_to_history) {
				add_link_to_history(data.data.obj.url);
			}
			var openb = get_tprofile_single_setting("mouseover_open_behavior");
			if (openb === "newtab" || openb === "newtab_bg" || openb === "download" || openb === "copylink" || openb === "replace") {
				stop_waiting();
				var theobj = data.data.obj;
				if (typeof theobj === "string") {
					theobj = { url: theobj };
				}
				var resp = data.data.resp || data.data.respdata;
				if (resp.finalUrl)
					theobj.url = resp.finalUrl;
				fill_obj_filename(theobj, theobj.url, resp);
				popup_obj = theobj;
				if (openb === "newtab" || openb === "newtab_bg") {
					open_in_tab_imu(theobj, openb === "newtab_bg");
				} else if (openb === "download") {
					download_popup_media();
				} else if (openb === "copylink") {
					clipboard_write_link(theobj.url);
				} else if (openb === "replace") {
					var replace_options = get_replace_images_options();
					replace_single_media(replace_options, { el: popup_el }, data, common_functions["nullfunc"]);
				}
				return;
			}
			var x = data.x;
			var y = data.y;
			if (x === null || x === void 0) {
				x = lastX;
			}
			if (y === null || y === void 0) {
				y = lastY;
			}
			dragged = false;
			dragstart = false;
			var seekstart = false;
			function cb(img, url) {
				if (!img) {
					delay_handle_triggering = false;
					if (processing.running) {
						stop_waiting_cant_load();
					}
					return;
				}
				var is_video = img.tagName === "VIDEO";
				var is_audio = img.tagName === "AUDIO";
				var is_stream = is_video || is_audio;
				var newobj = data.data.obj;
				if (!newobj)
					newobj = {};
				popup_obj = newobj;
				var estop = function(e) {
					e.stopPropagation();
					e.stopImmediatePropagation();
					return true;
				};
				var estop_pd = function(e) {
					e.preventDefault();
					estop(e);
					return true;
				};
				lastX = x;
				lastY = y;
				popupOpenX = x;
				popupOpenY = y;
				popupOpenLastX = x;
				popupOpenLastY = y;
				var initial_zoom_behavior = get_single_setting("mouseover_zoom_behavior");
				var last_zoom_behavior = get_single_setting("mouseover_zoom_use_last");
				var use_last_zoom = false;
				if (popup_last_zoom && (last_zoom_behavior === "always" ||
					(last_zoom_behavior === "gallery" && popup_el_automatic))) {
					use_last_zoom = true;
				}
				var bgcolor = "#333";
				var fgcolor = "#fff";
				var textcolor = "#fff";
				var shadowcolor = "rgba(0,0,0,.5)";
				var enable_mask_styles = get_single_setting("mouseover_enable_mask_styles2");
				var old_mask_opacity = 1;
				var setup_mask_el = function(mask) {
					set_el_all_initial(mask);
					set_important_style(mask, "opacity", 1);
					if (enable_mask_styles !== "never") {
						apply_styles(mask, settings.mouseover_mask_styles2, {
							force_important: true
						});
					}
					old_mask_opacity = mask.style.opacity;
					if (enable_mask_styles === "hold") {
						set_important_style(mask, "opacity", 0);
					}
					if (!settings.mouseover_close_click_outside &&
						!settings.mouseover_mask_ignore_clicks) {
						set_important_style(mask, "pointer-events", "none");
					}
					set_important_style(mask, "position", "fixed");
					set_important_style(mask, "z-index", maxzindex - 3);
					set_important_style(mask, "width", "100%");
					set_important_style(mask, "height", "100%");
					set_important_style(mask, "left", "0px");
					set_important_style(mask, "top", "0px");
					if (settings.mouseover_mask_fade_time > 0) {
						set_important_style(mask, "transition", "opacity " + (settings.mouseover_mask_fade_time / 1000.) + "s");
						if (enable_mask_styles !== "hold") {
							if (!popup_el_automatic) {
								set_important_style(mask, "opacity", 0);
								setTimeout(function() {
									set_important_style(mask, "opacity", old_mask_opacity);
								}, 1);
							} else {
								set_important_style(mask, "opacity", old_mask_opacity);
							}
						}
					}
					our_addEventListener(mask, "mousedown", function(e) {
						if (!settings.mouseover_close_click_outside)
							return;
						estop(e);
					});
					our_addEventListener(mask, "click", function(e) {
						if (!settings.mouseover_close_click_outside)
							return;
						estop(e);
						set_important_style(mask, "pointer-events", "none");
						resetpopups();
					}, true);
					return mask;
				};
				remove_mask();
				if (settings.mouseover_close_click_outside ||
					settings.mouseover_mask_ignore_clicks ||
					enable_mask_styles !== "never") {
					mask_el = document_createElement("div");
					setup_mask_el(mask_el);
				}
				var outerdiv = document_createElement("div");
				set_el_all_initial(outerdiv);
				set_important_style(outerdiv, "position", "fixed");
				set_important_style(outerdiv, "z-index", maxzindex - 2);
				var zoom_move_effect_enabled = false;
				if (settings.mouseover_fade_time > 0 && !popup_el_automatic) {
					var transition_effects = [];
					var temp_transition_effects = [];
					var fade_s = (settings.mouseover_fade_time / 1000.) + "s";
					if (settings.mouseover_enable_fade) {
						transition_effects.push("opacity " + fade_s);
						set_important_style(outerdiv, "opacity", 0);
					}
					if (settings.mouseover_enable_zoom_effect) {
						transition_effects.push("transform " + fade_s);
						set_important_style(outerdiv, "transform", "scale(0)");
						if (settings.mouseover_zoom_effect_move) {
							temp_transition_effects.push("top " + fade_s);
							temp_transition_effects.push("left " + fade_s);
							zoom_move_effect_enabled = true;
						}
					}
					if (transition_effects.length > 0) {
						var orig_transition_string = transition_effects.join(", ");
						array_extend(transition_effects, temp_transition_effects);
						var temp_transition_string = transition_effects.join(", ");
						set_important_style(outerdiv, "transition", temp_transition_string);
						if (temp_transition_effects.length > 0) {
							setTimeout(function() {
								set_important_style(outerdiv, "transition", orig_transition_string);
							}, settings.mouseover_fade_time);
						}
					}
					setTimeout(function() {
						set_important_style(outerdiv, "opacity", 1);
						set_important_style(outerdiv, "transform", "scale(1)");
					}, 1);
				}
				var div = document_createElement("div");
				var popupshown = false;
				set_el_all_initial(div);
				set_important_style(div, "box-shadow", "0 0 15px " + shadowcolor);
				set_important_style(div, "border", "3px solid " + fgcolor);
				set_important_style(div, "position", "relative");
				set_important_style(div, "top", "0px");
				set_important_style(div, "left", "0px");
				set_important_style(div, "display", "block");
				set_important_style(div, "background-color", "rgba(255,255,255,.5)");
				var transparent_gif = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
				var styles_variables = {};
				if (popup_orig_url && !popup_el_is_stream) {
					styles_variables["%thumburl%"] = encodeuri_ifneeded(popup_orig_url);
				} else {
					styles_variables["%thumburl%"] = transparent_gif;
				}
				if (!is_stream) {
					styles_variables["%fullurl%"] = encodeuri_ifneeded(get_img_src(img));
				} else {
					styles_variables["%fullurl%"] = transparent_gif;
				}
				apply_styles(div, settings.mouseover_styles, {
					force_important: true,
					old_variables: styles_variables
				});
				outerdiv.appendChild(div);
				var outer_thresh = 16;
				var border_thresh = 20;
				var top_thresh = 30;
				var top_mb = top_thresh - border_thresh;
				var viewport;
				var vw;
				var vh;
				var v_mx = Math_max(x - border_thresh, 0);
				var v_my = Math_max(y - top_thresh, 0);
				var update_vwh = function(x, y) {
					viewport = get_viewport();
					vw = viewport[0];
					vh = viewport[1];
					vw -= border_thresh * 2;
					vh -= border_thresh + top_thresh;
					if (typeof x !== "undefined") {
						v_mx = Math_min(vw, Math_max(x - border_thresh, 0));
						v_my = Math_min(vh, Math_max(y - top_thresh, 0));
					}
				};
				var set_top = function(x) {
					outerdiv.style.top = x + "px";
				};
				var set_left = function(x) {
					outerdiv.style.left = x + "px";
				};
				var set_lefttop = function(xy) {
					set_top(xy[1]);
					set_left(xy[0]);
				};
				function get_lefttopouter() {
					var style = outerdiv.currentStyle || window.getComputedStyle(outerdiv);
					return [style.marginLeft + style.borderLeftWidth,
						style.marginTop + style.borderTopWidth];
				}
				update_vwh(x, y);
				var set_audio_size = function() {
					if (!is_audio)
						return;
					img.style.width = "500px";
					img.style.minWidth = "500px";
					img.style.height = "50px";
					img.style.minHeight = "50px";
				};
				set_audio_size();
				var el_dimensions = get_el_dimensions(img);
				if (!is_audio)
					set_el_all_initial(img);
				var add_link = false;
				if (!is_stream && settings.mouseover_add_link) {
					add_link = true;
				} else if (is_video && settings.mouseover_add_video_link) {
					add_link = true;
				}
				if (add_link) {
					img.style.cursor = "pointer";
				}
				img.style.verticalAlign = "bottom";
				set_important_style(img, "display", "block");
				var update_img_display = function(style) {
					img.style.setProperty("display", style[0], style[1]);
				};
				var visibility_workarounds = [
					{
						domain_nosub: /^pornhub(?:premium)?\./,
						img_display: ["block"]
					},
					{
						domain_nosub: /^pornhub(?:premium)?\./,
						img_display: ["initial", "important"]
					},
					{
						domain_nosub: /^gelbooru\./,
						func: function() {
							var span_el = document_createElement("span");
							span_el.appendChild(img);
							a.appendChild(span_el);
						}
					}
				];
				var check_visibility_workaround = function(workaround) {
					if (workaround.domain_nosub) {
						if (!workaround.domain_nosub.test(host_domain_nosub))
							return false;
					}
					return true;
				};
				var apply_visibility_workaround = function(workaround) {
					if (workaround.img_display) {
						update_img_display(workaround.img_display);
					} else if (workaround.func) {
						workaround.func();
					}
				};
				var check_img_visibility = function() {
					setTimeout(function() {
						var computed = get_computed_style(img);
						if (computed.display !== "none") {
							return;
						}
						while (visibility_workarounds.length > 0) {
							var current_workaround = visibility_workarounds.shift();
							if (!check_visibility_workaround(current_workaround))
								continue;
							apply_visibility_workaround(current_workaround);
							if (visibility_workarounds.length > 0)
								check_img_visibility();
							break;
						}
					}, 50);
				};
				check_img_visibility();
				set_important_style(img, "object-fit", "contain");
				var img_naturalHeight, img_naturalWidth;
				img_naturalWidth = el_dimensions[0];
				img_naturalHeight = el_dimensions[1];
				var imgh = img_naturalHeight;
				var imgw = img_naturalWidth;
				var setup_initial_zoom = function(initial_zoom_behavior, use_last_zoom) {
					var update_sizes = false;
					if (initial_zoom_behavior === "custom" || use_last_zoom) {
						var zoom_percent = settings.mouseover_zoom_custom_percent / 100;
						if (use_last_zoom)
							zoom_percent = popup_last_zoom;
						imgw = Math_max(img_naturalWidth * zoom_percent, 20);
						imgh = Math_max(img_naturalHeight * zoom_percent, 20);
						update_sizes = true;
					} else if (initial_zoom_behavior === "fit" || initial_zoom_behavior === "fill") {
						img.style.maxWidth = vw + "px";
						img.style.maxHeight = vh + "px";
						if (initial_zoom_behavior === "fill" && (img_naturalWidth < vw && img_naturalHeight < vh)) {
							var zoom_percent = 1;
							if (img_naturalHeight > img_naturalWidth) {
								zoom_percent = vh / img_naturalHeight;
							} else {
								zoom_percent = vw / img_naturalWidth;
							}
							imgw *= zoom_percent;
							imgh *= zoom_percent;
							update_sizes = true;
						}
					} else if (initial_zoom_behavior === "full") {
						imgw = img_naturalWidth;
						imgh = img_naturalHeight;
						update_sizes = true;
					}
					if (update_sizes) {
						img.style.maxWidth = imgw + "px";
						img.style.width = img.style.maxWidth;
						img.style.maxHeight = imgh + "px";
						img.style.height = img.style.maxHeight;
					}
				};
				setup_initial_zoom(initial_zoom_behavior, use_last_zoom);
				if (imgh < 20 || imgw < 20) {
					stop_waiting_cant_load();
					console_error("Image too small to popup (" + imgw + "x" + imgh + ")");
					return;
				}
				var get_imghw_for_fit = function(width, height) {
					if (width === void 0)
						width = vw;
					if (height === void 0)
						height = vh;
					var our_imgh = imgh;
					var our_imgw = imgw;
					if (imgh > height || imgw > width) {
						var ratio;
						if (imgh / height >
							imgw / width) {
							ratio = imgh / height;
						} else {
							ratio = imgw / width;
						}
						our_imgh /= ratio;
						our_imgw /= ratio;
					}
					return [our_imgw, our_imgh];
				};
				function calc_imghw_for_fit(width, height) {
					var new_imghw = get_imghw_for_fit(width, height);
					imgw = new_imghw[0];
					imgh = new_imghw[1];
				}
				if ((initial_zoom_behavior === "fit" || initial_zoom_behavior === "fill") && !use_last_zoom) {
					calc_imghw_for_fit();
				}
				var max_width = settings.mouseover_zoom_max_width || void 0;
				var max_height = settings.mouseover_zoom_max_height || void 0;
				if (max_width || max_height) {
					calc_imghw_for_fit(max_width, max_height);
				}
				popup_update_zoom_func = function(mode) {
					var use_last_zoom = false;
					if (mode === "last") {
						mode = get_single_setting("mouseover_zoom_behavior");
						if (popup_last_zoom)
							use_last_zoom = true;
					}
					setup_initial_zoom(mode, use_last_zoom);
					if (mode === "fit" || mode === "fill")
						calc_imghw_for_fit();
					set_popup_width(imgw, "initial");
					set_popup_height(imgh, "initial");
				};
				popup_update_pos_func = function(x, y, resize) {
					var popup_left, popup_top;
					update_vwh(x, y);
					var sct = scrollTop();
					var scl = scrollLeft();
					sct = scl = 0;
					var overflow_x = imgw > vw;
					var overflow_y = imgh > vh;
					var mouseover_position = get_single_setting("mouseover_position");
					if ((popup_hold && settings.mouseover_hold_position_center) ||
						(settings.mouseover_overflow_position_center && (overflow_x || overflow_y)))
						mouseover_position = "center";
					if (mouseover_position === "cursor") {
						popup_top = sct + Math_min(Math_max(v_my - (imgh / 2), 0), Math_max(vh - imgh, 0));
						popup_left = scl + Math_min(Math_max(v_mx - (imgw / 2), 0), Math_max(vw - imgw, 0));
					} else if (mouseover_position === "center") {
						var origin = get_single_setting("mouseover_overflow_origin");
						var ox = origin[1];
						var oy = origin[2];
						var top_x = 0;
						var top_y = 0;
						var bottom_x = vw - imgw;
						var bottom_y = vh - imgh;
						var middle_x = (vw - imgw) / 2;
						var middle_y = (vh - imgh) / 2;
						var our_x = middle_x;
						var our_y = middle_y;
						if (overflow_x) {
							if (ox === "0") {
								our_x = top_x;
							} else if (ox === "1") {
								our_x = middle_x;
							} else if (ox === "2") {
								our_x = bottom_x;
							}
						}
						if (overflow_y) {
							if (oy === "0") {
								our_y = top_y;
							} else if (oy === "1") {
								our_y = middle_y;
							} else if (oy === "2") {
								our_y = bottom_y;
							}
						}
						popup_top = sct + our_y;
						popup_left = scl + our_x;
					} else if (mouseover_position === "beside_cursor") {
						var update_imghw;
						if (resize) {
							update_imghw = function(w, h) {
								calc_imghw_for_fit(w, h);
							};
						} else {
							update_imghw = common_functions.nullfunc;
						}
						var calc_imgrect = function(w, h) {
							var new_imghw = [imgw, imgh];
							if (resize) {
								new_imghw = get_imghw_for_fit(w, h);
							}
							if (new_imghw[0] > w || new_imghw[1] > h)
								return null;
							return new_imghw;
						};
						var cursor_thresh = border_thresh;
						var ovw = vw - cursor_thresh;
						var ovh = vh - cursor_thresh;
						var calc_imgposd = function(lefttop, info, popupd) {
							var moused = lefttop ? v_mx : v_my;
							var vd = lefttop ? ovw : ovh;
							switch (info) {
								case -1:
									return Math_min(vd - popupd, Math_max(0, moused - (popupd / 2)));
								case 0:
									return Math_max(0, moused - popupd - cursor_thresh);
								case 1:
									return Math_min(vd - popupd, moused + cursor_thresh);
							}
						};
						var all_rects = [
							[-1, 0, ovw, v_my - cursor_thresh],
							[1, -1, ovw - v_mx - cursor_thresh, ovh],
							[-1, 1, ovw, ovh - v_my - cursor_thresh],
							[0, -1, v_mx - cursor_thresh, ovh]
						];
						var rects = [];
						if (x > viewport[0] / 2) {
							rects.push(all_rects[3]);
						} else {
							rects.push(all_rects[1]);
						}
						if (y > viewport[1] / 2) {
							rects.push(all_rects[0]);
						} else {
							rects.push(all_rects[2]);
						}
						for (var i = 0; i < all_rects.length; i++) {
							if (array_indexof(rects, all_rects[i]) < 0) {
								rects.push(all_rects[i]);
							}
						}
						var largest_rectsize = -1;
						var largest_rect = null;
						var largest_origrect = null;
						for (var i = 0; i < rects.length; i++) {
							var our_rect = calc_imgrect(rects[i][2], rects[i][3]);
							if (!our_rect)
								continue;
							var our_rectsize = our_rect[0] * our_rect[1];
							if (our_rectsize > largest_rectsize) {
								largest_rectsize = our_rectsize;
								largest_rect = our_rect;
								largest_origrect = rects[i];
							}
						}
						if (!largest_origrect) {
							largest_rectsize = -1;
							for (var i = 0; i < rects.length; i++) {
								var rectsize = rects[i][2] * rects[i][3];
								if (rectsize > largest_rectsize) {
									largest_origrect = rects[i];
									largest_rectsize = rectsize;
								}
							}
						}
						if (largest_origrect) {
							update_imghw(largest_origrect[2], largest_origrect[3]);
							popup_top = calc_imgposd(false, largest_origrect[1], imgh);
							popup_left = calc_imgposd(true, largest_origrect[0], imgw);
						} else {
						}
					} else if (mouseover_position === "beside_cursor_old") {
						var popupx;
						var popupy;
						var cursor_thresh = border_thresh;
						var ovw = vw - cursor_thresh;
						var ovh = vh - cursor_thresh;
						var update_imghw;
						if (resize) {
							update_imghw = function(w, h) {
								calc_imghw_for_fit(w, h);
							};
						} else {
							update_imghw = common_functions.nullfunc;
						}
						update_imghw(ovw, ovh);
						for (var loop_i = 0; loop_i < (resize ? 16 : 1); loop_i++) {
							if (y > viewport[1] / 2) {
								popupy = v_my - imgh - cursor_thresh;
							} else if (popupy === void 0) {
								popupy = v_my + cursor_thresh;
							}
							if (x > viewport[0] / 2) {
								popupx = v_mx - imgw - cursor_thresh;
							} else if (popupx === void 0) {
								popupx = v_mx + cursor_thresh;
							}
							if (popupy < 0) {
								popupy = 0;
								if (settings.mouseover_prevent_cursor_overlap) {
									update_imghw(ovw, v_my);
								}
							}
							if (popupx < 0) {
								popupx = 0;
								if (settings.mouseover_prevent_cursor_overlap) {
									update_imghw(v_mx, ovh);
								}
							}
							if ((popupy + imgh) > vh) {
								if (settings.mouseover_prevent_cursor_overlap) {
									update_imghw(ovw, ovh - v_my);
								} else {
									popupy = Math_max(vh - imgh - cursor_thresh, 0);
								}
							}
							if ((popupx + imgw) > vw) {
								if (settings.mouseover_prevent_cursor_overlap) {
									update_imghw(ovw - v_mx, ovh);
								} else {
									popupx = Math_max(vw - imgw - cursor_thresh, 0);
								}
							}
						}
						popup_top = popupy;
						popup_left = popupx;
					}
					return [
						popup_left + border_thresh,
						popup_top + top_thresh
					];
				};
				var initialpos = popup_update_pos_func(x, y, true);
				if (!zoom_move_effect_enabled) {
					set_lefttop(initialpos);
				} else {
					set_lefttop([x - imgw / 2, y - imgh / 2]);
					setTimeout(function() {
						set_lefttop(initialpos);
					}, 1);
				}
				var set_popup_size_helper = function(size, maxsize, widthheight) {
					if (maxsize === void 0)
						maxsize = size;
					if (typeof size === "number")
						size = size + "px";
					if (typeof maxsize === "number")
						maxsize = maxsize + "px";
					if (widthheight) {
						img.style.width = size;
						img.style.maxWidth = maxsize;
					} else {
						img.style.height = size;
						img.style.maxHeight = maxsize;
					}
				};
				var set_popup_width = function(width, maxwidth) {
					set_popup_size_helper(width, maxwidth, true);
				};
				var set_popup_height = function(height, maxheight) {
					set_popup_size_helper(height, maxheight, false);
				};
				set_popup_width(imgw, "initial");
				set_popup_height(imgh, "initial");
				/*console_log(x - (imgw / 2));
				  console_log(vw);
				  console_log(imgw);
				  console_log(vw - imgw);*/
				function get_defaultopacity() {
					var defaultopacity = (settings.mouseover_ui_opacity / 100);
					if (isNaN(defaultopacity))
						defaultopacity = 1;
					if (defaultopacity > 1)
						defaultopacity = 1;
					if (defaultopacity < 0)
						defaultopacity = 0;
					return defaultopacity;
				}
				var defaultopacity = get_defaultopacity();
				function opacity_hover(el, targetel, action) {
					if (!targetel)
						targetel = el;
					our_addEventListener(el, "mouseover", function(e) {
						targetel.style.opacity = "1.0";
						if (action)
							targetel.style.boxShadow = "0px 0px 5px 1px white";
					}, true);
					our_addEventListener(el, "mouseout", function(e) {
						targetel.style.opacity = get_defaultopacity();
						if (action)
							targetel.style.boxShadow = "none";
					}, true);
				}
				var get_popup_dimensions = function() {
					return [
						(popupshown && outerdiv.clientWidth) || imgw,
						(popupshown && outerdiv.clientHeight) || imgh
					];
				};
				var btndown = false;
				function addbtn(options) {
					var tagname = "span";
					if (typeof options.action === "string")
						tagname = "a";
					var btn = document_createElement(tagname);
					if (options.action) {
						var do_action = function() {
							return !btn.hasAttribute("data-btn-noaction");
						};
						if (typeof options.action === "object") {
							var old_action = options.action;
							options.action = function() {
								action_handler(old_action);
							};
						}
						our_addEventListener(btn, "mousedown", function(e) {
							e.stopPropagation();
							e.stopImmediatePropagation();
						});
						if (typeof options.action === "function") {
							our_addEventListener(btn, "click", function(e) {
								if (!do_action())
									return;
								e.stopPropagation();
								e.stopImmediatePropagation();
								e.preventDefault();
								options.action();
								return false;
							}, true);
						} else if (typeof options.action === "string") {
							btn.href = options.action;
							btn.target = "_blank";
							btn.setAttribute("rel", "noreferrer");
							our_addEventListener(btn, "click", function(e) {
								e.stopPropagation();
								e.stopImmediatePropagation();
							}, true);
						}
						our_addEventListener(btn, "mouseover", function(e) {
							set_important_style(btn, "box-shadow", "0px 0px 5px 1px white");
						}, true);
						our_addEventListener(btn, "mouseout", function(e) {
							set_important_style(btn, "box-shadow", "none");
						}, true);
					}
					our_addEventListener(btn, "mousedown", function(e) {
						btndown = true;
					}, true);
					our_addEventListener(btn, "mouseup", function(e) {
						btndown = false;
					}, true);
					if (false && !options.istop) {
						opacity_hover(btn, void 0, true);
					} else if (typeof options.text === "object" && options.text.truncated !== options.text.full) {
						our_addEventListener(btn, "mouseover", function(e) {
							var computed_style = get_computed_style(btn);
							set_important_style(btn, "width", computed_style.width || (btn.clientWidth + "px"));
							set_important_style(btn, "height", "initial");
							btn.innerText = options.text.full;
						}, true);
						our_addEventListener(btn, "mouseout", function(e) {
							btn.innerText = options.text.truncated;
							btn.style.width = "initial";
						}, true);
					}
					set_el_all_initial(btn);
					if (options.action) {
						set_important_style(btn, "cursor", "pointer");
					}
					set_important_style(btn, "background", bgcolor);
					set_important_style(btn, "border", "3px solid " + fgcolor);
					set_important_style(btn, "border-radius", "10px");
					set_important_style(btn, "direction", text_direction);
					if (typeof options.text === "string" && options.text.length === 1 && options.text.charCodeAt(0) > 256) {
						set_important_style(btn, "color", "transparent");
						set_important_style(btn, "text-shadow", "0 0 0 " + textcolor);
					} else {
						set_important_style(btn, "color", textcolor);
					}
					set_important_style(btn, "padding", "4px");
					set_important_style(btn, "line-height", "1em");
					set_important_style(btn, "font-size", "14px");
					set_important_style(btn, "font-family", sans_serif_font);
					apply_styles(btn, settings.mouseover_ui_styles, {
						id: options.id,
						force_important: true,
						format_vars: newobj.format_vars,
						properties: {
							"-imu-text": function(value) {
								if (typeof options.text === "object")
									options.text.truncated = value;
								else
									options.text = value;
							},
							"-imu-title": function(value) {
								options.title = value;
							},
							"-imu-image": function(value) {
								options.image = value;
							},
							"-imu-pos": function(value) {
								options.pos = value;
								if (array_indexof(["top-left", "top-middle", "top-right",
									"left", "middle", "right",
									"bottom-left", "bottom-middle", "bottom-right"], value) < 0) {
									console_warn("Invalid pos", value);
									options.pos = "top-left";
								}
							}
						}
					});
					if (options.image) {
						options.text = null;
					}
					set_important_style(btn, "z-index", maxzindex - 1);
					if (false && !options.istop) {
						set_important_style(btn, "position", "absolute");
						set_important_style(btn, "opacity", defaultopacity);
					} else {
						set_important_style(btn, "position", "relative");
						set_important_style(btn, "margin-right", "4px");
					}
					set_important_style(btn, "vertical-align", "top");
					set_important_style(btn, "white-space", "pre-wrap");
					set_important_style(btn, "display", "inline-block");
					if (options.action) {
						set_important_style(btn, "user-select", "none");
					}
					if (typeof options.image === "string") {
						var img = document_createElement("img");
						set_el_all_initial(img);
						set_important_style(img, "padding", "0px");
						set_important_style(img, "margin", "0px");
						set_important_style(img, "display", "inline");
						set_important_style(img, "height", "1em");
						set_important_style(img, "cursor", "inherit");
						img.src = options.image;
						btn.appendChild(img);
					}
					if (options.text) {
						if (typeof options.text === "object" && options.text.link_underline && settings.mouseover_ui_link_underline) {
							set_important_style(btn, "text-decoration", "underline");
						}
						if (typeof options.text === "string") {
							btn.innerText = options.text;
						} else if (typeof options.text === "object") {
							btn.innerText = options.text.truncated;
						}
					}
					if (options.title)
						btn.title = options.title;
					if (options.containers && options.pos) {
						var container = options.containers[options.pos];
						container.appendChild(btn);
						var dimensions = get_popup_dimensions();
						if (container.hasAttribute("data-imu-middle_x")) {
							set_important_style(container, "left", ((dimensions[0] - container.clientWidth) / 2) + "px");
						}
						if (container.hasAttribute("data-imu-middle_y")) {
							set_important_style(container, "top", ((dimensions[1] - container.clientHeight) / 2) + "px");
						}
					}
					return btn;
				}
				var ui_els = [];
				var text_direction = "initial";
				var popup_el_style;
				if (popup_el) {
					popup_el_style = get_computed_style(popup_el);
				} else {
					popup_el_style = get_computed_style(document.body);
				}
				if (popup_el_style && popup_el_style.direction === "rtl") {
					text_direction = "rtl";
				}
				var cached_previmages = 0;
				var cached_nextimages = 0;
				function lraction(isright, is_scroll) {
					trigger_gallery(isright ? 1 : -1, function(changed) {
						if (!changed) {
							if (is_scroll) {
								if (isright && settings.scroll_past_gallery_end_to_close) {
									resetpopups();
									return;
								}
							}
							create_ui();
						}
					});
				}
				var create_containerel = function(x, y, margin, boundingclientrect) {
					var topbarel = document_createElement("div");
					set_el_all_initial(topbarel);
					set_important_style(topbarel, "position", "absolute");
					set_important_style(topbarel, "opacity", defaultopacity);
					if (can_use_subzindex)
						set_important_style(topbarel, "z-index", maxzindex - 1);
					set_important_style(topbarel, "white-space", "nowrap");
					set_important_style(topbarel, "direction", "ltr");
					var left = null;
					var top = null;
					var bottom = null;
					var right = null;
					var original_width = imgw || img_naturalWidth;
					var bounding_width = boundingclientrect.width || original_width;
					var bounding_wadd = (bounding_width - original_width) / 2;
					var original_height = imgh || img_naturalHeight;
					var bounding_height = boundingclientrect.height || original_height;
					var bounding_hadd = (bounding_height - original_height) / 2;
					if (x === "left") {
						left = -(margin + bounding_wadd) + "px";
					} else if (x === "middle") {
						left = "calc(50%)";
						topbarel.setAttribute("data-imu-middle_x", "true");
					} else if (x === "right") {
						right = -(margin + bounding_wadd) + "px";
					}
					if (y === "top") {
						top = -(margin + bounding_hadd) + "px";
					} else if (y === "middle") {
						top = "calc(50%)";
						topbarel.setAttribute("data-imu-middle_y", "true");
					} else if (y === "bottom") {
						bottom = -(margin + bounding_hadd) + "px";
					}
					if (left)
						set_important_style(topbarel, "left", left);
					if (right)
						set_important_style(topbarel, "right", right);
					if (top)
						set_important_style(topbarel, "top", top);
					if (bottom)
						set_important_style(topbarel, "bottom", bottom);
					return topbarel;
				};
				var ui_visible = !!settings.mouseover_ui;
				function create_ui(use_cached_gallery, hide_ui) {
					for (var el_i = 0; el_i < ui_els.length; el_i++) {
						var ui_el = ui_els[el_i];
						ui_el.parentNode.removeChild(ui_el);
					}
					ui_els = [];
					var emi = 14;
					var em1 = emi + "px";
					var emhalf = (emi / 2) + "px";
					var gallerycount_fontsize = "13px";
					var galleryinput_fontsize = "12px";
					var img_boundingClientRect = img.getBoundingClientRect();
					var css_fontcheck = "14px " + sans_serif_font;
					var containers = {};
					var container_metas = {
						"top-left": ["left", "top"],
						"top-middle": ["middle", "top"],
						"top-right": ["right", "top"],
						"left": ["left", "middle"],
						"middle": ["middle", "middle"],
						"right": ["right", "middle"],
						"bottom-left": ["left", "bottom"],
						"bottom-middle": ["middle", "bottom"],
						"bottom-right": ["right", "bottom"]
					};
					obj_foreach(container_metas, function(key, data) {
						containers[key] = create_containerel(data[0], data[1], emi, img_boundingClientRect);
					});
					var do_hide = !settings.mouseover_ui;
					if (hide_ui) {
						if (hide_ui === "toggle") {
							do_hide = ui_visible;
						} else if (hide_ui === true) {
							do_hide = true;
						}
					}
					if (do_hide) {
						outerdiv.appendChild(containers["top-left"]);
						ui_visible = false;
						return;
					} else {
						ui_visible = true;
					}
					for (var pos in containers) {
						opacity_hover(containers[pos]);
						outerdiv.appendChild(containers[pos]);
						ui_els.push(containers[pos]);
					}
					if (settings.mouseover_ui_closebtn) {
						var closebtn = addbtn({
							id: "closebtn",
							text: "\xD7",
							title: _("Close") + " (" + _("ESC") + ")",
							action: function() {
								resetpopups();
							},
							pos: "top-left",
							containers: containers
						});
					}
					;
					var get_img_orientation = function() {
						var rotation = get_popup_rotation();
						if (Math_abs(rotation) % 180 == 90) {
							return true;
						} else {
							return false;
						}
					};
					var get_img_width = function() {
						return img_boundingClientRect.width || imgw || img_naturalWidth;
					};
					var get_img_height = function() {
						return img_boundingClientRect.height || imgh || img_naturalHeight;
					};
					var get_img_disp_height = function() {
						if (get_img_orientation()) {
							return get_img_width();
						} else {
							return get_img_height();
						}
					};
					var prev_images = 0;
					var next_images = 0;
					var gallery_calcing = false;
					function get_imagesizezoom_text() {
						var text = "";
						var rect_height = get_img_disp_height();
						var zoom_percent = rect_height / img_naturalHeight;
						var currentzoom = parse_int(zoom_percent * 100);
						var filesize = 0;
						if (newobj && newobj.filesize)
							filesize = newobj.filesize;
						var format = "";
						var formatorder = [
							{
								value: img_naturalWidth + "x" + img_naturalHeight,
								valid: settings.mouseover_ui_imagesize,
							},
							{
								value: currentzoom + "%",
								valid_paren: currentzoom !== 100 ? true : false,
								valid: settings.mouseover_ui_zoomlevel
							},
							{
								value: size_to_text(filesize),
								valid: settings.mouseover_ui_filesize && filesize
							}
						];
						var entries = [];
						for (var i = 0; i < formatorder.length; i++) {
							var our_format = formatorder[i];
							if (!our_format.valid)
								continue;
							if (entries.length > 0 && our_format.valid_paren === false)
								continue;
							entries.push(our_format.value);
						}
						if (entries.length === 0)
							return "";
						text = entries[0];
						if (entries.length > 1) {
							text += " (" + entries.slice(1).join(", ") + ")";
						}
						return text;
					}
					if (settings.mouseover_ui_imagesize || settings.mouseover_ui_zoomlevel || settings.mouseover_ui_filesize) {
						var imagesize = addbtn({
							id: "sizeinfo",
							text: get_imagesizezoom_text( /*100*/),
							pos: "top-left",
							containers: containers
						});
						set_important_style(imagesize, "font-size", gallerycount_fontsize);
					}
					var get_imagestotal_text = function() {
						if (gallery_calcing) {
							return _("Loading...");
						}
						if (prev_images + next_images > settings.mouseover_ui_gallerymax) {
							return settings.mouseover_ui_gallerymax + "+";
						} else {
							return (prev_images + 1) + " / " + (prev_images + next_images + 1);
						}
					};
					var update_imagestotal = function() {
						if (images_total_input_active)
							return;
						if (prev_images + next_images > 0 || gallery_calcing) {
							set_important_style(images_total, "display", "inline-block");
							images_total.innerText = get_imagestotal_text();
						} else {
							set_important_style(images_total, "display", "none");
						}
					};
					var imagestotal_input_enable = function() {
						images_total_input_active = true;
						editing_text = true;
						images_total.innerText = "";
						set_important_style(images_total_input, "display", "initial");
						images_total_input.value = prev_images + 1;
						images_total.setAttribute("data-btn-noaction", true);
						images_total.appendChild(images_total_input);
						setTimeout(function() {
							images_total_input.select();
							images_total_input.setSelectionRange(0, images_total_input.value.length);
						}, 100);
					};
					var imagestotal_input_disable = function() {
						editing_text = false;
						if (!images_total_input_active)
							return;
						set_important_style(images_total_input, "display", "none");
						images_total.removeChild(images_total_input);
						images_total.removeAttribute("data-btn-noaction");
						images_total_input_active = false;
						update_imagestotal();
					};
					var popup_width = (popupshown && outerdiv.clientWidth) || imgw;
					if (settings.mouseover_enable_gallery && settings.mouseover_ui_gallerycounter) {
						var images_total = addbtn({
							id: "gallerycounter",
							text: get_imagestotal_text(),
							action: imagestotal_input_enable,
							pos: "top-left",
							containers: containers
						});
						set_important_style(images_total, "font-size", gallerycount_fontsize);
						set_important_style(images_total, "display", "none");
						var images_total_input = document_createElement("input");
						var images_total_input_active = false;
						set_el_all_initial(images_total_input);
						set_important_style(images_total_input, "display", "none");
						set_important_style(images_total_input, "background-color", "white");
						set_important_style(images_total_input, "font-family", sans_serif_font);
						set_important_style(images_total_input, "font-size", galleryinput_fontsize);
						set_important_style(images_total_input, "padding", "1px");
						set_important_style(images_total_input, "padding-left", "2px");
						set_important_style(images_total_input, "width", "5em");
						our_addEventListener(images_total_input, "mouseout", imagestotal_input_disable);
						our_addEventListener(images_total_input, "keydown", function(e) {
							if (e.which === 13) { // enter
								var parsednum = images_total_input.value.replace(/\s+/g, "");
								if (/^[0-9]+$/.test(parsednum)) {
									parsednum = parseInt(parsednum);
									trigger_gallery(parsednum - (prev_images + 1));
								}
								imagestotal_input_disable();
								e.stopPropagation();
								e.preventDefault();
								return false;
							}
						}, true);
					}
					if (settings.mouseover_ui_optionsbtn) {
						var optionsbtn = addbtn({
							id: "optionsbtn",
							text: "\u2699",
							title: _("Options"),
							action: get_options_page(),
							pos: "top-left",
							containers: containers
						});
					}
					if (settings.mouseover_ui_downloadbtn) {
						var download_glyphs = ["\uD83E\uDC47", "\ud83e\udc6b", "\u2193"];
						var download_glyph = get_safe_glyph(css_fontcheck, download_glyphs);
						var downloadbtn = addbtn({
							id: "downloadbtn",
							text: download_glyph,
							title: _("Download (" + get_trigger_key_text(settings.mouseover_download_key) + ")"),
							action: { type: "download" },
							pos: "top-left",
							containers: containers
						});
					}
					if (settings.mouseover_ui_rotationbtns) {
						var get_rotate_title = function(leftright) {
							var btn_name = leftright === "left" ? "Rotate Left" : "Rotate Right";
							return _(btn_name) + " (" + get_trigger_key_text(settings["mouseover_rotate_" + leftright + "_key"]) + ")";
						};
						var rotateleftbtn = addbtn({
							id: "rotleftbtn",
							text: "\u21B6",
							title: get_rotate_title("left"),
							action: { type: "rotate_left" },
							pos: "top-left",
							containers: containers
						});
						var rotaterightbtn = addbtn({
							id: "rotrightbtn",
							text: "\u21B7",
							title: get_rotate_title("right"),
							action: { type: "rotate_right" },
							pos: "top-left",
							containers: containers
						});
					}
					if (settings.mouseover_ui_caption) {
						var caption = get_caption(newobj, popup_el);
						var caption_link_page = settings.mouseover_ui_caption_link_page && newobj.extra && newobj.extra.page;
						if (!caption && caption_link_page) {
							caption = "(original page)";
						}
						if (caption) {
							var btntext = caption;
							if (settings.mouseover_ui_wrap_caption) {
								var chars = parseInt(Math_max(10, Math_min(60, (popup_width - containers["top-left"].clientWidth) / 10)));
								btntext = {
									truncated: truncate_with_ellipsis(caption, chars),
									full: caption,
									link_underline: caption_link_page
								};
							}
							var caption_link = null;
							if (caption_link_page) {
								caption_link = newobj.extra.page;
							}
							var caption_btn = addbtn({
								id: "caption",
								text: btntext,
								title: caption,
								action: caption_link,
								pos: "top-left",
								containers: containers
							});
						}
					}
					var add_lrhover = function(isleft, btnel, action, title) {
						if (!settings.mouseover_enable_gallery || popup_width < 200)
							return;
						var img_height = get_img_disp_height();
						var bottom_heights = 0;
						var top_heights = 20;
						if (is_stream) {
							bottom_heights = 60;
						}
						if (img_height < 100) {
							top_heights = 0;
						}
						var lrheight = img_height - top_heights - bottom_heights;
						if (lrheight < 10)
							return;
						var lrhover = document_createElement("div");
						set_el_all_initial(lrhover);
						lrhover.title = title;
						if (isleft) {
							lrhover.style.left = "0em";
						} else {
							lrhover.style.right = "0em";
						}
						lrhover.style.top = top_heights + "px";
						lrhover.style.height = lrheight + "px";
						lrhover.style.position = "absolute";
						lrhover.style.width = "15%";
						lrhover.style.maxWidth = "200px";
						lrhover.style.zIndex = maxzindex - 2;
						lrhover.style.cursor = "pointer";
						opacity_hover(lrhover, btnel, true);
						our_addEventListener(lrhover, "click", function(e) {
							if (dragged) {
								return false;
							}
							estop(e);
							action(e);
							return false;
						}, true);
						outerdiv.appendChild(lrhover);
						ui_els.push(lrhover);
						return lrhover;
					};
					var add_leftright_gallery_button = function(leftright) {
						if (!settings.mouseover_enable_gallery || !settings.mouseover_ui_gallerybtns)
							return;
						var action = function() {
							return lraction(leftright);
						};
						var name = leftright ? "Next" : "Previous";
						var left_glyphs = ["\ud83e\udc50", "\u2190"];
						var right_glyphs = ["\ud83e\udc52", "\u2192"];
						var lr_glyphs = leftright ? right_glyphs : left_glyphs;
						var icon = get_safe_glyph(css_fontcheck, lr_glyphs);
						var keybinding = leftright ? settings.mouseover_gallery_next_key : settings.mouseover_gallery_prev_key;
						var keybinding_text = get_trigger_key_text(keybinding);
						var title = _(name) + " (" + _(keybinding_text) + ")";
						var id = "gallery";
						id += leftright ? "next" : "prev";
						id += "btn";
						var btn = addbtn({
							id: id,
							text: icon,
							title: title,
							action: action,
							containers: containers,
							pos: leftright ? "right" : "left"
						});
						/*btn.style.top = "calc(50% - 7px - " + emhalf + ")";
						if (!leftright) {
							btn.style.left = "-" + em1;
						} else {
							btn.style.left = "initial";
							btn.style.right = "-" + em1;
						}*/
						add_lrhover(!leftright, btn, action, title);
						if (settings.mouseover_enable_gallery && settings.mouseover_ui_gallerycounter) {
							if (use_cached_gallery) {
								if (!leftright) {
									prev_images = cached_previmages;
								} else {
									next_images = cached_nextimages;
								}
								update_imagestotal();
							} else {
								gallery_calcing = true;
								count_gallery(leftright, void 0, true, void 0, void 0, function(total) {
									gallery_calcing = false;
									if (!leftright) {
										prev_images = total;
										cached_previmages = prev_images;
									} else {
										next_images = total;
										cached_nextimages = next_images;
									}
									update_imagestotal();
								});
								setTimeout(update_imagestotal, 1);
							}
						}
					};
					var add_leftright_gallery_button_if_valid = function(leftright) {
						if (!settings.mouseover_enable_gallery)
							return;
						is_nextprev_valid(leftright, function(valid) {
							if (valid) {
								add_leftright_gallery_button(leftright);
							}
						});
					};
					add_leftright_gallery_button_if_valid(false);
					add_leftright_gallery_button_if_valid(true);
				}
				popup_createui_func = create_ui;
				fill_obj_filename(newobj, url, data.data.respdata);
				create_ui();
				var a = document_createElement("a");
				set_el_all_initial(a);
				if (add_link) {
					a.style.cursor = "pointer";
					a.onclick = function(e) {
						e.stopPropagation();
						e.stopImmediatePropagation();
						return true;
					};
				}
				a.style.setProperty("vertical-align", "bottom", "important");
				a.style.setProperty("display", "block", "important");
				var update_popup_clickthrough = function(clickthrough) {
					var value = "none";
					if (!clickthrough)
						value = "initial";
					set_important_style(a, "pointer-events", value);
					set_important_style(img, "pointer-events", value);
					set_important_style(div, "pointer-events", value);
					set_important_style(outerdiv, "pointer-events", value);
				};
				if (settings.mouseover_clickthrough)
					update_popup_clickthrough(true);
				popup_hold_func = function() {
					var enable_mask_styles = get_single_setting("mouseover_enable_mask_styles2");
					if (popup_hold) {
						if (settings.mouseover_hold_unclickthrough) {
							update_popup_clickthrough(false);
						}
						if (mask_el && (enable_mask_styles === "always" || enable_mask_styles === "hold")) {
							mask_el.style.opacity = old_mask_opacity;
						}
					} else {
						if (settings.mouseover_clickthrough) {
							update_popup_clickthrough(true);
						} else {
							update_popup_clickthrough(false);
						}
						if (mask_el && (enable_mask_styles === "hold" || enable_mask_styles === "never")) {
							mask_el.style.opacity = 0;
						}
					}
				};
				if (add_link) {
					a.href = url;
					a.target = "_blank";
					if (settings.mouseover_download) {
						if (false) {
							a.href = img.src;
							if (newobj.filename.length > 0) {
								a.setAttribute("download", newobj.filename);
							} else {
								var attr = document.createAttribute("download");
								a.setAttributeNode(attr);
							}
						} else {
							a.href = "#"; // fixme: is this really required? this prevents it from right click->copy link location, etc.
							our_addEventListener(a, "click", function(e) {
								download_popup_media();
								e.preventDefault();
								e.stopPropagation();
								return false;
							}, true);
						}
					}
				} else {
					var click_close = false;
					if (!is_stream && settings.mouseover_click_image_close) {
						click_close = true;
					} else if (is_video && settings.mouseover_click_video_close) {
						click_close = true;
					}
					if (click_close) {
						our_addEventListener(a, "click", function(e) {
							if (dragged)
								return;
							resetpopups();
							e.preventDefault();
							e.stopPropagation();
							return false;
						});
					}
				}
				a.appendChild(img);
				div.appendChild(a);
				popup_hidecursor_timer = null;
				var orig_a_cursor = a.style.cursor;
				var orig_img_cursor = img.style.cursor;
				popup_hidecursor_func = function(hide) {
					popup_cursorjitterX = mouseX;
					popup_cursorjitterY = mouseY;
					if (settings.mouseover_hide_cursor && hide) {
						a.style.cursor = "none";
						img.style.cursor = "none";
					} else {
						if (popup_hidecursor_timer) {
							clearTimeout(popup_hidecursor_timer);
							popup_hidecursor_timer = null;
						}
						a.style.cursor = orig_a_cursor;
						img.style.cursor = orig_img_cursor;
					}
				};
				popup_cursorjitterX = Infinity;
				popup_cursorjitterY = Infinity;
				if (settings.mouseover_hide_cursor && settings.mouseover_hide_cursor_after <= 0) {
					popup_hidecursor_func(true);
				}
				div.onmouseover = div.onmousemove = function(e) {
					if ((Math_abs(mouseX - popup_cursorjitterX) < settings.mouseover_mouse_inactivity_jitter) &&
						(Math_abs(mouseY - popup_cursorjitterY) < settings.mouseover_mouse_inactivity_jitter)) {
						return;
					}
					if (settings.mouseover_hide_cursor_after > 0 || !settings.mouseover_hide_cursor) {
						popup_hidecursor_func(false);
						if (settings.mouseover_hide_cursor) {
							popup_hidecursor_timer = setTimeout(function() {
								popup_hidecursor_func(true);
							}, settings.mouseover_hide_cursor_after);
						}
					}
				};
				function startdrag(e) {
					dragstart = true;
					dragged = false;
					dragstartX = e.clientX;
					dragstartY = e.clientY;
					dragoffsetX = dragstartX - parseFloat(outerdiv.style.left);
					dragoffsetY = dragstartY - parseFloat(outerdiv.style.top);
				}
				if (get_single_setting("mouseover_pan_behavior") === "drag") {
					if (is_stream) {
						img.onseeking = function(e) {
							seekstart = true;
						};
						img.onseeked = function(e) {
							seekstart = false;
						};
					}
					div.ondragstart = a.ondragstart = img.ondragstart = function(e) {
						if (seekstart)
							return;
						startdrag(e);
						estop(e);
						return false;
					};
					div.onmousedown = div.onpointerdown = a.onmousedown = a.onpointerdown = function(e) {
						if (btndown || e.button !== 0 || seekstart)
							return;
						startdrag(e);
						e.preventDefault();
						estop(e);
						return false;
					};
					img.onmousedown = img.onpointerdown = function(e) {
						if (btndown || e.button !== 0 || seekstart)
							return;
						startdrag(e);
						estop(e);
						return true;
					};
					a.onclick = function(e) {
						dragstart = false;
						if (dragged) {
							estop(e);
							dragged = false;
							return false;
						}
						e.stopPropagation();
						e.stopImmediatePropagation();
						return true;
					};
					div.onmouseup = div.onpointerup = div.onclick = a.onmouseup = a.onpointerup = /*a.onclick =*/ function(e) {
						dragstart = false;
						if (dragged) {
							return false;
						}
						e.stopPropagation();
						e.stopImmediatePropagation();
						return true;
					};
					img.onmouseup = img.onpointerup = img.onclick = function(e) {
						dragstart = false;
						return true;
					};
					if (is_video) {
						img.onclick = function(e) {
							if (img.controls)
								return;
							if (!dragged) {
								if (!img.paused) {
									img.pause();
								} else {
									play_video(img);
								}
							}
							dragstart = false;
							return true;
						};
					}
				}
				var currentmode = initial_zoom_behavior;
				if (currentmode === "fill")
					currentmode = "fit";
				popup_zoom_func = function(zoom_mode, zoomdir, x, y, zoom_out_to_close) {
					var changed = false;
					var popup_left = parseFloat(outerdiv.style.left);
					var popup_top = parseFloat(outerdiv.style.top);
					var popup_width = outerdiv.clientWidth;
					var popup_height = outerdiv.clientHeight;
					update_vwh();
					if (x === void 0)
						x = "center";
					if (y === void 0)
						y = "center";
					var x_moveto = null;
					var y_moveto = null;
					if (zoomdir > 0) {
						var zoomout_mode = get_single_setting("scroll_zoomout_pagemiddle");
						if (zoomout_mode === "always") {
							x = "pagemiddle";
							y = "pagemiddle";
						} else if (zoomout_mode === "viewport") {
							if (popup_width < vw)
								x = "pagemiddle";
							if (popup_height < vh)
								y = "pagemiddle";
						}
					}
					if (x === "center" || x === "pagemiddle") {
						if (x === "pagemiddle")
							x_moveto = vw / 2;
						var visible_left = Math_max(popup_left, 0);
						var visible_right = Math_min(visible_left + popup_width, vw);
						x = visible_left + (visible_right - visible_left) / 2;
					} else {
						if (x < popup_left)
							x = popup_left;
						else if (x > popup_left + popup_width)
							x = popup_left + popup_width;
					}
					if (y === "center" || y === "pagemiddle") {
						if (y === "pagemiddle")
							y_moveto = vh / 2;
						var visible_top = Math_max(popup_top, 0);
						var visible_bottom = Math_min(visible_top + popup_height, vh);
						y = visible_top + (visible_bottom - visible_top) / 2;
					} else {
						if (y < popup_top)
							y = popup_top;
						else if (y > popup_top + popup_height)
							y = popup_top + popup_height;
					}
					var offsetX = x - popup_left;
					var offsetY = y - popup_top;
					var percentX = offsetX / popup_width;
					var percentY = offsetY / popup_height;
					if (zoom_mode === "fitfull") {
						if (zoom_out_to_close && currentmode === "fit" && zoomdir > 0) {
							resetpopups();
							return false;
						}
						if (zoomdir > 0 && currentmode !== "fit") {
							imgh = img_naturalHeight;
							imgw = img_naturalWidth;
							calc_imghw_for_fit();
							var oldwidth = parseFloat(img.style.width);
							var oldheight = parseFloat(img.style.height);
							set_popup_width(imgw, vw);
							set_popup_height(imgh, vh);
							if (zoom_out_to_close && parseFloat(img.style.width) === oldwidth && parseFloat(img.style.height) === oldheight) {
								resetpopups();
								return false;
							}
							currentmode = "fit";
							changed = true;
						} else if (zoomdir < 0 && currentmode !== "full") {
							set_popup_width(img_naturalWidth, "initial");
							set_popup_height(img_naturalHeight, "initial");
							imgw = img_naturalWidth;
							imgh = img_naturalHeight;
							currentmode = "full";
							changed = true;
						}
					} else if (zoom_mode === "incremental") {
						var imgwidth = img.clientWidth;
						var imgheight = img.clientHeight;
						var mult = 1;
						if (imgwidth < img_naturalWidth) {
							mult = img_naturalWidth / imgwidth;
						} else {
							mult = imgwidth / img_naturalWidth;
						}
						var increment = settings.scroll_incremental_mult - 1;
						mult = Math_round(mult / increment);
						mult *= increment;
						if (imgwidth < img_naturalWidth) {
							if (mult !== 0)
								mult = 1 / mult;
						}
						if (zoomdir > 0) {
							mult /= 1 + increment;
						} else {
							mult *= 1 + increment;
						}
						imgwidth = img_naturalWidth * mult;
						imgheight = img_naturalHeight * mult;
						var too_small = zoomdir > 0 && (imgwidth < 64 || imgheight < 64);
						var too_big = zoomdir < 0 && (imgwidth > img_naturalWidth * 512 || imgheight > img_naturalHeight * 512);
						if (too_small || too_big) {
							if (zoom_out_to_close && too_small)
								resetpopups();
							return false;
						}
						imgw = imgwidth;
						imgh = imgheight;
						set_popup_width(imgwidth);
						set_popup_height(imgheight);
						changed = true;
					}
					if (!changed)
						return false;
					var imgwidth = outerdiv.clientWidth;
					var imgheight = outerdiv.clientHeight;
					var current_zoom = ((imgwidth / img_naturalWidth) + (imgheight / img_naturalHeight)) / 2;
					if (current_zoom) {
						popup_last_zoom = current_zoom;
					}
					var newx, newy;
					var zoom_lerp = function(wantedpos, origpos, viewport) {
						var change = wantedpos - origpos;
						var maxchange = Math_max(100, viewport / 10); // arbitrary numbers
						if (change < 0) {
							change = -Math_min(maxchange, -change);
						} else {
							change = Math_min(maxchange, change);
						}
						return origpos + change;
					};
					if (true || (imgwidth <= vw && imgheight <= vh) || zoom_mode === "incremental") {
						newx = (x - percentX * imgwidth);
						if (x_moveto !== null) {
							newx = zoom_lerp(x_moveto - imgwidth / 2, newx, vw);
						}
						newy = (y - percentY * imgheight);
						if (y_moveto !== null) {
							newy = zoom_lerp(y_moveto - imgheight / 2, newy, vh);
						}
					} else if (imgwidth > vw || imgheight > vh) {
						newx = (vw / 2) - percentX * imgwidth;
						var endx = newx + imgwidth;
						if (newx > border_thresh && endx > (vw - border_thresh))
							newx = Math_max(border_thresh, (vw + border_thresh) - imgwidth);
						if (newx < border_thresh && endx < (vw - border_thresh))
							newx = Math_min(border_thresh, (vw + border_thresh) - imgwidth);
						newy = (vh / 2) - percentY * imgheight;
						var endy = newy + imgheight;
						if (newy > border_thresh && endy > (vh - border_thresh))
							newy = Math_max(border_thresh, (vh + border_thresh) - imgheight);
						if (newy < border_thresh && endy < (vh - border_thresh))
							newy = Math_min(border_thresh, (vh + border_thresh) - imgheight);
					}
					if (zoom_mode === "fitfull" && imgwidth <= vw && imgheight <= vh) {
						newx = Math_max(newx, border_thresh);
						if (newx + imgwidth > (vw - border_thresh)) {
							newx = (vw + border_thresh) - imgwidth;
						}
						newy = Math_max(newy, border_thresh);
						if (newy + imgheight > (vh - border_thresh)) {
							newy = (vh + border_thresh) - imgheight;
						}
					}
					outerdiv.style.left = (newx /* - lefttop[0]*/) + "px";
					outerdiv.style.top = (newy /* - lefttop[1]*/) + "px";
					create_ui(true);
					mouse_in_image_yet = false;
					return false;
				};
				outerdiv.onwheel = popup_wheel_cb = function(e, is_document) {
					var handledx = false;
					var handledy = false;
					var handle_seek = function(xy) {
						var isright = false;
						if (xy) {
							if (e.deltaX < 0)
								isright = false;
							else if (e.deltaX > 0)
								isright = true;
							else
								return;
						} else {
							if (e.deltaY < 0)
								isright = false;
							else if (e.deltaY > 0)
								isright = true;
							else
								return;
							if (settings.mouseover_scrolly_video_invert)
								isright = !isright;
						}
						seek_popup_video(!isright);
						estop_pd(e);
						return true;
					};
					var actionx = true;
					var actiony = true;
					if (is_stream) {
						var video_scrollx = get_single_setting("mouseover_scrollx_video_behavior");
						var video_scrolly = get_single_setting("mouseover_scrolly_video_behavior");
						if (!handledx && video_scrollx !== "default") {
							if (video_scrollx === "seek") {
								if (handle_seek(true)) {
									handledx = true;
								}
							} else if (video_scrollx === "nothing") {
								actionx = false;
							}
						}
						if (!handledy && video_scrolly !== "default") {
							if (video_scrolly === "seek") {
								if (handle_seek(false)) {
									handledy = true;
								}
							} else if (video_scrollx === "nothing") {
								actiony = false;
							}
						}
					}
					var scrollx_behavior = get_single_setting("mouseover_scrollx_behavior");
					var scrolly_behavior = get_single_setting("mouseover_scrolly_behavior");
					if (popup_hold) {
						var hold_scrollx_behavior = get_single_setting("mouseover_scrollx_hold_behavior");
						var hold_scrolly_behavior = get_single_setting("mouseover_scrolly_hold_behavior");
						if (hold_scrollx_behavior !== "default")
							scrollx_behavior = hold_scrollx_behavior;
						if (hold_scrolly_behavior !== "default")
							scrolly_behavior = hold_scrolly_behavior;
					}
					var handle_gallery = function(xy) {
						if (!settings.mouseover_enable_gallery)
							return;
						var isright = false;
						if (xy) {
							if (e.deltaX < 0)
								isright = false;
							else if (e.deltaX > 0)
								isright = true;
							else
								return;
						} else {
							if (e.deltaY < 0)
								isright = false;
							else if (e.deltaY > 0)
								isright = true;
							else
								return;
						}
						lraction(isright, true);
						estop_pd(e);
						return true;
					};
					if (actionx && !handledx) {
						if (scrollx_behavior === "pan") {
							outerdiv.style.left = (parseInt(outerdiv.style.left) + e.deltaX) + "px";
							handledx = true;
						} else if (scrollx_behavior === "gallery") {
							if (handle_gallery(true)) {
								return;
							}
							handledx = true;
						}
					}
					if (actiony && !handledy) {
						if (scrolly_behavior === "pan") {
							outerdiv.style.top = (parseInt(outerdiv.style.top) + e.deltaY) + "px";
							handledy = true;
						} else if (scrolly_behavior === "gallery") {
							if (handle_gallery(false)) {
								return;
							}
							handledy = true;
						}
					}
					if (handledy) {
						estop_pd(e);
						return false;
					}
					if (!actiony || scrolly_behavior !== "zoom" || e.deltaY === 0) {
						return;
					}
					estop_pd(e);
					var cursor_x = e.clientX;
					var cursor_y = e.clientY;
					if (get_single_setting("scroll_zoom_origin") === "center") {
						cursor_x = "center";
						cursor_y = "center";
					}
					var zoom_mode = get_single_setting("scroll_zoom_behavior");
					if (popup_zoom_func(zoom_mode, e.deltaY, cursor_x, cursor_y, settings.zoom_out_to_close) === false)
						return false;
				};
				if (mask_el) {
					document.documentElement.appendChild(mask_el);
				}
				document.documentElement.appendChild(outerdiv);
				removepopups();
				check_image_ref(img);
				if (is_stream) {
					if (settings.mouseover_video_autoplay) {
						play_video(img);
					} else {
						img.pause();
					}
				}
				popups.push(outerdiv);
				popupshown = true;
				if (data.data.respdata && data.data.respdata.responseHeaders) {
					var parsed_headers = headers_list_to_dict(parse_headers(data.data.respdata.responseHeaders));
					if ("content-length" in parsed_headers) {
						popup_contentlength = parseInt(parsed_headers["content-length"]) || 0;
					}
				}
				can_close_popup[1] = false;
				if (!popup_el_automatic)
					popup_hold = false;
				mouse_in_image_yet = false;
				delay_handle_triggering = false;
				if (false && popup_trigger_reason !== "mouse") {
					can_close_popup[1] = true;
				}
				setTimeout(function() {
					dont_wait_anymore();
				}, 1);
				popups_active = true;
				add_resetpopup_timeout();
			}
			cb(data.data.img, data.data.newurl /*, obj*/);
		}
		var getunit_el = null;
		var getunit_cache = new IMUCache();
		function getUnit(unit) {
			if (unit.match(/^ *([0-9]+)px *$/)) {
				return unit.replace(/^ *([0-9]+)px *$/, "$1");
			}
			if (getunit_cache.has(unit)) {
				return getunit_cache.get(unit);
			}
			var important = "!important;";
			var style = "position:absolute!important;visibility:hidden!important;width:" + unit + "!important;font-size:" + unit + "!important;padding:0!important";
			var extraBody;
			var unitel = document.body;
			if (!unitel) {
				unitel = extraBody = document_createElement("body");
				extraBody.style.cssText = "font-size:" + unit + "!important;";
				document.documentElement.insertBefore(extraBody, document.body);
			}
			if (!getunit_el) {
				getunit_el = document_createElement("i");
				set_el_all_initial(getunit_el);
				set_important_style(getunit_el, "position", "absolute");
				set_important_style(getunit_el, "visibility", "hidden");
				set_important_style(getunit_el, "padding", "0");
			}
			set_important_style(getunit_el, "width", unit);
			set_important_style(getunit_el, "font-size", unit);
			unitel.appendChild(getunit_el);
			var value = getunit_el.clientWidth;
			getunit_cache.set(unit, value, 5 * 60);
			if (extraBody) {
				document.documentElement.removeChild(extraBody);
			} else {
				unitel.removeChild(getunit_el);
			}
			return value;
		}
		function valid_source(source) {
			var thresh = 20;
			if (source.tagName !== "PICTURE" &&
				source.tagName !== "VIDEO" &&
				source.tagName !== "IMG" &&
				source.tagName !== "SOURCE") {
				var style = get_computed_style(source);
				if (style.getPropertyValue("background-image")) {
					var bgimg = style.getPropertyValue("background-image");
					if (!bgimg.match(/^(.*?\)\s*,)?\s*url[(]/)) {
						return false;
					}
				} else {
					return false;
				}
			}
			return !(source.width && source.width < thresh ||
				source.height && source.height < thresh);
		}
		var recalculate_rect = function(rect) {
			rect.left = rect.x;
			rect.top = rect.y;
			rect.right = rect.left + rect.width;
			rect.bottom = rect.top + rect.height;
			return rect;
		};
		var copy_rect = function(rect) {
			return {
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height
			};
		};
		var parse_zoom = function(zoom) {
			if (typeof zoom === "number")
				return zoom;
			var match = zoom.match(/^([-0-9.]+)%$/);
			if (match)
				return parseFloat(match[1]) / 100.;
			match = zoom.match(/^([-0-9.]+)$/);
			if (match) {
				return parseFloat(match[1]);
			}
			return null;
		};
		function get_bounding_client_rect_inner(el, mapcache, need_rect) {
			if (!el)
				return null;
			if (mapcache && mapcache.has(el)) {
				var value = mapcache.get(el);
				if (need_rect) {
					if (value.orig_rect)
						return value;
				} else {
					return value;
				}
			}
			var parent = {};
			var parentel = el.parentElement;
			if (parentel) {
				parent = get_bounding_client_rect_inner(parentel, mapcache, false);
			}
			var orig_rect = null;
			if (need_rect)
				orig_rect = el.getBoundingClientRect();
			var rect = null;
			var zoom = 1;
			if ("style" in el && el.style.zoom) {
				zoom = parse_zoom(el.style.zoom);
				if (zoom && zoom !== 1) {
					if (!orig_rect)
						orig_rect = el.getBoundingClientRect();
					rect = copy_rect(orig_rect);
					rect.width *= zoom;
					rect.height *= zoom;
				}
			}
			if (parent.zoom && parent.zoom !== 1) {
				if (!orig_rect)
					orig_rect = el.getBoundingClientRect();
				if (!rect)
					rect = copy_rect(orig_rect);
				rect.x *= parent.zoom;
				rect.y *= parent.zoom;
				rect.width *= parent.zoom;
				rect.height *= parent.zoom;
				zoom *= parent.zoom;
			}
			if (false && parent.rect && parent.orig_rect) {
				if (!orig_rect)
					orig_rect = el.getBoundingClientRect();
				if (!rect)
					rect = copy_rect(orig_rect);
				rect.x += parent.rect.x - parent.orig_rect.x;
				rect.y += parent.rect.y - parent.orig_rect.y;
			}
			if (rect)
				recalculate_rect(rect);
			var result = {
				zoom: zoom
			};
			if (orig_rect)
				result.orig_rect = orig_rect;
			if (rect)
				result.rect = rect;
			if (mapcache) {
				mapcache.set(el, result);
			}
			return result;
		}
		function get_bounding_client_rect(el, mapcache) {
			var obj = get_bounding_client_rect_inner(el, mapcache, true);
			return obj.rect || obj.orig_rect;
		}
		function get_popup_client_rect() {
			if (!popups || !popups[0])
				return null;
			var current_date = Date.now();
			if (!popup_client_rect_cache || (current_date - last_popup_client_rect_cache) > 50) {
				popup_client_rect_cache = get_bounding_client_rect(popups[0]);
				last_popup_client_rect_cache = current_date;
			}
			return popup_client_rect_cache;
		}
		;
		function get_popup_media_client_rect() {
			if (!popups || !popups[0])
				return null;
			var img = get_popup_media_el();
			if (!img)
				return null;
			var current_date = Date.now();
			if (!popup_media_client_rect_cache || (current_date - last_popup_media_client_rect_cache) > 30) {
				popup_media_client_rect_cache = img.getBoundingClientRect();
				last_popup_media_client_rect_cache = current_date;
			}
			return popup_media_client_rect_cache;
		}
		;
		function is_popup_el(el) {
			var current = el;
			do {
				if (array_indexof(popups, current) >= 0) {
					return true;
				}
			} while ((current = current.parentElement));
			return false;
		}
		function find_source(els, options) {
			if (!options)
				options = {};
			if (!("links" in options))
				options.links = get_single_setting("mouseover_links");
			var ok_els = [];
			var result = _find_source(els, ok_els, options);
			nir_debug("find_source", "find_source: result =", result, "ok_els =", ok_els);
			if (!result)
				return result;
			var ret_bad = function() {
				if (ok_els.length > 0)
					return ok_els[0];
				return null;
			};
			if (result.el) {
				if (is_popup_el(result.el)) {
					nir_debug("find_source", "find_source: result.el is popup el", result.el);
					return ret_bad();
				}
			}
			if (!result.is_ok_el && !result.src && (true || !is_valid_src(result.src, is_video_el(result.el)))) {
				nir_debug("find_source", "find_source: invalid src", result);
				return ret_bad();
			}
			var thresh = parse_int(get_tprofile_setting("mouseover_minimum_size"));
			if (isNaN(thresh) || result.imu)
				thresh = 0;
			var maxThresh = parse_int(get_tprofile_setting("popup_maximum_source_size"));
			if (isNaN(maxThresh))
				maxThresh = 0;
			if (!isNaN(result.width) && !isNaN(result.height) && result.width > 0 && result.height > 0) {
				if (result.width < thresh || result.height < thresh) {
					nir_debug("find_source", "find_source: result size is too small");
					return ret_bad();
				}
				if (maxThresh) {
					if (result.width > maxThresh || result.height > maxThresh) {
						console_log("Source media is too big to popup (user-configured maximum is", maxThresh, "px)");
						return null;
					}
				}
			}
			return result;
		}
		function _find_source(els, ok_els, options) {
			/*if (popups_active)
				return;*/
			nir_debug("find_source", "_find_source (els)", els);
			var sources = {};
			var links = {};
			var layers = [];
			var ok_els_set = new_set();
			var id = 0;
			var thresh = parse_int(get_tprofile_setting("mouseover_minimum_size"));
			if (isNaN(thresh))
				thresh = 0;
			var helpers = do_get_helpers({});
			var source;
			function check_visible(el) {
				var visible_valid = true;
				do {
					if (!el)
						break;
					var style = get_computed_style(el);
					if (!style)
						break;
					if (style.opacity.toString().match(/^0(?:\.0*)?$/) ||
						(visible_valid && style.visibility === "hidden")) {
						return false;
					}
					if (visible_valid && style.visibility === "visible") {
						visible_valid = false;
					}
				} while (el = el.parentElement);
				return true;
			}
			function getsource() {
				var thesource = null;
				var first = false;
				for (var source in sources) {
					if (first)
						return;
					first = true;
					thesource = sources[source];
				}
				return thesource;
			}
			function getfirstsource(sources) {
				var smallestid = MAX_SAFE_INTEGER;
				var thesource = null;
				for (var source_url in sources) {
					var source = sources[source_url];
					if (source.id < smallestid) {
						smallestid = source.id;
						thesource = sources[source_url];
					}
				}
				return thesource;
			}
			function norm(src) {
				return urljoin(window.location.href, src, true);
			}
			function imu_check(src, el) {
				var result = bigimage_recursive(src, {
					fill_object: true,
					use_cache: "read",
					do_request: null,
					document: document,
					window: get_window(),
					host_url: window.location.href,
					element: el,
					include_pastobjs: true,
					iterations: 2,
					cb: null
				});
				var newurl = src;
				for (var i = 0; i < result.length; i++) {
					if (result[i].url !== src) {
						if (newurl === src)
							newurl = result[i].url;
						continue;
					}
					if (result[i].bad)
						return false;
					if (result.length > 1) {
						return newurl || true;
					} else {
						return void 0;
					}
				}
				return newurl || true;
			}
			function addImage(src, el, options) {
				nir_debug("find_source", "_find_source (addImage)", src, el, check_visible(el), options);
				if (!is_valid_resource_url(src))
					return false;
				if (src && settings.mouseover_apply_blacklist && !bigimage_filter(src)) {
					nir_debug("find_source", "blacklisted");
					return false;
				}
				if (!(src in sources)) {
					sources[src] = {
						count: 0,
						src: src,
						el: el,
						id: id++,
					};
				}
				var el_style = null;
				if (el) {
					el_style = window.getComputedStyle(el) || el.style;
				}
				if (!options) {
					options = {};
				}
				if (options.isbg && get_tprofile_setting("mouseover_exclude_backgroundimages")) {
					return false;
				}
				var imucheck = imu_check(src, el);
				if (imucheck === false) {
					nir_debug("find_source", "Bad image", el);
					return false;
				}
				if (!("imu" in sources[src])) {
					sources[src].imu = !!imucheck;
				}
				if (imucheck === true) {
					if (src && (src.match(/^data:/) && !(/^data:image\/svg\+xml;/.test(src)) && src.length <= 500)) {
						nir_debug("find_source", "Tiny data: image", el, src);
						return false;
					}
				}
				if (!check_visible(el)) {
					nir_debug("find_source", "Invisible: image", el);
					return false;
				}
				if (settings.mouseover_only_links) {
					if (!el)
						return false;
					var has_link = false;
					var current = el;
					do {
						if (get_tagname(current) === "A") {
							has_link = true;
							break;
						}
					} while (current = current.parentElement);
					if (!has_link)
						return false;
				}
				if ("layer" in options) {
					if (!(options.layer in layers)) {
						layers[options.layer] = [];
					}
					layers[options.layer].push(src);
				}
				sources[src].count++;
				return true;
			}
			function addTagElement(el, layer) {
				if (helpers && helpers.element_ok) {
					if (!set_has(ok_els_set, el)) {
						var element_ok_result = helpers.element_ok(el);
						var ok_el_obj = {
							count: 1,
							src: null,
							el: el,
							id: id++,
							is_ok_el: true
						};
						if (element_ok_result === true) {
							ok_els.push(ok_el_obj);
							set_add(ok_els_set, el);
						} else {
							if (is_element(element_ok_result)) {
								ok_el_obj.el = element_ok_result;
								ok_els.push(ok_el_obj);
								set_add(ok_els_set, el);
								el = element_ok_result;
							}
						}
					}
				}
				var el_tagname = get_tagname(el);
				if (el_tagname === "PICTURE" || el_tagname === "VIDEO") {
					for (var i = 0; i < el.children.length; i++) {
						addElement(el.children[i], layer);
					}
				}
				if (el_tagname === "SOURCE" || el_tagname === "IMG" || el_tagname === "IMAGE" || el_tagname === "VIDEO" ||
					(settings.mouseover_allow_canvas_el && el_tagname === "CANVAS") ||
					(settings.mouseover_allow_svg_el && el_tagname === "SVG")) {
					if (settings.mouseover_exclude_imagemaps && el_tagname === "IMG" && el.hasAttribute("usemap")) {
						var mapel = document.querySelector("map[name=\"" + el.getAttribute("usemap").replace(/^#/, "") + "\"]");
						if (mapel) {
							nir_debug("find_source", "_find_source skipping", el, "due to image map", mapel);
							return;
						}
					}
					var el_src = get_img_src(el);
					if (el_src) {
						var src = norm(el_src);
						addImage(src, el, { layer: layer });
						if (!el.srcset && src in sources) {
							var dimensions = get_el_dimensions(el);
							sources[src].width = dimensions[0];
							sources[src].height = dimensions[1];
						}
					}
					if (!el.srcset)
						return;
					var ssources = [];
					var srcset = el.srcset;
					while (srcset.length > 0) {
						var old_srcset = srcset;
						srcset = srcset.replace(/^\s+/, "");
						var match = srcset.match(/^(\S+(?:\s+[^,]+)?)(?:,[\s\S]*)?\s*$/);
						if (match) {
							ssources.push(match[1].replace(/\s*$/, ""));
							srcset = srcset.substr(match[1].length);
						}
						srcset = srcset.replace(/^\s*,/, "");
						if (srcset === old_srcset)
							break;
					}
					var sizes = [];
					if (el.sizes) {
						sizes = el.sizes.split(",");
					}
					for (var i = 0; i < ssources.length; i++) {
						var src = norm(ssources[i].replace(/^(\S+)(?:\s+[\s\S]+)?\s*$/, "$1"));
						var desc = ssources[i].slice(src.length).replace(/^\s*([\s\S]*?)\s*$/, "$1");
						if (!addImage(src, el, { layer: layer }))
							continue;
						sources[src].picture = el.parentElement;
						if (desc) {
							sources[src].desc = desc;
							while (desc.length > 0) {
								desc = desc.replace(/^\s+/, "");
								var whxmatch = desc.match(/^([0-9.]+)([whx])(?:\s+[0-9.]+[\s\S]*)?\s*$/);
								if (whxmatch) {
									var number = parseFloat(whxmatch[1]);
									if (number > 0) {
										if (whxmatch[2] === "w" && (!sources[src].width || sources[src].width > number))
											sources[src].width = number;
										else if (whxmatch[2] === "h" && (!sources[src].height || sources[src].height > number))
											sources[src].height = number;
										else if (whxmatch[2] === "x" && (!sources[src].desc_x || sources[src].desc_x > number))
											sources[src].desc_x = number;
									}
									desc = desc.substr(whxmatch[1].length + whxmatch[2].length);
								} else {
									break;
								}
							}
						}
						if (el.media) {
							sources[src].media = el.media;
							if (el.media.match(/min-width:\s*([0-9]+)/)) {
								var minWidth = getUnit(el.media.replace(/.*min-width:\s*([0-9.a-z]+).*/, "$1"));
								if (!sources[src].minWidth || sources[src].minWidth > minWidth)
									sources[src].minWidth = minWidth;
							}
							if (el.media.match(/max-width:\s*([0-9]+)/)) {
								var maxWidth = getUnit(el.media.replace(/.*max-width:\s*([0-9.a-z]+).*/, "$1"));
								if (!sources[src].maxWidth || sources[src].maxWidth > maxWidth)
									sources[src].maxWidth = maxWidth;
							}
							if (el.media.match(/min-height:\s*([0-9]+)/)) {
								var minHeight = getUnit(el.media.replace(/.*min-height:\s*([0-9.a-z]+).*/, "$1"));
								if (!sources[src].minHeight || sources[src].minHeight > minHeight)
									sources[src].minHeight = minHeight;
							}
							if (el.media.match(/max-height:\s*([0-9]+)/)) {
								var maxHeight = getUnit(el.media.replace(/.*max-height:\s*([0-9.a-z]+).*/, "$1"));
								if (!sources[src].maxHeight || sources[src].maxHeight > maxHeight)
									sources[src].maxHeight = maxHeight;
							}
						}
					}
				}
				if (el_tagname === "A" || (settings.mouseover_allow_iframe_el && el_tagname === "IFRAME")) {
					var src_1 = get_img_src(el);
					links[src_1] = {
						count: 1,
						src: src_1,
						el: el,
						id: id++
					};
				}
			}
			function _tokenize_css_value(str) {
				var tokensets = [];
				var tokens = [];
				var current_token = "";
				var quote = null;
				var escaping = false;
				for (var i = 0; i < str.length; i++) {
					var char = str[i];
					if (escaping) {
						current_token += char;
						escaping = false;
						continue;
					}
					if (quote) {
						if (char === quote) {
							quote = null;
							tokens.push(current_token);
							current_token = "";
						} else {
							current_token += char;
						}
						continue;
					}
					if (/\s/.test(char)) {
						if (current_token.length > 0) {
							tokens.push(current_token);
							current_token = "";
						}
						continue;
					} else if (char === '\\') {
						escaping = true;
						continue;
					} else if (char === '"' || char === "'") {
						quote = char;
						continue;
					} else if (char === '(') {
						var subtokens = _tokenize_css_value(str.substr(i + 1));
						tokens.push({ name: current_token, tokens: subtokens[0] });
						i += subtokens[1];
						current_token = "";
						continue;
					} else if (char === ')') {
						i++;
						break;
					} else if (char === ',') {
						if (current_token)
							tokens.push(current_token);
						tokensets.push(tokens);
						tokens = [];
						current_token = "";
						continue;
					}
					current_token += char;
				}
				if (current_token)
					tokens.push(current_token);
				if (tokens)
					tokensets.push(tokens);
				return [tokensets, i];
			}
			function has_bgimage_url(tokenized) {
				for (var i = 0; i < tokenized.length; i++) {
					if (tokenized[i].length < 1)
						continue;
					if (typeof tokenized[i][0] !== "object")
						continue;
					var our_func = tokenized[i][0];
					var funcname = our_func.name;
					var allowed = [
						"url",
						"-webkit-image-set",
						"image-set"
					];
					if (array_indexof(allowed, funcname) < 0)
						continue;
					if (funcname === "url") {
						if (our_func.tokens.length >= 1 && our_func.tokens[0].length > 0 && our_func.tokens[0][0].length > 0)
							return true;
					} else {
						if (has_bgimage_url(our_func.tokens))
							return true;
					}
				}
				return false;
			}
			function get_urlfunc_url(func) {
				if (typeof func !== "object")
					return null;
				;
				if (func.name !== "url")
					return null;
				if (func.tokens.length < 1 || func.tokens[0].length < 1 || func.tokens[0][0].length === 0)
					return null;
				return func.tokens[0][0];
			}
			function get_imageset_urls(func) {
				var urls = [];
				for (var i = 0; i < func.tokens.length; i++) {
					if (func.tokens[i].length < 1) {
						continue;
					}
					var url = get_urlfunc_url(func.tokens[i][0]);
					if (!url)
						continue;
					var source = {
						src: url
					};
					for (var j = 1; j < func.tokens[i].length; j++) {
						var desc = func.tokens[i][j];
						var whxmatch = desc.match(/^([0-9.]+)(x|dp(?:px|i|cm))$/);
						if (whxmatch) {
							var number = parseFloat(whxmatch[1]);
							if (number > 0) {
								var unit = whxmatch[2];
								if (unit === "dppx") {
									number *= 96;
									unit = "dpi";
								} else if (unit === "dpcm") {
									number *= 96 / 2.54;
									unit = "dpi";
								}
								if (unit === "x")
									source.desc_x = number;
								else if (unit === "dpi")
									source.dpi = number;
							}
						} else {
							console_warn("Unknown descriptor: " + desc);
						}
					}
					urls.push(source);
				}
				return urls;
			}
			function get_bgimage_urls(tokenized) {
				var urls = [];
				for (var i = 0; i < tokenized.length; i++) {
					if (tokenized[i].length < 1)
						continue;
					if (typeof tokenized[i][0] !== "object")
						continue;
					var our_func = tokenized[i][0];
					var funcname = our_func.name;
					var allowed = [
						"url",
						"-webkit-image-set",
						"image-set"
					];
					if (array_indexof(allowed, funcname) < 0)
						continue;
					if (funcname === "url") {
						var url = get_urlfunc_url(our_func);
						if (url) {
							urls.push(url);
						}
					} else if (funcname === "-webkit-image-set" || funcname === "image-set") {
						var newurls = get_imageset_urls(our_func);
						if (newurls) {
							array_extend(urls, newurls);
						}
					}
				}
				return urls;
			}
			function get_urls_from_css(str, elstr) {
				var str_tokenized = _tokenize_css_value(str)[0];
				if (!has_bgimage_url(str_tokenized))
					return null;
				var elstr_tokenized;
				if (elstr) {
					elstr_tokenized = _tokenize_css_value(elstr)[0];
					if (!has_bgimage_url(elstr_tokenized))
						return null;
				}
				return get_bgimage_urls(str_tokenized);
			}
			function add_urls_from_css(el, str, elstr, layer, bg) {
				var urls = get_urls_from_css(str, elstr);
				if (urls) {
					var url;
					for (var i = 0; i < urls.length; i++) {
						url = urls[i];
						if (typeof url !== "string") {
							url = url.src;
						}
						addImage(url, el, {
							isbg: bg,
							layer: layer
						});
						if (typeof urls[i] !== "string") {
							var props = ["desc_x", "dpi"];
							for (var j = 0; j < props.length; j++) {
								var prop = props[j];
								if (urls[i][prop] && (!sources[url][prop] || sources[url][prop] > urls[i][prop])) {
									sources[url][prop] = urls[i][prop];
								}
							}
						}
					}
				}
			}
			function add_bgimage(layer, el, style, beforeafter) {
				if (!style || !("style" in el))
					return;
				if (style.getPropertyValue("background-image")) {
					var bgimg = style.getPropertyValue("background-image");
					add_urls_from_css(el, bgimg, el.style.getPropertyValue("background-image"), layer, beforeafter || true);
				}
				if (beforeafter) {
					if (style.getPropertyValue("content")) {
						add_urls_from_css(el, style.getPropertyValue("content"), void 0, layer, beforeafter);
					}
				}
			}
			function addElement(el, layer) {
				nir_debug("find_source", "_find_source (addElement)", el, layer);
				if (get_tprofile_setting("mouseover_exclude_page_bg") && el.tagName === "BODY") {
					return;
				}
				if (typeof layer === "undefined")
					layer = layers.length;
				addTagElement(el, layer);
				add_bgimage(layer, el, window.getComputedStyle(el));
				add_bgimage(layer, el, window.getComputedStyle(el, ":before"), "before");
				add_bgimage(layer, el, window.getComputedStyle(el, ":after"), "after");
			}
			for (var i = 0; i < els.length; i++) {
				if (els[i].tagName === "IMG" && els[i].parentElement && els[i].parentElement.tagName === "PICTURE" && array_indexof(els, els[i].parentElement) < 0) {
					els.splice(i + 1, 0, els[i].parentElement);
				}
				if (els[i].tagName === "PICTURE" && i == 1) {
					els.splice(0, i);
					i = 0;
					break;
				}
			}
			for (var i = 0; i < els.length; i++) {
				var el = els[i];
				addElement(el);
			}
			if (_nir_debug_) {
				nir_debug("find_source", "_find_source (sources)", deepcopy(sources));
				nir_debug("find_source", "_find_source (layers)", deepcopy(layers));
				nir_debug("find_source", "_find_source (ok_els)", deepcopy(ok_els));
			}
			var activesources = [];
			for (var i = 0; i < layers.length; i++) {
				for (var j = 0; j < layers[i].length; j++) {
					if (array_indexof(activesources, layers[i][j]) < 0)
						activesources.push(layers[i][j]);
				}
			}
			var ok_els_sources = [];
			for (var source_1 in sources) {
				for (var i = 0; i < ok_els.length; i++) {
					if (sources[source_1].el === ok_els[i].el) {
						ok_els[i] = sources[source_1];
						ok_els_sources[i] = true;
					}
				}
				if (array_indexof(activesources, source_1) < 0)
					delete sources[source_1];
			}
			for (var i = 0; i < ok_els.length; i++) {
				if (!ok_els_sources[i] && !ok_els[i].src) {
					addElement(ok_els[i].el);
				}
			}
			if ((source = getsource()) !== void 0) {
				nir_debug("find_source", "_find_source (getsource())", source);
				if (source === null) {
					if (ok_els.length > 0) {
						return ok_els[0];
					} else if (options.links) {
						if (Object.keys(links).length > 0) {
							var our_key = null;
							for (var link in links) {
								if (!settings.mouseover_only_valid_links) {
									our_key = link;
									break;
								}
								if (looks_like_valid_link(link, links[link].el)) {
									our_key = link;
									break;
								}
							}
							if (our_key)
								return links[our_key];
						}
					}
				}
				return source;
			}
			for (var i = 0; i < layers.length; i++) {
				var minW = 0;
				var elW = null;
				var minH = 0;
				var elH = null;
				var minMinW = 0;
				var elMinW = null;
				var minMinH = 0;
				var elMinH = null;
				var minMaxW = 0;
				var elMaxW = null;
				var minMaxH = 0;
				var elMaxH = null;
				var minX = 0;
				var elX = null;
				var minDpi = 0;
				var elDpi = null;
				var okurls = {};
				var have_something = false;
				for (var j = 0; j < layers[i].length; j++) {
					var source_url = layers[i][j];
					var source = sources[source_url];
					if (source.width && source.width > minW) {
						minW = source.width;
						elW = source;
						have_something = true;
					}
					if (source.height && source.height > minH) {
						minH = source.height;
						elH = source;
						have_something = true;
					}
					if (source.minWidth && source.minWidth > minMinW) {
						minMinW = source.minWidth;
						elMinW = source;
						have_something = true;
					}
					if (source.minHeight && source.minHeight > minMinH) {
						minMinH = source.minHeight;
						elMinH = source;
						have_something = true;
					}
					if (source.maxWidth && source.maxWidth > minMaxW) {
						minMaxW = source.maxWidth;
						elMaxW = source;
					}
					if (source.maxHeight && source.maxHeight > minMaxH) {
						minMaxH = source.maxHeight;
						elMaxH = source;
					}
					if (source.desc_x && source.desc_x > minX) {
						minX = source.desc_x;
						elX = source;
						have_something = true;
					}
					if (source.dpi && source.dpi > minDpi) {
						elDpi = source;
						have_something = true;
					}
					if (source.isbg) {
						okurls[source.src] = true;
						have_something = true;
					}
				}
				if (!have_something)
					continue;
				if (minX > 1) {
					okurls[elX.src] = true;
				}
				if (minDpi > 96) {
					okurls[elDpi.src] = true;
				}
				if (minW > thresh && minW > minMinW) {
					okurls[elW.src] = true;
				}
				if (minH > thresh && minH > minMinH) {
					okurls[elH.src] = true;
				}
				if (minMinW > thresh && minMinW >= minW) {
					okurls[elMinW.src] = true;
				}
				if (minMinH > thresh && minMinH >= minH) {
					okurls[elMinH.src] = true;
				}
				layers[i] = [];
				for (var url in okurls) {
					layers[i].push(url);
				}
			}
			function pickbest(layer) {
				for (var i = 0; i < layer.length; i++) {
					var source_url = layer[i];
					var source = sources[source_url];
					if (source.desc_x)
						return source;
				}
				return sources[layer[0]];
			}
			function rebuildlayers() {
				var newlayers = [];
				for (var i = 0; i < layers.length; i++) {
					if (layers[i].length === 0)
						continue;
					newlayers.push(layers[i]);
				}
				layers = newlayers;
			}
			nir_debug("find_source", "_find_source (new layers)", deepcopy(layers));
			rebuildlayers();
			nir_debug("find_source", "_find_source (rebuilt layers)", deepcopy(layers));
			if (layers.length > 1 && layers[0].length === 1 && sources[layers[0][0]].isbg) {
				for (var i = 1; i < layers.length; i++) {
					if (layers[i].length === 1 && sources[layers[i][0]].isbg)
						continue;
					return pickbest(layers[i]);
				}
			}
			if (layers.length > 0) {
				return pickbest(layers[0]);
			}
			if (source = getsource())
				return source;
			else
				return getfirstsource(sources);
		}
		var get_next_in_gallery_generic = function(el, nextprev) {
			if (!el)
				return null;
			if (array_indexof(["SOURCE", "IMG"], el.tagName) >= 0 && el.parentElement && array_indexof(["PICTURE", "VIDEO"], el.parentElement.tagName) >= 0) {
				el = el.parentElement;
			}
			var stack = [el.tagName];
			var current_el = el;
			var firstchild = false;
			while (true) {
				if (!firstchild) {
					var next = current_el.nextElementSibling;
					if (!nextprev)
						next = current_el.previousElementSibling;
					if (!next) {
						current_el = current_el.parentElement;
						if (!current_el)
							break;
						stack.unshift(current_el.tagName);
						continue;
					}
					current_el = next;
				} else {
					firstchild = false;
				}
				if (current_el.tagName === stack[0]) {
					if (stack.length === 1) {
						if (is_valid_el(current_el))
							return current_el;
						continue;
					}
					if (nextprev) {
						for (var i = 0; i < current_el.children.length; i++) {
							if (current_el.children[i].tagName === stack[1]) {
								current_el = current_el.children[i];
								stack.shift();
								firstchild = true;
								break;
							}
						}
					} else {
						for (var i = current_el.children.length - 1; i >= 0; i--) {
							if (current_el.children[i].tagName === stack[1]) {
								current_el = current_el.children[i];
								stack.shift();
								firstchild = true;
								break;
							}
						}
					}
				}
			}
			return null;
		};
		get_next_in_gallery = function(el, nextprev) {
			var value = get_album_info_gallery(popup_obj, el, nextprev);
			if (value || value === false)
				return value;
			if (!el.parentElement) {
				if (el.hasAttribute("imu-album-info")) {
					el = popup_orig_el;
				}
			}
			previous_album_links = [];
			if (false && popup_obj && popup_obj.album_info && popup_obj.album_info.type === "links") {
				array_foreach(popup_obj.album_info.links, function(link) {
					previous_album_links.push(link.url);
				});
			}
			return get_next_in_gallery_generic(el, nextprev);
		};
		/*function normalize_trigger() {
			if (!is_array(settings.mouseover_trigger)) {
				settings.mouseover_trigger = [settings.mouseover_trigger];
			}
		}

		normalize_trigger();*/
		function update_mouseover_trigger_delay() {
			delay = settings.mouseover_trigger_delay;
			if (delay < 0 || isNaN(delay))
				delay = false;
			if (typeof delay === "number" && delay >= 10)
				delay = 10;
			if (get_single_setting("mouseover_trigger_behavior") === "mouse") {
				delay_mouseonly = true;
			} else {
				delay = false;
				delay_mouseonly = false;
			}
			if (delay_handle) {
				clearTimeout(delay_handle);
				delay_handle = null;
			}
		}
		update_mouseover_trigger_delay();
		settings_meta.mouseover_trigger_delay.onupdate = update_mouseover_trigger_delay;
		settings_meta.mouseover_trigger_behavior.onupdate = update_mouseover_trigger_delay;
		function can_add_to_chord(str) {
			if (!keystr_is_wheel(str))
				return true;
			return !chord_is_only_wheel(current_chord);
		}
		function clear_chord_wheel() {
			for (var i = 0; i < current_chord.length; i++) {
				if (keystr_is_wheel(current_chord[i])) {
					current_chord.splice(i, 1);
					i--;
				}
			}
		}
		function clear_chord() {
			current_chord = [];
			current_chord_timeout = {};
		}
		function clear_chord_if_only_wheel() {
			if (chord_is_only_wheel(current_chord))
				clear_chord();
		}
		function keystr_in_trigger(str, wanted_chord) {
			return array_indexof(wanted_chord, str) >= 0;
		}
		function key_would_modify_single_chord(str, value) {
			if (value) {
				if (!can_add_to_chord(str))
					return false;
				if (array_indexof(current_chord, str) < 0)
					return true;
			} else {
				if (array_indexof(current_chord, str) >= 0)
					return true;
			}
			return false;
		}
		function set_chord_sub(str, value) {
			if (value) {
				if (!can_add_to_chord(str))
					return false;
				current_chord_timeout[str] = Date.now();
				if (array_indexof(current_chord, str) < 0) {
					current_chord.push(str);
					return true;
				}
			} else {
				delete current_chord_timeout[str];
				if (array_indexof(current_chord, str) >= 0) {
					current_chord.splice(array_indexof(current_chord, str), 1);
					clear_chord_if_only_wheel();
					return true;
				}
			}
			return false;
		}
		function event_in_single_chord(e, wanted_chord) {
			var map = get_keystrs_map(e, true);
			for (var key in map) {
				if (!map[key])
					continue;
				if (keystr_in_trigger(key, wanted_chord))
					return true;
			}
			return false;
		}
		function event_in_chord(e, wanted_chord) {
			wanted_chord = normalize_keychord(wanted_chord);
			for (var i = 0; i < wanted_chord.length; i++) {
				if (event_in_single_chord(e, wanted_chord[i]))
					return true;
			}
			return false;
		}
		function remove_old_keys() {
			var now = Date.now();
			for (var key in current_chord_timeout) {
				if (now - current_chord_timeout[key] > 5000)
					set_chord_sub(key, false);
			}
		}
		function update_chord(e, value) {
			var map = get_keystrs_map(e, value);
			remove_old_keys();
			var changed = false;
			for (var key in map) {
				if (set_chord_sub(key, map[key]))
					changed = true;
			}
			return changed;
		}
		function event_would_modify_single_chord(e, value, wanted_chord) {
			var map = get_keystrs_map(e, value);
			for (var key in map) {
				if (wanted_chord !== void 0 && !keystr_in_trigger(key, wanted_chord))
					continue;
				if (key_would_modify_single_chord(key, map[key]))
					return true;
			}
			return false;
		}
		function event_would_modify_chord(e, value, wanted_chord) {
			wanted_chord = normalize_keychord(wanted_chord);
			for (var i = 0; i < wanted_chord.length; i++) {
				if (event_would_modify_single_chord(e, value, wanted_chord[i]))
					return true;
			}
			return false;
		}
		function trigger_complete_single(wanted_chord) {
			for (var i = 0; i < wanted_chord.length; i++) {
				var key = wanted_chord[i];
				if (array_indexof(current_chord, key) < 0)
					return false;
			}
			for (var i = 0; i < current_chord.length; i++) {
				if (keystr_is_wheel(current_chord[i]))
					continue;
				if (array_indexof(wanted_chord, current_chord[i]) < 0)
					return false;
			}
			return true;
		}
		function trigger_complete(wanted_chord) {
			wanted_chord = normalize_keychord(wanted_chord);
			for (var i = 0; i < wanted_chord.length; i++) {
				if (trigger_complete_single(wanted_chord[i]))
					return true;
			}
			return false;
		}
		function trigger_partially_complete_single(e, wanted_chord) {
			for (var i = 0; i < wanted_chord.length; i++) {
				var key = wanted_chord[i];
				if (array_indexof(current_chord, key) >= 0)
					return true;
			}
			return false;
		}
		function trigger_partially_complete(e, wanted_chord) {
			wanted_chord = normalize_keychord(wanted_chord);
			for (var i = 0; i < wanted_chord.length; i++) {
				if (trigger_partially_complete_single(e, wanted_chord[i]))
					return true;
			}
			return false;
		}
		function get_close_behavior() {
			return get_single_setting("mouseover_close_behavior");
		}
		function get_close_need_mouseout() {
			return settings.mouseover_close_need_mouseout && get_close_behavior() !== "esc";
		}
		/*function get_close_on_leave_el() {
			return settings.mouseover_close_on_leave_el && get_single_setting("mouseover_position") === "beside_cursor";
		}*/
		function should_exclude_imagetab() {
			return settings.mouseover_exclude_imagetab && get_single_setting("mouseover_trigger_behavior") === "mouse" &&
				currenttab_is_image() && !imagetab_ok_override;
		}
		function find_els_at_point(xy, els, prev, zoom_cache) {
			if (false && _nir_debug_)
				console_log("find_els_at_point", deepcopy(xy), deepcopy(els), deepcopy(prev));
			var first_run = false;
			if (!prev) {
				prev = new_set();
				first_run = true;
			}
			if (zoom_cache === void 0) {
				try {
					zoom_cache = new Map();
				} catch (e) {
					zoom_cache = null;
				}
			}
			var ret = [];
			var afterret = [];
			var els_mode = get_single_setting("mouseover_find_els_mode");
			if (!els) {
				els = document.elementsFromPoint(xy[0], xy[1]);
				afterret = els;
				if (_nir_debug_) {
					console_log("find_els_at_point (elsfrompoint)", deepcopy(els));
				}
				if (els_mode === "simple")
					return els;
			}
			for (var i = 0; i < els.length; i++) {
				if (i > 0 && first_run && els_mode === "hybrid") {
					ret.push(els[i]);
					continue;
				}
				var el = els[i];
				if (set_has(prev, el))
					continue;
				set_add(prev, el);
				var el_has_children = false;
				var el_children = null;
				var el_shadow_children = null;
				if (el.childElementCount > 0) {
					el_children = el.children;
					el_has_children = true;
				}
				if (el.shadowRoot && el.shadowRoot.childElementCount > 0) {
					el_shadow_children = el.shadowRoot.children;
					el_has_children = true;
				}
				if (el_has_children) {
					var newchildren = [];
					if (el_children) {
						for (var j = el_children.length - 1; j >= 0; j--) {
							newchildren.push(el_children[j]);
						}
					}
					if (el_shadow_children) {
						for (var j = el_shadow_children.length - 1; j >= 0; j--) {
							newchildren.push(el_shadow_children[j]);
						}
					}
					var newels = find_els_at_point(xy, newchildren, prev, zoom_cache);
					for (var j = 0; j < newels.length; j++) {
						var newel = newels[j];
						if (array_indexof(ret, newel) < 0) {
							ret.push(newel);
						}
					}
				}
				var rect = get_bounding_client_rect(el, zoom_cache);
				if (rect && rect.width > 0 && rect.height > 0 &&
					rect.left <= xy[0] && rect.right >= xy[0] &&
					rect.top <= xy[1] && rect.bottom >= xy[1] &&
					array_indexof(ret, el) < 0) {
					ret.push(el);
				}
			}
			for (var i = 0; i < afterret.length; i++) {
				if (array_indexof(ret, afterret[i]) < 0)
					ret.push(afterret[i]);
			}
			if (_nir_debug_ && ret.length > 0) {
				console_log("find_els_at_point (unsorted ret)", shallowcopy(ret));
			}
			if (first_run && els_mode === "hybrid") {
				return ret;
			}
			var get_zindex_raw = function(el) {
				var zindex = get_computed_style(el).zIndex;
				var parent_zindex = 0;
				if (el.parentElement) {
					var parent_zindex = get_zindex(el.parentElement); // + 0.001; // hack: child elements appear above parent elements
				}
				if (zindex === "auto") {
					return parent_zindex;
				} else {
					zindex = parseFloat(zindex);
					if (zindex < parent_zindex)
						return parent_zindex + zindex; // hack:
					else
						return zindex;
				}
			};
			var get_zindex = function(el) {
				if (zoom_cache) {
					var cached = map_get(zoom_cache, el);
					if (!cached || !("zIndex" in cached)) {
						var zindex = get_zindex_raw(el);
						if (cached) {
							cached.zIndex = zindex;
						} else {
							map_set(zoom_cache, el, {
								zIndex: zindex
							});
						}
						return zindex;
					} else {
						return cached.zIndex;
					}
				} else {
					return get_zindex_raw(el);
				}
			};
			ret.sort(function(a, b) {
				var a_zindex, b_zindex;
				a_zindex = get_zindex(a);
				b_zindex = get_zindex(b);
				if (b_zindex === a_zindex) {
					return array_indexof(ret, a) - array_indexof(ret, b);
				} else {
					return b_zindex - a_zindex;
				}
			});
			if (_nir_debug_ && ret.length > 0)
				console_log("find_els_at_point (ret)", els, shallowcopy(ret), xy);
			return ret;
		}
		var get_physical_popup_el = function(el) {
			if (el.parentElement && el.tagName === "SOURCE")
				return el.parentElement;
			return el;
		};
		function trigger_popup(options) {
			if (!options) {
				options = {};
			}
			if (_nir_debug_)
				console_log("trigger_popup (options:", options, ")", current_frame_id);
			if (!settings.mouseover_allow_popup_when_fullscreen && is_fullscreen() && !is_popup_fullscreen())
				return;
			delay_handle_triggering = true;
			var point = null;
			if (mousepos_initialized)
				point = [mouseX, mouseY];
			if (options.is_contextmenu && mouseContextX !== null && mouseContextY !== null)
				point = [mouseContextX, mouseContextY];
			if (point === null) {
				delay_handle_triggering = false;
				return;
			}
			var els = find_els_at_point(point);
			if (_nir_debug_)
				console_log("trigger_popup: els =", els, "point =", point);
			if (options.is_contextmenu) {
				mouseContextX = null;
				mouseContextY = null;
			}
			var source = find_source(els);
			if (!source && settings.mouseover_allow_self_pagelink && popup_trigger_reason === "keyboard") {
				source = {
					el: document.body,
					src: window.location.href,
					pagelink: true
				};
			}
			if (_nir_debug_)
				console_log("trigger_popup: source =", source);
			if (source && (popup_trigger_reason !== "mouse" || get_physical_popup_el(source.el) !== last_popup_el)) {
				trigger_popup_with_source(source);
			} else {
				if (popup_trigger_reason === "keyboard") {
					if (settings.mouseover_enable_notallowed) {
						cursor_not_allowed();
					}
				}
				delay_handle_triggering = false;
			}
		}
		function trigger_popup_with_source(source, automatic, use_last_pos, cb) {
			next_popup_el = get_physical_popup_el(source.el);
			if (!cb)
				cb = common_functions["nullfunc"];
			var use_head = false;
			var openb = get_tprofile_single_setting("mouseover_open_behavior");
			if (openb === "newtab" || openb === "newtab_bg" || openb === "download" || openb === "copylink") {
				use_head = true;
			}
			var old_source = source;
			var incomplete_image = false;
			var incomplete_video = false;
			var partial = get_single_setting("mouseover_allow_partial");
			if (partial === "media") {
				incomplete_image = true;
				incomplete_video = true;
			} else if (partial === "video") {
				incomplete_video = true;
			}
			if (is_in_iframe && can_iframe_popout()) {
				incomplete_image = true;
				incomplete_video = true;
			}
			return get_final_from_source(source, {
				automatic: automatic,
				multi: false,
				use_head: use_head,
				incomplete_image: incomplete_image,
				incomplete_video: incomplete_video,
				use_last_pos: use_last_pos
			}, function(source_imu, source, processing, data) {
				if (!source_imu && !source && !processing && !data) {
					delay_handle_triggering = false;
					if (old_source.pagelink) {
						stop_waiting_cant_load();
					} else {
						stop_waiting();
					}
					return cb(false);
				}
				if (automatic && previous_album_links && source_imu && source_imu[0]) {
					if (array_indexof(previous_album_links, source_imu[0].url) >= 0) {
						delay_handle_triggering = false;
						stop_waiting();
						return cb(false);
					}
				}
				var was_fullscreen = is_popup_fullscreen();
				resetpopups({
					new_popup: true,
					automatic: automatic
				});
				if (automatic) {
					popup_el_automatic = true;
					removepopups(); // don't fade out
				}
				real_popup_el = source.el;
				popup_el = get_physical_popup_el(real_popup_el);
				if (popup_el.parentElement) // check if it's a fake element returned by a gallery helper
					popup_orig_el = popup_el;
				popup_el_mediatype = el_media_type(popup_el);
				popup_el_is_stream = popup_el_mediatype === "video" || popup_el_mediatype === "audio";
				popup_orig_url = get_img_src(popup_el);
				if (is_in_iframe && can_iframe_popout() && get_tprofile_single_setting("mouseover_open_behavior") === "popup") {
					data.data.img = serialize_img(data.data.img);
					remote_send_message("top", {
						type: "make_popup",
						data: {
							source_imu: source_imu,
							src: source.src,
							processing: processing,
							data: data
						}
					});
				} else {
					makePopup(source_imu, source.src, processing, data);
					if (is_in_iframe && can_use_remote() && get_tprofile_single_setting("mouseover_open_behavior") === "popup") {
						remote_send_message("top", {
							type: "popup_open"
						});
					}
					if (false && was_fullscreen) {
						popup_set_fullscreen();
					}
				}
				cb(true);
			});
		}
		function get_final_from_source(source, options, cb) {
			var processing = { running: true };
			if (!options.multi) {
				stop_processing();
				processing_list = [processing];
			}
			var do_popup = function() {
				if (!options.multi)
					start_waiting(source.el);
				var x = mouseX;
				var y = mouseY;
				var realcb = function(source_imu, data) {
					if ((!source_imu && false) || !data) {
						if (!options.multi) {
							stop_waiting_cant_load();
						}
						return cb();
					}
					if (options.use_last_pos) {
						x = null;
						y = null;
					}
					cb(source_imu, source, processing, {
						data: data,
						x: x,
						y: y
					});
				};
				try {
					var force_page = settings.mouseover_ui_caption && settings.redirect_force_page;
					bigimage_recursive_loop(source.src, {
						fill_object: true,
						host_url: window.location.href,
						document: document,
						window: get_window(),
						element: source.el,
						force_page: force_page,
						cb: realcb
					}, function(obj, finalcb) {
						var orig_obj = obj;
						if (_nir_debug_)
							console_log("do_popup: brl query:", obj);
						if (options.null_if_no_change && obj[0].url === source.src) {
							return finalcb(source.src, obj[0], null);
						}
						var newobj = deepcopy(obj);
						if (!settings.mouseover_exclude_sameimage) {
							if (source.src && obj_indexOf(newobj, source.src) < 0)
								newobj.push(fillobj(source.src)[0]);
						} else if (source.src) {
							var index;
							while ((index = obj_indexOf(newobj, source.src)) >= 0) {
								newobj.splice(index, 1);
							}
						}
						if (source.pagelink) {
							newobj = basic_fillobj(newobj);
							array_foreach(newobj, function(sobj) {
								if (sobj.url.replace(/#.*/, "") === source.src.replace(/#.*/, "")) {
									sobj.is_pagelink = true;
								}
							});
						}
						processing.incomplete_image = options.incomplete_image;
						processing.incomplete_video = options.incomplete_video;
						processing.progress_cb = options.progress_cb;
						if (options.use_head) {
							processing.head = true;
						}
						if (settings.popup_allow_cache && !options.deny_cache) {
							processing.set_cache = true;
							processing.use_cache = true;
						}
						processing.deny_nondirect_delivery = options.deny_nondirect_delivery;
						if (!get_tprofile_setting("mouseover_allow_video")) {
							processing.deny_video = true;
						}
						if (!get_tprofile_setting("mouseover_allow_audio")) {
							processing.deny_audio = true;
						}
						processing.source = source;
						check_image_get(newobj, function(img, newurl, obj, respdata) {
							if (_nir_debug_)
								console_log("do_popup: check_image_get response:", img, newurl, obj, respdata);
							if (!img) {
								return finalcb(null);
							}
							var data = { img: img, newurl: newurl, obj: obj, respdata: respdata };
							var newurl1 = newurl;
							if (options.use_head) {
								data = { resp: img, obj: newurl };
								newurl1 = data.resp.finalUrl;
							}
							if (settings.print_imu_obj)
								console_log(orig_obj);
							finalcb(newurl1, data.obj, data);
							if (false) {
								if (newurl == source.src) {
									realcb(obj, data);
								} else {
									finalcb(newurl, data);
								}
							}
						}, processing);
					});
				} catch (e) {
					console_error(e);
				}
			};
			if (delay && !delay_mouseonly && !options.automatic) {
				start_progress(source.el);
				delay_handle = setTimeout(function() {
					if (delay_handle_triggering)
						return;
					delay_handle = null;
					do_popup();
				}, delay * 1000);
			} else {
				do_popup();
			}
		}
		function do_get_helpers(options) {
			var baseoptions = {
				document: document,
				window: get_window(),
				host_url: window.location.href,
				do_request: do_request,
				rule_specific: {}
			};
			for (var option in options) {
				baseoptions[option] = options[option];
			}
			return get_helpers(baseoptions);
		}
		function wrap_gallery_func(nextprev, origel, el, cb, new_options) {
			if (!el)
				el = real_popup_el;
			if (!origel)
				origel = popup_orig_el;
			var options = {
				element: origel,
				document: document,
				window: get_window(),
				host_url: window.location.href,
				do_request: do_request,
				rule_specific: {},
				cb: function(result) {
					if (result === void 0 || result === "default") {
						return cb(get_next_in_gallery(el, nextprev));
					} else {
						cb(result);
					}
				}
			};
			if (new_options) {
				for (var key in new_options) {
					options[key] = new_options[key];
				}
			}
			get_bigimage_extoptions_first(options);
			get_bigimage_extoptions(options);
			var helpers = get_helpers(options);
			var gallery = get_next_in_gallery;
			if (helpers && helpers.gallery) {
				gallery = function(el, nextprev) {
					var value = helpers.gallery(el, nextprev);
					if (value || value === null)
						return value;
					return get_next_in_gallery(el, nextprev);
				};
			}
			var value = gallery(el, nextprev);
			if (value === "waiting") {
				return;
			} else if (value === "default") {
				return cb(get_next_in_gallery(el, nextprev));
			}
			return cb(value);
		}
		var valid_el_cache = new IMUCache();
		function is_valid_el(el) {
			if (!el)
				return false;
			if (valid_el_cache.has(el))
				return valid_el_cache.get(el);
			var result = !!find_source([el]);
			valid_el_cache.set(el, result, 3);
			return result;
		}
		function count_gallery(nextprev, max, is_counting, origel, el, cb) {
			var count = 0;
			if (max === void 0)
				max = settings.mouseover_ui_gallerymax;
			var firstel = el;
			if (!firstel)
				firstel = real_popup_el;
			if (!firstel && popup_el_remote && can_iframe_popout() && !is_in_iframe) {
				return remote_send_message(popup_el_remote, {
					type: "count_gallery",
					data: {
						nextprev: nextprev,
						is_counting: is_counting,
						max: max
					}
				}, function(count) {
					cb(count);
				});
			}
			var loop = function() {
				wrap_gallery_func(nextprev, origel, el, function(newel) {
					if (!newel || !is_valid_el(newel))
						return cb(count, el);
					count++;
					if (count >= max)
						return cb(count, newel);
					el = newel;
					stackoverflow_guard(loop, count, 100);
				}, { is_counting: is_counting, counting_firstel: firstel });
			};
			loop();
		}
		var get_gallery_elements = function(cb, origel, el) {
			var count = 0;
			var els_set = new_set();
			var els = [];
			var firstel = el;
			if (!firstel)
				firstel = real_popup_el;
			if (firstel) {
				set_add(els_set, firstel);
				els.push(firstel);
			}
			var loop = function(nextprev, cb) {
				wrap_gallery_func(nextprev, origel, el, function(newel) {
					if (!newel || !is_valid_el(newel))
						return cb();
					count++;
					el = newel;
					if (!set_has(els_set, el)) {
						set_add(els_set, el);
						if (nextprev) {
							els.push(el);
						} else {
							els.unshift(el);
						}
					}
					stackoverflow_guard(function() {
						loop(nextprev, cb);
					}, count, 100);
				});
			};
			loop(false, function() {
				loop(true, function() {
					cb(els);
				});
			});
		};
		function wrap_gallery_cycle(dir, origel, el, cb) {
			if (!el)
				el = real_popup_el;
			if (dir === 0)
				return cb();
			var nextprev = true;
			var max = dir;
			if (dir < 0) {
				nextprev = false;
				max = -dir;
			}
			count_gallery(nextprev, max, false, origel, el, function(count, newel) {
				if (count < max) {
					if (settings.mouseover_gallery_cycle) {
						count_gallery(!nextprev, void 0, true, origel, el, function(count, newel) {
							cb(newel);
						});
					} else {
						cb(null);
					}
				} else {
					cb(newel);
				}
			});
		}
		function is_nextprev_valid(nextprev, cb) {
			if (popup_el_remote && can_iframe_popout() && !is_in_iframe) {
				return remote_send_message(popup_el_remote, {
					type: "is_nextprev_valid",
					data: {
						nextprev: nextprev
					}
				}, function(valid) {
					cb(valid);
				});
			}
			wrap_gallery_cycle(nextprev ? 1 : -1, void 0, void 0, function(el) {
				cb(is_valid_el(el));
			});
		}
		trigger_gallery = function(dir, cb) {
			if (!cb) {
				cb = common_functions.nullfunc;
			}
			if (popup_el_remote && can_iframe_popout() && !is_in_iframe) {
				return remote_send_message(popup_el_remote, {
					type: "trigger_gallery",
					data: {
						dir: dir
					}
				}, function(triggered) {
					cb(triggered);
				});
			}
			wrap_gallery_cycle(dir, void 0, void 0, function(newel) {
				if (newel) {
					var source = find_source([newel]);
					if (source) {
						trigger_popup_with_source(source, true, true, function(changed) {
							cb(changed);
						});
						return;
					}
				}
				return cb(false);
			});
		};
		var parse_transforms = function(transform) {
			var transforms = [];
			var transform_types = {};
			var last = 0;
			for (var i = 0; i < transform.length; i++) {
				if (transform[i] === ')') {
					var our_transform = strip_whitespace(transform.substr(last, (i - last) + 1));
					var type = our_transform.replace(/\(.*/, "");
					transforms.push(our_transform);
					if (!(type in transform_types)) {
						transform_types[type] = [];
					}
					transform_types[type].push(transforms.length - 1);
					last = i + 1;
					continue;
				}
			}
			return { transforms: transforms, types: transform_types };
		};
		var get_popup_transforms = function() {
			var style = null;
			if (popups && popups[0]) {
				var media = get_popup_media_el();
				if (media) {
					style = media.parentElement.parentElement.style;
				}
			}
			if (style && style.transform) {
				return parse_transforms(style.transform);
			} else {
				return { transforms: [], types: {} };
			}
		};
		var stringify_transforms = function(transforms) {
			return transforms.transforms.join(" ");
		};
		var set_popup_transforms = function(transforms) {
			var media = get_popup_media_el();
			if (media) {
				media.parentElement.parentElement.style.transform = stringify_transforms(transforms);
			}
		};
		var get_rotation_data_from_transforms = function(transforms) {
			var index = 0;
			if ("rotate" in transforms.types) {
				index = transforms.types.rotate[0];
			} else {
				transforms.transforms.unshift("rotate(0deg)");
			}
			var match = transforms.transforms[index].match(/^rotate\(([-0-9]+)deg\)$/);
			var deg = 0;
			if (match) {
				deg = parseInt(match[1]);
			}
			return {
				deg: deg,
				index: index
			};
		};
		var get_popup_rotation = function() {
			var transforms = get_popup_transforms();
			var rotation_data = get_rotation_data_from_transforms(transforms);
			return rotation_data.deg;
		};
		function rotate_gallery(dir) {
			if (!popups_active)
				return;
			var transforms = get_popup_transforms();
			var rotation_data = get_rotation_data_from_transforms(transforms);
			transforms.transforms[rotation_data.index] = "rotate(" + (rotation_data.deg + dir) + "deg)";
			set_popup_transforms(transforms);
			popup_createui_func(true);
		}
		var flip_gallery = function(hv) {
			if (!popups_active)
				return;
			var transforms = get_popup_transforms();
			var index = transforms.transforms.length;
			if ("scale" in transforms.types) {
				index = transforms.types.scale[0];
			} else {
				transforms.transforms.push("scale(1,1)");
			}
			var match = transforms.transforms[index].match(/^scale\(([-0-9.]+)\s*,\s*([-0-9.]+)\)$/);
			var scaleh = 1;
			var scalev = 1;
			if (match) {
				scaleh = parseFloat(match[1]);
				scalev = parseFloat(match[2]);
			}
			if (hv) {
				scalev = -scalev;
			} else {
				scaleh = -scaleh;
			}
			transforms.transforms[index] = "scale(" + scaleh + ", " + scalev + ")";
			set_popup_transforms(transforms);
		};
		var format_number_decimal = function(number, decimal) {
			var exp = Math_pow(10, decimal);
			;
			number *= exp;
			return (number | 0) / exp;
		};
		var get_bytes_unit = function(bytes) {
			var units = ["B", "KB", "MB", "GB", "TB", "PB"];
			while (units.length > 1 && bytes > 1024) {
				bytes /= 1024;
				units.shift();
			}
			return format_number_decimal(bytes, 2) + units[0];
		};
		function create_progress_el(position_top) {
			var progressc_el = document_createElement("div");
			set_el_all_initial(progressc_el);
			progressc_el.style.backgroundColor = "rgba(0,0,0,0.7)";
			progressc_el.style.height = "2em";
			progressc_el.style.zIndex = maxzindex - 2;
			var progressb_el = document_createElement("div");
			set_el_all_initial(progressb_el);
			progressb_el.style.position = "absolute";
			progressb_el.style.top = "0px";
			progressb_el.style.left = "0px";
			progressb_el.style.backgroundColor = "#00aaff";
			progressb_el.style.height = "100%";
			progressb_el.style.width = "0%";
			progressb_el.style.zIndex = maxzindex - 1;
			progressc_el.appendChild(progressb_el);
			if (position_top) {
				progressc_el.style.position = "fixed";
				progressc_el.style.top = "0px";
				progressc_el.style.left = "0px";
				progressc_el.style.width = "80%";
				progressc_el.style.marginTop = "100px";
				progressc_el.style.marginLeft = "10%";
				document.documentElement.appendChild(progressc_el);
			}
			return progressc_el;
		}
		function update_progress_el(el, percent, remove_on_complete) {
			var bar = el.children[0];
			if (typeof percent === "number") {
				if (bar.getAttribute("data-timer")) {
					clearInterval(parseInt(bar.getAttribute("data-timer")));
					bar.removeAttribute("data-timer");
				}
				if (percent >= 1 && remove_on_complete && el.parentElement) {
					el.parentElement.removeChild(el);
				} else {
					bar.style.width = (percent * 100) + "%";
				}
			} else if (percent == "unknown") {
				bar.style.width = "10%";
				if (!bar.getAttribute("data-timer")) {
					bar.style.left = "0%";
					bar.setAttribute("data-dir", "right");
					var timer = setInterval(function() {
						var left = parseFloat(bar.style.left);
						var delta = (15 / 1000) * 1;
						var size = 90;
						if (bar.getAttribute("data-dir") == "right") {
							left += (delta * size);
							if (left >= size) {
								left = size - (left - size);
								bar.setAttribute("data-dir", "left");
							}
						} else {
							left -= (delta * size);
							if (left <= 0) {
								left = -left;
								bar.setAttribute("data-dir", "right");
							}
						}
						bar.style.left = left + "%";
					}, 15);
					bar.setAttribute("data-timer", timer);
				}
			}
		}
		var is_el_pic = function(el) {
			return el.tagName === "IMG" || el.tagName === "PICTURE";
		};
		var is_img_pic_vid = function(el) {
			return is_el_pic(el) || el.tagName === "VIDEO";
		};
		var is_img_pic_vid_link = function(el) {
			if (is_img_pic_vid(el))
				return true;
			if (settings.mouseover_links) {
				if (el.tagName === "A")
					return true;
			}
			return false;
		};
		var get_all_valid_els = function(el) {
			if (!el)
				el = document;
			return el.querySelectorAll("img, picture, video");
		};
		var get_all_valid_els_link_real = function(el) {
			if (!el)
				el = document;
			return el.querySelectorAll("img, picture, video, a");
		};
		var get_all_valid_els_link = function(el) {
			if (settings.mouseover_links) {
				return get_all_valid_els_link_real(el);
			} else {
				return get_all_valid_els(el);
			}
		};
		var copy_el = function(oldel, newel, override) {
			array_foreach(oldel.attributes, function(attr) {
				if (!newel.hasAttribute(attr.name) || override)
					newel.setAttribute(attr.name, attr.value);
			});
		};
		var duplicate_el = function(oldel) {
			var newel = document_createElement(oldel.tagName);
			copy_el(oldel, newel);
			return newel;
		};
		var replace_el = function(oldel, newel) {
			if (newel.parentElement) {
				newel = duplicate_el(newel);
				newel.removeAttribute("style"); // in case of cached element being used in popup
			}
			copy_el(oldel, newel);
			oldel.parentElement.insertBefore(newel, oldel);
			oldel.parentElement.removeChild(oldel);
		};
		var replace_with_replacement = function(options, el, replacement, url) {
			var newsrc;
			if (!replaced) {
				newsrc = get_img_src(replacement);
			}
			var do_replace = false;
			if (el.tagName === "A") {
				if (options.plainlink_replace_link) {
					el.href = newsrc;
				}
				if (options.plainlink_replace_text) {
					el.textContent = newsrc;
				}
				if (options.plainlink_replace_media) {
					do_replace = true;
				}
			}
			var el_dimensions = get_el_dimensions(el);
			var replaced = false;
			if (do_replace || (typeof replacement !== "string" && replacement.tagName === "VIDEO")) {
				if (typeof replacement !== "string") {
					el = replace_el(el, replacement);
					replaced = true;
				} else {
					console_warn("Unable to replace", el, "due to invalid replacement:", replacement);
					return;
				}
			}
			if (!replaced && options.replace_imgs) {
				if (el.hasAttribute("srcset")) {
					el.removeAttribute("srcset");
				}
				if (get_img_src(el) !== newsrc) {
					el.src = newsrc;
				}
			}
			if (options.size_constraints === "remove") {
				el.removeAttribute("height");
				el.removeAttribute("width");
				el.style.setProperty("height", "auto", "important");
				el.style.setProperty("width", "auto", "important");
			} else if (options.size_constraints === "force" && el_dimensions && el_dimensions[0] && el_dimensions[1]) {
				el.setAttribute("height", el_dimensions[1]);
				el.removeAttribute("width", el_dimensions[0]);
				el.style.setProperty("height", el_dimensions[1] + "px", "important");
				el.style.setProperty("width", el_dimensions[0] + "px", "important");
			}
			if (options.replace_css) {
				apply_styles(el, options.replace_css, {
					force_important: true
				});
			}
			if (options.add_links) {
				var current = el;
				while (current = current.parentElement) {
					if (current.tagName === "A") {
						if (!options.replace_links)
							return;
						else
							break;
					}
				}
				if (!current) {
					current = document_createElement("a");
					el.parentElement.insertBefore(current, el);
					current.appendChild(el);
				}
				if (options.links_newtab) {
					current.target = "_blank";
				}
				if (current.href !== url) {
					current.href = url;
				}
			}
		};
		var replace_single_media = function(options, source, data, cb) {
			var waiting = false;
			if (data.data.img) {
				replace_with_replacement(options, source.el, data.data.img, data.data.obj.url);
			} else if (data.data.obj) {
				var load_image = function() {
					if (settings.replaceimgs_wait_fullyloaded && options.replace_imgs) {
						var image = new Image();
						var finish_image = function() {
							replace_with_replacement(options, source.el, image.src, data.data.obj.url);
							cb();
						};
						image.onload = finish_image;
						image.onerror = cb;
						image.src = data.data.obj.url;
					} else {
						replace_with_replacement(options, source.el, data.data.obj.url, data.data.obj.url);
						cb();
					}
				};
				if (is_extension) {
					extension_send_message({
						type: "override_next_headers",
						data: {
							url: data.data.obj.url,
							headers: data.data.obj.headers,
							method: "GET"
						}
					}, function() {
						load_image();
					});
				} else {
					load_image();
				}
				waiting = true;
			}
			if (!waiting)
				cb();
		};
		var replacing_imgs = false;
		var replaceimgs_elcache = new IMUCache();
		function replace_images(options) {
			if (replacing_imgs || currenttab_is_image())
				return;
			var raw_imgs = options.images;
			if (raw_imgs === void 0) {
				if (options.support_plainlinks) {
					raw_imgs = get_all_valid_els_link_real();
				} else {
					raw_imgs = get_all_valid_els();
				}
			}
			var imgs = [];
			if (!options.all_els_ok) {
				var parent_els = new_set();
				for (var i = 0; i < raw_imgs.length; i++) {
					var supported = is_img_pic_vid(raw_imgs[i]);
					if (!supported && options.support_plainlinks && raw_imgs[i].tagName === "A")
						supported = true;
					if (supported) {
						imgs.push(raw_imgs[i]);
						if (options.support_plainlinks) {
							var parent = raw_imgs[i].parentElement;
							while (parent) {
								set_add(parent_els, parent);
								parent = parent.parentElement;
							}
						}
					}
				}
				if (options.support_plainlinks) {
					for (var i = 0; i < imgs.length; i++) {
						if (imgs[i].tagName === "A" && set_has(parent_els, imgs[i])) {
							imgs.splice(i, 1);
							i--;
						}
					}
				}
			} else {
				imgs = raw_imgs;
			}
			if (imgs.length === 0)
				return;
			var ip;
			if (options.use_progressbar)
				console_log("Replacing images");
			var finished = 0;
			var final_progress = 1;
			if (options.finalcb && options.finalcb_progress) {
				final_progress -= options.finalcb_progress;
			}
			var finish_img = function(id) {
				finished++;
				if (options.use_progressbar) {
					ip.finish_id(id);
					console_log("Finished " + finished + "/" + total_imgs);
				}
				if (finished >= total_imgs) {
					if (options.use_progressbar) {
						update_progress_el(progressc_el, final_progress, true);
					}
					replacing_imgs = false;
					if (options.finalcb) {
						options.finalcb(function(progress) {
							if (options.use_progressbar && options.finalcb_progress) {
								update_progress_el(progressc_el, final_progress + (progress * options.finalcb_progress), true);
							}
						});
					}
				} else {
					stackoverflow_guard(next_img, finished, 100);
				}
			};
			if (!options.replace_image_func) {
				options.replace_image_func = function(options, our_source, cb, domain_processed_cb, progress_cb) {
					if (options.use_elcache) {
						if (replaceimgs_elcache.has(our_source.el)) {
							domain_processed_cb();
							return cb();
						} else {
							replaceimgs_elcache.set(our_source.el, true, 5);
						}
					}
					var use_head = !settings.replaceimgs_usedata;
					var incomplete = use_head;
					var null_if_no_change = true;
					if (our_source.el.tagName === "A") {
						use_head = null_if_no_change = !options.plainlink_replace_media;
						if (!null_if_no_change) {
							null_if_no_change = !looks_like_valid_link(our_source.src, our_source.el);
						}
					}
					get_final_from_source(our_source, {
						automatic: true,
						multi: true,
						use_head: use_head,
						incomplete_image: incomplete,
						incomplete_video: incomplete,
						null_if_no_change: null_if_no_change,
						use_last_pos: false,
						progress_cb: progress_cb
					}, function(source_imu, source, processing, data) {
						domain_processed_cb();
						if (!data) {
							replace_with_replacement(options, our_source.el, our_source.src, our_source.src);
							return cb();
						}
						replace_single_media(options, source, data, cb);
					});
				};
			}
			var current_img_i = 0;
			var next_img = function() {
				var total_limit = parseInt(settings.replaceimgs_totallimit);
				if (currently_processing > total_limit) {
					currently_processing--;
					return;
				} else if (currently_processing < total_limit) {
					currently_processing++;
					next_img();
				}
				var our_source = null;
				var our_domain = null;
				var now = Date.now();
				for (var domain in domains) {
					if (domains_processing[domain] >= parseInt(settings.replaceimgs_domainlimit)) {
						continue;
					}
					var delta = now - domains_lastrequest[domain];
					var replaceimgs_delay = parseFloat(settings.replaceimgs_delay) * 1000.0;
					var wait_delay = replaceimgs_delay - delta;
					if (wait_delay > 0) {
						if (domains_timeout[domain] === null) {
							(function(domain) {
								domains_timeout[domain] = setTimeout(function() {
									domains_timeout[domain] = null;
									next_img();
								}, wait_delay + 1);
							})(domain);
						}
						continue;
					}
					our_domain = domain;
					domains_processing[domain]++;
					domains_lastrequest[domain] = now;
					our_source = domains[domain][0];
					domains[domain].splice(0, 1);
					if (domains[domain].length === 0) {
						delete domains[domain];
					}
					break;
				}
				if (our_source === null && other.length > 0) {
					our_source = other[0];
					other.splice(0, 1);
				}
				var our_id = current_img_i;
				current_img_i++;
				if (our_source) {
					options.replace_image_func(options, our_source, function() {
						finish_img(our_id);
					}, function() {
						if (our_domain)
							domains_processing[our_domain]--;
					}, function(progobj) {
						if (settings.replaceimgs_simple_progress) {
							var percent = progobj.loaded / progobj.total;
							progobj.total = 1;
							progobj.loaded = percent;
						}
						ip.update_progobj(our_id, progobj);
					});
				} else {
					currently_processing--;
				}
			};
			var progressc_el;
			if (options.use_progressbar) {
				progressc_el = create_progress_el(true);
			}
			var domains = {};
			var domains_processing = {};
			var domains_lastrequest = {};
			var domains_timeout = {};
			var other = [];
			var total_imgs = imgs.length;
			for (var i = 0; i < imgs.length; i++) {
				var source = find_source([imgs[i]], { links: options.support_plainlinks });
				if (!source) {
					total_imgs--;
					continue;
				}
				source._replace_id = i;
				if (!source.src) {
					other.push(source);
					continue;
				}
				var domain = source.src.match(/^https?:\/\/([^/]+)\//);
				if (!domain) {
					other.push(source);
					continue;
				}
				if (!(domain[1] in domains)) {
					domains[domain[1]] = [];
					domains_processing[domain[1]] = 0;
					domains_lastrequest[domain[1]] = 0;
					domains_timeout[domain[1]] = null;
				}
				domains[domain[1]].push(source);
			}
			if (options.use_progressbar) {
				ip = new ImpreciseProgress({
					cb: function(progobj) {
						update_progress_el(progressc_el, progobj.percent * final_progress, false);
					},
					elements_num: total_imgs
				});
			}
			var currently_processing = 1;
			next_img();
		}
		var get_replace_images_options = function(options) {
			var base_options = {
				replace_imgs: settings.replaceimgs_replaceimgs,
				add_links: settings.replaceimgs_addlinks,
				replace_links: settings.replaceimgs_replacelinks,
				support_plainlinks: false,
				plainlink_replace_text: false,
				plainlink_replace_link: false,
				plainlink_replace_media: false,
				links_newtab: settings.replaceimgs_links_newtab,
				size_constraints: get_single_setting("replaceimgs_size_constraints"),
				replace_css: settings.replaceimgs_css,
				use_progressbar: true
			};
			var plainlinks_option = get_single_setting("replaceimgs_plainlinks");
			if (plainlinks_option !== "none") {
				base_options.support_plainlinks = true;
				if (plainlinks_option === "replace_link_text") {
					base_options.plainlink_replace_text = true;
					base_options.plainlink_replace_link = true;
				} else if (plainlinks_option === "replace_media") {
					base_options.plainlink_replace_media = true;
				}
			}
			if (!options)
				options = {};
			for (var key in options) {
				base_options[key] = options[key];
			}
			return base_options;
		};
		var replace_images_full = function(options) {
			var base_options = get_replace_images_options(options);
			return replace_images(base_options);
		};
		register_menucommand("Replace images", replace_images_full);
		var create_zip = function(files, foldername, cb, progresscb) {
			get_library("jszip", settings, do_request, function(lib) {
				if (!lib)
					return cb(null);
				var zip = new lib();
				var root = zip;
				if (foldername) {
					root = zip.folder(foldername);
				}
				for (var filename in files) {
					root.file(filename, files[filename]);
				}
				zip.generateAsync({ type: "blob" }, function(prog_info) {
					progresscb(prog_info.percent / 100);
				}).then(function(data) {
					cb(data);
				}, function(err) {
					console_error(err);
					cb(null);
				});
			});
		};
		var send_to_jdownloader = function(got_objs, foldername, cb) {
			var do_jd_request = function(req) {
				req.headers = {
					Referer: "https://qsniyg.github.io/maxurl/"
				};
				do_request(req);
			};
			var jdcheck = function(cb) {
				do_jd_request({
					method: "GET",
					url: "http://127.0.0.1:9666/jdcheckjson",
					onload: function(resp) {
						if (resp.status !== 200) {
							console_error("Unable to connect to JDownloader", resp);
							return cb(false);
						} else {
							try {
								JSON.parse(resp.responseText);
							} catch (e) {
								console_error(e);
								return cb(false);
							}
							return cb(true);
						}
					}
				});
			};
			var prepare_flashgots = function() {
				var referers = {};
				var referer_policy = get_single_setting("gallery_jd_referer");
				for (var i = 0; i < got_objs.length; i++) {
					var gobj = got_objs[i];
					if (!gobj)
						continue;
					var our_obj = {
						url: gobj.obj.url,
						filename: gobj.filename || "",
						desc: ""
					};
					var referer_key = "";
					var our_referer = null;
					if (gobj.obj.headers && referer_policy !== "never") {
						our_referer = headerobj_get(gobj.obj.headers, "referer") || null;
						if (our_referer) {
							our_obj.referer = our_referer;
							referer_key = our_referer;
							if (referer_policy === "domain") {
								referer_key = get_domain_from_url(referer_key);
							}
						}
					}
					if (!(referer_key in referers)) {
						referers[referer_key] = {
							referer: our_referer,
							urls: []
						};
					}
					referers[referer_key].urls.push(our_obj);
				}
				var final_queries = [];
				for (var key in referers) {
					var referer_obj = referers[key];
					var urls = [];
					var descs = [];
					var fnames = [];
					array_foreach(referer_obj.urls, function(url) {
						urls.push("directhttp://" + url.url);
						fnames.push(url.fnames);
						descs.push(url.desc);
					});
					var query = {
						urls: urls.join("\n"),
						descriptions: descs.join("\n"),
						fnames: fnames.join("\n")
					};
					if (foldername)
						query.package = foldername;
					query.referer = referer_obj.referer || "";
					if (settings.gallery_jd_autostart)
						query.autostart = "1";
					final_queries.push(stringify_queries(query, true));
				}
				return final_queries;
			};
			jdcheck(function(ok) {
				if (!ok)
					return cb(false);
				var queries = prepare_flashgots();
				var queries_done = 0;
				var total_queries = queries.length;
				var query_error = false;
				array_foreach(queries, function(query) {
					do_jd_request({
						method: "GET",
						url: "http://127.0.0.1:9666/flashgot?" + query,
						onload: function(resp) {
							queries_done++;
							if (query_error)
								return;
							if (resp.status !== 200) {
								console_error("Error with flashgot api", resp);
								query_error = true;
								return cb(false);
							}
							if (queries_done >= total_queries)
								cb(true);
						}
					});
				});
			});
		};
		var download_album = function() {
			var files = {};
			var urls = new_set();
			var got_objs = [];
			var infos = {};
			var failed_infos = [];
			var filename = null;
			var download_method = get_single_setting("gallery_download_method");
			var set_zip_filename = function(obj) {
				if (filename || !obj)
					return;
				var our_vars = deepcopy(obj.format_vars);
				our_vars.ext = ".zip";
				our_vars.items_amt = Object.keys(got_objs).length.toString(); //Object.keys(files).length.toString();
				filename = get_filename_from_format(settings.gallery_zip_filename_format, our_vars);
				if (!filename)
					filename = "download";
				if (!/\.zip$/i.test(filename))
					filename += ".zip";
			};
			var get_trunc_url = function(url) {
				if (/^https?:\/\//i.test(url))
					return url;
				return url.substr(0, 1000); // to avoid huge data urls
			};
			var get_host_info = function() {
				var info = {};
				info.url = window_location;
				try {
					var our_window = get_window();
					var href1 = our_window.location.href;
					if (href1 !== window_location) {
						info.url_orig = window_location;
						info.url = href1;
					}
					info.title = document.title;
					info.download_time = new Date().toString();
				} catch (e) {
					console_error(e);
				}
				return info;
			};
			var get_failed_info = function(source) {
				var info = {};
				info.num_in_gallery = source._replace_id + 1;
				var source_src = source.src;
				if (source_src)
					info.url = get_trunc_url(source_src);
				return info;
			};
			var get_info_for_file = function(filename, obj, origurl, source) {
				var info = {};
				info.num_in_gallery = source._replace_id + 1;
				info.download_url = get_trunc_url(origurl);
				if (obj.headers)
					info.download_headers = obj.headers;
				var source_src = source.src;
				if (source_src && source_src !== origurl) {
					info.thumb_url = get_trunc_url(source_src);
				}
				info.filename = filename;
				if (obj.filename !== filename) {
					info.orig_filename = obj.filename;
				}
				if (obj.filesize)
					info.filesize = obj.filesize;
				if (obj.extra) {
					obj_foreach(obj.extra, function(key, value) {
						if (value !== null && value !== "")
							info["extra_" + key] = value;
					});
				}
				return info;
			};
			var unix_to_dos = function(txt) {
				return txt.replace(/\r*\n/g, "\r\n");
			};
			var get_info_file = function() {
				var header = get_host_info();
				var file = [];
				file.push(" --- Page info ---", "");
				file.push(JSON_stringify(header, null, "\t"));
				file.push("", " --- Files ---", "");
				for (var i = 0; i < got_objs.length; i++) {
					if (!got_objs[i] || !got_objs[i].filename)
						continue;
					var filename = got_objs[i].filename;
					file.push(filename);
					file.push(JSON_stringify(infos[i], null, "\t"));
					file.push("");
				}
				if (failed_infos.length) {
					file.push("", " --- Failed ---", "");
					array_foreach(failed_infos, function(info) {
						file.push(JSON_stringify(info, null, "\t"));
						file.push("");
					});
				}
				return unix_to_dos(file.join("\n"));
			};
			var get_first_obj = function() {
				for (var i = 0; i < got_objs.length; i++) {
					if (!got_objs[i] || !got_objs[i].obj)
						continue;
					return got_objs[i].obj;
				}
			};
			var add_file = function(data, our_source, progresscb, cb) {
				if (!data || !data.data || !data.data.obj) {
					console_error("Invalid data", data, our_source);
					return cb();
				}
				var src = data.data.obj.url;
				if (data.data.resp) {
					if (!data.data.resp.finalUrl) {
						console_error("Unable to load image from", data, our_source);
						return cb();
					}
					src = data.data.resp.finalUrl;
				}
				if (data.data.img) {
					if (data.data.img.tagName === "VIDEO") {
						data.data.img.pause();
					}
					src = get_img_src(data.data.img);
				}
				var obj = data.data.obj || {};
				var origurl = obj.url;
				var filename = null; // to be filled by fill_filename
				if (set_has(urls, origurl)) {
					return cb();
				} else {
					set_add(urls, origurl);
				}
				var fill_filename = function(use_download) {
					fill_obj_filename(obj, origurl, data.data.respdata);
					filename = obj.filename;
					if (use_download && !filename)
						filename = "download";
					if (filename && filename in files) {
						var i = 1;
						var new_filename;
						var splitted = url_basename(filename, { split_ext: true });
						do {
							new_filename = splitted[0] + " (" + (i++) + ")";
							if (splitted[1]) {
								new_filename += "." + splitted[1];
							}
						} while (new_filename in files);
						filename = new_filename;
					}
					return filename;
				};
				var final_cb = function() {
					if (settings.gallery_zip_add_info_file) {
						infos[our_source._replace_id] = get_info_for_file(filename, obj, origurl, our_source);
					}
					got_objs[our_source._replace_id] = { obj: obj, filename: filename };
					cb();
				};
				if (download_method === "jdownloader") {
					fill_filename(false);
					final_cb();
					return;
				}
				request_chunked({
					url: src,
					headers: obj.headers
				}, {
					onload: function(resp) {
						fill_filename(true);
						files[filename] = resp.data;
						final_cb();
					},
					onprogress: progresscb
				});
			};
			var process_gallery_els = function(els) {
				replace_images_full({
					images: els,
					all_els_ok: true,
					replace_image_func: function(options, our_source, cb, domain_processed_cb, progress_cb) {
						var gffs_options = {
							automatic: true,
							multi: true,
							use_head: false,
							incomplete_image: false,
							incomplete_video: true,
							deny_nondirect_delivery: true,
							deny_cache: true,
							null_if_no_change: !settings.gallery_download_unchanged,
							use_last_pos: false,
							progress_cb: progress_cb
						};
						if (download_method === "jdownloader") {
							gffs_options.use_head = true;
							gffs_options.incomplete_image = true;
							gffs_options.incomplete_video = true;
						}
						get_final_from_source(our_source, gffs_options, function(source_imu, source, processing, data) {
							domain_processed_cb();
							if (!data) {
								if (typeof source === "undefined" && !settings.gallery_download_unchanged) {
									console_warn("Not downloading unchanged image", our_source);
								} else {
									console_error("Unable to download", source, our_source);
									if (settings.gallery_zip_add_info_file) {
										failed_infos.push(get_failed_info(our_source));
									}
								}
								return cb();
							} else {
								add_file(data, our_source, function(progobj) { }, cb);
							}
						});
					},
					finalcb: function(onprogress) {
						if ((download_method === "zip" && !Object.keys(files).length) ||
							!got_objs.length) {
							console_error("No files!");
							onprogress(1);
							return;
						}
						set_zip_filename(get_first_obj());
						filename = filename || "download.zip";
						var foldername = filename.replace(/\.zip$/i, "");
						var zip_foldername = null;
						if (settings.gallery_zip_add_tld) {
							zip_foldername = foldername;
						}
						if (settings.gallery_zip_add_info_file) {
							files["info.txt"] = get_info_file();
						}
						start_waiting();
						if (download_method === "jdownloader") {
							send_to_jdownloader(got_objs, foldername, function(ok) {
								onprogress(1);
								if (!ok) {
									cursor_not_allowed();
								} else {
									stop_waiting();
								}
							});
						} else {
							create_zip(files, zip_foldername, function(data) {
								onprogress(1);
								if (!data) {
									cursor_not_allowed();
									return;
								} else {
									stop_waiting();
								}
								do_blob_download(data, filename);
							}, onprogress);
						}
					},
					finalcb_progress: 0.1
				});
			};
			get_gallery_elements(function(els) {
				process_gallery_els(els);
			});
		};
		var generate_random_class = function(name) {
			return "imu-" + get_random_text(10) + "-" + name;
		};
		var highlightimgs_styleel = null;
		var highlightimgs_classname = generate_random_class("highlight");
		var create_highlight_styleel = function() {
			if (highlightimgs_styleel || !/^text\//.test(document.contentType))
				return;
			highlightimgs_styleel = document_createElement("style");
			document.documentElement.appendChild(highlightimgs_styleel);
			update_highlight_styleel();
		};
		var update_highlight_styleel = function() {
			create_highlight_styleel();
			if (highlightimgs_styleel) {
				highlightimgs_styleel.innerText = "." + highlightimgs_classname + "{" + get_styletag_styles(settings.highlightimgs_css) + "}";
			}
		};
		(function() {
			var oldfunc = settings_meta.highlightimgs_css.onupdate;
			settings_meta.highlightimgs_css.onupdate = function() {
				update_highlight_styleel();
				if (oldfunc)
					return oldfunc.apply(this, arguments);
			};
		})();
		var apply_highlight_style = function(target) {
			create_highlight_styleel();
			target.classList.add(highlightimgs_classname);
		};
		var remove_highlight_style = function(target) {
			target.classList.remove(highlightimgs_classname);
		};
		var check_highlightimgs_valid_image = function(el) {
			var src = get_img_src(el);
			if (!is_valid_src(src, is_video_el(el)) || (el.tagName === "A" && !looks_like_valid_link(src, el)))
				return false;
			return true;
		};
		var get_highlightimgs_valid_image = function(el) {
			if (el.hasAttribute("data-imu-valid")) {
				return !!parse_boolean(el.getAttribute("data-imu-valid"));
			}
			var valid = check_highlightimgs_valid_image(el);
			el.setAttribute("data-imu-valid", valid + "");
			return valid;
		};
		var get_highlightimgs_supported_image = function(el) {
			if (el.hasAttribute("data-imu-supported")) {
				return !!parse_boolean(el.getAttribute("data-imu-supported"));
			}
			var supported = check_highlightimgs_supported_image(el);
			el.setAttribute("data-imu-supported", supported + "");
			return supported;
		};
		var auto_highlighted_imgs = [];
		var highlight_images = function(options) {
			if (currenttab_is_image() && settings.mouseover_exclude_imagetab)
				return;
			if (!options) {
				options = {};
			}
			var images = options.images;
			if (images === void 0) {
				images = get_all_valid_els_link();
			}
			if (!images.length)
				return;
			for (var i = 0; i < images.length; i++) {
				if (!get_highlightimgs_valid_image(images[i]))
					continue;
				var supported = !settings.highlightimgs_onlysupported;
				if (settings.highlightimgs_onlysupported) {
					supported = get_highlightimgs_supported_image(images[i]);
				}
				if (!options.hoveronly) {
					if (supported) {
						if (options.is_auto && array_indexof(auto_highlighted_imgs, images[i]) < 0) {
							auto_highlighted_imgs.push(images[i]);
						}
						apply_highlight_style(images[i]);
					} else {
						remove_highlight_style(images[i]);
					}
				}
			}
		};
		(function() {
			var added = false;
			var id = null;
			var update_button = function() {
				if (settings.highlightimgs_enable) {
					if (!added) {
						id = register_menucommand("Highlight images", highlight_images);
						added = true;
					}
				} else {
					if (added) {
						unregister_menucommand(id);
						added = false;
					}
				}
			};
			update_button();
			var origfunc = settings_meta.highlightimgs_enable.onupdate;
			settings_meta.highlightimgs_enable.onupdate = function() {
				update_button();
				if (origfunc)
					return origfunc.apply(this, arguments);
			};
		})();
		var popup_mouse_head = function() {
			if (delay_handle_triggering)
				return false;
			var enabledisable_toggle = get_single_setting("mouseover_trigger_enabledisable_toggle");
			if (trigger_complete(settings.mouseover_trigger_prevent_key)) {
				if (enabledisable_toggle === "disable")
					return false;
			} else {
				if (enabledisable_toggle === "enable")
					return false;
			}
			popup_trigger_reason = "mouse";
			return true;
		};
		var image_mouseover = function(e) {
			if (currenttab_is_image() && settings.mouseover_exclude_imagetab)
				return;
			if (get_single_setting("highlightimgs_auto") === "hover" && get_highlightimgs_valid_image(e.target)) {
				var supported = !settings.highlightimgs_onlysupported;
				if (!supported) {
					supported = get_highlightimgs_supported_image(e.target);
				}
				if (supported) {
					if (array_indexof(auto_highlighted_imgs, e.target) < 0)
						auto_highlighted_imgs.push(e.target);
					apply_highlight_style(e.target);
				}
			}
			if (mouseover_mouse_enabled() && settings.mouseover_trigger_mouseover && !delay_handle && !should_exclude_imagetab()) {
				delay_el = e.target;
				update_mouse_from_event(e);
				delay_handle = setTimeout(function() {
					delay_el = null;
					if (delay_handle) {
						clearTimeout(delay_handle);
						delay_handle = null;
					}
					if (!popup_mouse_head())
						return;
					if (false) {
						var source = find_source([e.target]);
						if (source && get_physical_popup_el(source.el) !== last_popup_el) {
							trigger_popup_with_source(source);
						}
					} else {
						trigger_popup();
					}
				}, delay * 1000);
			}
		};
		var image_mouseout = function(e) {
			if (get_single_setting("highlightimgs_auto") === "hover" && get_highlightimgs_valid_image(e.target)) {
				remove_highlight_style(e.target);
			}
			if (mouseover_mouse_enabled() && settings.mouseover_trigger_mouseover && delay_handle) {
				if (delay_el === e.target) {
					clearTimeout(delay_handle);
					delay_handle = null;
				}
			}
		};
		function on_new_images(images) {
			var highlight = get_single_setting("highlightimgs_auto");
			if (highlight === "always" || highlight === "hover")
				highlight_images({ images: images, hoveronly: highlight === "hover", is_auto: true });
			for (var i = 0; i < images.length; i++) {
				our_removeEventListener(images[i], "mouseover", image_mouseover);
				our_removeEventListener(images[i], "mouseout", image_mouseout);
				our_addEventListener(images[i], "mouseover", image_mouseover);
				our_addEventListener(images[i], "mouseout", image_mouseout);
			}
			if (settings.replaceimgs_auto)
				replace_images_full({ images: images, use_progressbar: false, use_elcache: true });
		}
		;
		(function() {
			if (is_suspended())
				return;
			if (settings.apply_blacklist_host && !bigimage_filter(window.location.href))
				return;
			var observer;
			var observe_options = { childList: true, subtree: true, attributes: true };
			var new_mutationobserver = function() {
				return new MutationObserver(function(mutations, observer) {
					var images = [];
					var add_nodes = function(nodes) {
						for (var i = 0; i < nodes.length; i++) {
							if (is_img_pic_vid_link(nodes[i])) {
								images.push(nodes[i]);
							}
							if (nodes[i].children) {
								add_nodes(nodes[i].children);
							}
						}
					};
					for (var i = 0; i < mutations.length; i++) {
						var mutation = mutations[i];
						if (mutation.addedNodes) {
							add_nodes(mutation.addedNodes);
						}
						if (mutation.target && mutation.type === "attributes") {
							if (mutation.attributeName === "src" || mutation.attributeName === "href" || mutation.attributeName === "srcset") {
								add_nodes([mutation.target]);
							}
						}
					}
					if (images.length > 0) {
						on_new_images(images);
					}
				});
			};
			var observe = function() {
				if (is_suspended())
					return;
				on_new_images(get_all_valid_els_link());
				if (!observer)
					return;
				observer.observe(document, observe_options);
			};
			var remove_all_highlights = function() {
				for (var i = 0; i < auto_highlighted_imgs.length; i++) {
					remove_highlight_style(auto_highlighted_imgs[i]);
				}
				auto_highlighted_imgs = [];
			};
			var disconnect = function() {
				remove_all_highlights();
				if (!observer)
					return;
				observer.disconnect();
			};
			termination_hooks.push(disconnect);
			var needs_observer = function() {
				var highlight = get_single_setting("highlightimgs_auto");
				return highlight === "always" || highlight === "hover" || settings.replaceimgs_auto || (mouseover_mouse_enabled() && settings.mouseover_trigger_mouseover);
			};
			var create_mutationobserver = function() {
				try {
					observer = new_mutationobserver();
				} catch (e) {
					console_warn(e);
				}
				if (needs_observer()) {
					observe();
				}
			};
			create_mutationobserver();
			var update_highlightimgs_func = function() {
				if (needs_observer()) {
					if (get_single_setting("highlightimgs_auto") !== "always") {
						remove_all_highlights();
					}
					observe();
				} else {
					disconnect();
				}
			};
			var orig_highlightfunc = settings_meta.highlightimgs_auto.onupdate;
			settings_meta.highlightimgs_auto.onupdate = function() {
				if (orig_highlightfunc)
					orig_highlightfunc();
				update_highlightimgs_func();
			};
			var orig_imuenabledfunc = settings_meta.imu_enabled.onupdate;
			settings_meta.imu_enabled.onupdate = function() {
				if (orig_imuenabledfunc)
					orig_imuenabledfunc.apply(this, arguments);
				if (settings.imu_enabled) {
					update_highlightimgs_func();
				} else {
					disconnect();
				}
			};
		})();
		var get_popup_media_el = function() {
			var imgels = popups[0].getElementsByTagName("video");
			if (imgels.length === 0)
				imgels = popups[0].getElementsByTagName("img");
			if (imgels.length > 0)
				return imgels[0];
			else
				return null;
		};
		var get_popup_media_url = function() {
			var el = get_popup_media_el();
			if (el)
				return el.src;
			else
				return null;
		};
		var download_popup_image = function() {
			do_download(popup_obj, popup_obj.filename, popup_contentlength);
		};
		var download_popup_media = function() {
			if (popup_obj.media_info && popup_obj.media_info.delivery && settings.enable_stream_download) {
				start_waiting();
				get_download_urls_from_infoobj(popup_obj, function(urls) {
					if (!urls) {
						cursor_not_allowed();
						return;
					}
					get_ffmpeg(function(ffmpeg) {
						if (!ffmpeg) {
							cursor_not_allowed();
							return;
						}
						stop_waiting();
						var progress_el = create_progress_el(true);
						var last_console_progress = 0;
						download_playlist_urls(popup_obj, urls, function(progobj) {
							var now = Date.now();
							if (now - last_console_progress > 50) {
								last_console_progress = now;
								var percent = format_number_decimal(progobj.percent * 100, 2);
								var loaded_bytes = get_bytes_unit(progobj.loaded);
								var total_bytes = get_bytes_unit(progobj.total);
								var accurate = progobj.total_accurate ? "" : "~";
								console_log(loaded_bytes + " / " + accurate + total_bytes + " (" + percent + "%)");
							}
							update_progress_el(progress_el, progobj.percent * 0.9, true);
						}, function(data) {
							ffmpeg_join(ffmpeg, data, function(percent) {
								update_progress_el(progress_el, 0.9 + (percent * 0.1), true);
							}, function(filename) {
								update_progress_el(progress_el, 1, true);
								var data = ffmpeg.FS("readFile", filename);
								new_blob(data, function(blob) {
									var out_ext = url_basename(filename, { split_ext: true })[1];
									var out_filename = url_basename(popup_obj.filename || "download", { split_ext: true, known_ext: true })[0] + "." + out_ext;
									do_blob_download(blob, out_filename, function() {
										ffmpeg.FS("unlink", filename);
									});
								});
							});
						});
					});
				});
			} else {
				download_popup_image();
			}
		};
		var get_popup_video = function() {
			var videoel = popups[0].getElementsByTagName("video");
			if (!videoel || videoel.length === 0) {
				videoel = popups[0].getElementsByTagName("audio");
			}
			if (!videoel || videoel.length === 0) {
				return null;
			}
			return videoel[0];
		};
		var seek_popup_video = function(leftright, amount) {
			var timemul = leftright ? -1 : 1;
			if (typeof amount === "undefined")
				amount = settings.mouseover_video_seek_amount;
			var time = timemul * amount;
			var videoel = get_popup_video();
			if (!videoel)
				return;
			videoel.currentTime += time;
		};
		var framestep_popup_video = function(leftright) {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			videoel.pause();
			seek_popup_video(leftright, 1.0 / settings.mouseover_video_framerate);
		};
		var popup_video_speed = function(downup) {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			if (typeof downup !== "number") {
				var amount = settings.mouseover_video_speed_amount;
				if (downup === true)
					amount = -amount;
				videoel.playbackRate += amount;
			} else {
				videoel.playbackRate = downup;
			}
		};
		var popup_video_volume = function(downup) {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			if (typeof downup !== "number") {
				var amount = settings.mouseover_video_volume_change_amt;
				if (downup === true)
					amount = -amount;
				var new_volume = videoel.volume + (amount / 100.);
				new_volume = Math_min(Math_max(new_volume, 0), 1);
				videoel.volume = new_volume;
			} else {
				videoel.volume = downup;
			}
		};
		var toggle_video_muted = function() {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			videoel.muted = !videoel.muted;
		};
		var toggle_video_controls = function() {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			if (videoel.getAttribute("controls") === "controls") {
				videoel.removeAttribute("controls");
			} else {
				videoel.setAttribute("controls", "controls");
			}
		};
		var play_video = function(el) {
			try {
				el.play();
			} catch (e) {
				console_warn("Unable to autoplay", el, e);
			}
		};
		var toggle_video_playing = function() {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			if (videoel.paused) {
				play_video(videoel);
			} else {
				videoel.pause();
			}
		};
		var toggle_popup_ui = function() {
			popup_createui_func(true, "toggle");
		};
		var is_fullscreen = function() {
			return document.fullscreenElement !== null || document.fullscreen;
		};
		var is_popup_fullscreen = function() {
			return is_fullscreen() && popup_is_fullscreen;
		};
		var popup_set_fullscreen = function() {
			var media_el = get_popup_media_el();
			media_el.requestFullscreen().then(function(e) {
				popup_is_fullscreen = true;
			}, function(e) {
				console_error("Error loading fullscreen", e);
			});
		};
		var exit_fullscreen = function() {
			document.exitFullscreen();
			popup_is_fullscreen = false;
		};
		var popup_toggle_fullscreen = function() {
			if (!is_fullscreen()) {
				popup_set_fullscreen();
			} else {
				exit_fullscreen();
			}
		};
		var popup_active = function() {
			return popups_active && popup_el;
		};
		var can_use_hold_key = function() {
			if (!popups_active)
				return false;
			if (popup_trigger_reason !== "mouse") {
				var auto_close = settings.mouseover_auto_close_popup && settings.mouseover_auto_close_popup_time;
				var close_mouseout = get_close_need_mouseout();
				if (!auto_close && !close_mouseout)
					return false;
			}
			return settings.mouseover_use_hold_key;
		};
		var update_popup_hold = function() {
			if (!popups_active)
				return;
			var hold_zoom = get_single_setting("popup_hold_zoom");
			if (popup_update_zoom_func && hold_zoom !== "none") {
				if (popup_hold) {
					popup_update_zoom_func(hold_zoom);
				} else {
					popup_update_zoom_func("last");
				}
			}
			if (popup_update_pos_func && settings.mouseover_hold_position_center) {
				var newpos = popup_update_pos_func(mouseX, mouseY, true);
				popups[0].style.top = newpos[1] + "px";
				popups[0].style.left = newpos[0] + "px";
			}
			popup_hold_func();
		};
		var toggle_popup_hold = function() {
			popup_hold = !popup_hold;
			clear_resetpopup_timeout();
			if (!popup_hold && (can_close_popup[1] || settings.mouseover_hold_close_unhold)) {
				action_handler({ type: "resetpopups" });
			} else {
				update_popup_hold();
			}
		};
		var get_video_screenshot = function(video, cb) {
			var canvas = document_createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			var context = canvas.getContext("2d");
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			var mime = "image/png";
			var screenshot_format = get_single_setting("popup_video_screenshot_format");
			if (screenshot_format === "jpg")
				mime = "image/jpeg";
			return cb(get_canvas_src(canvas, mime));
		};
		var screenshot_video = function() {
			var videoel = get_popup_video();
			if (!videoel)
				return;
			get_video_screenshot(videoel, function(data) {
				if (!data) {
					console_error("Unable to screenshot video");
					cursor_not_allowed();
					return;
				}
				var our_vars = deepcopy(popup_obj.format_vars);
				our_vars.is_screenshot = { usable: true };
				our_vars.ext = ".png";
				if (get_single_setting("popup_video_screenshot_format") === "jpg") {
					our_vars.ext = ".jpg";
				}
				our_vars.filename = our_vars.filename_noext + our_vars.ext;
				var screenshot_filename = get_filename_from_format(settings.filename_format, our_vars);
				do_download({
					url: data
				}, screenshot_filename);
			});
		};
		var action_handler = function(action) {
			if (_nir_debug_) {
				console_log("action_handler", action);
			}
			if (action.needs_popup && !popup_active())
				return;
			switch (action.type) {
				case "resetpopups":
					resetpopups();
					return true;
				case "replace_images":
					replace_images_full();
					return true;
				case "highlight_images":
					highlight_images();
					return true;
				case "trigger_popup":
					if (action.trigger === "keyboard") {
						popup_trigger_reason = "keyboard";
					}
					trigger_popup();
					return true;
				case "gallery_prev":
					trigger_gallery(-1);
					return true;
				case "gallery_next":
					trigger_gallery(1);
					return true;
				case "download":
					download_popup_media();
					return true;
				case "open_in_new_tab":
					open_in_tab_imu(popup_obj, action.background_tab);
					return true;
				case "rotate_left":
					rotate_gallery(-90);
					return true;
				case "rotate_right":
					rotate_gallery(90);
					return true;
				case "flip_horizontal":
					flip_gallery(false);
					return true;
				case "flip_vertical":
					flip_gallery(true);
					return true;
				case "zoom_in":
					popup_zoom_func("incremental", -1);
					return true;
				case "zoom_out":
					popup_zoom_func("incremental", 1);
					return true;
				case "zoom_full":
					popup_zoom_func("fitfull", -1);
					return true;
				case "zoom_fit":
					popup_zoom_func("fitfull", 1);
					return true;
				case "fullscreen":
					popup_toggle_fullscreen();
					return true;
				case "seek_left":
					seek_popup_video(true);
					return true;
				case "seek_right":
					seek_popup_video(false);
					return true;
				case "frame_left":
					framestep_popup_video(true);
					return true;
				case "frame_right":
					framestep_popup_video(false);
					return true;
				case "speed_down":
					popup_video_speed(true);
					return true;
				case "speed_up":
					popup_video_speed(false);
					return true;
				case "reset_speed":
					popup_video_speed(1);
					return true;
				case "volume_up":
					popup_video_volume(false);
					return true;
				case "volume_down":
					popup_video_volume(true);
					return true;
				case "toggle_mute":
					toggle_video_muted();
					return true;
				case "toggle_controls":
					toggle_video_controls();
					return true;
				case "toggle_play_pause":
					toggle_video_playing();
					return true;
				case "open_options":
					open_in_tab_imu({ url: get_options_page() }, false);
					return true;
				case "open_orig_page":
					if (popup_obj && popup_obj.extra && popup_obj.extra.page) {
						open_in_tab_imu({ url: popup_obj.extra.page }, false);
					} else {
						console_log("Unable to find original page for", popup_obj);
					}
					return true;
				case "hold":
					update_popup_hold();
					return true;
				case "toggle_hold":
					toggle_popup_hold();
					return true;
				case "toggle_ui":
					toggle_popup_ui();
					return true;
				case "copy_link":
					if (popup_obj && popup_obj.url) {
						clipboard_write_link(popup_obj.url, function(success) {
							if (!success)
								console_warn("Unable to write url to clipboard:", popup_obj.url);
						});
					} else {
						console_warn("Popup not open?");
					}
					return true;
				case "screenshot_video":
					screenshot_video();
					return true;
				case "download_gallery":
					download_album();
					return true;
			}
			return false;
		};
		var action_remote = function(actions) {
			if (can_use_remote()) {
				var recipient = "top";
				var has_mouse = true;
				if (!is_in_iframe) {
					recipient = mouse_frame_id;
					if (recipient === "top") {
						has_mouse = false;
						if (popup_el_remote) {
							recipient = popup_el_remote;
						} else {
							return;
						}
					}
				}
				for (var i = 0; i < actions.length; i++) {
					if (!has_mouse && actions[i].requires_mouse) {
						actions.splice(i, 1);
						i--;
					}
				}
				if (actions.length > 0) {
					remote_send_message(recipient, {
						type: "action",
						data: actions
					});
				}
			}
		};
		var inputels_cache = new IMUCache();
		var is_inputel = function(el) {
			if (el.tagName === "TEXTAREA")
				return true;
			if (el.tagName === "INPUT") {
				if (!el.hasAttribute("type") || el.getAttribute("type") === "text") {
					return true;
				}
			}
			do {
				if (el.hasAttribute("contenteditable")) {
					return true;
				}
			} while (el = el.parentElement);
			return false;
		};
		var update_contextmenu_pos = function(event) {
			mouseContextX = event.clientX;
			mouseContextY = event.clientY;
			mouseAbsContextX = event.pageX;
			mouseAbsContextY = event.pageY;
		};
		var do_event_return = function(event, retval) {
			if (retval === false) {
				try {
					event.preventDefault();
					event.stopImmediatePropagation();
					event.stopPropagation();
				} catch (e) { }
			}
			return retval;
		};
		var event_cache = new IMUCache();
		var get_event_cache_key = function(event) {
			var down = true;
			if (event.type === "mouseup" || event.type === "keyup")
				down = false;
			var keystrs = get_keystrs_map(event, down);
			var keystrs_arr = [];
			for (var key in keystrs) {
				keystrs_arr.push(key + ":" + keystrs[key]);
			}
			return down + " " + keystrs_arr.join(",") + " " + event.timeStamp;
		};
		var keydown_cb = function(event) {
			if (is_options_page)
				return;
			nir_debug("input", "keydown_cb", event);
			if (!mouseover_base_enabled())
				return;
			if (event.type === "wheel" && chord_is_only_wheel(current_chord))
				return;
			if (event.type === "keydown") {
				if (event.repeat)
					return;
				if (editing_text)
					return;
				if (settings.disable_keybind_when_editing && event.target) {
					var is_bad = inputels_cache.get(event.target);
					if (is_bad === void 0) {
						is_bad = is_inputel(event.target);
						inputels_cache.set(event.target, is_bad, 60);
					}
					if (is_bad === true) {
						return;
					}
				}
			}
			var ret = void 0;
			var actions = [];
			update_chord(event, true);
			var event_cache_key = get_event_cache_key(event);
			if (event_cache.has(event_cache_key)) {
				return do_event_return(event, event_cache.get(event_cache_key));
			}
			if (is_extension && settings.extension_contextmenu && event.type === "mousedown") {
				if (trigger_complete(["shift", "button2"])) {
					update_contextmenu_pos(event);
				}
			}
			if (settings.mouseover) {
				if (get_single_setting("mouseover_trigger_behavior") === "keyboard") {
					var triggers = [settings.mouseover_trigger_key];
					for (var i = 0; i < num_profiles; i++) {
						triggers.push(settings["mouseover_trigger_key_t" + (i + 2)]);
					}
					array_foreach(triggers, function(trigger, i) {
						if (!event_in_chord(event, trigger))
							return;
						if (trigger_complete(trigger) && !popups_active) {
							current_chord_timeout = {};
							if (!delay_handle) {
								actions.push({
									requires_mouse: true,
									type: "trigger_popup",
									trigger: "keyboard"
								});
								ret = false;
								release_ignore = trigger;
							}
							trigger_id = i ? (i + 1) : null;
							if (get_tprofile_setting("mouseover_open_behavior") !== "popup") {
								clear_chord();
							}
						}
						var close_behavior = get_close_behavior();
						if (close_behavior === "all" || (close_behavior === "any" && trigger_complete(trigger))) {
							can_close_popup[0] = false;
						}
					});
				}
			}
			if (settings.replaceimgs_enable_keybinding && trigger_complete(settings.replaceimgs_keybinding)) {
				actions.push({ type: "replace_images" });
				ret = false;
				release_ignore = settings.replaceimgs_keybinding;
			}
			if (settings.highlightimgs_enable_keybinding && trigger_complete(settings.highlightimgs_keybinding)) {
				actions.push({ type: "highlight_images" });
				ret = false;
				release_ignore = settings.highlightimgs_keybinding;
			}
			if (settings.mouseover && ret !== false) {
				var is_popup_active = popup_el_remote || (popup_active());
				var keybinds = [
					{
						key: settings.mouseover_close_key,
						action: { type: "resetpopups" }
					},
					{
						key: settings.mouseover_gallery_prev_key,
						action: { type: "gallery_prev" },
						requires: settings.mouseover_enable_gallery
					},
					{
						key: settings.mouseover_gallery_next_key,
						action: { type: "gallery_next" },
						requires: settings.mouseover_enable_gallery
					},
					{
						key: settings.mouseover_download_key,
						clear: true,
						action: { type: "download" }
					},
					{
						key: settings.mouseover_open_new_tab_key,
						clear: true,
						action: { type: "open_in_new_tab" }
					},
					{
						key: settings.mouseover_open_bg_tab_key,
						action: { type: "open_in_new_tab", background_tab: true }
					},
					{
						key: settings.mouseover_copy_link_key,
						action: { type: "copy_link" },
						requires: settings.write_to_clipboard
					},
					{
						key: settings.mouseover_open_options_key,
						clear: true,
						action: { type: "open_options" }
					},
					{
						key: settings.mouseover_open_orig_page_key,
						clear: true,
						action: { type: "open_orig_page" }
					},
					{
						key: settings.mouseover_rotate_left_key,
						action: { type: "rotate_left" }
					},
					{
						key: settings.mouseover_rotate_right_key,
						action: { type: "rotate_right" }
					},
					{
						key: settings.mouseover_flip_horizontal_key,
						action: { type: "flip_horizontal" }
					},
					{
						key: settings.mouseover_flip_vertical_key,
						action: { type: "flip_vertical" }
					},
					{
						key: settings.mouseover_zoom_in_key,
						action: { type: "zoom_in" }
					},
					{
						key: settings.mouseover_zoom_out_key,
						action: { type: "zoom_out" }
					},
					{
						key: settings.mouseover_zoom_full_key,
						action: { type: "zoom_full" }
					},
					{
						key: settings.mouseover_zoom_fit_key,
						action: { type: "zoom_fit" }
					},
					{
						key: settings.mouseover_fullscreen_key,
						action: { type: "fullscreen" }
					},
					{
						key: settings.mouseover_video_seek_left_key,
						action: { type: "seek_left" }
					},
					{
						key: settings.mouseover_video_seek_right_key,
						action: { type: "seek_right" }
					},
					{
						key: settings.mouseover_video_frame_prev_key,
						action: { type: "frame_left" }
					},
					{
						key: settings.mouseover_video_frame_next_key,
						action: { type: "frame_right" }
					},
					{
						key: settings.mouseover_video_speed_down_key,
						action: { type: "speed_down" }
					},
					{
						key: settings.mouseover_video_speed_up_key,
						action: { type: "speed_up" }
					},
					{
						key: settings.mouseover_video_reset_speed_key,
						action: { type: "reset_speed" }
					},
					{
						key: settings.mouseover_video_volume_up_key,
						action: { type: "volume_up" }
					},
					{
						key: settings.mouseover_video_volume_down_key,
						action: { type: "volume_down" }
					},
					{
						key: settings.mouseover_video_mute_key,
						action: { type: "toggle_mute" }
					},
					{
						key: settings.mouseover_video_controls_key,
						action: { type: "toggle_controls" }
					},
					{
						key: settings.mouseover_video_playpause_key,
						action: { type: "toggle_play_pause" }
					},
					{
						key: settings.mouseover_video_screenshot_key,
						clear: true,
						action: { type: "screenshot_video" }
					},
					{
						key: settings.mouseover_ui_toggle_key,
						action: { type: "toggle_ui" }
					},
					{
						key: settings.mouseover_gallery_download_key,
						action: { type: "download_gallery" },
						clear: true
					},
					{
						key: settings.mouseover_hold_key,
						action: { type: "toggle_hold" }
					}
				];
				for (var i = 0; i < keybinds.length; i++) {
					if (keybinds[i].key && trigger_complete(keybinds[i].key)) {
						if ("requires" in keybinds[i]) {
							if (!keybinds[i].requires)
								continue;
						}
						var action = keybinds[i].action;
						action.needs_popup = true;
						actions.push(action);
						if (keybinds[i].clear)
							clear_chord();
						if (is_popup_active) {
							release_ignore = keybinds[i].key;
							ret = false;
						}
						break;
					}
				}
			}
			if (!release_ignore || !release_ignore.length) {
				release_ignore = [];
			} else {
				release_ignore = deepcopy(release_ignore);
			}
			if (actions && actions.length > 0) {
				clear_chord_wheel();
				for (var i = 0; i < actions.length; i++) {
					action_handler(actions[i]);
				}
				action_remote(actions);
			}
			if (ret === false) {
				event_cache.set(event_cache_key, ret, 5);
			}
			return do_event_return(event, ret);
		};
		var eventlistener_opts = {
			capture: true,
			passive: false
		};
		our_addEventListener(document, 'keydown', keydown_cb, eventlistener_opts);
		our_addEventListener(document, 'mousedown', keydown_cb, eventlistener_opts);
		our_addEventListener(document, 'contextmenu', keydown_cb, eventlistener_opts);
		our_addEventListener(document.body, 'contextmenu', keydown_cb, eventlistener_opts);
		our_addEventListener(document, 'wheel', keydown_cb, eventlistener_opts);
		var keyup_cb = function(event) {
			nir_debug("input", "keyup_cb", event);
			if (!mouseover_base_enabled())
				return;
			update_chord(event, false);
			if (!settings.mouseover)
				return;
			var ret = void 0;
			var current_trigger = settings.mouseover_trigger_key;
			if (trigger_id)
				current_trigger = settings["mouseover_trigger_key_t" + trigger_id];
			var condition = event_would_modify_chord(event, false, current_trigger);
			var close_behavior = get_close_behavior();
			if (condition && close_behavior === "all") {
				condition = !trigger_partially_complete(event, current_trigger);
			}
			var can_cancel = popups_active;
			if (!can_cancel) {
				if (settings.mouseover_cancel_popup_when_release ||
					(settings.mouseover_close_need_mouseout && !can_close_popup[1])) {
					can_cancel = true;
				}
			}
			if (condition && close_behavior !== "esc" && popup_trigger_reason === "keyboard" && can_cancel) {
				if (!settings.mouseover_close_need_mouseout || can_close_popup[1]) {
					stop_waiting();
					resetpopups();
				} else {
					can_close_popup[0] = true;
				}
				return;
			}
			if (event.which === 27) {
				if (delay_handle_triggering && popup_trigger_reason === "mouse" && !settings.mouseover_cancel_popup_with_esc)
					return;
				stop_waiting();
				resetpopups();
			}
			if (release_ignore.length > 0) {
				var map = get_keystrs_map(event, false);
				for (var key in map) {
					var index = array_indexof(release_ignore, key);
					if (index >= 0) {
						release_ignore.splice(index, 1);
						ret = false;
					}
				}
			}
			return do_event_return(event, ret);
		};
		our_addEventListener(document, 'keyup', keyup_cb, eventlistener_opts);
		our_addEventListener(document, 'mouseup', keyup_cb, eventlistener_opts);
		function scrollLeft() {
			var doc = document.documentElement;
			var body = document.body;
			return (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
				(doc && doc.clientLeft || body && body.clientLeft || 0);
		}
		function scrollTop() {
			var doc = document.documentElement;
			var body = document.body;
			return (doc && doc.scrollTop || body && body.scrollTop || 0) -
				(doc && doc.clientTop || body && body.clientTop || 0);
		}
		var get_move_with_cursor = function() {
			return settings.mouseover_move_with_cursor && !popup_hold; // && close_el_policy === "thumbnail";
		};
		function do_popup_pan(popup, event, mouseX, mouseY) {
			var pan_behavior = get_single_setting("mouseover_pan_behavior");
			var move_with_cursor = get_move_with_cursor();
			if (pan_behavior === "drag" && (event.buttons === 0 || !dragstart) && !move_with_cursor)
				return;
			var viewport = get_viewport();
			var edge_buffer = 40;
			var border_thresh = 20;
			var min_move_amt = parse_int(settings.mouseover_drag_min);
			var moved = false;
			var dodrag = function(lefttop) {
				var orig = parseInt(lefttop ? popup.style.top : popup.style.left);
				var mousepos = lefttop ? mouseY : mouseX;
				var dragoffset = lefttop ? dragoffsetY : dragoffsetX;
				var last = lefttop ? lastY : lastX;
				var current = mousepos - dragoffset;
				if (current !== orig) {
					if (dragged || Math_abs(current - orig) >= min_move_amt) {
						var newlast = current - (orig - last);
						if (lefttop) {
							lastY = newlast;
							popup.style.top = current + "px";
						} else {
							lastX = newlast;
							popup.style.left = current + "px";
						}
						dragged = true;
						moved = true;
					}
				}
			};
			var popup_clientrect = null;
			var popup_media_clientrect = null;
			var domovement = function(lefttop) {
				if (!popup_clientrect) {
					popup_clientrect = get_popup_client_rect();
					popup_media_clientrect = get_popup_media_client_rect();
				}
				var offsetD = lefttop ? popup_clientrect.height : popup_clientrect.width;
				var mediaOffsetD = lefttop ? popup_media_clientrect.height : popup_media_clientrect.width;
				var offset_add = (mediaOffsetD - offsetD) / 2;
				if (Math_abs(offset_add) < border_thresh) {
					mediaOffsetD = offsetD;
					offset_add = 0;
				}
				var viewportD = lefttop ? viewport[1] : viewport[0];
				var mousepos = lefttop ? mouseY : mouseX;
				if (!settings.mouseover_movement_inverted)
					mousepos = viewportD - mousepos;
				if (mediaOffsetD > viewportD) {
					var mouse_edge = Math_min(Math_max((mousepos - edge_buffer), 0), viewportD - edge_buffer * 2);
					var percent = mouse_edge / (viewportD - (edge_buffer * 2));
					var newpos = (percent * (viewportD - mediaOffsetD - border_thresh * 2) + offset_add + border_thresh) + "px";
					if (lefttop)
						popup.style.top = newpos;
					else
						popup.style.left = newpos;
					moved = true;
				}
			};
			var update_pos_cache = null;
			var domovewith = function(lefttop) {
				var orig = parseInt(lefttop ? popup.style.top : popup.style.left);
				var mousepos = lefttop ? mouseY : mouseX;
				var last = lefttop ? popupOpenLastY : popupOpenLastX;
				var current = mousepos - last + orig;
				if (settings.mouseover_move_within_page) {
					if (false) {
						var offsetD = lefttop ? popup.offsetHeight : popup.offsetWidth;
						var viewportD = lefttop ? viewport[1] : viewport[0];
						current = Math_max(current, border_thresh);
						if (current + offsetD > (viewportD - border_thresh)) {
							current = viewportD - border_thresh - offsetD;
						}
					} else if (popup_update_pos_func) {
						if (!update_pos_cache)
							update_pos_cache = popup_update_pos_func(mouseX, mouseY, false);
						current = update_pos_cache[lefttop ? 1 : 0];
					}
				}
				if (current === orig)
					return;
				var newlast = mousepos;
				if (lefttop) {
					popupOpenLastY = newlast;
					popup.style.top = current + "px";
				} else {
					popupOpenLastX = newlast;
					popup.style.left = current + "px";
				}
			};
			if (pan_behavior === "drag" && dragstart) {
				dodrag(false);
				dodrag(true);
			} else if (pan_behavior === "movement") {
				domovement(false);
				domovement(true);
			}
			if (move_with_cursor) {
				var popup_el_rect = null;
				if (true || in_clientrect(mouseX, mouseY, popup_el_rect)) {
					domovewith(false);
					domovewith(true);
				}
			}
			if (moved) {
				mouse_in_image_yet = false;
			}
		}
		var remote_handle_message = function(message, sender, respond) {
			if (_nir_debug_) {
				console_log("ON_REMOTE_MESSAGE", message, sender, respond);
			}
			if (message.type === "make_popup") {
				if (!is_in_iframe) {
					resetpopups();
					deserialize_img(message.data.data.data.img, function(el) {
						message.data.data.data.img = el;
						popup_el_remote = sender;
						popup_el = null;
						real_popup_el = null;
						makePopup(message.data.source_imu, message.data.src, message.data.processing, message.data.data);
					});
				}
			} else if (message.type === "count_gallery") {
				count_gallery(message.data.nextprev, message.data.max, message.data.is_counting, void 0, void 0, function(count) {
					respond(count);
				});
			} else if (message.type === "is_nextprev_valid") {
				is_nextprev_valid(message.data.nextprev, function(valid) {
					respond(valid);
				});
			} else if (message.type === "trigger_gallery") {
				trigger_gallery(message.data.dir, function(triggered) {
					respond(triggered);
				});
			} else if (message.type === "resetpopups") {
				resetpopups({
					from_remote: true
				});
			} else if (message.type === "mousemove") {
				mousemove_cb(message.data);
			} else if (message.type === "action") {
				for (var i = 0; i < message.data.length; i++) {
					message.data[i].remote_origin = sender;
					action_handler(message.data[i]);
				}
			} else if (message.type === "popup_open") {
				popup_el_remote = sender;
				last_popup_el = null;
			}
		};
		var handle_remote_event = function(message) {
			if (message.type === "remote") {
				var respond = nullfunc;
				if (message.response_id) {
					var response_id = message.response_id;
					respond = function(data) {
						remote_send_reply(message.from, response_id, data);
					};
				}
				if (message.from === current_frame_id || (message.to && current_frame_id !== message.to)) {
					return true;
				}
				remote_handle_message(message.data, message.from, respond);
				return true;
			} else if (message.type === "remote_reply") {
				if (message.response_id in remote_reply_ids) {
					var response_id = message.response_id;
					delete message.response_id;
					remote_reply_ids[response_id](message.data);
				}
				return true;
			}
			return false;
		};
		if (is_extension) {
			chrome.runtime.onMessage.addListener(function(message, sender, respond) {
				if (_nir_debug_) {
					console_log("chrome.runtime.onMessage", message);
				}
				if (message.type === "context_imu") {
					if (mouse_frame_id !== current_frame_id)
						return;
					popup_trigger_reason = "contextmenu";
					trigger_popup({ is_contextmenu: true });
				} else if (message.type === "popupaction") {
					if (message.data.action === "replace_images") {
						replace_images_full();
					} else if (message.data.action === "highlight_images") {
						highlight_images();
					}
				} else if (message.type === "remote" || message.type === "remote_reply") {
					handle_remote_event(message);
				} else if (message.type === "suspend") {
					set_terminated(true);
				} else if (message.type === "unsuspend") {
					set_terminated(false);
				} else {
					general_extension_message_handler(message, sender, respond);
				}
			});
		} else {
			our_addEventListener(get_window(), "message", function(event) {
				if (_nir_debug_) {
					console_log("window.onMessage", event);
				}
				if (!can_use_remote() || !event.data || typeof event.data !== "object" || !(imu_message_key in event.data))
					return;
				handle_remote_event(event.data[imu_message_key]);
			}, false);
		}
		our_addEventListener(document, 'contextmenu', update_contextmenu_pos);
		var last_remote_mousemove = 0;
		var last_remote_mousemove_timer = null;
		var last_remote_mousemove_event = null;
		var wheel_cb = function(event) {
			if (settings.scroll_override_page && popups_active && popup_wheel_cb) {
				return popup_wheel_cb(event, true);
			}
		};
		our_addEventListener(document, "wheel", wheel_cb, { passive: false });
		if (host_domain_nosub === "bilibili.com" && navigator.userAgent.indexOf("Chrome/") >= 0) {
			our_addEventListener(document, "wheel", function(e) {
				var ev = document.createEvent("MouseEvents");
				ev.initEvent("mousewheel", true, true);
				ev.wheelDelta = e.wheelDelta;
				ev.detail = e.detail;
				ev.deltaMode = e.deltaMode;
				ev.target = e.target;
				ev.srcElement = e.srcElement;
				document.dispatchEvent(ev);
			});
		}
		var update_mouse_from_event = function(event) {
			if (event.pageX === null && event.clientX !== null) {
				/*eventDoc = (event.target && event.target.ownerDocument) || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;*/
				event.pageX = event.clientX + scrollLeft();
				event.pageY = event.clientY + scrollTop();
			}
			if (can_use_remote()) {
				if (event.remote_info && event.remote_info.id !== current_frame_id) {
					var iframe = find_iframe_for_info(event.remote_info);
					if (!iframe) {
						return;
					}
					var bb = get_bounding_client_rect(iframe);
					event.clientX += bb.left;
					event.clientY += bb.top;
					event.pageX += bb.left + window.scrollX;
					event.pageY += bb.top + window.scrollY;
				} else if (is_in_iframe) {
					last_remote_mousemove_event = event;
					var mindelta = 16;
					if (!settings.mouseover_use_remote) {
						mindelta = 300; // we don't need precise movements, all we need is to inform the top frame that the mouse is here
					}
					var current_time = Date.now();
					var timeout = mindelta - (current_time - last_remote_mousemove);
					if (timeout < 1)
						timeout = 1;
					if (!last_remote_mousemove_timer) {
						last_remote_mousemove_timer = setTimeout(function() {
							if (!("remote_info" in last_remote_mousemove_event)) {
								last_remote_mousemove_event.remote_info = get_frame_info();
							}
							last_remote_mousemove_timer = null;
							last_remote_mousemove = Date.now();
							remote_send_message("top", {
								type: "mousemove",
								data: serialize_event(last_remote_mousemove_event)
							});
						}, timeout);
					}
				}
				mouse_frame_id = event.remote_info ? event.remote_info.id : current_frame_id;
			}
			mouseX = event.clientX;
			mouseY = event.clientY;
			mouseAbsX = event.pageX;
			mouseAbsY = event.pageY;
		};
		var mousemove_cb = function(event) {
			mousepos_initialized = true;
			event = event || window.event;
			update_mouse_from_event(event);
			if (waiting) {
				update_waiting();
			}
			if (popups_active) {
				do_popup_pan(popups[0], event, mouseX, mouseY);
			}
			var jitter_base = settings.mouseover_jitter_threshold;
			var do_mouse_close_kbd = popup_trigger_reason === "keyboard" && get_close_need_mouseout() && popups_active;
			var do_mouse_close_mouse = popup_trigger_reason === "mouse";
			if (do_mouse_close_kbd || do_mouse_close_mouse) {
				if (popups_active) {
					if (delay_handle) {
						clearTimeout(delay_handle);
						delay_handle = null;
						if (false && waiting)
							stop_waiting();
					}
					var jitter_threshx = 40;
					var jitter_threshy = jitter_threshx;
					var img = get_popup_media_el();
					var imgmiddleX = null;
					var imgmiddleY = null;
					var in_img_jitter = false;
					if (img) {
						var rect = get_popup_media_client_rect();
						in_img_jitter = in_clientrect(mouseX, mouseY, rect, jitter_base);
						var w = rect.width;
						var h = rect.height;
						imgmiddleX = rect.x + rect.width / 2;
						imgmiddleY = rect.y + rect.height / 2;
						jitter_threshx = Math_max(jitter_threshx, w / 2);
						jitter_threshy = Math_max(jitter_threshy, h / 2);
						jitter_threshx += jitter_base;
						jitter_threshy += jitter_base;
						/*console_log(jitter_threshx, img.naturalWidth, w);
						console_log(jitter_threshy, img.naturalHeight, h);*/
						if (mouse_in_image_yet === false) {
							if (in_clientrect(mouseX, mouseY, rect)) {
								mouse_in_image_yet = true;
							}
						}
					}
					var do_mouse_reset = function() {
						if (popup_hold) {
							can_close_popup[1] = true;
						} else {
							resetpopups();
						}
					};
					var close_el_policy = get_single_setting("mouseover_close_el_policy");
					var close_on_leave_el = (close_el_policy === "thumbnail" || close_el_policy === "both") && popup_el && !popup_el_automatic;
					var outside_of_popup_el = false;
					var popup_el_hidden = false;
					if (close_on_leave_el) {
						var popup_el_rect = get_bounding_client_rect(popup_el);
						if (popup_el_rect && popup_el_rect.width > 0 && popup_el_rect.height > 0) {
							var our_in_img_jitter = in_img_jitter;
							if (close_el_policy === "thumbnail")
								our_in_img_jitter = false; // if not "both", we don't care if the mouse is still in the popup, only if it has left the thumbnail
							if (!in_clientrect(mouseX, mouseY, popup_el_rect) && !our_in_img_jitter) {
								outside_of_popup_el = true;
								if (close_el_policy === "thumbnail") {
									return do_mouse_reset();
								}
							}
						} else {
							popup_el_hidden = true;
						}
					}
					can_close_popup[1] = false;
					if (mouse_in_image_yet && (!close_on_leave_el || outside_of_popup_el || popup_el_hidden)) {
						if (imgmiddleX && imgmiddleY &&
							(Math_abs(mouseX - imgmiddleX) > jitter_threshx ||
								Math_abs(mouseY - imgmiddleY) > jitter_threshy)) {
							do_mouse_reset();
						}
					} else if (close_on_leave_el) {
						if (outside_of_popup_el) {
							do_mouse_reset();
						}
					}
				} else if (do_mouse_close_mouse && delay_handle_triggering) {
					if (next_popup_el && settings.mouseover_cancel_popup_when_elout) {
						var popup_el_rect = get_bounding_client_rect(next_popup_el);
						if (!in_clientrect(mouseX, mouseY, popup_el_rect)) {
							resetpopups();
						}
					}
				}
			}
			if (mouseover_mouse_enabled()) {
				if ((!popups_active || popup_el_automatic) && !should_exclude_imagetab()) {
					if (delay_handle && !settings.mouseover_trigger_mouseover) {
						var trigger_mouse_jitter_thresh = 10;
						if (Math_abs(mouseX - mouseDelayX) < trigger_mouse_jitter_thresh &&
							Math_abs(mouseY - mouseDelayY) < trigger_mouse_jitter_thresh)
							return;
						clearTimeout(delay_handle);
						delay_handle = null;
					}
					mouseDelayX = mouseX;
					mouseDelayY = mouseY;
					if (last_popup_el) {
						var popup_el_rect = get_bounding_client_rect(last_popup_el);
						if (!in_clientrect(mouseX, mouseY, popup_el_rect)) {
							last_popup_el = null;
						}
					}
					if (!settings.mouseover_trigger_mouseover) {
						delay_handle = setTimeout(function() {
							if (!popup_mouse_head())
								return;
							trigger_popup();
						}, delay * 1000);
					}
				}
			}
		};
		our_addEventListener(document, 'mousemove', mousemove_cb);
		(function() {
			register_menucommand("Report issue", github_issues_page);
		})();
	}
	function do_websitehome() {
		if (require_rules_failed)
			return;
		unsafeWindow["imu_variable"] = bigimage_recursive;
		unsafeWindow["imu_inject"] = 1;
		unsafeWindow["do_imu"] = function(url, cb) {
			return bigimage_recursive(url, {
				fill_object: true,
				do_request: do_request,
				cb: cb
			});
		};
		var orig_set_max = unsafeWindow["set_max"];
		unsafeWindow["set_max"] = function(obj) {
			if (!obj || !obj[0].url) {
				orig_set_max(obj);
				return;
			}
			var loop_url = function(obj, cb, options, lasturl) {
				check_image_get(obj, function(img, newurl) {
					var finalurl = newurl;
					if (!newurl && img && img.finalUrl) {
						finalurl = img.finalUrl;
					}
					if (!finalurl) {
						cb(img, newurl);
						return;
					}
					if (obj_indexOf(obj, finalurl) < 0 &&
						lasturl !== finalurl) {
						bigimage_recursive(finalurl, {
							fill_object: true,
							do_request: do_request,
							cb: function(obj) {
								check_image_unref(img);
								loop_url(obj, cb, options, finalurl);
							}
						});
					} else {
						cb(img, newurl, obj[obj_indexOf(obj, finalurl)]);
					}
				}, options);
			};
			if (settings.website_image) {
				loop_url(obj, function(img, url, obj) {
					if (!img) {
						orig_set_max("broken");
					} else {
						var newobj = obj;
						if (!newobj)
							newobj = { url: url };
						orig_set_max([newobj]);
						unsafeWindow["maximgel"].src = img.src;
					}
				}, { running: true });
			} else if (obj.can_head) {
				loop_url(obj, function(resp) {
					if (!resp) {
						orig_set_max("broken");
					} else {
						var newobj = obj;
						if (!newobj)
							newobj = { url: resp.finalUrl };
						orig_set_max([newobj]);
					}
				}, { running: true, head: true });
			} else {
				orig_set_max(obj);
			}
		};
	}
	var set_require_rules_failed_el = function(el) {
		if (!require_rules_failed)
			return false;
		el.style.color = "#ff3333";
		el.innerText = "Error: Rules cannot be loaded.\nPlease either try reinstalling the script, or ";
		var github_link = document.createElement("a");
		github_link.href = userscript_update_url;
		github_link.target = "_blank";
		github_link.innerText = "install the github version";
		el.appendChild(github_link);
		var reason_el = document.createElement("p");
		reason_el.innerText = "Error reason:";
		reason_el.style.color = "#000";
		reason_el.style.marginTop = "1em";
		reason_el.style.marginBottom = "1em";
		try {
			var error_message = document.createElement("pre");
			error_message.style.color = "#000";
			error_message.innerText = require_rules_failed.message;
			el.appendChild(reason_el);
			el.appendChild(error_message);
		} catch (e) {
			console_error(e);
		}
		return true;
	};
	var do_userscript_page = function(imgel, latest_version) {
		var status_container_el = document_createElement("div");
		status_container_el.style.marginBottom = "2em";
		var version_el = document_createElement("span");
		version_el.style.fontSize = "90%";
		version_el.style.fontWeight = 800;
		version_el.style.marginRight = "2em";
		var options_el;
		var version = null;
		try {
			version = gm_info.script.version;
		} catch (e) {
		}
		if (!set_require_rules_failed_el(version_el)) {
			version_el.innerText = "Installed";
			if (version !== null) {
				version_el.innerText += " (v" + version;
				if (latest_version) {
					var compared = version_compare(latest_version, version);
					if (compared === -1) {
						version_el.innerText += ", update available";
					}
				}
				version_el.innerText += ")";
			}
			options_el = document_createElement("a");
			options_el.innerText = "Options";
			options_el.style.background = "#0af";
			options_el.style.padding = "0.5em 1em";
			options_el.style.color = "white";
			options_el.style.display = "inline-block";
			options_el.style.textDecoration = "none";
			options_el.target = "_blank";
			options_el.href = "https://qsniyg.github.io/maxurl/options.html";
		}
		status_container_el.appendChild(version_el);
		if (!require_rules_failed)
			status_container_el.appendChild(options_el);
		imgel.parentElement.appendChild(status_container_el);
	};
	var do_greasyfork_page = function() {
		var imgel = document.querySelector("div.script-author-description > center > img[alt='Image Max URL']");
		if (!imgel)
			imgel = document.querySelector("#additional-info > center > img[alt='Image Max URL']");
		if (!imgel)
			return;
		if (imgel.parentElement.previousElementSibling ||
			imgel.parentElement.nextElementSibling.tagName !== "UL")
			return;
		var gf_version = null;
		var gf_version_el = document.querySelector("dd.script-show-version");
		if (gf_version_el) {
			gf_version = gf_version_el.innerText.replace(/^\s*|\s*$/, "");
		}
		do_userscript_page(imgel, gf_version);
	};
	var do_oujs_page = function() {
		var imgel = document.querySelector("div#user-content > p[align='center'] img[alt='Image Max URL']");
		if (!imgel)
			return;
		if ((imgel.parentElement.previousElementSibling && imgel.parentElement.previousElementSibling.tagName !== "HR") ||
			imgel.parentElement.nextElementSibling.tagName !== "UL")
			return;
		var latest_version = null;
		var version_icon_el = document.querySelector("div.script-meta i.fa-history");
		if (version_icon_el) {
			var code_el = version_icon_el.parentElement.querySelector("code");
			if (code_el) {
				latest_version = code_el.innerText.replace(/[+].*/, "");
				if (!/^[0-9.]+$/.test(latest_version))
					latest_version = null;
			}
		}
		do_userscript_page(imgel, latest_version);
	};
	var parse_node_args = function(args_info) {
		var parsed = { _positional: [] };
		for (var i = 2; i < process.argv.length; i++) {
			var arg = process.argv[i];
			if (arg[0] !== '-') {
				parsed["_positional"].push(arg);
				continue;
			}
			if (arg === '--') {
				array_extend(parsed._positional, process.argv.slice(i + 1));
				break;
			}
			var shortarg = null;
			var longarg = null;
			var argval = null;
			if (arg[1] === '-') {
				longarg = arg.substr(2);
			} else {
				shortarg = arg.substr(1);
			}
			var our_arg = null;
			for (var _i = 0, args_info_1 = args_info; _i < args_info_1.length; _i++) {
				var arg_info = args_info_1[_i];
				if (shortarg) {
					if (arg_info.short === shortarg) {
						our_arg = arg_info;
						break;
					}
				}
				if (longarg) {
					if (arg_info.long === longarg) {
						our_arg = arg_info;
						break;
					}
				}
			}
			if (!our_arg) {
				console.error("Unable to find argument:", process.argv[i]);
				return null;
			}
			if (our_arg.needs_arg) {
				i++;
				if (i >= process.argv.length) {
					console.error("Argument", process.argv[i - 1], "needs an argument");
					return null;
				}
				argval = process.argv[i];
			} else {
				argval = true;
			}
			parsed[our_arg.name] = argval;
		}
		return parsed;
	};
	var do_node_main = function() {
		var parsed = parse_node_args({});
		if (!parsed)
			return;
		if (!parsed._positional.length) {
			console.error("Usage:", process.argv[0], process.argv[1], "url");
			return;
		}
		var url = parsed._positional[0];
		bigimage_recursive(url, {
			fill_object: true,
			cb: function(obj) {
				console.log(JSON_stringify(obj, null, '\t'));
			}
		});
	};
	function start() {
		do_export();
		if (is_interactive) {
			if (is_maxurl_website || is_options_page) {
				onload(function() {
					update_dark_mode();
				});
			}
			if (is_options_page) {
				onload(function() {
					try {
						do_options();
					} catch (e) {
						console_error(e);
						var error_pre = document_createElement("pre");
						error_pre.style.fontFamily = "monospace";
						error_pre.style.margin = "1em";
						error_pre.innerText = e.toString() + "\n" + e.stack;
						var error_div = document_createElement("div");
						var error_div_text = "Error loading options page, please report this to <a href='" + github_issues_page + "'>" + github_issues_page + "</a>, ";
						error_div_text += "and include the following information in the report:";
						error_div.innerHTML = error_div_text;
						error_div.appendChild(error_pre);
						document.body.innerHTML = error_div.outerHTML;
					}
				});
			}
			if (settings.imu_enabled) {
				if (settings.redirect) {
					do_redirect();
				}
				if (settings.website_inject_imu &&
					(window.location.href.match(/^https?:\/\/qsniyg\.github\.io\/+maxurl(\/+|\/+index\.html)?(?:[?#].*)?$/) ||
						window.location.href.match(/^file:\/\/.*\/maxurl\/site\/index\.html/))) {
					if (typeof (unsafeWindow) !== "undefined") {
						onload(function() {
							do_websitehome();
						});
					}
				}
			}
			if (is_userscript) {
				if (window.location.href.match(/^https?:\/\/(?:www\.)?greasyfork\.org\/+[^/]*\/+scripts\/+36662(?:-[^/]*)?(?:[?#].*)?$/)) {
					onload(function() {
						do_greasyfork_page();
					});
				} else if (window.location.href.match(/^https?:\/\/(?:www\.)?openuserjs\.org\/+scripts\/+qsniyg\/+Image_Max_URL(?:[?#].*)?$/)) {
					onload(function() {
						do_oujs_page();
					});
				}
			}
			do_mouseover();
			if (is_extension) {
				extension_send_message({
					type: "ready"
				});
			}
		} else if (is_extension_bg) {
			imu_userscript_message_sender = general_extension_message_handler;
		} else if (is_node_main) {
			do_node_main();
		}
	}
	if (_nir_debug_)
		console_log("Finished initial loading");
	do_config();
})();
