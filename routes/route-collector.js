const _ = require('koa-route');
const config = require('../config');
const routes = [];

_.routes = () => routes;

/**
 * Adds any route to the routes array so it can be exported easily
 */
module.exports = new Proxy(_, {
  get(target, prop, receiver) {
    //Intercepts the target function call
    return (...args) => {
      //If args[0] matches path format, prefix BASE_PATH
      if (/^(\/:?[\w_]+)+$/.test(args[0])) {
        args[0] = config.BASE_PATH + args[0];
      }
      let fnResult = target[prop].apply(this, args);
      //If not querying for the routes array, collect the route
      if (prop !== 'routes') {
        routes.push(fnResult);
      }
      return fnResult;
    }
  }
});
