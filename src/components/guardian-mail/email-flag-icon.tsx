import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailRiskLevel } from "@/lib/types";

interface EmailFlagIconProps {
  riskLevel: EmailRiskLevel;
  size?: "sm" | "md" | "lg";
}

export function EmailFlagIcon({ riskLevel, size = "md" }: EmailFlagIconProps) {
  const sizeClass = 
    size === "sm" ? "size-4" : 
    size === "lg" ? "size-6" : 
    "size-5";

  return (
    <Flag 
      className={cn(sizeClass, 
        riskLevel === 'safe' || riskLevel === 'low' ? 'text-green-500' : 
        riskLevel === 'suspicious' || riskLevel === 'medium' ? 'text-yellow-500' : 
        riskLevel === 'spam' || riskLevel === 'high' ? 'text-red-500' : 
        'text-gray-400'
      )} 
    />
  );
}