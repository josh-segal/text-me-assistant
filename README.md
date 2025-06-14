# 📱 Text-Me Assistant — Da Vinci Gelato

Reduce constant staff interruptions by replacing direct texts with a smart virtual assistant. This AI-powered SMS assistant answers common questions instantly and escalates anything it can’t handle to a manager — then learns from their response.

---

## 🔧 How It Works

1. **User texts the business number** (via Twilio).
2. Assistant checks:
   - Hardcoded `qa.json` prompt (`QA_TEXT`)
   - Previously learned answers from Supabase `qa_pairs` table
3. If a match is found:
   - Assistant replies with the appropriate answer
4. If no match:
   - Assistant responds: `"Let me forward this to a manager."`
   - Manager is alerted via SMS
5. When the manager replies:
   - Their response is forwarded to the original user
   - The Q&A pair is saved for future use

---

## 🧠 Assistant Behavior

The assistant is instructed to only answer using approved information:

> "You must answer employee questions **ONLY** using the exact information provided... If you cannot find the answer in the information below, respond with exactly: `Let me forward this to a manager.`"

---

## 🗂️ Tech Stack

- **OpenAI GPT-3.5 Turbo** – Language model for generating responses
- **Twilio** – Handles SMS send/receive
- **Supabase** – Stores Q&A pairs and escalation logs
- **AWS SAM** – For packaging and deploying serverless functions
- **Node.js** – Backend logic

---

## ✨ Features

- ✅ Instant answers from structured data
- ✅ Escalation flow to manager via SMS
- ✅ Manager response auto-saved and re-used
- ✅ Serverless deployment with AWS SAM

---

## ⚠️ To-Do & Improvements

### In Progress
- [ ] Handle concurrent incoming messages (race conditions)
- [ ] Dashboard for manager to **review/edit answers**

### Coming Soon
- [ ] Admin panel for FAQs and analytics
- [ ] Optional AI review queue before learning new Q&A pairs
- [ ] Add support for multiple restaurant locations

---

## 🧪 Running Locally

To test the project locally:

```bash
sam build
sam local start-api --env-vars env.json
