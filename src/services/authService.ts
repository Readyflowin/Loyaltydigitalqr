/**
 * Firebase Authentication wrapper.
 *
 * getCurrentUser() is synchronous: main.tsx awaits init() before rendering,
 * so the first auth state is always known when pages mount.
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AppUser } from '../types/auth';
import type { OnboardingData, OperatingRegion } from '../types/onboarding';

const DRAFT_KEY_PREFIX = 'loyalty_onboarding_draft_';

/**
 * Initial empty / default onboarding configuration
 */
export function getDefaultOnboardingData(region: OperatingRegion = 'usa', planContext = 'starter'): OnboardingData {
  return {
    businessName: '',
    businessType: 'cafe',
    region,
    timeZone: region === 'india' ? 'Asia/Kolkata' : 'America/New_York',
    logoInitial: 'L',
    selectedModules: ['loyalty-cards'],
    contactEmail: '',
    address: '',
    phoneNumber: '',
    displayName: '',
    locationType: 'first',
    programName: 'Regulars Club',
    stampsRequired: 8,
    rewardDescription: 'Buy 8, get your 9th free',
    accentColor: '#3027F5',
    currentStep: 1,
    isCompleted: false,
    planContext,
  };
}

function toAppUser(user: User): AppUser {
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Merchant'),
    avatarUrl: user.photoURL || undefined,
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : new Date().toISOString(),
  };
}

/** The verification link brings the user back to the app to continue setup. */
function verificationSettings() {
  return { url: `${window.location.origin}/onboarding`, handleCodeInApp: false };
}

/** Human-readable messages for Firebase Auth error codes. */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Please allow pop-ups and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this project yet.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Add it under Firebase Authentication > Settings > Authorised domains.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  }
}

class AuthService {
  private user: AppUser | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private listeners: ((user: AppUser | null) => void)[] = [];

  /** Resolves once Firebase has restored (or ruled out) the persisted session. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (fbUser) => {
        this.user = fbUser ? toAppUser(fbUser) : null;
        if (fbUser) void this.ensureFreshToken().catch(() => {});
        if (!this.initialized) {
          this.initialized = true;
          resolve();
        }
        this.listeners.forEach((l) => l(this.user));
      });
    });
    return this.initPromise;
  }

  getCurrentUser(): AppUser | null {
    return this.user;
  }

  subscribe(listener: (user: AppUser | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async recordProfile(user: User): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email || '',
          displayName: user.displayName || '',
          lastSignInAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not record user profile', err);
    }
  }

  async signInWithGoogle(): Promise<AppUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    this.user = toAppUser(cred.user);
    await this.recordProfile(cred.user);
    return this.user;
  }

  async signInWithEmail(email: string, password: string): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    this.user = toAppUser(cred.user);
    await this.recordProfile(cred.user);
    return this.user;
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AppUser> {
    if (password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters.'), { code: 'auth/weak-password' });
    }
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    try {
      await this.sendVerification(cred.user);
    } catch (err) {
      console.warn('Could not send verification email', err);
    }
    this.user = toAppUser(cred.user);
    await this.recordProfile(cred.user);
    return this.user;
  }

  /**
   * Send the verification email. Tries with a continue URL back to the app, but
   * if that URL's domain is not an authorised continue URI (a common setup gap
   * that otherwise makes the email silently fail), falls back to Firebase's
   * default hosted handler so the email still goes out.
   */
  private async sendVerification(user: User): Promise<void> {
    try {
      await sendEmailVerification(user, verificationSettings());
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/unauthorized-continue-uri' ||
        code === 'auth/invalid-continue-uri' ||
        code === 'auth/missing-continue-uri'
      ) {
        await sendEmailVerification(user);
      } else {
        throw err;
      }
    }
  }

  async resendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) throw new Error('Please sign in first.');
    await this.sendVerification(auth.currentUser);
  }

  /**
   * The account can be verified while the cached ID token still says
   * email_verified=false (e.g. the user verified, then reloaded the page).
   * Firestore rules read the token, so refresh it before verified-only writes.
   */
  async ensureFreshToken(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.emailVerified) return;
    const result = await fbUser.getIdTokenResult();
    if (result.claims.email_verified !== true) {
      await fbUser.getIdToken(true);
    }
  }

  /** Email/password accounts must confirm their address; Google accounts arrive verified. */
  needsEmailVerification(): boolean {
    return !!this.user && !this.user.emailVerified;
  }

  /**
   * Re-read the account (e.g. after the user clicked the verification link).
   * When it has just become verified, refresh the ID token so Firestore rules
   * see email_verified = true, then notify listeners.
   */
  async reloadUser(): Promise<AppUser | null> {
    if (!auth.currentUser) return null;
    const wasVerified = this.user?.emailVerified ?? false;
    await auth.currentUser.reload();
    const next = toAppUser(auth.currentUser);
    if (next.emailVerified && !wasVerified) {
      await auth.currentUser.getIdToken(true);
    }
    this.user = next;
    if (next.emailVerified !== wasVerified) {
      this.listeners.forEach((l) => l(this.user));
    }
    return this.user;
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    this.user = null;
  }

  async getIdToken(): Promise<string | null> {
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  }

  // ---------------------------------------------------------------------------
  // Onboarding draft (kept on this device until the business is created)
  // ---------------------------------------------------------------------------

  private draftKey(): string {
    return DRAFT_KEY_PREFIX + (this.user?.id || 'anonymous');
  }

  getOnboardingDraft(): OnboardingData | null {
    try {
      const raw = localStorage.getItem(this.draftKey());
      return raw ? (JSON.parse(raw) as OnboardingData) : null;
    } catch {
      return null;
    }
  }

  saveOnboardingDraft(draft: Partial<OnboardingData>): OnboardingData {
    const current = this.getOnboardingDraft() || getDefaultOnboardingData();
    const updated: OnboardingData = { ...current, ...draft };
    try {
      localStorage.setItem(this.draftKey(), JSON.stringify(updated));
    } catch {
      // Storage unavailable (private mode): draft lives only in memory for this step.
    }
    return updated;
  }

  clearOnboardingDraft(): void {
    try {
      localStorage.removeItem(this.draftKey());
    } catch {
      // ignore
    }
  }
}

export const authService = new AuthService();
