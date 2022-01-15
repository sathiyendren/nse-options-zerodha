/*
  Author: Sreenivas Doosa
*/

const _ = require('lodash');
const { KiteConnect } = require('kiteconnect');
const Instruments = require('./Instruments');
const { apiConfig } = require('../../config/zerodha');
const logger = require('../../config/logger');
// eslint-disable-next-line import/extensions

const config = apiConfig;

class Zerodha {
  constructor() {
    const apiKey = this.getAPIKey();

    if (_.isEmpty(apiKey)) {
      logger.error('Zerodha API key not configured..');
      // throw 'Zerodha API Key missing in config';
    }

    logger.info(`Zerodha API key  = ${apiKey}`);

    this.kiteConnect = new KiteConnect({
      api_key: apiKey,
      debug: _.get(config, 'debug'),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getAPIKey() {
    return _.get(config, 'apiKey');
  }

  // eslint-disable-next-line class-methods-use-this
  getAPISecret() {
    return _.get(config, 'apiSecret');
  }

  // eslint-disable-next-line class-methods-use-this
  getPin() {
    return _.get(config, 'pin');
  }

  isLoggedIn() {
    return !!this.session;
  }

  setSession(session) {
    this.session = session;
  }

  getSession() {
    return this.session;
  }

  getKiteConnect() {
    return this.kiteConnect;
  }

  setAccessToken(accessToken) {
    this.accessToken = accessToken;
  }

  getAccessToken() {
    return this.session && this.session.access_token ? this.session.access_token : this.accessToken;
  }

  login(requestToken) {
    return new Promise((resolve) => {
      if (_.isEmpty(requestToken) === false) {
        // Now get the access token after successful login
        this.kiteConnect
          .generateSession(requestToken, this.getAPISecret())
          .then((session) => {
            logger.info('Login successful...');
            this.setSession(session);
            resolve({ success: true, accessToken: this.getAccessToken() });
            // res.redirect(302, '/?broker=zerodha');
          })
          .catch((err) => {
            logger.error('generateSession failed => ', err);
            resolve({ success: false });
            // res.status(500).send({
            //   error: 'Could not generate kite session',
            //   details: err,
            // });
          });
      } else {
        logger.info(`login url => ${this.kiteConnect.getLoginURL()}`);
        resolve({ success: false });
        // res.redirect(302, this.kiteConnect.getLoginURL());
      }
    });
  }

  logout(req, res) {
    if (!this.isLoggedIn()) {
      return res.status(400).send({
        error: 'Not logged in',
      });
    }

    this.kiteConnect.invalidateAccessToken();
    this.setSession(null);

    res.status(200).send({
      message: 'Logout successful',
    });
    logger.info('Successfully logged out from the session');
  }

  loadInstruments() {
    return this.kiteConnect
      .getInstruments('NFO')
      .then((data) => {
        Instruments.setInstruments(data);
        logger.info(`Zerodha: instruments loaded. count = ${data.length}`);
        return data;
      })
      .catch((err) => {
        logger.error(`Zerodha: failed to load instruments.`, err);
        // eslint-disable-next-line no-throw-literal
        throw {
          error: 'Failed to load instruments data from Zerodha',
          details: err,
        };
      });
  }
}

module.exports = new Zerodha(); // singleton class (new Object())
