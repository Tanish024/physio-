# Quick Email Setup - 5 Minutes!

## What I Did:
✅ Installed EmailJS library
✅ Updated Checkout.tsx to send emails
✅ Email will be sent to the address entered in the checkout form

## What You Need to Do:

### 1. Sign up for EmailJS (Free!)
Go to: https://www.emailjs.com/
- Click "Sign Up"
- Create free account
- Verify your email

### 2. Get Your 3 Keys

After signing up, you'll get:
1. **Service ID** (from Email Services page)
2. **Template ID** (from Email Templates page)
3. **Public Key** (from Account → General page)

### 3. Update the Code

Open `src/pages/Checkout.tsx` and find this section (around line 50):

```typescript
await emailjs.send(
  'service_xxxxxxx',  // ← Replace with YOUR Service ID
  'template_xxxxxxx', // ← Replace with YOUR Template ID
  {
    // ... email data
  },
  'YOUR_PUBLIC_KEY'   // ← Replace with YOUR Public Key
);
```

Replace the 3 values with your actual keys from EmailJS.

### 4. Test It!

```bash
npm run dev
```

Then try checkout with your email address!

---

## Email Template to Use in EmailJS:

When creating your template in EmailJS, use this:

**Subject:**
```
Order Confirmation - {{order_id}}
```

**Body:**
```
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

Thank you!
AI Fitness Coach Team
```

---

## That's It!

Once you add your 3 keys, emails will be sent automatically when someone clicks "Pay Now"! 🎉

**Free tier includes 200 emails/month** - perfect for your needs!
