# Database Seeding Guide

This guide explains how to populate your Supabase database with dummy data for the FocusPulse AI application.

## Prerequisites

1. **Set up your environment variables** in `.env` file:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Method 1: Node.js Script (Recommended)

The `db.js` script creates comprehensive dummy data using the Supabase client.

### Usage:

```bash
# Run the seeding script
npm run seed

# Or directly
node db.js
```

### What it creates:
- **3 Users** with complete profiles
- **30 days of habit tracking data** for each user
- **5 Goals per user** with progress tracking
- **20 Focus sessions** per user with realistic data
- **15 Notifications** per user
- **4 Weekly AI reports** per user
- **30 days of productivity scores** per user
- **25 Activity logs** per user

### Login Credentials:
After running the script, you can login with:
- `alex.johnson@example.com` : `password123`
- `sarah.chen@example.com` : `password123`
- `mike.williams@example.com` : `password123`

## Method 2: SQL Script

The `seed_data.sql` script can be run directly in the Supabase Dashboard.

### Usage:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `seed_data.sql`
3. Click **Run** to execute the script

### What it creates:
- **3 Users** (bypassing auth for demo purposes)
- **2-3 Goals per user**
- **3 days of habit tracking data**
- **2-3 Focus sessions per user**
- **2-3 Notifications per user**
- **1 Weekly AI report per user**
- **3 days of productivity scores**
- **3 Activity logs per user**

## Data Overview

### Users Created:
1. **Alex Johnson** - Software Developer (New York)
2. **Sarah Chen** - UX Designer (Los Angeles) 
3. **Mike Williams** - Student (London)

### Data Types:
- **Habits**: Daily screen time, app usage, productivity metrics
- **Goals**: Screen time limits, focus goals, productivity targets
- **Focus Sessions**: Pomodoro sessions, deep work periods
- **Notifications**: Achievements, reminders, AI insights
- **Productivity Scores**: Daily comprehensive scoring
- **AI Reports**: Weekly insights and recommendations
- **Activity Logs**: User actions and system events

## After Seeding

Once you've populated the database:

1. **Start your backend server**:
   ```bash
   npm run dev
   ```

2. **Start your frontend** and login with any of the test credentials

3. **Explore the dashboard** - You should now see:
   - User profiles with stats and streaks
   - Habit tracking data with charts
   - Active goals with progress
   - Focus session history
   - Notifications and achievements
   - Productivity scores and trends
   - AI-generated reports

## Troubleshooting

### Common Issues:

1. **"User already exists" error**: The SQL script uses `ON CONFLICT DO NOTHING` to prevent duplicates

2. **Permission denied**: Ensure you're using the SERVICE_ROLE_KEY, not the ANON_KEY

3. **Missing tables**: Run the schema.sql first to create all tables

4. **Environment variables**: Make sure your `.env` file is properly configured

### Reset Database:

To start fresh, you can:
1. Delete all data from tables in Supabase Dashboard
2. Or create a new Supabase project
3. Then run the seeding script again

## Customization

### Adding More Users:
Edit the `sampleUsers` array in `db.js` to add more test users.

### Adjusting Data Ranges:
Modify the `randomInt()` calls in `db.js` to change:
- Screen time limits
- Productivity scores
- Focus session durations
- Goal completion rates

### Different Time Periods:
Change the loop ranges in `db.js` to generate more or fewer days of data.

## Production Considerations

These scripts are **for development/testing only**. In production:
- Users should register through the auth system
- Real data will be generated through user interactions
- Consider data privacy and GDPR compliance
- Implement proper data backup strategies
