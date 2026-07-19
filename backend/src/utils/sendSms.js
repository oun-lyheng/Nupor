const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  
  // Clean all non-digit characters (including spaces, dashes, and "+")
  let cleaned = phoneNumber.replace(/\D/g, "");

  // If number starts with "0", replace it with "855"
  if (cleaned.startsWith("0")) {
    cleaned = "855" + cleaned.slice(1);
  }

  return cleaned;
};

const sendSms = async (phoneNumber, message) => {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const privateKey = process.env.PLASGATE_PRIVATE_KEY;
  const secretKey = process.env.PLASGATE_SECRET_KEY;
  const sender = process.env.PLASGATE_SENDER_NAME || "SMS Info";

  if (!privateKey || !secretKey) {
    console.log(`\n==================================================`);
    console.log(`[SMS MOCK] Plasgate credentials missing in .env.`);
    console.log(`[SMS MOCK] To: ${formattedNumber}`);
    console.log(`[SMS MOCK] Message: ${message}`);
    console.log(`==================================================\n`);
    return;
  }

  try {
    const url = `https://cloudapi.plasgate.com/rest/send?private_key=${privateKey}`;
    console.log(`[Plasgate SMS] Sending request to: ${url}`);
    console.log(`[Plasgate SMS] Payload:`, { sender, to: formattedNumber, content: message });
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Secret": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: formattedNumber,
        content: message,
      }),
    });

    const result = await response.json();
    console.log(`[Plasgate SMS] Send response status: ${response.status}`, result);
    return result;
  } catch (error) {
    console.error(`[Plasgate SMS] Error sending SMS:`, error);
  }
};

sendSms.formatPhoneNumber = formatPhoneNumber;
module.exports = sendSms;
