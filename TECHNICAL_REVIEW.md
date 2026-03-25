# WorkLink Smart Marketplace - Complete Technical Review

## TABLE OF CONTENTS

1. [Tech Stack Overview](#tech-stack-overview)
2. [Architecture Overview](#architecture-overview)
3. [Core Features & Technologies](#core-features--technologies)
4. [Database Design](#database-design)
5. [API Structure](#api-structure)
6. [Security Implementation](#security-implementation)
7. [External Integrations](#external-integrations)

---

# 1. TECH STACK OVERVIEW

## Frontend (Client)

- **React 18.3.1** - UI library for building interactive user interfaces
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4.1.17** - Utility-first CSS framework for styling
- **React Router v6** - Client-side routing and navigation
- **React Query (TanStack)** - Data fetching and caching
- **Socket.io-client** - Real-time communication
- **Framer Motion** - Animations and motion library
- **Leaflet + React Leaflet** - Maps integration
- **Stripe** - Payment processing
- **i18next** - Internationalization (multi-language support)

## Backend (Server)

- **Node.js (ES Modules)** - JavaScript runtime
- **Express.js 4.19.2** - Web framework for API routing
- **MongoDB + Mongoose 7.6.1** - NoSQL database and ODM
- **Socket.io 4.7.5** - Real-time bidirectional communication
- **JWT (JSON Web Tokens)** - Authentication tokens
- **Bcryptjs** - Password hashing and security
- **Stripe SDK** - Payment processing
- **Cloudinary + Multer** - Image/file upload handling
- **Google Generative AI (Gemini)** - AI-powered features
- **Nodemailer** - Email sending

## Development Tools

- **Nodemon** - Auto-restart server on file changes
- **ESLint** - Code linting
- **Morgan** - HTTP request logging
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin request handling

---

# 2. ARCHITECTURE OVERVIEW

## Monorepo Structure

The project uses **npm workspaces** allowing root-level management of both client and server:

```
worklink-smart-marketplace/
├── client/              (React Frontend)
├── server/              (Express Backend)
├── package.json         (Root workspace config)
```

## Full-Stack Data Flow

```
USER BROWSER (React App)
        ↓
   Vite Dev Server
        ↓
   React Components
        ↓
   Axios/Fetch Requests
        ↓
   CORS Enabled Express Server
        ↓
   Routes → Controllers → Services → Models
        ↓
   MongoDB Database
```

## Server Architecture Pattern

- **MVC Architecture** with Service Layer separation
- **Controllers** - Handle HTTP requests/responses
- **Services** - Business logic, algorithms, integrations
- **Models** - Mongoose schemas for database
- **Routes** - Endpoint definitions
- **Middleware** - Auth, error handling, validation

---

# 3. CORE FEATURES & TECHNOLOGIES

## Feature 1: AUTHENTICATION & USER MANAGEMENT

### What is it?

Secure user registration, login, and session management system where users can create accounts, reset passwords, and maintain secure sessions.

### Technologies Used:

- **JWT (JSON Web Tokens)** - Stateless authentication
- **Bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Cookies** - Secure token storage (httpOnly)

### How it Works:

#### Registration Flow:

1. User submits name, email, phone, password via React form
2. **Express Validator** checks if data meets requirements (email format, password strength, etc.)
3. **Bcryptjs** hashes the password before saving to database (14 rounds of salt)
4. User record created in MongoDB
5. If user is a **Worker**, additional WorkerProfile created
6. **Verification email** sent using Nodemailer with OTP code

```javascript
// Password is hashed before storage - NEVER stored as plain text
const salt = await bcrypt.genSalt(10);
this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
```

#### Login Flow:

1. User enters email/phone and password
2. Backend retrieves user from MongoDB
3. **Bcryptjs** compares entered password with stored hash
4. If match → Create JWT tokens:
   - **Access Token** (short-lived, 15 min) - Used for API requests
   - **Refresh Token** (long-lived, 7 days) - Used to get new access tokens
5. Tokens sent to frontend, stored in secure cookies
6. Each API request includes access token in headers

#### Email Verification:

1. OTP code generated and sent via email
2. User enters OTP code
3. Backend verifies OTP against stored hash
4. Account marked as verified
5. Only verified accounts can access platform features

### Protection Mechanisms:

- Passwords NEVER stored in plain text
- OTP expires after 5 minutes
- Login attempts tracked to prevent brute force
- Device fingerprinting for extra security
- Refresh tokens rotated on use

---

## Feature 2: JOB MANAGEMENT

### What is it?

System where customers (employers) can create and manage job listings, and workers can view and apply for jobs. Jobs track all lifecycle stages from creation to completion.

### Technologies Used:

- **MongoDB Document Model** - Complex nested data structure
- **Express Routes** - RESTful API endpoints
- **Multer** - File uploads for job descriptions/images
- **Express Validator** - Data validation

### Job Status Lifecycle:

```
draft → open → assigned → accepted → en_route → arrived → in_progress → completed
                                                            ↓
                                                        disputed
```

### How it Works:

#### Creating a Job (Employer/Customer Flow):

1. Customer fills job form in React (`JobCreate.jsx`)
2. Form data includes:
   - Job title, description, category
   - Skills required (e.g., "plumbing", "electrical")
   - Budget (min-max range in INR)
   - Location (GPS coordinates via Leaflet maps)
   - Urgency level (low/medium/high/emergency)
   - Number of workers needed

3. Backend validates and creates Job document:

```javascript
{
  customer: ObjectId,           // Who posted the job
  title: "Fix plumbing leak",
  category: "Plumbing",
  skillsRequired: ["plumbing", "diagnostics"],
  budget: { min: 1000, max: 5000, currency: "INR" },
  location: { type: "Point", coordinates: [79.9, 13.0] },
  status: "open",
  assignedWorkers: [],          // Will be filled when workers apply
  applicants: []                // Tracks who applied
}
```

4. Job becomes visible to all matching workers

#### Job Lifecycle Progression:

**Job Opened** → Workers browse and apply

- Workers view jobs matching their skills and location
- Click "Apply" → Application added to `applicants` array
- Customer receives notification

**Customer Selects Worker** → Job status becomes "assigned"

- Customer reviews applications and picks worker(s)
- Worker receives notification of selection

**Worker Accepts** → Job status becomes "accepted"

- Worker confirms they're taking the job
- Payment hold placed (if paid job)

**Worker Heads to Location** → Job status becomes "en_route"

- Location tracking starts
- Distance calculated using **Haversine formula** (GPS math)

**Worker Arrives** → Job status becomes "arrived"

- OTP sent to worker to confirm arrival
- Notification sent to customer

**Work In Progress** → Job status becomes "in_progress"

- Timer starts, worker can upload progress photos
- Real-time chat open for communication

**Job Complete** → Job status becomes "completed"

- Payment released to worker
- Both parties can rate each other
- Dispute resolution available if needed

### Data Structure Example:

```javascript
Job Document in MongoDB:
{
  _id: ObjectId,
  customer: ObjectId (ref to User),
  title: String,
  skillsRequired: [String],      // Indexed for fast search
  budget: {
    currency: "INR",
    min: Number,
    max: Number
  },
  location: {                      // GeoJSON format for location queries
    type: "Point",
    coordinates: [longitude, latitude]
  },
  applicants: [{
    worker: ObjectId,
    appliedAt: Date,
    status: "pending|accepted|rejected"
  }],
  dispute: {                       // Nested dispute tracking
    raisedBy: ObjectId,
    status: "open|in_review|resolved",
    history: [{
      action: "opened|comment|resolution",
      by: ObjectId,
      timestamp: Date
    }]
  },
  team: [ObjectId]                // Multi-worker projects
}
```

---

## Feature 3: INTELLIGENT WORKER MATCHING

### What is it?

Algorithm that automatically ranks and suggests the best workers for a job based on multiple factors like distance, skills, ratings, and availability.

### Technologies Used:

- **Haversine Formula** - Geographic distance calculation
- **Munkres Algorithm** (Hungarian Algorithm) - Optimal assignment
- **Weighted Scoring Algorithm** - Multi-factor ranking
- **GeoJSON Queries** - MongoDB geographic queries

### How it Works - The Matching Algorithm:

When a customer posts a job, the system needs to find the BEST workers to suggest. This uses a **weighted scoring system**:

```
Final Score = (distance_score × 0.3) +
              (price_score × 0.15) +
              (rating_score × 0.25) +
              (skill_score × 0.15) +
              (availability_score × 0.05) +
              (cold_start_bonus × 0.05)
```

#### Step 1: Filter Eligible Workers

```javascript
// Query MongoDB to find workers who:
const workers = WorkerProfile.find({
  location: { $exists: true }, // Has location data
  skills: { $in: job.skillsRequired }, // Has required skills
});
```

#### Step 2: Calculate Distance Score (30% weight)

Uses **Haversine Formula** to find straight-line distance between worker and job:

```javascript
function haversineDistanceKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371; // Earth radius in km
  // Formula calculates distance accounting for Earth's curvature
  // Result: Distance in kilometers
  return distance;
}

// Closer workers score higher
// 0 km = score 1.0
// 100 km = score 0.0
// Normalized to 0-1 scale
```

#### Step 3: Calculate Skill Match Score (15% weight)

- Perfect skill match = 1.0
- Partial match = 0.5
- No match = 0.0 (or fallback to location only)

#### Step 4: Calculate Rating Score (25% weight)

- Existing workers rated by previous customers (1-5 stars)
- Average rating of 4.5+ = score 1.0
- New workers get **"cold start" bonus** to not disadvantage them

```javascript
// Rating System
ratingStats: {
  average: 4.2,                    // Overall rating
  count: 15,                        // Number of ratings
  punctualityAvg: 4.5,              // Specific dimensions
  qualityAvg: 4.1,
  professionalismAvg: 4.0
}
```

#### Step 5: Calculate Availability Score (5% weight)

- Currently available workers score 1.0
- Busy workers score lower

#### Step 6: Sort Results by Final Score

```javascript
rankedWorkers = workers.map(w => ({
  worker: w,
  score: (distance_score × 0.3) + (price_score × 0.15) + ...
})).sort((a, b) => b.score - a.score);

// Return top workers in order
return rankedWorkers.slice(0, 10);
```

#### Result:

Backend returns **top 10 best-matched workers** to customer. Customer can view them and directly invite or workers can apply.

### Example:

```
Job: "Fix electrical issue" in Bangalore
Required Skills: ["electrical", "diagnostics"]
Budget: ₹2000-5000
Location: Bangalore Downtown

Ranking Results:
1. Raj (electrician) - Distance: 2km, Rating: 4.8, Match: 95% → Score: 0.87
2. Priya (electrician) - Distance: 5km, Rating: 4.5, Match: 95% → Score: 0.82
3. Arjun (technician) - Distance: 3km, Rating: 4.2, Match: 80% → Score: 0.78
4. ...
```

---

## Feature 4: REAL-TIME CHAT & COMMUNICATION

### What is it?

Live messaging between customers and workers with instant notifications, typing indicators, and message history.

### Technologies Used:

- **Socket.io** - WebSocket library for real-time communication
- **MongoDB** - Storing chat messages and rooms
- **Redis** (optional) - Would improve socket.io scaling

### How it Works:

#### Architecture:

```
Worker Browser (Socket.io Client)
          ↓ (WebSocket Connection)
    Socket.io Server (Node.js)
          ↓ (Listen to events)
    Store Message in MongoDB
          ↓ (Emit to listeners)
Customer Browser (Socket.io Client)
```

#### Chat Room Creation:

1. When job is assigned, chat room automatically created
2. Both parties connected to same "room"

```javascript
// Server-side Socket.io setup
io.on("connection", (socket) => {
  // User joins chat room when viewing chat
  socket.on("join_chat", (roomId) => {
    socket.join(roomId);
  });

  // User sends message
  socket.on("send_message", (message) => {
    // Save to MongoDB ChatMessage collection
    chatMessage = new ChatMessage({
      sender: userId,
      receiver: receiverId,
      content: message,
      timestamp: new Date(),
    });
    chatMessage.save();

    // Send to all users in room (real-time delivery)
    io.to(roomId).emit("receive_message", chatMessage);
  });
});
```

#### Chat Database Schema:

```javascript
ChatMessage: {
  sender: ObjectId (ref User),
  receiver: ObjectId (ref User),
  content: String,
  media: [MediaObjects],
  read: Boolean,
  timestamp: Date
}

ChatRoom: {
  participants: [ObjectId],
  job: ObjectId (ref Job),
  messages: [ObjectId] (ref ChatMessage),
  createdAt: Date
}
```

#### Real-Time Features:

1. **Instant delivery** - Messages appear immediately (< 1 second)
2. **Typing indicators** - Users see "person is typing..."
3. **Read receipts** - See if message was read
4. **Notification badges** - Unread message count
5. **Message history** - Access past conversations

#### Frontend Integration (React):

```javascript
// In Chat.jsx component
useEffect(() => {
  socket.on("receive_message", (message) => {
    // Update React state with new message
    setMessages((prev) => [...prev, message]);
  });

  socket.on("user_typing", () => {
    // Show "typing..." indicator
    setIsTyping(true);
  });
}, []);

// Send message function
const sendMessage = (text) => {
  socket.emit("send_message", {
    roomId: currentRoom,
    content: text,
  });
};
```

---

## Feature 5: PAYMENT SYSTEM (Stripe Integration)

### What is it?

Secure payment processing where customers pay for completed jobs and money is transferred to workers. Includes escrow-like protection.

### Technologies Used:

- **Stripe API** - Payment processing
- **Stripe Webhooks** - Event notifications
- **Express.js** - Webhook handling
- **MongoDB** - Payment record tracking
- **Nodemailer** - Payment confirmations

### How it Works:

#### Payment Flow:

**Step 1: Job Completion**

- Worker completes job
- Job status changes to "in_progress"
- Payment is NOT immediately charged

**Step 2: Customer Initiates Payment**

1. Customer views completed job
2. Clicks "Release Payment"
3. Frontend calls backend `/api/payments/create-intent`

```javascript
// Backend creates Stripe Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000 * 100, // Amount in cents (₹1000)
  currency: "inr",
  description: "Payment for job: Fix plumbing",
  metadata: {
    jobId: job._id,
    worker: worker._id,
  },
});

// Returns client secret to frontend
return { clientSecret: paymentIntent.client_secret };
```

**Step 3: Frontend Shows Payment Form**

- Stripe React library (`@stripe/react-stripe-js`) shows payment form
- Card details NEVER touch our server (Stripe handles it securely)

**Step 4: Payment Confirmation**

- Customer enters card details in Stripe-hosted form
- Stripe processes payment securely

**Step 5: Webhook & Money Transfer**

```javascript
// When payment succeeds, Stripe sends webhook to our server
app.post("/api/webhook", (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    // Mark payment as "captured"
    Payment.updateOne(
      { stripePaymentIntentId: event.data.object.id },
      { status: "captured" },
    );

    // Calculate payouts
    const total = event.data.object.amount / 100;
    const platformFee = total * 0.05; // 5% platform fee
    const workerPayout = total - platformFee;

    // Record worker payout
    payees: [
      {
        worker: workerId,
        amount: workerPayout,
        status: "released",
      },
    ];
  }
});
```

**Step 6: Worker Gets Paid**

- Money released to worker's bank account (via Stripe Connect)
- Happens within 1-2 business days
- Worker gets email confirmation and invoice

#### Payment Document Structure:

```javascript
Payment: {
  _id: ObjectId,
  job: ObjectId (ref Job),
  payer: ObjectId (customer),
  payees: [{
    worker: ObjectId,
    amount: 950,                    // After platform fee
    status: "pending|released|failed"
  }],
  total: 1000,                      // Full amount
  platformFeePct: 5,                // 5% fee
  currency: "INR",
  status: "pending|captured|refunded",
  stripePaymentIntentId: "pi_...",
  clientSecret: "pi_..._secret",    // For frontend
  invoiceUrl: "https://invoice.url",
  createdAt: Date
}
```

#### Security Features:

- **PCI Compliance** - Card data never touches our server
- **Encrypted transmission** - All data over HTTPS
- **Webhook verification** - Checks payment authenticity
- **Amount validation** - Prevents tampering
- **Refund capability** - If dispute or cancellation

---

## Feature 6: AI-POWERED FEATURES (Google Gemini)

### What is it?

AI assistant that helps users with job recommendations, skill development, dispute resolution, and intelligent chat responses.

### Technologies Used:

- **Google Generative AI SDK** (`@google/generative-ai`)
- **Gemini 1.5 Model** - Latest Google AI model
- **Prompt Engineering** - Crafted instructions for AI
- **Stream Responses** - Real-time AI output

### How it Works:

#### 1. AI Chat Assistant

```javascript
// Frontend component: AssistantWidget.jsx
// User asks AI questions about finding work, skills, etc.

async function sendQueryToAI(userMessage) {
  const response = await axios.post("/api/ai/chat", {
    message: userMessage,
    context: "marketplace", // or 'dispute_resolution'
  });

  // AI returns helpful response streamed in real-time
  return response.data.aiResponse;
}
```

#### 2. Backend AI Integration:

```javascript
// Server: aiController.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function aiChat(req, res) {
  const { message, context } = req.body;

  // Create custom prompt based on context
  let systemPrompt = aiPrompts[context]; // Pre-defined prompts

  // Send to Gemini API
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: message }],
      },
    ],
    systemInstruction: systemPrompt,
  });

  return response.text();
}
```

#### 3. AI Use Cases:

**Job Recommendation AI:**

- User: "I'm good at teaching and have free weekends"
- AI analyzes user skills, availability, ratings
- Gemini suggests: "Tutoring jobs for high school students"

**Dispute Resolution AI:**

- Customer reports: "Worker didn't complete job properly"
- AI analyzes: Previous interactions, payment records, ratings
- AI suggests: "Try reaching out for revision first OR escalate to admin"

**Skill Development AI:**

- Worker asks: "How to improve my plumbing skills?"
- AI provides: "Top 5 plumbing certifications, online courses..."

#### 4. System Prompts (Pre-defined Instructions):

```javascript
aiPrompts = {
  marketplace: `You are a helpful WorkLink assistant. Help users...
    - Find suitable jobs or workers
    - Answer questions about the platform
    - Suggest skills to learn
  `,
  disputes: `You are a dispute resolution expert. Help resolve conflicts...
    - Understand both sides
    - Suggest fair solutions
    - Identify patterns in disputes
  `,
};
```

#### 5. Important Security Note:

- **API Key stored in .env** (not in code)
- **Rate limiting** - Limits API calls to control costs
- **Input validation** - Prevents prompt injection attacks
- **Response filtering** - Removes sensitive data before returning

---

## Feature 7: VIDEO CALL/VIRTUAL MEETINGS

### What is it?

Real-time peer-to-peer video calling between customer and worker within the platform.

### Technologies Used:

- **Simple-peer** - WebRTC wrapper for video calls
- **Socket.io** - Signaling (call invitation, answer, hang-up)
- **WebRTC** - Browser's native video/audio streaming

### How it Works:

#### WebRTC Signaling Flow:

```
Worker                              Customer
  │                                   │
  ├─── socket: 'initiate_call' ───→  │
  │                                   │
  │     Socket serves as "phone line" │
  │     (only to exchange metadata)   │
  │                                   │
  │  ←─── socket: 'call_accepted' ───┤
  │                                   │
  │  ←─ Exchange ICE Candidates ─→   │
  │                                   │
  │  ←── Exchange Session Offers ──→  │
  │     (WebRTC metadata)             │
  │                                   │
  └──── Direct P2P Video Stream ────→ │
```

#### Backend (Socket.io signaling):

```javascript
// Listen for call initiation
socket.on("initiate_video_call", (recipients) => {
  // Send call notification to recipients
  recipients.forEach((recipientId) => {
    io.to(recipientId).emit("incoming_video_call", {
      caller: socket.userId,
      jobId: jobId,
      sessionId: generateSessionId(),
    });
  });
});

// Handle call acceptance
socket.on("accept_video_call", (callData) => {
  // Notify caller about acceptance
  io.to(callData.caller).emit("call_accepted", callData);
});

// Handle hang-up
socket.on("end_call", (callData) => {
  io.to(callData.with).emit("call_ended", callData);
});
```

#### Frontend (React Component):

```javascript
// VideoCall.jsx
import SimplePeer from "simple-peer";

export function VideoCall({ jobId, recipientId }) {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    // 1. Get user's camera/microphone
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => setStream(stream));

    // 2. Create peer connection
    const peer = new SimplePeer({
      initiator: true, // This user initiates call
      stream: stream, // Send own video/audio
      trickleIce: true, // Optimize connection
    });

    // 3. When peer generates offer/answer, send via socket
    peer.on("signal", (data) => {
      socket.emit("webrtc_signal", {
        to: recipientId,
        signal: data,
      });
    });

    // 4. Receive signals from other peer
    socket.on("webrtc_signal", ({ signal }) => {
      peer.signal(signal);
    });

    // 5. When connection established, display video
    peer.on("stream", (remoteStream) => {
      videoRef.current.srcObject = remoteStream;
    });

    setPeer(peer);
  }, []);

  return (
    <div>
      <video ref={ownVideoRef} muted autoPlay />
      <video ref={videoRef} autoPlay />
      <button onClick={() => peer.destroy()}>End Call</button>
    </div>
  );
}
```

#### Why Two Connection Types?

1. **Socket.io** - Uses server, slower, reliable for signaling
2. **WebRTC** - Direct peer-to-peer, fast, for actual video

Once WebRTC connection established, video flows directly between peers (doesn't go through our server = lower bandwidth costs).

---

## Feature 8: DISPUTE RESOLUTION

### What is it?

System to handle conflicts between customers and workers. Tracks issues, allows admin review, and enforces fair resolutions.

### Technologies Used:

- **MongoDB nested documents** - Track dispute history
- **Admin Dashboard** - Review and resolve disputes
- **Email notifications** - Alert involved parties
- **AI Assistant** - Suggest resolutions

### How it Works:

#### Dispute Lifecycle:

1. **Dispute Opened**
   - Customer reports issue with completed job
   - Selects category: quality, timeliness, behavior, payment, other
   - Provides description and evidence

```javascript
// Update job with dispute
job.dispute = {
  raisedBy: customerId,
  category: "quality",
  description: "Work not done properly",
  status: "open",
  createdAt: Date.now(),
  history: [
    {
      action: "opened",
      by: customerId,
      note: "Initial complaint",
      timestamp: Date.now(),
    },
  ],
};
```

2. **Admin Review**
   - Special `/api/admin/disputes` endpoint
   - Admin Dashboard shows all disputes
   - Admin can:
     - View full chat history between parties
     - Check payment records
     - See worker's rating history
     - Read evidence provided

3. **Resolution**
   - Admin collects more info if needed
   - Admin adds comments/notes
   - Admin decides: "refunded", "fulfilled", or "dismissed"

```javascript
job.dispute.resolution = {
  outcome: "refunded", // or "fulfilled" or "dismissed"
  adminNote: "Based on chat logs, worker did not complete...",
  resolvedAt: new Date(),
};
```

4. **Both Parties Notified**
   - Email sent explaining decision
   - If refunded: Money returned to customer
   - If fulfilled: Dispute closed, payment sent to worker
   - If dismissed: Case closed, no changes

#### Dispute Document Structure:

```javascript
// Inside Job model
dispute: {
  raisedBy: ObjectId,
  category: "quality|timeliness|behavior|payment|cancellation",
  description: String,
  status: "open|in_review|resolved|closed",
  createdAt: Date,

  // Complete audit trail
  history: [{
    action: "opened|comment|status_change|resolution",
    by: ObjectId,
    note: String,
    timestamp: Date
  }],

  // Final resolution
  resolution: {
    outcome: "refunded|fulfilled|dismissed",
    adminNote: String,
    resolvedAt: Date
  }
}
```

---

## Feature 9: ADMIN DASHBOARD & MODERATION

### What is it?

Administrative interface for platform management - users, disputes, payments, jobs, and system health.

### Technologies Used:

- **React Components** - AdminDashboard.jsx, AdminUsers.jsx, AdminDisputes.jsx
- **Protected Routes** - Only admins can access
- **MongoDB Aggregation** - Analytics and reports
- **Role-based Access Control** - "admin" role in user.roles

### How it Works:

#### Authentication Check:

```javascript
// Frontend route protection
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  // Check if user has 'admin' role
  if (!user || !user.roles.includes("admin")) {
    return <Navigate to="/" />;
  }

  return children;
}
```

#### Admin Dashboard Features:

1. **User Management**
   - View all users (customers, workers)
   - Ban/suspend problematic users
   - Reset passwords for locked accounts
   - Verify worker credentials

2. **Dispute Resolution**
   - List all open disputes
   - View both sides of conflict
   - Access full chat history
   - Approve/deny refunds
   - Add admin notes

3. **Payment Tracking**
   - View all transactions
   - Check payment success/failure rates
   - Audit trail for financial reports
   - Reconcile discrepancies

4. **Job Moderation**
   - Flag inappropriate job postings
   - Remove illegal job listings
   - Check for fraud/scams
   - Track high-value jobs

5. **Analytics**
   - Active users count
   - Jobs completed
   - Total platform revenue
   - Worker/customer ratio

---

## Feature 10: INTERNATIONAL LANGUAGE SUPPORT (i18n)

### What is it?

Multi-language support allowing users to view the platform in different languages (English, Hindi, Telugu).

### Technologies Used:

- **i18next** - Internationalization framework
- **react-i18next** - React integration
- **i18next-browser-languagedetector** - Auto-detect user language
- **JSON locale files** - Translation dictionaries

### How it Works:

#### File Structure:

```
client/src/locales/
├── en.json    (English translations)
├── hi.json    (Hindi translations)
└── te.json    (Telugu translations)
```

#### Translation Format (en.json):

```json
{
  "common": {
    "welcome": "Welcome to WorkLink",
    "findWork": "Find Work",
    "postJob": "Post a Job",
    "signOut": "Sign Out"
  },
  "jobs": {
    "create": "Create Job",
    "apply": "Apply Now",
    "budget": "Budget"
  }
}
```

#### Implementation in React:

```javascript
// i18n.js - Configuration
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

i18n.use(LanguageDetector).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  fallbackLng: "en",
});

export default i18n;
```

#### Using Translations in Components:

```javascript
import { useTranslation } from "react-i18next";

function JobCreatePage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("jobs.create")}</h1> {/* Shows "Create Job" */}
      <button>{t("jobs.apply")}</button> {/* Shows "Apply Now" */}
      <input placeholder={t("jobs.budget")} />
    </div>
  );
}
```

#### Language Switcher Component:

```javascript
// LanguageSwitcher.jsx
function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="te">తెలుగు</option>
    </select>
  );
}
```

#### Features:

- **Auto-detection** - Browser language detected automatically
- **Persistent** - Language choice saved in localStorage
- **Fallback** - If translation missing, uses English
- **Easy to scale** - Add new languages just by creating new JSON file

---

## Feature 11: IMAGE UPLOAD & STORAGE (Cloudinary)

### What is it?

Upload user avatars, job photos, and evidence images to cloud storage with automatic optimization.

### Technologies Used:

- **Cloudinary** - Cloud image storage and CDN
- **Multer** - File upload middleware
- **Multer-storage-cloudinary** - Integration between Multer and Cloudinary
- **Express file handling** - Middleware for uploads

### How it Works:

#### Setup in Backend:

```javascript
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "worklink", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    max_file_size: 5000000, // 5MB max
  },
});

const upload = multer({ storage });
```

#### Upload Endpoint:

```javascript
// Route middleware
app.post('/upload', upload.single('image'), (req, res) => {
  // File automatically uploaded to Cloudinary
  // req.file contains:
  {
    fieldname: 'image',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    path: 'https://res.cloudinary.com/...',  // CDN URL
    size: 123456
  }

  res.json({ url: req.file.path });
});
```

#### Frontend File Upload:

```javascript
import axios from "axios";

const form = new FormData();
form.append("image", fileInputElement.files[0]);

const response = await axios.post("/api/uploads", form, {
  headers: { "Content-Type": "multipart/form-data" },
});

console.log(response.data.url); // CDN URL to use
```

#### Advantages:

- **CDN delivery** - Images served from nearest server (fast globally)
- **Auto-optimization** - Reduces file size automatically
- **Responsive images** - Cloudinary generates different sizes
- **No server storage** - Saves our server disk space

---

## Feature 12: RATING & REVIEW SYSTEM

### What is it?

Workers and customers rate each other after job completion (1-5 stars) with detailed feedback.

### Technologies Used:

- **Rating Schema** - Nested in User model
- **Aggregate algorithms** - Calculate average ratings
- **Cold-start handling** - New users get fair chance

### How it Works:

#### Rating Data Model:

```javascript
// In User model - ratingStats
ratingStats: {
  average: 4.2,                    // Overall 1-5 score
  count: 15,                        // Number of ratings
  punctualityAvg: 4.5,              // Sub-ratings
  qualityAvg: 4.1,
  professionalismAvg: 4.0
}

// Separate Rating collection
{
  _id: ObjectId,
  rater: ObjectId,                 // Who gave rating
  ratee: ObjectId,                 // Who receives rating
  job: ObjectId,
  dimensionRatings: {
    punctuality: 5,                // Did they arrive on time?
    quality: 4,                     // Quality of work?
    professionalism: 5               // Professional behavior?
  },
  comment: "Great worker, highly recommended",
  createdAt: Date
}
```

#### Rating Process:

1. **Job Completion**
   - Both parties complete the job
   - Job marked as "completed"

2. **Rating Window**
   - Customer and worker can rate each other
   - Rating form appears in "My Jobs"
   - Options to rate quality, punctuality, professionalism

3. **Saving Rating**
   - Rating saved to Rating collection
   - User's ratingStats recalculated
   - Aggregation updates average

```javascript
// When new rating added
async new Rating(ratingData).save();

// Recalculate averages
const ratings = await Rating.find({ ratee: workerId });
const avgQuality = ratings.reduce((sum, r) => sum + r.dimensionRatings.quality, 0) / ratings.length;

await User.findByIdAndUpdate(workerId, {
  'ratingStats.qualityAvg': avgQuality,
  'ratingStats.average': (avgQuality + avgPunctuality + avgProfessionalism) / 3,
  'ratingStats.count': ratings.length
});
```

4. **Cold-Start Problem**
   - New workers would have 0 ratings = appear worst
   - Solution: Default rating of 4.0 for new users
   - Actual ratings gradually replace this default

#### Usage in Matching:

- High-rated workers appear first in recommendations
- Rating affects job assignment probability
- Bad ratings can prevent users from getting jobs

---

# 4. DATABASE DESIGN

## MongoDB Schema Overview

MongoDB is a **NoSQL database** - stores data as JSON-like documents instead of rigid tables.

### Key Collections (Tables):

#### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String (unique),
  passwordHash: String,
  roles: ["customer"] or ["worker"] or ["admin"],
  isWorker: Boolean,
  isCustomer: Boolean,

  // Financial Info
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    upiId: String
  },

  // Verification Status
  verification: {
    emailVerified: Boolean,
    idVerified: Boolean,
    faceMatchVerified: Boolean,
    adminApproved: Boolean
  },

  // OTP for email verification
  otp: {
    codeHash: String,
    expiresAt: Date,
    attempts: Number
  },

  // Ratings from other users
  ratingStats: {
    average: Number (1-5),
    count: Number,
    punctualityAvg: Number,
    qualityAvg: Number,
    professionalismAvg: Number
  },

  avatarUrl: String,
  lastLoginAt: Date,
  refreshTokens: [{ token: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Jobs Collection

```javascript
{
  _id: ObjectId,
  customer: ObjectId (ref User),
  title: String,
  category: String,
  description: String,
  skillsRequired: [String],
  tasks: [String],
  hoursEstimate: Number,

  budget: {
    currency: String,
    min: Number,
    max: Number
  },

  toolsRequired: [String],
  urgency: String (low|medium|high|emergency),
  workersNeeded: Number,

  // GeoJSON location for geographic queries
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },

  status: String,
  startOtp: String,
  assignedWorkers: [ObjectId],

  applicants: [{
    worker: ObjectId,
    appliedAt: Date,
    status: String
  }],

  // Dispute tracking
  dispute: {
    raisedBy: ObjectId,
    category: String,
    description: String,
    status: String,
    history: [{
      action: String,
      by: ObjectId,
      note: String,
      timestamp: Date
    }],
    resolution: {
      outcome: String,
      adminNote: String,
      resolvedAt: Date
    }
  },

  team: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments Collection

```javascript
{
  _id: ObjectId,
  job: ObjectId (ref Job),
  payer: ObjectId (ref User),

  payees: [{
    worker: ObjectId,
    amount: Number,
    status: String (pending|released|failed)
  }],

  total: Number,
  platformFeePct: Number (5),
  currency: String,
  status: String (pending|captured|refunded),

  // Stripe integration fields
  stripePaymentIntentId: String,
  clientSecret: String,
  invoiceUrl: String,

  createdAt: Date,
  updatedAt: Date
}
```

#### Other Important Collections:

- **WorkerProfile** - Extended info about workers (skills, portfolio, availability)
- **ChatMessage** - Individual messages in conversations
- **ChatRoom** - Groups messages into conversations
- **Notification** - Alerts for users
- **Rating** - Reviews of workers
- **Task** - Sub-tasks within jobs (for team projects)
- **Completion** - Marks job completion proof

---

# 5. API STRUCTURE

## RESTful API Design

API organized into logical routes matching features:

### Authentication Routes (`/api/auth`)

```
POST   /api/auth/register         - Create new account
POST   /api/auth/login            - Login with email/password
POST   /api/auth/refresh          - Get new access token
POST   /api/auth/logout           - Invalidate tokens
POST   /api/auth/verify-email     - Verify OTP code
```

### Jobs Routes (`/api/jobs`)

```
GET    /api/jobs                  - List all open jobs
POST   /api/jobs                  - Create new job
GET    /api/jobs/:id              - Get job details
PUT    /api/jobs/:id              - Update job
DELETE /api/jobs/:id              - Cancel job
POST   /api/jobs/:id/apply        - Apply for job
POST   /api/jobs/:id/assign       - Assign worker to job
GET    /api/jobs/:id/applicants   - View all applicants
```

### Matching Routes (`/api/matching`)

```
GET    /api/matching/suggest      - Get recommended workers
GET    /api/matching/:jobId/rank  - Get ranked workers
```

### Chat Routes (`/api/chat`)

```
GET    /api/chat/rooms            - List current chat rooms
GET    /api/chat/rooms/:id        - Get room messages
POST   /api/chat/rooms            - Create new room
```

### Payments Routes (`/api/payments`)

```
POST   /api/payments/create-intent       - New payment
GET    /api/payments/:jobId              - Get payment status
POST   /api/payments/:id/release        - Release to worker
POST   /api/payments/:id/refund         - Refund customer
```

### Admin Routes (`/api/admin`)

```
GET    /api/admin/users           - List all users
POST   /api/admin/users/:id/ban   - Ban user
GET    /api/admin/disputes        - List disputes
PUT    /api/admin/disputes/:id    - Resolve dispute
```

### Protected vs Public:

- **Public routes** - Register, login, password reset
- **Protected routes** - Post job, apply, chat (requires valid JWT token)
- **Admin routes** - Management functions (requires admin role)

---

# 6. SECURITY IMPLEMENTATION

## Multi-Layer Security

### 1. Password Security

- **Bcryptjs hashing** - 10 rounds of salting
- Passwords NEVER stored in plain text
- Each password unique due to salt

### 2. Authentication (JWT)

- **Access tokens** - 15-minute validity
- **Refresh tokens** - 7-day validity
- Tokens stored in httpOnly cookies (can't be stolen by JS)
- Token payload includes:
  ```javascript
  {
    sub: userId,           // Subject (user ID)
    roles: ['worker'],     // User roles
    iat: issued_at,       // Issued at time
    exp: expiry_time      // Expiration time
  }
  ```

### 3. API Security Headers (Helmet.js)

- **CORS** - Only allow requests from trusted origins
- **HTTPS/TLS** - Encrypted data in transit
- **Content Security Policy** - Prevent XSS attacks
- **Clickjacking protection** - X-Frame-Options header

### 4. Input Validation (Express Validator)

```javascript
body('email').isEmail(),          // Must be valid email
body('password').isLength(...),   // Must meet length requirement
body('phone').isMobilePhone(),    // Must be valid phone
```

### 5. Rate Limiting

- Prevents brute force attacks
- Limits API calls per IP/user

### 6. OTP Security

- 6-digit code generated randomly
- Hash stored (not plain code)
- Expires after 5 minutes
- Max 3 attempts before lock

### 7. Payment Security (PCI Compliance)

- Card details NEVER touch our server
- Stripe handles card encryption
- Webhook signature verification
- Amount validation

### 8. Database Security

- **MongoDB authentication** - Username/password required
- **Connection encryption** - TLS to database
- **Parameterized queries** - Prevent injection

---

# 7. EXTERNAL INTEGRATIONS

## Stripe Payment Gateway

- API Key stored in environment variables
- Handles payment processing securely
- Webhooks for event notifications
- PCI compliance certified

## Google Generative AI (Gemini)

- API Key in .env file
- Used for AI chat and recommendations
- Rate limited to control costs
- Responses filtered for sensitive data

## Cloudinary Image Storage

- Cloud CDN for image delivery
- Auto-optimization of images
- No server disk storage needed
- Global distribution

## Nodemailer Email Service

- SMTP server for sending emails
- User credentials in .env
- Verification emails with OTP
- Payment confirmation emails

## Socket.io Real-Time

- Bidirectional communication
- Automatic reconnection handling
- Room-based message delivery
- Event-based architecture

---

# SUMMARY TABLE

| Feature  | Frontend Tech   | Backend Tech        | Database             |
| -------- | --------------- | ------------------- | -------------------- |
| Auth     | React Forms     | JWT + Bcrypt        | MongoDB Users        |
| Jobs     | React Router    | Express Routes      | MongoDB Jobs         |
| Matching | Leaflet Maps    | Haversine + Munkres | MongoDB Workers      |
| Chat     | React + Socket  | Socket.io Server    | MongoDB ChatMessages |
| Payments | Stripe React    | Stripe SDK          | MongoDB Payments     |
| AI       | React Component | Gemini API          | MongoDB Prompts      |
| Video    | Simple-peer     | Socket Signaling    | (P2P)                |
| Upload   | File Input      | Multer + Cloudinary | Cloudinary           |
| Admin    | Admin Dashboard | Protected Routes    | MongoDB All          |
| i18n     | react-i18next   | (Frontend only)     | i18next files        |

---

# TYPICAL REQUEST FLOW

```
1. USER OPENS APP
   ↓
2. React app loads, checks localStorage for JWT token
   ↓
3. If no token → Redirects to LOGIN PAGE
   ↓
4. USER ENTERS EMAIL & PASSWORD
   ↓
5. Frontend sends POST /api/auth/login → Axios request
   ↓
6. BACKEND validates input, hashes password, finds user in MongoDB
   ↓
7. If password matches → Creates access & refresh JWT tokens
   ↓
8. Returns tokens → Cookies set in browser (httpOnly)
   ↓
9. Frontend redirects to HOME PAGE
   ↓
10. To access protected pages → JWT token verified in middleware
    ↓
11. Valid token → User can access dashboard
    ↓
12. Invalid/expired token → Refresh endpoint gets new token
    ↓
13. If refresh fails → Redirect to login again
```

---

# KEY ARCHITECTURAL DECISIONS

1. **Monorepo** - Single repo for client + server = easier deployment
2. **Socket.io** - Real-time chat without polling database
3. **MongoDB over SQL** - Flexible schema for evolving features
4. **Stripe over custom payments** - Compliance, security, reliability
5. **Cloudinary over local storage** - Scalability, CDN, auto-optimization
6. **JWT over sessions** - Stateless auth = easier to scale horizontally
7. **Weighted matching algorithm** - Fair, transparent worker recommendations
8. **Gemini AI** - Modern LLM for intelligent features
9. **Role-based access** - Simple admin/worker/customer distinctions
10. **Dispute tracking** - Complete audit trail for fairness and compliance
