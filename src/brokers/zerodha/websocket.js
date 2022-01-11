/* eslint-disable no-use-before-define */
const KiteTicker = require('kiteconnect').KiteTicker;
const logger = require('../../config/logger');

logger.info('#### KiteTicker ####');
const ticker = new KiteTicker({
  api_key: '2ge4dah4e4lncpqt',
  access_token: '2ge4dah4e4lncpqt:yFHwyhnWcAP72AUxZ0AXRLf9EIzLr1Yj',
});

// set autoreconnect with 10 maximum reconnections and 5 second interval
ticker.autoReconnect(true, 10, 5);
ticker.connect();
ticker.on('ticks', onTicks);
ticker.on('connect', subscribe);

ticker.on('noreconnect', function () {
  console.log('noreconnect');
});

ticker.on('reconnecting', function (reconnect_interval, reconnections) {
  console.log('Reconnecting: attempt - ', reconnections, ' innterval - ', reconnect_interval);
});

function onTicks(ticks) {
  console.log('Ticks', ticks);
}

function subscribe() {
  const items = [17386754];
  ticker.subscribe(items);
  ticker.setMode(ticker.modeFull, items);
}
