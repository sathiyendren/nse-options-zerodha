const apiConfig = {
  user: 'BHT802',
  email: 'fake@example.com',
  requestToken: '36ZWm3eKzP1ldGuOrLNwP3JY7nZqvhCy',
  apiKey: '2ge4dah4e4lncpqt',
  apiSecret: 'qipvevuzhygu7qa8qzop3qzkzxceaauo',
  redirectUrl: 'http://localhost:8080/apis/broker/login?broker=zerodha',
  accessToken: 'qH1mxz7Kidk8RGGmzRDVE0pCXCoC2bFX',
  debug: true,
};

const holidays = [
  '2022-01-26',
  '2022-03-01',
  '2022-03-18',
  '2022-04-14',
  '2022-04-15',
  '2022-05-03',
  '2022-08-09',
  '2022-08-15',
  '2022-08-31',
  '2022-10-05',
  '2022-10-24',
  '2022-10-26',
  '2022-11-08',
];

const zerodhaURLs = {
  ZERODHA_OHLC: 'https://api.kite.trade/quote/ohlc?',
};

module.exports = {
  apiConfig,
  holidays,
  zerodhaURLs,
};
