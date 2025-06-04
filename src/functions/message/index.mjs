import OpenAI from "openai";
import { QA_TEXT } from "./qa.js";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
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

// Initialize the Supabase client based on environment
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Twilio client based on environment
const twilioClient =
  process.env.NODE_ENV === "development"
    ? mockTwilioClient
    : twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function createTwiMLResponse(message, statusCode = 200) {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${escapeXml(message)}</Message>
    </Response>`;
  return {
    statusCode,
    body: twimlResponse,
    headers: {
      "Content-Type": "application/xml",
    },
  };
}

async function fetchLearnedQAPairs() {
  const { data, error } = await supabase
    .from("qa_pairs")
    .select("question, answer")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching qa_pairs:", error);
    return [];
  }

  return data;
}

function formatQAPairs(pairs) {
  return pairs.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n");
}

export const handler = async (event) => {
  try {
    console.log("Raw event body:", event.body);
    if (process.env.NODE_ENV === "development") {
      console.log("Event:", JSON.stringify(event, null, 2));
    }

    const body =
      typeof event.body === "string"
        ? querystring.parse(event.body)
        : event.body;

    const messageBody = body.Body || "";
    const fromNumber = body.From || "";

    console.log("Parsed messageBody:", messageBody);
    console.log("From number:", fromNumber);

    // Handle manager replies
    if (fromNumber === process.env.ESCALATION_PHONE_NUMBER) {
      console.log("Received message from manager:", messageBody);

      // Fetch latest pending escalation
      const { data, error } = await supabase
        .from("messages")
        .select("id, from_number, message_body")
        .eq("is_escalated", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        console.error("No pending escalation found:", error);
        return createTwiMLResponse(
          "No active escalation found. Please initiate escalation first.",
          200
        );
      }

      const escalation = data[0];

      // Forward manager's reply to user
      await twilioClient.messages.create({
        body: `Manager replied: ${messageBody}`,
        to: escalation.from_number,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      });

      // Save manager response
      await supabase
        .from("messages")
        .update({ is_escalated: false, manager_response: messageBody })
        .eq("id", escalation.id);

      // Save the Q&A pair
      await supabase.from("qa_pairs").insert([
        {
          question: escalation.message_body,
          answer: messageBody,
        },
      ]);

      // Notify manager that their response was sent
      await twilioClient.messages.create({
        body: "Your response has been sent to the employee and saved in the DaVinci database.",
        to: fromNumber,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      });

      return {
        statusCode: 200,
        body: "Manager response sent to user.",
      };
    }

    // Fetch learned Q&A pairs
    const learnedQAPairs = await fetchLearnedQAPairs();
    const learnedQAText = formatQAPairs(learnedQAPairs);

    // Build final system prompt
    const finalPrompt = `${QA_TEXT}\n\nCustomer Q&A:\n${learnedQAText}`;

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: finalPrompt },
        { role: "user", content: messageBody },
      ],
      max_tokens: 160,
      temperature: 0.5,
    });

    console.log("Open AI Raw Response:", JSON.stringify(completion, null, 2));

    const aiResponse = completion.choices[0].message.content.trim();
    await supabase.from("messages").insert([
      {
        from_number: fromNumber,
        message_body: messageBody,
        ai_response: aiResponse,
        is_escalated: aiResponse === "Let me forward this to a manager.",
      },
    ]);

    // If AI escalates, notify user & manager
    if (aiResponse === "Let me forward this to a manager.") {
      console.log("ESCALATION NEEDED:", {
        from: fromNumber,
        message: messageBody,
      });

      await twilioClient.messages.create({
        body: "Let me forward this to a manager.",
        to: fromNumber,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      });

      const escalationMessage = `Escalation Needed\nFrom: ${fromNumber}\nMessage: ${messageBody}`;
      await twilioClient.messages.create({
        body: escalationMessage,
        to: process.env.ESCALATION_PHONE_NUMBER,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      });

      return {
        statusCode: 200,
        body: "Escalation message sent.",
      };
    }

    // Send normal AI response
    await twilioClient.messages.create({
      body: aiResponse,
      to: fromNumber,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    });

    return {
      statusCode: 200,
      body: "AI response sent.",
    };
  } catch (error) {
    console.error("Error:", error?.response?.data || error.message || error);
    return createTwiMLResponse(
      "Sorry, I couldn't process your message. Please try again.",
      500
    );
  }
};
