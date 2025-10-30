import { cn } from "@/lib/utils";
import { EmailRiskLevel } from "@/lib/types";

interface RiskTagProps {
  riskLevel: EmailRiskLevel;
  className?: string;
}

export function RiskTag({ riskLevel, className }: RiskTagProps) {
  // Map risk levels to appropriate colors and labels
  const getRiskDetails = (level: EmailRiskLevel) => {
    switch (level) {
      case 'low':
      case 'safe':
        return {
          color: 'bg-green-500',
          label: 'Safe'
        };
      case 'medium':
      case 'suspicious':
        return {
          color: 'bg-yellow-500',
          label: 'Suspicious'
        };
      case 'high':
        return {
          color: 'bg-red-500',
          label: 'Spam'
        };
      case 'analyzing':
        return {
          color: 'bg-blue-500',
          label: 'Analyzing'
        };
      default:
        return {
          color: 'bg-gray-500',
          label: 'Unknown'
        };
    }
  };

  const { color, label } = getRiskDetails(riskLevel);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("h-5 w-full min-w-16 rounded-sm text-xs font-medium text-white flex items-center justify-center", color)}>
        {label}
      </div>
    </div>
  );
}