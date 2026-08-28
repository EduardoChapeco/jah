const fs = require('fs');
const path = require('path');

const widerDir = path.resolve('c:/Users/Excelência Tour SMO/Documents/projetos-referencias/wider');

console.log('Target wider dir:', widerDir);

// 1. Update AuthContext.tsx
const authContextPath = path.join(widerDir, 'src/contexts/AuthContext.tsx');
let authContent = fs.readFileSync(authContextPath, 'utf8');

const updatedAuthContext = `import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { APP_BASE_URL, AUTH_URLS } from '@/config/app.config';

// Types
interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin_master' | 'admin' | 'manager' | 'user';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdminMaster: boolean;
  signIn: (email: string, password: string, pin: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@wider.app',
  created_at: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@wider.app',
  full_name: 'Administrador Wider',
  avatar_url: null,
  pin_hash: '',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_USER_ROLE: UserRole = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: '00000000-0000-0000-0000-000000000001',
  role: 'admin_master',
  created_at: '2026-01-01T00:00:00.000Z',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [profile, setProfile] = useState<Profile | null>(DEFAULT_PROFILE);
  const [userRole, setUserRole] = useState<UserRole | null>(DEFAULT_USER_ROLE);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user profile from Supabase
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return DEFAULT_PROFILE;
      return data as Profile;
    } catch {
      return DEFAULT_PROFILE;
    }
  };

  // Fetch user role from Supabase
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return DEFAULT_USER_ROLE;
      return data as UserRole;
    } catch {
      return DEFAULT_USER_ROLE;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            created_at: currentSession.user.created_at,
          });

          setTimeout(async () => {
            const [profileData, roleData] = await Promise.all([
              fetchProfile(currentSession.user.id),
              fetchUserRole(currentSession.user.id),
            ]);
            setProfile(profileData || DEFAULT_PROFILE);
            setUserRole(roleData || DEFAULT_USER_ROLE);
          }, 0);
        } else {
          setUser(DEFAULT_USER);
          setProfile(DEFAULT_PROFILE);
          setUserRole(DEFAULT_USER_ROLE);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        setUser({
          id: existingSession.user.id,
          email: existingSession.user.email || '',
          created_at: existingSession.user.created_at,
        });

        const [profileData, roleData] = await Promise.all([
          fetchProfile(existingSession.user.id),
          fetchUserRole(existingSession.user.id),
        ]);
        setProfile(profileData || DEFAULT_PROFILE);
        setUserRole(roleData || DEFAULT_USER_ROLE);
      } else {
        setUser(DEFAULT_USER);
        setProfile(DEFAULT_PROFILE);
        setUserRole(DEFAULT_USER_ROLE);
      }

      setIsLoading(false);
    }).catch(() => {
      setUser(DEFAULT_USER);
      setProfile(DEFAULT_PROFILE);
      setUserRole(DEFAULT_USER_ROLE);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, pin: string) => {
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string, fullName: string, pin: string) => {
    setIsLoading(false);
  };

  const signOut = async () => {
    setUser(DEFAULT_USER);
    setProfile(DEFAULT_PROFILE);
    setUserRole(DEFAULT_USER_ROLE);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || DEFAULT_USER,
        profile: profile || DEFAULT_PROFILE,
        userRole: userRole || DEFAULT_USER_ROLE,
        isLoading: false,
        isAuthenticated: true,
        isAdminMaster: true,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
`;

fs.writeFileSync(authContextPath, updatedAuthContext, 'utf8');
console.log('✅ AuthContext.tsx updated');

// 2. Update ProtectedRoute.tsx
const protectedRoutePath = path.join(widerDir, 'src/components/auth/ProtectedRoute.tsx');
const protectedRouteCode = `import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
`;
fs.writeFileSync(protectedRoutePath, protectedRouteCode, 'utf8');
console.log('✅ ProtectedRoute.tsx updated');

// 3. Update AdminMasterGuard.tsx
const adminMasterGuardPath = path.join(widerDir, 'src/components/auth/AdminMasterGuard.tsx');
const adminMasterGuardCode = `import React from 'react';

interface AdminMasterGuardProps {
  children: React.ReactNode;
}

export function AdminMasterGuard({ children }: AdminMasterGuardProps) {
  return <>{children}</>;
}

export default AdminMasterGuard;
`;
fs.writeFileSync(adminMasterGuardPath, adminMasterGuardCode, 'utf8');
console.log('✅ AdminMasterGuard.tsx updated');

// 4. Update TenantAdminGuard.tsx
const tenantAdminGuardPath = path.join(widerDir, 'src/components/auth/TenantAdminGuard.tsx');
const tenantAdminGuardCode = `import React from 'react';

interface TenantAdminGuardProps {
  children: React.ReactNode;
}

export function TenantAdminGuard({ children }: TenantAdminGuardProps) {
  return <>{children}</>;
}
`;
fs.writeFileSync(tenantAdminGuardPath, tenantAdminGuardCode, 'utf8');
console.log('✅ TenantAdminGuard.tsx updated');

// 5. Update AuthAwareRedirect.tsx
const authAwareRedirectPath = path.join(widerDir, 'src/components/auth/AuthAwareRedirect.tsx');
const authAwareRedirectCode = `import { ReactNode } from 'react';

interface AuthAwareRedirectProps {
  children: ReactNode;
  portalPath?: string;
}

export function AuthAwareRedirect({ children }: AuthAwareRedirectProps) {
  return <>{children}</>;
}
`;
fs.writeFileSync(authAwareRedirectPath, authAwareRedirectCode, 'utf8');
console.log('✅ AuthAwareRedirect.tsx updated');

// 6. Update PinGate.tsx
const pinGatePath = path.join(widerDir, 'src/components/security/PinGate.tsx');
const pinGateCode = `import { ReactNode } from 'react';

interface PinGateProps {
  children: ReactNode;
  context?: string;
  title?: string;
  description?: string;
  allowCancel?: boolean;
}

export function PinGate({ children }: PinGateProps) {
  return <>{children}</>;
}

export function usePinVerification() {
  const requirePin = (onSuccess: () => void) => {
    onSuccess();
  };

  const handleSuccess = () => {};
  const handleCancel = () => {};

  const PinModal = () => null;

  return {
    requirePin,
    PinModal,
  };
}
`;
fs.writeFileSync(pinGatePath, pinGateCode, 'utf8');
console.log('✅ PinGate.tsx updated');

// 7. Update App.tsx auth route to redirect to '/'
const appPath = path.join(widerDir, 'src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
  '<Route path="/auth" element={<AuthPage />} />',
  '<Route path="/auth" element={<Navigate to="/" replace />} />'
);

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('✅ App.tsx updated');

console.log('🎉 All auth and login restrictions completely removed from Wider!');
