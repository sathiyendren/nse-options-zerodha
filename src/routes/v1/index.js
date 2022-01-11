const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const expiryDateRoute = require('./expiryDate.route');
const optionScriptRoute = require('./optionScript.route');
const settingRoute = require('./setting.route');
const optionChainRoute = require('./optionChain.route');
const transactionRoute = require('./transaction.route');
const symbolRateRoute = require('./symbolRate.route');
const miscRoute = require('./misc.route');

const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/expiryDates',
    route: expiryDateRoute,
  },
  {
    path: '/optionScripts',
    route: optionScriptRoute,
  },
  {
    path: '/settings',
    route: settingRoute,
  },
  {
    path: '/optionChains',
    route: optionChainRoute,
  },
  {
    path: '/transactions',
    route: transactionRoute,
  },
  {
    path: '/symbolRates',
    route: symbolRateRoute,
  },
  {
    path: '/misc',
    route: miscRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

// For Development Purpose
devRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
