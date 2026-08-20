const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

// This project uses the managed workflow — android/ is gitignored and
// regenerated from scratch by `expo prebuild` on every EAS build (see the
// note in withAndroidBrandTheme.js), so removing an unwanted permission has
// to happen through a config plugin, not a manifest hand-edit.
//
// expo-image-picker and expo-file-system both declare
// READ_EXTERNAL_STORAGE/WRITE_EXTERNAL_STORAGE in their own manifests as a
// legacy fallback for pre-scoped-storage Android. This app never touches
// external storage directly — receipt picking goes through the system photo
// picker intent (expo-image-picker's requestMediaLibraryPermissionsAsync)
// and the Excel export writes only to the app's own cache dir before handing
// off to the share sheet — so these broad legacy grants are unused and are
// exactly the kind of over-declared permission Play's automated policy
// scanner flags on a financial-data app. Stripped the same way RECORD_AUDIO
// already is in AndroidManifest.xml.
function withStrippedStoragePermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!Array.isArray(manifest['uses-permission'])) return config;

    const toRemove = new Set([
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ]);

    manifest['uses-permission'] = manifest['uses-permission'].filter((perm) => {
      const name = perm.$ && perm.$['android:name'];
      return !toRemove.has(name);
    });

    // tools:node="remove" ensures the merger drops these even if a library
    // manifest re-declares them after this plugin runs, rather than relying
    // on filter-then-hope ordering against every dependency's own manifest.
    for (const name of toRemove) {
      manifest['uses-permission'].push({
        $: { 'android:name': name, 'tools:node': 'remove' },
      });
    }

    return config;
  });
}

module.exports = function withAndroidPermissionCleanup(config) {
  config = withStrippedStoragePermissions(config);
  return config;
};
