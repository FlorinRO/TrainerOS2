import { getScoreColor, getScoreBarColor } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export default function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-300/78">{label}</span>
        <span className={`font-bold ${getScoreColor(score)}`}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${getScoreBarColor(score)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
