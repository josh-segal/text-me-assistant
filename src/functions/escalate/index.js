import twilio from "twilio";

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const handler = async (event) => {
  try {
    const { fromNumber, message } = event;

    // Send notification to manager
    await twilioClient.messages.create({
      body: `ESCALATED MESSAGE:\nFrom: ${fromNumber}\nMessage: ${message}\n\nPlease respond to this customer.`,
      to: process.env.MANAGER_PHONE_NUMBER,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Manager notified successfully" })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}; 