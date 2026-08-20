import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth } from "./config";
import { AdminUser } from "./types";

export const ROOT_ADMIN_CREDENTIALS = {
  email: "adminstoresupermarketinvo@gmail.com",
  passwordHash: "ADmin/8",
  role: "super_admin" as const,
  displayName: "المدير العام — سوبرماركت الوادي الأخضر",
};

const STORAGE_KEY_AUTH_USER = "alwadi_firebase_auth_user_v1";

export interface AuthSessionState {
  user: {
    uid: string;
    email: string;
    displayName: string;
    role: "super_admin" | "customer";
  } | null;
  isAdmin: boolean;
  isRootAdmin: boolean;
}

export function isRootAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_ADMIN_CREDENTIALS.email.toLowerCase();
}

/**
 * Secure login with Email & Password via Firebase Auth + Root Admin Verification
 */
export async function loginWithFirebase(
  emailInput: string,
  passwordInput: string,
): Promise<{ success: boolean; error?: string; user?: any; isAdmin?: boolean }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  // 1. Strict Root Admin credential check
  const isTargetRootAdmin = isRootAdminEmail(email);

  if (isTargetRootAdmin) {
    if (password !== ROOT_ADMIN_CREDENTIALS.passwordHash) {
      return {
        success: false,
        error: "كلمة المرور غير صحيحة لحساب الإدارة الرئيسي",
      };
    }

    // Try Firebase auth or initialize persistent local admin session
    try {
      await signInWithEmailAndPassword(auth, email, password).catch(async () => {
        // If user not yet registered in Firebase project, create it
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr) {
          // Proceed with verified root session
        }
      });
    } catch (e) {
      // Offline / fallback auth
    }

    const adminSession = {
      uid: "root-admin-alwadi-01",
      email: ROOT_ADMIN_CREDENTIALS.email,
      displayName: ROOT_ADMIN_CREDENTIALS.displayName,
      role: "super_admin" as const,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(adminSession));
    }

    return {
      success: true,
      user: adminSession,
      isAdmin: true,
    };
  }

  // 2. Standard customer authentication via Firebase
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const session = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: cred.user.displayName || "عميل الوادي الأخضر",
      role: "customer" as const,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(session));
    }

    return {
      success: true,
      user: session,
      isAdmin: false,
    };
  } catch (err: any) {
    console.warn("Firebase Auth Error:", err);
    let msg = "فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    } else if (err.code === "auth/invalid-email") {
      msg = "صيغة البريد الإلكتروني غير صحيحة.";
    }
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Sign Out from Firebase and clear isolated sessions
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("SignOut Firebase error:", e);
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

/**
 * Get current cached session state
 */
export function getSavedAuthSession(): AuthSessionState {
  if (typeof window === "undefined") {
    return { user: null, isAdmin: false, isRootAdmin: false };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (!raw) return { user: null, isAdmin: false, isRootAdmin: false };

    const parsed = JSON.parse(raw);
    const isRoot = isRootAdminEmail(parsed.email);
    const isAdmin = isRoot || parsed.role === "super_admin";

    return {
      user: parsed,
      isAdmin,
      isRootAdmin: isRoot,
    };
  } catch (e) {
    return { user: null, isAdmin: false, isRootAdmin: false };
  }
}
