## Contact

peer info

#### `serialiseContacts(Contact[])`

| field name | type | function |
| --- | --- | --- |
| length | INT16 | `serialiseLength(contacts.length)` |
| contacts | Buffer | `serialiseContact(contacts[i])` |

#### `serialiseContact(Contact)`

| field name | type | value |
| --- | --- | --- |
| transport_type | INT8 | CT_UDP = 1 |
| protocol | INT8 | contact's protocol version |
| address | Buffer | `serialiseAddress(external_address)` |
