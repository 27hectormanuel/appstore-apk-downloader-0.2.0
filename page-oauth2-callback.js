'use strict';

(function() {
  var setCurrentStep = function(step) {
    document.querySelector('.steps li:nth-child(' + step + ')').classList.add('color');
  };

  var registerDevice = function(accessToken, deviceInfo) {
    setCurrentStep(1);

    var user = {
      access_token: accessToken,
      device: {
        device_serial: deviceInfo.device_serial,
        device_model: deviceInfo.device_model,
        os_version: deviceInfo.os_version
      }
    };

    AppstoreAPI.register(user, registerCallback, function() {
      var error = 'Access token timeout. Please try to login again.\n' +
        'If you keep getting this error, restart Chrome and try again.';
      alert(error);
      window.location.href = chrome.runtime.getURL('options.html');
    });
  };

  var registerCallback = function(user, response) {
    setCurrentStep(2);
    if (!response || response.error) {
      return;
    }

    var successData = response.success;
    var tokens = successData.tokens;
    var extensions = successData.extensions;

    user.name = extensions.customer_info.name;

    user.device.main_device_private_key = tokens.mac_dms.device_private_key;
    user.device.main_adp_token = tokens.mac_dms.adp_token;
    user.device.device_name = extensions.device_info.device_name;

    AppstoreAPI.registerAssociatedDevice(user, registerAssociatedDeviceCallback);
  };

  var registerAssociatedDeviceCallback = function(user, data) {
    setCurrentStep(3);

    user.device.associated_device_private_key = data.device_private_key;
    user.device.associated_adp_token = data.adp_token;

    BrowserStorage.set({
      user: user
    }, function() {
      var device = user.device;
      Devices.get(0, function(deviceSpecs) {
        if (deviceSpecs) {
          AppstoreAPI.appstoreOnlyRegisterDevice(deviceSpecs.specs, device.associated_adp_token, device.associated_device_private_key, appstoreOnlyRegisterDeviceCallback);
        }
      });
    });
  };

  var appstoreOnlyRegisterDeviceCallback = function() {
    setCurrentStep(4);
    window.location.hash = '#';

    setTimeout(function() {
      window.location.href = chrome.runtime.getURL('options.html');
    }, 3000);
  };

  var getParamsFromQuery = function(query) {
    var match,
      pl = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); };

    var urlParams = {};
    while((match = search.exec(query)) !== null) {
      urlParams[decode(match[1])] = decode(match[2]);
    }

    return urlParams;
  };

  var hash = window.location.hash;
  if (!hash) {
    document.querySelector('.invalid').style.display = 'block';
    return;
  }

  var params = getParamsFromQuery(hash.substring(1));

  if (params['openid.oa2.access_token'] && params['openid.oa2.scope'] === 'device_auth_access' && params['openid.oa2.token_type'] === 'bearer') {
    document.querySelector('.valid').style.display = 'block';

    var accessToken = params['openid.oa2.access_token'];
    AppstoreUtils.getDeviceSerial(function(deviceSerial) {
      var deviceInfo = {
        device_serial: deviceSerial,
        device_model: AppstoreUtils.DEVICE_MODEL,
        os_version: AppstoreUtils.OS_VERSION
      };

      registerDevice(accessToken, deviceInfo);
    });
  } else {
    document.querySelector('.invalid').style.display = 'block';
  }
})();