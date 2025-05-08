import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import twilio from "twilio";
import OpenAI from "openai";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Initialize AWS clients
const sagemaker = new SageMakerRuntimeClient();
const lambda = new LambdaClient();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event) => {
  try {
    // Parse the incoming request body
    const body = JSON.parse(event.body);
    const { From: fromNumber, Body: message } = body;

    // Classify the message using SageMaker
    const classificationParams = {
      EndpointName: process.env.SAGEMAKER_ENDPOINT_NAME,
      ContentType: 'application/json',
      Body: JSON.stringify({ text: message })
    };

    const classificationCommand = new InvokeEndpointCommand(classificationParams);
    const classificationResponse = await sagemaker.send(classificationCommand);
    const classification = JSON.parse(new TextDecoder().decode(classificationResponse.Body));

    // If the message is classified as needing escalation
    if (classification.needs_escalation) {
      // Call the escalate function
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.ESCALATE_FUNCTION_NAME,
        InvocationType: 'Event',
        Payload: JSON.stringify({ fromNumber, message })
      });
      await lambda.send(invokeCommand);

      // Send acknowledgment to user
      await twilioClient.messages.create({
        body: "Thank you for your message. A manager will contact you shortly.",
        to: fromNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message escalated" })
      };
    }

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful customer service assistant. Provide clear, concise, and friendly responses."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;

    // Send response via Twilio
    await twilioClient.messages.create({
      body: response,
      to: fromNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Response sent successfully" })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}; 