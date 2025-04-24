'use strict';

(function() {
  var isValidAppPage = function() {
    if (window.location.pathname.indexOf('/mobile-apps/') === 0 || document.getElementById('centerSlots')) {
      return false;
    }

    var navSubnav = document.getElementById('nav-subnav');
    if (navSubnav && navSubnav.getAttribute('data-category') === 'mobile-apps') {
      var productType = document.querySelector('#handleBuy input[name=productType]');
      if (productType && productType.value === 'MOBILE_APPLICATION') {
        var btnBuy = document.getElementById('mas-buy-button');
        var sltDeliver = document.getElementById('mas-auto-deliver-dropdown');

        if (!btnBuy || sltDeliver) {
          var priceValue = document.querySelector('#handleBuy input[name=priceValue]');
          if (priceValue && parseFloat(priceValue.value) === 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  var getASIN = function() {
    var ASIN = document.querySelector('#handleBuy input[name=ASIN]');
    return (ASIN && ASIN.value) ? ASIN.value : '';
  };

  var getAppVersion = function() {
    var version = document.querySelector('#handleBuy input[name=appVersionNo]');
    return (version && version.value) ? parseInt(version.value) : 0;
  };

  if (!isValidAppPage()) {
    return;
  }

  var ASIN = getASIN();
  if (!ASIN) {
    console.log('ASIN not found');
    return;
  }

  var createButton = function(text) {
    var html = '<span class="masrw-button-inner">' +
        '<input class="masrw-button-input" type="submit" value="buy.mas" aria-labelledby="masrw-mas-buy-button-announce">' +
        '<span id="masrw-mas-buy-button-announce" class="masrw-button-text" aria-hidden="true">' +
          text +
        '</span>' +
      '</span>';

    var btn = document.createElement('span');
    btn.className = 'masrw-button masrw-button-oneclick masrw-full-width masrw-spacing-small';
    btn.innerHTML = html;
    return btn;
  };

  var btnDownload = createButton('Download APK');
  btnDownload.addEventListener('click', function(e) {
    e.preventDefault();

    BrowserMessage.sendMessage({
      cmd: 'download',
      data: {
        asin: ASIN,
        appVersion: getAppVersion()
      }
    }, function(data) {
      if (data.error) {
        if (data.error.type === 'NotLoggedIn') {
          alert('Please log in first.');
          BrowserMessage.sendMessage({
            cmd: 'openPage',
            page: 'options'
          });
        } else {
          alert('ERROR: ' + data.error.message + ' (' + data.error.type + ')');
        }
      }
    });
  });

  var frmHandleBuy = document.getElementById('handleBuy');
  frmHandleBuy.parentNode.insertBefore(btnDownload, frmHandleBuy.nextSibling);
})();