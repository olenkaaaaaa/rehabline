import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { ensureProfile, getRolePath } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const finishLogin = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          console.error('OAuth callback error:', error);
          if (isMounted) navigate('/login', { replace: true });
          return;
        }

        const profile = await ensureProfile(session.user);
        const redirectPath = getRolePath(profile?.role || 'client');

        if (isMounted) {
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback failed:', error);
        if (isMounted) navigate('/login', { replace: true });
      }
    };

    finishLogin();

    return () => {
      isMounted = false;
    };
  }, [navigate, ensureProfile, getRolePath]);

  return (
    <div className="auth-page">
      <div className="card auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Вхід...' : 'Signing in...'}
        </h1>

        <p className="auth-subtitle">
          {lang === 'UA'
            ? 'Зачекайте, завершуємо авторизацію'
            : 'Please wait, completing authorization'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;