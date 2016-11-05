const { vendor, network, version, flags } = require('../lib/constants')
const HEADER_SIZE = 26

/**
 * encode Reply packet
 *
 * @param reply {Reply}
 * @param buf {Buffer}
 * @param offset {number}
 */
function encode(reply, buf, offset) {
  offset = offset | 0
  buf = buf || Buffer.allocUnsafe(encodingLength(reply))
  encode.bytes = 0

  buf.writeInt32BE(reply.action, offset + encode.bytes)
  encode.bytes += 4

  buf.writeInt32BE(reply.transaction, offset + encode.bytes)
  encode.bytes += 4

  reply.connection.copy(buf, offset + encode.bytes, 0, 8)
  encode.bytes += 8

  buf.writeInt8(reply.protocol, offset + encode.bytes)
  encode.bytes += 1

  if (reply.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    buf.writeInt8(reply.vendor, offset + encode.bytes)
    encode.bytes += 1
  }

  if (reply.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    buf.writeInt32BE(reply.network, offset + encode.bytes)
    encode.bytes += 4
  }

  buf.writeInt32BE(reply.target_instance, offset + encode.bytes)
  encode.bytes += 4

  if (reply.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    buf.writeInt8(reply.flags, offset + encode.bytes)
    encode.bytes += 1
  }

  if (reply.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    buf.writeInt8(reply.flags2, offset + encode.bytes)
    encode.bytes += 1
  }

  return buf
}

/**
 * decode Reply packet
 *
 * @param buf {Buffer}
 * @param start
 * @param end
 * @returns {Reply}
 */
function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  if (buf.length < HEADER_SIZE) {
    throw new Error(`Incorrect header size, it must be >= ${HEADER_SIZE}`)
  }

  const opts = new Reply()
  decode.bytes = 0

  opts.action = buf.readInt32BE(decode.bytes)
  decode.bytes += 4

  opts.transaction = buf.readInt32BE(decode.bytes)
  decode.bytes += 4

  opts.connection = buf.slice(decode.bytes, decode.bytes + 8)
  decode.bytes += 8

  opts.protocol = decode.readInt8(decode.bytes)
  decode.bytes += 1

  if (opts.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    opts.vendor = buf.readInt8(decode.bytes)
    decode.bytes += 1
  }

  if (opts.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    opts.network = buf.readInt32BE(decode.bytes)
    decode.bytes += 4
  }

  // TODO: check protocol if network == cvs

  opts.targen_instance = buf.readInt32BE(decode.bytes)
  decode.bytes += 4

  if (opts.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    opts.flags  = buf.readInt8(decode.bytes)
    decode.bytes += 1
  }

  if (opts.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    opts.flags2  = buf.readInt8(decode.bytes)
    decode.bytes += 1
  }

  return opts
}

/**
 * @param reply {Reply}
 */
function encodingLength(reply) {
  let size = 4 + 4 + 8 + 1

  if (reply.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    size += 1
  }

  if (reply.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    size += 4
  }

  size += 4

  if (reply.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    size += 1
  }

  if (reply.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    size += 1
  }

  return size
}

class Reply {
  constructor(opts) {
    opts = opts || {}
    
    const {
      action,
      targen_instance,
      connection,
      transaction,
      protocol,
      flags2
    } = opts

    this.action = action
    this.transaction = transaction
    this.connection = connection
    this.protocol = protocol
    this.vendor = vendor.AELITIS
    this.network = network.Stable
    this.target_instance = targen_instance
    this.flags = opts.flags | 0
    this.flags2 = flags2 === void 0 ? flags.FLAG_DOWNLOADING : flags2
    this.network_positions = []
  }
}

module.exports = {
  encode,
  encodingLength,
  decode,
  Reply,
  HEADER_SIZE
}
