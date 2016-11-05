const length = require('./length')

/**
 *
 * @param ping {PingReq}
 * @param buf {Buffer}
 * @param offset {number}
 */
function encode(ping, buf, offset) {
  offset = offset | 0
  buf = buf || Buffer.allocUnsafe(encodingLength(ping))

  const nets = ping.alt_networks
  const counts = ping.alt_network_counts

  const len = !nets || !counts ? 0 : nets.length

  length.encode.max = 16
  length.encode(len, buf, offset)
  encode.bytes = length.encode.bytes

  for(let i = 0; i < len; ++i) {
    buf.writeInt32BE(nets[i], offset + encode.bytes)
    encode.bytes += 4

    buf.writeInt32BE(counts[i], offset + encode.bytes)
    encode.bytes += 4
  }

  return buf
}

/**
 *
 * @param buf {Buffer}
 * @param start {number}
 * @param end {number}
 */
function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  length.decode.max = 16
  const len = length.decode(buf, start)
  decode.bytes = length.decode.bytes

  const nets = new Array(len)
  const counts = new Array(len)

  for(let i = 0; i < len; ++i) {
    nets[i] = buf.readInt32BE(start + decode.bytes)
    decode.bytes += 4

    counts[i] = buf.readInt32BE(start + decode.bytes)
    decode.bytes += 4

    if (nets[i] == -1 || counts[i] == -1) {
      throw new Error("EOF")
    }
  }

  return {
    nets,
    counts
  }
}

function encodingLength(ping) {
  const nets = ping.alt_networks
  const len = !nets ? 0 : nets.length

  return length.encodingLength({max: 16, len}) + len * 2 * 4
}

module.exports = {
  encode,
  encodingLength,
  decode
}
