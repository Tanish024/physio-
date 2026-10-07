# Design Document: Order Confirmation Flow

## Overview

This design enhances the checkout flow to redirect users to the home page after successful payment with a clear confirmation message and email notification. The solution leverages React Router's navigation state to pass order data between pages and uses the existing Sonner toast library for user notifications.

## Architecture

### Component Flow

```
Checkout Page (handlePay)
    ↓
1. Create Order in Supabase
    ↓
2. Create Order Items
    ↓
3. Send Email via Edge Function
    ↓
4. Clear Cart from localStorage
    ↓
5. Navigate to Home Page with state
    ↓
Home Page (Index)
    ↓
6. Check for order confirmation in location state
    ↓
7. Display toast notification
    ↓
8. Clear navigation state
```

### Data Flow

The order confirmation data will be passed through React Router's navigation state:

```typescript
navigate("/", { 
  replace: true, 
  state: { 
    orderConfirmed: true, 
    orderId: string,
    customerName: string 
  } 
})
```

## Components and Interfaces

### 1. Checkout Page Modifications (`src/pages/Checkout.tsx`)

**Changes Required:**
- Update the `handlePay` function to navigate to "/" instead of "/supplements"
- Pass order confirmation data through navigation state
- Maintain existing error handling and email functionality

**Navigation State Interface:**
```typescript
interface OrderConfirmationState {
  orderConfirmed: boolean;
  orderId: string;
  customerName?: string;
}
```

### 2. Home Page Modifications (`src/pages/Index.tsx`)

**Changes Required:**
- Add `useLocation` and `useEffect` hooks to detect order confirmation
- Display toast notification when order confirmation is detected
- Clear the navigation state after showing the toast to prevent re-display on refresh

**Implementation Pattern:**
```typescript
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const state = location.state as OrderConfirmationState | null;
    if (state?.orderConfirmed) {
      // Show success toast
      toast.success("Order Confirmed!", {
        description: `Order #${state.orderId} has been placed successfully. Check your email for confirmation.`
      });
      
      // Clear the state to prevent re-showing on refresh
      navigate("/", { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  // ... rest of component
}
```

### 3. Email Function (No Changes Required)

The existing Supabase Edge Function at `supabase/functions/send-order-confirmation/index.ts` already handles:
- Email sending via Resend API
- Order details formatting
- Error handling with CORS headers

**Current Email Content:**
- Customer name (if provided)
- Order ID
- List of items with quantities and prices
- Total amount
- Confirmation message

## Data Models

### Order Confirmation State
```typescript
interface OrderConfirmationState {
  orderConfirmed: boolean;  // Flag to trigger confirmation display
  orderId: string;          // Order ID for reference
  customerName?: string;    // Optional customer name for personalization
}
```

### Existing Order Data (No Changes)
The existing order and order_items tables in Supabase remain unchanged:
- `orders` table: stores order header information
- `order_items` table: stores line items for each order

## Error Handling

### Scenario 1: Order Creation Fails
- **Current Behavior:** Error toast displayed, user stays on checkout page
- **New Behavior:** Same (no change needed)
- **Implementation:** Already handled in existing code

### Scenario 2: Email Sending Fails
- **Current Behavior:** Error toast displayed but order is created
- **New Behavior:** Still redirect to home page with modified message
- **Implementation:** Update error toast message to indicate order was placed but email may be delayed

```typescript
if (fnErr) {
  console.error("Email function error:", fnErr);
  // Still navigate but with warning
  localStorage.removeItem("supp_cart");
  navigate("/", { 
    replace: true, 
    state: { 
      orderConfirmed: true, 
      orderId: orderRow.id,
      customerName: name,
      emailWarning: true 
    } 
  });
  return;
}
```

### Scenario 3: Empty Cart
- **Current Behavior:** Error toast displayed, processing stops
- **New Behavior:** Same (no change needed)
- **Implementation:** Already handled in existing code

### Scenario 4: Navigation State Lost (Page Refresh)
- **Behavior:** Toast will not re-display if user refreshes home page
- **Implementation:** State is cleared immediately after showing toast

## Testing Strategy

### Unit Testing Considerations
1. **Checkout Page:**
   - Test that navigation occurs with correct state after successful order
   - Test that cart is cleared from localStorage
   - Test error scenarios don't trigger navigation

2. **Home Page:**
   - Test that toast displays when orderConfirmed state is present
   - Test that toast doesn't display on normal navigation
   - Test that state is cleared after toast display

### Integration Testing Considerations
1. **End-to-End Flow:**
   - Complete checkout process from cart to confirmation
   - Verify email is sent (check Supabase function logs)
   - Verify cart is cleared
   - Verify user lands on home page with confirmation

2. **Error Scenarios:**
   - Test with invalid email format
   - Test with empty cart
   - Test with Supabase connection issues

### Manual Testing Checklist
- [ ] Complete successful checkout and verify redirect to home page
- [ ] Verify "Order Confirmed" toast appears with order ID
- [ ] Check email inbox for confirmation email
- [ ] Verify cart is empty after checkout
- [ ] Test with email sending failure (disconnect Resend API)
- [ ] Refresh home page and verify toast doesn't re-appear
- [ ] Test with empty cart scenario
- [ ] Test with invalid email format

## Implementation Notes

### Toast Library
The project uses **Sonner** for toast notifications:
- Import: `import { toast } from "sonner";`
- Success toast: `toast.success(title, { description })`
- Error toast: `toast.error(title, { description })`
- Already configured in `App.tsx` with `<Sonner />` component

### Navigation
Using React Router v6:
- `navigate(path, { replace: true, state: {...} })` for navigation with state
- `replace: true` prevents back button from returning to checkout
- `useLocation()` to access navigation state
- State should be cleared after use to prevent re-display

### LocalStorage Cart Management
- Cart key: `"supp_cart"`
- Already cleared in existing code: `localStorage.removeItem("supp_cart")`
- No additional changes needed

## Security Considerations

1. **Email Validation:** Already implemented with regex pattern in checkout form
2. **Order Data:** Passed through navigation state (client-side only, not in URL)
3. **API Keys:** Resend API key stored as Supabase secret (not in code)
4. **CORS:** Already configured in Edge Function

## Performance Considerations

1. **Navigation State:** Minimal data passed (only order ID and name)
2. **Toast Display:** Automatic dismiss after default timeout
3. **State Cleanup:** Immediate cleanup prevents memory leaks
4. **Email Sending:** Asynchronous, doesn't block UI

## Accessibility

1. **Toast Notifications:** Sonner provides ARIA-live regions for screen readers
2. **Success Feedback:** Visual (toast) and textual (order ID) confirmation
3. **Email Backup:** Users receive email confirmation as alternative to toast

## Browser Compatibility

- React Router navigation state: Supported in all modern browsers
- Sonner toast library: Supported in all modern browsers
- LocalStorage: Widely supported
- No additional polyfills required
