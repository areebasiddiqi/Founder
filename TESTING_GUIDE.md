# Testing the Agent Appointment Feature

## Quick Start Testing Guide

### 1. Database Setup (Required)
First, run the agent appointments schema in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `agent_appointments_schema.sql`
4. Click **Run** to execute the SQL

This creates:
- `agent_appointments` table
- Row Level Security policies
- Helper functions and triggers

### 2. Start the Development Server

```bash
npm run dev
```

Navigate to: `http://localhost:3000/dashboard/seis-eis`

### 3. Test User Flow

#### Step 1: Access SEIS/EIS Dashboard
- Log in as a user with SEIS/EIS subscription
- Go to `/dashboard/seis-eis`
- You should see the agent appointment status section

#### Step 2: Mock Company Data
Since you might not have real company data yet, you can test by:

1. **Using the Apply Flow**:
   - Go to `/apply`
   - Complete the company registration process
   - This will create a company record

2. **Or Create Test Data**:
   - Go to `/admin` (if you have admin access)
   - Add a test company with SEIS/EIS candidate status

#### Step 3: Test the Agent Appointment Flow

1. **Click "Sign Now"** button in the dashboard
2. **Fill out the form** with test data:
   ```
   Company Name: Test Company Ltd
   Company Number: 12345678
   Registered Address: 123 Test Street, London, SW1A 1AA
   Director Name: John Doe
   Director Email: john.doe@test.com
   Director Title: Director
   Start Date: [Today's date]
   ```

3. **Click "Preview Document"** to see the generated legal document

4. **Download Document** (optional) to see the formatted agreement

5. **Click "Send via DocuSign"** to test the integration

### 4. Mock DocuSign Testing

The current implementation uses **mock DocuSign** responses for testing:

- **Simulated Delay**: 1-2 second delay to simulate API calls
- **Mock Envelope ID**: Generated as `mock_envelope_123456789`
- **Email Simulation**: Alert shows where email would be sent
- **Status Updates**: Mock status progression

**What happens when you click "Send via DocuSign":**
1. ✅ Form validation
2. ✅ API call to `/api/docusign/send-appointment`
3. ✅ Mock DocuSign service processes request
4. ✅ Database record created
5. ✅ Success alert with recipient email
6. ✅ Status changes to "docusign" step

### 5. Testing Different States

#### Test "Sent" Status:
1. Complete the form and send via DocuSign
2. The dashboard should show "Sent for signature - check your email"
3. Should have "Resend" button

#### Test "Signed" Status (Manual):
1. In the DocuSign step, click "Mark as Signed (for testing)"
2. This simulates the document being signed
3. Dashboard should update to show signed status

### 6. Database Verification

Check that records are being created correctly:

1. **Supabase Dashboard** → **Table Editor** → **agent_appointments**
2. **Verify records**:
   - `user_id` matches logged-in user
   - `company_name`, `company_number` correct
   - `status` progresses: draft → sent → signed
   - `envelope_id` contains mock ID
   - Timestamps update correctly

### 7. API Testing

Test the API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/docusign/send-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company Ltd",
    "companyNumber": "12345678",
    "registeredAddress": "123 Test Street, London, SW1A 1AA",
    "directorName": "John Doe",
    "directorEmail": "john.doe@test.com",
    "directorTitle": "Director",
    "startDate": "2024-01-15"
  }'
```

Expected response:
```json
{
  "success": true,
  "envelopeId": "mock_envelope_1705323456789",
  "message": "Agent appointment document sent successfully"
}
```

### 8. Error Testing

#### Test Validation Errors:
- Leave required fields empty
- Use invalid email format
- Should show appropriate error messages

#### Test API Errors:
- The mock implementation handles errors gracefully
- Check browser console for detailed error logs

### 9. Integration Testing

#### With Real DocuSign (Production Setup):
1. **Get DocuSign Developer Account**:
   - Sign up at https://developers.docusign.com
   - Create a developer sandbox account

2. **Update Environment Variables**:
   ```env
   DOCUSIGN_CLIENT_ID=your_client_id
   DOCUSIGN_CLIENT_SECRET=your_client_secret
   DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
   ```

3. **Replace Mock Implementation**:
   - Update `lib/docusign.ts` with real API calls
   - Implement OAuth authentication flow
   - Add webhook handlers for status updates

### 10. Production Deployment Checklist

Before going live:

1. ✅ **Database Schema**: Applied to production database
2. ✅ **DocuSign Integration**: Real API implementation
3. ✅ **Environment Variables**: All DocuSign credentials set
4. ✅ **Webhook Endpoints**: For DocuSign status updates
5. ✅ **Email Templates**: Professional signing emails
6. ✅ **Error Handling**: Production-ready error messages
7. ✅ **Legal Review**: Document text reviewed by lawyers
8. ✅ **Testing**: End-to-end testing with real DocuSign

## Testing Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Check database schema
# Go to Supabase → SQL Editor → Run agent_appointments_schema.sql
```

## Expected Behavior

### ✅ **Working Features**:
- Form validation and submission
- Document generation with correct legal text
- Mock DocuSign integration
- Database record creation
- Status updates in dashboard
- Error handling and user feedback

### 🔄 **Mock vs Real**:
- **Current**: Mock DocuSign (perfect for development)
- **Production**: Real DocuSign API integration needed

### 🎯 **Success Indicators**:
- Document generates correctly with user data
- API responds with success
- Database records created properly
- Dashboard shows updated status
- No TypeScript or build errors

## Troubleshooting

### Common Issues:

1. **"Table doesn't exist" error**:
   - Run the SQL schema in Supabase

2. **TypeScript errors**:
   - Check that all UI components exist
   - Verify interface compatibility

3. **API errors**:
   - Check browser console for details
   - Verify authentication status

4. **Database errors**:
   - Check RLS policies in Supabase
   - Verify user permissions

### Debug Mode:
Add `console.log` statements in:
- `components/seis-eis/agent-appointment.tsx`
- `lib/docusign.ts`
- `app/api/docusign/send-appointment/route.ts`

The implementation is **ready for testing** in mock mode and can be easily switched to production DocuSign integration when ready!
