'use strict';

(function() {
  var initInfoSection = function(user) {
    document.querySelector('section.section-info').style.display = 'block';

    document.getElementById('txt-customer-name').textContent = user.name;
    document.getElementById('txt-device-name').textContent = user.device.device_name;

    document.getElementById('btn-logout').addEventListener('click', function() {
      if (confirm('Do you want to change to another account?')) {
        BrowserStorage.remove('user', function() {
          window.location.reload();
        });
      }
    });
  };

  var initLoginSection = function() {
    document.querySelector('section.section-login').style.display = 'block';

    var btnOa2 = document.getElementById('btn-oa2');
    btnOa2.addEventListener('click', function(e) {
      AppstoreUtils.getDeviceSerial(function(deviceSerial) {
        var clientId = AppstoreUtils.getOa2ClientId(deviceSerial, AppstoreUtils.DEVICE_TYPE_MAIN);

        var paramsObj = {
          'openid.oa2.client_id': clientId,
          'openid.oa2.response_type': 'token',
          'openid.ns.pape': 'http://specs.openid.net/extensions/pape/1.0',
          'pageId': 'amzn_device_common_light',
          'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.assoc_handle': 'amzn_appshop_android_us',
          'disableLoginPrepopulate': 1,
          'accountStatusPolicy': 'P1',
          'openid.pape.max_auth_age': 0,
          'openid.ns.oa2': 'http://www.amazon.com/ap/ext/oauth/2',
          'openid.ns': 'http://specs.openid.net/auth/2.0',
          'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.mode': 'checkid_setup',
          'openid.oa2.scope': 'device_auth_access',
          'openid.return_to': 'https://www.amazon.com/gp/yourstore/home'
        };

        var params = Object.keys(paramsObj).map(function(key) {
          return key + '=' + encodeURIComponent(paramsObj[key]);
        }).join('&');

        var authUrl = AppstoreAPI.API_OAUTH2_SIGNIN + '?' + params;
        window.location.href = authUrl;
      });
    });
  };

  var init = function() {
    BrowserStorage.get('user', function(data) {
      var user = (!data || !data.user) ? {} : data.user;
      if (!AppstoreUtils.isValidUser(user)) {
        BrowserStorage.remove('user', function() {
          initLoginSection();
        });
      } else {
        initInfoSection(user);
      }
    });
  };

  init();
})();