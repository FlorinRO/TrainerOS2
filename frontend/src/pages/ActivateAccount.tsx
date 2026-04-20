import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Activating your account...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState('error');
        setMessage('Missing activation token. Please use the activation link from your email.');
        return;
      }

      try {
        const { data } = await authAPI.activateAccount({ token });
        setState('success');
        setMessage(data.message || 'Account activated successfully. You can now log in.');
      } catch (err: any) {
        setState('error');
        const errorMessage = err.response?.data?.error || err.message;
        setMessage(errorMessage || 'Activation failed. Please request a new activation link.');
      }
    };

    void run();
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-dark-400 font-bold text-2xl font-display">T</span>
            </div>
            <span className="text-white font-bold text-2xl font-display">TrainerOS</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 font-display">Activate Account</h1>
        </div>

        <Card>
          <div className="space-y-5">
            {state === 'loading' && (
              <p className="text-gray-300 text-sm">{message}</p>
            )}
            {state === 'success' && (
              <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4">
                <p className="text-brand-400 text-sm">{message}</p>
              </div>
            )}
            {state === 'error' && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-500 text-sm">{message}</p>
              </div>
            )}

            <Link to="/login" className="block">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
