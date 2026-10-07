# EmailJS Setup Guide - Free Email Sending

EmailJS is a free service that lets you send emails directly from your frontend without a backend!

## Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Click **"Sign Up"** (top right)
3. Create a free account (no credit card needed!)
4. Verify your email

## Step 2: Add Email Service

1. After logging in, click **"Email Services"** in the left sidebar
2. Click **"Add New Service"**
3. Choose **Gmail** (or any email provider you use)
4. Click **"Connect Account"**
5. Sign in with your Gmail account
6. Copy the **Service ID** (looks like: `service_abc123`)

## Step 3: Create Email Template

1. Click **"Email Templates"** in the left sidebar
2. Click **"Create New Template"**
3. Replace the template content with this:

```
Subject: Order Confirmation - {{order_id}}

Hi {{to_name}},

Thank you for your order!

Order ID: {{order_id}}

Items:
{{items_list}}

Subtotal: ${{subtotal}}
Shipping: ${{shipping}}
Total: ${{total}}

Shipping Address:
{{customer_address}}

We'll send you another email when your order ships.

Thank you for shopping with us!

Best regards,
AI Fitness Coach Team
```

4. Click **"Save"**
5. Copy the **Template ID** (looks like: `template_xyz789`)

## Step 4: Get Your Public Key

1. Click **"Account"** in the left sidebar
2. Click **"General"** tab
3. Find **"Public Key"** section
4. Copy your **Public Key** (looks like: `abcdefghijklmnop`)

## Step 5: Update Your Code

Open `src/pages/Checkout.tsx` and replace these values:

```typescript
await emailjs.send(
  'service_abc123',      // Replace with YOUR Service ID
  'template_xyz789',     // Replace with YOUR Template ID
  {
    // ... email data
  },
  'abcdefghijklmnop'     // Replace with YOUR Public Key
);
```

## Step 6: Test It!

1. Restart your dev server: `npm run dev`
2. Go to checkout
3. Fill in the form with YOUR email address
4. Click "Pay Now"
5. Check your email inbox!

---

## Free Tier Limits

EmailJS free tier includes:
- ✅ 200 emails per month
- ✅ No credit card required
- ✅ All features included

Perfect for testing and small projects!

---

## Alternative: Use .env for Keys

For better security, you can store keys in `.env`:

1. Add to your `.env` file:
```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

2. Update the code to use:
```typescript
await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  { /* ... */ },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
);
```

3. Restart dev server after changing `.env`

---

## Troubleshooting

**Email not received?**
- Check spam folder
- Verify Service ID, Template ID, and Public Key are correct
- Check EmailJS dashboard for error logs
- Make sure you verified your EmailJS email

**Still not working?**
- Open browser console (F12) and check for errors
- Go to EmailJS dashboard → "Email Log" to see if email was sent

---

## Need Help?

If you have issues:
1. Check the browser console for errors
2. Check EmailJS dashboard → "Email Log"
3. Make sure all IDs are copied correctly (no extra spaces!)
