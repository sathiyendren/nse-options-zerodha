const apiConfig = {
  user: 'BHT802',
  requestToken: 'BT8kuyt0p4JAMyGMvACB8oHPpxVbO0Vq&checksum=4b3c559a6e2fbd5d4cadfe72ea1fb0efd83c6e19597e377807a4fef6f2e9eafc',
  apiKey: '2ge4dah4e4lncpqt',
  apiSecret: 'qipvevuzhygu7qa8qzop3qzkzxceaauo',
  redirectUrl: 'http://localhost:8080/apis/broker/login?broker=zerodha',
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
module.exports = {
  apiConfig,
  holidays,
};
