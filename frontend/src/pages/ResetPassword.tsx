import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '@/services/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Missing reset token. Please use the reset link from your email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ token, password });
      setSuccess(data.message || 'Password reset successful. You can now log in.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage || 'Password reset failed. Please request a new reset link.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white mt-4 font-display">Set New Password</h1>
          <p className="text-gray-300 mt-2">Choose a new password for your account.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4">
                <p className="text-brand-400 text-sm">{success}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <Input
              type="password"
              label="New Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-brand-500 hover:text-brand-400 font-semibold">
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
