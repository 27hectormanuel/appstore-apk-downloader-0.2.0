'use strict';

var AppstoreAPI = { // jshint ignore:line
  API_OAUTH2_SIGNIN: 'https://www.amazon.com/ap/signin',
  API_AUTH_REGISTER: 'https://api.amazon.com/auth/register',

  API_REGISTER_DEVICE: 'https://firs-ta-g7g.amazon.com/FirsProxy/registerDevice',
  API_REGISTER_ASSOCIATED_DEVICE: 'https://firs-ta-g7g.amazon.com/FirsProxy/registerAssociatedDevice',
  API_GET_DOWNLOAD_URL: 'https://mas-ext.amazon.com/getDownloadUrl',
  API_APPSTORE_ONLY_REGISTER_DEVICE: 'https://mas-ext.amazon.com/appstoreOnlyRegisterDevice',

  register: function(user, callback, onError) {
    var json = {
      'requested_extensions': ['device_info', 'customer_info'],
      'auth_data': {
        'access_token': user.access_token,
        'use_global_authentication': 'true'
      },
      'registration_data': {
        'device_model': 'defaultDeviceName',
        'device_serial': user.device.device_serial,
        'software_version': '130050001',
        'device_type': AppstoreUtils.DEVICE_TYPE_MAIN,
        'domain': 'Device',
        'app_version': '647000110',
        'app_name': 'com.amazon.venezia',
        'os_version': 'defaultOsVersion'
      },
      'requested_token_type': ['bearer', 'mac_dms']
    };

    var requestBody = JSON.stringify(json);

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status !== 200) {
        onError && onError.call(xhr);
      } else {
        var json = JSON.parse(xhr.responseText);
        callback && callback(user, json.response || null);
      }
    };

    xhr.open('POST', AppstoreAPI.API_AUTH_REGISTER, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(requestBody);
  },

  registerDevice: function(accessToken, deviceInfo, callback) {
    var xml = '<?xml version="1.0" encoding="UTF-8" ?>' +
      '<request>' +
        '<parameters>' +
          '<deviceType>' + AppstoreUtils.DEVICE_TYPE_MAIN + '</deviceType>' +
          '<deviceSerialNumber>' + deviceInfo.device_serial + '</deviceSerialNumber>' +
          '<pid>' + AppstoreUtils.getPid(deviceInfo.device_serial) + '</pid>' +
          '<authToken>' + accessToken +'</authToken>' +
          '<authTokenType>AccessToken</authTokenType>' +
          '<softwareVersion>' + AppstoreUtils.APP_VERSION + '</softwareVersion>' +
        '</parameters>' +
      '</request>';

    var getTagContent = function(xml, tag) {
      return xml.querySelector(tag).textContent;
    };

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var resXml = xhr.responseXML;

      var deviceName = getTagContent(resXml, 'user_device_name');
      var adpToken = getTagContent(resXml, 'adp_token');
      var devicePrivateKey = getTagContent(resXml, 'device_private_key');

      callback && callback({
        device_name: deviceName,
        adp_token: adpToken,
        device_private_key: devicePrivateKey
      });
    };

    xhr.open('POST', AppstoreAPI.API_REGISTER_DEVICE, true);
    xhr.setRequestHeader('Content-Type', 'text/xml');
    xhr.send(xml);
  },

  registerAssociatedDevice: function(user, callback, onError) {
    var getTagContent = function(xml, tag) {
      return xml.querySelector(tag).textContent;
    };

    var deviceInfo = user.device;

    var requestBody = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<request>' +
      '<parameters>' +
        '<deviceType>' + AppstoreUtils.DEVICE_TYPE_ASSOCIATED + '</deviceType>' +
        '<deviceSerialNumber>' + deviceInfo.device_serial +'</deviceSerialNumber>' +
        '<pid>' + AppstoreUtils.getPid(deviceInfo.device_serial) + '</pid>' +
        '<deregisterExisting>true</deregisterExisting>' +
        '<softwareVersion>' + AppstoreUtils.APP_VERSION + '</softwareVersion>' +
        '<softwareComponentId>' + AppstoreUtils.APP_NAME + '</softwareComponentId>' +
      '</parameters>' +
    '</request>';

    var ws = new AppstoreWebService();
    ws.withUrl(AppstoreAPI.API_REGISTER_ASSOCIATED_DEVICE)
      .withMethod('POST')
      .withContentType('text/xml')
      .withAdpToken(deviceInfo.main_adp_token)
      .withPrivateKey(deviceInfo.main_device_private_key)
      .withBody(requestBody)
      .useLegacyAuth(false)
      .onSuccess(function(response) {
        var resXml = this.responseXML;

        var adpToken = getTagContent(resXml, 'adp_token');
        var devicePrivateKey = getTagContent(resXml, 'device_private_key');

        callback && callback(user, {
          adp_token: adpToken,
          device_private_key: devicePrivateKey
        });
      })
      .onError(onError)
      .call();
  },

  getDownloadUrl: function(requestBody, adpToken, privateKey, callback, onError) {
    var ws = new AppstoreWebService();
    ws.withUrl(AppstoreAPI.API_GET_DOWNLOAD_URL)
      .withMethod('POST')
      .withContentType('text/plain; charset=UTF-8')
      .withAdpToken(adpToken)
      .withPrivateKey(privateKey)
      .withBody(requestBody)
      .useLegacyAuth(true)
      .onSuccess(function(response) {
        var json = JSON.parse(this.responseText);
        callback && callback(json);
      })
      .onError(onError)
      .call();
  },

  appstoreOnlyRegisterDevice: function(deviceSpecs, adpToken, privateKey, callback, onError) {
    var ws = new AppstoreWebService();
    ws.withUrl(AppstoreAPI.API_APPSTORE_ONLY_REGISTER_DEVICE)
      .withMethod('POST')
      .withContentType('application/x-www-form-urlencoded')
      .withAdpToken(adpToken)
      .withPrivateKey(privateKey)
      .withBody(deviceSpecs)
      .useLegacyAuth(true)
      .onSuccess(function(response) {
        callback && callback(this);
      })
      .onError(onError)
      .call();
  }
};