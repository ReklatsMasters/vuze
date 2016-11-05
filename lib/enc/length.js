/**
 * encode / decode length
 */

module.exports = {
  encode,
  decode,
  encodingLength
}

function encode(len, buf, offset) {
  len = len | 0
  const max = encode.max | 0
  encode.max = void 0

  if (!max) {
    throw new Error('Please set `encode.max`, see `serialiseLength` in Vuze src')
  }

  if ( len > max ){
    throw( new Error(`Invalid DHT data length: max=${ max },actual=${ len }`))
  }

  offset = offset | 0
  const packet = buf || Buffer.allocUnsafe(encodingLength(opts))

  if (max < 2 << 7) {
    packet.writeInt8(len, offset)
    encode.bytes = 1
  } else if (max < 2 << 15) {
    packet.writeInt16BE(len, offset)
    encode.bytes = 2
  } else {
    packet.writeInt32BE(len, offset)
    encode.bytes = 4
  }

  return packet
}

/**
 * length
 * @param opts {{max: Number}}
 * @returns {number}
 */
function encodingLength(opts) {
  return opts.max < 256 ? 1 : opts.max < 65536 ? 2 : 4
}

function decode(buf, start, end) {
  const max = decode.max | 0
  decode.max = void 0

  if (!max) {
    throw new Error('Please set `decode.max`, see `deserialiseLength` in Vuze src')
  }

  start = start | 0
  end = end | 0 || buf.length
  let len = 0

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  if (max < 256) {
    len = buf.readInt8(0) & 0xff
    decode.bytes = 1
  } else if (max < 65536) {
    len = buf.readInt16BE(0) & 0xffff
    decode.bytes = 2
  } else {
    len = buf.readInt32BE(0)
    decode.bytes = 4
  }

  if ( len > max ) {
    throw( new Error(`Invalid DHT data length: max=${ max },actual=${ len }`))
  }

  return len
}
