import { useEffect, useState } from 'react';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { getBilling, parseApiError } from '../services/api';
import type { AdminBillingResponse } from '../types';

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function BillingPage() {
  const [data, setData] = useState<AdminBillingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const response = await getBilling();
        if (mounted) {
          setData(response);
        }
      } catch (err) {
        if (mounted) {
          setError(parseApiError(err));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingState label="Loading billing summary..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data) {
    return <ErrorState message="No billing data available" />;
  }

  return (
    <div className="stack-lg">
      <article className="panel">
        <h3>Billing Snapshot</h3>
        <div className="health-grid">
          <div>
            <p className="panel-label">Paid Users</p>
            <p className="panel-value">{data.summary.paidUsers}</p>
          </div>
          <div>
            <p className="panel-label">Trial Users</p>
            <p className="panel-value">{data.summary.trialUsers}</p>
          </div>
          <div>
            <p className="panel-label">Expired Users</p>
            <p className="panel-value">{data.summary.expiredUsers}</p>
          </div>
        </div>
        <p className="muted" style={{ marginTop: '10px' }}>
          Stripe connected: {data.summary.stripeConnected ? 'Yes' : 'No'}
        </p>
        {data.stripe.note ? <p className="muted">{data.stripe.note}</p> : null}
      </article>

      <article className="panel">
        <h3>Recent Invoices</h3>
        <ul className="line-list">
          {data.stripe.recentInvoices.length === 0 ? <li>No invoices found.</li> : null}
          {data.stripe.recentInvoices.map((invoice) => (
            <li key={invoice.id}>
              <strong>{invoice.id}</strong> | {invoice.customerEmail || 'Unknown customer'} |{' '}
              {formatAmount(invoice.amountPaid, invoice.currency)} | {invoice.status || 'unknown'}
            </li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h3>Recent Stripe Events</h3>
        <ul className="line-list">
          {data.stripe.recentEvents.length === 0 ? <li>No events found.</li> : null}
          {data.stripe.recentEvents.map((event) => (
            <li key={event.id}>
              <strong>{event.type}</strong> | {new Date(event.created * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
