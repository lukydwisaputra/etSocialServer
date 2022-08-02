require('dotenv').config();
const Crypto = require('crypto');

module.exports = {
    hashPassword: (pass) => {
        return Crypto.createHmac(
            process.env.ENCRYPTION_ALGORITHM, 
            process.env.ENCRYPTION_KEY).update(pass).digest(process.env.ENCRYPTION_OUTPUT);
    }
}