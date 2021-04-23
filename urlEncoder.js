
const iconv = require("iconv-lite");

const _urlEncode = (decoded, codePage) => {
    let buffer = iconv.encode(decoded, codePage), encoded = "";
    for (let i = 0; i < buffer.length; ++i) { encoded += "%" + buffer[i].toString(16); }
    return encoded.toLowerCase();   // .toUpperCase();
}
const urlEncode = (decoded, codePage) => {
    let url = encodeURI(decoded);
    let i = 0; for (i = 0; i < decoded.length; ++i) { if (decoded[i] != url[i]) { break; } }
    return `${url.substring(0, i)}${_urlEncode(decoded.substring(i), codePage)}`;
}
const urlEncodeJP = (str_utf8) => { return urlEncode(str_utf8, "EUC-JP"); }
const urlEncodeBIG5 = (str_utf8) => { return urlEncode(str_utf8, "BIG5"); }


const urlDecode = (encoded, codePage) => {
    // search %xx
    if (/(%[0-9a-f]{2})+/i.test(encoded)) {
        let enc = /(%[0-9a-f]{2})+/i.exec(encoded)[0];  // split %xx
        let decoded = Buffer.from('');  // decode %xx
        for (let c of enc.match(/%[0-9a-f]{2}/g)) { decoded = Buffer.concat([decoded, Buffer.from(c.substring(1), 'hex')]) }
        encoded = encoded.replace(enc, iconv.decode(decoded, codePage))   // replace %xx
    }
    return encoded;
}
const urlDecodeJP = (encoded) => { return urlDecode(encoded, "EUC-JP"); }
const urlDecodeBIG5 = (encoded) => { return urlDecode(encoded, "BIG5"); }



module.exports = {
    urlEncode,
    urlEncodeJP,
    urlEncodeBIG5,

    urlDecode,
    urlDecodeJP,
    urlDecodeBIG5
}
