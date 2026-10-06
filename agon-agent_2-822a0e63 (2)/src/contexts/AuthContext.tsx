import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import supabase from '../lib/supabase';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  profile: any;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, loading: true, profile: null, isAdmin: false, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      setProfileLoaded(true);
      return;
    }
    try {
      const res = await fetch(`/api/profiles?user_id=${user.id}`);
      const profiles = await res.json();
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setIsAdmin(profiles[0].role === 'admin');
      } else {
        const createRes = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '', phone: '', role: 'user' }),
        });
        const newProfile = await createRes.json();
        setProfile(newProfile);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setProfileLoaded(true);
    }
  }, [user?.id]);

  // Fetch profile whenever user changes
  useEffect(() => {
    setProfileLoaded(false);
    refreshProfile();
  }, [user?.id]);

  // Initialize auth state — loading stays true until BOTH session AND profile are ready
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // If no user, we're done loading immediately
      if (!session?.user) {
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // If no user after state change, clear profile and stop loading
      if (!session?.user) {
        setProfile(null);
        setIsAdmin(false);
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set loading=false only when profile fetch is complete for an authenticated user
  useEffect(() => {
    if (profileLoaded && user) {
      setLoading(false);
    }
  }, [profileLoaded, user]);

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
