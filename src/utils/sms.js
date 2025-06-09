const axios = require("axios");

const sendSMS = async (mobile, name, date, time) => {
  try {
    const apiKey = process.env.SMSIR_API_KEY;
    const templateId = process.env.SMSIR_TEMPLATE_ID;

    const result = await axios.post(
      "https://api.sms.ir/v1/send/verify",
      {
        mobile,
        templateId,
        parameters: [
          { name: "name", value: name },
          { name: "date", value: date },
          { name: "time", value: time },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      }
    );

    console.log("SMS.ir response:", result.data);
  } catch (err) {
    console.error("SMS.ir error:", err.response?.data || err.message);
  }
};

module.exports = sendSMS;
