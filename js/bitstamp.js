'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { AuthenticationError, BadRequest, ExchangeError, NotSupported, PermissionDenied, InvalidNonce, OrderNotFound, InsufficientFunds, InvalidAddress, InvalidOrder, ArgumentsRequired, OnMaintenance, ExchangeNotAvailable } = require ('./base/errors');
const Precise = require ('./base/Precise');

//  ---------------------------------------------------------------------------

module.exports = class bitstamp extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitstamp',
            'name': 'Bitstamp',
            'countries': [ 'GB' ],
            // 8000 requests per 10 minutes = 8000 / 600 = 13.33333333 requests per second => 1000ms / 13.33333333 = 75ms between requests on average
            'rateLimit': 75,
            'version': 'v2',
            'userAgent': this.userAgents['chrome'],
            'pro': true,
            'has': {
                'CORS': true,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'addMargin': false,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'createReduceOnlyOrder': false,
                'fetchBalance': true,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchCurrencies': true,
                'fetchDepositAddress': true,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchLedger': true,
                'fetchLeverage': false,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenInterestHistory': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchPosition': false,
                'fetchPositions': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchTicker': true,
                'fetchTrades': true,
                'fetchTradingFee': true,
                'fetchTradingFees': true,
                'fetchTransactionFees': true,
                'fetchTransactions': true,
                'fetchWithdrawals': true,
                'reduceMargin': false,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'withdraw': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27786377-8c8ab57e-5fe9-11e7-8ea4-2b05b6bcceec.jpg',
                'api': {
                    'public': 'https://www.bitstamp.net/api',
                    'private': 'https://www.bitstamp.net/api',
                },
                'www': 'https://www.bitstamp.net',
                'doc': 'https://www.bitstamp.net/api',
            },
            'timeframes': {
                '1m': '60',
                '3m': '180',
                '5m': '300',
                '15m': '900',
                '30m': '1800',
                '1h': '3600',
                '2h': '7200',
                '4h': '14400',
                '6h': '21600',
                '12h': '43200',
                '1d': '86400',
                '1w': '259200',
            },
            'requiredCredentials': {
                'apiKey': true,
                'secret': true,
            },
            'api': {
                'public': {
                    'get': {
                        'ohlc/{pair}/': 1,
                        'order_book/{pair}/': 1,
                        'ticker_hour/{pair}/': 1,
                        'ticker/{pair}/': 1,
                        'transactions/{pair}/': 1,
                        'trading-pairs-info/': 1,
                    },
                },
                'private': {
                    'post': {
                        'balance/': 1,
                        'balance/{pair}/': 1,
                        'bch_withdrawal/': 1,
                        'bch_address/': 1,
                        'user_transactions/': 1,
                        'user_transactions/{pair}/': 1,
                        'open_orders/all/': 1,
                        'open_orders/{pair}/': 1,
                        'order_status/': 1,
                        'cancel_order/': 1,
                        'cancel_all_orders/': 1,
                        'cancel_all_orders/{pair}/': 1,
                        'buy/{pair}/': 1,
                        'buy/market/{pair}/': 1,
                        'buy/instant/{pair}/': 1,
                        'sell/{pair}/': 1,
                        'sell/market/{pair}/': 1,
                        'sell/instant/{pair}/': 1,
                        'btc_withdrawal/': 1,
                        'btc_address/': 1,
                        'ripple_withdrawal/': 1,
                        'ripple_address/': 1,
                        'ltc_withdrawal/': 1,
                        'ltc_address/': 1,
                        'eth_withdrawal/': 1,
                        'eth_address/': 1,
                        'xrp_withdrawal/': 1,
                        'xrp_address/': 1,
                        'xlm_withdrawal/': 1,
                        'xlm_address/': 1,
                        'pax_withdrawal/': 1,
                        'pax_address/': 1,
                        'link_withdrawal/': 1,
                        'link_address/': 1,
                        'usdc_withdrawal/': 1,
                        'usdc_address/': 1,
                        'omg_withdrawal/': 1,
                        'omg_address/': 1,
                        'dai_withdrawal/': 1,
                        'dai_address/': 1,
                        'knc_withdrawal/': 1,
                        'knc_address/': 1,
                        'mkr_withdrawal/': 1,
                        'mkr_address/': 1,
                        'zrx_withdrawal/': 1,
                        'zrx_address/': 1,
                        'gusd_withdrawal/': 1,
                        'gusd_address/': 1,
                        'aave_withdrawal/': 1,
                        'aave_address/': 1,
                        'bat_withdrawal/': 1,
                        'bat_address/': 1,
                        'uma_withdrawal/': 1,
                        'uma_address/': 1,
                        'snx_withdrawal/': 1,
                        'snx_address/': 1,
                        'uni_withdrawal/': 1,
                        'uni_address/': 1,
                        'yfi_withdrawal/': 1,
                        'yfi_address': 1,
                        'audio_withdrawal/': 1,
                        'audio_address/': 1,
                        'crv_withdrawal/': 1,
                        'crv_address/': 1,
                        'algo_withdrawal/': 1,
                        'algo_address/': 1,
                        'comp_withdrawal/': 1,
                        'comp_address/': 1,
                        'grt_withdrawal': 1,
                        'grt_address/': 1,
                        'usdt_withdrawal/': 1,
                        'usdt_address/': 1,
                        'eurt_withdrawal/': 1,
                        'eurt_address/': 1,
                        'matic_withdrawal/': 1,
                        'matic_address/': 1,
                        'sushi_withdrawal/': 1,
                        'sushi_address/': 1,
                        'chz_withdrawal/': 1,
                        'chz_address/': 1,
                        'enj_withdrawal/': 1,
                        'enj_address/': 1,
                        'alpha_withdrawal/': 1,
                        'alpha_address/': 1,
                        'ftt_withdrawal/': 1,
                        'ftt_address/': 1,
                        'storj_withdrawal/': 1,
                        'storj_address/': 1,
                        'axs_withdrawal/': 1,
                        'axs_address/': 1,
                        'sand_withdrawal/': 1,
                        'sand_address/': 1,
                        'hbar_withdrawal/': 1,
                        'hbar_address/': 1,
                        'rgt_withdrawal/': 1,
                        'rgt_address/': 1,
                        'fet_withdrawal/': 1,
                        'fet_address/': 1,
                        'skl_withdrawal/': 1,
                        'skl_address/': 1,
                        'cel_withdrawal/': 1,
                        'cel_address/': 1,
                        'sxp_withdrawal/': 1,
                        'sxp_address/': 1,
                        'ada_withdrawal/': 1,
                        'ada_address/': 1,
                        'slp_withdrawal/': 1,
                        'slp_address/': 1,
                        'ftm_withdrawal/': 1,
                        'ftm_address/': 1,
                        'perp_withdrawal/': 1,
                        'perp_address/': 1,
                        'dydx_withdrawal/': 1,
                        'dydx_address/': 1,
                        'gala_withdrawal/': 1,
                        'gala_address/': 1,
                        'shib_withdrawal/': 1,
                        'shib_address/': 1,
                        'amp_withdrawal/': 1,
                        'amp_address/': 1,
                        'sgb_withdrawal/': 1,
                        'sgb_address/': 1,
                        'avax_withdrawal/': 1,
                        'avax_address/': 1,
                        'wbtc_withdrawal/': 1,
                        'wbtc_address/': 1,
                        'ctsi_withdrawal/': 1,
                        'ctsi_address/': 1,
                        'cvx_withdrawal/': 1,
                        'cvx_address/': 1,
                        'imx_withdrawal/': 1,
                        'imx_address/': 1,
                        'nexo_withdrawal/': 1,
                        'nexo_address/': 1,
                        'ust_withdrawal/': 1,
                        'ust_address/': 1,
                        'ant_withdrawal/': 1,
                        'ant_address/': 1,
                        'gods_withdrawal/': 1,
                        'gods_address/': 1,
                        'rad_withdrawal/': 1,
                        'rad_address/': 1,
                        'band_withdrawal/': 1,
                        'band_address/': 1,
                        'inj_withdrawal/': 1,
                        'inj_address/': 1,
                        'rly_withdrawal/': 1,
                        'rly_address/': 1,
                        'rndr_withdrawal/': 1,
                        'rndr_address/': 1,
                        'vega_withdrawal/': 1,
                        'vega_address/': 1,
                        '1inch_withdrawal/': 1,
                        '1inch_address/': 1,
                        'transfer-to-main/': 1,
                        'transfer-from-main/': 1,
                        'withdrawal-requests/': 1,
                        'withdrawal/open/': 1,
                        'withdrawal/status/': 1,
                        'withdrawal/cancel/': 1,
                        'liquidation_address/new/': 1,
                        'liquidation_address/info/': 1,
                        'btc_unconfirmed/': 1,
                        'websockets_token/': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': this.parseNumber ('0.005'),
                    'maker': this.parseNumber ('0.005'),
                    'tiers': {
                        'taker': [
                            [ this.parseNumber ('0'), this.parseNumber ('0.005') ],
                            [ this.parseNumber ('20000'), this.parseNumber ('0.0025') ],
                            [ this.parseNumber ('100000'), this.parseNumber ('0.0024') ],
                            [ this.parseNumber ('200000'), this.parseNumber ('0.0022') ],
                            [ this.parseNumber ('400000'), this.parseNumber ('0.0020') ],
                            [ this.parseNumber ('600000'), this.parseNumber ('0.0015') ],
                            [ this.parseNumber ('1000000'), this.parseNumber ('0.0014') ],
                            [ this.parseNumber ('2000000'), this.parseNumber ('0.0013') ],
                            [ this.parseNumber ('4000000'), this.parseNumber ('0.0012') ],
                            [ this.parseNumber ('20000000'), this.parseNumber ('0.0011') ],
                            [ this.parseNumber ('50000000'), this.parseNumber ('0.0010') ],
                            [ this.parseNumber ('100000000'), this.parseNumber ('0.0007') ],
                            [ this.parseNumber ('500000000'), this.parseNumber ('0.0005') ],
                            [ this.parseNumber ('2000000000'), this.parseNumber ('0.0003') ],
                            [ this.parseNumber ('6000000000'), this.parseNumber ('0.0001') ],
                            [ this.parseNumber ('20000000000'), this.parseNumber ('0.00005') ],
                            [ this.parseNumber ('20000000001'), this.parseNumber ('0') ],
                        ],
                        'maker': [
                            [ this.parseNumber ('0'), this.parseNumber ('0.005') ],
                            [ this.parseNumber ('20000'), this.parseNumber ('0.0025') ],
                            [ this.parseNumber ('100000'), this.parseNumber ('0.0024') ],
                            [ this.parseNumber ('200000'), this.parseNumber ('0.0022') ],
                            [ this.parseNumber ('400000'), this.parseNumber ('0.0020') ],
                            [ this.parseNumber ('600000'), this.parseNumber ('0.0015') ],
                            [ this.parseNumber ('1000000'), this.parseNumber ('0.0014') ],
                            [ this.parseNumber ('2000000'), this.parseNumber ('0.0013') ],
                            [ this.parseNumber ('4000000'), this.parseNumber ('0.0012') ],
                            [ this.parseNumber ('20000000'), this.parseNumber ('0.0011') ],
                            [ this.parseNumber ('50000000'), this.parseNumber ('0.0010') ],
                            [ this.parseNumber ('100000000'), this.parseNumber ('0.0007') ],
                            [ this.parseNumber ('500000000'), this.parseNumber ('0.0005') ],
                            [ this.parseNumber ('2000000000'), this.parseNumber ('0.0003') ],
                            [ this.parseNumber ('6000000000'), this.parseNumber ('0.0001') ],
                            [ this.parseNumber ('20000000000'), this.parseNumber ('0.00005') ],
                            [ this.parseNumber ('20000000001'), this.parseNumber ('0') ],
                        ],
                    },
                },
                'funding': {
                    'tierBased': false,
                    'percentage': false,
                    'withdraw': {},
                    'deposit': {
                        'BTC': 0,
                        'BCH': 0,
                        'LTC': 0,
                        'ETH': 0,
                        'XRP': 0,
                        'XLM': 0,
                        'PAX': 0,
                        'USD': 7.5,
                        'EUR': 0,
                    },
                },
            },
            'exceptions': {
                'exact': {
                    'No permission found': PermissionDenied,
                    'API key not found': AuthenticationError,
                    'IP address not allowed': PermissionDenied,
                    'Invalid nonce': InvalidNonce,
                    'Invalid signature': AuthenticationError,
                    'Authentication failed': AuthenticationError,
                    'Missing key, signature and nonce parameters': AuthenticationError,
                    'Wrong API key format': AuthenticationError,
                    'Your account is frozen': PermissionDenied,
                    'Please update your profile with your FATCA information, before using API.': PermissionDenied,
                    'Order not found': OrderNotFound,
                    'Price is more than 20% below market price.': InvalidOrder,
                    "Bitstamp.net is under scheduled maintenance. We'll be back soon.": OnMaintenance, // { "error": "Bitstamp.net is under scheduled maintenance. We'll be back soon." }
                    'Order could not be placed.': ExchangeNotAvailable, // Order could not be placed (perhaps due to internal error or trade halt). Please retry placing order.
                    'Invalid offset.': BadRequest,
                },
                'broad': {
                    'Minimum order size is': InvalidOrder, // Minimum order size is 5.0 EUR.
                    'Check your account balance for details.': InsufficientFunds, // You have only 0.00100000 BTC available. Check your account balance for details.
                    'Ensure this value has at least': InvalidAddress, // Ensure this value has at least 25 characters (it has 4).
                },
            },
        });
    }

    async fetchMarkets (params = {}) {
        /**
         * @method
         * @name bitstamp#fetchMarkets
         * @description retrieves data on all markets for bitstamp
         * @param {dict} params extra parameters specific to the exchange api endpoint
         * @returns {[dict]} an array of objects representing market data
         */
        const response = await this.fetchMarketsFromCache (params);
        //
        //     [
        //         {
        //             "trading": "Enabled",
        //             "base_decimals": 8,
        //             "url_symbol": "btcusd",
        //             "name": "BTC/USD",
        //             "instant_and_market_orders": "Enabled",
        //             "minimum_order": "20.0 USD",
        //             "counter_decimals": 2,
        //             "description": "Bitcoin / U.S. dollar"
        //         }
        //     ]
        //
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const market = response[i];
            const name = this.safeString (market, 'name');
            let [ base, quote ] = name.split ('/');
            const baseId = base.toLowerCase ();
            const quoteId = quote.toLowerCase ();
            base = this.safeCurrencyCode (base);
            quote = this.safeCurrencyCode (quote);
            const minimumOrder = this.safeString (market, 'minimum_order');
            const parts = minimumOrder.split (' ');
            const status = this.safeString (market, 'trading');
            result.push ({
                'id': this.safeString (market, 'url_symbol'),
                'marketId': baseId + '_' + quoteId,
                'symbol': base + '/' + quote,
                'base': base,
                'quote': quote,
                'settle': undefined,
                'baseId': baseId,
                'quoteId': quoteId,
                'settleId': undefined,
                'type': 'spot',
                'spot': true,
                'margin': false,
                'future': false,
                'swap': false,
                'option': false,
                'active': (status === 'Enabled'),
                'contract': false,
                'linear': undefined,
                'inverse': undefined,
                'contractSize': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'precision': {
                    'amount': this.safeInteger (market, 'base_decimals'),
                    'price': this.safeInteger (market, 'counter_decimals'),
                },
                'limits': {
                    'leverage': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'amount': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'price': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'cost': {
                        'min': this.safeNumber (parts, 0),
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    constructCurrencyObject (id, code, name, precision, minCost, originalPayload) {
        let currencyType = 'crypto';
        const description = this.describe ();
        if (this.isFiat (code)) {
            currencyType = 'fiat';
        }
        return {
            'id': id,
            'code': code,
            'info': originalPayload, // the original payload
            'type': currencyType,
            'name': name,
            'active': true,
            'deposit': undefined,
            'withdraw': undefined,
            'fee': this.safeNumber (description['fees']['funding']['withdraw'], code),
            'precision': precision,
            'limits': {
                'amount': {
                    'min': Math.pow (10, -precision),
                    'max': undefined,
                },
                'price': {
                    'min': Math.pow (10, -precision),
                    'max': undefined,
                },
                'cost': {
                    'min': minCost,
                    'max': undefined,
                },
                'withdraw': {
                    'min': undefined,
                    'max': undefined,
                },
            },
        };
    }

    async fetchMarketsFromCache (params = {}) {
        // this method is now redundant
        // currencies are now fetched before markets
        const options = this.safeValue (this.options, 'fetchMarkets', {});
        const timestamp = this.safeInteger (options, 'timestamp');
        const expires = this.safeInteger (options, 'expires', 1000);
        const now = this.milliseconds ();
        if ((timestamp === undefined) || ((now - timestamp) > expires)) {
            const response = await this.publicGetTradingPairsInfo (params);
            this.options['fetchMarkets'] = this.extend (options, {
                'response': response,
                'timestamp': now,
            });
        }
        return this.safeValue (this.options['fetchMarkets'], 'response');
    }

    async fetchCurrencies (params = {}) {
        /**
         * @method
         * @name bitstamp#fetchCurrencies
         * @description fetches all available currencies on an exchange
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {dict} an associative dictionary of currencies
         */
        const response = await this.fetchMarketsFromCache (params);
        //
        //     [
        //         {
        //             "trading": "Enabled",
        //             "base_decimals": 8,
        //             "url_symbol": "btcusd",
        //             "name": "BTC/USD",
        //             "instant_and_market_orders": "Enabled",
        //             "minimum_order": "20.0 USD",
        //             "counter_decimals": 2,
        //             "description": "Bitcoin / U.S. dollar"
        //         },
        //     ]
        //
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const market = response[i];
            const name = this.safeString (market, 'name');
            let [ base, quote ] = name.split ('/');
            const baseId = base.toLowerCase ();
            const quoteId = quote.toLowerCase ();
            base = this.safeCurrencyCode (base);
            quote = this.safeCurrencyCode (quote);
            const description = this.safeString (market, 'description');
            const [ baseDescription, quoteDescription ] = description.split (' / ');
            const minimumOrder = this.safeString (market, 'minimum_order');
            const parts = minimumOrder.split (' ');
            const cost = parts[0];
            if (!(base in result)) {
                const baseDecimals = this.safeInteger (market, 'base_decimals');
                result[base] = this.constructCurrencyObject (baseId, base, baseDescription, baseDecimals, undefined, market);
            }
            if (!(quote in result)) {
                const counterDecimals = this.safeInteger (market, 'counter_decimals');
                result[quote] = this.constructCurrencyObject (quoteId, quote, quoteDescription, counterDecimals, this.parseNumber (cost), market);
            }
        }
        return result;
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        /**
         * @method
         * @name bitstamp#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {str} symbol unified symbol of the market to fetch the order book for
         * @param {int|undefined} limit the maximum amount of order book entries to return
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {dict} A dictionary of [order book structures]{@link https://docs.ccxt.com/en/latest/manual.html#order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const request = {
            'pair': this.marketId (symbol),
        };
        const response = await this.publicGetOrderBookPair (this.extend (request, params));
        //
        //     {
        //         "timestamp": "1583652948",
        //         "microtimestamp": "1583652948955826",
        //         "bids": [
        //             [ "8750.00", "1.33685271" ],
        //             [ "8749.39", "0.07700000" ],
        //             [ "8746.98", "0.07400000" ],
        //         ]
        //         "asks": [
        //             [ "8754.10", "1.51995636" ],
        //             [ "8754.71", "1.40000000" ],
        //             [ "8754.72", "2.50000000" ],
        //         ]
        //     }
        //
        const microtimestamp = this.safeInteger (response, 'microtimestamp');
        const timestamp = parseInt (microtimestamp / 1000);
        const orderbook = this.parseOrderBook (response, symbol, timestamp);
        orderbook['nonce'] = microtimestamp;
        return orderbook;
    }

    parseTicker (ticker, market = undefined) {
        //
        // {
        //     "high": "37534.15",
        //     "last": "36487.44",
        //     "timestamp":
        //     "1643370585",
        //     "bid": "36475.15",
        //     "vwap": "36595.67",
        //     "volume": "2848.49168527",
        //     "low": "35511.32",
        //     "ask": "36487.44",
        //     "open": "37179.62"
        // }
        //
        const symbol = this.safeSymbol (undefined, market);
        const timestamp = this.safeTimestamp (ticker, 'timestamp');
        const vwap = this.safeString (ticker, 'vwap');
        const baseVolume = this.safeString (ticker, 'volume');
        const quoteVolume = Precise.stringMul (baseVolume, vwap);
        const last = this.safeString (ticker, 'last');
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeString (ticker, 'high'),
            'low': this.safeString (ticker, 'low'),
            'bid': this.safeString (ticker, 'bid'),
            'bidVolume': undefined,
            'ask': this.safeString (ticker, 'ask'),
            'askVolume': undefined,
            'vwap': vwap,
            'open': this.safeString (ticker, 'open'),
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        }, market);
    }

    async fetchTicker (symbol, params = {}) {
        /**
         * @method
         * @name bitstamp#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {str} symbol unified symbol of the market to fetch the ticker for
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {dict} a [ticker structure]{@link https://docs.ccxt.com/en/latest/manual.html#ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
        };
        const ticker = await this.publicGetTickerPair (this.extend (request, params));
        //
        // {
        //     "high": "37534.15",
        //     "last": "36487.44",
        //     "timestamp":
        //     "1643370585",
        //     "bid": "36475.15",
        //     "vwap": "36595.67",
        //     "volume": "2848.49168527",
        //     "low": "35511.32",
        //     "ask": "36487.44",
        //     "open": "37179.62"
        // }
        //
        return this.parseTicker (ticker, market);
    }

    getCurrencyIdFromTransaction (transaction) {
        //
        //     {
        //         "fee": "0.00000000",
        //         "btc_usd": "0.00",
        //         "datetime": XXX,
        //         "usd": 0.0,
        //         "btc": 0.0,
        //         "eth": "0.05000000",
        //         "type": "0",
        //         "id": XXX,
        //         "eur": 0.0
        //     }
        //
        const currencyId = this.safeStringLower (transaction, 'currency');
        if (currencyId !== undefined) {
            return currencyId;
        }
        transaction = this.omit (transaction, [
            'fee',
            'price',
            'datetime',
            'type',
            'status',
            'id',
        ]);
        const ids = Object.keys (transaction);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (id.indexOf ('_') < 0) {
                const value = this.safeNumber (transaction, id);
                if ((value !== undefined) && (value !== 0)) {
                    return id;
                }
            }
        }
        return undefined;
    }

    getMarketFromTrade (trade) {
        trade = this.omit (trade, [
            'fee',
            'price',
            'datetime',
            'tid',
            'type',
            'order_id',
            'side',
        ]);
        const currencyIds = Object.keys (trade);
        const numCurrencyIds = currencyIds.length;
        if (numCurrencyIds > 2) {
            throw new ExchangeError (this.id + ' getMarketFromTrade() too many keys: ' + this.json (currencyIds) + ' in the trade: ' + this.json (trade));
        }
        if (numCurrencyIds === 2) {
            let marketId = currencyIds[0] + currencyIds[1];
            if (marketId in this.markets_by_id) {
                return this.markets_by_id[marketId];
            }
            marketId = currencyIds[1] + currencyIds[0];
            if (marketId in this.markets_by_id) {
                return this.markets_by_id[marketId];
            }
        }
        return undefined;
    }

    parseTrade (trade, market = undefined) {
        //
        // fetchTrades (public)
        //
        //      {
        //          "date": "1637845199",
        //          "tid": "209895701",
        //          "amount": "0.00500000",
        //          "type": "0",             // Transaction type: 0 - buy; 1 - sell
        //          "price": "4451.25"
        //      }
        //
        // fetchMyTrades, trades returned within fetchOrder (private)
        //
        //      {
        //          "fee": "0.11128",
        //          "eth_usdt":  4451.25,
        //          "datetime": "2021-11-25 12:59:59.322000",
        //          "usdt": "-22.26",
        //          "order_id":  1429545880227846,
        //          "usd":  0,
        //          "btc":  0,
        //          "eth": "0.00500000",
        //          "type": "2",                    // Transaction type: 0 - deposit; 1 - withdrawal; 2 - market trade; 14 - sub account transfer; 25 - credited with staked assets; 26 - sent assets to staking; 27 - staking reward; 32 - referral reward; 35 - inter account transfer.
        //          "id":  209895701,
        //          "eur":  0
        //      }
        //
        // from fetchOrder (private)
        //
        //      {
        //          "fee": "0.11128",
        //          "price": "4451.25000000",
        //          "datetime": "2021-11-25 12:59:59.322000",
        //          "usdt": "22.25625000",
        //          "tid": 209895701,
        //          "eth": "0.00500000",
        //          "type": 2                       // Transaction type: 0 - deposit; 1 - withdrawal; 2 - market trade
        //      }
        //
        const id = this.safeString2 (trade, 'id', 'tid');
        let symbol = undefined;
        let side = undefined;
        let priceString = this.safeString (trade, 'price');
        let amountString = this.safeString (trade, 'amount');
        const orderId = this.safeString (trade, 'order_id');
        const type = undefined;
        let costString = this.safeString (trade, 'cost');
        if (market === undefined) {
            const keys = Object.keys (trade);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].indexOf ('_') >= 0) {
                    const marketId = keys[i].replace ('_', '');
                    if (marketId in this.markets_by_id) {
                        market = this.markets_by_id[marketId];
                    }
                }
            }
            // if the market is still not defined
            // try to deduce it from used keys
            if (market === undefined) {
                market = this.getMarketFromTrade (trade);
            }
        }
        const feeCostString = this.safeString (trade, 'fee');
        let feeCurrency = undefined;
        if (market !== undefined) {
            priceString = this.safeString (trade, market['marketId'], priceString);
            amountString = this.safeString (trade, market['baseId'], amountString);
            costString = this.safeString (trade, market['quoteId'], costString);
            feeCurrency = market['quote'];
            symbol = market['symbol'];
        }
        let timestamp = this.safeString2 (trade, 'date', 'datetime');
        if (timestamp !== undefined) {
            if (timestamp.indexOf (' ') >= 0) {
                // iso8601
                timestamp = this.parse8601 (timestamp);
            } else {
                // string unix epoch in seconds
                timestamp = parseInt (timestamp);
                timestamp = timestamp * 1000;
            }
        }
        // if it is a private trade
        if ('id' in trade) {
            if (amountString !== undefined) {
                const isAmountNeg = Precise.stringLt (amountString, '0');
                if (isAmountNeg) {
                    side = 'sell';
                    amountString = Precise.stringNeg (amountString);
                } else {
                    side = 'buy';
                }
            }
        } else {
            side = this.safeString (trade, 'type');
            if (side === '1') {
                side = 'sell';
            } else if (side === '0') {
                side = 'buy';
            } else {
                side = undefined;
            }
        }
        if (costString !== undefined) {
            costString = Precise.stringAbs (costString);
        }
        let fee = undefined;
        if (feeCostString !== undefined) {
            fee = {
                'cost': feeCostString,
                'currency': feeCurrency,
            };
        }
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'order': orderId,
            'type': type,
            'side': side,
            'takerOrMaker': undefined,
            'price': priceString,
            'amount': amountString,
            'cost': costString,
            'fee': fee,
        }, market);
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name bitstamp#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @param {str} symbol unified symbol of the market to fetch trades for
         * @param {int|undefined} since timestamp in ms of the earliest trade to fetch
         * @param {int|undefined} limit the maximum amount of trades to fetch
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {[dict]} a list of [trade structures]{@link https://docs.ccxt.com/en/latest/manual.html?#public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
            'time': 'hour',
        };
        const response = await this.publicGetTransactionsPair (this.extend (request, params));
        //
        //     [
        //         {
        //             date: '1551814435',
        //             tid: '83581898',
        //             price: '0.03532850',
        //             type: '1',
        //             amount: '0.85945907'
        //         },
        //         {
        //             date: '1551814434',
        //             tid: '83581896',
        //             price: '0.03532851',
        //             type: '1',
        //             amount: '11.34130961'
        //         },
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseOHLCV (ohlcv, market = undefined) {
        //
        //     {
        //         "high": "9064.77",
        //         "timestamp": "1593961440",
        //         "volume": "18.49436608",
        //         "low": "9040.87",
        //         "close": "9064.77",
        //         "open": "9040.87"
        //     }
        //
        return [
            this.safeTimestamp (ohlcv, 'timestamp'),
            this.safeNumber (ohlcv, 'open'),
            this.safeNumber (ohlcv, 'high'),
            this.safeNumber (ohlcv, 'low'),
            this.safeNumber (ohlcv, 'close'),
            this.safeNumber (ohlcv, 'volume'),
        ];
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name bitstamp#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @param {str} symbol unified symbol of the market to fetch OHLCV data for
         * @param {str} timeframe the length of time each candle represents
         * @param {int|undefined} since timestamp in ms of the earliest candle to fetch
         * @param {int|undefined} limit the maximum amount of candles to fetch
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {[[int]]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
            'step': this.timeframes[timeframe],
        };
        const duration = this.parseTimeframe (timeframe);
        if (limit === undefined) {
            if (since === undefined) {
                throw new ArgumentsRequired (this.id + ' fetchOHLCV() requires a since argument or a limit argument');
            } else {
                limit = 1000;
                const start = parseInt (since / 1000);
                request['start'] = start;
                request['end'] = this.sum (start, limit * duration);
                request['limit'] = limit;
            }
        } else {
            if (since !== undefined) {
                const start = parseInt (since / 1000);
                request['start'] = start;
                request['end'] = this.sum (start, limit * duration);
            }
            request['limit'] = Math.min (limit, 1000); // min 1, max 1000
        }
        const response = await this.publicGetOhlcPair (this.extend (request, params));
        //
        //     {
        //         "data": {
        //             "pair": "BTC/USD",
        //             "ohlc": [
        //                 {"high": "9064.77", "timestamp": "1593961440", "volume": "18.49436608", "low": "9040.87", "close": "9064.77", "open": "9040.87"},
        //                 {"high": "9071.59", "timestamp": "1593961500", "volume": "3.48631711", "low": "9058.76", "close": "9061.07", "open": "9064.66"},
        //                 {"high": "9067.33", "timestamp": "1593961560", "volume": "0.04142833", "low": "9061.94", "close": "9061.94", "open": "9067.33"},
        //             ],
        //         }
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        const ohlc = this.safeValue (data, 'ohlc', []);
        return this.parseOHLCVs (ohlc, market, timeframe, since, limit);
    }

    parseBalance (response) {
        const result = {
            'info': response,
            'timestamp': undefined,
            'datetime': undefined,
        };
        const codes = Object.keys (this.currencies);
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            const currency = this.currency (code);
            const currencyId = currency['id'];
            const account = this.account ();
            account['free'] = this.safeString (response, currencyId + '_available');
            account['used'] = this.safeString (response, currencyId + '_reserved');
            account['total'] = this.safeString (response, currencyId + '_balance');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async fetchBalance (params = {}) {
        /**
         * @method
         * @name bitstamp#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {dict} a [balance structure]{@link https://docs.ccxt.com/en/latest/manual.html?#balance-structure}
         */
        await this.loadMarkets ();
        const response = await this.privatePostBalance (params);
        //
        //     {
        //         "aave_available": "0.00000000",
        //         "aave_balance": "0.00000000",
        //         "aave_reserved": "0.00000000",
        //         "aave_withdrawal_fee": "0.07000000",
        //         "aavebtc_fee": "0.000",
        //         "aaveeur_fee": "0.000",
        //         "aaveusd_fee": "0.000",
        //         "bat_available": "0.00000000",
        //         "bat_balance": "0.00000000",
        //         "bat_reserved": "0.00000000",
        //         "bat_withdrawal_fee": "5.00000000",
        //         "batbtc_fee": "0.000",
        //         "bateur_fee": "0.000",
        //         "batusd_fee": "0.000",
        //     }
        //
        return this.parseBalance (response);
    }

    async fetchTradingFee (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
        };
        const response = await this.privatePostBalancePair (this.extend (request, params));
        return this.parseTradingFee (response, market);
    }

    parseTradingFee (fee, market = undefined) {
        market = this.safeMarket (undefined, market);
        const feeString = this.safeString (fee, market['id'] + '_fee');
        const dividedFeeString = Precise.stringDiv (feeString, '100');
        const tradeFee = this.parseNumber (dividedFeeString);
        return {
            'info': fee,
            'symbol': market['symbol'],
            'maker': tradeFee,
            'taker': tradeFee,
        };
    }

    parseTradingFees (fees) {
        const result = { 'info': fees };
        const symbols = this.symbols;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            const fee = this.parseTradingFee (fees, market);
            result[symbol] = fee;
        }
        return result;
    }

    async fetchTradingFees (params = {}) {
        await this.loadMarkets ();
        const response = await this.privatePostBalance (params);
        return this.parseTradingFees (response);
    }

    parseFundingFees (balance) {
        const withdraw = {};
        const ids = Object.keys (balance);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (id.indexOf ('_withdrawal_fee') >= 0) {
                const currencyId = id.split ('_')[0];
                const code = this.safeCurrencyCode (currencyId);
                withdraw[code] = this.safeNumber (balance, id);
            }
        }
        return {
            'info': balance,
            'withdraw': withdraw,
            'deposit': {},
        };
    }

    async fetchTransactionFees (codes = undefined, params = {}) {
        await this.loadMarkets ();
        const balance = await this.privatePostBalance (params);
        return this.parseFundingFees (balance);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        let method = 'privatePost' + this.capitalize (side);
        const request = {
            'pair': market['id'],
            'amount': this.amountToPrecision (symbol, amount),
        };
        if (type === 'market') {
            method += 'Market';
        } else if (type === 'instant') {
            method += 'Instant';
        } else {
            request['price'] = this.priceToPrecision (symbol, price);
        }
        method += 'Pair';
        const clientOrderId = this.safeString2 (params, 'client_order_id', 'clientOrderId');
        if (clientOrderId !== undefined) {
            request['client_order_id'] = clientOrderId;
            params = this.omit (params, [ 'client_order_id', 'clientOrderId' ]);
        }
        const response = await this[method] (this.extend (request, params));
        const order = this.parseOrder (response, market);
        return this.extend (order, {
            'type': type,
        });
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'id': id,
        };
        return await this.privatePostCancelOrder (this.extend (request, params));
    }

    async cancelAllOrders (symbol = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request = {};
        let method = 'privatePostCancelAllOrders';
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['pair'] = market['id'];
            method = 'privatePostCancelAllOrdersPair';
        }
        return await this[method] (this.extend (request, params));
    }

    parseOrderStatus (status) {
        const statuses = {
            'In Queue': 'open',
            'Open': 'open',
            'Finished': 'closed',
            'Canceled': 'canceled',
        };
        return this.safeString (statuses, status, status);
    }

    async fetchOrderStatus (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const clientOrderId = this.safeValue2 (params, 'client_order_id', 'clientOrderId');
        const request = {};
        if (clientOrderId !== undefined) {
            request['client_order_id'] = clientOrderId;
            params = this.omit (params, [ 'client_order_id', 'clientOrderId' ]);
        } else {
            request['id'] = id;
        }
        const response = await this.privatePostOrderStatus (this.extend (request, params));
        return this.parseOrderStatus (this.safeString (response, 'status'));
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        /**
         * @method
         * @name bitstamp#fetchOrder
         * @description fetches information on an order made by the user
         * @param {str} symbol unified symbol of the market the order was made in
         * @param {dict} params extra parameters specific to the bitstamp api endpoint
         * @returns {dict} An [order structure]{@link https://docs.ccxt.com/en/latest/manual.html#order-structure}
         */
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const clientOrderId = this.safeValue2 (params, 'client_order_id', 'clientOrderId');
        const request = {};
        if (clientOrderId !== undefined) {
            request['client_order_id'] = clientOrderId;
            params = this.omit (params, [ 'client_order_id', 'clientOrderId' ]);
        } else {
            request['id'] = id;
        }
        const response = await this.privatePostOrderStatus (this.extend (request, params));
        //
        //      {
        //          "status": "Finished",
        //          "id": 1429545880227846,
        //          "amount_remaining": "0.00000000",
        //          "transactions": [
        //              {
        //                  "fee": "0.11128",
        //                  "price": "4451.25000000",
        //                  "datetime": "2021-11-25 12:59:59.322000",
        //                  "usdt": "22.25625000",
        //                  "tid": 209895701,
        //                  "eth": "0.00500000",
        //                  "type": 2
        //              }
        //         ]
        //     }
        //
        return this.parseOrder (response, market);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {};
        let method = 'privatePostUserTransactions';
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['pair'] = market['id'];
            method += 'Pair';
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this[method] (this.extend (request, params));
        const result = this.filterBy (response, 'type', '2');
        return this.parseTrades (result, market, since, limit);
    }

    async fetchTransactions (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {};
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privatePostUserTransactions (this.extend (request, params));
        //
        //     [
        //         {
        //             "fee": "0.00000000",
        //             "btc_usd": "0.00",
        //             "id": 1234567894,
        //             "usd": 0,
        //             "btc": 0,
        //             "datetime": "2018-09-08 09:00:31",
        //             "type": "1",
        //             "xrp": "-20.00000000",
        //             "eur": 0,
        //         },
        //         {
        //             "fee": "0.00000000",
        //             "btc_usd": "0.00",
        //             "id": 1134567891,
        //             "usd": 0,
        //             "btc": 0,
        //             "datetime": "2018-09-07 18:47:52",
        //             "type": "0",
        //             "xrp": "20.00000000",
        //             "eur": 0,
        //         },
        //     ]
        //
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        const transactions = this.filterByArray (response, 'type', [ '0', '1' ], false);
        return this.parseTransactions (transactions, currency, since, limit);
    }

    async fetchWithdrawals (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {};
        if (since !== undefined) {
            request['timedelta'] = this.milliseconds () - since;
        } else {
            request['timedelta'] = 50000000; // use max bitstamp approved value
        }
        const response = await this.privatePostWithdrawalRequests (this.extend (request, params));
        //
        //     [
        //         {
        //             status: 2,
        //             datetime: '2018-10-17 10:58:13',
        //             currency: 'BTC',
        //             amount: '0.29669259',
        //             address: 'aaaaa',
        //             type: 1,
        //             id: 111111,
        //             transaction_id: 'xxxx',
        //         },
        //         {
        //             status: 2,
        //             datetime: '2018-10-17 10:55:17',
        //             currency: 'ETH',
        //             amount: '1.11010664',
        //             address: 'aaaa',
        //             type: 16,
        //             id: 222222,
        //             transaction_id: 'xxxxx',
        //         },
        //     ]
        //
        return this.parseTransactions (response, undefined, since, limit);
    }

    parseTransaction (transaction, currency = undefined) {
        //
        // fetchTransactions
        //
        //     {
        //         "fee": "0.00000000",
        //         "btc_usd": "0.00",
        //         "id": 1234567894,
        //         "usd": 0,
        //         "btc": 0,
        //         "datetime": "2018-09-08 09:00:31",
        //         "type": "1",
        //         "xrp": "-20.00000000",
        //         "eur": 0,
        //     }
        //
        // fetchWithdrawals
        //
        //     {
        //         status: 2,
        //         datetime: '2018-10-17 10:58:13',
        //         currency: 'BTC',
        //         amount: '0.29669259',
        //         address: 'aaaaa',
        //         type: 1,
        //         id: 111111,
        //         transaction_id: 'xxxx',
        //     }
        //
        //     {
        //         "id": 3386432,
        //         "type": 14,
        //         "amount": "863.21332500",
        //         "status": 2,
        //         "address": "rE1sdh25BJQ3qFwngiTBwaq3zPGGYcrjp1?dt=1455",
        //         "currency": "XRP",
        //         "datetime": "2018-01-05 15:27:55",
        //         "transaction_id": "001743B03B0C79BA166A064AC0142917B050347B4CB23BA2AB4B91B3C5608F4C"
        //     }
        //
        const timestamp = this.parse8601 (this.safeString (transaction, 'datetime'));
        const id = this.safeString (transaction, 'id');
        const currencyId = this.getCurrencyIdFromTransaction (transaction);
        const code = this.safeCurrencyCode (currencyId, currency);
        const feeCost = this.safeNumber (transaction, 'fee');
        let feeCurrency = undefined;
        let amount = undefined;
        if ('amount' in transaction) {
            amount = this.safeNumber (transaction, 'amount');
        } else if (currency !== undefined) {
            amount = this.safeNumber (transaction, currency['id'], amount);
            feeCurrency = currency['code'];
        } else if ((code !== undefined) && (currencyId !== undefined)) {
            amount = this.safeNumber (transaction, currencyId, amount);
            feeCurrency = code;
        }
        if (amount !== undefined) {
            // withdrawals have a negative amount
            amount = Math.abs (amount);
        }
        let status = 'ok';
        if ('status' in transaction) {
            status = this.parseTransactionStatus (this.safeString (transaction, 'status'));
        }
        let type = undefined;
        if ('type' in transaction) {
            // from fetchTransactions
            const rawType = this.safeString (transaction, 'type');
            if (rawType === '0') {
                type = 'deposit';
            } else if (rawType === '1') {
                type = 'withdrawal';
            }
        } else {
            // from fetchWithdrawals
            type = 'withdrawal';
        }
        const txid = this.safeString (transaction, 'transaction_id');
        let tag = undefined;
        let address = this.safeString (transaction, 'address');
        if (address !== undefined) {
            // dt (destination tag) is embedded into the address field
            const addressParts = address.split ('?dt=');
            const numParts = addressParts.length;
            if (numParts > 1) {
                address = addressParts[0];
                tag = addressParts[1];
            }
        }
        const addressFrom = undefined;
        const addressTo = address;
        const tagFrom = undefined;
        const tagTo = tag;
        let fee = undefined;
        if (feeCost !== undefined) {
            fee = {
                'currency': feeCurrency,
                'cost': feeCost,
                'rate': undefined,
            };
        }
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'network': undefined,
            'addressFrom': addressFrom,
            'addressTo': addressTo,
            'address': address,
            'tagFrom': tagFrom,
            'tagTo': tagTo,
            'tag': tag,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': undefined,
            'fee': fee,
        };
    }

    parseTransactionStatus (status) {
        // withdrawals:
        // 0 (open), 1 (in process), 2 (finished), 3 (canceled) or 4 (failed).
        const statuses = {
            '0': 'pending', // Open
            '1': 'pending', // In process
            '2': 'ok', // Finished
            '3': 'canceled', // Canceled
            '4': 'failed', // Failed
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        // from fetch order:
        //   { status: 'Finished',
        //     id: 731693945,
        //     client_order_id: '',
        //     transactions:
        //     [ { fee: '0.000019',
        //         price: '0.00015803',
        //         datetime: '2018-01-07 10:45:34.132551',
        //         btc: '0.0079015000000000',
        //         tid: 42777395,
        //         type: 2,
        //         xrp: '50.00000000' } ] }
        //
        // partially filled order:
        //   { "id": 468646390,
        //     "client_order_id": "",
        //     "status": "Canceled",
        //     "transactions": [{
        //         "eth": "0.23000000",
        //         "fee": "0.09",
        //         "tid": 25810126,
        //         "usd": "69.8947000000000000",
        //         "type": 2,
        //         "price": "303.89000000",
        //         "datetime": "2017-11-11 07:22:20.710567"
        //     }]}
        //
        // from create order response:
        //     {
        //         price: '0.00008012',
        //         client_order_id: '',
        //         currency_pair: 'XRP/BTC',
        //         datetime: '2019-01-31 21:23:36',
        //         amount: '15.00000000',
        //         type: '0',
        //         id: '2814205012'
        //     }
        //
        const id = this.safeString (order, 'id');
        const clientOrderId = this.safeString (order, 'client_order_id');
        let side = this.safeString (order, 'type');
        if (side !== undefined) {
            side = (side === '1') ? 'sell' : 'buy';
        }
        // there is no timestamp from fetchOrder
        const timestamp = this.parse8601 (this.safeString (order, 'datetime'));
        const marketId = this.safeStringLower (order, 'currency_pair');
        const symbol = this.safeSymbol (marketId, market, '/');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const amount = this.safeString (order, 'amount');
        const transactions = this.safeValue (order, 'transactions', []);
        const price = this.safeString (order, 'price');
        return this.safeOrder ({
            'id': id,
            'clientOrderId': clientOrderId,
            'datetime': this.iso8601 (timestamp),
            'timestamp': timestamp,
            'lastTradeTimestamp': undefined,
            'status': status,
            'symbol': symbol,
            'type': undefined,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'cost': undefined,
            'amount': amount,
            'filled': undefined,
            'remaining': undefined,
            'trades': transactions,
            'fee': undefined,
            'info': order,
            'average': undefined,
        }, market);
    }

    parseLedgerEntryType (type) {
        const types = {
            '0': 'transaction',
            '1': 'transaction',
            '2': 'trade',
            '14': 'transfer',
        };
        return this.safeString (types, type, type);
    }

    parseLedgerEntry (item, currency = undefined) {
        //
        //     [
        //         {
        //             "fee": "0.00000000",
        //             "btc_usd": "0.00",
        //             "id": 1234567894,
        //             "usd": 0,
        //             "btc": 0,
        //             "datetime": "2018-09-08 09:00:31",
        //             "type": "1",
        //             "xrp": "-20.00000000",
        //             "eur": 0,
        //         },
        //         {
        //             "fee": "0.00000000",
        //             "btc_usd": "0.00",
        //             "id": 1134567891,
        //             "usd": 0,
        //             "btc": 0,
        //             "datetime": "2018-09-07 18:47:52",
        //             "type": "0",
        //             "xrp": "20.00000000",
        //             "eur": 0,
        //         },
        //     ]
        //
        const type = this.parseLedgerEntryType (this.safeString (item, 'type'));
        if (type === 'trade') {
            const parsedTrade = this.parseTrade (item);
            let market = undefined;
            const keys = Object.keys (item);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].indexOf ('_') >= 0) {
                    const marketId = keys[i].replace ('_', '');
                    if (marketId in this.markets_by_id) {
                        market = this.markets_by_id[marketId];
                    }
                }
            }
            // if the market is still not defined
            // try to deduce it from used keys
            if (market === undefined) {
                market = this.getMarketFromTrade (item);
            }
            const direction = (parsedTrade['side'] === 'buy') ? 'in' : 'out';
            return {
                'id': parsedTrade['id'],
                'info': item,
                'timestamp': parsedTrade['timestamp'],
                'datetime': parsedTrade['datetime'],
                'direction': direction,
                'account': undefined,
                'referenceId': parsedTrade['order'],
                'referenceAccount': undefined,
                'type': type,
                'currency': market['base'],
                'amount': parsedTrade['amount'],
                'before': undefined,
                'after': undefined,
                'status': 'ok',
                'fee': parsedTrade['fee'],
            };
        } else {
            const parsedTransaction = this.parseTransaction (item, currency);
            let direction = undefined;
            if ('amount' in item) {
                const amount = this.safeNumber (item, 'amount');
                direction = (amount > 0) ? 'in' : 'out';
            } else if (('currency' in parsedTransaction) && parsedTransaction['currency'] !== undefined) {
                const currencyCode = this.safeString (parsedTransaction, 'currency');
                currency = this.currency (currencyCode);
                const amount = this.safeNumber (item, currency['id']);
                direction = (amount > 0) ? 'in' : 'out';
            }
            return {
                'id': parsedTransaction['id'],
                'info': item,
                'timestamp': parsedTransaction['timestamp'],
                'datetime': parsedTransaction['datetime'],
                'direction': direction,
                'account': undefined,
                'referenceId': parsedTransaction['txid'],
                'referenceAccount': undefined,
                'type': type,
                'currency': parsedTransaction['currency'],
                'amount': parsedTransaction['amount'],
                'before': undefined,
                'after': undefined,
                'status': parsedTransaction['status'],
                'fee': parsedTransaction['fee'],
            };
        }
    }

    async fetchLedger (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {};
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privatePostUserTransactions (this.extend (request, params));
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        return this.parseLedger (response, currency, since, limit);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        let market = undefined;
        await this.loadMarkets ();
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const response = await this.privatePostOpenOrdersAll (params);
        //     [
        //         {
        //             price: '0.00008012',
        //             currency_pair: 'XRP/BTC',
        //             client_order_id: '',
        //             datetime: '2019-01-31 21:23:36',
        //             amount: '15.00000000',
        //             type: '0',
        //             id: '2814205012',
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit, {
            'status': 'open',
            'type': 'limit',
        });
    }

    getCurrencyName (code) {
        return code.toLowerCase ();
    }

    isFiat (code) {
        return code === 'USD' || code === 'EUR' || code === 'GBP';
    }

    async fetchDepositAddress (code, params = {}) {
        if (this.isFiat (code)) {
            throw new NotSupported (this.id + ' fiat fetchDepositAddress() for ' + code + ' is not supported!');
        }
        const name = this.getCurrencyName (code);
        const method = 'privatePost' + this.capitalize (name) + 'Address';
        const response = await this[method] (params);
        const address = this.safeString (response, 'address');
        const tag = this.safeString2 (response, 'memo_id', 'destination_tag');
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'network': undefined,
            'info': response,
        };
    }

    async withdraw (code, amount, address, tag = undefined, params = {}) {
        // For fiat withdrawals please provide all required additional parameters in the 'params'
        // Check https://www.bitstamp.net/api/ under 'Open bank withdrawal' for list and description.
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        await this.loadMarkets ();
        this.checkAddress (address);
        const request = {
            'amount': amount,
        };
        let currency = undefined;
        let method = undefined;
        if (!this.isFiat (code)) {
            const name = this.getCurrencyName (code);
            method = 'privatePost' + this.capitalize (name) + 'Withdrawal';
            if (code === 'XRP') {
                if (tag !== undefined) {
                    request['destination_tag'] = tag;
                }
            } else if (code === 'XLM' || code === 'HBAR') {
                if (tag !== undefined) {
                    request['memo_id'] = tag;
                }
            }
            request['address'] = address;
        } else {
            method = 'privatePostWithdrawalOpen';
            currency = this.currency (code);
            request['iban'] = address;
            request['account_currency'] = currency['id'];
        }
        const response = await this[method] (this.extend (request, params));
        return this.parseTransaction (response, currency);
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api] + '/';
        url += this.version + '/';
        url += this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            this.checkRequiredCredentials ();
            const xAuth = 'BITSTAMP ' + this.apiKey;
            const xAuthNonce = this.uuid ();
            const xAuthTimestamp = this.milliseconds ().toString ();
            const xAuthVersion = 'v2';
            let contentType = '';
            headers = {
                'X-Auth': xAuth,
                'X-Auth-Nonce': xAuthNonce,
                'X-Auth-Timestamp': xAuthTimestamp,
                'X-Auth-Version': xAuthVersion,
            };
            if (method === 'POST') {
                if (Object.keys (query).length) {
                    body = this.urlencode (query);
                    contentType = 'application/x-www-form-urlencoded';
                    headers['Content-Type'] = contentType;
                } else {
                    // sending an empty POST request will trigger
                    // an API0020 error returned by the exchange
                    // therefore for empty requests we send a dummy object
                    // https://github.com/ccxt/ccxt/issues/6846
                    body = this.urlencode ({ 'foo': 'bar' });
                    contentType = 'application/x-www-form-urlencoded';
                    headers['Content-Type'] = contentType;
                }
            }
            const authBody = body ? body : '';
            const auth = xAuth + method + url.replace ('https://', '') + contentType + xAuthNonce + xAuthTimestamp + xAuthVersion + authBody;
            const signature = this.hmac (this.encode (auth), this.encode (this.secret));
            headers['X-Auth-Signature'] = signature;
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (httpCode, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return;
        }
        //
        //     {"error": "No permission found"} // fetchDepositAddress returns this on apiKeys that don't have the permission required
        //     {"status": "error", "reason": {"__all__": ["Minimum order size is 5.0 EUR."]}}
        //     reuse of a nonce gives: { status: 'error', reason: 'Invalid nonce', code: 'API0004' }
        const status = this.safeString (response, 'status');
        const error = this.safeValue (response, 'error');
        if ((status === 'error') || (error !== undefined)) {
            let errors = [];
            if (typeof error === 'string') {
                errors.push (error);
            } else if (error !== undefined) {
                const keys = Object.keys (error);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const value = this.safeValue (error, key);
                    if (Array.isArray (value)) {
                        errors = this.arrayConcat (errors, value);
                    } else {
                        errors.push (value);
                    }
                }
            }
            const reason = this.safeValue (response, 'reason', {});
            if (typeof reason === 'string') {
                errors.push (reason);
            } else {
                const all = this.safeValue (reason, '__all__', []);
                for (let i = 0; i < all.length; i++) {
                    errors.push (all[i]);
                }
            }
            const code = this.safeString (response, 'code');
            if (code === 'API0005') {
                throw new AuthenticationError (this.id + ' invalid signature, use the uid for the main account if you have subaccounts');
            }
            const feedback = this.id + ' ' + body;
            for (let i = 0; i < errors.length; i++) {
                const value = errors[i];
                this.throwExactlyMatchedException (this.exceptions['exact'], value, feedback);
                this.throwBroadlyMatchedException (this.exceptions['broad'], value, feedback);
            }
            throw new ExchangeError (feedback);
        }
    }
};
