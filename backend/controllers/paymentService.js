/**
 * controllers/paymentService.js
 *
 * PhonePe Payment Gateway integration (Sandbox / UAT).
 *
 * IMPORTANT: These are SANDBOX credentials for development/testing.
 *            Replace with PRODUCTION keys from https://developer.phonepe.com/
 *            before going live.
 *
 * Flow:
 *  1. Frontend calls POST /api/orders  → order created with status "pending"
 *  2. Server calls initiatePhonePePayment() → gets a redirect URL from PhonePe
 *  3. Frontend redirects student to PhonePe checkout page
 *  4. PhonePe calls our CALLBACK_URL with payment result
 *  5. handlePhonePeCallback() verifies the checksum & updates order to "paid"/"failed"
 */

const axios  = require("axios");
const crypto = require("crypto");

// ── Sandbox config (loaded from .env) ────────────────────────────────────────
const MERCHANT_ID   = process.env.PHONEPE_MERCHANT_ID  || "PGTESTPAYUAT";
const SALT_KEY      = process.env.PHONEPE_SALT_KEY     || "099eb0cd-02cf-4dc2-a4b3-b47a2e7f2a51";
const SALT_INDEX    = process.env.PHONEPE_SALT_INDEX   || "1";
const BASE_URL      = process.env.PHONEPE_BASE_URL     || "https://api-preprod.phonepe.com/apis/pg-sandbox";
const REDIRECT_URL  = process.env.PHONEPE_REDIRECT_URL || "http://localhost:3000/payment-success";
const CALLBACK_URL  = process.env.PHONEPE_CALLBACK_URL || "http://localhost:5000/api/orders/payment-callback";

/**
 * Generates the X-VERIFY checksum required by PhonePe.
 * Formula: SHA256(base64(payload) + "/pg/v1/pay" + saltKey) + "###" + saltIndex
 */
const generateChecksum = (base64Payload) => {
  const string   = base64Payload + "/pg/v1/pay" + SALT_KEY;
  const sha256   = crypto.createHash("sha256").update(string).digest("hex");
  return `${sha256}###${SALT_INDEX}`;
};

/**
 * Generates the checksum for STATUS CHECK endpoint.
 * Formula: SHA256("/pg/v1/status/<merchantId>/<merchantTransactionId>" + saltKey) + "###" + saltIndex
 */
const generateStatusChecksum = (merchantTransactionId) => {
  const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  return `${sha256}###${SALT_INDEX}`;
};

/**
 * initiatePhonePePayment
 * Creates a payment order on PhonePe and returns the redirect URL
 * that the frontend must open for the student to complete payment.
 *
 * @param {Object} order  - Mongoose Order document (needs _id, totalAmount, student.phone)
 * @returns {Object}      - { success, redirectUrl, merchantTransactionId }
 */
const initiatePhonePePayment = async (order) => {
  // PhonePe expects amount in PAISE (1 INR = 100 paise)
  const amountInPaise = Math.round(order.totalAmount * 100);

  // Unique transaction ID per payment attempt
  const merchantTransactionId = `MT-${order._id}-${Date.now()}`;

  // Payload as per PhonePe API spec v1
  const payload = {
    merchantId:            MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId:        `UID-${order.student.rollNumber}`,
    amount:                amountInPaise,
    redirectUrl:           `${REDIRECT_URL}?orderId=${order._id}`,
    redirectMode:          "REDIRECT",
    callbackUrl:           CALLBACK_URL,
    mobileNumber:          order.student.phone,
    paymentInstrument: {
      type: "PAY_PAGE", // show the full PhonePe checkout page
    },
  };

  // Base64-encode the JSON payload
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const checksum      = generateChecksum(base64Payload);

  try {
    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type":  "application/json",
          "X-VERIFY":       checksum,
          "X-MERCHANT-ID":  MERCHANT_ID,
          accept:           "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const data = response.data;

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success:               true,
        redirectUrl:           data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId: merchantTransactionId,
      };
    } else {
      throw new Error(data.message || "PhonePe did not return a redirect URL");
    }
  } catch (err) {
    // Log the full error for debugging; return a safe message to caller
    console.error("PhonePe initiate error:", err?.response?.data || err.message);
    throw new Error(
      err?.response?.data?.message || "Payment gateway error. Please try again."
    );
  }
};

/**
 * verifyPhonePeCallback
 * Validates the incoming callback from PhonePe using checksum verification.
 * NEVER trust the response without verifying the checksum.
 *
 * @param {string} base64Response  - The "response" field from PhonePe callback body
 * @param {string} receivedChecksum - The "X-VERIFY" header from PhonePe callback
 * @returns {Object}  - { valid: boolean, decoded: Object }
 */
const verifyPhonePeCallback = (base64Response, receivedChecksum) => {
  // Recompute expected checksum
  const string          = base64Response + SALT_KEY;
  const expectedSha256  = crypto.createHash("sha256").update(string).digest("hex");
  const expectedChecksum = `${expectedSha256}###${SALT_INDEX}`;

  if (expectedChecksum !== receivedChecksum) {
    return { valid: false, decoded: null };
  }

  // Decode the response payload
  const decoded = JSON.parse(Buffer.from(base64Response, "base64").toString("utf-8"));
  return { valid: true, decoded };
};

/**
 * checkPhonePeStatus (optional polling)
 * Can be called to check payment status if callback is delayed.
 *
 * @param {string} merchantTransactionId
 */
const checkPhonePeStatus = async (merchantTransactionId) => {
  const checksum = generateStatusChecksum(merchantTransactionId);

  const response = await axios.get(
    `${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY":      checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
        accept:          "application/json",
      },
    }
  );
  return response.data;
};

module.exports = {
  initiatePhonePePayment,
  verifyPhonePeCallback,
  checkPhonePeStatus,
};
