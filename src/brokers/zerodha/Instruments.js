/*
  Author: Sreenivas Doosa
*/

const _ = require('lodash');
const moment = require('moment');
const logger = require('../../config/logger');
const { symbolTypes } = require('../../config/optionScript');

class Instruments {
  constructor() {
    this.instruments = [];
    this.currentInstruments = [];
  }

  setInstruments(data) {
    this.instruments = data;
  }

  getInstrumentToken(tradingSymbol) {
    if (_.isEmpty(tradingSymbol)) {
      return '';
    }
    const instrument = _.find(this.instruments, (i) => i.tradingsymbol === tradingSymbol);
    return instrument.instrument_token || '';
  }

  getInstrumentByStrikePrice(strikePrice) {
    logger.info('getInstrumentByStrikePrice');
    if (_.isEmpty(strikePrice)) {
      return [];
    }
    logger.info(this.currentInstruments[0]);
    return this.currentInstruments.filter((instrument) => {
      logger.info(instrument);
      return instrument.strike === strikePrice;
    });
  }

  getTradingSymbolByInstrumentToken(instrumentToken) {
    if (_.isEmpty(instrumentToken)) {
      return '';
    }
    const instrument = _.find(this.instruments, (i) => i.instrument_token === instrumentToken);
    return instrument.tradingsymbol || '';
  }

  getInstrumentsForExpiryDate(expiryDate) {
    return this.instruments.filter((instrument) => {
      const instrumentExpiryDate = moment(instrument.expiry).format('DD-MMM-YYYY');
      return _.isEqual(expiryDate, instrumentExpiryDate);
    });
  }

  setCurrentInstruments(data) {
    this.currentInstruments = data;
    const currentInstrumentsSymbol = [];
    const currentNiftyInstrumentsSymbol = [];
    const currentBankNiftyInstrumentsSymbol = [];
    this.currentInstruments.forEach((currentInstrument) => {
      currentInstrumentsSymbol.push(`${currentInstrument.exchange}:${currentInstrument.tradingsymbol}`);
      if (_.isEqual(currentInstrument.name, symbolTypes.NIFTY)) {
        currentNiftyInstrumentsSymbol.push(`${currentInstrument.exchange}:${currentInstrument.tradingsymbol}`);
      }
      if (_.isEqual(currentInstrument.name, symbolTypes.BANKNIFTY)) {
        currentBankNiftyInstrumentsSymbol.push(`${currentInstrument.exchange}:${currentInstrument.tradingsymbol}`);
      }
    });
    this.currentInstrumentsSymbol = currentInstrumentsSymbol;
    this.currentNiftyInstrumentsSymbol = currentNiftyInstrumentsSymbol;
    this.currentBankNiftyInstrumentsSymbol = currentBankNiftyInstrumentsSymbol;
  }

  getCurrentInstruments() {
    return this.currentInstruments;
  }

  getCurrentInstrumentsSymbol(name) {
    if (_.isEqual(name, symbolTypes.NIFTY)) {
      return this.currentNiftyInstrumentsSymbol;
    }
    if (_.isEqual(name, symbolTypes.BANKNIFTY)) {
      return this.currentBankNiftyInstrumentsSymbol;
    }
    return this.currentInstrumentsSymbol;
  }
}

module.exports = new Instruments(); // singleton
