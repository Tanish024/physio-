# EmailJS Setup Checklist - Why Email Not Sending

## Critical Checks:

### 1. Template "To Email" Field ⚠️ MOST COMMON ISSUE
In your EmailJS template editor, at the VERY TOP, there's a field called **"To Email"**.

**It MUST be set to:**
```
{{user_email}}
```

**NOT:**
- `user_email` (missing brackets)
- `{{to_email}}` (wrong variable name)
- Empty
- Your actual email address

### 2. Service ID
Current: `service_pgz9zzd`
- Go to EmailJS Dashboard → Email Services
- Verify this ID matches exactly

### 3. Template ID
Current: `template_nd1r4nk`
- Go to EmailJS Dashboard → Email Templates
- Verify this ID matches exactly

### 4. Public Key
Current: `gPm5t7kDWppr2mISo`
- Go to EmailJS Dashboard → Account → General
- Verify this matches exactly

### 5. Email Service Connected
- Go to EmailJS Dashboard → Email Services
- Click on your service
- Status should be "Active" (green)
- If not, click "Reconnect" and sign in again

## Quick Test:

### Test 1: Use EmailJS Test Feature
1. Go to your template in EmailJS
2. Click "Test It" button
3. Fill in test values:
   - user_email: your-email@gmail.com
   - to_name: Test
   - order_id: TEST-123
   - items_list: Test Item
   - subtotal: 10.00
   - shipping: 5.00
   - total: 15.00
   - customer_address: Test Address
4. Click "Send Test Email"
5. Check your inbox

**If test works:** Issue is in the app code
**If test fails:** Issue is in EmailJS setup

### Test 2: Check Browser Console
1. Open browser (F12)
2. Go to Console tab
3. Try checkout
4. Look for errors

**Common errors:**
- "The recipients address is empty" → Fix "To Email" field
- "Service not found" → Wrong Service ID
- "Template not found" → Wrong Template ID
- "The public key is required" → Wrong Public Key

## Step-by-Step Fix:

### If "Recipients address is empty":

1. Go to: https://dashboard.emailjs.com/admin/templates
2. Click your template
3. Look at the FIRST field at the top (before Subject)
4. It says "To Email"
5. Clear it completely
6. Type exactly: `{{user_email}}`
7. Click "Save Template"
8. Try again

### If Service/Template not found:

1. Go to EmailJS Dashboard
2. Copy the EXACT IDs (don't type them)
3. Tell me what they are
4. I'll update the code

### If still not working:

Take screenshots of:
1. Browser console error
2. EmailJS template "To Email" field
3. EmailJS Email Log page

## Current Code Values:

```typescript
Service ID: 'service_pgz9zzd'
Template ID: 'template_nd1r4nk'
Public Key: 'gPm5t7kDWppr2mISo'
```

Variables being sent:
- user_email: (customer's email from form)
- to_name: (customer's name from form)
- order_id: (generated order ID)
- items_list: (list of items)
- subtotal: (calculated subtotal)
- shipping: (calculated shipping)
- total: (calculated total)
- customer_address: (full address)
```

Make sure your template uses these EXACT variable names!
