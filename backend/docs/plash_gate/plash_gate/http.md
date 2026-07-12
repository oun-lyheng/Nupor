# HTTP API

This document is targeted at software designers/programmers wishing to integrate SMS messaging as a function into their applications using HTTP protocol, e.g. in connection with WEB-server, unified messaging, information services etc...

If you need to use a stateful TCP protocol (SMPP), please refer to **SMPP Server API**.

SMS Messages can be transmitted using HTTP protocol. The following requirements must be met to enable the service:

- You need a Plasgate user account
- You need sufficient credit on your user account

---

## Sending

In order to deliver SMS messages, data is transferred using an HTTP POST request at the following URL:

**Rate Limit:** Limited to 200 requests per minute

```
https://cloudapi.plasgate.com/api/send
```

| Parameter | Value / Pattern | Example(s) |
|-----------|------------------|------------|
| `to` | Destination address (required) | 855 |
| `sender` | Originating address (required) | SMS Info |
| `username` | Plasgate account login email | example@email.com |
| `password` | Account password | Str0ng3P@$$W0rd |
| `dlr` | yes or no | yes |
| `dlr_url` | HTTP(s) callback URL (optional) | http://example.com/callback |
| `dlr_level` | 1, 2 or 3 | 2 |
| `dlr_method` | GET or POST | GET |
| `content` | Text | Hello world ! |

### Example

```bash
curl --location --request POST 'https://cloudapi.plasgate.com/api/send' \
--form 'to="855123456789"' \
--form 'sender="SMS Info"' \
--form 'content="Hello from +Gate SMS Cloud"' \
--form 'username="example@email.com"' \
--form 'password="Str0ng3P@$$W0rd"'
```

For more examples, please visit the **+Gate HTTP API** document!