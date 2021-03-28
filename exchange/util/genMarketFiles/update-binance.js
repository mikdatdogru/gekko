const _ = require('lodash');
const fs = require('fs');
const request = require('request-promise');
const Promise = require('bluebird');


let getOrderMinSize = currency => {
  if (currency === 'BTC') return 0.001;
  else if (currency === 'ETH') return 0.01;
  else if (currency === 'USDT') return 10;
  else return 1;
};

const options = {
  url: 'https://api.binance.com/api/v3/exchangeInfo',
  headers: {
    Connection: 'keep-alive',
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

request(options)
  .then(body => {
    if (!body && !body.data) {
      throw new Error('Unable to fetch product list, response was empty');
    }

    let assets = _.uniqBy(_.map(body.symbols, market => market.baseAsset));
    let currencies = _.uniqBy(_.map(body.symbols, market => market.quoteAsset));

    let pairs = _.map(body.symbols, market => {
      return {
        pair: [market.quoteAsset, market.baseAsset],
        minimalOrder: {
          amount: parseFloat(market.filters.find(item=>item.filterType === "LOT_SIZE").minQty),
          price: parseFloat(market.filters.find(item=>item.filterType === "PRICE_FILTER").minPrice),
          order: getOrderMinSize(market.quoteAsset),
        },
      };
    });

    return { assets: assets, currencies: currencies, markets: pairs };
  })
  .then(markets => {
    fs.writeFileSync('../../wrappers/binance-markets.json', JSON.stringify(markets, null, 2));
    console.log(`Done writing Binance market data`);
  })
  .catch(err => {
    console.log(`Couldn't import products from Binance`);
    console.log(err);
  });
