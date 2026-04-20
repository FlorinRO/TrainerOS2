import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere');
      return;
    }

    setIsLoading(true);

    try {
      const message = await register(email, password, name);
      navigate('/login', { state: { message } });
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle validation errors
      if (err.response?.data?.error === 'Validation error' && err.response?.data?.details) {
        const details = err.response.data.details[0];
        if (details.path[0] === 'email') {
          setError('Email invalid. Verifică adresa introdusă.');
        } else if (details.path[0] === 'password') {
          setError('Parolă invalidă. Minim 6 caractere necesare.');
        } else {
          setError(details.message || 'Date invalide. Verifică formularul.');
        }
        return;
      }
      
      // Handle specific errors
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      
      if (errorMessage === 'Email already registered') {
        setError('❌ Acest email este deja înregistrat. Încearcă să te loghezi.');
      } else if (errorMessage?.toLowerCase().includes('email')) {
        setError('Email invalid. Verifică adresa introdusă.');
      } else if (errorMessage?.toLowerCase().includes('password')) {
        setError('Parolă invalidă. Minim 6 caractere necesare.');
      } else {
        setError(errorMessage || 'Înregistrarea a eșuat. Încearcă din nou.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-dark-400 font-bold text-2xl font-display">T</span>
            </div>
            <span className="text-white font-bold text-2xl font-display">TrainerOS</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 font-display">
            Începe Free Trial
          </h1>
          <p className="text-gray-300 mt-2">7 zile gratuit. Fără card necesar.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <Input
              type="text"
              label="Nume complet"
              placeholder="Ion Popescu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="nume@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Parolă"
              placeholder="Minim 6 caractere"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="text"
              label="Cod promoțional (opțional)"
              placeholder="ex: LAUNCH2026"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            />
            {promoCode === 'LAUNCH2026' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-sm font-semibold">
                  ✓ Cod valid! Prima lună: €12.99 în loc de €19.9
                </p>
              </div>
            )}

            <div className="text-sm text-gray-400">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" required />
                <span>
                  Sunt de acord cu{' '}
                  <Link to="/terms" className="text-brand-500 hover:text-brand-400">
                    Termenii și Condițiile
                  </Link>{' '}
                  și{' '}
                  <Link to="/privacy" className="text-brand-500 hover:text-brand-400">
                    Politica de Confidențialitate
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Creează Cont Gratuit
            </Button>
          </form>

          <div className="mt-6">
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span>
                  7 zile trial gratuit
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span>
                  Nu e nevoie de card
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span>
                  Poți anula oricând
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Ai deja cont?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-400 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
