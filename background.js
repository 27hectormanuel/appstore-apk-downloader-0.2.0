'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var cmd = request.cmd;
  var messageData = request.data;

  if (cmd === 'download') {
    BrowserStorage.get('user', function(data) {
      var user = (!data || !data.user) ? {} : data.user;

      if (!AppstoreUtils.isValidUser(user)) {
        sendResponse({
          error: {
            type: 'NotLoggedIn',
            message: ''
          }
        });
        return;
      }

      var device = user.device,
        privateKey = device.associated_device_private_key,
        adpToken = device.associated_adp_token;

      var appVersion = messageData.appVersion ? messageData.appVersion : 1;

      var requestData = {
        asin: messageData.asin,
        hasExpiry: true,
        version: '' + messageData.appVersion
      };

      var requestBody = JSON.stringify(requestData);
      AppstoreAPI.getDownloadUrl(requestBody, adpToken, privateKey, function(data) {
        var apkName = 'appstore-apk-downloader/' + data.packageName + '-' + appVersion + '.apk';
        BrowserDownloads.download(data.downloadUrl, apkName);
        sendResponse({
          success: true
        });

        ZAnalytics.trackEvent(['download', 'app', data.packageName + '|' + messageData.asin]);
      }, function(errorType, errorMessage) {
        sendResponse({
          error: {
            type: errorType,
            message: errorMessage
          }
        });
      });
    });
    return true;
  } else if (cmd === 'signRequest') {
    var requestDigest = AppstoreUtils.signRequest(messageData, request.useLegacyAuth);
    sendResponse(requestDigest);
  } else if (cmd === 'oauth2Callback') {
    chrome.tabs.remove(sender.tab.id, function() {
      chrome.tabs.create({
        url: chrome.runtime.getURL('oauth2-callback.html') + '#' + messageData.query
      });
    });
  } else if (cmd === 'openPage') {
    chrome.tabs.create({
      url: chrome.runtime.getURL(request.page + '.html')
    });
  } else if (cmd === 'trackEvent') {
    ZAnalytics.trackEvent(messageData);
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  ZAnalytics.trackEvent(['install', details.reason, chrome.app.getDetails().version]);
});
function checkForUpdate() {
  var xhr = new XMLHttpRequest();
  xhr.open('get', 'http://appstore-apk-downloader.com/version.json', true);
  xhr.responseType = 'json';
  xhr.onload = function() {
    var status = xhr.status;
    if (status === 200) {
      var data = xhr.response;
      if (data.version !== chrome.app.getDetails().version) {
        chrome.tabs.create({
          url: 'http://appstore-apk-downloader.com/new-version.html',
          active: false
        });
      }
    }
  };
  xhr.send();
}

checkForUpdate();