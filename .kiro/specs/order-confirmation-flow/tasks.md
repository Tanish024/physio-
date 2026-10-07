# Implementation Plan

- [x] 1. Update Checkout page navigation to redirect to home page with order confirmation state


  - Modify the `handlePay` function in `src/pages/Checkout.tsx` to navigate to "/" instead of "/supplements"
  - Pass order confirmation data (orderId, customerName) through navigation state
  - Update the navigation call to use `replace: true` to prevent back button issues
  - Handle email failure scenario by still redirecting but with emailWarning flag in state
  - _Requirements: 1.1, 1.2, 1.3, 3.4_



- [ ] 2. Implement order confirmation detection and toast display on home page
  - Add `useLocation` and `useNavigate` imports to `src/pages/Index.tsx`
  - Import `toast` from "sonner" in `src/pages/Index.tsx`
  - Create a `useEffect` hook that checks for orderConfirmed state in location.state
  - Display success toast with order ID when orderConfirmed is true
  - Handle emailWarning flag by showing appropriate warning message in toast



  - Clear navigation state immediately after showing toast to prevent re-display on refresh
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4_

- [ ] 3. Test the complete order confirmation flow
  - Write manual test to verify successful checkout redirects to home page
  - Verify toast notification displays with correct order ID
  - Verify cart is cleared from localStorage after checkout
  - Test that refreshing home page doesn't re-show the toast
  - Test email failure scenario shows appropriate warning
  - Test empty cart scenario doesn't trigger navigation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.4_
