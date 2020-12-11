/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)


const path = require('path')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('before:browser:launch', (browser, options) => {
    const downloadDirectory = path.join(__dirname, '..', 'downloads')

    if (browser.family === 'chromium' && browser.name !== 'electron') {
      options.preferences.default['download'] = { default_directory: downloadDirectory }

      return options
    }

    if (browser.family === 'firefox') {
      options.preferences['browser.download.dir'] = downloadDirectory
      options.preferences['browser.download.folderList'] = 2
      // options.preferences['browser.helperApps.alwaysAsk.force'] = false
      // options.preferences['browser.download.manager.showWhenStarting'] = false
      // options.preferences['browser.download.manager.focusWhenStarting'] = false
      // options.preferences['browser.download.manager.useWindow'] = false
      // options.preferences['browser.download.forbid_open_with'] = true

      // options.preferences['browser.helperApps.neverAsk.saveToDisk'] = 'application/octet-stream'

      return options
    }
  })
}
