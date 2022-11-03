const exchanges = require ('./../../exchanges.json').ids;
const { spawn } = require('child_process');
function c(...args){console.log(...args);} function cc(o){console.dir(o, {'maxArrayLength': null});} function x(...args){c(...args);process.exit();} function xx(o){cc(o);process.exit();}





const sleep = s => new Promise (resolve => setTimeout (resolve, s*1000))
const timeout = (s, promise) => Promise.race ([ promise, sleep (s).then (() => { throw new Error ('timed out') }) ])


const exec = (bin, ...args) =>

/*  A custom version of child_process.exec that captures both stdout and
    stderr,  not separating them into distinct buffers — so that we can show
    the same output as if it were running in a terminal.                        */

    timeout (120, new Promise (return_ => {

        const ps = require ('child_process').spawn (bin, args)

        let output = ''
        let stderr = ''
        let hasWarnings = false

        ps.stdout.on ('data', data => { 
            output += data.toString () 
        })
        ps.stderr.on ('data', data => { 
            output += data.toString (); stderr += data.toString (); hasWarnings = true 
        })

        ps.on ('exit', code => {

            output = output.trim ()

            const regex = /\[[a-z]+?\]/gmi

            let match = undefined
            const warnings = []

            match = regex.exec (output)

            if (match) {
                warnings.push (match[0])
                do {
                    if (match = regex.exec (output)) {
                        warnings.push (match[0])
                    }
                } while (match);
            }

            return_ ({
                failed: code !== 0,
                output,
                hasOutput: output.length > 0,
                hasWarnings: hasWarnings || warnings.length > 0,
                warnings: warnings,
            })
        })

    })).catch (e => ({

        failed: true,
        output: e.message

    })).then (x => Object.assign (x, { hasOutput: x.output.length > 0 }))


async function init(exchange, symbol)
{
    const res = await exec (...['node',      './js/test/test.js',    ...[exchange, symbol === 'all' ? [] : symbol]])
    c(res);
}


for (const exId of exchanges) {
    init(exId, 'all');
    break;
    //const ps = spawn('node', ['D:\\SAQME\\shekvetebi\\CCXT\\c\\js\\test\\test.js ' + exId + ' BTC/USDT']);
    //ps.stdout.on ('data', data => { c = data.toString () })
    //break;
}