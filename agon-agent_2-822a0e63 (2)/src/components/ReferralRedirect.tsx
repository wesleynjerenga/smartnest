import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ReferralRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract referral code from the path /ref=CODE
    const path = window.location.pathname;
    const match = path.match(/\/ref=(.+)/);
    if (match && match[1]) {
      const code = match[1];
      localStorage.setItem('referralCode', code);
      navigate(`/login?ref=${code}`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );
}