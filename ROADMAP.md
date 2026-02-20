# WorkLink Project Roadmap

## Phase 1: Trust & Verification (Next Immediate Step)

- [x] **OTP Verification for Job Start**
  - [x] Backend: Generate 4-digit OTP when job is assigned.
  - [x] Backend: API endpoint to verify OTP and transition job status to `in_progress`.
  - [x] Frontend (Customer): Display OTP in Job Details when worker is assigned.
  - [x] Frontend (Worker): Input field to enter OTP to start the job.

## Phase 2: Real-Time Location

- [x] **Live Map & Tracking**
  - [x] Frontend (Worker): "Start Travel" button to begin location tracking.
  - [x] Frontend (Worker): Capture GPS coordinates and emit via Socket.io.
  - [x] Frontend (Customer): Integrate Leaflet/Google Maps to show Worker icon moving.
  - [x] Backend: Handle location socket events and relay to specific room.

## Phase 3: Communication & Accessibility

- [x] **Voice Notes in Chat**
  - [x] Frontend: Add microphone button to Chat interface.
  - [x] Frontend: Implement audio recording logic.
  - [x] Backend: Handle audio file uploads (similar to image uploads).
  - [x] Frontend: Audio player component in chat bubbles.
- [x] **Multi-Language Support**
  - [x] Frontend: Install `i18next` or similar library.
  - [x] Frontend: Create translation files (English, Hindi).
  - [x] Frontend: Add Language Toggle in Navbar/Settings.

## Phase 4: Enhanced Job Details

- [x] **Video Upload for Jobs**
  - [x] Backend: Update `uploadController` to accept video mime types.
  - [x] Frontend: Update `JobCreate` form to accept video files.
  - [x] Frontend: Add Video Player in `JobDetail` page.

## Phase 5: Safety & Disputes

- [x] **Dispute Resolution System**
  - [x] Backend: Create `Dispute` schema/model associated with Job.
  - [x] Backend: API endpoint to raise dispute.
  - [x] Frontend: "Raise Dispute" button in Job Details.
  - [x] Frontend: Form for reason and description.
- [x] **SOS Panic Button**
  - [x] Frontend: Emergency button on active jobs.
  - [x] Backend: Handle SOS trigger and alert notifications.

## Phase 6: Gamification & Ranking (High Priority)

- [ ] **Worker Badges & Achievements**
  - [ ] Backend: Define badge criteria (e.g., "5-Star Streak", "Early Bird", "Verified Pro").
  - [ ] Backend: Logic to award badges automatically on job completion.
  - [ ] Frontend: Display badges on Worker Profile and Job Proposals.
- [ ] **Leaderboards**
  - [ ] Backend: Calculate weekly/monthly top workers based on ratings & jobs completed.
  - [ ] Frontend: "Top Workers" section on Home/Worker list.

## Phase 7: Advanced Location & Alerts

- [ ] **Geofencing Notifications**
  - [ ] Backend: Calculate distance between Worker and Job location.
  - [ ] Backend: Trigger "Worker Appriving Soon" notification when within 1km.
  - [ ] Frontend: Visual indicator on map (e.g., "Arriving in 5 mins").

## Phase 8: Experience Polish & Globalization

- [ ] **Full Localization Audit**
  - [ ] Review all new AI screens (Job Create, Chat) for missing translations.
  - [ ] Add specific vernacular terms for blue-collar jobs (Hindi, Telugu, etc.).
  - [ ] Testing: Verify language switching persists across reload.
- [ ] **Admin Dashboard** (System Management)
  - [ ] User Management (Ban/Verify users).
  - [ ] Dispute Resolution Center (Admin view).
  - [ ] Platform Analytics (Jobs posted vs completed, Revenue).

## Phase 9: Advanced Communication (Optional)

- [ ] **Video Consultation**
  - [ ] Pre-booking video calls for estimates.
  - [ ] WebRTC integration (PeerJS or Twilio).

## Phase 10: Suggested Future Enhancements (AI Proposed)

- [ ] **Offline Mode for Workers:** Cache job details locally for low-connectivity areas; sync when online.
- [ ] **Smart Pricing AI:** Suggest dynamic pricing based on demand/supply in the area (Surge pricing).
- [ ] **Voice-First Navigation:** Voice commands for app navigation (accessibility for illiterate workers).
- [ ] **Subscription Plans:** "Pro" tier for workers (lower commission) or Customers (priority support).

.\stripe.exe listen --foorward-to localhost:5000/api/webhook
