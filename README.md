# RupiVanta — Cash Command Center for Indian MSMEs

**RupiVanta** is an intelligent cash-flow forecasting, payment collection, invoice scanning, and legal notice assistant built for Indian small businesses, wholesalers, kirana stores, and traders.

Instead of just recording past transactions like traditional khata apps, RupiVanta **predicts upcoming cash shortages before they happen**, estimates **when each customer will actually pay**, decodes complex **GST/legal notices into plain language**, and lets business owners operate their accounts in **6 Indian languages** (English, Kannada, Hindi, Tamil, Telugu, and Malayalam) with voice support.

---

## Key Features

- **30-Day Cash-Flow Forecast:** Visualizes daily opening/closing cash balances and warns you ahead of time if an upcoming supplier bill or rent payment will cause a cash crunch.
- **ML Customer Payment Predictor:** Uses machine learning (L2 Ridge Regression + Empirical Bayes Shrinkage) to learn each buyer's real payment habits (on-time, delayed, partial payer) and predict realistic cash arrival dates.
- **What-If Cash Simulator:** Test business decisions safely (e.g., *"What if a major customer pays 10 days late?"* or *"What if I buy ₹50,000 extra stock today?"*) before spending money.
- **Smart Invoice & Bill Scanner (OCR):** Upload or snap a photo of a supplier bill or invoice to automatically extract party name, amount, due date, and GST details.
- **Legal & GST Notice Decoder:** Upload or inspect tax/legal notices to get a calm, plain-language summary, risk level, deadline countdown, and a ready-to-download `.docx` formal reply draft.
- **One-Click WhatsApp Payment Reminders:** Generate polite, localized payment reminder messages with exact pending amounts for overdue customers.
- **VANTA Voice & Chat Assistant:** Ask questions about your balance, overdue bills, or cash health and log entries hands-free in English or Kannada (`en-IN` / `kn-IN`).
- **6-Language Interface:** Instant switching between **English**, **ಕನ್ನಡ (Kannada)**, **हिन्दी (Hindi)**, **தமிழ் (Tamil)**, **తెలుగు (Telugu)**, and **മലയാളം (Malayalam)**—including native Indian currency formatting (`₹1,25,000`).

---

## How to Use the Website (New User Guide)

1. **Choose a Workspace on the Login Screen:**
   - **Try Instant Demo Mode:** Select one of the pre-loaded sample businesses (*Sharma Stores*, *Venkateshwara Traders*, or *Nandi Logistics*) to immediately explore realistic invoices, overdue customers, forecasts, and legal notices.
   - **Start Your Own Shop Account:** Switch to **Real Account**, enter your mobile number or shop name, and start with a clean ledger.
2. **Pick Your Language:** Click the **Language selector** in the top header at any time to switch the entire app into your preferred language.
3. **Check Present Balance & Forecast:** Open the main dashboard to view today's cash in hand, upcoming receivables (money coming in), payables (bills to pay), and your 30-day cash projection chart.
4. **Add or Scan Bills:** Click **Add Transaction** to record cash in/out manually, or use **Scan Invoice** to extract details from a bill photo automatically.
5. **Test Decisions & Track Customer Habits:** Visit **Advice & Simulator** to run What-If scenarios, or open **Customers & Accuracy** to see reliability scores and predicted payment dates for every buyer.
6. **Decode a Notice:** Open the **Notices** tab to read simplified explanations of GST/compliance notices and export a formal response letter.
7. **Talk to VANTA Assistant:** Use the microphone bar to ask spoken questions about your daily cash position.

---

## Run Locally on Your Laptop

### Prerequisites
- **Node.js** (v18 or newer recommended)
- **npm** (comes with Node.js)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd YOUR-REPO-NAME
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, run `copy .env.example .env`)*

   Open `.env` and paste your API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open in your browser:**
   Visit **[http://localhost:3000](http://localhost:3000)**

*(Both the React frontend and Express backend run together on Port `3000`.)*

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons, Motion
- **Backend:** Node.js, Express (`server.ts` serving `/api/*` routes + Vite middleware on Port `3000`)
- **Machine Learning (Client-Side):** Custom TypeScript L2 Ridge Regression & Empirical Bayes Shrinkage payment delay model (`src/utils/mlPaymentPredictor.ts`)
- **OCR & Document Tools:** `tesseract.js` + multimodal extraction (`src/utils/invoiceOcrExtractor.ts`) and `.docx` legal reply generator (`src/utils/docxGenerator.ts`)
- **AI & Voice Services:** `@google/genai` SDK via secure server-side API routes for multilingual chat, notice decoding, and text-to-speech

---

## Project Structure

```text
├── server.ts                        # Express backend server & AI/TTS API routes (Port 3000)
├── src/
│   ├── App.tsx                      # Main dashboard state, workspace switcher & navigation
│   ├── components/                  # Modular UI screens, charts, scanners & modals
│   ├── data/                        # Demo workspaces (Sharma Stores, etc.) & sample notices
│   ├── types/                       # TypeScript interfaces for cashflow, notices & voice
│   └── utils/
│       ├── forecastEngine.ts        # Daily cash-flow projection calculator
│       ├── mlPaymentPredictor.ts    # ML payment delay & reliability scoring engine
│       ├── invoiceOcrExtractor.ts   # Invoice & bill OCR parser
│       ├── docxGenerator.ts         # Formal notice reply (.docx) exporter
│       ├── localization.ts          # Native digits & shop label localization helpers
│       └── translations.ts          # Multilingual UI dictionaries (EN, KN, HI, TA, TE, ML)
├── .env.example                     # Safe template for required environment variables
└── package.json                     # Scripts and project dependencies
```
