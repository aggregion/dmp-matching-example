const es = require('event-stream');
const crypto = require('crypto');

class Matcher {
    /**
     * Creates a new instance
     * @param {string} algo Hashing algorithm
     * @param {object} options Algorithm options
     */
    constructor(algo, options) {
        if (['scrypt'].indexOf(algo) === -1) {
            throw new Error(`Unsupported algo: ${algo}`);
        }
        this._options = options;
    }

    /**
     * Finds matching data
     * @param {Stream.Readable<string>} sourceStream Source data stream
     * @param {string[]} items Items to find matching
     * @param {string} salt
     * @return {Promise<number>}
     */
    async findMatchingCount(sourceStream, items, salt) {
        const set = new Set(items);
        let matchedCount = 0;
        const stream = sourceStream.pipe(es.mapSync(async (line) => {
            const hashedLine = await this.makeHash(line, salt);
            if (set.has(hashedLine)) {
                matchedCount++;
            }
        }));


        return new Promise((resolve, reject) => {
            stream
                .once('error', (err) => reject(err))
                .once('end', () => resolve(matchedCount));
        });
    }

    /**
     * Makes a hash
     * @param {string|Buffer} data
     * @param {string|Buffer} salt
     * @return {Promise<string>}
     */
    async makeHash(data, salt) {
        const options = this._options || {N: 4, r: 1, p: 1};
        return new Promise((resolve, reject) => {
            crypto.scrypt(data, salt, 16, options, (err, hash) => {
                if (err) {
                    return reject(err);
                }
                return resolve(hash.toString('hex'));
            });
        })
    }
}

module.exports = Matcher;
