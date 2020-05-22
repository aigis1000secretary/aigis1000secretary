
module.exports = {

    decrypt(data, key) {
        if (!data) return null;
        let decipher = require('crypto').createDecipher('aes192', key);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },

    encrypt(data, key) {
        if (!data) return null;
        let cipher = require('crypto').createCipher('aes192', key)
        let crypted = cipher.update(data, 'utf8', 'hex')
        crypted += cipher.final('hex');
        return crypted;
    }
}