/* =========================================================================
   USEAUTH HOOK — UNIFIED REACT AUTHENTICATION INTERFACE
   Direct access to current user, session, profile, RBAC roles, and auth actions.
   ========================================================================= */

import { useContext } from "react";
import { useAuth as useBaseAuth, type AuthCtx, type AppUser } from "@/lib/auth-context";
import * as authService from "@/services/authService";

export type { AppUser, AuthCtx };
export type { UserRole, UserProfile } from "@/services/authService";

export function useAuth() {
  const baseAuth = useBaseAuth();

  const user = baseAuth.user;
  const role: authService.UserRole = authService.resolveUserRole(
    user as unknown as import("@supabase/supabase-js").User,
    user?.user_metadata as unknown as authService.UserProfile
  );

  const isRootAdmin = baseAuth.isRootAdmin;
  const isAdmin = baseAuth.isAdmin || isRootAdmin || role === "admin" || role === "super_admin";
  const isStaff = isAdmin || role === "staff";
  const isCustomer = !isAdmin && !isStaff;

  return {
    ...baseAuth,
    role,
    isAdmin,
    isStaff,
    isCustomer,
    isRootAdmin,
    isAuthenticated: Boolean(user),

    // Re-export explicit service operations with unified bindings
    sendPhoneOtp: authService.sendPhoneOtp,
    verifyPhoneOtp: authService.verifyPhoneOtp,
    sendMagicLink: authService.sendMagicLink,
    sendPasswordResetEmail: authService.sendPasswordResetEmail,
    updateUserPassword: authService.updateUserPassword,
    formatPhoneNumber: authService.formatPhoneNumber,
    getArabicErrorMessage: authService.getArabicAuthErrorMessage,
  };
}

export default useAuth;
