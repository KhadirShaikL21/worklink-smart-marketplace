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

- [ ] **Voice Notes in Chat**
  - [ ] Frontend: Add microphone button to Chat interface.
  - [ ] Frontend: Implement audio recording logic.
  - [ ] Backend: Handle audio file uploads (similar to image uploads).
  - [ ] Frontend: Audio player component in chat bubbles.
- [ ] **Multi-Language Support**
  - [ ] Frontend: Install `i18next` or similar library.
  - [ ] Frontend: Create translation files (English, Hindi).
  - [ ] Frontend: Add Language Toggle in Navbar/Settings.

## Phase 4: Enhanced Job Details

- [ ] **Video Upload for Jobs**
  - [ ] Backend: Update `uploadController` to accept video mime types.
  - [ ] Frontend: Update `JobCreate` form to accept video files.
  - [ ] Frontend: Add Video Player in `JobDetail` page.

## Phase 5: Future Enhancements (Backlog)

- [ ] Video Consultation (Pre-booking).
- [ ] AI Defect Detection.
- [ ] Worker Badges & Leaderboards.
- [ ] SOS Panic Button.

.\stripe.exe listen --foorward-to localhost:5000/api/webhook
