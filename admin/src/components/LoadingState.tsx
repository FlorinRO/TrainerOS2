export default function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div className="center-state">{label}</div>;
}
