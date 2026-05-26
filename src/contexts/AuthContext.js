import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const normalizeRole = (role) => {
  const cleanRole = String(role || '').trim().toLowerCase();

  if (cleanRole === 'admin') return 'admin';
  if (cleanRole === 'registrar') return 'registrar';
  if (cleanRole === 'receptionist') return 'registrar';
  if (cleanRole === 'specialist') return 'specialist';
  if (cleanRole === 'doctor') return 'specialist';
  if (cleanRole === 'client') return 'client';
  if (cleanRole === 'patient') return 'client';

  return 'client';
};

const getRolePath = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'registrar') return '/registrar';
  if (normalizedRole === 'specialist') return '/specialist';

  return '/client';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeProfile = (profileData) => {
    if (!profileData) return null;

    return {
      ...profileData,
      role: normalizeRole(profileData.role),
    };
  };

  const loadProfile = async (authUserOrId) => {
    const userId =
      typeof authUserOrId === 'string'
        ? authUserOrId
        : authUserOrId?.id;

    const userEmail =
      typeof authUserOrId === 'string'
        ? null
        : authUserOrId?.email;

    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile by id:', error);
      return null;
    }

    if (data) {
      const normalizedProfile = normalizeProfile(data);
      setProfile(normalizedProfile);
      return normalizedProfile;
    }

    /*
      Запасний пошук по email.
      Це допомагає, якщо профіль уже є в profiles, але id чомусь не співпав з auth.uid().
    */
    if (userEmail) {
      const { data: emailProfile, error: emailProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (!emailProfileError && emailProfile) {
        const normalizedProfile = normalizeProfile(emailProfile);
        setProfile(normalizedProfile);
        return normalizedProfile;
      }

      if (emailProfileError) {
        console.warn('Error loading profile by email:', emailProfileError);
      }
    }

    return null;
  };

  const createProfile = async (authUser) => {
    if (!authUser?.id) return null;

    const metadata = authUser.user_metadata || {};

    const fullName =
      metadata.full_name ||
      metadata.name ||
      metadata.display_name ||
      authUser.email ||
      'Користувач';

    const role = normalizeRole(metadata.role);

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        full_name: fullName,
        email: authUser.email || null,
        phone: metadata.phone || null,
        role,
        language: metadata.language || 'UA',
        timezone: metadata.timezone || 'Europe/Kiev',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    const normalizedProfile = normalizeProfile(data);
    setProfile(normalizedProfile);
    return normalizedProfile;
  };

  const ensureProfile = async (authUser) => {
    if (!authUser?.id) return null;

    const existingProfile = await loadProfile(authUser);

    if (existingProfile) {
      return existingProfile;
    }

    return createProfile(authUser);
  };

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await ensureProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);

        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setLoading(true);

        if (session?.user) {
          setUser(session.user);
          await ensureProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setUser(data.user);

    const userProfile = await ensureProfile(data.user);

    return {
      user: data.user,
      profile: userProfile,
      role: normalizeRole(userProfile?.role),
      redirectTo: getRolePath(userProfile?.role),
    };
  };

  const register = async (email, password, profileData = {}) => {
    const cleanPhone = profileData.phone
      ? profileData.phone.replace(/\s/g, '')
      : '';

    const role = normalizeRole(profileData.role || 'client');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profileData.fullName || '',
          phone: cleanPhone,
          role,
          language: profileData.language || 'UA',
          timezone: profileData.timezone || 'Europe/Kiev',
        },
      },
    });

    if (error) throw error;

    return data.user;
  };

  const sendLoginCode = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) throw error;

    return true;
  };

  const verifyLoginCode = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;

    setUser(data.user);

    const userProfile = await ensureProfile(data.user);

    return {
      user: data.user,
      profile: userProfile,
      role: normalizeRole(userProfile?.role),
      redirectTo: getRolePath(userProfile?.role),
    };
  };

  const loginWithProvider = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return data;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      throw error;
    }

    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    sendLoginCode,
    verifyLoginCode,
    loginWithProvider,
    resetPassword,
    updatePassword,
    logout,
    signOut: logout,
    getRolePath,
    normalizeRole,
    ensureProfile,
    loadProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};