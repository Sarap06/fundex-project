import React from 'react';
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Briefcase,
  TrendingUp,
  PieChart,
  DollarSign,
  RefreshCw,
  FileText,
  Upload,
  Activity,
} from 'lucide-react';

interface ActivityIconProps {
  icon: string;
  bgColor: string;
  iconBgColorHex: string;
  size?: number;
}

export function ActivityIcon({
  icon,
  bgColor,
  iconBgColorHex,
  size = 8,
}: ActivityIconProps) {
  const IconComponent = {
    'UserPlus': UserPlus,
    'CheckCircle': CheckCircle,
    'AlertCircle': AlertCircle,
    'Briefcase': Briefcase,
    'TrendingUp': TrendingUp,
    'PieChart': PieChart,
    'DollarSign': DollarSign,
    'RefreshCw': RefreshCw,
    'FileText': FileText,
    'Upload': Upload,
    'Activity': Activity,
  }[icon] || Activity;

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: iconBgColorHex }}
    >
      <IconComponent size={18} className="text-gray-700" strokeWidth={2.5} />
    </div>
  );
}
