<?php
namespace ccxt;
use \ccxt\Precise;

// ----------------------------------------------------------------------------

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

// -----------------------------------------------------------------------------
include_once __DIR__ . '/test_shared_methods.php';

function test_trade($exchange, $skipped_properties, $method, $entry, $symbol, $now) {
    $format = array(
        'info' => array(),
        'id' => '12345-67890:09876/54321',
        'timestamp' => 1502962946216,
        'datetime' => '2017-08-17 12:42:48.000',
        'symbol' => 'ETH/BTC',
        'order' => '12345-67890:09876/54321',
        'side' => 'buy',
        'takerOrMaker' => 'taker',
        'price' => $exchange->parse_number('0.06917684'),
        'amount' => $exchange->parse_number('1.5'),
        'cost' => $exchange->parse_number('0.10376526'),
        'fees' => [],
        'fee' => array(),
    );
    // todo: add takeOrMaker as mandatory (atm, many exchanges fail)
    // removed side because some public endpoints return trades without side
    $empty_allowed_for = ['fees', 'fee', 'symbol', 'order', 'id', 'takerOrMaker', 'timestamp', 'datetime'];
    assert_structure($exchange, $skipped_properties, $method, $entry, $format, $empty_allowed_for);
    assert_timestamp_and_datetime($exchange, $skipped_properties, $method, $entry, $now);
    assert_symbol($exchange, $skipped_properties, $method, $entry, 'symbol', $symbol);
    //
    assert_in_array($exchange, $skipped_properties, $method, $entry, 'side', ['buy', 'sell']);
    assert_in_array($exchange, $skipped_properties, $method, $entry, 'takerOrMaker', ['taker', 'maker']);
    assert_fee_structure($exchange, $skipped_properties, $method, $entry, 'fee');
    if (!(is_array($skipped_properties) && array_key_exists('fees', $skipped_properties))) {
        // todo: remove undefined check
        if ($entry['fees'] !== null) {
            for ($i = 0; $i < count($entry['fees']); $i++) {
                assert_fee_structure($exchange, $skipped_properties, $method, $entry['fees'], $i);
            }
        }
    }
}
