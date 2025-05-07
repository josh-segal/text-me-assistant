---

### 🧰 **Dev + Repo Setup**

- [x]  Create shared **GitHub repo** for assistant backend
- [x]  Set up **Cursor** to sync with GitHub
- [x]  Add `.env.example` with placeholders for OpenAI, Twilio, DB creds
- [x]  Set up `requirements.txt` or `pyproject.toml` with dependencies

---

### 🧠 **Architecture Planning**

- [x]  Define Twilio-to-Lambda **message flow**

[**Twilio-to-Lambda Message Flow**](https://www.notion.so/Twilio-to-Lambda-Message-Flow-1e4a55fc449e8043beaac8fe998e7615?pvs=21)

- [x]  Plan core **API endpoints**: `/message`, `/validate`, `/escalate`

[**Core API Endpoints Plan**](https://www.notion.so/Core-API-Endpoints-Plan-1e4a55fc449e80a4a6d1f7eb3d624cd9?pvs=21)

- [ ]  Draft **Pydantic models** for request + DB data
- [ ]  Map **message flow logic**: SMS → API Gateway → Lambda → LLM + Classifier

---

### ☁️ **Serverless Infrastructure Setup**

- [ ]  Provision **Twilio SMS numbers** (one for employees, one for managers)
- [ ]  Configure **Twilio webhook** to point to AWS **API Gateway**
- [ ]  Create AWS **Lambda function** with FastAPI or Starlette via SAM CLI
- [ ]  Set up **AWS API Gateway** route to Lambda
- [ ]  Connect Lambda to **OpenAI API** (for LLM responses)
- [ ]  Connect Lambda to **Pinecone** (semantic search)
- [ ]  (Optional MVP) Deploy **DistilBERT classifier** via **SageMaker Endpoint**
- [ ]  Set up **AWS RDS PostgreSQL** (managed DB for logs and feedback)
- [ ]  Configure **Twilio Messaging API** for reply + escalation messages
- [ ]  Set up **Lightweight JWT Auth** in API Gateway or Lambda (optional)

---

### 🚀 **Deployment + CI/CD**

- [ ]  Set up **GitHub Actions** for CI/CD
- [ ]  Use **AWS SAM CLI** to deploy API Gateway + Lambda
- [ ]  Configure environment variables via **Secrets Manager** or SAM template

---

### 🧪 **Testing + Logging**

- [ ]  Test: SMS to Twilio → Lambda → GPT → Twilio Reply
- [ ]  Log Q&A and classifications to **PostgreSQL**
- [ ]  Enable **CloudWatch Logs** for Lambda + API Gateway

---

### 🔮 **Future Serverless Additions**

- [ ]  Replace FAISS with **Pinecone** (fully managed vector DB)
- [ ]  Replace local classifier with **SageMaker Endpoint**
- [ ]  Add **usage metrics + observability** via CloudWatch dashboards