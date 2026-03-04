# Backend: Mark Reward as Fulfilled

The admin panel sends **PATCH /rewards/:id/status** with the following body when an admin marks a reward as fulfilled.

## Request body (fulfillment)

```json
{
  "status": "fulfilled",
  "kycVerified": true,
  "adminConfirmedKyc": true,
  "adminConfirmedVideoConsent": true,
  "videoConsentStatus": "granted",
  "video_consent_status": "granted",
  "consentOptIn": true,
  "consent_opt_in": true,
  "giftCardCode": "...",
  "gift_card_code": "..."
}
```

- **videoConsentStatus** / **video_consent_status**: Sent from the reward’s stored value, or `"granted"` when the user has given consent (`consentOptIn` true), otherwise `"not_granted"`. Use this to satisfy “Video consent status is required” when the admin is fulfilling.
- **consentOptIn** / **consent_opt_in**: User’s consent flag from the reward.
- **adminConfirmedVideoConsent**: Indicates the admin has confirmed video consent in the UI; backend can treat this as satisfying the video-consent requirement for fulfillment.
- **giftCardCode** / **gift_card_code**: Present only for gift card rewards; required for those.

## Backend behavior

1. **Video consent**  
   Do not block fulfillment solely because “video consent status” is missing on the reward record if the request includes:
   - **videoConsentStatus** (or **video_consent_status**), or  
   - **adminConfirmedVideoConsent: true**  
   Use the body fields above to satisfy the “Video consent status is required before marking reward as fulfilled” check (e.g. treat `videoConsentStatus === 'granted'` or `adminConfirmedVideoConsent === true` as sufficient when the admin is fulfilling).

2. **Gift card code**  
   For reward type “Gift Card”, require **giftCardCode** (or **gift_card_code**) in the body and store it when marking as fulfilled.

3. **KYC**  
   The panel sends **kycVerified** and **adminConfirmedKyc**. Backend can allow fulfillment when the user’s KYC is verified or when **adminConfirmedKyc** is true.

Implement the above so “Mark as Fulfilled” works from the admin panel without unnecessary validation errors.
