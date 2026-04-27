# timeMatch 🕒

A beautiful, real-time schedule alignment web application. `timeMatch` allows multiple users to intuitively find overlapping free time by simply dragging on a grid. Built with React (Vite) and Supabase, featuring a modern glassmorphic dark-mode UI.

![timeMatch Theme](https://img.shields.io/badge/Theme-Dark%20%2F%20Glassmorphism-6366f1)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Supabase-06b6d4)

## ✨ Key Features

1. **Secure Google Authentication**
   Users can securely log in using their Google accounts via Supabase Auth integration.

2. **Private Rooms & Direct Invites**
   - **Create Rooms:** Users can create a schedule room, set a mandatory room password, and pin a custom notice message for participants.
   - **Direct Invite Links:** Invite others via a single click using copied shareable links. Guests accessing the link will be greeted by a lock screen to enter the room password.

3. **Intuitive Drag & Drop Grid**
   A highly responsive time grid lets users select their available hours by intuitively clicking and dragging across days and times. Designed carefully to prevent any layout shifts for a buttery-smooth experience.

4. **Absolute Blind Voting & Real-time Heatmap**
   - **Zero-Leak Anti-bias System:** You cannot see other people's schedule choices until you submit your own available time. The system actively protects data leaks against clicking empty slots, preventing users from receiving hints about others' selections before submitting.
   - **Instant Real-time Heatmap:** Once submitted, overlapping availabilities are instantly visualized through a color-coded heatmap (the darker the color, the more people are available) synchronized in real-time via Supabase realtime channels without needing a page refresh.

5. **Creator Dashboard & Room Management**
   - Creators can easily keep track of 'Rooms I Created' within the dashboard for quick access.
   - **Room Deletion:** Full control to delete custom rooms, completely wiping the room and seamlessly cascading deletion for all related participants' schedules to ensure data privacy.

6. **Resource Auto-cleanup (2-Week Rule)**
   To optimize database resources, rooms with absolutely no activity or schedule updates for 14 straight days are automatically wiped from the database using PostgreSQL triggers and the `pg_cron` scheduler.

7. **Modern Aesthetics**
   Focus on extreme readability and beauty using a dynamic dark theme, glassmorphic panels, and smooth micro-animations.

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, React Router DOM, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime DB, pg_cron)
- **Styling:** Custom Vanilla CSS Variables (No external UI libraries)

## 🚀 Getting Started

### 1. Requirements
- Node.js version 20+
- A Supabase Project

### 2. Installation
```bash
# Clone or initialize the repository
git init

# Install dependencies
npm install

# Setup environment variables
# Create a .env file based on your Supabase credentials
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup (Supabase SQL Editor)
Execute the provided `schema.sql` code in your Supabase SQL Editor. This will automatically generate:
- The `rooms` and `schedules` tables
- Appropriate RLS Policies
- The `last_activity_at` trigger logic
- The 14-day automated cron job

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser to start scheduling!
