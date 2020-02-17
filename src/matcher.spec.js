const fs = require('fs');
const crypto = require('crypto');
const temp = require('temp');
const Matcher = require('./matcher');
const should = require('chai').should();
const es = require('event-stream');

const testSourcePath = temp.path();
const testCount = 100000;
const matchedItemsCount = 50000;
const matchedArray = new Array(matchedItemsCount);

const getRandomPhone = () => crypto.randomBytes(16).toString('hex');


describe('Matcher', function () {
    this.timeout(60000);

    before(async () => {
        const dataStream = fs.createWriteStream(testSourcePath);
        for (let i = 0; i < testCount; i++) {
            const phone = getRandomPhone();
            dataStream.write(phone + '\n');
            if (i < matchedItemsCount) {
                matchedArray[i] = phone;
            }
        }
        dataStream.end();
        return new Promise((resolve, reject) => {
            dataStream.once('close', resolve);
            dataStream.once('error', reject);
        });
    });

    describe('#findMatchingCount', () => {
        it('should correctly find matching lines', async () => {
            const stream = fs.createReadStream(testSourcePath, 'utf8').pipe(es.split());
            const matcher = new Matcher('scrypt', {N: 4, r: 1, p: 1});
            const batchLength = 10000;
            const testSet = new Set();
            let matchedCount = 0;
            for (let i = 0; i < batchLength; i++) {
                if (Math.random() > 0.1) {
                    testSet.add(getRandomPhone());
                } else {
                    while (true) {
                        const matchedItem = matchedArray[Math.trunc(Math.random() * matchedItemsCount)];
                        if (!testSet.has(matchedItem)) {
                            testSet.add(matchedItem);
                            matchedCount++;
                            break;
                        }
                    }
                }
            }
            const salt = crypto.randomBytes(16).toString('hex');
            const testItems = await Promise.all(Array.from(testSet).map((line) => matcher.makeHash(line, salt)));
            console.time('matching time');
            const result = await matcher.findMatchingCount(stream, testItems, salt);
            console.timeEnd('matching time');
            should.exist(result);
            result.should.be.equal(matchedCount);
        });
    });

    after(() => {
        fs.unlinkSync(testSourcePath);
    });
});
