
const crypto = require('crypto');
// const ENCRYPTION_KEY = 'Put_Your_Password_Here'.padEnd(32, "_");
// const ENCRYPTION_KEY = Buffer.from('FoCKvdLslUuB4y3EZlKate7XGottHski1LmyqJHvUhs=', 'base64');console.log(ENCRYPTION_KEY);
const ENCRYPTION_KEY = process.env.LINE_ALPHAT_JSONKEY;
const IV_LENGTH = 16;

module.exports = {

    decrypt(text, key = ENCRYPTION_KEY) {
        if (!text) return null;
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },

    encrypt(text, key = ENCRYPTION_KEY) {
        if (!text) return null;
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

}