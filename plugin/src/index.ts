import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} from '@expo/config-plugins';
import {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
} from '@expo/config-plugins/build';
import fs from 'fs/promises';

const pkg = require('paytm_allinone_react-native/package.json');

const gradleMaven =
  'allprojects { repositories { maven { url "https://artifactory.paytm.in/libs-release-local" } } }';

const replaceLast = (str: string, what: string, replacement: string) => {
        var pcs = str.split(what);
        var lastPc = pcs.pop();
        return pcs.join(what) + replacement + lastPc;
    };

const withPaytmSdk: ConfigPlugin<void> = (config) => {
  const _props = {};

  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const pattern = new RegExp(`artifactory\.paytm\.in`);
      const buildGradle = config.modResults.contents;
      if (!buildGradle.match(pattern)) {
        config.modResults.contents = buildGradle + `\n${gradleMaven}\n`;
      }
    } else {
      throw new Error(
        'Cannot add maven gradle because the build.gradle is not groovy',
      );
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const pattern = new RegExp(
        `com\.squareup\.okhttp3\:okhttp\-urlconnection\:4\.2\.1`,
      );
      if (!config.modResults.contents.match(pattern)) {
        config.modResults.contents = setAppBuildscript(
          config.modResults.contents,
        );
      }
    } else {
      throw new Error(
        'Cannot add maven gradle because the build.gradle is not groovy',
      );
    }
    return config;
  });

  config = withInfoPlist(config, (config) => {
    const existingSchemes = config.modResults.LSApplicationQueriesSchemes || [];
    const existingUrlSchemes = config.modResults.CFBundleURLTypes || [];
    config.modResults.LSApplicationQueriesSchemes = [
      ...existingSchemes,
      'paytm',
    ];
    config.modResults.CFBundleURLTypes = [
      ...existingUrlSchemes,
      {
        CFBundleURLSchemes: ['paytmYONLNY36485308782125'],
      },
    ];
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(
        config.modRequest.projectRoot,
      );
      let contents = await fs.readFile(fileInfo.path, 'utf-8');
      if (fileInfo.language === 'objc') {
        if (!contents.includes('#import <React/RCTLinkingManager.h>')) {
          contents = contents.replace(
            /#import "AppDelegate.h"/g,
            `#import "AppDelegate.h"
          #import <React/RCTLinkingManager.h>;`,
          );
        }

        if (
          !contents.includes(
            '[NSDictionary dictionaryWithObject:urlString forKey:@"appInvokeNotificationKey"];',
          )
        ) {
          contents = replaceLast(contents, '@end', `- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
          options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
          {

          NSString *urlString = url.absoluteString;
          NSDictionary *userInfo =
          [NSDictionary dictionaryWithObject:urlString forKey:@"appInvokeNotificationKey"];
          [[NSNotificationCenter defaultCenter] postNotificationName:
          @"appInvokeNotification" object:nil userInfo:userInfo];
          return [RCTLinkingManager application:app openURL:url options:options];
          }
          @end`);
          /*contents = contents.replace(
            /@end/g,
            `- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
          options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
          {

          NSString *urlString = url.absoluteString;
          NSDictionary *userInfo =
          [NSDictionary dictionaryWithObject:urlString forKey:@"appInvokeNotificationKey"];
          [[NSNotificationCenter defaultCenter] postNotificationName:
          @"appInvokeNotification" object:nil userInfo:userInfo];
          return [RCTLinkingManager application:app openURL:url options:options];
          }
          @end`,
          );*/
        }
      } else {
        // TODO: Support Swift
        throw new Error(
          `Cannot add Firebase code to AppDelegate of language "${fileInfo.language}"`,
        );
      }
      await fs.writeFile(fileInfo.path, contents);
      return config;
    },
  ]);

  return config;
};

function setAppBuildscript(buildGradle: string) {
  let newBuildGradle = buildGradle;
  newBuildGradle = newBuildGradle.replace(
    /dependencies\s?{/,
    `dependencies {
            implementation "com.squareup.okhttp3:okhttp:4.2.1"
            implementation "com.squareup.okhttp3:logging-interceptor:4.2.1"
            implementation "com.squareup.okhttp3:okhttp-urlconnection:4.2.1"
        `,
  );
  return newBuildGradle;
}

export default createRunOncePlugin(withPaytmSdk, pkg.name, pkg.version);
