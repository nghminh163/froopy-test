const crypto = require('crypto');
function sha256(data, isHex = false) {
    if (isHex) {
        return crypto.createHash('sha256').update(data).digest('hex')
    }
    return crypto.createHash('sha256').update(data).digest()
}

module.exports = { sha256 }