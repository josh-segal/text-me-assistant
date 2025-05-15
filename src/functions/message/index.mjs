import OpenAI from "openai";
import { QA_TEXT } from "./qa.js";
import twilio from "twilio";

import querystring from "node:querystring";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock Twilio client for development
const mockTwilioClient = {
  validateRequest: () => true,
  messages: {
    create: async ({ body, to, from }) => {
      console.log("Mock Twilio SMS:", {
        body,
        to,
        from,
        timestamp: new Date().toISOString(),
      });
      return { sid: "mock_message_sid" };
    },
  },
};

// Initialize Twilio client based on environment
const twilioClient =
  process.env.NODE_ENV === "development"
    ? mockTwilioClient
    : twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Helper function to create TwiML response
function createTwiMLResponse(message, statusCode = 200) {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${message}</Message>
    </Response>`;

  return {
    statusCode,
    body: twimlResponse,
    headers: {
      "Content-Type": "application/xml",
    },
  };
}

export const handler = async (event) => {
  try {
    console.log("Raw event body:", event.body);
    // Log the full event in development
    if (process.env.NODE_ENV === "development") {
      console.log("Event:", JSON.stringify(event, null, 2));
    }

    // Parse incoming webhook body
    const body =
      typeof event.body === "string"
        ? querystring.parse(event.body)
        : event.body;

    const messageBody = body.Body || "";
    const fromNumber = body.From || "";

    console.log("Parsed messageBody:", messageBody);
    console.log("From number:", fromNumber);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      // think about gpt-4.1-turbo (model: "gpt-4-turbo")
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: QA_TEXT,
        },
        {
          role: "user",
          content: messageBody,
        },
      ],
      max_tokens: 160,
      temperature: 0.5,
    });

    console.log("Open AI Raw Response: ", JSON.stringify(completion, null, 2));

    const aiResponse = completion.choices[0].message.content.trim();

    // If the response is the escalation message, handle escalation
    // If the response is the escalation message, handle escalation
    if (aiResponse === "Let me forward this to a manager.") {
      console.log("ESCALATION NEEDED:", {
        from: fromNumber,
        message: messageBody,
        timestamp: new Date().toISOString(),
      });

      await twilioClient.messages.create({
        body: "Let me forward this to a manager.",
        to: fromNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      return {
        statusCode: 200,
        body: "Escalation message sent",
      };
    }

    // Send normal AI response
    await twilioClient.messages.create({
      body: aiResponse,
      to: fromNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return {
      statusCode: 200,
      body: "AI response sent",
    };
  } catch (error) {
    console.error("Error:", error?.response?.data || error.message || error);
    return createTwiMLResponse(
      "Sorry, I couldn't process your message. Please try again.",
      500
    );
  }
};
