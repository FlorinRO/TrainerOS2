import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <article className="panel">
      <h3>Operational Settings</h3>
      <p className="muted">Environment and access diagnostics for this admin deployment.</p>

      <div className="kv-grid" style={{ marginTop: '14px' }}>
        <p>Signed in as</p>
        <p>{user?.email}</p>
        <p>API Base URL</p>
        <p>{import.meta.env.VITE_API_BASE_URL || 'https://api.traineros.org/api'}</p>
        <p>Build mode</p>
        <p>{import.meta.env.MODE}</p>
      </div>

      <p className="muted" style={{ marginTop: '14px' }}>
        Configure production values with `VITE_API_BASE_URL` and backend `CORS_ORIGIN`.
      </p>
    </article>
  );
}
