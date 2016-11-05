## FindNode

Packet

#### Request

| field name | type | condition | default value |
| --- | --- | --- | --- |
| **extends** | Request | always | |
| action | | always | ACT_REQUEST_FIND_NODE |
| id | Buffer | always | `serialiseByteArray(length = 64)` |
| node_status | INT | >= PROTOCOL_VERSION_MORE_NODE_STATUS | |
| estimated_dht_size | INT | >= PROTOCOL_VERSION_MORE_NODE_STATUS | `0` if unknown size |

#### Reply

| field name | type | condition | default value |
| --- | --- | --- | --- |
| **extends** | Reply | always | |
| action | | always | ACT_REPLY_FIND_NODE |
| [random_id](https://npmjs.org/package/vuze-spoof-id) | INT | >= PROTOCOL_VERSION_ANTI_SPOOF | |
| node_status | INT | >= PROTOCOL_VERSION_XFER_STATUS | `NODE_STATUS_UNKNOWN` |
| estimated_dht_size | INT | >= PROTOCOL_VERSION_SIZE_ESTIMATE | `0` if unknown size |
| [vivaldi](https://npmjs.org/package/vivaldi-coordinates) | serialise() | >= PROTOCOL_VERSION_VIVALDI | |
| contacts | serialise(Contact[]) | always | |
