/**
 * encode / decode alt contacts
 */

const length = require('./length')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode(alt_contacts, buf, offset) {
  alt_contacts = alt_contacts || []

  if (!Array.isArray(alt_contacts)) {
    throw new TypeError('The `alt_contacts` must be an Array')
  }

  buf = buf || Buffer.allocUnsafe(encodingLength(alt_contacts))
  offset = offset | 0

  length.encode.max = 64
  length.encode(alt_contacts.length, buf, offset)
  encode.bytes = length.encode.bytes

  if (alt_contacts.length) {
    throw new Error('Not implemented')
    // TODO: see (5.7.x) .\azureus2\src\com\aelitis\azureus\core\dht\transport\udp\impl\DHTUDPUtils.java
    // TODO: protected static void serialiseAltContacts( DataOutputStream	os, DHTTransportAlternativeContact[] contacts)
  }

  return buf
}

function encodingLength(alt_contacts) {
  alt_contacts = alt_contacts || []

  if (!Array.isArray(alt_contacts)) {
    throw new TypeError('The `alt_contacts` must be an Array')
  }

  return length.encodingLength({len: alt_contacts.length, max: 64})
}

function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  length.decode.max = 64
  length.decode(buf, start)
  
  decode.bytes = length.decode.bytes
  return []
}
