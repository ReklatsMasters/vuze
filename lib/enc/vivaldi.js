/**
 * encode / decode vivaldi coordinates
 */

const vc = require('vivaldi-coordinates')

const POSITION_TYPE_VIVALDI_V1 = 1
const ENCODED_SIZE = 4 * 4

module.exports = {
  encode,
  decode,
  encodingLength
}

/**
 * encode position
 * @param nps {Array<VivaldiPosition>}
 * @param buf {Buffer}
 * @param offset {number}
 */
function encode(nps, buf, offset) {
  nps = nps || []
  offset = offset | 0
  buf = buf || Buffer.allocUnsafe(encodingLength(nps))

  buf.writeUInt8(nps.length, offset)
  encode.bytes = 1

  for(const pos of nps) {
    buf.writeInt8(POSITION_TYPE_VIVALDI_V1, offset + encode.bytes)
    buf.writeInt8(ENCODED_SIZE, offset + encode.bytes + 1)
    encode.bytes += 2

    const coords = pos.toFloatArray()

    buf.writeFloatBE(coords[0], offset + encode.bytes)
    buf.writeFloatBE(coords[1], offset + encode.bytes + 4)
    buf.writeFloatBE(coords[2], offset + encode.bytes + 4*2)
    buf.writeFloatBE(coords[3], offset + encode.bytes + 4*3)

    encode.bytes += ENCODED_SIZE
  }

  return buf
}

function encodingLength(nps) {
  return 1 + (2 + ENCODED_SIZE) * nps.length
}

function decode(buf, start, end) {
  start = start | 0
  end = end | 0 || buf.length

  if (start != 0 || end != buf.length) {
    buf = buf.slice(start, end)
  }

  const size = buf.readUInt8(start)
  decode.bytes = 1

  const nps = new Array(size)

  for(let i = 0; i < size; ++i) {
    const type = buf.readUInt8(start + decode.bytes)
    const count = buf.readUInt8(start + decode.bytes + 1)
    decode.bytes += 2

    if (type != POSITION_TYPE_VIVALDI_V1) {
      throw new TypeError('Undefined coordinate type')
    }

    if (count != ENCODED_SIZE) {
      throw new Error(`Coordinate's size isn't equal ${ENCODED_SIZE}`)
    }

    nps[i] = vc.create([
      buf.readFloatBE(start + decode.bytes),
      buf.readFloatBE(start + decode.bytes + 4),
      buf.readFloatBE(start + decode.bytes + 4*2),
      buf.readFloatBE(start + decode.bytes + 4*3)
    ])

    decode.bytes += ENCODED_SIZE
  }

  return nps
}
