/**
 * encode / decode address
 */

const s2c = require('string2compact')
const c2s = require('compact2string')

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode(opts, buf, offset) {
  opts = opts || {}
  offset = offset | 0
  buf = buf || Buffer.allocUnsafe(encodingLength(opts))

  const { address, port } = opts

  buf.write(s2c(address + ':' + port), offset, 'hex')
  encode.bytes = 6

  return buf
}

/**
 * decode one address
 * @param buf
 * @param offset
 * @param end
 */
function decode(buf, offset, end) {
  offset = offset | 0
  end = end | 0 || buf.length

  const addr = buf.slice(offset, end)
  
  if (addr.length != 6) {
    throw new Error('Incorrect address size')  
  }
  
  const ipport = c2s(addr)
  const [address, port] = ipport.split(":")

  decode.bytes = 6
  return {address, port}
}


function encodingLength() {
  // only for ipv4
  return 6
}
