
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ReportType = "local" | "warehouse" | "sales" | "payments";

interface ReportTypeSelectionProps {
  value: ReportType;
  onChange: (value: ReportType) => void;
}

export const ReportTypeSelection: React.FC<ReportTypeSelectionProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <Label>Report Type</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(v) => onChange(v as ReportType)}
        className="flex flex-col space-y-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="local" id="local" />
          <Label htmlFor="local">Local Stock</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="warehouse" id="warehouse" />
          <Label htmlFor="warehouse">Warehouse Stock</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sales" id="sales" />
          <Label htmlFor="sales">Sales Report</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="payments" id="payments" />
          <Label htmlFor="payments">Payment Report</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
