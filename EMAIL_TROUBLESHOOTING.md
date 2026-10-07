# Email Not Sending? Troubleshooting Guide

## Step 1: Check Browser Console

1. Open your browser (where the app is running)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Try checkout again
5. Look for messages starting with ✅ or ❌

**What to look for:**
- ✅ "Email sent successfully!" = Email was sent!
- ❌ "Email sending failed" = There's an error (read the error message)

## Step 2: Common Issues & Fixes

### Issue: "The public key is required"
**Fix:** Make sure you initialized EmailJS with your public key
- Check line 20 in Checkout.tsx: `emailjs.init('gPm5t7kDWppr2mISo');`

### Issue: "Service is not found"
**Fix:** Your Service ID is wrong
- Go to EmailJS Dashboard → Email Services
- Copy the exact Service ID
- Update line 66: `'service_e40w9jp'`

### Issue: "Template is not found"
**Fix:** Your Template ID is wrong
- Go to EmailJS Dashboard → Email Templates
- Copy the exact Template ID
- Update line 67: `'template_nd1r4nk'`

### Issue: "Template params are invalid"
**Fix:** Your template variables don't match
- In EmailJS template, use these exact variable names:
  - `{{to_email}}`
  - `{{to_name}}`
  - `{{order_id}}`
  - `{{items_list}}`
  - `{{subtotal}}`
  - `{{shipping}}`
  - `{{total}}`
  - `{{customer_address}}`

## Step 3: Verify EmailJS Template

Go to EmailJS Dashboard → Email Templates → Your Template

**Make sure "To Email" field is set to:**
```
{{to_email}}
```

**Template content should include:**
```
Hi {{to_name}},

Order ID: {{order_id}}

Items:
{{items_list}}

Subtotal: ${{subtotal}}
Shipping: ${{shipping}}
Total: ${{total}}

Address: {{customer_address}}
```

## Step 4: Check EmailJS Dashboard

1. Go to https://dashboard.emailjs.com/
2. Click **"Email Log"** in left sidebar
3. See if your email appears there
4. If it shows "Failed", click on it to see why

## Step 5: Test with EmailJS Test Feature

1. Go to your template in EmailJS
2. Click **"Test It"** button
3. Fill in test values
4. Click "Send Test Email"
5. Check if you receive it

If test works but app doesn't, the issue is in the code.
If test doesn't work, the issue is in EmailJS setup.

## Step 6: Verify Email Service Connection

1. Go to EmailJS Dashboard → Email Services
2. Make sure your Gmail (or other service) is connected
3. Status should be "Active" (green)
4. If not, reconnect your email account

## Quick Checklist

- [ ] Public Key is correct: `gPm5t7kDWppr2mISo`
- [ ] Service ID is correct: `service_e40w9jp`
- [ ] Template ID is correct: `template_nd1r4nk`
- [ ] Template "To Email" field is: `{{to_email}}`
- [ ] Template variables match exactly
- [ ] Email service is connected and active
- [ ] Restarted dev server after code changes
- [ ] Checked browser console for errors

## Still Not Working?

1. **Take a screenshot** of:
   - Browser console error
   - EmailJS template settings
   - EmailJS Email Log page

2. **Share these details:**
   - What error message you see in console
   - Whether test email from EmailJS works
   - Your Service ID and Template ID

## Alternative: Simple Test

Add this button to test EmailJS directly:

```typescript
const testEmail = async () => {
  try {
    const result = await emailjs.send(
      'service_e40w9jp',
      'template_nd1r4nk',
      {
        to_email: 'your-email@gmail.com',
        to_name: 'Test User',
        order_id: 'TEST-123',
        items_list: 'Test Item x 1 - $10.00',
        subtotal: '10.00',
        shipping: '5.99',
        total: '15.99',
        customer_address: 'Test Address',
      }
    );
    console.log('Test email sent!', result);
    alert('Test email sent! Check your inbox.');
  } catch (error) {
    console.error('Test failed:', error);
    alert('Test failed! Check console.');
  }
};
```

Add button in JSX:
```tsx
<Button onClick={testEmail}>Test Email</Button>
```

If this works, the issue is with the checkout flow data.
