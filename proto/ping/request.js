const { Request } = require('../request')
const req = require('../request')
const { action, version } = require('../../lib/constants')
const altreq = require('../../lib/enc/alt_contact_request')

class PingReq extends Request {
  constructor(opts) {
    opts.action = action.ACT_REQUEST_PING

    super(opts)

    this.alt_networks = []
    this.alt_network_counts = []
  }
}

/**
 * encode `ping` request
 * @param ping {PingReq}
 * @param buf {Buffer}
 * @param offset {number}
 */
function encode(ping, buf, offset) {
  offset = offset | 0
  const packet = buf || Buffer.allocUnsafe(encodingLength(ping))

  req.encode(ping, packet, offset)
  encode.bytes = req.encode.bytes

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    altreq.encode(ping, packet, offset + encode.bytes)
    encode.bytes += altreq.encode.bytes
  }

  req.encode.postSerialise(ping, packet, offset + encode.bytes)
  encode.bytes += req.encode.postSerialise.bytes

  return packet
}

/**
 * calculate length for `ping` request
 * @param ping {PingReq}
 * @returns {number}
 */
function encodingLength(ping) {
  let size  = req.encodingLength(ping)

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    size += altreq.encodingLength(ping)
  }

  return size
}

function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  const ping = req.decode(buf, start, end)
  Object.setPrototypeOf(ping, PingReq.prototype)
  decode.bytes = req.decode.bytes

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    const { nets, counts } = altreq.decode(buf, start + req.decode.bytes, end)
    
    ping.alt_networks = nets
    ping.alt_network_counts = counts
    
    decode.bytes += altreq.decode.bytes
  }

  req.decode.postDeserialise(buf, ping)
  decode.bytes += req.decode.postDeserialise.bytes

  return ping
}

module.exports = {
  encode,
  encodingLength,
  decode,
  PingReq
}
