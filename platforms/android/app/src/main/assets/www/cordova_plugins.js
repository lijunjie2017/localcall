cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-android-permissions.Permissions",
      "file": "plugins/cordova-plugin-android-permissions/www/permissions.js",
      "pluginId": "cordova-plugin-android-permissions",
      "clobbers": [
        "cordova.plugins.permissions"
      ]
    },
    {
      "id": "cordova-plugin-callkit.VoIPPushNotification",
      "file": "plugins/cordova-plugin-callkit/www/VoIPPushNotification.js",
      "pluginId": "cordova-plugin-callkit",
      "clobbers": [
        "VoIPPushNotification"
      ]
    },
    {
      "id": "cordova-plugin-callkit.CordovaCall",
      "file": "plugins/cordova-plugin-callkit/www/CordovaCall.js",
      "pluginId": "cordova-plugin-callkit",
      "clobbers": [
        "cordova.plugins.CordovaCall"
      ]
    },
    {
      "id": "cordova-plugin-device.device",
      "file": "plugins/cordova-plugin-device/www/device.js",
      "pluginId": "cordova-plugin-device",
      "clobbers": [
        "device"
      ]
    },
    {
      "id": "cordova-plugin-networkinterface.networkinterface",
      "file": "plugins/cordova-plugin-networkinterface/www/networkinterface.js",
      "pluginId": "cordova-plugin-networkinterface",
      "clobbers": [
        "window.networkinterface"
      ]
    },
    {
      "id": "cordova-plugin-webserver.webserver",
      "file": "plugins/cordova-plugin-webserver/webserver.js",
      "pluginId": "cordova-plugin-webserver",
      "clobbers": [
        "webserver"
      ]
    },
    {
      "id": "cordova-plugin-voip-local-server.VoIPLocalServer",
      "file": "plugins/cordova-plugin-voip-local-server/www/voip-local-server.js",
      "pluginId": "cordova-plugin-voip-local-server",
      "clobbers": [
        "VoIPLocalServer"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-add-swift-support": "2.0.2",
    "cordova-plugin-android-permissions": "1.1.2",
    "cordova-plugin-callkit": "1.1.0",
    "cordova-plugin-device": "2.0.3",
    "cordova-plugin-iosrtc": "6.0.20",
    "cordova-plugin-networkinterface": "2.0.0",
    "cordova-plugin-webserver": "1.1.0",
    "cordova-plugin-voip-local-server": "1.0.0"
  };
});