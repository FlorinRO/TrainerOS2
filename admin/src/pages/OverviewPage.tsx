import { useEffect, useState } from 'react';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { getOverview, parseApiError } from '../services/api';
import type { AdminOverviewResponse } from '../types';

export default function OverviewPage() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const response = await getOverview();
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
    return <LoadingState label="Loading platform metrics..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data) {
    return <ErrorState message="No overview data available" />;
  }

  const stats = [
    { label: 'Total Users', value: data.metrics.totalUsers.toLocaleString() },
    { label: 'New Users (7d)', value: data.metrics.newUsersLast7Days.toLocaleString() },
    { label: 'MRR (Estimated)', value: `€${data.metrics.estimatedMrr.toLocaleString()}` },
    { label: 'Expiring in 7d', value: data.metrics.expiringSubscriptions7Days.toLocaleString() },
  ];

  return (
    <div className="stack-lg">
      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="panel" key={stat.label}>
            <p className="panel-label">{stat.label}</p>
            <p className="panel-value">{stat.value}</p>
          </article>
        ))}
      </div>

      <article className="panel">
        <h3>Plan Distribution</h3>
        <div className="kv-grid">
          <p>Free Trial</p>
          <p>{data.planDistribution.FREE_TRIAL}</p>
          <p>Starter</p>
          <p>{data.planDistribution.STARTER}</p>
          <p>Pro</p>
          <p>{data.planDistribution.PRO}</p>
          <p>Elite</p>
          <p>{data.planDistribution.ELITE}</p>
          <p>Max</p>
          <p>{data.planDistribution.MAX}</p>
          <p>Ideas Generated This Month</p>
          <p>{data.metrics.ideasGeneratedThisMonth}</p>
          <p>Feedback Generated This Month</p>
          <p>{data.metrics.feedbackGeneratedThisMonth}</p>
        </div>
      </article>
    </div>
  );
}
