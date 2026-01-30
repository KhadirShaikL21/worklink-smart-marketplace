# WorkLink Smart Marketplace For Blue Collar Workers

![Project Status](https://img.shields.io/badge/Status-In%20Development-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-purple?style=for-the-badge)

**WorkLink** is a next-generation, AI-powered on-demand service marketplace designed to bridge the gap between skilled blue-collar professionals and customers. By leveraging advanced matching algorithms, real-time communication, and secure payment flows, WorkLink ensures fair, fast, and reliable job fulfillment.

---

## 🚀 Key Features

### ✅ Completed & Live

- **Identity & Security**
  - **Multi-Role Authentication:** Secure Login/Register for Customers and Workers using JWT.
  - **Email Verification:** OTP-based email verification for new accounts.
  - **Job Security:** OTP verification required to start a job (Customer shares OTP, Worker enters it).
- **Job Management**
  - **Rich Job Posting:** Create jobs with detailed descriptions, location, urgency levels, and multimedia attachments (Images & **Video**).
  - **Smart Matching:** "Hungarian Matching Engine" automatically pairs jobs with the best-suited workers based on skills, location, and rating.
  - **Job Lifecycle:** Full state machine tracking (Pending → Matched → In Progress → Completed → Paid).
- **Communication & Support**
  - **Real-Time Chat:** Instant messaging between Customer and Worker (powered by Socket.io).
  - **AI Assistant:** Context-aware AI chatbot (Gemini-powered) to assist customers with job details and platform navigation.
  - **Notification System:** Real-time system alerts for job updates and matches.
- **Financials & Reputation**
  - **Secure Payments:** Integrated Stripe payment gateway for escrow-style secure transactions.
  - **Ratings & Reviews:** Detailed feedback system with granular ratings (Punctuality, Quality, Professionalism).
- **Worker Ecosystem**
  - **Profile Management:** Workers can manage skills, experience, portfolio, and tools.
  - **Availability:** Set availability status and location preferences.

### 🚧 In Development (Roadmap)

- **Live Location Tracking:** Real-time GPS tracking on an interactive map.
- **Voice Notes:** Audio messaging support in chat.
- **Localization (I18n):** Multi-language support (English/Hindi).
- **Video Consultation:** Pre-booking video calls for complex job estimations.

---

## 🛠️ Technology Stack

### Frontend Architecture

- **Framework:** [React 18](https://reactjs.org/) (Vite)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Context API
- **Real-time:** Socket.io Client
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios with Interceptors
- **UI Components:** Lucide React (Icons), Framer Motion (Animations)

### Backend Architecture

- **Runtime:** [Node.js](https://nodejs.org/) & Express
- **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Real-time Engine:** Socket.io
- **AI Engine:** Google Gemini Pro
- **Authentication:** JWT (Access/Refresh Tokens) + BCrypt
- **Storage:** Cloudinary (Images/Videos)
- **Payments:** Stripe
- **Email:** Nodemailer

---

## 📂 Project Structure

```bash
worklink-smart-marketplace/
├── client/                 # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global State (Auth, Socket)
│   │   ├── pages/          # Application Routes/Views
│   │   ├── services/       # API Service wrappers
│   │   └── utils/          # Helper functions
│   └── public/             # Static Assets
│
├── server/                 # Backend API (Node.js + Express)
│   ├── src/                # App entry point
│   ├── config/             # Environment & DB Config
│   ├── controllers/        # Request Handlers
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Endpoints
│   ├── services/           # Business Logic (Matching, Email, Realtime)
│   └── middleware/         # Auth, Upload, Error Handling
└── ...
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/worklink-smart-marketplace.git
cd worklink-smart-marketplace
```

### 2. Backend Setup

```bash
cd server
npm install
# Create .env file based on .env.example and populate keys
npm start
```

### 3. Frontend Setup

```bash
cd client
npm install
# Create .env file based on .env.example
npm run dev
```

The application will be available at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## 🔐 Environment Variables

**Server (.env)**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/worklink
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
STRIPE_SECRET_KEY=your_stripe_key
CLIENT_URL=http://localhost:5173
```

**Client (.env)**

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
