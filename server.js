import express from "express";
import ky from 'ky-universal';
import "dotenv/config";

const app = express();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;

const router = express.Router()

router.get('/vault-3ds', async (req, res, next) => {
  
  const accessToken = await getAccessToken()
  
  const url = 'https://api-m.paypal.comg/v2/checkout/orders'
  
  const option = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken,
      'host': 'api-m.paypal.com'
    },
    json: {
      "intent": "AUTHORIZE",
      "application_context": {
        "return_url": "https://example.com",
        "cancel_url": "https://example.com"
      },
      "payment_source": {
        "token": {
          "type": "PAYMENT_METHOD_TOKEN",
          "id": "2mb430hq",
          "attributes": {
            "verification": {
              "method": "SCA_ALWAYS"
            }
          }
        }
      },
      "purchase_units": [
        {
          "amount": {
            "currency_code": "JPY",
            "value": "10"
          }
        }
      ]
    }
  }
  
  let response = await ky.post(url, option)
  let parsed = await response.json()
  
  res.redirect(parsed.links[1].href)
  
})

async function getAccessToken(target_subject) {
  
  const clientId = PAYPAL_CLIENT_ID
  const clientSecret = PAYPAL_CLIENT_SECRET
  const encoded = Buffer.from(clientId + ':' + clientSecret).toString('base64')
  
  const url = 'https://api-m.paypal.com/v1/oauth2/token'
  
  const option = {
    headers: {
      Authorization: 'Basic ' + encoded
    },
    body: 'grant_type=client_credentials'
  }
    
  if (target_subject) {
    option.body += '&target_subject=' + target_subject
    console.dir(option)
  }
  
  let parsed = null
  try {
    parsed = await ky.post(url, option).json()
  } catch (err) {
    console.dir(err, { depth: null })
  }
  
  return parsed.access_token
}

app.use('/', router)

app.listen(PORT, () => {
  console.log('running...')
})
