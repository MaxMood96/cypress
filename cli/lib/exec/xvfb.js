const os = require('os')
const Promise = require('bluebird')
const Xvfb = require('@cypress/xvfb')
const R = require('ramda')
const { stripIndent } = require('common-tags')
const debug = require('debug')('cypress:cli')
const debugXvfb = require('debug')('cypress:xvfb')
const { throwFormErrorText, errors } = require('../errors')

const xvfb = Promise.promisifyAll(new Xvfb({
  timeout: 5000, // milliseconds
  onStderrData (data) {
    if (debugXvfb.enabled) {
      debugXvfb(data.toString())
    }
  },
}))

module.exports = {
  _debugXvfb: debugXvfb, // expose for testing

  _xvfb: xvfb, // expose for testing

  start () {
    debug('Starting XVFB')

    return xvfb.startAsync()
    .catch({ nonZeroExitCode: true }, throwFormErrorText(errors.nonZeroExitCodeXvfb))
    .catch((err) => {
      if (err.known) {
        throw err
      }

      return throwFormErrorText(errors.missingXvfb)(err)
    })
  },

  stop () {
    debug('Stopping XVFB')

    return xvfb.stopAsync()
  },

  isNeeded () {
    if (os.platform() !== 'linux') {
      return false
    }

    if (process.env.DISPLAY) {
      const message = stripIndent`
        DISPLAY environment variable is set to ${process.env.DISPLAY} on Linux
        Assuming this DISPLAY points at working X11 server,
        Cypress will not spawn own XVFB

        NOTE: if the X11 server is NOT working, Cypress will exit without explanation,
          see https://github.com/cypress-io/cypress/issues/4034
        Solution: Unset the DISPLAY variable and try again:
          DISPLAY= npx cypress run ...
      `

      debug(message)

      return false
    }

    debug('undefined DISPLAY environment variable')
    debug('Cypress will spawn its own XVFB')

    return true
  },

  // async method, resolved with Boolean
  verify () {
    return xvfb.startAsync()
    .then(R.T)
    .catch((err) => {
      debug('Could not verify xvfb: %s', err.message)

      return false
    })
    .finally(xvfb.stopAsync)
  },
}
