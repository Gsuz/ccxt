
//  ---------------------------------------------------------------------------

import Exchange from './abstract/bitfinex.js';
import { NotSupported, RateLimitExceeded, AuthenticationError, PermissionDenied, ArgumentsRequired, ExchangeError, ExchangeNotAvailable, InsufficientFunds, InvalidOrder, OrderNotFound, InvalidNonce, BadSymbol } from './base/errors.js';
import { Precise } from './base/Precise.js';
import { SIGNIFICANT_DIGITS, DECIMAL_PLACES, TRUNCATE, ROUND } from './base/functions/number.js';
import { sha384 } from './static_dependencies/noble-hashes/sha512.js';
import { Int, OHLCV, Order, OrderSide, OrderType, Ticker, Trade, Transaction } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class bitfinex
 * @extends Exchange
 */
export default class bitfinex extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitfinex',
            'name': 'Bitfinex',
            'countries': [ 'VG' ],
            'version': 'v1',
            // cheapest is 90 requests a minute = 1.5 requests per second on average => ( 1000ms / 1.5) = 666.666 ms between requests on average
            'rateLimit': 666.666,
            'pro': true,
            // new metainfo interface
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': undefined, // has but unimplemented
                'swap': undefined, // has but unimplemented
                'future': undefined,
                'option': undefined,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createDepositAddress': true,
                'createOrder': true,
                'editOrder': true,
                'fetchBalance': true,
                'fetchClosedOrders': true,
                'fetchDepositAddress': true,
                'fetchDeposits': false,
                'fetchDepositsWithdrawals': true,
                'fetchDepositWithdrawFee': 'emulated',
                'fetchDepositWithdrawFees': true,
                'fetchIndexOHLCV': false,
                'fetchLeverageTiers': false,
                'fetchMarginMode': false,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchPositionMode': false,
                'fetchPositions': true,
                'fetchPremiumIndexOHLCV': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': false,
                'fetchTrades': true,
                'fetchTradingFee': false,
                'fetchTradingFees': true,
                'fetchTransactionFees': true,
                'fetchTransactions': 'emulated',
                'transfer': true,
                'withdraw': true,
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '3h': '3h',
                '4h': '4h',
                '6h': '6h',
                '12h': '12h',
                '1d': '1D',
                '1w': '7D',
                '2w': '14D',
                '1M': '1M',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766244-e328a50c-5ed2-11e7-947b-041416579bb3.jpg',
                'api': {
                    'v2': 'https://api-pub.bitfinex.com', // https://github.com/ccxt/ccxt/issues/5109
                    'public': 'https://api.bitfinex.com',
                    'private': 'https://api.bitfinex.com',
                },
                'www': 'https://www.bitfinex.com',
                'referral': 'https://www.bitfinex.com/?refcode=P61eYxFL',
                'doc': [
                    'https://docs.bitfinex.com/v1/docs',
                    'https://github.com/bitfinexcom/bitfinex-api-node',
                ],
            },
            'api': {
                // v2 symbol ids require a 't' prefix
                // just the public part of it (use bitfinex2 for everything else)
                'v2': {
                    'get': {
                        'platform/status': 3, // 30 requests per minute
                        'tickers': 1, // 90 requests a minute
                        'ticker/{symbol}': 1,
                        'tickers/hist': 1,
                        'trades/{symbol}/hist': 1,
                        'book/{symbol}/{precision}': 0.375, // 240 requests per minute = 4 requests per second (1000ms / rateLimit) / 4  = 0.37500375
                        'book/{symbol}/P0': 0.375,
                        'book/{symbol}/P1': 0.375,
                        'book/{symbol}/P2': 0.375,
                        'book/{symbol}/P3': 0.375,
                        'book/{symbol}/R0': 0.375,
                        'stats1/{key}:{size}:{symbol}:{side}/{section}': 1, // 90 requests a minute
                        'stats1/{key}:{size}:{symbol}/{section}': 1,
                        'stats1/{key}:{size}:{symbol}:long/last': 1,
                        'stats1/{key}:{size}:{symbol}:long/hist': 1,
                        'stats1/{key}:{size}:{symbol}:short/last': 1,
                        'stats1/{key}:{size}:{symbol}:short/hist': 1,
                        'candles/trade:{timeframe}:{symbol}/{section}': 1, // 90 requests a minute
                        'candles/trade:{timeframe}:{symbol}/last': 1,
                        'candles/trade:{timeframe}:{symbol}/hist': 1,
                    },
                },
                'public': {
                    'get': {
                        'book/{symbol}': 1, // 90 requests a minute
                        // 'candles/{symbol}':0,
                        'lendbook/{currency}': 6, // 15 requests a minute
                        'lends/{currency}': 3, // 30 requests a minute
                        'pubticker/{symbol}': 3, // 30 requests a minute = 0.5 requests per second => (1000ms / rateLimit) / 0.5 = 3.00003
                        'stats/{symbol}': 6, // 15 requests a minute = 0.25 requests per second => (1000ms / rateLimit ) /0.25 = 6.00006 (endpoint returns red html... or 'unknown symbol')
                        'symbols': 18, // 5 requests a minute = 0.08333 requests per second => (1000ms / rateLimit) / 0.08333 = 18.0009
                        'symbols_details': 18, // 5 requests a minute
                        'tickers': 1, // endpoint not mentioned in v1 docs... but still responds
                        'trades/{symbol}': 3, // 60 requests a minute = 1 request per second => (1000ms / rateLimit) / 1 = 1.5 ... but only works if set to 3
                    },
                },
                'private': {
                    'post': {
                        'account_fees': 18,
                        'account_infos': 6,
                        'balances': 9.036, // 10 requests a minute = 0.166 requests per second => (1000ms / rateLimit) / 0.166 = 9.036
                        'basket_manage': 6,
                        'credits': 6,
                        'deposit/new': 18,
                        'funding/close': 6,
                        'history': 6, // 15 requests a minute
                        'history/movements': 6,
                        'key_info': 6,
                        'margin_infos': 3, // 30 requests a minute
                        'mytrades': 3,
                        'mytrades_funding': 6,
                        'offer/cancel': 6,
                        'offer/new': 6,
                        'offer/status': 6,
                        'offers': 6,
                        'offers/hist': 90.03, // one request per minute
                        'order/cancel': 0.2,
                        'order/cancel/all': 0.2,
                        'order/cancel/multi': 0.2,
                        'order/cancel/replace': 0.2,
                        'order/new': 0.2, // 450 requests a minute = 7.5 request a second => (1000ms / rateLimit) / 7.5 = 0.2000002
                        'order/new/multi': 0.2,
                        'order/status': 0.2,
                        'orders': 0.2,
                        'orders/hist': 90.03, // one request per minute = 0.1666 => (1000ms /  rateLimit) / 0.01666 = 90.03
                        'position/claim': 18,
                        'position/close': 18,
                        'positions': 18,
                        'summary': 18,
                        'taken_funds': 6,
                        'total_taken_funds': 6,
                        'transfer': 18,
                        'unused_taken_funds': 6,
                        'withdraw': 18,
                    },
                },
            },
            'fees': {
                'trading': {
                    'feeSide': 'get',
                    'tierBased': true,
                    'percentage': true,
                    'maker': this.parseNumber ('0.001'),
                    'taker': this.parseNumber ('0.002'),
                    'tiers': {
                        'taker': [
                            [ this.parseNumber ('0'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('500000'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('1000000'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('2500000'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('5000000'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('7500000'), this.parseNumber ('0.002') ],
                            [ this.parseNumber ('10000000'), this.parseNumber ('0.0018') ],
                            [ this.parseNumber ('15000000'), this.parseNumber ('0.0016') ],
                            [ this.parseNumber ('20000000'), this.parseNumber ('0.0014') ],
                            [ this.parseNumber ('25000000'), this.parseNumber ('0.0012') ],
                            [ this.parseNumber ('30000000'), this.parseNumber ('0.001') ],
                        ],
                        'maker': [
                            [ this.parseNumber ('0'), this.parseNumber ('0.001') ],
                            [ this.parseNumber ('500000'), this.parseNumber ('0.0008') ],
                            [ this.parseNumber ('1000000'), this.parseNumber ('0.0006') ],
                            [ this.parseNumber ('2500000'), this.parseNumber ('0.0004') ],
                            [ this.parseNumber ('5000000'), this.parseNumber ('0.0002') ],
                            [ this.parseNumber ('7500000'), this.parseNumber ('0') ],
                            [ this.parseNumber ('10000000'), this.parseNumber ('0') ],
                            [ this.parseNumber ('15000000'), this.parseNumber ('0') ],
                            [ this.parseNumber ('20000000'), this.parseNumber ('0') ],
                            [ this.parseNumber ('25000000'), this.parseNumber ('0') ],
                            [ this.parseNumber ('30000000'), this.parseNumber ('0') ],
                        ],
                    },
                },
                'funding': {
                    'tierBased': false, // true for tier-based/progressive
                    'percentage': false, // fixed commission
                    // Actually deposit fees are free for larger deposits (> $1000 USD equivalent)
                    // these values below are deprecated, we should not hardcode fees and limits anymore
                    // to be reimplemented with bitfinex funding fees from their API or web endpoints
                    'deposit': {},
                    'withdraw': {},
                },
            },
            // todo rewrite for https://api-pub.bitfinex.com//v2/conf/pub:map:tx:method
            'commonCurrencies': {
                'ALG': 'ALGO', // https://github.com/ccxt/ccxt/issues/6034
                'AMP': 'AMPL',
                'ATO': 'ATOM', // https://github.com/ccxt/ccxt/issues/5118
                'BCHABC': 'XEC',
                'BCHN': 'BCH',
                'DAT': 'DATA',
                'DOG': 'MDOGE',
                'DSH': 'DASH',
                // https://github.com/ccxt/ccxt/issues/7399
                // https://coinmarketcap.com/currencies/pnetwork/
                // https://en.cryptonomist.ch/blog/eidoo/the-edo-to-pnt-upgrade-what-you-need-to-know-updated/
                'EDO': 'PNT',
                'EUS': 'EURS',
                'EUT': 'EURT',
                'IDX': 'ID',
                'IOT': 'IOTA',
                'IQX': 'IQ',
                'LUNA': 'LUNC',
                'LUNA2': 'LUNA',
                'MNA': 'MANA',
                'ORS': 'ORS Group', // conflict with Origin Sport #3230
                'PAS': 'PASS',
                'QSH': 'QASH',
                'QTM': 'QTUM',
                'RBT': 'RBTC',
                'SNG': 'SNGLS',
                'STJ': 'STORJ',
                'TERRAUST': 'USTC',
                'TSD': 'TUSD',
                'YGG': 'YEED', // conflict with Yield Guild Games
                'YYW': 'YOYOW',
                'UDC': 'USDC',
                'UST': 'USDT',
                'VSY': 'VSYS',
                'WAX': 'WAXP',
                'XCH': 'XCHF',
                'ZBT': 'ZB',
            },
            'exceptions': {
                'exact': {
                    'temporarily_unavailable': ExchangeNotAvailable, // Sorry, the service is temporarily unavailable. See https://www.bitfinex.com/ for more info.
                    'Order could not be cancelled.': OrderNotFound, // non-existent order
                    'No such order found.': OrderNotFound, // ?
                    'Order price must be positive.': InvalidOrder, // on price <= 0
                    'Could not find a key matching the given X-BFX-APIKEY.': AuthenticationError,
                    'Key price should be a decimal number, e.g. "123.456"': InvalidOrder, // on isNaN (price)
                    'Key amount should be a decimal number, e.g. "123.456"': InvalidOrder, // on isNaN (amount)
                    'ERR_RATE_LIMIT': RateLimitExceeded,
                    'Ratelimit': RateLimitExceeded,
                    'Nonce is too small.': InvalidNonce,
                    'No summary found.': ExchangeError, // fetchTradingFees (summary) endpoint can give this vague error message
                    'Cannot evaluate your available balance, please try again': ExchangeNotAvailable,
                    'Unknown symbol': BadSymbol,
                    'Cannot complete transfer. Exchange balance insufficient.': InsufficientFunds,
                    'Momentary balance check. Please wait few seconds and try the transfer again.': ExchangeError,
                },
                'broad': {
                    'Invalid X-BFX-SIGNATURE': AuthenticationError,
                    'This API key does not have permission': PermissionDenied, // authenticated but not authorized
                    'not enough exchange balance for ': InsufficientFunds, // when buying cost is greater than the available quote currency
                    'minimum size for ': InvalidOrder, // when amount below limits.amount.min
                    'Invalid order': InvalidOrder, // ?
                    'The available balance is only': InsufficientFunds, // {"status":"error","message":"Cannot withdraw 1.0027 ETH from your exchange wallet. The available balance is only 0.0 ETH. If you have limit orders, open positions, unused or active margin funding, this will decrease your available balance. To increase it, you can cancel limit orders or reduce/close your positions.","withdrawal_id":0,"fees":"0.0027"}
                },
            },
            'precisionMode': SIGNIFICANT_DIGITS,
            'options': {
                'currencyNames': {
                    'AGI': 'agi',
                    'AID': 'aid',
                    'AIO': 'aio',
                    'ANT': 'ant',
                    'AVT': 'aventus', // #1811
                    'BAT': 'bat',
                    // https://github.com/ccxt/ccxt/issues/5833
                    'BCH': 'bab', // undocumented
                    // 'BCH': 'bcash', // undocumented
                    'BCI': 'bci',
                    'BFT': 'bft',
                    'BSV': 'bsv',
                    'BTC': 'bitcoin',
                    'BTG': 'bgold',
                    'CFI': 'cfi',
                    'COMP': 'comp',
                    'DAI': 'dai',
                    'DADI': 'dad',
                    'DASH': 'dash',
                    'DATA': 'datacoin',
                    'DTH': 'dth',
                    'EDO': 'eidoo', // #1811
                    'ELF': 'elf',
                    'EOS': 'eos',
                    'ETC': 'ethereumc',
                    'ETH': 'ethereum',
                    'ETP': 'metaverse',
                    'FUN': 'fun',
                    'GNT': 'golem',
                    'IOST': 'ios',
                    'IOTA': 'iota',
                    // https://github.com/ccxt/ccxt/issues/5833
                    'LEO': 'let', // ETH chain
                    // 'LEO': 'les', // EOS chain
                    'LINK': 'link',
                    'LRC': 'lrc',
                    'LTC': 'litecoin',
                    'LYM': 'lym',
                    'MANA': 'mna',
                    'MIT': 'mit',
                    'MKR': 'mkr',
                    'MTN': 'mtn',
                    'NEO': 'neo',
                    'ODE': 'ode',
                    'OMG': 'omisego',
                    'OMNI': 'mastercoin',
                    'QASH': 'qash',
                    'QTUM': 'qtum', // #1811
                    'RCN': 'rcn',
                    'RDN': 'rdn',
                    'REP': 'rep',
                    'REQ': 'req',
                    'RLC': 'rlc',
                    'SAN': 'santiment',
                    'SNGLS': 'sng',
                    'SNT': 'status',
                    'SPANK': 'spk',
                    'STORJ': 'stj',
                    'TNB': 'tnb',
                    'TRX': 'trx',
                    'TUSD': 'tsd',
                    'USD': 'wire',
                    'USDC': 'udc', // https://github.com/ccxt/ccxt/issues/5833
                    'UTK': 'utk',
                    'USDT': 'tetheruso', // Tether on Omni
                    // 'USDT': 'tetheruse', // Tether on ERC20
                    // 'USDT': 'tetherusl', // Tether on Liquid
                    // 'USDT': 'tetherusx', // Tether on Tron
                    // 'USDT': 'tetheruss', // Tether on EOS
                    'VEE': 'vee',
                    'WAX': 'wax',
                    'XLM': 'xlm',
                    'XMR': 'monero',
                    'XRP': 'ripple',
                    'XVG': 'xvg',
                    'YOYOW': 'yoyow',
                    'ZEC': 'zcash',
                    'ZRX': 'zrx',
                    'XTZ': 'xtz',
                },
                'orderTypes': {
                    'limit': 'exchange limit',
                    'market': 'exchange market',
                },
                'fiat': {
                    'USD': 'USD',
                    'EUR': 'EUR',
                    'JPY': 'JPY',
                    'GBP': 'GBP',
                    'CNH': 'CNH',
                },
                'accountsByType': {
                    'spot': 'exchange',
                    'margin': 'trading',
                    'funding': 'deposit',
                    'swap': 'trading',
                },
            },
        });
    }

    async fetchTransactionFees (codes = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchTransactionFees
         * @deprecated
         * @description please use fetchDepositWithdrawFees instead
         * @see https://docs.bitfinex.com/v1/reference/rest-auth-fees
         * @param {string[]|undefined} codes list of unified currency codes
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object[]} a list of [fees structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#fee-structure}
         */
        await this.loadMarkets ();
        const result = {};
        const response = await this.privatePostAccountFees (params);
        //
        // {
        //     'withdraw': {
        //         'BTC': '0.0004',
        //     }
        // }
        //
        const fees = this.safeValue (response, 'withdraw');
        const ids = Object.keys (fees);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const code = this.safeCurrencyCode (id);
            if ((codes !== undefined) && !this.inArray (code, codes)) {
                continue;
            }
            result[code] = {
                'withdraw': this.safeNumber (fees, id),
                'deposit': {},
                'info': this.safeNumber (fees, id),
            };
        }
        return result;
    }

    async fetchDepositWithdrawFees (codes: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchDepositWithdrawFees
         * @description fetch deposit and withdraw fees
         * @see https://docs.bitfinex.com/v1/reference/rest-auth-fees
         * @param {string[]|undefined} codes list of unified currency codes
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object[]} a list of [fees structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#fee-structure}
         */
        await this.loadMarkets ();
        const response = await this.privatePostAccountFees (params);
        //
        //    {
        //        'withdraw': {
        //            'BTC': '0.0004',
        //            ...
        //        }
        //    }
        //
        const withdraw = this.safeValue (response, 'withdraw');
        return this.parseDepositWithdrawFees (withdraw, codes);
    }

    parseDepositWithdrawFee (fee, currency = undefined) {
        //
        //    '0.0004'
        //
        return {
            'withdraw': {
                'fee': this.parseNumber (fee),
                'percentage': undefined,
            },
            'deposit': {
                'fee': undefined,
                'percentage': undefined,
            },
            'networks': {},
            'info': fee,
        };
    }

    async fetchTradingFees (params = {}) {
        /**
         * @method
         * @name bitfinex#fetchTradingFees
         * @description fetch the trading fees for multiple markets
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a dictionary of [fee structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#fee-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const response = await this.privatePostSummary (params);
        //
        //     {
        //          time: '2022-02-23T16:05:47.659000Z',
        //          status: { resid_hint: null, login_last: '2022-02-23T16:05:48Z' },
        //          is_locked: false,
        //          leo_lev: '0',
        //          leo_amount_avg: '0.0',
        //          trade_vol_30d: [
        //          {
        //              curr: 'Total (USD)',
        //              vol: '0.0',
        //              vol_safe: '0.0',
        //              vol_maker: '0.0',
        //              vol_BFX: '0.0',
        //              vol_BFX_safe: '0.0',
        //              vol_BFX_maker: '0.0'
        //          }
        //          ],
        //          fees_funding_30d: {},
        //          fees_funding_total_30d: '0',
        //          fees_trading_30d: {},
        //          fees_trading_total_30d: '0',
        //          rebates_trading_30d: {},
        //          rebates_trading_total_30d: '0',
        //          maker_fee: '0.001',
        //          taker_fee: '0.002',
        //          maker_fee_2crypto: '0.001',
        //          maker_fee_2stablecoin: '0.001',
        //          maker_fee_2fiat: '0.001',
        //          maker_fee_2deriv: '0.0002',
        //          taker_fee_2crypto: '0.002',
        //          taker_fee_2stablecoin: '0.002',
        //          taker_fee_2fiat: '0.002',
        //          taker_fee_2deriv: '0.00065',
        //          deriv_maker_rebate: '0.0002',
        //          deriv_taker_fee: '0.00065',
        //          trade_last: null
        //     }
        //
        const result = {};
        const fiat = this.safeValue (this.options, 'fiat', {});
        const makerFee = this.safeNumber (response, 'maker_fee');
        const takerFee = this.safeNumber (response, 'taker_fee');
        const makerFee2Fiat = this.safeNumber (response, 'maker_fee_2fiat');
        const takerFee2Fiat = this.safeNumber (response, 'taker_fee_2fiat');
        const makerFee2Deriv = this.safeNumber (response, 'maker_fee_2deriv');
        const takerFee2Deriv = this.safeNumber (response, 'taker_fee_2deriv');
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            const market = this.market (symbol);
            const fee = {
                'info': response,
                'symbol': symbol,
                'percentage': true,
                'tierBased': true,
            };
            if (market['quote'] in fiat) {
                fee['maker'] = makerFee2Fiat;
                fee['taker'] = takerFee2Fiat;
            } else if (market['contract']) {
                fee['maker'] = makerFee2Deriv;
                fee['taker'] = takerFee2Deriv;
            } else {
                fee['maker'] = makerFee;
                fee['taker'] = takerFee;
            }
            result[symbol] = fee;
        }
        return result;
    }

    async fetchMarkets (params = {}) {
        /**
         * @method
         * @name bitfinex#fetchMarkets
         * @description retrieves data on all markets for bitfinex
         * @param {object} [params] extra parameters specific to the exchange api endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const ids = await this.publicGetSymbols ();
        //
        //     [ "btcusd", "ltcusd", "ltcbtc" ]
        //
        const details = await this.publicGetSymbolsDetails ();
        //
        //     [
        //         {
        //             "pair":"btcusd",
        //             "price_precision":5,
        //             "initial_margin":"10.0",
        //             "minimum_margin":"5.0",
        //             "maximum_order_size":"2000.0",
        //             "minimum_order_size":"0.0002",
        //             "expiration":"NA",
        //             "margin":true
        //         },
        //     ]
        //
        const result = [];
        for (let i = 0; i < details.length; i++) {
            const market = details[i];
            let id = this.safeString (market, 'pair');
            if (!this.inArray (id, ids)) {
                continue;
            }
            id = id.toUpperCase ();
            let baseId = undefined;
            let quoteId = undefined;
            if (id.indexOf (':') >= 0) {
                const parts = id.split (':');
                baseId = parts[0];
                quoteId = parts[1];
            } else {
                baseId = id.slice (0, 3);
                quoteId = id.slice (3, 6);
            }
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            let type = 'spot';
            if (id.indexOf ('F0') > -1) {
                type = 'swap';
            }
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'settle': undefined,
                'baseId': baseId,
                'quoteId': quoteId,
                'settleId': undefined,
                'type': type,
                'spot': (type === 'spot'),
                'margin': this.safeValue (market, 'margin'),
                'swap': (type === 'swap'),
                'future': false,
                'option': false,
                'active': true,
                'contract': (type === 'swap'),
                'linear': undefined,
                'inverse': undefined,
                'contractSize': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'precision': {
                    // https://docs.bitfinex.com/docs/introduction#amount-precision
                    // The amount field allows up to 8 decimals.
                    // Anything exceeding this will be rounded to the 8th decimal.
                    'amount': parseInt ('8'),
                    'price': this.safeInteger (market, 'price_precision'),
                },
                'limits': {
                    'leverage': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'amount': {
                        'min': this.safeNumber (market, 'minimum_order_size'),
                        'max': this.safeNumber (market, 'maximum_order_size'),
                    },
                    'price': {
                        'min': this.parseNumber ('1e-8'),
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
                'created': undefined,
                'info': market,
            });
        }
        return result;
    }

    amountToPrecision (symbol, amount) {
        // https://docs.bitfinex.com/docs/introduction#amount-precision
        // The amount field allows up to 8 decimals.
        // Anything exceeding this will be rounded to the 8th decimal.
        symbol = this.safeSymbol (symbol);
        return this.decimalToPrecision (amount, TRUNCATE, this.markets[symbol]['precision']['amount'], DECIMAL_PLACES);
    }

    priceToPrecision (symbol, price) {
        symbol = this.safeSymbol (symbol);
        price = this.decimalToPrecision (price, ROUND, this.markets[symbol]['precision']['price'], this.precisionMode);
        // https://docs.bitfinex.com/docs/introduction#price-precision
        // The precision level of all trading prices is based on significant figures.
        // All pairs on Bitfinex use up to 5 significant digits and up to 8 decimals (e.g. 1.2345, 123.45, 1234.5, 0.00012345).
        // Prices submit with a precision larger than 5 will be cut by the API.
        return this.decimalToPrecision (price, TRUNCATE, 8, DECIMAL_PLACES);
    }

    async fetchBalance (params = {}) {
        /**
         * @method
         * @name bitfinex#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a [balance structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#balance-structure}
         */
        await this.loadMarkets ();
        const accountsByType = this.safeValue (this.options, 'accountsByType', {});
        const requestedType = this.safeString (params, 'type', 'exchange');
        const accountType = this.safeString (accountsByType, requestedType, requestedType);
        if (accountType === undefined) {
            const keys = Object.keys (accountsByType);
            throw new ExchangeError (this.id + ' fetchBalance() type parameter must be one of ' + keys.join (', '));
        }
        const query = this.omit (params, 'type');
        const response = await this.privatePostBalances (query);
        //    [ { type: 'deposit',
        //        currency: 'btc',
        //        amount: '0.00116721',
        //        available: '0.00116721' },
        //      { type: 'exchange',
        //        currency: 'ust',
        //        amount: '0.0000002',
        //        available: '0.0000002' },
        //      { type: 'trading',
        //        currency: 'btc',
        //        amount: '0.0005',
        //        available: '0.0005' } ],
        const result = { 'info': response };
        const isDerivative = requestedType === 'derivatives';
        for (let i = 0; i < response.length; i++) {
            const balance = response[i];
            const type = this.safeString (balance, 'type');
            const currencyId = this.safeStringLower (balance, 'currency', '');
            const start = currencyId.length - 2;
            const isDerivativeCode = currencyId.slice (start) === 'f0';
            // this will only filter the derivative codes if the requestedType is 'derivatives'
            const derivativeCondition = (!isDerivative || isDerivativeCode);
            if ((accountType === type) && derivativeCondition) {
                const code = this.safeCurrencyCode (currencyId);
                // bitfinex had BCH previously, now it's BAB, but the old
                // BCH symbol is kept for backward-compatibility
                // we need a workaround here so that the old BCH balance
                // would not override the new BAB balance (BAB is unified to BCH)
                // https://github.com/ccxt/ccxt/issues/4989
                if (!(code in result)) {
                    const account = this.account ();
                    account['free'] = this.safeString (balance, 'available');
                    account['total'] = this.safeString (balance, 'amount');
                    result[code] = account;
                }
            }
        }
        return this.safeBalance (result);
    }

    async transfer (code: string, amount, fromAccount, toAccount, params = {}) {
        /**
         * @method
         * @name bitfinex#transfer
         * @description transfer currency internally between wallets on the same account
         * @param {string} code unified currency code
         * @param {float} amount amount to transfer
         * @param {string} fromAccount account to transfer from
         * @param {string} toAccount account to transfer to
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a [transfer structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#transfer-structure}
         */
        // transferring between derivatives wallet and regular wallet is not documented in their API
        // however we support it in CCXT (from just looking at web inspector)
        await this.loadMarkets ();
        const accountsByType = this.safeValue (this.options, 'accountsByType', {});
        const fromId = this.safeString (accountsByType, fromAccount, fromAccount);
        const toId = this.safeString (accountsByType, toAccount, toAccount);
        const currency = this.currency (code);
        const fromCurrencyId = this.convertDerivativesId (currency['id'], fromAccount);
        const toCurrencyId = this.convertDerivativesId (currency['id'], toAccount);
        const requestedAmount = this.currencyToPrecision (code, amount);
        const request = {
            'amount': requestedAmount,
            'currency': fromCurrencyId,
            'currency_to': toCurrencyId,
            'walletfrom': fromId,
            'walletto': toId,
        };
        const response = await this.privatePostTransfer (this.extend (request, params));
        //
        //     [
        //         {
        //             status: 'success',
        //             message: '0.0001 Bitcoin transfered from Margin to Exchange'
        //         }
        //     ]
        //
        const result = this.safeValue (response, 0);
        const message = this.safeString (result, 'message');
        if (message === undefined) {
            throw new ExchangeError (this.id + ' transfer failed');
        }
        return this.extend (this.parseTransfer (result, currency), {
            'fromAccount': fromAccount,
            'toAccount': toAccount,
            'amount': this.parseNumber (requestedAmount),
        });
    }

    parseTransfer (transfer, currency = undefined) {
        //
        //     {
        //         status: 'success',
        //         message: '0.0001 Bitcoin transfered from Margin to Exchange'
        //     }
        //
        const timestamp = this.milliseconds ();
        return {
            'info': transfer,
            'id': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'currency': this.safeCurrencyCode (undefined, currency),
            'amount': undefined,
            'fromAccount': undefined,
            'toAccount': undefined,
            'status': this.parseTransferStatus (this.safeString (transfer, 'status')),
        };
    }

    parseTransferStatus (status) {
        const statuses = {
            'SUCCESS': 'ok',
        };
        return this.safeString (statuses, status, status);
    }

    convertDerivativesId (currencyId, type) {
        const start = currencyId.length - 2;
        const isDerivativeCode = currencyId.slice (start) === 'F0';
        if ((type !== 'derivatives' && type !== 'trading' && type !== 'margin') && isDerivativeCode) {
            currencyId = currencyId.slice (0, start);
        } else if (type === 'derivatives' && !isDerivativeCode) {
            currencyId = currencyId + 'F0';
        }
        return currencyId;
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit_bids'] = limit;
            request['limit_asks'] = limit;
        }
        const response = await this.publicGetBookSymbol (this.extend (request, params));
        return this.parseOrderBook (response, market['symbol'], undefined, 'bids', 'asks', 'price', 'amount');
    }

    async fetchTickers (symbols: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchTickers
         * @description fetches price tickers for multiple markets, statistical calculations with the information calculated over the past 24 hours each market
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#ticker-structure}
         */
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols);
        const response = await this.publicGetTickers (params);
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const ticker = this.parseTicker (response[i]);
            const symbol = ticker['symbol'];
            result[symbol] = ticker;
        }
        return this.filterByArrayTickers (result, 'symbol', symbols);
    }

    async fetchTicker (symbol: string, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a [ticker structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const ticker = await this.publicGetPubtickerSymbol (this.extend (request, params));
        return this.parseTicker (ticker, market);
    }

    parseTicker (ticker, market = undefined): Ticker {
        const timestamp = this.safeTimestamp (ticker, 'timestamp');
        const marketId = this.safeString (ticker, 'pair');
        market = this.safeMarket (marketId, market);
        const symbol = market['symbol'];
        const last = this.safeString (ticker, 'last_price');
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
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': this.safeString (ticker, 'mid'),
            'baseVolume': this.safeString (ticker, 'volume'),
            'quoteVolume': undefined,
            'info': ticker,
        }, market);
    }

    parseTrade (trade, market = undefined): Trade {
        //
        // fetchTrades (public) v1
        //
        //     {
        //          "timestamp":1637258380,
        //          "tid":894452833,
        //          "price":"0.99941",
        //          "amount":"261.38",
        //          "exchange":"bitfinex",
        //          "type":"sell"
        //     }
        //
        // fetchMyTrades (private) v1
        //
        //     {
        //          "price":"0.99941",
        //          "amount":"261.38",
        //          "timestamp":"1637258380.0",
        //          "type":"Sell",
        //          "fee_currency":"UST",
        //          "fee_amount":"-0.52245157",
        //          "tid":894452833,
        //          "order_id":78819731373
        //     }
        //
        //     {
        //         "price":"0.99958",
        //         "amount":"261.90514",
        //         "timestamp":"1637258238.0",
        //         "type":"Buy",
        //         "fee_currency":"UDC",
        //         "fee_amount":"-0.52381028",
        //         "tid":894452800,
        //         "order_id":78819504838
        //     }
        //
        const id = this.safeString (trade, 'tid');
        const timestamp = this.safeTimestamp (trade, 'timestamp');
        const type = undefined;
        const side = this.safeStringLower (trade, 'type');
        const orderId = this.safeString (trade, 'order_id');
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'amount');
        let fee = undefined;
        if ('fee_amount' in trade) {
            const feeCostString = Precise.stringNeg (this.safeString (trade, 'fee_amount'));
            const feeCurrencyId = this.safeString (trade, 'fee_currency');
            const feeCurrencyCode = this.safeCurrencyCode (feeCurrencyId);
            fee = {
                'cost': feeCostString,
                'currency': feeCurrencyCode,
            };
        }
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'type': type,
            'order': orderId,
            'side': side,
            'takerOrMaker': undefined,
            'price': priceString,
            'amount': amountString,
            'cost': undefined,
            'fee': fee,
        }, market);
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit = 50, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'limit_trades': limit,
        };
        if (since !== undefined) {
            request['timestamp'] = this.parseToInt (since / 1000);
        }
        const response = await this.publicGetTradesSymbol (this.extend (request, params));
        //
        //    [
        //        {
        //            "timestamp": "1694284565",
        //            "tid": "1415415034",
        //            "price": "25862.0",
        //            "amount": "0.00020685",
        //            "exchange": "bitfinex",
        //            "type": "buy"
        //        },
        //    ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    async fetchMyTrades (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchMyTrades
         * @description fetch all trades made by the user
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trades structures to retrieve
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#trade-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchMyTrades() requires a `symbol` argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit_trades'] = limit;
        }
        if (since !== undefined) {
            request['timestamp'] = this.parseToInt (since / 1000);
        }
        const response = await this.privatePostMytrades (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount, price = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#createOrder
         * @description create a trade order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float} [price] the price at which the order is to be fullfilled, in units of the quote currency, ignored in market orders
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} an [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const postOnly = this.safeValue (params, 'postOnly', false);
        type = type.toLowerCase ();
        params = this.omit (params, [ 'postOnly' ]);
        if (market['spot']) {
            // although they claim that type needs to be 'exchange limit' or 'exchange market'
            // in fact that's not the case for swap markets
            type = this.safeStringLower (this.options['orderTypes'], type, type);
        }
        const request = {
            'symbol': market['id'],
            'side': side,
            'amount': this.amountToPrecision (symbol, amount),
            'type': type,
            'ocoorder': false,
            'buy_price_oco': 0,
            'sell_price_oco': 0,
        };
        if (type.indexOf ('market') > -1) {
            request['price'] = this.nonce ().toString ();
        } else {
            request['price'] = this.priceToPrecision (symbol, price);
        }
        if (postOnly) {
            request['is_postonly'] = true;
        }
        const response = await this.privatePostOrderNew (this.extend (request, params));
        return this.parseOrder (response, market);
    }

    async editOrder (id: string, symbol, type, side, amount = undefined, price = undefined, params = {}) {
        await this.loadMarkets ();
        const order = {
            'order_id': parseInt (id),
        };
        if (price !== undefined) {
            order['price'] = this.priceToPrecision (symbol, price);
        }
        if (amount !== undefined) {
            order['amount'] = this.numberToString (amount);
        }
        if (symbol !== undefined) {
            order['symbol'] = this.marketId (symbol);
        }
        if (side !== undefined) {
            order['side'] = side;
        }
        if (type !== undefined) {
            order['type'] = this.safeString (this.options['orderTypes'], type, type);
        }
        const response = await this.privatePostOrderCancelReplace (this.extend (order, params));
        return this.parseOrder (response);
    }

    async cancelOrder (id: string, symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#cancelOrder
         * @description cancels an open order
         * @param {string} id order id
         * @param {string} symbol not used by bitfinex cancelOrder ()
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} An [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const request = {
            'order_id': parseInt (id),
        };
        return await this.privatePostOrderCancel (this.extend (request, params));
    }

    async cancelAllOrders (symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#cancelAllOrders
         * @description cancel all open orders
         * @param {string} symbol unified market symbol, only orders in the market of this symbol are cancelled when symbol is not undefined
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} response from exchange
         */
        return await this.privatePostOrderCancelAll (params);
    }

    parseOrder (order, market = undefined): Order {
        //
        //     {
        //           id: 57334010955,
        //           cid: 1611584840966,
        //           cid_date: null,
        //           gid: null,
        //           symbol: 'ltcbtc',
        //           exchange: null,
        //           price: '0.0042125',
        //           avg_execution_price: '0.0042097',
        //           side: 'sell',
        //           type: 'exchange market',
        //           timestamp: '1611584841.0',
        //           is_live: false,
        //           is_cancelled: false,
        //           is_hidden: 0,
        //           oco_order: 0,
        //           was_forced: false,
        //           original_amount: '0.205176',
        //           remaining_amount: '0.0',
        //           executed_amount: '0.205176',
        //           src: 'web'
        //     }
        //
        const side = this.safeString (order, 'side');
        const open = this.safeValue (order, 'is_live');
        const canceled = this.safeValue (order, 'is_cancelled');
        let status = undefined;
        if (open) {
            status = 'open';
        } else if (canceled) {
            status = 'canceled';
        } else {
            status = 'closed';
        }
        const marketId = this.safeStringUpper (order, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        let orderType = this.safeString (order, 'type', '');
        const exchange = orderType.indexOf ('exchange ') >= 0;
        if (exchange) {
            const parts = order['type'].split (' ');
            orderType = parts[1];
        }
        const timestamp = this.safeTimestamp (order, 'timestamp');
        const id = this.safeString (order, 'id');
        return this.safeOrder ({
            'info': order,
            'id': id,
            'clientOrderId': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'type': orderType,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': this.safeString (order, 'price'),
            'stopPrice': undefined,
            'triggerPrice': undefined,
            'average': this.safeString (order, 'avg_execution_price'),
            'amount': this.safeString (order, 'original_amount'),
            'remaining': this.safeString (order, 'remaining_amount'),
            'filled': this.safeString (order, 'executed_amount'),
            'status': status,
            'fee': undefined,
            'cost': undefined,
            'trades': undefined,
        }, market);
    }

    async fetchOpenOrders (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of  open orders structures to retrieve
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {Order[]} a list of [order structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        if (symbol !== undefined) {
            if (!(symbol in this.markets)) {
                throw new ExchangeError (this.id + ' has no symbol ' + symbol);
            }
        }
        const response = await this.privatePostOrders (params);
        let orders = this.parseOrders (response, undefined, since, limit);
        if (symbol !== undefined) {
            orders = this.filterBy (orders, 'symbol', symbol);
        }
        return orders;
    }

    async fetchClosedOrders (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchClosedOrders
         * @description fetches information on multiple closed orders made by the user
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of  orde structures to retrieve
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {Order[]} a list of [order structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        symbol = this.symbol (symbol);
        const request = {};
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privatePostOrdersHist (this.extend (request, params));
        let orders = this.parseOrders (response, undefined, since, limit);
        if (symbol !== undefined) {
            orders = this.filterBy (orders, 'symbol', symbol);
        }
        orders = this.filterByArray (orders, 'status', [ 'closed', 'canceled' ], false);
        return orders;
    }

    async fetchOrder (id: string, symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchOrder
         * @description fetches information on an order made by the user
         * @param {string} symbol not used by bitfinex fetchOrder
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} An [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const request = {
            'order_id': parseInt (id),
        };
        const response = await this.privatePostOrderStatus (this.extend (request, params));
        return this.parseOrder (response);
    }

    parseOHLCV (ohlcv, market = undefined): OHLCV {
        //
        //     [
        //         1457539800000,
        //         0.02594,
        //         0.02594,
        //         0.02594,
        //         0.02594,
        //         0.1
        //     ]
        //
        return [
            this.safeInteger (ohlcv, 0),
            this.safeNumber (ohlcv, 1),
            this.safeNumber (ohlcv, 3),
            this.safeNumber (ohlcv, 4),
            this.safeNumber (ohlcv, 2),
            this.safeNumber (ohlcv, 5),
        ];
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        if (limit === undefined) {
            limit = 100;
        }
        const market = this.market (symbol);
        const v2id = 't' + market['id'];
        const request = {
            'symbol': v2id,
            'timeframe': this.safeString (this.timeframes, timeframe, timeframe),
            'sort': 1,
            'limit': limit,
        };
        if (since !== undefined) {
            request['start'] = since;
        }
        const response = await this.v2GetCandlesTradeTimeframeSymbolHist (this.extend (request, params));
        //
        //     [
        //         [1457539800000,0.02594,0.02594,0.02594,0.02594,0.1],
        //         [1457547300000,0.02577,0.02577,0.02577,0.02577,0.01],
        //         [1457550240000,0.0255,0.0253,0.0255,0.0252,3.2640000000000002],
        //     ]
        //
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    getCurrencyName (code) {
        // todo rewrite for https://api-pub.bitfinex.com//v2/conf/pub:map:tx:method
        if (code in this.options['currencyNames']) {
            return this.options['currencyNames'][code];
        }
        throw new NotSupported (this.id + ' ' + code + ' not supported for withdrawal');
    }

    async createDepositAddress (code: string, params = {}) {
        /**
         * @method
         * @name bitfinex#createDepositAddress
         * @description create a currency deposit address
         * @param {string} code unified currency code of the currency for the deposit address
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} an [address structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#address-structure}
         */
        await this.loadMarkets ();
        const request = {
            'renew': 1,
        };
        return await this.fetchDepositAddress (code, this.extend (request, params));
    }

    async fetchDepositAddress (code: string, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchDepositAddress
         * @description fetch the deposit address for a currency associated with this account
         * @param {string} code unified currency code
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} an [address structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#address-structure}
         */
        await this.loadMarkets ();
        // todo rewrite for https://api-pub.bitfinex.com//v2/conf/pub:map:tx:method
        const name = this.getCurrencyName (code);
        const request = {
            'method': name,
            'wallet_name': 'exchange',
            'renew': 0, // a value of 1 will generate a new address
        };
        const response = await this.privatePostDepositNew (this.extend (request, params));
        let address = this.safeValue (response, 'address');
        let tag = undefined;
        if ('address_pool' in response) {
            tag = address;
            address = response['address_pool'];
        }
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'network': undefined,
            'info': response,
        };
    }

    async fetchDepositsWithdrawals (code: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchDepositsWithdrawals
         * @description fetch history of deposits and withdrawals
         * @param {string} code unified currency code for the currency of the deposit/withdrawals
         * @param {int} [since] timestamp in ms of the earliest deposit/withdrawal, default is undefined
         * @param {int} [limit] max number of deposit/withdrawals to return, default is undefined
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a list of [transaction structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#transaction-structure}
         */
        await this.loadMarkets ();
        let currencyId = this.safeString (params, 'currency');
        const query = this.omit (params, 'currency');
        let currency = undefined;
        if (currencyId === undefined) {
            if (code === undefined) {
                throw new ArgumentsRequired (this.id + ' fetchDepositsWithdrawals() requires a currency `code` argument or a `currency` parameter');
            } else {
                currency = this.currency (code);
                currencyId = currency['id'];
            }
        }
        query['currency'] = currencyId;
        if (since !== undefined) {
            query['since'] = this.parseToInt (since / 1000);
        }
        const response = await this.privatePostHistoryMovements (this.extend (query, params));
        //
        //     [
        //         {
        //             "id": 581183,
        //             "txid":  123456,
        //             "currency": "BTC",
        //             "method": "BITCOIN",
        //             "type": "WITHDRAWAL",
        //             "amount": ".01",
        //             "description": "3QXYWgRGX2BPYBpUDBssGbeWEa5zq6snBZ, offchain transfer ",
        //             "address": "3QXYWgRGX2BPYBpUDBssGbeWEa5zq6snBZ",
        //             "status": "COMPLETED",
        //             "timestamp": "1443833327.0",
        //             "timestamp_created":  "1443833327.1",
        //             "fee":  0.1,
        //         }
        //     ]
        //
        return this.parseTransactions (response, currency, since, limit);
    }

    parseTransaction (transaction, currency = undefined): Transaction {
        //
        // crypto
        //
        //     {
        //         "id": 12042490,
        //         "fee": "-0.02",
        //         "txid": "EA5B5A66000B66855865EFF2494D7C8D1921FCBE996482157EBD749F2C85E13D",
        //         "type": "DEPOSIT",
        //         "amount": "2099.849999",
        //         "method": "RIPPLE",
        //         "status": "COMPLETED",
        //         "address": "2505189261",
        //         "currency": "XRP",
        //         "timestamp": "1551730524.0",
        //         "description": "EA5B5A66000B66855865EFF2494D7C8D1921FCBE996482157EBD749F2C85E13D",
        //         "timestamp_created": "1551730523.0"
        //     }
        //
        // fiat
        //
        //     {
        //         "id": 12725095,
        //         "fee": "-60.0",
        //         "txid": null,
        //         "type": "WITHDRAWAL",
        //         "amount": "9943.0",
        //         "method": "WIRE",
        //         "status": "SENDING",
        //         "address": null,
        //         "currency": "EUR",
        //         "timestamp": "1561802484.0",
        //         "description": "Name: bob, AccountAddress: some address, Account: someaccountno, Bank: bank address, SWIFT: foo, Country: UK, Details of Payment: withdrawal name, Intermediary Bank Name: , Intermediary Bank Address: , Intermediary Bank City: , Intermediary Bank Country: , Intermediary Bank Account: , Intermediary Bank SWIFT: , Fee: -60.0",
        //         "timestamp_created": "1561716066.0"
        //     }
        //
        // withdraw
        //
        //     {
        //         "status": "success",
        //         "message": "Your withdrawal request has been successfully submitted.",
        //         "withdrawal_id": 586829
        //     }
        //
        const timestamp = this.safeTimestamp (transaction, 'timestamp_created');
        const currencyId = this.safeString (transaction, 'currency');
        const code = this.safeCurrencyCode (currencyId, currency);
        let feeCost = this.safeString (transaction, 'fee');
        if (feeCost !== undefined) {
            feeCost = Precise.stringAbs (feeCost);
        }
        return {
            'info': transaction,
            'id': this.safeString2 (transaction, 'id', 'withdrawal_id'),
            'txid': this.safeString (transaction, 'txid'),
            'type': this.safeStringLower (transaction, 'type'), // DEPOSIT or WITHDRAWAL,
            'currency': code,
            'network': undefined,
            'amount': this.safeNumber (transaction, 'amount'),
            'status': this.parseTransactionStatus (this.safeString (transaction, 'status')),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'address': this.safeString (transaction, 'address'), // todo: this is actually the tag for XRP transfers (the address is missing)
            'addressFrom': undefined,
            'addressTo': undefined,
            'tag': this.safeString (transaction, 'description'),
            'tagFrom': undefined,
            'tagTo': undefined,
            'updated': this.safeTimestamp (transaction, 'timestamp'),
            'comment': undefined,
            'fee': {
                'currency': code,
                'cost': this.parseNumber (feeCost),
                'rate': undefined,
            },
        };
    }

    parseTransactionStatus (status) {
        const statuses = {
            'SENDING': 'pending',
            'CANCELED': 'canceled',
            'ZEROCONFIRMED': 'failed', // ZEROCONFIRMED happens e.g. in a double spend attempt (I had one in my movements!)
            'COMPLETED': 'ok',
        };
        return this.safeString (statuses, status, status);
    }

    async withdraw (code: string, amount, address, tag = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#withdraw
         * @description make a withdrawal
         * @param {string} code unified currency code
         * @param {float} amount the amount to withdraw
         * @param {string} address the address to withdraw to
         * @param {string} tag
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object} a [transaction structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#transaction-structure}
         */
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        this.checkAddress (address);
        await this.loadMarkets ();
        // todo rewrite for https://api-pub.bitfinex.com//v2/conf/pub:map:tx:method
        const name = this.getCurrencyName (code);
        const currency = this.currency (code);
        const request = {
            'withdraw_type': name,
            'walletselected': 'exchange',
            'amount': this.numberToString (amount),
            'address': address,
        };
        if (tag !== undefined) {
            request['payment_id'] = tag;
        }
        const responses = await this.privatePostWithdraw (this.extend (request, params));
        //
        //     [
        //         {
        //             "status":"success",
        //             "message":"Your withdrawal request has been successfully submitted.",
        //             "withdrawal_id":586829
        //         }
        //     ]
        //
        const response = this.safeValue (responses, 0, {});
        const id = this.safeNumber (response, 'withdrawal_id');
        const message = this.safeString (response, 'message');
        const errorMessage = this.findBroadlyMatchedKey (this.exceptions['broad'], message);
        if (id === 0) {
            if (errorMessage !== undefined) {
                const ExceptionClass = this.exceptions['broad'][errorMessage];
                throw new ExceptionClass (this.id + ' ' + message);
            }
            throw new ExchangeError (this.id + ' withdraw returned an id of zero: ' + this.json (response));
        }
        return this.parseTransaction (response, currency);
    }

    async fetchPositions (symbols: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitfinex#fetchPositions
         * @description fetch all open positions
         * @param {string[]|undefined} symbols list of unified market symbols
         * @param {object} [params] extra parameters specific to the bitfinex api endpoint
         * @returns {object[]} a list of [position structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#position-structure}
         */
        await this.loadMarkets ();
        const response = await this.privatePostPositions (params);
        //
        //     [
        //         {
        //             "id":943715,
        //             "symbol":"btcusd",
        //             "status":"ACTIVE",
        //             "base":"246.94",
        //             "amount":"1.0",
        //             "timestamp":"1444141857.0",
        //             "swap":"0.0",
        //             "pl":"-2.22042"
        //         }
        //     ]
        //
        // todo unify parsePosition/parsePositions
        return response;
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let request = '/' + this.implodeParams (path, params);
        if (api === 'v2') {
            request = '/' + api + request;
        } else {
            request = '/' + this.version + request;
        }
        let query = this.omit (params, this.extractParams (path));
        let url = this.urls['api'][api] + request;
        if ((api === 'public') || (path.indexOf ('/hist') >= 0)) {
            if (Object.keys (query).length) {
                const suffix = '?' + this.urlencode (query);
                url += suffix;
                request += suffix;
            }
        }
        if (api === 'private') {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ();
            query = this.extend ({
                'nonce': nonce.toString (),
                'request': request,
            }, query);
            body = this.json (query);
            const payload = this.stringToBase64 (body);
            const secret = this.encode (this.secret);
            const signature = this.hmac (this.encode (payload), secret, sha384);
            headers = {
                'X-BFX-APIKEY': this.apiKey,
                'X-BFX-PAYLOAD': payload,
                'X-BFX-SIGNATURE': signature,
                'Content-Type': 'application/json',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined;
        }
        let throwError = false;
        if (code >= 400) {
            if (body[0] === '{') {
                throwError = true;
            }
        } else {
            // json response with error, i.e:
            // [{"status":"error","message":"Momentary balance check. Please wait few seconds and try the transfer again."}]
            const responseObject = this.safeValue (response, 0, {});
            const status = this.safeString (responseObject, 'status', '');
            if (status === 'error') {
                throwError = true;
            }
        }
        if (throwError) {
            const feedback = this.id + ' ' + body;
            const message = this.safeString2 (response, 'message', 'error');
            this.throwExactlyMatchedException (this.exceptions['exact'], message, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
        return undefined;
    }
}
