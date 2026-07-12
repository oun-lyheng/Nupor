# REST API

The RESTful API allows developers to expand and build their apps on Plasgate. The API makes it easy to send messages to one or many destinations as well as enabling bulk messaging.

If you need to use a stateful TCP protocol (SMPP), please refer to **SMPP Server API**.

SMS Messages can be transmitted using the RESTful API. The following requirements must be met to enable the service:

- You need to have a valid API Key, which you can generate
- You need to have balance, which you can request to top up

---

## Send a single message

Send a single message to one destination address.

In order to deliver SMS messages, data is transferred using an HTTP POST request at the following URL:

```
https://cloudapi.plasgate.com/rest/send
```

**Rate Limit:** Limited to 200 requests per minute

**Params:**

- `private_key`: copy and paste your private key that you generate

**Header:**

- `X-Secret`: copy and paste your secret key that you generate

**Body:**

- JSON Data

| Parameter | Value/Pattern | Example |
|-----------|---------------|---------|
| `sender` | Text | SMS Info |
| `to` | Number | 85512345678 |
| `content` | Text | Hello World |

There is an additional option to mask content. Place two keywords `#ma#` around any text you want to mask in the content field.

- The keyword `#ma#` will not appear on the recipient's device.
- The masked text will be displayed as `******` in the transaction report.
- Supported multimask area.

### Example

```bash
curl --location --request POST 'https://cloudapi.plasgate.com/rest/send?private_key=Private Key' \
--header 'X-Secret: Secret' \
--header 'Content-Type: application/json' \
--data-raw '{ "sender": "SMS Info", "to": "855123456789", "content": "Hello from rest API" }'
```

### Request with masked content

```bash
curl --location --request POST 'https://cloudapi.plasgate.com/rest/send?private_key=Private Key' \
--header 'X-Secret: Secret' \
--header 'Content-Type: application/json' \
--data-raw '{ "sender": "SMS Info", "to": "855123456789", "content": "Hello from rest #ma#API#ma#" }'
```

The recipient's device will get the message as `Hello from rest API` and `Hello from rest ***` will be displayed in the transaction report in this situation.

---

## Send multiple messages

Send multiple messages to one or more destination addresses.

In order to deliver SMS messages, data is transferred using an HTTP POST request at the following URL:

```
https://cloudapi.plasgate.com/rest/batch-send
```

**Rate Limit:** Limited to 100 requests per minute

**Params:**

- `private_key`: copy and paste your private key that you generate (To get private_key, click here)

**Header:**

- `X-Secret`: copy and paste your secret key that you generate (To get X-Secret, click here)

**Body:**

- JSON Data

| Parameter | Example(s) | Description |
|-----------|------------|--------------|
| `messages` | `[{"to": ["85512345678", "85597123456"], "content": "Hello World"}]` | Require |
| `globals` | `{"sender": "SMS Info"}` | Require |
| `batch_config` | `{"callback_url": "http://example.com/callback", "schedule_at": "2021-09-30 09:00:00"}` | Optional |

### Example

```bash
curl --location --request POST 'https://cloudapi.plasgate.com/rest/batch-send?private_key=Private Key' \
--header 'X-Secret: Secret' \
--data-raw '{ "globals": { "sender": "SMS Info" }, "messages": [ { "to": ["855123456780", "855123456781"], "content": "Hello from rest API" } ] }'
```

For more examples, please visit the **+Gate REST API** document!