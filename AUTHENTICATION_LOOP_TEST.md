# Authentication Loop Test Guide

## 🧪 **Testing Steps to Verify the Fix**

### **Step 1: Start the Development Server**
```bash
npm run dev
```

### **Step 2: Test the Authentication Flow**

#### **Test A: Signed Out User**
1. **Open browser in incognito/private mode**
2. **Go to `http://localhost:3000/`**
   - ✅ **Expected**: Should see landing page
   - ❌ **If redirects to login**: AuthWrapper might be interfering

3. **Go to `http://localhost:3000/dashboard`**
   - ✅ **Expected**: Should redirect to login page
   - ❌ **If shows dashboard**: Middleware not working

#### **Test B: Sign In Process**
1. **Click "Sign In" or go to `/auth/login`**
2. **Enter your credentials and sign in**
3. **After successful sign in**:
   - ✅ **Expected**: Should redirect to `/dashboard` and stay there
   - ❌ **If redirects back to login**: This is the loop we're fixing

#### **Test C: Signed In User**
1. **Go to `http://localhost:3000/`**
   - ✅ **Expected**: Should redirect to `/dashboard`
   - ❌ **If shows landing page**: Middleware redirect disabled

2. **Dashboard should load properly**:
   - ✅ **Expected**: Shows user data, no infinite redirects
   - ❌ **If keeps redirecting**: AuthWrapper and Dashboard conflicts

### **Step 3: Check Browser Console**

Look for these debug messages:

#### **AuthWrapper Messages:**
```
AuthWrapper - Initial session check: { session: true, error: null }
AuthWrapper - Auth state change: { event: 'SIGNED_IN', session: true }
```

#### **Dashboard Messages:**
```
Dashboard - Loading data for user: { user: true, userError: null, userId: 'user-id' }
```

#### **Navigation Messages:**
```
Pricing page - Auth state change: { event: 'SIGNED_IN', session: {...} }
```

### **Step 4: Test Sign Out**
1. **Click "Sign Out" in dashboard navigation**
2. **Should redirect to landing page**
3. **Try accessing `/dashboard` again**
   - ✅ **Expected**: Should redirect to login

## 🔧 **What We Fixed**

### **Issue 1: Multiple Auth Clients**
- **Before**: Mixed `@/lib/supabase` and `@supabase/auth-helpers-nextjs`
- **After**: Consistent `createClientComponentClient()` everywhere

### **Issue 2: Conflicting Auth Checks**
- **Before**: Both AuthWrapper and Dashboard doing auth checks
- **After**: AuthWrapper handles auth, Dashboard loads data

### **Issue 3: Middleware Conflicts**
- **Before**: Middleware redirecting while components also redirecting
- **After**: Temporarily disabled middleware redirect to dashboard

## 🚨 **If Loop Still Exists**

### **Check 1: Console Errors**
Look for:
- Permission denied errors (profiles table)
- Multiple redirect messages
- Auth state conflicts

### **Check 2: Network Tab**
Look for:
- Rapid back-and-forth requests between `/dashboard` and `/auth/login`
- 302 redirect chains

### **Check 3: Disable AuthWrapper Temporarily**
Edit `app/dashboard/layout.tsx`:
```typescript
// Temporarily remove AuthWrapper
return (
  <div className="flex h-screen bg-gray-100">
    <DashboardNav />
    <main className="flex-1 overflow-y-auto">
      <div className="p-6">
        {children}
      </div>
    </main>
  </div>
)
```

### **Check 4: Database Issues**
Make sure you've run:
```sql
-- In Supabase SQL Editor
-- Run profiles_permissions_fix.sql
```

## ✅ **Success Indicators**

- ✅ Can sign in without redirect loop
- ✅ Dashboard loads and shows user data
- ✅ Can navigate between pages
- ✅ Sign out works properly
- ✅ No console errors or infinite requests

## 🎯 **Next Steps if Still Broken**

If the loop persists:

1. **Temporarily disable AuthWrapper** (remove from layout)
2. **Re-enable middleware redirect** to dashboard
3. **Check if profiles table permissions are working**
4. **Verify environment variables are correct**

**Run this test and let me know the results!** 🧪
