const { Reply } = require('../reply')
const reply = require('../reply')
const { action, version } = require('../../lib/constants')
const vivaldi = require('../../lib/enc/vivaldi')
const alt = require('../../lib/enc/alt_contacts')

class PingReply extends Reply {
  constructor(opts) {
    opts.action = action.ACT_REPLY_PING

    super(opts)

    this.alt_contacts = []
  }
}

/**
 * encode ping reply
 * @param ping {PingReply}
 * @param buf {Buffer}
 * @param offset {number}
 */
function encode(ping, buf, offset) {
  offset = offset | 0
  buf = buf || Buffer.allocUnsafe(encodingLength(ping))

  reply.encode(ping, buf, offset)
  encode.bytes = reply.encode.bytes

  if (ping.protocol >= version.PROTOCOL_VERSION_VIVALDI) {
    vivaldi.encode(ping.network_positions, buf, offset + encode.bytes)
    encode.bytes += vivaldi.encode.bytes
  }

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    alt.encode(ping.alt_contacts, buf, offset + encode.bytes)
    encode.bytes += alt.encode.bytes
  }

  return buf
}

function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  const ping = reply.decode(buf, start, end)
  Object.setPrototypeOf(ping, PingReply.prototype)
  decode.bytes = reply.decode.bytes

  if (ping.protocol >= version.PROTOCOL_VERSION_VIVALDI) {
    ping.network_positions = vivaldi.decode(buf, start + decode.bytes, end)
    decode.bytes += vivaldi.decode.bytes
  }

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    ping.alt_contacts = alt.decode(buf, start + decode.bytes, end)
    decode.bytes += alt.decode.bytes
  }

  return ping
}

function encodingLength(ping) {
  let size = reply.encodingLength(ping)

  if (ping.protocol >= version.PROTOCOL_VERSION_VIVALDI) {
    size += vivaldi.encodingLength(ping.network_positions)
  }

  if (ping.protocol >= version.PROTOCOL_VERSION_ALT_CONTACTS) {
    size += alt.encodingLength(ping.alt_contacts)
  }

  return size
}

module.exports = {
  encode,
  decode,
  encodingLength,
  PingReply
}
