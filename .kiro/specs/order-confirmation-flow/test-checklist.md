# Test Checklist for Order Confirmation Flow

## Manual Testing Instructions

### Test 1: Successful Checkout Flow
**Steps:**
1. Navigate to the supplements store (`/supplements`)
2. Add items to cart
3. Click "Checkout" button
4. Fill in the checkout form with valid email address
5. Click "Pay Now"

**Expected Results:**
- ✓ User is redirected to home page (`/`)
- ✓ Toast notification appears with "Order Confirmed!" message
- ✓ Toast includes the order ID (e.g., "Order #123 has been placed successfully")
- ✓ Toast mentions checking email for confirmation
- ✓ Cart is cleared (check localStorage: `supp_cart` should be removed)
- ✓ Email is sent to the provided email address

### Test 2: Refresh After Confirmation
**Steps:**
1. Complete Test 1
2. Refresh the home page (F5 or Ctrl+R)

**Expected Results:**
- ✓ Toast notification does NOT appear again
- ✓ Page loads normally without any order confirmation message

### Test 3: Email Failure Scenario
**Steps:**
1. Temporarily disable Resend API (remove RESEND_API_KEY from Supabase secrets)
2. Complete checkout process
3. Click "Pay Now"

**Expected Results:**
- ✓ User is still redirected to home page
- ✓ Toast notification appears with "Order Confirmed!" message
- ✓ Toast includes warning: "Your confirmation email may be delayed"
- ✓ Order is still created in database
- ✓ Cart is cleared

### Test 4: Empty Cart Scenario
**Steps:**
1. Navigate to checkout page directly (`/checkout`)
2. Ensure cart is empty (clear localStorage if needed)
3. Enter valid email
4. Click "Pay Now"

**Expected Results:**
- ✓ Error toast appears: "Your cart is empty"
- ✓ User stays on checkout page (no redirect)
- ✓ No order is created

### Test 5: Invalid Email Format
**Steps:**
1. Add items to cart
2. Navigate to checkout
3. Enter invalid email (e.g., "notanemail")
4. Try to click "Pay Now"

**Expected Results:**
- ✓ "Pay Now" button is disabled
- ✓ Cannot proceed with checkout

### Test 6: Order Creation Failure
**Steps:**
1. Temporarily disable Supabase connection or modify RLS policies
2. Complete checkout process
3. Click "Pay Now"

**Expected Results:**
- ✓ Error toast appears: "Failed to create order"
- ✓ User stays on checkout page (no redirect)
- ✓ Cart is NOT cleared

### Test 7: Navigation State Persistence
**Steps:**
1. Complete successful checkout
2. After seeing confirmation toast, click browser back button

**Expected Results:**
- ✓ User cannot go back to checkout page (due to `replace: true`)
- ✓ Browser back button takes user to previous page before checkout

## Automated Testing Considerations

### Unit Tests to Add (Future Enhancement)
- Test `handlePay` function with mocked Supabase calls
- Test navigation state handling in Index component
- Test toast display logic with different state combinations

### Integration Tests to Add (Future Enhancement)
- End-to-end test from cart to confirmation
- Test email sending with mocked Resend API
- Test error scenarios with mocked failures

## Browser Compatibility Testing
Test in the following browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Verification Checklist
After completing all tests:
- [ ] All success scenarios work as expected
- [ ] All error scenarios are handled gracefully
- [ ] No console errors appear during normal flow
- [ ] Toast notifications are accessible (screen reader compatible)
- [ ] Navigation state is properly cleared
- [ ] Cart is cleared after successful checkout
- [ ] Email confirmation is sent (check inbox/spam)
- [ ] Order is created in Supabase database
- [ ] Order items are created in Supabase database

## Known Limitations
- Email sending depends on Resend API configuration
- Supabase RLS policies must allow order creation
- LocalStorage is used for cart (not persistent across devices)
