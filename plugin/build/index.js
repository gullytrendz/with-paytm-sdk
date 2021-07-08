"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('paytm_allinone_react-native/package.json');
const gradleMaven = 'allprojects { repositories { maven { url "https://artifactory.paytm.in/libs-release-local" } } }';
const withPaytmSDK = (config) => {
    const _props = {};
    // Android
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.BLUETOOTH',
        'android.permission.CAMERA',
        'android.permission.INTERNET',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WAKE_LOCK',
    ]);
    config = config_plugins_1.withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            const buildGradle = config.modResults.contents;
            if (buildGradle.includes('expo-camera/android/maven')) {
                config.modResults.contents = buildGradle;
            }
            else {
                config.modResults.contents = buildGradle + `\n${gradleMaven}\n`;
            }
        }
        else {
            throw new Error('Cannot add maven gradle because the build.gradle is not groovy');
        }
        return config;
    });
    config = config_plugins_1.withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setAppBuildscript(config.modResults.contents);
        }
        else {
            throw new Error('Cannot add maven gradle because the build.gradle is not groovy');
        }
        return config;
    });
    return config;
};
function setAppBuildscript(buildGradle) {
    let newBuildGradle = buildGradle;
    newBuildGradle = newBuildGradle.replace(/dependencies\s?{/, `dependencies {
            implementation "com.squareup.okhttp3:okhttp:4.2.1"
            implementation "com.squareup.okhttp3:logging-interceptor:4.2.1"
            implementation "com.squareup.okhttp3:okhttp-urlconnection:4.2.1"
        `);
    return buildGradle;
}
exports.default = config_plugins_1.createRunOncePlugin(withPaytmSDK, pkg.name, pkg.version);
