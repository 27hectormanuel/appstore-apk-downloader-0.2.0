'use strict';

var BrowserRuntime = new function() { // jshint ignore:line
  var getURL = function(file) {
    return chrome.runtime.getURL(file);
  };

  this.getURL = getURL;
};

var BrowserMessage = new function() { // jshint ignore:line
  var sendMessage = function(message, callback) {
    chrome.runtime.sendMessage(message, callback);
  };

  var addMessageListener = function(fn) {
    chrome.runtime.onMessage.addListener(fn);
  };

  this.sendMessage = sendMessage;
  this.addMessageListener = addMessageListener;
};

var BrowserStorage = new function() { // jshint ignore:line
  var STORAGE = chrome.storage.local;

  var get = function(field, callback) {
    STORAGE.get(field, callback);
  };

  var set = function(data, callback) {
    STORAGE.set(data, callback);
  };

  var remove = function(data, callback) {
    STORAGE.remove(data, callback);
  };

  this.get = get;
  this.set = set;
  this.remove = remove;
};

var BrowserDownloads = new function() { // jshint ignore:line
  var download = function(url, filename) {
    chrome.downloads.download({
      url: url,
      filename: filename
    });
  };

  this.download = download;
};

var BrowserTabs = new function() { // jshint ignore:line
  var create = function(options) {
    chrome.tabs.create(options);
  };

  var sendMessage = function(tabId, message, callback) {
    chrome.tabs.sendMessage(tabId, message, callback);
  };

  this.create = create;
  this.sendMessage = sendMessage;
};