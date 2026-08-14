const { AndroidConfig, withAndroidColors, withAndroidStyles } = require('@expo/config-plugins');

// This project uses the managed workflow — android/ is gitignored and
// regenerated from scratch by `expo prebuild` on every EAS build, so any
// hand-edit to android/app/src/main/res/values/{colors,styles}.xml is
// silently discarded the next time a build runs. Native customizations must
// go through a config plugin like this one instead.
//
// DateField/TimeField (components/ui/) use a fully custom-drawn picker
// (react-native-ui-datepicker for dates, a custom stepper for time) instead
// of any native OS dialog — several OEM skins (confirmed on Samsung's One
// UI) replace native date/time picker dialogs with their own implementation
// that ignores the app's theme entirely, so a custom-drawn picker sidesteps
// that limitation instead of trying to theme around it. This plugin still
// sets the app's own AppTheme colorPrimary/colorAccent for the rest of the
// OS chrome that DOES read it (buttons, other native widgets).
const BRAND_BLUE = '#1073F5';

function withAndroidBrandColors(config) {
  return withAndroidColors(config, (config) => {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: 'colorPrimary',
      value: BRAND_BLUE,
    });
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: 'colorAccent',
      value: BRAND_BLUE,
    });
    return config;
  });
}

function withAndroidBrandStyles(config) {
  return withAndroidStyles(config, (config) => {
    const appTheme = AndroidConfig.Styles.getAppThemeGroup();

    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: appTheme,
      name: 'colorPrimary',
      value: '@color/colorPrimary',
    });
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: appTheme,
      name: 'colorAccent',
      value: '@color/colorAccent',
    });
    // The platform-namespaced pair — kept in case any OEM's picker (or a
    // future non-spinner dialog) does honor it; harmless where it's ignored.
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: appTheme,
      name: 'android:colorAccent',
      value: '@color/colorAccent',
    });
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: appTheme,
      name: 'android:colorControlActivated',
      value: '@color/colorAccent',
    });

    return config;
  });
}

module.exports = function withAndroidBrandTheme(config) {
  config = withAndroidBrandColors(config);
  config = withAndroidBrandStyles(config);
  return config;
};
