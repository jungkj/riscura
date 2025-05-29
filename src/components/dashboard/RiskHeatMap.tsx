import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface RiskHeatMapProps {
  isLoading?: boolean;
}

export default function RiskHeatMap({ isLoading = false }: RiskHeatMapProps) {
  // Mock data for the heatmap
  const impactLabels = ['Critical', 'Major', 'Moderate', 'Minor', 'Insignificant'];
  const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
  
  // Generate mock risk counts for each cell
  const riskData = Array(5).fill(0).map(() => 
    Array(5).fill(0).map(() => Math.floor(Math.random() * 5))
  );
  
  // Function to determine cell color based on risk level
  const getCellColor = (impact: number, likelihood: number) => {
    const riskScore = (impact + 1) * (likelihood + 1);
    
    if (riskScore >= 20) return "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900";
    if (riskScore >= 12) return "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900";
    if (riskScore >= 6) return "bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900";
    return "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900";
  };

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Impact / Likelihood</TableHead>
            {likelihoodLabels.map((label, index) => (
              <TableHead key={index} className="text-center">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {impactLabels.map((impact, impactIndex) => (
            <TableRow key={impactIndex}>
              <TableCell className="font-medium">{impact}</TableCell>
              {likelihoodLabels.map((_, likelihoodIndex) => (
                <TableCell 
                  key={likelihoodIndex}
                  className={cn(
                    "text-center cursor-pointer transition-colors",
                    getCellColor(impactIndex, likelihoodIndex)
                  )}
                >
                  {riskData[impactIndex][likelihoodIndex] > 0 && (
                    <div className="flex flex-col items-center p-2">
                      <span className="font-bold">{riskData[impactIndex][likelihoodIndex]}</span>
                      {riskData[impactIndex][likelihoodIndex] >= 3 && (
                        <AlertTriangle className="h-4 w-4 mt-1" />
                      )}
                    </div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}