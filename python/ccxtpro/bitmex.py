# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

import ccxtpro
import ccxt.async_support as ccxt
from ccxt.base.errors import ExchangeError
from ccxt.base.errors import RateLimitExceeded


class bitmex(ccxtpro.Exchange, ccxt.bitmex):

    def describe(self):
        return self.deep_extend(super(bitmex, self).describe(), {
            'has': {
                'ws': True,
                'watchTicker': True,
                'watchOrderBook': True,
            },
            'urls': {
                'api': {
                    'ws': 'wss://www.bitmex.com/realtime',
                },
            },
            'versions': {
                'ws': '0.2.0',
            },
            'options': {
                'subscriptionStatusByChannelId': {},
                'watchOrderBookLevel': 'orderBookL2',  # 'orderBookL2' = L2 full order book, 'orderBookL2_25' = L2 top 25, 'orderBook10' L3 top 10
            },
            'exceptions': {
                'ws': {
                    'exact': {
                    },
                    'broad': {
                        'Rate limit exceeded': RateLimitExceeded,
                    },
                },
            },
        })

    def handle_ticker(self, client, message):
        #
        #     [
        #         0,  # channelID
        #         {
        #             "a": ["5525.40000", 1, "1.000"],  # ask, wholeAskVolume, askVolume
        #             "b": ["5525.10000", 1, "1.000"],  # bid, wholeBidVolume, bidVolume
        #             "c": ["5525.10000", "0.00398963"],  # closing price, volume
        #             "h": ["5783.00000", "5783.00000"],  # high price today, high price 24h ago
        #             "l": ["5505.00000", "5505.00000"],  # low price today, low price 24h ago
        #             "o": ["5760.70000", "5763.40000"],  # open price today, open price 24h ago
        #             "p": ["5631.44067", "5653.78939"],  # vwap today, vwap 24h ago
        #             "t": [11493, 16267],  # number of trades today, 24 hours ago
        #             "v": ["2634.11501494", "3591.17907851"],  # volume today, volume 24 hours ago
        #         },
        #         "ticker",
        #         "XBT/USD"
        #     ]
        #
        wsName = message[3]
        name = 'ticker'
        messageHash = wsName + ':' + name
        market = self.safe_value(self.options['marketsByWsName'], wsName)
        symbol = market['symbol']
        ticker = message[1]
        vwap = float(ticker['p'][0])
        quoteVolume = None
        baseVolume = float(ticker['v'][0])
        if baseVolume is not None and vwap is not None:
            quoteVolume = baseVolume * vwap
        last = float(ticker['c'][0])
        timestamp = self.milliseconds()
        result = {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'high': float(ticker['h'][0]),
            'low': float(ticker['l'][0]),
            'bid': float(ticker['b'][0]),
            'bidVolume': float(ticker['b'][2]),
            'ask': float(ticker['a'][0]),
            'askVolume': float(ticker['a'][2]),
            'vwap': vwap,
            'open': float(ticker['o'][0]),
            'close': last,
            'last': last,
            'previousClose': None,
            'change': None,
            'percentage': None,
            'average': None,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        }
        # todo: add support for multiple tickers(may be tricky)
        # kraken confirms multi-pair subscriptions separately one by one
        # trigger correct watchTickers calls upon receiving any of symbols
        # --------------------------------------------------------------------
        # if there's a corresponding watchTicker call - trigger it
        client.resolve(result, messageHash)

    async def watch_balance(self, params={}):
        await self.load_markets()
        raise NotImplemented(self.id + ' watchBalance() not implemented yet')

    def handle_trades(self, client, message):
        #
        #     [
        #         0,  # channelID
        #         [ #     price        volume         time             side type misc
        #             ["5541.20000", "0.15850568", "1534614057.321597", "s", "l", ""],
        #             ["6060.00000", "0.02455000", "1534614057.324998", "b", "l", ""],
        #         ],
        #         "trade",
        #         "XBT/USD"
        #     ]
        #
        # todo: incremental trades – add max limit to the dequeue of trades, unshift and push
        #
        #     trade = self.handle_trade(client, delta, market)
        #     self.trades.append(trade)
        #     tradesCount += 1
        #
        wsName = message[3]
        # name = 'ticker'
        # messageHash = wsName + ':' + name
        market = self.safe_value(self.options['marketsByWsName'], wsName)
        symbol = market['symbol']
        # for(i = 0; i < len(message[1]); i++)
        timestamp = int(message[2])
        result = {
            'id': None,
            'order': None,
            'info': message,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'symbol': symbol,
            # 'type': type,
            # 'side': side,
            'takerOrMaker': None,
            # 'price': price,
            # 'amount': amount,
            # 'cost': price * amount,
            # 'fee': fee,
        }
        result['id'] = None
        raise NotImplemented(self.id + ' handleTrades() not implemented yet(wip)')

    def handle_ohlcv(self, client, message):
        #
        #     [
        #         216,  # channelID
        #         [
        #             '1574454214.962096',  # Time, seconds since epoch
        #             '1574454240.000000',  # End timestamp of the interval
        #             '0.020970',  # Open price at midnight UTC
        #             '0.020970',  # Intraday high price
        #             '0.020970',  # Intraday low price
        #             '0.020970',  # Closing price at midnight UTC
        #             '0.020970',  # Volume weighted average price
        #             '0.08636138',  # Accumulated volume today
        #             1,  # Number of trades today
        #         ],
        #         'ohlc-1',  # Channel Name of subscription
        #         'ETH/XBT',  # Asset pair
        #     ]
        #
        wsName = message[3]
        name = 'ohlc'
        candle = message[1]
        # print(
        #     self.iso8601(int(float(candle[0]) * 1000)), '-',
        #     self.iso8601(int(float(candle[1]) * 1000)), ': [',
        #     float(candle[2]),
        #     float(candle[3]),
        #     float(candle[4]),
        #     float(candle[5]),
        #     float(candle[7]), ']'
        # )
        result = [
            int(float(candle[0]) * 1000),
            float(candle[2]),
            float(candle[3]),
            float(candle[4]),
            float(candle[5]),
            float(candle[7]),
        ]
        messageHash = wsName + ':' + name
        client.resolve(result, messageHash)

    async def watch_order_book(self, symbol, limit=None, params={}):
        name = None
        if limit is None:
            name = self.safe_string(self.options, 'watchOrderBookLevel', 'orderBookL2')
        elif limit == 25:
            name = 'orderBookL2_25'
        elif limit == 10:
            name = 'orderBookL10'
        else:
            raise ExchangeError(self.id + ' watchOrderBook limit argument must be None(L2), 25(L2) or 10(L3)')
        await self.load_markets()
        market = self.market(symbol)
        messageHash = name + ':' + market['id']
        url = self.urls['api']['ws']
        request = {
            'op': 'subscribe',
            'args': [
                messageHash,
            ],
        }
        future = self.watch(url, messageHash, self.deep_extend(request, params), messageHash)
        return await self.after(future, self.limit_order_book, symbol, limit, params)

    def limit_order_book(self, orderbook, symbol, limit=None, params={}):
        return orderbook.limit(limit)

    async def watch_ohlcv(self, symbol, timeframe='1m', since=None, limit=None, params={}):
        # name = 'ohlc'
        # request = {
        #     'subscription': {
        #         'interval': int(self.timeframes[timeframe]),
        #     },
        # }
        # return await self.watchPublicMessage(name, symbol, self.extend(request, params))
        raise NotImplemented(self.id + ' watchOHLCV() not implemented yet(wip)')

    async def watch_heartbeat(self, params={}):
        await self.load_markets()
        event = 'heartbeat'
        url = self.urls['api']['ws']
        return await self.watch(url, event)

    def sign_message(self, client, messageHash, message, params={}):
        # todo: bitmex signMessage not implemented yet
        return message

    def handle_trade(self, client, trade, market=None):
        #
        # public trades
        #
        #     [
        #         "t",  # trade
        #         "42706057",  # id
        #         1,  # 1 = buy, 0 = sell
        #         "0.05567134",  # price
        #         "0.00181421",  # amount
        #         1522877119,  # timestamp
        #     ]
        #
        id = str(trade[1])
        side = 'buy' if trade[2] else 'sell'
        price = float(trade[3])
        amount = float(trade[4])
        timestamp = trade[5] * 1000
        symbol = None
        if market is not None:
            symbol = market['symbol']
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'symbol': symbol,
            'id': id,
            'order': None,
            'type': None,
            'takerOrMaker': None,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': price * amount,
            'fee': None,
        }

    def handle_order_book(self, client, message):
        #
        # first message(snapshot)
        #
        #     {
        #         table: 'orderBookL2',
        #         action: 'partial',
        #         keys: ['symbol', 'id', 'side'],
        #         types: {
        #             symbol: 'symbol',
        #             id: 'long',
        #             side: 'symbol',
        #             size: 'long',
        #             price: 'float'
        #         },
        #         foreignKeys: {symbol: 'instrument', side: 'side'},
        #         attributes: {symbol: 'parted', id: 'sorted'},
        #         filter: {symbol: 'XBTUSD'},
        #         data: [
        #             {symbol: 'XBTUSD', id: 8700000100, side: 'Sell', size: 1, price: 999999},
        #             {symbol: 'XBTUSD', id: 8700000200, side: 'Sell', size: 3, price: 999998},
        #             {symbol: 'XBTUSD', id: 8716991250, side: 'Sell', size: 26, price: 830087.5},
        #             {symbol: 'XBTUSD', id: 8728701950, side: 'Sell', size: 1720, price: 712980.5},
        #         ]
        #     }
        #
        # subsequent updates
        #
        #     {
        #         table: 'orderBookL2',
        #         action: 'update',
        #         data: [
        #             {symbol: 'XBTUSD', id: 8799285100, side: 'Sell', size: 70590},
        #             {symbol: 'XBTUSD', id: 8799285550, side: 'Sell', size: 217652},
        #             {symbol: 'XBTUSD', id: 8799288950, side: 'Buy', size: 47552},
        #             {symbol: 'XBTUSD', id: 8799289250, side: 'Buy', size: 78217},
        #         ]
        #     }
        #
        action = self.safe_string(message, 'action')
        table = self.safe_string(message, 'table')
        data = self.safe_value(message, 'data', [])
        # if it's an initial snapshot
        if action == 'partial':
            filter = self.safe_value(message, 'filter', {})
            marketId = self.safe_value(filter, 'symbol')
            if marketId in self.markets_by_id:
                market = self.markets_by_id[marketId]
                symbol = market['symbol']
                if table == 'orderBookL2':
                    self.orderbooks[symbol] = self.indexed_order_book()
                elif table == 'orderBookL2_25':
                    self.orderbooks[symbol] = self.indexed_order_book({}, 25)
                elif table == 'orderBook10':
                    self.orderbooks[symbol] = self.indexed_order_book({}, 10)
                orderbook = self.orderbooks[symbol]
                for i in range(0, len(data)):
                    price = self.safe_float(data[i], 'price')
                    size = self.safe_float(data[i], 'size')
                    id = self.safe_string(data[i], 'id')
                    side = self.safe_string(data[i], 'side')
                    side = 'bids' if (side == 'Buy') else 'asks'
                    bookside = orderbook[side]
                    bookside.store(price, size, id)
                messageHash = table + ':' + marketId
                # the .limit() operation will be moved to the watchOrderBook
                client.resolve(orderbook, messageHash)
        else:
            numUpdatesByMarketId = {}
            for i in range(0, len(data)):
                marketId = self.safe_value(data[i], 'symbol')
                if marketId in self.markets_by_id:
                    if not (marketId in numUpdatesByMarketId):
                        numUpdatesByMarketId[marketId] = 0
                    numUpdatesByMarketId[marketId] += 1
                    market = self.markets_by_id[marketId]
                    symbol = market['symbol']
                    orderbook = self.orderbooks[symbol]
                    price = self.safe_float(data[i], 'price')
                    size = self.safe_float(data[i], 'size', 0)
                    id = self.safe_string(data[i], 'id')
                    side = self.safe_string(data[i], 'side')
                    side = 'bids' if (side == 'Buy') else 'asks'
                    bookside = orderbook[side]
                    if action == 'insert':
                        bookside.store(price, size, id)
                    else:
                        bookside.restore(price, size, id)
            marketIds = list(numUpdatesByMarketId.keys())
            for i in range(0, len(marketIds)):
                marketId = marketIds[i]
                messageHash = table + ':' + marketId
                market = self.markets_by_id[marketId]
                symbol = market['symbol']
                orderbook = self.orderbooks[symbol]
                # the .limit() operation will be moved to the watchOrderBook
                client.resolve(orderbook, messageHash)

    def handle_system_status(self, client, message):
        #
        # todo: answer the question whether handleSystemStatus should be renamed
        # and unified as handleStatus for any usage pattern that
        # involves system status and maintenance updates
        #
        #     {
        #         info: 'Welcome to the BitMEX Realtime API.',
        #         version: '2019-11-22T00:24:37.000Z',
        #         timestamp: '2019-11-23T09:02:27.771Z',
        #         docs: 'https://www.bitmex.com/app/wsAPI',
        #         limit: {remaining: 39}
        #     }
        #
        return message

    def handle_subscription_status(self, client, message):
        #
        #     {
        #         success: True,
        #         subscribe: 'orderBookL2:XBTUSD',
        #         request: {op: 'subscribe', args: ['orderBookL2:XBTUSD']}
        #     }
        #
        # --------------------------------------------------------------------
        #
        # channelId = self.safe_string(message, 'channelID')
        # self.options['subscriptionStatusByChannelId'][channelId] = message
        # requestId = self.safe_string(message, 'reqid')
        # if client.futures[requestId]:
        #     del client.futures[requestId]
        # }
        #
        return message

    def handle_error_message(self, client, message):
        #
        # generic error format
        #
        #     {"error": errorMessage}
        #
        # examples
        #
        #     {
        #         "status": 429,
        #         "error": "Rate limit exceeded, retry in 1 seconds.",
        #         "meta": {"retryAfter": 1},
        #         "request": {"op": "subscribe", "args": "orderBook"},
        #     }
        #
        #     {"error": "Rate limit exceeded, retry in 29 seconds."}
        #
        error = self.safe_value(message, 'error')
        if error is not None:
            request = self.safe_value(message, 'request', {})
            args = self.safe_string(request, 'args', [])
            numArgs = len(args)
            if numArgs > 0:
                messageHash = args[0]
                broad = self.exceptions['ws']['broad']
                broadKey = self.find_broadly_matched_key(broad, error)
                exception = None
                if broadKey is None:
                    exception = ExchangeError(error)
                else:
                    exception = broad[broadKey](error)
                # print(requestId, exception)
                client.reject(exception, messageHash)
                return False
        return True

    def handle_message(self, client, message):
        #
        #     {
        #         info: 'Welcome to the BitMEX Realtime API.',
        #         version: '2019-11-22T00:24:37.000Z',
        #         timestamp: '2019-11-23T09:04:42.569Z',
        #         docs: 'https://www.bitmex.com/app/wsAPI',
        #         limit: {remaining: 38}
        #     }
        #
        #     {
        #         success: True,
        #         subscribe: 'orderBookL2:XBTUSD',
        #         request: {op: 'subscribe', args: ['orderBookL2:XBTUSD']}
        #     }
        #
        #     {
        #         table: 'orderBookL2',
        #         action: 'update',
        #         data: [
        #             {symbol: 'XBTUSD', id: 8799284800, side: 'Sell', size: 721000},
        #             {symbol: 'XBTUSD', id: 8799285100, side: 'Sell', size: 70590},
        #             {symbol: 'XBTUSD', id: 8799285550, side: 'Sell', size: 217652},
        #             {symbol: 'XBTUSD', id: 8799285850, side: 'Sell', size: 105578},
        #             {symbol: 'XBTUSD', id: 8799286350, side: 'Sell', size: 172093},
        #             {symbol: 'XBTUSD', id: 8799286650, side: 'Sell', size: 201125},
        #             {symbol: 'XBTUSD', id: 8799288950, side: 'Buy', size: 47552},
        #             {symbol: 'XBTUSD', id: 8799289250, side: 'Buy', size: 78217},
        #             {symbol: 'XBTUSD', id: 8799289700, side: 'Buy', size: 193677},
        #             {symbol: 'XBTUSD', id: 8799290000, side: 'Buy', size: 818161},
        #             {symbol: 'XBTUSD', id: 8799290500, side: 'Buy', size: 218806},
        #             {symbol: 'XBTUSD', id: 8799290800, side: 'Buy', size: 102946}
        #         ]
        #     }
        #
        if self.handle_error_message(client, message):
            table = self.safe_string(message, 'table')
            methods = {
                'orderBookL2': self.handle_order_book,
                'orderBookL2_25': self.handle_order_book,
                'orderBook10': self.handle_order_book,
            }
            method = self.safe_value(methods, table)
            if method is None:
                print(message)
                return message
            else:
                return method(client, message)
