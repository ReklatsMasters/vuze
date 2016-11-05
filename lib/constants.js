module.exports = {
  version: require('./const/version'),
  action: require('./const/action'),
  node_status: require('./const/node_status'),
  flags: require('./const/flags'),
  vendor: {
    AELITIS:  0x00,
    ShareNET: 0x01,
    NONE:  0xff
  },
  network: {
    Stable: 0x00,
    CVS: 0x01
  },
  positions: {
    POSITION_TYPE_NONE: 0,
    POSITION_TYPE_VIVALDI_V1: 1,
    POSITION_TYPE_VIVALDI_V2: 5
  }
}
