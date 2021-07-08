import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} from '@expo/config-plugins';

const pkg = require('paytm_allinone_react-native/package.json');

const gradleMaven =
  'allprojects { repositories { maven { url "https://artifactory.paytm.in/libs-release-local" } } }';

const withPaytmSdk: ConfigPlugin<void> = (config) => {
  const _props = {};

  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const pattern = new RegExp(
        `artifactory\.paytm\.in`
      );
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
        `com\.squareup\.okhttp3\:okhttp\-urlconnection\:4\.2\.1`
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
