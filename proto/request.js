const { vendor, network, version, flags } = require('../lib/constants')
const ba = require('buffer-array')
const addr = require('../lib/enc/address')

const PR_HEADER_SIZE	= 8 + 4 + 4
const INETSOCKETADDRESS_IPV4_SIZE	= 4

class Request {
  constructor(opts) {
    const {
      action,
      address,
      port,
      instance,
      connection,
      transaction,
      protocol,
      flags2,
      time
    } = opts

    this.action = action
    this.connection = connection
    this.transaction = transaction
    this.protocol = protocol
    this.vendor = 'vendor' in opts ? opts.vendor : vendor.AELITIS
    this.network = 'network' in opts ? opts.network : network.Stable
    this.local_protocol = version.PROTOCOL_VERSION_PACKET_FLAGS2
    this.instance = instance
    this.address = address
    this.port = port
    this.time = time || new Date()
    this.flags = opts.flags | 0
    this.flags2 = flags2 === void 0 ? flags.FLAG_DOWNLOADING : flags2
  }

  static from(opts) {
    const props = [
      'action',
      'transaction',
      'connection',
      'protocol',
      'vendor',
      'network',
      'local_protocol',
      'instance',
      'address',
      'port',
      'time',
      'flags',
      'flags2'
    ]

    const req = {}

    for(const prop of props) {
      req[prop] = opts[prop]
    }

    Object.setPrototypeOf(req, Request.prototype)
    return req
  }
}

/**
 * Encode request packet
 * @param req {Request}
 * @param dest {Buffer} optional
 * @param offset {number}
 */
function encode(req, dest, offset) {
  if (req.protocol > req.local_protocol) {
    req.protocol = req.local_protocol
  }

  offset = offset | 0
  const packet = ba(dest || Buffer.allocUnsafe(encodingLength(req)))
  encode.bytes = 0

  packet.seek(offset)

  packet.push(req.connection)
  packet.pushInt32BE(req.action)
  packet.pushInt32BE(req.transaction)
  packet.pushInt8(req.protocol)
  encode.bytes = 8 + 2 * 4 + 1

  if (req.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    packet.pushInt8(req.vendor)
    encode.bytes += 1
  }

  if (req.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    packet.pushInt32BE(req.network)
    encode.bytes += 4
  }

  if (req.protocol >= version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    packet.pushInt8(req.local_protocol)
    encode.bytes += 1
  }

  packet.pushInt8(INETSOCKETADDRESS_IPV4_SIZE)
  packet.push( addr.encode(req) /*Buffer.from(s2c(req.address + ":" + req.port), 'hex')*/ )
  encode.bytes += 1 + INETSOCKETADDRESS_IPV4_SIZE

  packet.pushInt32BE(req.instance)
  encode.bytes += 4

  const time = req.time.getTime().toString(16)
  packet.push(Buffer.from(time.length % 2 ? '0' + time : time, 'hex'))
  encode.bytes += 8

  if (req.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    packet.pushInt8(req.flags)
    encode.bytes += 1
  }

  if (req.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    packet.pushInt8(req.flags2)
    encode.bytes += 1
  }

  return packet.toBuffer()
}

/**
 * Encode request packet
 * @param req {Request}
 * @param buf {Buffer}
 * @param offset {Number}
 */
encode.postSerialise = function postSerialise(req, buf, offset) {
  postSerialise.bytes = 0
  offset = offset | 0
  
  if (req.protocol < version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    buf.writeInt8(req.local_protocol, offset)
    postSerialise.bytes = 1    
  }
  
  return buf
}

/**
 * expected packet's size
 * @param req {Request}
 * @returns {number}
 */
function encodingLength(req) {
  let size = PR_HEADER_SIZE + 1

  if (req.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    size += 1
  }

  if (req.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    size += 4
  }

  if (req.protocol >= version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    size += 1
  }

  size += 1 + INETSOCKETADDRESS_IPV4_SIZE + 4 + 8

  if (req.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    size += 1
  }

  if (req.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    size += 1
  }

  // postserialize
  if (req.protocol < version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    size += 1
  }

  return size
}

function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  const packet = ba(buf.slice(start, end))
  const opts = {}

  opts.connection = packet.read(8)
  opts.action = packet.readInt32BE()
  opts.transaction = packet.readInt32BE()
  opts.protocol = packet.readInt8()
  decode.bytes = 4 + 4 + 8 + 1

  if (opts.protocol >= version.PROTOCOL_VERSION_VENDOR_ID) {
    opts.vendor = packet.readInt8()
    decode.bytes += 1
  }

  if (opts.protocol >= version.PROTOCOL_VERSION_NETWORKS) {
    opts.network = packet.readInt32BE()
    decode.bytes += 4
  }

  // TODO: check protocol if network == cvs

  if (opts.protocol >= version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    opts.local_protocol = packet.readInt8()
    decode.bytes += 1
  } else {
    opts.local_protocol = opts.protocol
  }

  const addr_size = packet.readInt8()
  const ipport = addr.decode(packet.read(addr_size))

  opts.address = ipport.address
  opts.port = ipport.port
  decode.bytes += 1 + addr_size

  opts.instance = packet.readInt32BE()
  decode.bytes += 4

  // TODO: decode time

  if (opts.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS) {
    opts.flags  = packet.readInt8()
    decode.bytes += 1
  }

  if (opts.protocol >= version.PROTOCOL_VERSION_PACKET_FLAGS2) {
    opts.flags2  = packet.readInt8()
    decode.bytes += 1
  }

  return Request.from(opts)
}

decode.postDeserialise = function postDeserialise(packet, req) {
  postDeserialise.bytes = 0

  if (req.protocol < version.PROTOCOL_VERSION_FIX_ORIGINATOR) {
    if (packet.length) {
      req.local_protocol = packet.readInt8()
      postDeserialise.bytes = 1
    } else {
      req.local_protocol = req.protocol
    }

    // if the originator is a higher version than us then we can't do anything sensible
    // working at their version (e.g. we can't reply to them using that version).
    // Therefore trim their perceived version back to something we can deal with
    if (req.local_protocol > req.protocol) {
      req.local_protocol = req.protocol
    }
  }
}

module.exports = {
  encode,
  encodingLength,
  decode,
  Request
}
