const SETUP_MESSAGE = `
START_TRANSFER_USER, START_TRANSFER_PASSWORD, START_TRANSFER_RECIPIENT_ID env variables are required to generate payment session,
values can be found in  https://github.com/Worldremit/rewrite-postman-collections/blob/master/Rewrite%20TST.postman_environment.json
look for startTransfer_user, startTransfer_password, startTransfer_recipientId keys.
For more convinience it's possible to use .env file`;

const AMOUNT = 20;
const RECEIVE_COUNTRY = 'NG';
const SEND_COUNTRY = 'AT';
const PAYMENT_METHOD_ID = '20';
const PAYOUT_CODE = 'CSH';
const CORRESPONDENT_ID = '964';

const LOGIN_URL = 'https://authentication.wremittst.com/api/signin';
const CALCULATION_URL = 'https://api.staging.worldremit.com/calculations';
const SUBMIT_TRANSFER_URL = 'https://submission-flow-facade.wremittst.com/api/transfers';

const SUCCESS_URL = 'https://www.staging.worldremit.com/en/transaction/payment-processing?sff=1';
const FAILURE_URL = 'https://www.staging.worldremit.com/en/transaction/payment-selection?status=failure';
const CANCEL_URL = 'https://www.staging.worldremit.com/en/transaction/payment-selection';

function logIn(email, password) {
  return fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.authentication.login-request.v1+json' },
    body: JSON.stringify({ email, password }),
    redirect: 'follow',
  })
    .then((response) => response.json())
    .then((res) => res.accessToken);
}

function getCalculation() {
  const body = {
    amount: {
      value: AMOUNT,
      type: 'SEND',
    },
    send: {
      country: SEND_COUNTRY,
      currency: 'EUR',
    },
    receive: {
      country: RECEIVE_COUNTRY,
      currency: 'NGN',
    },
    payOutMethodCode: PAYOUT_CODE,
    correspondentId: CORRESPONDENT_ID,
  };
  return fetch(CALCULATION_URL,
    {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/vnd.pricing-facade.calculation.v1+json',
        'Content-Type': 'application/vnd.pricing-facade.calculate.v1+json',
        'X-WR-Platform': 'Web',
      },
    })
    .then((x) => x.json())
    .then((x) => x.id);
}

function postTransfer(accessToken, pricingId, recipientId) {
  const myHeaders = new Headers();
  myHeaders.append('Accept', 'application/vnd.transfers.submitted.v1+json');
  myHeaders.append('Content-Type', 'application/vnd.transfers.submit.v1+json');
  myHeaders.append('X-WR-DeviceID', 'deviceId');
  myHeaders.append('X-WR-Request-Ip', '127.0.0.1');
  myHeaders.append('X-WR-PLATFORM', 'WEB');
  myHeaders.append('Accept-Language', 'pl');
  myHeaders.append('Authorization', `Bearer ${accessToken}`);

  const body = {
    pricingId,
    paymentMethodId: PAYMENT_METHOD_ID,
    sendCountry: SEND_COUNTRY,
    receiveCountry: RECEIVE_COUNTRY,
    recipientId,
    successUrl: SUCCESS_URL,
    failureUrl: FAILURE_URL,
    cancelUrl: CANCEL_URL,
    payoutCode: PAYOUT_CODE,
  };

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: 'follow',
  };
  return fetch(SUBMIT_TRANSFER_URL, requestOptions)
    .then((response) => response.json())
    .then((result) => result.paymentUrl);
}

function generateCybersourceSession() {
  const { START_TRANSFER_USER, START_TRANSFER_PASSWORD, START_TRANSFER_RECIPIENT_ID } = process.env;

  if (!START_TRANSFER_USER || !START_TRANSFER_PASSWORD || !START_TRANSFER_RECIPIENT_ID) {
    console.error(SETUP_MESSAGE);
    return Promise.resolve();
  }

  return Promise.all([logIn(START_TRANSFER_USER, START_TRANSFER_PASSWORD), getCalculation()])
    .then(([accessToken, pricingId]) => postTransfer(accessToken, pricingId, START_TRANSFER_RECIPIENT_ID))
    .then((paymentUrl) => {
      const parsedUrl = new URL(paymentUrl);
      return parsedUrl.path;
    });
}

export { generateCybersourceSession, getCalculation };
