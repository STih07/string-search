const fs = require('fs');
const byline = require('byline');
const express = require('express');
const app = express();
const port = process.env.PORT || 3002;
const path = require('path');

const filename = path.resolve(__dirname, '..', '17.1-EX_XML_EDR_UO_23.06.2021.xml');

let i = 0;
const stream = byline(fs.createReadStream(filename, { encoding: 'utf8' }));
stream.on('data', (line) => {
    if (i++ < 5) {
        console.log(line);
    } else {
        stream.destroy();
    }
});

app.use('/', express.static(__dirname + '/static'));

app.get('/search', (req, res) => {
    const { exact = true, NAME, ADDRESS, EDRPOU } = req.query;
    const stream = byline(fs.createReadStream(filename, { encoding: 'utf8' }));
    const paramvalues = [
        {
            param: 'NAME',
            value: NAME
        },
        {
            param: 'ADDRESS',
            value: ADDRESS
        },
        {
            param: 'EDRPOU',
            value: EDRPOU
        }
    ].filter(kv => !!kv.value);

    if (paramvalues.length) {
        stream.on('data', (line) => {
            if (okByParams(paramvalues, line, exact)) {
                stream.destroy();
                res.set('Content-Type', 'text/xml')
                res.send(line);
            }
        });
        stream.on('end', () => res.sendStatus(404));
    } else {
        res.sendStatus(400);
    }
});

const okByParam = (param, value, line, exact = true) => {
    exact = (exact === 'true');
    const substr = line.match(`(?<=<${param}>).*(?=<\/${param}>)`);
    if (substr) {
        const ok = exact ? substr == value : substr[0].match(value);
        return ok;
    }
    return false;
}

const okByParams = (paramvalues, line, exact = true) => {
    return paramvalues.every(({param, value}) => okByParam(param, value, line, exact));
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})