==========
README.TXT
==========
41 54 2B 54 58 48 3D 31 30 37 2C 30 41 30 33 30 30 30 33 30 30 30 43 62 34 62 34 0D 0A 
41 54 2B 54 58 48 3D 31 30 37 2C 30 41 30 33 30 30 30 33 30 30 30 43 62 34 62 34 0D 0A 
GATEWAY     88 88 88 88 30 31 31 35 36 33 33 33 30 38 38 00 0A 22 CD 0D 00
RH          2B 52 43 56 3A 31 30 30 2C 14 03 04 02 BE 00 F5 1F 29 0D 0A
            2B 52 43 56 3A 31 30 37 2C 14 03 04 01 E6 00 29 9F 27 0D 0A
PIR         2B 52 43 56 3A 31 30 30 2C 1E 03 02 00 00 2D 86 0D 0A
------------ WISENSOR V2.0.0 -----------
04 10 - TEMPERATURE
04 11 - HUMIDITY
05 12 - INTERVAL
05 13 - Wi-SHT10
05 14 - BATT
---- NEW PROTOCOL V2.10 ----------
2B 52 43 56 3A 33 30 2C = +RCV:30,
80                      = HEADER
A0                      = A0:UPLOAD A1:TRANS
00 1B                   = LENGTH
10 ba 61 fb ec d0 17    = MAC
16 01                   = TYPE 01:W-SHT10 02:AQS-800 03:AQS_PM2D5 04:AQS-HCHO 05:AQS-CH4
17 08 34                = VERSION
19 01 2c                = INTERVAL
1B 64                   = BATTERY
1C 01 A4                = LORA FREQU
20 0b C2                = TEMPERATURE
21 00 00                = HUMIDITY
F7                      = CHECKSUM
FF                      = END
0D 0A                   = 
    1009    2B 52 43 56 3A 31 30 2C 01 01 
            03 11 62 30 2D 62 63 2D 38 32 2D 63 34 2D 63 34 2D 34 31 
            0D 04 10 35 2e 31 39
            0D 05 12 33 30 30 
            0D 05 13 57 69 2d 53 48 54 31 30 
            0D 05 14 31 30 30 
            0D 7F 7F
            0D 0A
WISENSOR[7] 2B 52 43 56 3A 34 2C 01 01 
            03 11 62 30 2D 66 36 2D 62 66 2D 38 35 2D 39 65 2D 31 33 
            0D 04 10 32 38 2e 35 38 
            0D 05 12 36 30 30 
            0D 05 13 57 69 2D 53 48 54 31 30 
            0D 05 14 31 30 30 
            0D 7F 7F 
            0D 0A
WISENSOR[8] 2B 52 43 56 3A 35 2C 01 01 
            03 11 62 30 2D 31 34 2D 31 39 2D 66 37 2D 36 33 2D 34 37 
            0D 04 10 32 38 2E 33 36 
            0D 04 11 35 35 2E 38 30 
            0D 05 12 31 32 30 30 
            0D 05 13 57 69 2D 53 48 54 31 30 
            0D 05 14 31 30 30 
            0D 7F 7F 
            0D 0A
WISENSOR[8] 2B 52 43 56 3A 37 2C 01 01 
            03 11 62 30 2D 30 35 2D 33 39 2D 62 64 2D 65 31 2D 35 39 
            0D 04 10 32 34 2E 34 38 
            0D 04 11 36 34 2E 36 31 
            0D 05 12 33 30 30 
            0D 05 13 57 69 2D 53 48 54 31 30 
            0D 05 14 31 30 30 
            0D 7F 7F 
            0D 0A
WISENSOR[9] 2B 52 43 56 3A 35 2C 01 01 
            03 11 62 30 2D 38 65 2D 35 38 2D 62 36 2D 30 35 2D 35 32 
            0D 02 10 56 64 
            0D 04 10 32 38 2E 35 37 
            0D 04 11 37 38 2E 30 30 
            0D 05 12 33 30 30 
            0D 05 13 57 69 2D 53 48 54 31 30 
            0D 05 14 31 30 30 
            0D 7F 7F 0D 0A
<1008>:2B 52 43 56 3A 31 30 37 2C 01 03 64 00 00 0C DF 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0C DF 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 B6 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 B6 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 7D 56 0D 0A
       -----------------
       2B 52 43 56 3A 31 30 37 2C 01 03 64 00 00 0C E2 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0C E2 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 BA 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 BA 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 3E 64 0D 0A
       2B 52 43 56 3A 31 30 37 2C 01 03 64 00 00 02 CB 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 CB 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 B8 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 B8 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 F2 CD 0A
       +RCV:1008 [107:1] 33.0kWh|0.0kWh|33.0kWh
       2B 52 43 56 3A 31 30 37 2C 01 03 4E 09 58 00 00 00 00 00 00 00 17 00 00 00 00 00 00 00 00 00 00 00 04 FF FF FF FE 00 00 00 04 24 75 13 8F 00 00 00 04 00 00 00 00 00 00 00 00 FF FF FF FE 00 00 00 00 00 00 00 00 00 00 00 05 00 00 00 00 00 00 00 00 21 AD 00 00 00 00 00 00 02 CF 0D 0A
       +RCV:1008 [107:1] (V)239|0|0 (A)0.023|0.000|0.000
       -----------------
// HTML     _HEADER.HTML        PUBLIC\APP.JS
// HTML     INDEX.JS  <APP>     SERVER.JS   WORKERS.JS  CLI.JS
// SERVER   SERVER.JS <SERVER>  HANDLERS.JS DECODERS.JS HELPER.JS
<href="checks/create"> CALLING SERVER.ROUTER -> DEFINE HANDLERS...
    -> HANDLERS -> (HTML) templateData{ head.title, head.description, body.class} -> helpers.getTemplate
    -> HANDLERS -> (API) CALLBACK 
--------
REST api
--------
NOTE: 1. BODY  = data.payload
      2. PARAM = data.queryStringObject
------------------------
localhost:2008/api/users
------------------------
METHOD         = POST
Content-Type   = text/plain
Content-Length = <calculated when request is sent>
BODY
{
    "firstname":"Choan Ann",
    "lastname":"Liew",
    "phone":"6597668621",
    "password":"123",
    "tosAgreement":true
}
-------------------------
localhost:2008/api/tokens
-------------------------
METHOD         = POST
Content-Type   = text/plain
Content-Length = <calculated when request is sent>
[BODY]
{
    "phone":"6597668621",
    "password":"123"
}
[RETURN]
STATUS = 200
JSON
{
    "phone": "6597668621",
    "id": "h24siwi5m9dhn6jsvg5u",
    "expires": 1613801264531
}
-----------------------------------------
localhost:2008/api/users?phone=6597668621
-----------------------------------------
METHOD = POST
Content-Type   = text/plain
Content-Length = <calculated when request is sent>
token          = TOKENKEYID
[PARAM]
phone   = 6597668621
[RETURN]
STATUS = 200
JSON 
{
    "firstName": "Choan Ann",
    "lastName": "Liew",
    "phone": "6597668621",
    "tosAgreement": true
}
-------------------------
localhost:2008/api/checks
-------------------------
METHOD = GET
token          = TOKENKEYID
[RETURN]
STATUS = 200
JSON 
[
    {
        "id": "y7kle04fp4ik54gjn16e",
        "userPhone": "6597668621",
        "protocol": "http",
        "url": "lazada.com.sg",
        "method": "get",
        "successCodes": [
            200,
            201
        ],
        "timeoutSeconds": 5,
        "state": "down",
        "lastChecked": 1613984680061
    },
    {
        "id": "dwolerlua3gx0v0l8ftj",
        "userPhone": "6597668621",
        "protocol": "http",
        "url": "http://202.59.9.164:2008/",
        "method": "get",
        "successCodes": [
            200,
            201
        ],
        "timeoutSeconds": 5,
        "state": "down",
        "lastChecked": 1613984682023
    }
]
-------------------------------------------------
localhost:2008/api/checks?id=y7kle04fp4ik54gjn16e
-------------------------------------------------
METHOD = GET
token          = TOKENKEYID
[RETURN]
STATUS = 200
JSON 
{
    "id": "y7kle04fp4ik54gjn16e",
    "userPhone": "6597668621",
    "protocol": "http",
    "url": "lazada.com.sg",
    "method": "get",
    "successCodes": [
        200,
        201
    ],
    "timeoutSeconds": 5,
    "state": "down",
    "lastChecked": 1613984739855
}
-------------------------