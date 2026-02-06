# WorkLink Smart Marketplace

![Status](https://img.shields.io/badge/Status-Submission_Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Stack](https://img.shields.io/badge/MERN-Full_Stack-purple?style=for-the-badge)

> **Submission for Problem Statement 7: Full Stack (Frontend + Backend) – End-to-End Web Application**  
> _Target Problem: Bridging the digital divide for blue-collar workers through a secure, AI-powered on-demand marketplace._

---

## 📖 Project Overview

**WorkLink** is a comprehensive full-stack ecosystem designed to connect customers with skilled blue-collar workers (plumbers, electricians, cleaners, etc.) in real-time. Unlike simple listing sites, WorkLink serves as an end-to-end platform managing the entire lifecycle of a service request—from AI-assisted job posting and algorithm-based matching to live tracking, OTP security verification, and secure payments.

### Why Problem Statement 7?

This project demonstrates complete system thinking with a robust **Frontend** (React/Vite), complex **Backend** (Node/Express), **Database** (MongoDB), and critical integrations (Stripe, Socket.io, Gemini AI). It solves a messy real-world problem (unorganized labor) with a clean, digital solution.

---

## 🏗️ System Architecture

The application follows a modular Monorepo structure separating the Client (UI) and Server (API).

```mermaid
graph TD
    User[User (Customer/Worker)]

    subgraph Client [Frontend (React + Vite)]
        Auth[Auth Context]
        Pages[UI Pages]
        SocketClient[Socket.io Client]
        Maps[Leaflet Maps]
        AIWidget[AI Voice Assistant]
    end

    subgraph Server [Backend (Node.js + Express)]
        API[REST API Layer]
        AuthService[Auth & JWT]
        MatchingEngine[Matching Algorithm]
        SocketServer[Real-time Events]
        AIService[Gemini AI Service]
    end

    subgraph Database
        MongoDB[(MongoDB Atlas)]
    end

    subgraph External_Services
        Gemini[Google Gemini AI]
        Stripe[Stripe Payments]
        Cloudinary[Media Storage]
    end

    User --> Client
    Client -->|REST API| Server
    Client -->|WebSockets| SocketServer
    Server --> MongoDB
    Server --> Gemini
    Server --> Stripe
    Server --> Cloudinary
```

---

## 🔄 Core Workflows

### 1. The "Happy Path" Service Loop

1.  **Job Posting:** Customer uses the **AI Assistant** to draft a job description via voice or text.
2.  **Matching:** The system scans for nearby online workers with matching skills.
3.  **Acceptance:** Targeted workers receive real-time notifications.
4.  **Live Tracking:** Once accepted, the customer can track the worker's location on the map.
5.  **Security Handshake:**
    - Worker arrives.
    - Customer shares a **4-digit OTP**.
    - Worker enters OTP to start the job timer.
6.  **Payment:** Integrated Stripe escrow ensures the worker gets paid instantly upon completion.

---

## 🌟 Key Features

### 🧠 Advanced AI Integration (Gemini 2.0)

- **Role-Aware Assistant:** context-switching AI that acts as "Partner Support" for workers (Language: Hinglish/Telugu) and "Concierge" for Customers.
- **Voice Interface:** Built-in Speech-to-Text and Text-to-Speech for accessibility.
- **Structure Generation:** Converts vague request ("tap leaking") into structured job posts (Title, Budget, Urgency).

### 📍 Real-Time Capabilities

- **Socket.io:** Instant chat, job alerts, and status updates without refreshing.
- **Live Maps:** Leaflet integration for tracking worker approach.

### 🛡️ Security First

- **OTP Verification:** Physical presence verification.
- **JWT Authentication:** Secure stateless sessions.
- **Data Validation:** Strict Input validation using `express-validator`.

---

## 📂 Database Schema (MongoDB)

| Collection         | Description                | Key Fields                                             |
| :----------------- | :------------------------- | :----------------------------------------------------- |
| **Users**          | Stores Auth & Profile data | `email`, `password`, `roles`, `isVerified`             |
| **WorkerProfiles** | Specific worker details    | `skills`, `hourlyRate`, `location`, `availability`     |
| **Jobs**           | Central job entity         | `title`, `status`, `customer`, `assignedWorker`, `otp` |
| **ChatRooms**      | Messaging containers       | `participants`, `jobId`, `lastMessage`                 |
| **Messages**       | Chat content               | `sender`, `content`, `type` (text/audio/image)         |
| **Notifications**  | Activity log               | `recipient`, `type`, `readStatus`                      |

---

## 🔌 API Documentation (Key Core Endpoints)

### **Authentication**

- `POST /api/auth/register` - Register new user (Customer/Worker).
- `POST /api/auth/login` - Authenticate and receive JWT.
- `POST /api/auth/verify-email` - OTP email verification.

### **AI Assistant**

- `POST /api/ai/chat` - Context-aware chat (Voice/Text).
- `POST /api/ai/job-assistant` - Generate structured job JSON from intent.

### **Jobs Marketplace**

- `POST /api/jobs` - Create a new service request.
- `GET /api/jobs/nearby` - Find jobs based on geospatial query.
- `PATCH /api/jobs/:id/status` - Transition state (Start/Complete) with OTP.

### **Real-time**

- `GET /api/notifications` - Fetch user alerts.
- `POST /api/chat/messages` - Send rich media messages.

---

## 💻 Tech Stack

### **Frontend**

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Framer Motion (Animations)
- **State:** React Context API + Custom Hooks
- **Maps:** React-Leaflet
- **Icons:** Lucide-React

### **Backend**

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Real-time:** Socket.io
- **AI:** Google Generative AI SDK (`@google/genai`)
- **Storage:** Cloudinary

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB URI
- Google Gemini API Key
- Cloudinary Account

### Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/KhadirShaikL21/worklink-smart-marketplace.git
    cd worklink-smart-marketplace
    ```

2.  **Server Setup**

    ```bash
    cd server
    npm install
    # Create .env based on example
    npm run dev
    ```

3.  **Client Setup**

    ```bash
    cd ../client
    npm install
    npm run dev
    ```

4.  **Access App**
    - Open `http://localhost:5173`
    - **Customer Login:** `demo@customer.com` / `pass123`
    - **Worker Login:** `demo@worker.com` / `pass123`

---

## 📸 Project Quality & Evaluation

This project meets the **problem statement criteria** by delivering:

1.  **System Thinking:** A complete feedback loop between two distinct user types.
2.  **API Design:** RESTful standards with secure, validated endpoints.
3.  **Integration Quality:** Seamless blending of AI (Gemini) and Real-time (Socket.io) features into a practical workflow.

---

_Built for Hackathon Submission 2026_
