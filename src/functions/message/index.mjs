import OpenAI from 'openai';
// import dotenv from 'dotenv';
// import { dirname, join } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// dotenv.config({ path: join(__dirname, '../../../.env')});

// console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Not found');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Mock Twilio client for development
const mockTwilioClient = {
  validateRequest: () => true,
  messages: {
    create: async ({ body, to, from }) => {
      console.log('Mock Twilio SMS:', {
        body,
        to,
        from,
        timestamp: new Date().toISOString()
      });
      return { sid: 'mock_message_sid' };
    }
  }
};

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
      'Content-Type': 'application/xml'
    }
  };
}

export const handler = async (event) => {
  try {
    // Log the full event in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Event:', JSON.stringify(event, null, 2));
    }

    // Parse the incoming webhook body
    const body = event.body ? 
      (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) 
      : {};

    const messageBody = body.Body || '';
    const fromNumber = body.From || '';

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful SMS assistant. Be concise as responses are via SMS. Keep responses under 160 characters when possible."
        },
        {
          role: "user",
          content: messageBody
        }
      ],
      max_tokens: 160,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content.trim();
    return createTwiMLResponse(aiResponse);

  } catch (error) {
    console.error('Error:', error);
    return createTwiMLResponse("Sorry, I couldn't process your message. Please try again.", 500);
  }
};