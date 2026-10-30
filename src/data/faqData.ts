import type { FaqItem } from '../types';

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'no-app',
    category: 'Product',
    question: 'Do customers need to download an app?',
    answer: 'No. Customers never need to visit the App Store or Google Play, remember passwords, or download an application. When they scan your counter QR code with their phone camera, their loyalty card opens immediately in their default browser (Safari, Chrome, etc.). They can save it to their home screen with a single tap.',
  },
  {
    id: 'no-pos',
    category: 'Integration',
    question: 'Does Loyaltydigitalqr require a POS integration?',
    answer: 'No POS integration is needed whatsoever. Loyaltydigitalqr is completely standalone and works alongside whatever setup you currently have — whether you use Square, Clover, Toast, an old-school cash register, or manual payments. There is zero hardware to buy and no software to configure on your checkout terminal.',
  },
  {
    id: 'how-join',
    category: 'Customer Experience',
    question: 'How do customers join a loyalty program?',
    answer: 'Customers simply point their smartphone camera at the custom QR standee placed at your counter or checkout area. Tapping the camera banner instantly enrolls them and awards their very first stamp in under five seconds — no paperwork, phone numbers shouted across the counter, or friction.',
  },
  {
    id: 'how-stamps-work',
    category: 'Product',
    question: 'How do stamps or points work?',
    answer: 'Each time a customer visits or makes an eligible purchase, they present their digital card. You can validate the stamp using a secret 4-digit staff PIN entered directly on the customer’s screen, by scanning their member code from your own phone, or via automated location/time-limited QR scans.',
  },
  {
    id: 'view-different-balances',
    category: 'Wallet Feature',
    question: 'Can a customer view different loyalty balances?',
    answer: 'Yes! Through the Master Loyalty Card experience, a customer can easily access and switch between all their favorite local businesses (e.g., their morning coffee shop, barbershop, favorite lunch deli, and gym) all from one clean mobile wallet interface without juggling multiple paper punch cards.',
  },
  {
    id: 'reward-earned',
    category: 'Customer Experience',
    question: 'What happens when a reward is earned?',
    answer: 'As soon as the customer hits your required stamp milestone (such as 8 or 10 stamps), their card automatically transforms into a “Reward Unlocked” voucher. It displays your custom prize (e.g., “1 Free Coffee”) along with a clear visual verification button for your staff to tap and mark as redeemed.',
  },
  {
    id: 'free-trial',
    category: 'Pricing',
    question: 'How does the free trial work?',
    answer: 'You get 30 days of full, unrestricted access to all features — including your custom branded card, QR code counter poster generator, and customer analytics. No credit card is required to sign up. After 30 days, choose a simple, transparent subscription plan for your region with no long-term contract.',
  },
  {
    id: 'get-started',
    category: 'Onboarding',
    question: 'How can I get started?',
    answer: 'Click “Build your loyalty card”, enter your business name, select your reward rule (e.g., 8 visits = 1 free coffee), and your ready-to-print counter QR standee is generated immediately. You can have your loyalty program running at your counter in under 3 minutes.',
  },
];
