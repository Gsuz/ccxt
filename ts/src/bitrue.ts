
//  ---------------------------------------------------------------------------

import Exchange from './abstract/bitrue.js';
import { ExchangeError, ArgumentsRequired, ExchangeNotAvailable, InsufficientFunds, OrderNotFound, InvalidOrder, DDoSProtection, InvalidNonce, AuthenticationError, RateLimitExceeded, PermissionDenied, BadRequest, BadSymbol, AccountSuspended, OrderImmediatelyFillable, OnMaintenance, NotSupported } from './base/errors.js';
import { Precise } from './base/Precise.js';
import { TRUNCATE, TICK_SIZE } from './base/functions/number.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';
import { Balances, Int, OHLCV, Order, OrderSide, OrderType, Ticker, Trade, Transaction } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class bitrue
 * @extends Exchange
 */
export default class bitrue extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitrue',
            'name': 'Bitrue',
            'countries': [ 'SG' ], // Singapore, Malta
            'rateLimit': 1000,
            'certified': false,
            'version': 'v1',
            'pro': true,
            // new metainfo interface
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': undefined, // has but unimplemented
                'future': true,
                'option': false,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'createStopLimitOrder': true,
                'createStopMarketOrder': true,
                'createStopOrder': true,
                'fetchBalance': true,
                'fetchBidsAsks': true,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchDepositAddress': false,
                'fetchDeposits': true,
                'fetchDepositsWithdrawals': false,
                'fetchDepositWithdrawFee': 'emulated',
                'fetchDepositWithdrawFees': true,
                'fetchMarginMode': false,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': false,
                'fetchPositionMode': false,
                'fetchStatus': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': true,
                'fetchTrades': true,
                'fetchTradingFee': false,
                'fetchTradingFees': false,
                'fetchTransactionFees': false,
                'fetchTransactions': false,
                'fetchTransfers': true,
                'fetchWithdrawals': true,
                'setLeverage': true,
                'setMargin': true,
                'transfer': true,
                'withdraw': true,
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1H',
                '2h': '2H',
                '4h': '4H',
                '1d': '1D',
                '1w': '1W',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/139516488-243a830d-05dd-446b-91c6-c1f18fe30c63.jpg',
                'api': {
                    'spot': 'https://www.bitrue.com/api',
                    'fapi': 'https://fapi.bitrue.com/fapi',
                    'dapi': 'https://fapi.bitrue.com/dapi',
                    'kline': 'https://www.bitrue.com/kline-api',
                },
                'www': 'https://www.bitrue.com',
                'referral': 'https://www.bitrue.com/activity/task/task-landing?inviteCode=EZWETQE&cn=900000',
                'doc': [
                    'https://github.com/Bitrue-exchange/bitrue-official-api-docs',
                    'https://www.bitrue.com/api-docs',
                ],
                'fees': 'https://bitrue.zendesk.com/hc/en-001/articles/4405479952537',
            },
            'api': {
                'spot': {
                    'kline': {
                        'public': {
                            'get': {
                                'public.json': 1,
                                'public{currency}.json': 1,
                            },
                        },
                    },
                    'v1': {
                        'public': {
                            'get': {
                                'ping': 1,
                                'time': 1,
                                'exchangeInfo': 1,
                                'depth': { 'cost': 1, 'byLimit': [ [ 100, 1 ], [ 500, 5 ], [ 1000, 10 ] ] },
                                'trades': 1,
                                'historicalTrades': 5,
                                'aggTrades': 1,
                                'ticker/24hr': { 'cost': 1, 'noSymbol': 40 },
                                'ticker/price': { 'cost': 1, 'noSymbol': 2 },
                                'ticker/bookTicker': { 'cost': 1, 'noSymbol': 2 },
                                'market/kline': 1,
                            },
                        },
                        'private': {
                            'get': {
                                'order': 1,
                                'openOrders': 1,
                                'allOrders': 5,
                                'account': 5,
                                'myTrades': { 'cost': 5, 'noSymbol': 40 },
                                'etf/net-value/{symbol}': 1,
                                'withdraw/history': 1,
                                'deposit/history': 1,
                            },
                            'post': {
                                'order': 4,
                                'withdraw/commit': 1,
                            },
                            'delete': {
                                'order': 1,
                            },
                        },
                    },
                    'v2': {
                        'private': {
                            'get': {
                                'myTrades': 5,
                            },
                        },
                    },
                },
                'fapi': {
                    'v1': {
                        'public': {
                            'get': {
                                'ping': 1,
                                'time': 1,
                                'contracts': 1,
                                'depth': 1,
                                'ticker': 1,
                                'klines': 1,
                            },
                        },
                    },
                    'v2': {
                        'private': {
                            'get': {
                                'myTrades': 1,
                                'openOrders': 1,
                                'order': 1,
                                'account': 1,
                                'leverageBracket': 1,
                                'commissionRate': 1,
                                'futures_transfer_history': 1,
                                'forceOrdersHistory': 1,
                            },
                            'post': {
                                'positionMargin': 1,
                                'level_edit': 1,
                                'cancel': 1,
                                'order': 1,
                                'allOpenOrders': 1,
                                'futures_transfer': 1,
                            },
                        },
                    },
                },
                'dapi': {
                    'v1': {
                        'public': {
                            'get': {
                                'ping': 1,
                                'time': 1,
                                'contracts': 1,
                                'depth': 1,
                                'ticker': 1,
                                'klines': 1,
                            },
                        },
                    },
                    'v2': {
                        'private': {
                            'get': {
                                'myTrades': 1,
                                'openOrders': 1,
                                'order': 1,
                                'account': 1,
                                'leverageBracket': 1,
                                'commissionRate': 1,
                                'futures_transfer_history': 1,
                                'forceOrdersHistory': 1,
                            },
                            'post': {
                                'positionMargin': 1,
                                'level_edit': 1,
                                'cancel': 1,
                                'order': 1,
                                'allOpenOrders': 1,
                                'futures_transfer': 1,
                            },
                        },
                    },
                },
            },
            'fees': {
                'trading': {
                    'feeSide': 'get',
                    'tierBased': false,
                    'percentage': true,
                    'taker': this.parseNumber ('0.00098'),
                    'maker': this.parseNumber ('0.00098'),
                },
                'future': {
                    'trading': {
                        'feeSide': 'quote',
                        'tierBased': true,
                        'percentage': true,
                        'taker': this.parseNumber ('0.000400'),
                        'maker': this.parseNumber ('0.000200'),
                        'tiers': {
                            'taker': [
                                [ this.parseNumber ('0'), this.parseNumber ('0.000400') ],
                                [ this.parseNumber ('250'), this.parseNumber ('0.000400') ],
                                [ this.parseNumber ('2500'), this.parseNumber ('0.000350') ],
                                [ this.parseNumber ('7500'), this.parseNumber ('0.000320') ],
                                [ this.parseNumber ('22500'), this.parseNumber ('0.000300') ],
                                [ this.parseNumber ('50000'), this.parseNumber ('0.000270') ],
                                [ this.parseNumber ('100000'), this.parseNumber ('0.000250') ],
                                [ this.parseNumber ('200000'), this.parseNumber ('0.000220') ],
                                [ this.parseNumber ('400000'), this.parseNumber ('0.000200') ],
                                [ this.parseNumber ('750000'), this.parseNumber ('0.000170') ],
                            ],
                            'maker': [
                                [ this.parseNumber ('0'), this.parseNumber ('0.000200') ],
                                [ this.parseNumber ('250'), this.parseNumber ('0.000160') ],
                                [ this.parseNumber ('2500'), this.parseNumber ('0.000140') ],
                                [ this.parseNumber ('7500'), this.parseNumber ('0.000120') ],
                                [ this.parseNumber ('22500'), this.parseNumber ('0.000100') ],
                                [ this.parseNumber ('50000'), this.parseNumber ('0.000080') ],
                                [ this.parseNumber ('100000'), this.parseNumber ('0.000060') ],
                                [ this.parseNumber ('200000'), this.parseNumber ('0.000040') ],
                                [ this.parseNumber ('400000'), this.parseNumber ('0.000020') ],
                                [ this.parseNumber ('750000'), this.parseNumber ('0') ],
                            ],
                        },
                    },
                },
                'delivery': {
                    'trading': {
                        'feeSide': 'base',
                        'tierBased': true,
                        'percentage': true,
                        'taker': this.parseNumber ('0.000500'),
                        'maker': this.parseNumber ('0.000100'),
                        'tiers': {
                            'taker': [
                                [ this.parseNumber ('0'), this.parseNumber ('0.000500') ],
                                [ this.parseNumber ('250'), this.parseNumber ('0.000450') ],
                                [ this.parseNumber ('2500'), this.parseNumber ('0.000400') ],
                                [ this.parseNumber ('7500'), this.parseNumber ('0.000300') ],
                                [ this.parseNumber ('22500'), this.parseNumber ('0.000250') ],
                                [ this.parseNumber ('50000'), this.parseNumber ('0.000240') ],
                                [ this.parseNumber ('100000'), this.parseNumber ('0.000240') ],
                                [ this.parseNumber ('200000'), this.parseNumber ('0.000240') ],
                                [ this.parseNumber ('400000'), this.parseNumber ('0.000240') ],
                                [ this.parseNumber ('750000'), this.parseNumber ('0.000240') ],
                            ],
                            'maker': [
                                [ this.parseNumber ('0'), this.parseNumber ('0.000100') ],
                                [ this.parseNumber ('250'), this.parseNumber ('0.000080') ],
                                [ this.parseNumber ('2500'), this.parseNumber ('0.000050') ],
                                [ this.parseNumber ('7500'), this.parseNumber ('0.0000030') ],
                                [ this.parseNumber ('22500'), this.parseNumber ('0') ],
                                [ this.parseNumber ('50000'), this.parseNumber ('-0.000050') ],
                                [ this.parseNumber ('100000'), this.parseNumber ('-0.000060') ],
                                [ this.parseNumber ('200000'), this.parseNumber ('-0.000070') ],
                                [ this.parseNumber ('400000'), this.parseNumber ('-0.000080') ],
                                [ this.parseNumber ('750000'), this.parseNumber ('-0.000090') ],
                            ],
                        },
                    },
                },
            },
            // exchange-specific options
            'options': {
                'fetchMarkets': [
                    'spot',
                    'linear',
                    'inverse',
                ],
                // 'fetchTradesMethod': 'publicGetAggTrades', // publicGetTrades, publicGetHistoricalTrades
                'fetchMyTradesMethod': 'v2PrivateGetMyTrades', // spotV1PrivateGetMyTrades
                'hasAlreadyAuthenticatedSuccessfully': false,
                'recvWindow': 5 * 1000, // 5 sec, binance default
                'timeDifference': 0, // the difference between system clock and Binance clock
                'adjustForTimeDifference': false, // controls the adjustment logic upon instantiation
                'parseOrderToPrecision': false, // force amounts and costs in parseOrder to precision
                'newOrderRespType': {
                    'market': 'FULL', // 'ACK' for order id, 'RESULT' for full order or 'FULL' for order with fills
                    'limit': 'FULL', // we change it from 'ACK' by default to 'FULL' (returns immediately if limit is not hit)
                },
                'networks': {
                    'ERC20': 'ETH',
                    'TRC20': 'TRX',
                },
                'defaultType': 'spot',
                'timeframes': {
                    'spot': {
                        '1m': '1m',
                        '5m': '5m',
                        '15m': '15m',
                        '30m': '30m',
                        '1h': '1H',
                        '2h': '2H',
                        '4h': '4H',
                        '12h': '12H',
                        '1d': '1D',
                        '1w': '1W',
                    },
                    'future': {
                        '1m': '1min',
                        '5m': '5min',
                        '15m': '15min',
                        '30m': '30min',
                        '1h': '1h',
                        '1d': '1day',
                        '1w': '1week',
                        '1M': '1month',
                    },
                },
            },
            'commonCurrencies': {
                'MIM': 'MIM Swarm',
            },
            'precisionMode': TICK_SIZE,
            // https://binance-docs.github.io/apidocs/spot/en/#error-codes-2
            'exceptions': {
                'exact': {
                    'System is under maintenance.': OnMaintenance, // {"code":1,"msg":"System is under maintenance."}
                    'System abnormality': ExchangeError, // {"code":-1000,"msg":"System abnormality"}
                    'You are not authorized to execute this request.': PermissionDenied, // {"msg":"You are not authorized to execute this request."}
                    'API key does not exist': AuthenticationError,
                    'Order would trigger immediately.': OrderImmediatelyFillable,
                    'Stop price would trigger immediately.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Stop price would trigger immediately."}
                    'Order would immediately match and take.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Order would immediately match and take."}
                    'Account has insufficient balance for requested action.': InsufficientFunds,
                    'Rest API trading is not enabled.': ExchangeNotAvailable,
                    "You don't have permission.": PermissionDenied, // {"msg":"You don't have permission.","success":false}
                    'Market is closed.': ExchangeNotAvailable, // {"code":-1013,"msg":"Market is closed."}
                    'Too many requests. Please try again later.': DDoSProtection, // {"msg":"Too many requests. Please try again later.","success":false}
                    '-1000': ExchangeNotAvailable, // {"code":-1000,"msg":"An unknown error occured while processing the request."}
                    '-1001': ExchangeNotAvailable, // 'Internal error; unable to process your request. Please try again.'
                    '-1002': AuthenticationError, // 'You are not authorized to execute this request.'
                    '-1003': RateLimitExceeded, // {"code":-1003,"msg":"Too much request weight used, current limit is 1200 request weight per 1 MINUTE. Please use the websocket for live updates to avoid polling the API."}
                    '-1013': InvalidOrder, // createOrder -> 'invalid quantity'/'invalid price'/MIN_NOTIONAL
                    '-1015': RateLimitExceeded, // 'Too many new orders; current limit is %s orders per %s.'
                    '-1016': ExchangeNotAvailable, // 'This service is no longer available.',
                    '-1020': BadRequest, // 'This operation is not supported.'
                    '-1021': InvalidNonce, // 'your time is ahead of server'
                    '-1022': AuthenticationError, // {"code":-1022,"msg":"Signature for this request is not valid."}
                    '-1100': BadRequest, // createOrder(symbol, 1, asdf) -> 'Illegal characters found in parameter 'price'
                    '-1101': BadRequest, // Too many parameters; expected %s and received %s.
                    '-1102': BadRequest, // Param %s or %s must be sent, but both were empty
                    '-1103': BadRequest, // An unknown parameter was sent.
                    '-1104': BadRequest, // Not all sent parameters were read, read 8 parameters but was sent 9
                    '-1105': BadRequest, // Parameter %s was empty.
                    '-1106': BadRequest, // Parameter %s sent when not required.
                    '-1111': BadRequest, // Precision is over the maximum defined for this asset.
                    '-1112': InvalidOrder, // No orders on book for symbol.
                    '-1114': BadRequest, // TimeInForce parameter sent when not required.
                    '-1115': BadRequest, // Invalid timeInForce.
                    '-1116': BadRequest, // Invalid orderType.
                    '-1117': BadRequest, // Invalid side.
                    '-1118': BadRequest, // New client order ID was empty.
                    '-1119': BadRequest, // Original client order ID was empty.
                    '-1120': BadRequest, // Invalid interval.
                    '-1121': BadSymbol, // Invalid symbol.
                    '-1125': AuthenticationError, // This listenKey does not exist.
                    '-1127': BadRequest, // More than %s hours between startTime and endTime.
                    '-1128': BadRequest, // {"code":-1128,"msg":"Combination of optional parameters invalid."}
                    '-1130': BadRequest, // Data sent for paramter %s is not valid.
                    '-1131': BadRequest, // recvWindow must be less than 60000
                    '-2008': AuthenticationError, // {"code":-2008,"msg":"Invalid Api-Key ID."}
                    '-2010': ExchangeError, // generic error code for createOrder -> 'Account has insufficient balance for requested action.', {"code":-2010,"msg":"Rest API trading is not enabled."}, etc...
                    '-2011': OrderNotFound, // cancelOrder(1, 'BTC/USDT') -> 'UNKNOWN_ORDER'
                    '-2013': OrderNotFound, // fetchOrder (1, 'BTC/USDT') -> 'Order does not exist'
                    '-2014': AuthenticationError, // { "code":-2014, "msg": "API-key format invalid." }
                    '-2015': AuthenticationError, // "Invalid API-key, IP, or permissions for action."
                    '-2019': InsufficientFunds, // {"code":-2019,"msg":"Margin is insufficient."}
                    '-3005': InsufficientFunds, // {"code":-3005,"msg":"Transferring out not allowed. Transfer out amount exceeds max amount."}
                    '-3006': InsufficientFunds, // {"code":-3006,"msg":"Your borrow amount has exceed maximum borrow amount."}
                    '-3008': InsufficientFunds, // {"code":-3008,"msg":"Borrow not allowed. Your borrow amount has exceed maximum borrow amount."}
                    '-3010': ExchangeError, // {"code":-3010,"msg":"Repay not allowed. Repay amount exceeds borrow amount."}
                    '-3015': ExchangeError, // {"code":-3015,"msg":"Repay amount exceeds borrow amount."}
                    '-3022': AccountSuspended, // You account's trading is banned.
                    '-4028': BadRequest, // {"code":-4028,"msg":"Leverage 100 is not valid"}
                    '-3020': InsufficientFunds, // {"code":-3020,"msg":"Transfer out amount exceeds max amount."}
                    '-3041': InsufficientFunds, // {"code":-3041,"msg":"Balance is not enough"}
                    '-5013': InsufficientFunds, // Asset transfer failed: insufficient balance"
                    '-11008': InsufficientFunds, // {"code":-11008,"msg":"Exceeding the account's maximum borrowable limit."}
                    '-4051': InsufficientFunds, // {"code":-4051,"msg":"Isolated balance insufficient."}
                },
                'broad': {
                    'has no operation privilege': PermissionDenied,
                    'MAX_POSITION': InvalidOrder, // {"code":-2010,"msg":"Filter failure: MAX_POSITION"}
                },
            },
        });
    }

    costToPrecision (symbol, cost) {
        return this.decimalToPrecision (cost, TRUNCATE, this.markets[symbol]['precision']['quote'], this.precisionMode, this.paddingMode);
    }

    currencyToPrecision (code, fee, networkCode = undefined) {
        // info is available in currencies only if the user has configured his api keys
        if (this.safeValue (this.currencies[code], 'precision') !== undefined) {
            return this.decimalToPrecision (fee, TRUNCATE, this.currencies[code]['precision'], this.precisionMode, this.paddingMode);
        } else {
            return this.numberToString (fee);
        }
    }

    nonce () {
        return this.milliseconds () - this.options['timeDifference'];
    }

    async fetchStatus (params = {}) {
        /**
         * @method
         * @name bitrue#fetchStatus
         * @description the latest known information on the availability of the exchange API
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#test-connectivity
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a [status structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#exchange-status-structure}
         */
        const response = await this.spotV1PublicGetPing (params);
        //
        // empty means working status.
        //
        //     {}
        //
        const keys = Object.keys (response);
        const keysLength = keys.length;
        const formattedStatus = keysLength ? 'maintenance' : 'ok';
        return {
            'status': formattedStatus,
            'updated': undefined,
            'eta': undefined,
            'url': undefined,
            'info': response,
        };
    }

    async fetchTime (params = {}) {
        /**
         * @method
         * @name bitrue#fetchTime
         * @description fetches the current integer timestamp in milliseconds from the exchange server
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#check-server-time
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {int} the current integer timestamp in milliseconds from the exchange server
         */
        const response = await this.spotV1PublicGetTime (params);
        //
        //     {
        //         "serverTime":1635467280514
        //     }
        //
        return this.safeInteger (response, 'serverTime');
    }

    safeNetwork (networkId) {
        const uppercaseNetworkId = networkId.toUpperCase ();
        const networksById = {
            'Aeternity': 'Aeternity',
            'AION': 'AION',
            'Algorand': 'Algorand',
            'ASK': 'ASK',
            'ATOM': 'ATOM',
            'AVAX C-Chain': 'AVAX C-Chain',
            'bch': 'bch',
            'BCH': 'BCH',
            'BEP2': 'BEP2',
            'BEP20': 'BEP20',
            'Bitcoin': 'Bitcoin',
            'BRP20': 'BRP20',
            'Cardano': 'ADA',
            'CasinoCoin': 'CasinoCoin',
            'CasinoCoin XRPL': 'CasinoCoin XRPL',
            'Contentos': 'Contentos',
            'Dash': 'Dash',
            'Decoin': 'Decoin',
            'DeFiChain': 'DeFiChain',
            'DGB': 'DGB',
            'Divi': 'Divi',
            'dogecoin': 'DOGE',
            'EOS': 'EOS',
            'ERC20': 'ERC20',
            'ETC': 'ETC',
            'Filecoin': 'Filecoin',
            'FREETON': 'FREETON',
            'HBAR': 'HBAR',
            'Hedera Hashgraph': 'Hedera Hashgraph',
            'HRC20': 'HRC20',
            'ICON': 'ICON',
            'ICP': 'ICP',
            'Ignis': 'Ignis',
            'Internet Computer': 'Internet Computer',
            'IOTA': 'IOTA',
            'KAVA': 'KAVA',
            'KSM': 'KSM',
            'LiteCoin': 'LiteCoin',
            'Luna': 'Luna',
            'MATIC': 'MATIC',
            'Mobile Coin': 'Mobile Coin',
            'MonaCoin': 'MonaCoin',
            'Monero': 'Monero',
            'NEM': 'NEM',
            'NEP5': 'NEP5',
            'OMNI': 'OMNI',
            'PAC': 'PAC',
            'Polkadot': 'Polkadot',
            'Ravencoin': 'Ravencoin',
            'Safex': 'Safex',
            'SOLANA': 'SOL',
            'Songbird': 'Songbird',
            'Stellar Lumens': 'Stellar Lumens',
            'Symbol': 'Symbol',
            'Tezos': 'XTZ',
            'theta': 'theta',
            'THETA': 'THETA',
            'TRC20': 'TRC20',
            'VeChain': 'VeChain',
            'VECHAIN': 'VECHAIN',
            'Wanchain': 'Wanchain',
            'XinFin Network': 'XinFin Network',
            'XRP': 'XRP',
            'XRPL': 'XRPL',
            'ZIL': 'ZIL',
        };
        return this.safeString2 (networksById, networkId, uppercaseNetworkId, networkId);
    }

    isInverse (type, subType = undefined) {
        if (subType === undefined) {
            return type === 'delivery';
        } else {
            return subType === 'inverse';
        }
    }

    isLinear (type, subType = undefined) {
        if (subType === undefined) {
            return (type === 'future') || (type === 'swap');
        } else {
            return subType === 'linear';
        }
    }

    async fetchCurrencies (params = {}) {
        /**
         * @method
         * @name bitrue#fetchCurrencies
         * @description fetches all available currencies on an exchange
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} an associative dictionary of currencies
         */
        const response = await this.spotV1PublicGetExchangeInfo (params);
        //
        //     {
        //         "timezone":"CTT",
        //         "serverTime":1635464889117,
        //         "rateLimits":[
        //             {"rateLimitType":"REQUESTS_WEIGHT","interval":"MINUTES","limit":6000},
        //             {"rateLimitType":"ORDERS","interval":"SECONDS","limit":150},
        //             {"rateLimitType":"ORDERS","interval":"DAYS","limit":288000},
        //         ],
        //         "exchangeFilters":[],
        //         "symbols":[
        //             {
        //                 "symbol":"SHABTC",
        //                 "status":"TRADING",
        //                 "baseAsset":"sha",
        //                 "baseAssetPrecision":0,
        //                 "quoteAsset":"btc",
        //                 "quotePrecision":10,
        //                 "orderTypes":["MARKET","LIMIT"],
        //                 "icebergAllowed":false,
        //                 "filters":[
        //                     {"filterType":"PRICE_FILTER","minPrice":"0.00000001349","maxPrice":"0.00000017537","priceScale":10},
        //                     {"filterType":"LOT_SIZE","minQty":"1.0","minVal":"0.00020","maxQty":"1000000000","volumeScale":0},
        //                 ],
        //                 "defaultPrice":"0.0000006100",
        //             },
        //         ],
        //         "coins":[
        //           {
        //               "coin": "near",
        //               "coinFulName": "NEAR Protocol",
        //               "chains": [ "BEP20", ],
        //               "chainDetail": [
        //                 {
        //                     "chain": "BEP20",
        //                     "enableWithdraw": true,
        //                     "enableDeposit": true,
        //                     "withdrawFee": "0.2000",
        //                     "minWithdraw": "5.0000",
        //                     "maxWithdraw": "1000000000000000.0000",
        //                 },
        //               ],
        //           },
        //         ],
        //     }
        //
        const result = {};
        const coins = this.safeValue (response, 'coins', []);
        for (let i = 0; i < coins.length; i++) {
            const currency = coins[i];
            const id = this.safeString (currency, 'coin');
            const name = this.safeString (currency, 'coinFulName');
            const code = this.safeCurrencyCode (id);
            let deposit = undefined;
            let withdraw = undefined;
            let minWithdrawString = undefined;
            let maxWithdrawString = undefined;
            let minWithdrawFeeString = undefined;
            const networkDetails = this.safeValue (currency, 'chainDetail', []);
            const networks = {};
            for (let j = 0; j < networkDetails.length; j++) {
                const entry = networkDetails[j];
                const networkId = this.safeString (entry, 'chain');
                const network = this.networkIdToCode (networkId, code);
                const enableDeposit = this.safeValue (entry, 'enableDeposit');
                deposit = (enableDeposit) ? enableDeposit : deposit;
                const enableWithdraw = this.safeValue (entry, 'enableWithdraw');
                withdraw = (enableWithdraw) ? enableWithdraw : withdraw;
                const networkWithdrawFeeString = this.safeString (entry, 'withdrawFee');
                if (networkWithdrawFeeString !== undefined) {
                    minWithdrawFeeString = (minWithdrawFeeString === undefined) ? networkWithdrawFeeString : Precise.stringMin (networkWithdrawFeeString, minWithdrawFeeString);
                }
                const networkMinWithdrawString = this.safeString (entry, 'minWithdraw');
                if (networkMinWithdrawString !== undefined) {
                    minWithdrawString = (minWithdrawString === undefined) ? networkMinWithdrawString : Precise.stringMin (networkMinWithdrawString, minWithdrawString);
                }
                const networkMaxWithdrawString = this.safeString (entry, 'maxWithdraw');
                if (networkMaxWithdrawString !== undefined) {
                    maxWithdrawString = (maxWithdrawString === undefined) ? networkMaxWithdrawString : Precise.stringMax (networkMaxWithdrawString, maxWithdrawString);
                }
                networks[network] = {
                    'info': entry,
                    'id': networkId,
                    'network': network,
                    'deposit': enableDeposit,
                    'withdraw': enableWithdraw,
                    'active': enableDeposit && enableWithdraw,
                    'fee': this.parseNumber (networkWithdrawFeeString),
                    'precision': undefined,
                    'limits': {
                        'withdraw': {
                            'min': this.parseNumber (networkMinWithdrawString),
                            'max': this.parseNumber (networkMaxWithdrawString),
                        },
                    },
                };
            }
            result[code] = {
                'id': id,
                'name': name,
                'code': code,
                'precision': undefined,
                'info': currency,
                'active': deposit && withdraw,
                'deposit': deposit,
                'withdraw': withdraw,
                'networks': networks,
                'fee': this.parseNumber (minWithdrawFeeString),
                // 'fees': fees,
                'limits': {
                    'withdraw': {
                        'min': this.parseNumber (minWithdrawString),
                        'max': this.parseNumber (maxWithdrawString),
                    },
                },
            };
        }
        return result;
    }

    parseMarket (market) {
        let type = undefined;
        const side = this.safeInteger (market, 'side'); // 1 linear, 0 inverse, undefined spot
        if (side === undefined) {
            type = 'spot';
        } else {
            type = 'future';
        }
        const id = this.safeString (market, 'symbol');
        const lowercaseId = this.safeStringLower (market, 'symbol');
        let baseId = this.safeString (market, 'baseAsset');
        let quoteId = this.safeString (market, 'quoteAsset');
        if (type === 'future') {
            const symbolSplit = id.split ('-');
            baseId = this.safeString (symbolSplit, 1);
            quoteId = this.safeString (symbolSplit, 2);
        }
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const filters = this.safeValue (market, 'filters', []);
        const filtersByType = this.indexBy (filters, 'filterType');
        const status = this.safeString (market, 'status');
        const priceFilter = this.safeValue (filtersByType, 'PRICE_FILTER', {});
        const amountFilter = this.safeValue (filtersByType, 'LOT_SIZE', {});
        const defaultPricePrecision = this.safeString (market, 'pricePrecision');
        const defaultAmountPrecision = this.safeString (market, 'quantityPrecision');
        const pricePrecision = this.safeString (priceFilter, 'priceScale', defaultPricePrecision);
        const amountPrecision = this.safeString (amountFilter, 'volumeScale', defaultAmountPrecision);
        const entry = {
            'id': id,
            'lowercaseId': lowercaseId,
            'symbol': (type === 'spot') ? (base + '/' + quote) : id,
            'base': base,
            'quote': quote,
            'settle': undefined,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': undefined,
            'type': type,
            'spot': (type === 'spot'),
            'margin': false,
            'swap': false,
            'future': (type === 'future'),
            'option': false,
            'active': (status === 'TRADING'),
            'contract': (type !== 'spot'),
            'linear': (side !== undefined && side === 1),
            'inverse': (side !== undefined && side === 0),
            'contractSize': this.safeString (market, 'multiplier'),
            'expiry': undefined,
            'expiryDatetime': undefined,
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': this.parseNumber (this.parsePrecision (amountPrecision)),
                'price': this.parseNumber (this.parsePrecision (pricePrecision)),
                'base': this.parseNumber (this.parsePrecision (this.safeString (market, 'baseAssetPrecision'))),
                'quote': this.parseNumber (this.parsePrecision (this.safeString (market, 'quotePrecision'))),
            },
            'limits': {
                'leverage': {
                    'min': undefined,
                    'max': undefined,
                },
                'amount': {
                    'min': this.safeNumber (amountFilter, 'minQty', this.safeNumber (market, 'minOrderVolume')),
                    'max': this.safeNumber (amountFilter, 'maxQty', this.safeNumber (market, 'maxMarketVolume')),
                },
                'price': {
                    'min': this.safeNumber (priceFilter, 'minPrice', this.safeNumber (market, 'minOrderMoney')),
                    'max': this.safeNumber (priceFilter, 'maxPrice', this.safeNumber (market, 'maxMarketMoney')),
                },
                'cost': {
                    'min': this.safeNumber (amountFilter, 'minVal'),
                    'max': undefined,
                },
            },
            'created': undefined,
            'info': market,
        };
        return entry;
    }

    async fetchMarkets (params = {}) {
        /**
         * @method
         * @name bitrue#fetchMarkets
         * @description retrieves data on all markets for bitrue
         * @see https://www.bitrue.com/api-docs#current-open-contract
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#current-open-contract
         * @param {object} [params] extra parameters specific to the exchange api endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const promisesRaw = [];
        const fetchMarkets = this.safeValue (this.options, 'fetchMarkets', [ 'spot', 'linear', 'inverse' ]);
        for (let i = 0; i < fetchMarkets.length; i++) {
            const marketType = fetchMarkets[i];
            if (marketType === 'spot') {
                promisesRaw.push (this.spotV1PublicGetExchangeInfo (params));
            } else if (marketType === 'linear') {
                promisesRaw.push (this.fapiV1PublicGetContracts (params));
            } else if (marketType === 'inverse') {
                promisesRaw.push (this.dapiV1PublicGetContracts (params));
            } else {
                throw new ExchangeError (this.id + ' fetchMarkets() this.options fetchMarkets "' + marketType + '" is not a supported market type');
            }
        }
        const promises = await Promise.all (promisesRaw);
        const spotMarkets = this.safeValue (this.safeValue (promises, 0), 'symbols', []);
        const futureMarkets = this.safeValue (promises, 1);
        const deliveryMarkets = this.safeValue (promises, 2);
        let markets = spotMarkets;
        markets = this.arrayConcat (markets, futureMarkets);
        markets = this.arrayConcat (markets, deliveryMarkets);
        //
        // spot
        //
        //     {
        //         "timezone":"CTT",
        //         "serverTime":1635464889117,
        //         "rateLimits":[
        //             {"rateLimitType":"REQUESTS_WEIGHT","interval":"MINUTES","limit":6000},
        //             {"rateLimitType":"ORDERS","interval":"SECONDS","limit":150},
        //             {"rateLimitType":"ORDERS","interval":"DAYS","limit":288000},
        //         ],
        //         "exchangeFilters":[],
        //         "symbols":[
        //             {
        //                 "symbol":"SHABTC",
        //                 "status":"TRADING",
        //                 "baseAsset":"sha",
        //                 "baseAssetPrecision":0,
        //                 "quoteAsset":"btc",
        //                 "quotePrecision":10,
        //                 "orderTypes":["MARKET","LIMIT"],
        //                 "icebergAllowed":false,
        //                 "filters":[
        //                     {"filterType":"PRICE_FILTER","minPrice":"0.00000001349","maxPrice":"0.00000017537","priceScale":10},
        //                     {"filterType":"LOT_SIZE","minQty":"1.0","minVal":"0.00020","maxQty":"1000000000","volumeScale":0},
        //                 ],
        //                 "defaultPrice":"0.0000006100",
        //             },
        //         ],
        //         "coins":[
        //             {
        //                 "coin":"sbr",
        //                 "coinFulName":"Saber",
        //                 "enableWithdraw":true,
        //                 "enableDeposit":true,
        //                 "chains":["SOLANA"],
        //                 "withdrawFee":"2.0",
        //                 "minWithdraw":"5.0",
        //                 "maxWithdraw":"1000000000000000",
        //             },
        //         ],
        //     }
        //
        // future
        //
        //     [
        //         {
        //           "symbol": "H-HT-USDT",
        //           "pricePrecision": 8,
        //           "side": 1,
        //           "maxMarketVolume": 100000,
        //           "multiplier": 6,
        //           "minOrderVolume": 1,
        //           "maxMarketMoney": 10000000,
        //           "type": "H",
        //           "maxLimitVolume": 1000000,
        //           "maxValidOrder": 20,
        //           "multiplierCoin": "HT",
        //           "minOrderMoney": 0.001,
        //           "maxLimitMoney": 1000000,
        //           "status": 1
        //         }
        //     ]
        //
        if (this.options['adjustForTimeDifference']) {
            await this.loadTimeDifference ();
        }
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            result.push (this.parseMarket (markets[i]));
        }
        return result;
    }

    parseBalance (response): Balances {
        // spot
        //
        //     {
        //         "makerCommission":0,
        //         "takerCommission":0,
        //         "buyerCommission":0,
        //         "sellerCommission":0,
        //         "updateTime":null,
        //         "balances":[
        //             {"asset":"sbr","free":"0","locked":"0"},
        //             {"asset":"ksm","free":"0","locked":"0"},
        //             {"asset":"neo3s","free":"0","locked":"0"},
        //         ],
        //         "canTrade":false,
        //         "canWithdraw":false,
        //         "canDeposit":false
        //     }
        //
        // future
        //
        //     {
        //         "account":[
        //             {
        //                 "marginCoin":"USDT",
        //                 "coinPrecious":4,
        //                 "accountNormal":1010.4043400372839856,
        //                 "accountLock":2.9827889600000006,
        //                 "partPositionNormal":0,
        //                 "totalPositionNormal":0,
        //                 "achievedAmount":0,
        //                 "unrealizedAmount":0,
        //                 "totalMarginRate":0,
        //                 "totalEquity":1010.4043400372839856,
        //                 "partEquity":0,
        //                 "totalCost":0,
        //                 "sumMarginRate":0,
        //                 "sumOpenRealizedAmount":0,
        //                 "canUseTrialFund":0,
        //                 "sumMaintenanceMargin":null,
        //                 "futureModel":null,
        //                 "positionVos":[]
        //             }
        //         ]
        //     }
        //
        const result = {
            'info': response,
        };
        const timestamp = this.safeInteger (response, 'updateTime');
        const balances = this.safeValue2 (response, 'balances', 'account', []);
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString2 (balance, 'asset', 'marginCoin');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString2 (balance, 'free', 'accountNormal');
            account['used'] = this.safeString2 (balance, 'locked', 'accountLock');
            result[code] = account;
        }
        result['timestamp'] = timestamp;
        result['datetime'] = this.iso8601 (timestamp);
        return this.safeBalance (result);
    }

    async fetchBalance (params = {}) {
        /**
         * @method
         * @name bitrue#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#account-information-user_data
         * @see https://www.bitrue.com/api-docs#account-information-v2-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#account-information-v2-user_data-hmac-sha256
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @param {string} [params.type] 'future', 'delivery', 'spot', 'swap'
         * @param {string} [params.subType] 'linear', 'inverse'
         * @returns {object} a [balance structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#balance-structure}
         */
        await this.loadMarkets ();
        const defaultType = this.safeString2 (this.options, 'fetchBalance', 'defaultType', 'spot');
        const type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchBalance', undefined, params);
        let response = undefined;
        let result = undefined;
        if (this.isLinear (type, subType)) {
            response = await this.fapiV2PrivateGetAccount (params);
            result = this.safeValue (response, 'data', {});
            //
            //     {
            //         "code":"0",
            //         "msg":"Success",
            //         "data":{
            //             "account":[
            //                 {
            //                     "marginCoin":"USDT",
            //                     "coinPrecious":4,
            //                     "accountNormal":1010.4043400372839856,
            //                     "accountLock":2.9827889600000006,
            //                     "partPositionNormal":0,
            //                     "totalPositionNormal":0,
            //                     "achievedAmount":0,
            //                     "unrealizedAmount":0,
            //                     "totalMarginRate":0,
            //                     "totalEquity":1010.4043400372839856,
            //                     "partEquity":0,
            //                     "totalCost":0,
            //                     "sumMarginRate":0,
            //                     "sumOpenRealizedAmount":0,
            //                     "canUseTrialFund":0,
            //                     "sumMaintenanceMargin":null,
            //                     "futureModel":null,
            //                     "positionVos":[]
            //                 }
            //             ]
            //         }
            //     }
            //
        } else if (this.isInverse (type, subType)) {
            response = await this.dapiV2PrivateGetAccount (params);
            result = this.safeValue (response, 'data', {});
            //
            // {
            //         "code":"0",
            //         "msg":"Success",
            //         "data":{
            //             "account":[
            //                 {
            //                     "marginCoin":"USD",
            //                     "coinPrecious":4,
            //                     "accountNormal":1010.4043400372839856,
            //                     "accountLock":2.9827889600000006,
            //                     "partPositionNormal":0,
            //                     "totalPositionNormal":0,
            //                     "achievedAmount":0,
            //                     "unrealizedAmount":0,
            //                     "totalMarginRate":0,
            //                     "totalEquity":1010.4043400372839856,
            //                     "partEquity":0,
            //                     "totalCost":0,
            //                     "sumMarginRate":0,
            //                     "sumOpenRealizedAmount":0,
            //                     "canUseTrialFund":0,
            //                     "sumMaintenanceMargin":null,
            //                     "futureModel":null,
            //                     "positionVos":[]
            //                 }
            //             ]
            //         }
            //     }
            //
        } else {
            response = await this.spotV1PrivateGetAccount (params);
            result = response;
            //
            //     {
            //         "makerCommission":0,
            //         "takerCommission":0,
            //         "buyerCommission":0,
            //         "sellerCommission":0,
            //         "updateTime":null,
            //         "balances":[
            //             {"asset":"sbr","free":"0","locked":"0"},
            //             {"asset":"ksm","free":"0","locked":"0"},
            //             {"asset":"neo3s","free":"0","locked":"0"},
            //         ],
            //         "canTrade":false,
            //         "canWithdraw":false,
            //         "canDeposit":false
            //     }
            //
        }
        return this.parseBalance (result);
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#order-book
         * @see https://www.bitrue.com/api-docs#order-book
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#order-book
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchOrderBook', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchOrderBook', market, params);
        let response = undefined;
        if (market['future']) {
            const request = {
                'contractName': market['id'],
            };
            if (limit !== undefined) {
                if (limit > 100) {
                    limit = 100;
                }
                request['limit'] = limit; // default 100, max 1000, see https://www.bitrue.com/api-docs#order-book
            }
            if (this.isLinear (type, subType)) {
                response = await this.fapiV1PublicGetDepth (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV1PublicGetDepth (this.extend (request, params));
            }
        } else if (market['spot']) {
            const request = {
                'symbol': market['id'],
            };
            if (limit !== undefined) {
                if (limit > 1000) {
                    limit = 1000;
                }
                request['limit'] = limit; // default 100, max 1000, see https://github.com/Bitrue-exchange/bitrue-official-api-docs#order-book
            }
            response = await this.spotV1PublicGetDepth (this.extend (request, params));
        } else {
            throw new NotSupported (this.id + ' fetchOrderBook only support spot & future markets');
        }
        //
        // spot
        //
        //     {
        //         "lastUpdateId":1635474910177,
        //         "bids":[
        //             ["61436.84","0.05",[]],
        //             ["61435.77","0.0124",[]],
        //             ["61434.88","0.012",[]],
        //         ],
        //         "asks":[
        //             ["61452.46","0.0001",[]],
        //             ["61452.47","0.0597",[]],
        //             ["61452.76","0.0713",[]],
        //         ]
        //     }
        //
        // future
        //
        //     {
        //         "asks": [[34916.5, 2582], [34916.6, 2193], [34916.7, 2629], [34916.8, 3478], [34916.9, 2718]],
        //         "bids": [[34916.4, 92065], [34916.3, 25703], [34916.2, 37259], [34916.1, 26446], [34916, 44456]],
        //         "time": 1699338305000
        //     }
        //
        const timestamp = this.safeInteger (response, 'time');
        const orderbook = this.parseOrderBook (response, symbol, timestamp);
        orderbook['nonce'] = this.safeInteger (response, 'lastUpdateId');
        return orderbook;
    }

    parseTicker (ticker, market = undefined): Ticker {
        //
        // fetchBidsAsks
        //
        //     {
        //         "symbol": "LTCBTC",
        //         "bidPrice": "4.00000000",
        //         "bidQty": "431.00000000",
        //         "askPrice": "4.00000200",
        //         "askQty": "9.00000000"
        //     }
        //
        // fetchTicker
        //
        //     {
        //         "symbol": "BNBBTC",
        //         "priceChange": "0.000248",
        //         "priceChangePercent": "3.5500",
        //         "weightedAvgPrice": null,
        //         "prevClosePrice": null,
        //         "lastPrice": "0.007226",
        //         "lastQty": null,
        //         "bidPrice": "0.007208",
        //         "askPrice": "0.007240",
        //         "openPrice": "0.006978",
        //         "highPrice": "0.007295",
        //         "lowPrice": "0.006935",
        //         "volume": "11749.86",
        //         "quoteVolume": "84.1066211",
        //         "openTime": 0,
        //         "closeTime": 0,
        //         "firstId": 0,
        //         "lastId": 0,
        //         "count": 0
        //     }
        //
        const symbol = this.safeSymbol (undefined, market);
        const last = this.safeString2 (ticker, 'lastPrice', 'last');
        const timestamp = this.safeInteger (ticker, 'time');
        let percentage = undefined;
        if (market['future']) {
            percentage = Precise.stringMul (this.safeString (ticker, 'rose'), '100');
        } else {
            percentage = this.safeString (ticker, 'priceChangePercent');
        }
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeString2 (ticker, 'highPrice', 'high'),
            'low': this.safeString2 (ticker, 'lowPrice', 'low'),
            'bid': this.safeString2 (ticker, 'bidPrice', 'buy'),
            'bidVolume': this.safeString (ticker, 'bidQty'),
            'ask': this.safeString2 (ticker, 'askPrice', 'sell'),
            'askVolume': this.safeString (ticker, 'askQty'),
            'vwap': this.safeString (ticker, 'weightedAvgPrice'),
            'open': this.safeString (ticker, 'openPrice'),
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': this.safeString (ticker, 'priceChange'),
            'percentage': percentage,
            'average': undefined,
            'baseVolume': this.safeString2 (ticker, 'volume', 'vol'),
            'quoteVolume': this.safeString (ticker, 'quoteVolume'),
            'info': ticker,
        }, market);
    }

    async fetchTicker (symbol: string, params = {}) {
        /**
         * @method
         * @name bitrue#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#24hr-ticker-price-change-statistics
         * @see https://www.bitrue.com/api-docs#ticker
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#ticker
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a [ticker structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchTicker', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchTicker', market, params);
        let response = undefined;
        let data = undefined;
        if (market['future']) {
            const request = {
                'contractName': market['id'],
            };
            if (this.isLinear (type, subType)) {
                response = await this.fapiV1PublicGetTicker (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV1PublicGetTicker (this.extend (request, params));
            }
            data = response;
        } else if (market['spot']) {
            const request = {
                'symbol': market['id'],
            };
            response = await this.spotV1PublicGetTicker24hr (this.extend (request, params));
            data = this.safeValue (response, 0, {});
        } else {
            throw new NotSupported (this.id + ' fetchTicker only support spot & future markets');
        }
        //
        // spot
        //
        //     [{
        //         symbol: 'BTCUSDT',
        //         priceChange: '105.20',
        //         priceChangePercent: '0.3000',
        //         weightedAvgPrice: null,
        //         prevClosePrice: null,
        //         lastPrice: '34905.21',
        //         lastQty: null,
        //         bidPrice: '34905.21',
        //         askPrice: '34905.22',
        //         openPrice: '34800.01',
        //         highPrice: '35276.33',
        //         lowPrice: '34787.51',
        //         volume: '12549.6481',
        //         quoteVolume: '439390492.917',
        //         openTime: '0',
        //         closeTime: '0',
        //         firstId: '0',
        //         lastId: '0',
        //         count: '0'
        //     }]
        //
        // future
        //
        //     {
        //         "high": "35296",
        //         "vol": "779308354",
        //         "last": "34884.1",
        //         "low": "34806.7",
        //         "buy": 34883.9,
        //         "sell": 34884,
        //         "rose": "-0.0027957315",
        //         "time": 1699348013000
        //     }
        //
        return this.parseTicker (data, market);
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#kline-data
         * @see https://www.bitrue.com/api-docs#kline-candlestick-data
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#kline-candlestick-data
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const timeframes = this.safeValue (this.options, 'timeframes', {});
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchOHLCV', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchOHLCV', market, params);
        let response = undefined;
        let data = undefined;
        if (market['future']) {
            const timeframesFuture = this.safeValue (timeframes, 'future', {});
            const request = {
                'contractName': market['id'],
                // 1min / 5min / 15min / 30min / 1h / 1day / 1week / 1month
                'interval': this.safeString (timeframesFuture, timeframe, '1min'),
            };
            if (limit !== undefined) {
                if (limit > 300) {
                    limit = 300;
                }
                request['limit'] = limit;
            }
            if (this.isLinear (type, subType)) {
                response = await this.fapiV1PublicGetKlines (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV1PublicGetKlines (this.extend (request, params));
            }
            data = response;
        } else if (market['spot']) {
            const timeframesSpot = this.safeValue (timeframes, 'spot', {});
            const request = {
                'symbol': market['id'],
                // 1m / 5m / 15m / 30m / 1H / 2H / 4H / 12H / 1D / 1W
                'scale': this.safeString (timeframesSpot, timeframe, '1m'),
            };
            if (limit !== undefined) {
                if (limit > 1440) {
                    limit = 1440;
                }
                request['limit'] = limit;
            }
            if (since !== undefined) {
                request['fromIdx'] = since;
            }
            response = await this.spotV1PublicGetMarketKline (this.extend (request, params));
            data = this.safeValue (response, 'data', []);
        } else {
            throw new NotSupported (this.id + ' fetchOHLCV only support spot & future markets');
        }
        //
        // spot
        //
        //       {
        //           "symbol":"BTCUSDT",
        //           "scale":"KLINE_1MIN",
        //           "data":[
        //                {
        //                   "i":"1660825020",
        //                   "a":"93458.778",
        //                   "v":"3.9774",
        //                   "c":"23494.99",
        //                   "h":"23509.63",
        //                   "l":"23491.93",
        //                   "o":"23508.34"
        //                }
        //           ]
        //       }
        //
        // future
        //
        //     [
        //         {
        //           "high": "35360.7",
        //           "vol": "110288",
        //           "low": "35347.9",
        //           "idx": 1699411680000,
        //           "close": "35347.9",
        //           "open": "35349.4"
        //         }
        //     ]
        //
        return this.parseOHLCVs (data, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market = undefined): OHLCV {
        //
        // spot
        //
        //      {
        //         "i":"1660825020",
        //         "a":"93458.778",
        //         "v":"3.9774",
        //         "c":"23494.99",
        //         "h":"23509.63",
        //         "l":"23491.93",
        //         "o":"23508.34"
        //      }
        //
        // future
        //
        //     {
        //         "high": "35360.7",
        //         "vol": "110288",
        //         "low": "35347.9",
        //         "idx": 1699411680000,
        //         "close": "35347.9",
        //         "open": "35349.4"
        //     }
        //
        return [
            this.safeTimestamp2 (ohlcv, 'i', 'idx'),
            this.safeNumber2 (ohlcv, 'o', 'open'),
            this.safeNumber2 (ohlcv, 'h', 'high'),
            this.safeNumber2 (ohlcv, 'l', 'low'),
            this.safeNumber2 (ohlcv, 'c', 'close'),
            this.safeNumber2 (ohlcv, 'v', 'vol'),
        ];
    }

    async fetchBidsAsks (symbols: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchBidsAsks
         * @description fetches the bid and ask price and volume for multiple markets
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#symbol-order-book-ticker
         * @see https://www.bitrue.com/api-docs#ticker
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#ticker
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the bids and asks for, all markets are returned if not assigned
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#ticker-structure}
         */
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols, undefined, false);
        let market = undefined;
        if (symbols !== undefined) {
            const first = this.safeString (symbols, 0);
            market = this.market (first);
        }
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchBidsAsks', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchBidsAsks', market, params);
        let response = undefined;
        if (market['future']) {
            const request = {
                'contractName': market['id'],
            };
            if (this.isLinear (type, subType)) {
                response = await this.fapiV1PublicGetTicker (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV1PublicGetTicker (this.extend (request, params));
            }
        } else if (market['spot']) {
            const request = {
                'symbol': market['id'],
            };
            response = await this.spotV1PublicGetTickerBookTicker (this.extend (request, params));
        } else {
            throw new NotSupported (this.id + ' fetchBidsAsks only support spot & future markets');
        }
        //
        // spot
        //
        //     {
        //         "symbol": "LTCBTC",
        //         "bidPrice": "4.00000000",
        //         "bidQty": "431.00000000",
        //         "askPrice": "4.00000200",
        //         "askQty": "9.00000000"
        //     }
        //
        // future
        //
        //     {
        //         "high": "35296",
        //         "vol": "779308354",
        //         "last": "34884.1",
        //         "low": "34806.7",
        //         "buy": 34883.9,
        //         "sell": 34884,
        //         "rose": "-0.0027957315",
        //         "time": 1699348013000
        //     }
        //
        const data = {};
        data[market['id']] = response;
        return this.parseTickers (data, symbols);
    }

    async fetchTickers (symbols: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchTickers
         * @description fetches price tickers for multiple markets, statistical calculations with the information calculated over the past 24 hours each market
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#24hr-ticker-price-change-statistics
         * @see https://www.bitrue.com/api-docs#ticker
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#ticker
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#ticker-structure}
         */
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols);
        let response = undefined;
        let data = undefined;
        const request = {};
        if (symbols !== undefined) {
            const first = this.safeString (symbols, 0);
            const market = this.market (first);
            let type = undefined;
            [ type, params ] = this.handleMarketTypeAndParams ('fetchTickers', market, params);
            let subType = undefined;
            [ subType, params ] = this.handleSubTypeAndParams ('fetchTickers', market, params);
            if (market['future']) {
                request['contractName'] = market['id'];
                if (this.isLinear (type, subType)) {
                    response = await this.fapiV1PublicGetTicker (this.extend (request, params));
                } else if (this.isInverse (type, subType)) {
                    response = await this.dapiV1PublicGetTicker (this.extend (request, params));
                }
                response['symbol'] = market['id'];
                data = [ response ];
            } else if (market['spot']) {
                request['symbol'] = market['id'];
                response = await this.spotV1PublicGetTicker24hr (this.extend (request, params));
                data = response;
            } else {
                throw new NotSupported (this.id + ' fetchTickers only support spot & future markets');
            }
        } else {
            response = await this.spotV1PublicGetTicker24hr (this.extend (request, params));
            data = response;
        }
        //
        // spot
        //
        //     [{
        //         symbol: 'BTCUSDT',
        //         priceChange: '105.20',
        //         priceChangePercent: '0.3000',
        //         weightedAvgPrice: null,
        //         prevClosePrice: null,
        //         lastPrice: '34905.21',
        //         lastQty: null,
        //         bidPrice: '34905.21',
        //         askPrice: '34905.22',
        //         openPrice: '34800.01',
        //         highPrice: '35276.33',
        //         lowPrice: '34787.51',
        //         volume: '12549.6481',
        //         quoteVolume: '439390492.917',
        //         openTime: '0',
        //         closeTime: '0',
        //         firstId: '0',
        //         lastId: '0',
        //         count: '0'
        //     }]
        //
        // future
        //
        //     {
        //         "high": "35296",
        //         "vol": "779308354",
        //         "last": "34884.1",
        //         "low": "34806.7",
        //         "buy": 34883.9,
        //         "sell": 34884,
        //         "rose": "-0.0027957315",
        //         "time": 1699348013000
        //     }
        //
        // the exchange returns market ids with an underscore from the tickers endpoint
        // the market ids do not have an underscore, so it has to be removed
        // https://github.com/ccxt/ccxt/issues/13856
        const tickers = {};
        for (let i = 0; i < data.length; i++) {
            const ticker = this.safeValue (data, i, {});
            const market = this.market (this.safeValue (ticker, 'symbol'));
            tickers[market['id']] = ticker;
        }
        return this.parseTickers (tickers, symbols);
    }

    parseTrade (trade, market = undefined): Trade {
        //
        // fetchTrades
        //
        //     {
        //         "id": 28457,
        //         "price": "4.00000100",
        //         "qty": "12.00000000",
        //         "time": 1499865549590,  // Actual timestamp of trade
        //         "isBuyerMaker": true,
        //         "isBestMatch": true
        //     }
        //
        // fetchTrades - spot
        //
        //     {
        //         "symbol":"USDCUSDT",
        //         "id":20725156,
        //         "orderId":2880918576,
        //         "origClientOrderId":null,
        //         "price":"0.9996000000000000",
        //         "qty":"100.0000000000000000",
        //         "commission":null,
        //         "commissionAssert":null,
        //         "time":1635558511000,
        //         "isBuyer":false,
        //         "isMaker":false,
        //         "isBestMatch":true
        //     }
        //
        // fetchTrades - future
        //
        //     {
        //         "tradeId":12,
        //         "price":0.9,
        //         "qty":1,
        //         "amount":9,
        //         "contractName":"E-SAND-USDT",
        //         "side":"BUY",
        //         "fee":"0.0018",
        //         "bidId":1558124009467904992,
        //         "askId":1558124043827644908,
        //         "bidUserId":10294,
        //         "askUserId":10467,
        //         "isBuyer":true,
        //         "isMaker":true,
        //         "ctime":1678426306000
        //     }
        //
        const timestamp = this.safeInteger2 (trade, 'ctime', 'time');
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'qty');
        const marketId = this.safeString2 (trade, 'symbol', 'contractName');
        const symbol = this.safeSymbol (marketId, market);
        const orderId = this.safeString (trade, 'orderId');
        const id = this.safeString2 (trade, 'id', 'tradeId');
        let side = undefined;
        const buyerMaker = this.safeValue (trade, 'isBuyerMaker');  // ignore "m" until Bitrue fixes api
        const isBuyer = this.safeValue (trade, 'isBuyer');
        if (buyerMaker !== undefined) {
            side = buyerMaker ? 'sell' : 'buy';
        }
        if (isBuyer !== undefined) {
            side = isBuyer ? 'buy' : 'sell'; // this is a true side
        }
        let fee = undefined;
        if ('commission' in trade) {
            fee = {
                'cost': this.safeString2 (trade, 'commission', 'fee'),
                'currency': this.safeCurrencyCode (this.safeString (trade, 'commissionAssert')),
            };
        }
        let takerOrMaker = undefined;
        const isMaker = this.safeValue (trade, 'isMaker');
        if (isMaker !== undefined) {
            takerOrMaker = isMaker ? 'maker' : 'taker';
        }
        return this.safeTrade ({
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'id': id,
            'order': orderId,
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': priceString,
            'amount': amountString,
            'cost': undefined,
            'fee': fee,
        }, market);
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#recent-trades-list
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let response = undefined;
        if (market['spot']) {
            const request = {
                'symbol': market['id'],
                // 'limit': 100, // default 100, max = 1000
            };
            if (limit !== undefined) {
                request['limit'] = limit; // default 100, max 1000
            }
            response = await this.spotV1PublicGetTrades (this.extend (request, params));
        } else {
            throw new NotSupported (this.id + ' fetchTrades only support spot markets');
        }
        //
        // spot
        //
        //     [
        //         {
        //             "id": 28457,
        //             "price": "4.00000100",
        //             "qty": "12.00000000",
        //             "time": 1499865549590,
        //             "isBuyerMaker": true,
        //             "isBestMatch": true
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseOrderStatus (status) {
        const statuses = {
            'INIT': 'open',
            'PENDING_CREATE': 'open',
            'NEW': 'open',
            'PARTIALLY_FILLED': 'open',
            'FILLED': 'closed',
            'CANCELED': 'canceled',
            'PENDING_CANCEL': 'canceling', // currently unused
            'REJECTED': 'rejected',
            'EXPIRED': 'expired',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined): Order {
        //
        // createOrder - spot
        //
        //     {
        //         "symbol":"USDCUSDT",
        //         "orderId":2878854881,
        //         "clientOrderId":"",
        //         "transactTime":1635551031276
        //     }
        //
        // createOrder - future
        //
        //     {
        //         "orderId":1690615676032452985,
        //     }
        //
        // fetchOrders - spot
        //
        //     {
        //         "symbol":"USDCUSDT",
        //         "orderId":"2878854881",
        //         "clientOrderId":"",
        //         "price":"1.1000000000000000",
        //         "origQty":"100.0000000000000000",
        //         "executedQty":"0.0000000000000000",
        //         "cummulativeQuoteQty":"0.0000000000000000",
        //         "status":"NEW",
        //         "timeInForce":"",
        //         "type":"LIMIT",
        //         "side":"SELL",
        //         "stopPrice":"",
        //         "icebergQty":"",
        //         "time":1635551031000,
        //         "updateTime":1635551031000,
        //         "isWorking":false
        //     }
        //
        // fetchOrders - future
        //
        //     {
        //         "orderId":1917641,
        //         "price":100,
        //         "origQty":10,
        //         "origAmount":10,
        //         "executedQty":1,
        //         "avgPrice":10000,
        //         "status":"INIT",
        //         "type":"LIMIT",
        //         "side":"BUY",
        //         "action":"OPEN",
        //         "transactTime":1686716571425
        //         "clientOrderId":4949299210
        //     }
        //
        const status = this.parseOrderStatus (this.safeString2 (order, 'status', 'orderStatus'));
        const marketId = this.safeString (order, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const filled = this.safeString (order, 'executedQty');
        let timestamp = undefined;
        let lastTradeTimestamp = undefined;
        if ('time' in order) {
            timestamp = this.safeInteger (order, 'time');
        } else if ('transactTime' in order) {
            timestamp = this.safeInteger (order, 'transactTime');
        } else if ('updateTime' in order) {
            if (status === 'open') {
                if (Precise.stringGt (filled, '0')) {
                    lastTradeTimestamp = this.safeInteger (order, 'updateTime');
                } else {
                    timestamp = this.safeInteger (order, 'updateTime');
                }
            }
        }
        const average = this.safeString (order, 'avgPrice');
        const price = this.safeString (order, 'price');
        const amount = this.safeString (order, 'origQty');
        // - Spot/Margin market: cummulativeQuoteQty
        // - Futures market: cumQuote.
        //   Note this is not the actual cost, since Binance futures uses leverage to calculate margins.
        const cost = this.safeString2 (order, 'cummulativeQuoteQty', 'cumQuote');
        const id = this.safeString (order, 'orderId');
        let type = this.safeStringLower (order, 'type');
        const side = this.safeStringLower (order, 'side');
        const fills = this.safeValue (order, 'fills', []);
        const clientOrderId = this.safeString (order, 'clientOrderId');
        const timeInForce = this.safeString (order, 'timeInForce');
        const postOnly = (type === 'limit_maker') || (timeInForce === 'GTX');
        if (type === 'limit_maker') {
            type = 'limit';
        }
        const stopPriceString = this.safeString (order, 'stopPrice');
        const stopPrice = this.parseNumber (this.omitZero (stopPriceString));
        return this.safeOrder ({
            'info': order,
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'side': side,
            'price': price,
            'stopPrice': stopPrice,
            'triggerPrice': stopPrice,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': undefined,
            'status': status,
            'fee': undefined,
            'trades': fills,
        }, market);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount, price = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#createOrder
         * @description create a trade order
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#recent-trades-list
         * @see https://www.bitrue.com/api-docs#new-order-trade-hmac-sha256
         * @see @see https://www.bitrue.com/api_docs_includes_file/delivery.html#new-order-trade-hmac-sha256
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float} [price] the price at which the order is to be fullfilled, in units of the quote currency, ignored in market orders
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @param {float} [params.triggerPrice] the price at which a trigger order is triggered at
         * @param {string} [params.clientOrderId] a unique id for the order, automatically generated if not sent
         *
         * EXCHANGE SPECIFIC PARAMETERS
         * @param {decimal} [params.icebergQty]
         * @param {long} [params.recvWindow]
         * @returns {object} an [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let marketType = undefined;
        [ marketType, params ] = this.handleMarketTypeAndParams ('createOrder', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('createOrder', market, params);
        let response = undefined;
        let data = undefined;
        const uppercaseType = type.toUpperCase ();
        const request = {
            'side': side.toUpperCase (),
            'type': uppercaseType,
            // 'timeInForce': '',
            // 'price': this.priceToPrecision (symbol, price),
            // 'newClientOrderId': clientOrderId, // automatically generated if not sent
            // 'stopPrice': this.priceToPrecision (symbol, 'stopPrice'),
            // 'icebergQty': this.amountToPrecision (symbol, icebergQty),
        };
        if (uppercaseType === 'LIMIT') {
            if (price === undefined) {
                throw new InvalidOrder (this.id + ' createOrder() requires a price argument');
            }
            request['price'] = this.priceToPrecision (symbol, price);
        }
        if (market['future']) {
            request['contractName'] = market['id'];
            request['amount'] = this.parseNumber (amount);
            request['volume'] = this.parseNumber (amount);
            request['positionType'] = 1;
            request['open'] = 'OPEN';
            request['leverage'] = 5;
            if (this.isLinear (marketType, subType)) {
                response = await this.fapiV2PrivatePostOrder (this.extend (request, params));
            } else if (this.isInverse (marketType, subType)) {
                response = await this.dapiV2PrivatePostOrder (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', '{}');
        } else if (market['spot']) {
            request['symbol'] = market['id'];
            request['quantity'] = this.amountToPrecision (symbol, amount);
            const validOrderTypes = this.safeValue (market['info'], 'orderTypes');
            if (!this.inArray (uppercaseType, validOrderTypes)) {
                throw new InvalidOrder (this.id + ' ' + type + ' is not a valid order type in market ' + symbol);
            }
            const clientOrderId = this.safeString2 (params, 'newClientOrderId', 'clientOrderId');
            if (clientOrderId !== undefined) {
                params = this.omit (params, [ 'newClientOrderId', 'clientOrderId' ]);
                request['newClientOrderId'] = clientOrderId;
            }
            const stopPrice = this.safeValue2 (params, 'triggerPrice', 'stopPrice');
            if (stopPrice !== undefined) {
                params = this.omit (params, [ 'triggerPrice', 'stopPrice' ]);
                request['stopPrice'] = this.priceToPrecision (symbol, stopPrice);
            }
            response = await this.spotV1PrivatePostOrder (this.extend (request, params));
            data = response;
        } else {
            throw new NotSupported (this.id + ' createOrder only support spot & future markets');
        }
        //
        // spot
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "orderId": 307650651173648896,
        //         "orderIdStr": "307650651173648896",
        //         "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
        //         "transactTime": 1507725176595
        //     }
        //
        // future
        //
        //     {
        //         "code": "0",
        //         "msg": "Success",
        //         "data": {
        //             "orderId": 1690615676032452985
        //         }
        //     }
        //
        return this.parseOrder (data, market);
    }

    async fetchOrder (id: string, symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchOrder
         * @description fetches information on an order made by the user
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#query-order-user_data
         * @see https://www.bitrue.com/api-docs#query-order-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#query-order-user_data-hmac-sha256
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} An [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const origClientOrderId = this.safeValue2 (params, 'origClientOrderId', 'clientOrderId');
        params = this.omit (params, [ 'origClientOrderId', 'clientOrderId' ]);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchOrder', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchOrder', market, params);
        let response = undefined;
        let data = undefined;
        const request = {};
        if (origClientOrderId === undefined) {
            request['orderId'] = id;
        } else {
            if (market['future']) {
                request['clientOrderId'] = origClientOrderId;
            } else {
                request['origClientOrderId'] = origClientOrderId;
            }
        }
        if (market['future']) {
            request['contractName'] = market['id'];
            if (this.isLinear (type, subType)) {
                response = await this.fapiV2PrivateGetOrder (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV2PrivateGetOrder (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', {});
        } else if (market['spot']) {
            request['symbol'] = market['id'];
            response = await this.spotV1PrivateGetOrder (this.extend (request, params));
            data = response;
        } else {
            throw new NotSupported (this.id + ' fetchOrder only support spot & future markets');
        }
        //
        // spot
        //
        //     {
        //         "symbol": "LTCBTC",
        //         "orderId": 1,
        //         "clientOrderId": "myOrder1",
        //         "price": "0.1",
        //         "origQty": "1.0",
        //         "executedQty": "0.0",
        //         "cummulativeQuoteQty": "0.0",
        //         "status": "NEW",
        //         "timeInForce": "GTC",
        //         "type": "LIMIT",
        //         "side": "BUY",
        //         "stopPrice": "0.0",
        //         "icebergQty": "0.0",
        //         "time": 1499827319559,
        //         "updateTime": 1499827319559,
        //         "isWorking": true
        //     }
        //
        // future
        //
        //     {
        //         "code":0,
        //         "msg":"success",
        //         "data":{
        //             "orderId":1917641,
        //             "price":100,
        //             "origQty":10,
        //             "origAmount":10,
        //             "executedQty":1,
        //             "avgPrice":10000,
        //             "status":"INIT",
        //             "type":"LIMIT",
        //             "side":"BUY",
        //             "action":"OPEN",
        //             "transactTime":1686716571425
        //             "clientOrderId":4949299210
        //         }
        //     }
        //
        return this.parseOrder (data, market);
    }

    async fetchClosedOrders (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchClosedOrders
         * @description fetches information on multiple closed orders made by the user
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#all-orders-user_data
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of  orde structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {Order[]} a list of [order structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (!market['spot']) {
            throw new NotSupported (this.id + ' fetchClosedOrders only support spot markets');
        }
        const request = {
            'symbol': market['id'],
            // 'orderId': 123445, // long
            // 'startTime': since,
            // 'endTime': this.milliseconds (),
            // 'limit': limit, // default 100, max 1000
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit; // default 100, max 1000
        }
        const response = await this.spotV1PrivateGetAllOrders (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "LTCBTC",
        //             "orderId": 1,
        //             "clientOrderId": "myOrder1",
        //             "price": "0.1",
        //             "origQty": "1.0",
        //             "executedQty": "0.0",
        //             "cummulativeQuoteQty": "0.0",
        //             "status": "NEW",
        //             "timeInForce": "GTC",
        //             "type": "LIMIT",
        //             "side": "BUY",
        //             "stopPrice": "0.0",
        //             "icebergQty": "0.0",
        //             "time": 1499827319559,
        //             "updateTime": 1499827319559,
        //             "isWorking": true
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    async fetchOpenOrders (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#current-open-orders-user_data
         * @see https://www.bitrue.com/api-docs#current-all-open-orders-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#current-all-open-orders-user_data-hmac-sha256
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of  open orders structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {Order[]} a list of [order structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchOpenOrders', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchOpenOrders', market, params);
        let response = undefined;
        let data = undefined;
        const request = {};
        if (market['future']) {
            request['contractName'] = market['id'];
            if (this.isLinear (type, subType)) {
                response = await this.fapiV2PrivateGetOpenOrders (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV2PrivateGetOpenOrders (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', []);
        } else if (market['spot']) {
            request['symbol'] = market['id'];
            response = await this.spotV1PrivateGetOpenOrders (this.extend (request, params));
            data = response;
        } else {
            throw new NotSupported (this.id + ' fetchOpenOrders only support spot & future markets');
        }
        //
        // spot
        //
        //     [
        //         {
        //             "symbol":"USDCUSDT",
        //             "orderId":"2878854881",
        //             "clientOrderId":"",
        //             "price":"1.1000000000000000",
        //             "origQty":"100.0000000000000000",
        //             "executedQty":"0.0000000000000000",
        //             "cummulativeQuoteQty":"0.0000000000000000",
        //             "status":"NEW",
        //             "timeInForce":"",
        //             "type":"LIMIT",
        //             "side":"SELL",
        //             "stopPrice":"",
        //             "icebergQty":"",
        //             "time":1635551031000,
        //             "updateTime":1635551031000,
        //             "isWorking":false
        //         }
        //     ]
        //
        // future
        //
        //      {
        //          "code": "0",
        //          "msg": "Success",
        //          "data": [{
        //                  "orderId": 1917641,
        //                  "clientOrderId": "2488514315",
        //                  "price": 100,
        //                  "origQty": 10,
        //                  "origAmount": 10,
        //                  "executedQty": 1,
        //                  "avgPrice": 12451,
        //                  "status": "INIT",
        //                  "type": "LIMIT",
        //                  "side": "BUY",
        //                  "action": "OPEN",
        //                  "transactTime": 1686717303975
        //              }
        //          ]
        //      }
        //
        return this.parseOrders (data, market, since, limit);
    }

    async cancelOrder (id: string, symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#cancelOrder
         * @description cancels an open order
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#cancel-order-trade
         * @see https://www.bitrue.com/api-docs#cancel-order-trade-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#cancel-order-trade-hmac-sha256
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} An [order structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const origClientOrderId = this.safeValue2 (params, 'origClientOrderId', 'clientOrderId');
        params = this.omit (params, [ 'origClientOrderId', 'clientOrderId' ]);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('cancelOrder', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('cancelOrder', market, params);
        let response = undefined;
        let data = undefined;
        const request = {};
        if (origClientOrderId === undefined) {
            request['orderId'] = id;
        } else {
            if (market['future']) {
                request['clientOrderId'] = origClientOrderId;
            } else {
                request['origClientOrderId'] = origClientOrderId;
            }
        }
        if (market['future']) {
            request['contractName'] = market['id'];
            if (this.isLinear (type, subType)) {
                response = await this.fapiV2PrivatePostCancel (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV2PrivatePostCancel (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', {});
        } else if (market['spot']) {
            request['symbol'] = market['id'];
            response = await this.spotV1PrivateDeleteOrder (this.extend (request, params));
            data = response;
        } else {
            throw new NotSupported (this.id + ' cancelOrder only support spot & future markets');
        }
        //
        // spot
        //
        //     {
        //         "symbol": "LTCBTC",
        //         "origClientOrderId": "myOrder1",
        //         "orderId": 1,
        //         "clientOrderId": "cancelMyOrder1"
        //     }
        //
        // future
        //
        //     {
        //         "code": "0",
        //         "msg": "Success",
        //         "data": {
        //             "orderId": 1690615847831143159
        //         }
        //     }
        //
        return this.parseOrder (data, market);
    }

    async cancelAllOrders (symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#cancelAllOrders
         * @description cancel all open orders in a market
         * @see https://www.bitrue.com/api-docs#cancel-all-open-orders-trade-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#cancel-all-open-orders-trade-hmac-sha256
         * @param {string} symbol unified market symbol of the market to cancel orders in
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @param {string} [params.marginMode] 'cross' or 'isolated', for spot margin trading
         * @returns {object[]} a list of [order structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('cancelAllOrders', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('cancelAllOrders', market, params);
        let response = undefined;
        let data = undefined;
        if (market['future']) {
            const request = {
                'contractName': market['id'],
            };
            if (this.isLinear (type, subType)) {
                response = await this.fapiV2PrivatePostAllOpenOrders (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV2PrivatePostAllOpenOrders (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', []);
        } else {
            throw new NotSupported (this.id + ' cancelAllOrders only support future markets');
        }
        //
        // future
        //
        //      {
        //          'code': '0',
        //          'msg': 'Success',
        //          'data': null
        //      }
        //
        return this.parseOrders (data, market);
    }

    async fetchMyTrades (symbol: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchMyTrades
         * @description fetch all trades made by the user
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#account-trade-list-user_data
         * @see https://www.bitrue.com/api-docs#account-trade-list-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#account-trade-list-user_data-hmac-sha256
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trades structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#trade-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('fetchMyTrades', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('fetchMyTrades', market, params);
        let response = undefined;
        let data = undefined;
        const request = {};
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            if (limit > 1000) {
                limit = 1000;
            }
            request['limit'] = limit;
        }
        if (market['future']) {
            request['contractName'] = market['id'];
            if (this.isLinear (type, subType)) {
                response = await this.fapiV2PrivateGetMyTrades (this.extend (request, params));
            } else if (this.isInverse (type, subType)) {
                response = await this.dapiV2PrivateGetMyTrades (this.extend (request, params));
            }
            data = this.safeValue (response, 'data', []);
        } else if (market['spot']) {
            request['symbol'] = market['id'];
            response = await this.spotV2PrivateGetMyTrades (this.extend (request, params));
            data = response;
        } else {
            throw new NotSupported (this.id + ' fetchMyTrades only support spot & future markets');
        }
        //
        // spot
        //
        //     [
        //         {
        //             "symbol":"USDCUSDT",
        //             "id":20725156,
        //             "orderId":2880918576,
        //             "origClientOrderId":null,
        //             "price":"0.9996000000000000",
        //             "qty":"100.0000000000000000",
        //             "commission":null,
        //             "commissionAssert":null,
        //             "time":1635558511000,
        //             "isBuyer":false,
        //             "isMaker":false,
        //             "isBestMatch":true
        //         }
        //     ]
        //
        // future
        //
        //     {
        //         "code":"0",
        //         "msg":"Success",
        //         "data":[
        //             {
        //                 "tradeId":12,
        //                 "price":0.9,
        //                 "qty":1,
        //                 "amount":9,
        //                 "contractName":"E-SAND-USDT",
        //                 "side":"BUY",
        //                 "fee":"0.0018",
        //                 "bidId":1558124009467904992,
        //                 "askId":1558124043827644908,
        //                 "bidUserId":10294,
        //                 "askUserId":10467,
        //                 "isBuyer":true,
        //                 "isMaker":true,
        //                 "ctime":1678426306000
        //             }
        //         ]
        //     }
        //
        return this.parseTrades (data, market, since, limit);
    }

    async fetchDeposits (code: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchDeposits
         * @description fetch all deposits made to an account
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#deposit-history--withdraw_data
         * @param {string} code unified currency code
         * @param {int} [since] the earliest time in ms to fetch deposits for
         * @param {int} [limit] the maximum number of deposits structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#transaction-structure}
         */
        if (code === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchDeposits() requires a code argument');
        }
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'coin': currency['id'],
            'status': 1, // 0 init, 1 finished, default 0
            // 'offset': 0,
            // 'limit': limit, // default 10, max 1000
            // 'startTime': since,
            // 'endTime': this.milliseconds (),
        };
        if (since !== undefined) {
            request['startTime'] = since;
            // request['endTime'] = this.sum (since, 7776000000);
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.spotV1PrivateGetDepositHistory (this.extend (request, params));
        //
        //     {
        //         "code":200,
        //         "msg":"succ",
        //         "data":[
        //             {
        //                 "id":2659137,
        //                 "symbol":"USDC",
        //                 "amount":"200.0000000000000000",
        //                 "fee":"0.0E-15",
        //                 "createdAt":1635503169000,
        //                 "updatedAt":1635503202000,
        //                 "addressFrom":"0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2",
        //                 "addressTo":"0x190ceccb1f8bfbec1749180f0ba8922b488d865b",
        //                 "txid":"0x9970aec41099ac385568859517308707bc7d716df8dabae7b52f5b17351c3ed0",
        //                 "confirmations":5,
        //                 "status":0,
        //                 "tagType":null,
        //             },
        //             {
        //                 "id":2659137,
        //                 "symbol": "XRP",
        //                 "amount": "20.0000000000000000",
        //                 "fee": "0.0E-15",
        //                 "createdAt": 1544669393000,
        //                 "updatedAt": 1544669413000,
        //                 "addressFrom": "",
        //                 "addressTo": "raLPjTYeGezfdb6crXZzcC8RkLBEwbBHJ5_18113641",
        //                 "txid": "515B23E1F9864D3AF7F5B4C4FCBED784BAE861854FAB95F4031922B6AAEFC7AC",
        //                 "confirmations": 7,
        //                 "status": 1,
        //                 "tagType": "Tag"
        //             }
        //         ]
        //     }
        //
        const data = this.safeValue (response, 'data', []);
        return this.parseTransactions (data, currency, since, limit);
    }

    async fetchWithdrawals (code: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchWithdrawals
         * @description fetch all withdrawals made from an account
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#withdraw-history--withdraw_data
         * @param {string} code unified currency code
         * @param {int} [since] the earliest time in ms to fetch withdrawals for
         * @param {int} [limit] the maximum number of withdrawals structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#transaction-structure}
         */
        if (code === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchWithdrawals() requires a code argument');
        }
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'coin': currency['id'],
            'status': 5, // 0 init, 5 finished, 6 canceled, default 0
            // 'offset': 0,
            // 'limit': limit, // default 10, max 1000
            // 'startTime': since,
            // 'endTime': this.milliseconds (),
        };
        if (since !== undefined) {
            request['startTime'] = since;
            // request['endTime'] = this.sum (since, 7776000000);
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.spotV1PrivateGetWithdrawHistory (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "succ",
        //         "data": {
        //             "msg": null,
        //             "amount": 1000,
        //             "fee": 1,
        //             "ctime": null,
        //             "coin": "usdt_erc20",
        //             "addressTo": "0x2edfae3878d7b6db70ce4abed177ab2636f60c83"
        //         }
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseTransactions (data, currency);
    }

    parseTransactionStatusByType (status, type = undefined) {
        const statusesByType = {
            'deposit': {
                '0': 'pending',
                '1': 'ok',
            },
            'withdrawal': {
                '0': 'pending', // Email Sent
                '5': 'ok', // Failure
                '6': 'canceled',
            },
        };
        const statuses = this.safeValue (statusesByType, type, {});
        return this.safeString (statuses, status, status);
    }

    parseTransaction (transaction, currency = undefined): Transaction {
        //
        // fetchDeposits
        //
        //     {
        //         "symbol": "XRP",
        //         "amount": "261.3361000000000000",
        //         "fee": "0.0E-15",
        //         "createdAt": 1548816979000,
        //         "updatedAt": 1548816999000,
        //         "addressFrom": "",
        //         "addressTo": "raLPjTYeGezfdb6crXZzcC8RkLBEwbBHJ5_18113641",
        //         "txid": "86D6EB68A7A28938BCE06BD348F8C07DEF500C5F7FE92069EF8C0551CE0F2C7D",
        //         "confirmations": 8,
        //         "status": 1,
        //         "tagType": "Tag"
        //     },
        //     {
        //         "symbol": "XRP",
        //         "amount": "20.0000000000000000",
        //         "fee": "0.0E-15",
        //         "createdAt": 1544669393000,
        //         "updatedAt": 1544669413000,
        //         "addressFrom": "",
        //         "addressTo": "raLPjTYeGezfdb6crXZzcC8RkLBEwbBHJ5_18113641",
        //         "txid": "515B23E1F9864D3AF7F5B4C4FCBED784BAE861854FAB95F4031922B6AAEFC7AC",
        //         "confirmations": 7,
        //         "status": 1,
        //         "tagType": "Tag"
        //     }
        //
        // fetchWithdrawals
        //
        //     {
        //         "id": 183745,
        //         "symbol": "usdt_erc20",
        //         "amount": "8.4000000000000000",
        //         "fee": "1.6000000000000000",
        //         "payAmount": "0.0000000000000000",
        //         "createdAt": 1595336441000,
        //         "updatedAt": 1595336576000,
        //         "addressFrom": "",
        //         "addressTo": "0x2edfae3878d7b6db70ce4abed177ab2636f60c83",
        //         "txid": "",
        //         "confirmations": 0,
        //         "status": 6,
        //         "tagType": null
        //     }
        //
        // withdraw
        //
        //     {
        //         "msg": null,
        //         "amount": 1000,
        //         "fee": 1,
        //         "ctime": null,
        //         "coin": "usdt_erc20",
        //         "withdrawId": 1156423,
        //         "addressTo": "0x2edfae3878d7b6db70ce4abed177ab2636f60c83"
        //     }
        //
        const id = this.safeString2 (transaction, 'id', 'withdrawId');
        const tagType = this.safeString (transaction, 'tagType');
        let addressTo = this.safeString (transaction, 'addressTo');
        let addressFrom = this.safeString (transaction, 'addressFrom');
        let tagTo = undefined;
        let tagFrom = undefined;
        if (tagType !== undefined) {
            if (addressTo !== undefined) {
                const parts = addressTo.split ('_');
                addressTo = this.safeString (parts, 0);
                tagTo = this.safeString (parts, 1);
            }
            if (addressFrom !== undefined) {
                const parts = addressFrom.split ('_');
                addressFrom = this.safeString (parts, 0);
                tagFrom = this.safeString (parts, 1);
            }
        }
        const txid = this.safeString (transaction, 'txid');
        const timestamp = this.safeInteger (transaction, 'createdAt');
        const updated = this.safeInteger (transaction, 'updatedAt');
        const payAmount = ('payAmount' in transaction);
        const ctime = ('ctime' in transaction);
        const type = (payAmount || ctime) ? 'withdrawal' : 'deposit';
        const status = this.parseTransactionStatusByType (this.safeString (transaction, 'status'), type);
        const amount = this.safeNumber (transaction, 'amount');
        let network = undefined;
        let currencyId = this.safeString2 (transaction, 'symbol', 'coin');
        if (currencyId !== undefined) {
            const parts = currencyId.split ('_');
            currencyId = this.safeString (parts, 0);
            const networkId = this.safeString (parts, 1);
            if (networkId !== undefined) {
                network = networkId.toUpperCase ();
            }
        }
        const code = this.safeCurrencyCode (currencyId, currency);
        const feeCost = this.safeNumber (transaction, 'fee');
        let fee = undefined;
        if (feeCost !== undefined) {
            fee = { 'currency': code, 'cost': feeCost };
        }
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'network': network,
            'address': addressTo,
            'addressTo': addressTo,
            'addressFrom': addressFrom,
            'tag': tagTo,
            'tagTo': tagTo,
            'tagFrom': tagFrom,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': updated,
            'internal': false,
            'fee': fee,
        };
    }

    async withdraw (code: string, amount, address, tag = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#withdraw
         * @description make a withdrawal
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#withdraw-commit--withdraw_data
         * @param {string} code unified currency code
         * @param {float} amount the amount to withdraw
         * @param {string} address the address to withdraw to
         * @param {string} tag
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a [transaction structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#transaction-structure}
         */
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        this.checkAddress (address);
        await this.loadMarkets ();
        const currency = this.currency (code);
        let chainName = this.safeString (params, 'chainName');
        if (chainName === undefined) {
            const networks = this.safeValue (currency, 'networks', {});
            const optionsNetworks = this.safeValue (this.options, 'networks', {});
            let network = this.safeStringUpper (params, 'network'); // this line allows the user to specify either ERC20 or ETH
            network = this.safeString (optionsNetworks, network, network);
            const networkEntry = this.safeValue (networks, network, {});
            chainName = this.safeString (networkEntry, 'id'); // handle ERC20>ETH alias
            if (chainName === undefined) {
                throw new ArgumentsRequired (this.id + ' withdraw() requires a network parameter or a chainName parameter');
            }
            params = this.omit (params, 'network');
        }
        const request = {
            'coin': currency['id'].toUpperCase (),
            'amount': amount,
            'addressTo': address,
            'chainName': chainName, // 'ERC20', 'TRC20', 'SOL'
            // 'addressMark': '', // mark of address
            // 'addrType': '', // type of address
            // 'tag': tag,
        };
        if (tag !== undefined) {
            request['tag'] = tag;
        }
        const response = await this.spotV1PrivatePostWithdrawCommit (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "succ",
        //         "data": {
        //             "msg": null,
        //             "amount": 1000,
        //             "fee": 1,
        //             "ctime": null,
        //             "coin": "usdt_erc20",
        //             "withdrawId": 1156423,
        //             "addressTo": "0x2edfae3878d7b6db70ce4abed177ab2636f60c83"
        //         }
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseTransaction (data, currency);
    }

    parseDepositWithdrawFee (fee, currency = undefined) {
        //
        //   {
        //       "coin": "adx",
        //       "coinFulName": "Ambire AdEx",
        //       "chains": [ "BSC" ],
        //       "chainDetail": [ [Object] ]
        //   }
        //
        const chainDetails = this.safeValue (fee, 'chainDetail', []);
        const chainDetailLength = chainDetails.length;
        const result = {
            'info': fee,
            'withdraw': {
                'fee': undefined,
                'percentage': undefined,
            },
            'deposit': {
                'fee': undefined,
                'percentage': undefined,
            },
            'networks': {},
        };
        if (chainDetailLength !== 0) {
            for (let i = 0; i < chainDetailLength; i++) {
                const chainDetail = chainDetails[i];
                const networkId = this.safeString (chainDetail, 'chain');
                const currencyCode = this.safeString (currency, 'code');
                const networkCode = this.networkIdToCode (networkId, currencyCode);
                result['networks'][networkCode] = {
                    'deposit': { 'fee': undefined, 'percentage': undefined },
                    'withdraw': { 'fee': this.safeNumber (chainDetail, 'withdrawFee'), 'percentage': false },
                };
                if (chainDetailLength === 1) {
                    result['withdraw']['fee'] = this.safeNumber (chainDetail, 'withdrawFee');
                    result['withdraw']['percentage'] = false;
                }
            }
        }
        return result;
    }

    async fetchDepositWithdrawFees (codes: string[] = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchDepositWithdrawFees
         * @description fetch deposit and withdraw fees
         * @see https://github.com/Bitrue-exchange/Spot-official-api-docs#exchangeInfo_endpoint
         * @param {string[]|undefined} codes list of unified currency codes
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} a list of [fee structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#fee-structure}
         */
        await this.loadMarkets ();
        const response = await this.spotV1PublicGetExchangeInfo (params);
        const coins = this.safeValue (response, 'coins');
        return this.parseDepositWithdrawFees (coins, codes, 'coin');
    }

    parseTransfer (transfer, currency = undefined) {
        //
        //     fetchTransfers
        //
        //     {
        //         'transferType': 'wallet_to_contract',
        //         'symbol': 'USDT',
        //         'amount': 1.0,
        //         'status': 1,
        //         'ctime': 1685404575000
        //     }
        //
        //     transfer
        //
        //     {}
        //
        const transferType = this.safeString (transfer, 'transferType');
        let fromAccount = undefined;
        let toAccount = undefined;
        if (transferType !== undefined) {
            const accountSplit = transferType.split ('_to_');
            fromAccount = this.safeString (accountSplit, 0);
            toAccount = this.safeString (accountSplit, 1);
        }
        const timestamp = this.safeInteger (transfer, 'ctime');
        return {
            'info': transfer,
            'id': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'currency': this.safeString (currency, 'code'),
            'amount': this.safeNumber (transfer, 'amount'),
            'fromAccount': fromAccount,
            'toAccount': toAccount,
            'status': 'ok',
        };
    }

    async fetchTransfers (code: string = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#fetchTransfers
         * @description fetch a history of internal transfers made on an account
         * @see https://www.bitrue.com/api-docs#get-future-account-transfer-history-list-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#get-future-account-transfer-history-list-user_data-hmac-sha256
         * @param {string} code unified currency code of the currency transferred
         * @param {int} [since] the earliest time in ms to fetch transfers for
         * @param {int} [limit] the maximum number of transfers structures to retrieve
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @param {int} [params.until] the latest time in ms to fetch transfers for
         * @returns {object[]} a list of [transfer structures]{@link https://github.com/ccxt/ccxt/wiki/Manual#transfer-structure}
         */
        await this.loadMarkets ();
        const type = this.safeString2 (params, 'type', 'transferType');
        const request = {
            'transferType': type,
        };
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['coinSymbol'] = currency['id'];
        }
        if (since !== undefined) {
            request['beginTime'] = since;
        }
        if (limit !== undefined) {
            if (limit > 200) {
                limit = 200;
            }
            request['limit'] = limit;
        }
        const until = this.safeInteger (params, 'until');
        if (until !== undefined) {
            params = this.omit (params, 'until');
            request['endTime'] = until;
        }
        const response = await this.fapiV2PrivateGetFuturesTransferHistory (this.extend (request, params));
        //
        //     {
        //         'code': '0',
        //         'msg': 'Success',
        //         'data': [{
        //             'transferType': 'wallet_to_contract',
        //             'symbol': 'USDT',
        //             'amount': 1.0,
        //             'status': 1,
        //             'ctime': 1685404575000
        //         }]
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseTransfers (data, currency, since, limit);
    }

    async transfer (code: string, amount, fromAccount, toAccount, params = {}) {
        /**
         * @method
         * @name bitrue#transfer
         * @description transfer currency internally between wallets on the same account
         * @see https://www.bitrue.com/api-docs#new-future-account-transfer-user_data-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#user-commission-rate-user_data-hmac-sha256
         * @param {string} code unified currency code
         * @param {float} amount amount to transfer
         * @param {string} fromAccount account to transfer from
         * @param {string} toAccount account to transfer to
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @param {string} [params.type] transfer type wallet_to_contract or contract_to_wallet
         * @returns {object} a [transfer structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#transfer-structure}
         */
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'coinSymbol': currency['id'],
            'amount': this.currencyToPrecision (code, amount),
        };
        request['transferType'] = this.safeString2 (params, 'type', 'transferType');
        params = this.omit (params, [ 'type', 'transferType' ]);
        const response = await this.fapiV2PrivatePostFuturesTransfer (this.extend (request, params));
        //
        //     {
        //         'code': '0',
        //         'msg': 'Success',
        //         'data': null
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseTransfer (data, currency);
    }

    async setLeverage (leverage, symbol: string = undefined, params = {}) {
        /**
         * @method
         * @name bitrue#setLeverage
         * @description set the level of leverage for a market
         * @see https://www.bitrue.com/api-docs#change-initial-leverage-trade-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#change-initial-leverage-trade-hmac-sha256
         * @param {float} leverage the rate of leverage
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the bitrue api endpoint
         * @returns {object} response from the exchange
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' setLeverage() requires a symbol argument');
        }
        if ((leverage < 1) || (leverage > 125)) {
            throw new BadRequest (this.id + ' leverage should be between 1 and 125');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('setLeverage', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('setLeverage', market, params);
        let response = undefined;
        const request = {
            'contractName': market['id'],
            'leverage': leverage,
        };
        if (!market['future']) {
            throw new NotSupported (this.id + ' setLeverage only support future markets');
        }
        if (this.isLinear (type, subType)) {
            response = await this.fapiV2PrivatePostLevelEdit (this.extend (request, params));
        } else if (this.isInverse (type, subType)) {
            response = await this.dapiV2PrivatePostLevelEdit (this.extend (request, params));
        }
        return response;
    }

    parseMarginModification (data, market = undefined) {
        return {
            'info': data,
            'type': undefined,
            'amount': undefined,
            'code': undefined,
            'symbol': market['symbol'],
            'status': undefined,
        };
    }

    async setMargin (symbol: string, amount, params = {}) {
        /**
         * @method
         * @name bitrue#setMargin
         * @description Either adds or reduces margin in an isolated position in order to set the margin to a specific value
         * @see https://www.bitrue.com/api-docs#modify-isolated-position-margin-trade-hmac-sha256
         * @see https://www.bitrue.com/api_docs_includes_file/delivery.html#modify-isolated-position-margin-trade-hmac-sha256
         * @param {string} symbol unified market symbol of the market to set margin in
         * @param {float} amount the amount to set the margin to
         * @param {object} [params] parameters specific to the bitrue api endpoint
         * @returns {object} A [margin structure]{@link https://github.com/ccxt/ccxt/wiki/Manual#add-margin-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (!market['future']) {
            throw new NotSupported (this.id + ' setMargin only support future markets');
        }
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('setMargin', market, params);
        let subType = undefined;
        [ subType, params ] = this.handleSubTypeAndParams ('setMargin', market, params);
        let response = undefined;
        const request = {
            'contractName': market['id'],
            'amount': this.parseNumber (amount),
        };
        if (this.isLinear (type, subType)) {
            response = await this.fapiV2PrivatePostPositionMargin (this.extend (request, params));
        } else if (this.isInverse (type, subType)) {
            response = await this.dapiV2PrivatePostPositionMargin (this.extend (request, params));
        }
        //
        //     {
        //         "code": 0,
        //         "msg": "success"
        //         "data": null
        //     }
        //
        return this.parseMarginModification (response, market);
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const type = this.safeString (api, 0);
        const version = this.safeString (api, 1);
        const access = this.safeString (api, 2);
        let url = undefined;
        if (type === 'api' && version === 'kline') {
            url = this.urls['api'][type];
        } else {
            url = this.urls['api'][type] + '/' + version;
        }
        url = url + '/' + this.implodeParams (path, params);
        params = this.omit (params, this.extractParams (path));
        if (access === 'private') {
            this.checkRequiredCredentials ();
            const recvWindow = this.safeInteger (this.options, 'recvWindow', 5000);
            if (type === 'spot') {
                let query = this.urlencode (this.extend ({
                    'timestamp': this.nonce (),
                    'recvWindow': recvWindow,
                }, params));
                const signature = this.hmac (this.encode (query), this.encode (this.secret), sha256);
                query += '&' + 'signature=' + signature;
                headers = {
                    'X-MBX-APIKEY': this.apiKey,
                };
                if ((method === 'GET') || (method === 'DELETE')) {
                    url += '?' + query;
                } else {
                    body = query;
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            } else {
                const timestamp = this.nonce ().toString ();
                let signPath = undefined;
                if (type === 'fapi') {
                    signPath = '/fapi';
                } else if (type === 'dapi') {
                    signPath = '/dapi';
                }
                signPath = signPath + '/' + version + '/' + path;
                let signMessage = timestamp + method + signPath;
                if (method === 'GET') {
                    const signature = this.hmac (this.encode (signMessage), this.encode (this.secret), sha256);
                    headers = {
                        'X-CH-APIKEY': this.apiKey,
                        'X-CH-SIGN': signature,
                        'X-CH-TS': timestamp,
                    };
                    url += '?' + this.urlencode (params);
                } else {
                    const query = this.extend ({
                        'recvWindow': recvWindow,
                    }, params);
                    body = this.json (query);
                    signMessage = signMessage + JSON.stringify (body);
                    const signature = this.hmac (this.encode (signMessage), this.encode (this.secret), sha256);
                    headers = {
                        'Content-Type': 'application/json',
                        'X-CH-APIKEY': this.apiKey,
                        'X-CH-SIGN': signature,
                        'X-CH-TS': timestamp,
                    };
                }
            }
        } else {
            if (Object.keys (params).length) {
                url += '?' + this.urlencode (params);
            }
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if ((code === 418) || (code === 429)) {
            throw new DDoSProtection (this.id + ' ' + code.toString () + ' ' + reason + ' ' + body);
        }
        // error response in a form: { "code": -1013, "msg": "Invalid quantity." }
        // following block cointains legacy checks against message patterns in "msg" property
        // will switch "code" checks eventually, when we know all of them
        if (code >= 400) {
            if (body.indexOf ('Price * QTY is zero or less') >= 0) {
                throw new InvalidOrder (this.id + ' order cost = amount * price is zero or less ' + body);
            }
            if (body.indexOf ('LOT_SIZE') >= 0) {
                throw new InvalidOrder (this.id + ' order amount should be evenly divisible by lot size ' + body);
            }
            if (body.indexOf ('PRICE_FILTER') >= 0) {
                throw new InvalidOrder (this.id + ' order price is invalid, i.e. exceeds allowed price precision, exceeds min price or max price limits or is invalid float value in general, use this.priceToPrecision (symbol, amount) ' + body);
            }
        }
        if (response === undefined) {
            return undefined; // fallback to default error handler
        }
        // check success value for wapi endpoints
        // response in format {'msg': 'The coin does not exist.', 'success': true/false}
        const success = this.safeValue (response, 'success', true);
        if (!success) {
            const messageInner = this.safeString (response, 'msg');
            let parsedMessage = undefined;
            if (messageInner !== undefined) {
                try {
                    parsedMessage = JSON.parse (messageInner);
                } catch (e) {
                    // do nothing
                    parsedMessage = undefined;
                }
                if (parsedMessage !== undefined) {
                    response = parsedMessage;
                }
            }
        }
        const message = this.safeString (response, 'msg');
        if (message !== undefined) {
            this.throwExactlyMatchedException (this.exceptions['exact'], message, this.id + ' ' + message);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, this.id + ' ' + message);
        }
        // checks against error codes
        const error = this.safeString (response, 'code');
        if (error !== undefined) {
            // https://github.com/ccxt/ccxt/issues/6501
            // https://github.com/ccxt/ccxt/issues/7742
            if ((error === '200') || Precise.stringEquals (error, '0')) {
                return undefined;
            }
            // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
            // despite that their message is very confusing, it is raised by Binance
            // on a temporary ban, the API key is valid, but disabled for a while
            if ((error === '-2015') && this.options['hasAlreadyAuthenticatedSuccessfully']) {
                throw new DDoSProtection (this.id + ' temporary banned: ' + body);
            }
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], error, feedback);
            throw new ExchangeError (feedback);
        }
        if (!success) {
            throw new ExchangeError (this.id + ' ' + body);
        }
        return undefined;
    }

    calculateRateLimiterCost (api, method, path, params, config = {}) {
        if (('noSymbol' in config) && !('symbol' in params)) {
            return config['noSymbol'];
        } else if (('byLimit' in config) && ('limit' in params)) {
            const limit = params['limit'];
            const byLimit = config['byLimit'] as any;
            for (let i = 0; i < byLimit.length; i++) {
                const entry = byLimit[i];
                if (limit <= entry[0]) {
                    return entry[1];
                }
            }
        }
        return this.safeValue (config, 'cost', 1);
    }
}
