import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export default function MetricCard({
  title,
  value,
  suffix = "",
  trend,
  trendType = 'neutral',
  icon,
  isLoading = false
}: MetricCardProps) {

  return (
    <DaisyCard >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="space-y-1">
          {isLoading ? (
            <DaisySkeleton className="h-10 w-[100px]" >
            ) : (
            <div className="flex items-baseline">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {suffix && <span className="ml-1 text-xl">{suffix}</span>}
            </div>
          )}
          
          {trend && (
            isLoading ? (
              <DaisySkeleton className="h-5 w-[60px]" >
              ) : (
              <p className={cn(
                "text-xs font-medium",
                trendType === 'up' && "text-green-600 dark:text-green-500",
                trendType === 'down' && "text-red-600 dark:text-red-500",
                trendType === 'neutral' && "text-muted-foreground"
              )}>
                {trend} from last period
              </p>
            )
          )}
        </div>
      </DaisySkeleton>
    </DaisyCard>
  );
}