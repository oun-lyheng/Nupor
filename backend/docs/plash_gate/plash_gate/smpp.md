# SMPP

This document is targeted at software designers/programmers wishing to integrate SMS messaging through a stateful TCP protocol SMPP v3.4, if you feel this does not fit your needs and that you are more "web-service-guy" then you still can try HTTP or REST API.

SMS Messages can be transmitted using SMPP protocol, the following requirements must be met to enable the service:

- You need a Plasgate user account
- You need sufficient credit on your Plasgate user account

---

## Binding to SMPP Server

Using a proper SMPP Client application, the following parameters must be considered:

| Parameter | Value / Pattern | Example(s) |
|-----------|------------------|------------|
| `username` | Text (30 char. max) | pg_smpp (To get username & password, click here!) |
| `password` | Text (30 char. max) | pg_smppppwd |
| `bind` | cloudsmpp.plasgate.com | The SMPP Server API listener will only bind to this specified address, given cloudsmpp.plasgate.com the listener will bind on all interfaces. |
| `port` | 2775 | The binding TCP port. |

---

## Supported SMPP PDUs

Plasgate SMPP Server is supporting the following PDUs:

- bind_transmitter
- bind_transceiver
- bind_receiver
- unbind
- submit_sm
- deliver_sm
- enquire_link

---

## Example

Download the following library:

- PHP

---

## How to run the example

### 1. Credential and content

In `sendsms.php`, on line 17 `$smpp->bindTransmitter("test1khsmpp", "Test@018")`:

- replace `test1khsmpp` with your SMPP username
- replace `Test@018` with your SMPP password
- On line 25, change `$message` variable to your own content.

### 2. Install dependencies

In the root directory run `composer install` (make sure composer is ready installed on your PC).

### 3. Send SMS

```bash
php sendsms.php
```