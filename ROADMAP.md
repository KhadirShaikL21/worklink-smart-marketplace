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

## Phase 6: Future Enhancements (Backlog)

- [ ] Video Consultation (Pre-booking).
- [ ] AI Defect Detection.
- [ ] Worker Badges & Leaderboards.

.\stripe.exe listen --foorward-to localhost:5000/api/webhook
