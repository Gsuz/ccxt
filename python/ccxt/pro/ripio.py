# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxt.pro.base.exchange import Exchange
import ccxt.async_support
from ccxt.pro.base.cache import ArrayCache
import json


class ripio(Exchange, ccxt.async_support.ripio):

    def describe(self):
        return self.deep_extend(super(ripio, self).describe(), {
            'has': {
                'ws': True,
                'watchOrderBook': True,
                'watchTrades': True,
                'watchTicker': True,
            },
            'urls': {
                'api': {
                    'ws': 'wss://api.exchange.ripio.com/ws/v2/consumer/non-persistent/public/default/',
                },
            },
            'options': {
                'tradesLimit': 1000,
                'uuid': self.uuid(),
            },
        })

    async def watch_trades(self, symbol=None, since=None, limit=None, params={}):
        await self.load_markets()
        market = self.market(symbol)
        symbol = market['symbol']
        name = 'trades'
        messageHash = name + '_' + market['id'].lower()
        url = self.urls['api']['ws'] + messageHash + '/' + self.options['uuid']
        subscription = {
            'name': name,
            'symbol': symbol,
            'messageHash': messageHash,
            'method': self.handle_trade,
        }
        trades = await self.watch(url, messageHash, None, messageHash, subscription)
        if self.newUpdates:
            limit = trades.getLimit(symbol, limit)
        return self.filter_by_since_limit(trades, since, limit, 'timestamp', True)

    def handle_trade(self, client, message, subscription):
        #
        #     {
        #         messageId: 'CAAQAA==',
        #         payload: 'eyJjcmVhdGVkX2F0IjogMTYwMTczNjI0NywgImFtb3VudCI6ICIwLjAwMjAwIiwgInByaWNlIjogIjEwNTkzLjk5MDAwMCIsICJzaWRlIjogIkJVWSIsICJwYWlyIjogIkJUQ19VU0RDIiwgInRha2VyX2ZlZSI6ICIwIiwgInRha2VyX3NpZGUiOiAiQlVZIiwgIm1ha2VyX2ZlZSI6ICIwIiwgInRha2VyIjogMjYxODU2NCwgIm1ha2VyIjogMjYxODU1N30=',
        #         properties: {},
        #         publishTime: '2020-10-03T14:44:09.881Z'
        #     }
        #
        payload = self.safe_string(message, 'payload')
        if payload is None:
            return message
        data = json.loads(self.base64_to_string(payload))
        #
        #     {
        #         created_at: 1601736247,
        #         amount: '0.00200',
        #         price: '10593.990000',
        #         side: 'BUY',
        #         pair: 'BTC_USDC',
        #         taker_fee: '0',
        #         taker_side: 'BUY',
        #         maker_fee: '0',
        #         taker: 2618564,
        #         maker: 2618557
        #     }
        #
        symbol = self.safe_string(subscription, 'symbol')
        messageHash = self.safe_string(subscription, 'messageHash')
        market = self.market(symbol)
        trade = self.parse_trade(data, market)
        tradesArray = self.safe_value(self.trades, symbol)
        if tradesArray is None:
            limit = self.safe_integer(self.options, 'tradesLimit', 1000)
            tradesArray = ArrayCache(limit)
            self.trades[symbol] = tradesArray
        tradesArray.append(trade)
        client.resolve(tradesArray, messageHash)

    async def watch_ticker(self, symbol, params={}):
        """
        watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
        :param str symbol: unified symbol of the market to fetch the ticker for
        :param dict params: extra parameters specific to the ripio api endpoint
        :returns dict: a `ticker structure <https://docs.ccxt.com/en/latest/manual.html#ticker-structure>`
        """
        await self.load_markets()
        market = self.market(symbol)
        symbol = market['symbol']
        name = 'rate'
        messageHash = name + '_' + market['id'].lower()
        url = self.urls['api']['ws'] + messageHash + '/' + self.options['uuid']
        subscription = {
            'name': name,
            'symbol': symbol,
            'messageHash': messageHash,
            'method': self.handle_ticker,
        }
        return await self.watch(url, messageHash, None, messageHash, subscription)

    def handle_ticker(self, client, message, subscription):
        #
        #     {
        #         messageId: 'CAAQAA==',
        #         payload: 'eyJidXkiOiBbeyJhbW91bnQiOiAiMC4wOTMxMiIsICJ0b3RhbCI6ICI4MzguMDgiLCAicHJpY2UiOiAiOTAwMC4wMCJ9XSwgInNlbGwiOiBbeyJhbW91bnQiOiAiMC4wMDAwMCIsICJ0b3RhbCI6ICIwLjAwIiwgInByaWNlIjogIjkwMDAuMDAifV0sICJ1cGRhdGVkX2lkIjogMTI0NDA0fQ==',
        #         properties: {},
        #         publishTime: '2020-10-03T10:05:09.445Z'
        #     }
        #
        payload = self.safe_string(message, 'payload')
        if payload is None:
            return message
        data = json.loads(self.base64_to_string(payload))
        #
        #     {
        #         "pair": "BTC_BRL",
        #         "last_price": "68558.59",
        #         "low": "54736.11",
        #         "high": "70034.68",
        #         "variation": "8.75",
        #         "volume": "10.10537"
        #     }
        #
        ticker = self.parse_ticker(data)
        timestamp = self.parse8601(self.safe_string(message, 'publishTime'))
        ticker['timestamp'] = timestamp
        ticker['datetime'] = self.iso8601(timestamp)
        symbol = ticker['symbol']
        self.tickers[symbol] = ticker
        messageHash = self.safe_string(subscription, 'messageHash')
        if messageHash is not None:
            client.resolve(ticker, messageHash)
        return message

    async def watch_order_book(self, symbol, limit=None, params={}):
        """
        watches information on open orders with bid(buy) and ask(sell) prices, volumes and other data
        :param str symbol: unified symbol of the market to fetch the order book for
        :param int|None limit: the maximum amount of order book entries to return
        :param dict params: extra parameters specific to the ripio api endpoint
        :returns dict: A dictionary of `order book structures <https://docs.ccxt.com/en/latest/manual.html#order-book-structure>` indexed by market symbols
        """
        await self.load_markets()
        market = self.market(symbol)
        symbol = market['symbol']
        name = 'orderbook'
        messageHash = name + '_' + market['id'].lower()
        url = self.urls['api']['ws'] + messageHash + '/' + self.options['uuid']
        client = self.client(url)
        subscription = {
            'name': name,
            'symbol': symbol,
            'messageHash': messageHash,
            'method': self.handle_order_book,
        }
        if not (messageHash in client.subscriptions):
            self.orderbooks[symbol] = self.order_book({})
            client.subscriptions[messageHash] = subscription
            options = self.safe_value(self.options, 'fetchOrderBookSnapshot', {})
            delay = self.safe_integer(options, 'delay', self.rateLimit)
            # fetch the snapshot in a separate async call after a warmup delay
            self.delay(delay, self.fetch_order_book_snapshot, client, subscription)
        orderbook = await self.watch(url, messageHash, None, messageHash, subscription)
        return orderbook.limit()

    async def fetch_order_book_snapshot(self, client, subscription):
        symbol = self.safe_string(subscription, 'symbol')
        messageHash = self.safe_string(subscription, 'messageHash')
        try:
            # todo: self is a synch blocking call in ccxt.php - make it async
            snapshot = await self.fetch_order_book(symbol)
            orderbook = self.orderbooks[symbol]
            messages = orderbook.cache
            orderbook.reset(snapshot)
            # unroll the accumulated deltas
            for i in range(0, len(messages)):
                message = messages[i]
                self.handle_order_book_message(client, message, orderbook)
            self.orderbooks[symbol] = orderbook
            client.resolve(orderbook, messageHash)
        except Exception as e:
            client.reject(e, messageHash)

    def handle_order_book(self, client, message, subscription):
        messageHash = self.safe_string(subscription, 'messageHash')
        symbol = self.safe_string(subscription, 'symbol')
        orderbook = self.safe_value(self.orderbooks, symbol)
        if orderbook is None:
            return message
        if orderbook['nonce'] is None:
            orderbook.cache.append(message)
        else:
            self.handle_order_book_message(client, message, orderbook)
            client.resolve(orderbook, messageHash)
        return message

    def handle_order_book_message(self, client, message, orderbook):
        #
        #     {
        #         messageId: 'CAAQAA==',
        #         payload: 'eyJidXkiOiBbeyJhbW91bnQiOiAiMC4wOTMxMiIsICJ0b3RhbCI6ICI4MzguMDgiLCAicHJpY2UiOiAiOTAwMC4wMCJ9XSwgInNlbGwiOiBbeyJhbW91bnQiOiAiMC4wMDAwMCIsICJ0b3RhbCI6ICIwLjAwIiwgInByaWNlIjogIjkwMDAuMDAifV0sICJ1cGRhdGVkX2lkIjogMTI0NDA0fQ==',
        #         properties: {},
        #         publishTime: '2020-10-03T10:05:09.445Z'
        #     }
        #
        payload = self.safe_string(message, 'payload')
        if payload is None:
            return message
        data = json.loads(self.base64_to_string(payload))
        #
        #     {
        #         "buy": [
        #             {"amount": "0.05000", "total": "532.77", "price": "10655.41"}
        #         ],
        #         "sell": [
        #             {"amount": "0.00000", "total": "0.00", "price": "10655.41"}
        #         ],
        #         "updated_id": 99740
        #     }
        #
        nonce = self.safe_integer(data, 'updated_id')
        if nonce > orderbook['nonce']:
            asks = self.safe_value(data, 'sell', [])
            bids = self.safe_value(data, 'buy', [])
            self.handle_deltas(orderbook['asks'], asks, orderbook['nonce'])
            self.handle_deltas(orderbook['bids'], bids, orderbook['nonce'])
            orderbook['nonce'] = nonce
            timestamp = self.parse8601(self.safe_string(message, 'publishTime'))
            orderbook['timestamp'] = timestamp
            orderbook['datetime'] = self.iso8601(timestamp)
        return orderbook

    def handle_delta(self, bookside, delta):
        price = self.safe_float(delta, 'price')
        amount = self.safe_float(delta, 'amount')
        bookside.store(price, amount)

    def handle_deltas(self, bookside, deltas):
        for i in range(0, len(deltas)):
            self.handle_delta(bookside, deltas[i])

    async def ack(self, client, messageId):
        # the exchange requires acknowledging each received message
        await client.send({'messageId': messageId})

    def handle_message(self, client, message):
        #
        #     {
        #         messageId: 'CAAQAA==',
        #         payload: 'eyJidXkiOiBbeyJhbW91bnQiOiAiMC4wNTAwMCIsICJ0b3RhbCI6ICI1MzIuNzciLCAicHJpY2UiOiAiMTA2NTUuNDEifV0sICJzZWxsIjogW3siYW1vdW50IjogIjAuMDAwMDAiLCAidG90YWwiOiAiMC4wMCIsICJwcmljZSI6ICIxMDY1NS40MSJ9XSwgInVwZGF0ZWRfaWQiOiA5OTc0MH0=',
        #         properties: {},
        #         publishTime: '2020-09-30T17:35:27.851Z'
        #     }
        #
        messageId = self.safe_string(message, 'messageId')
        if messageId is not None:
            # the exchange requires acknowledging each received message
            self.spawn(self.ack, client, messageId)
        keys = list(client.subscriptions.keys())
        firstKey = self.safe_string(keys, 0)
        subscription = self.safe_value(client.subscriptions, firstKey, {})
        method = self.safe_value(subscription, 'method')
        if method is not None:
            return method(client, message, subscription)
        return message
