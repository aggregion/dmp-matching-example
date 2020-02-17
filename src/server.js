const express = require('express');
const app = express();
const Joi = require('joi');
const validate = require('express-validation');
const Matcher = require('./matcher');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const es = require('event-stream');


app.use(bodyParser.json());

app.post('/match', validate({
    body: {
        algo: Joi.string().required(),
        salt: Joi.string().required(),
        items: Joi.array().required(),
        options: Joi.object()
    }
}), async (req, res, next) => {
    const matcher = new Matcher(req.body.algo, req.body.options);
    const stream = fs.createReadStream(path.join(__dirname, './data.txt'), 'utf8').pipe(es.split());
    try {
        const result = await matcher.findMatchingCount(stream, req.body.items, req.body.salt);
        return res.json({matchedCount: result});
    } catch (e) {
        return next(e);
    }
});

app.use(function (err, req, res, next) {
    res.status(400).json(err);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
});

// do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

function exitHandler() {
    process.exit(0);
}

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});
