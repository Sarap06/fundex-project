/**
 * Maps activity types to icon data (icon name and background color)
 */

export interface ActivityIconConfig {
  icon: string; // lucide-react icon name
  bgColor: string; // Tailwind color class
  bgColorHex: string; // Hex color for fallback
}

export const ACTIVITY_ICON_MAP: Record<string, ActivityIconConfig> = {
  'investor_added': {
    icon: 'UserPlus',
    bgColor: 'bg-blue-100',
    bgColorHex: '#DBEAFE',
  },
  'investor_accepted': {
    icon: 'CheckCircle',
    bgColor: 'bg-green-100',
    bgColorHex: '#DCFCE7',
  },
  'investor_status_changed': {
    icon: 'AlertCircle',
    bgColor: 'bg-amber-100',
    bgColorHex: '#FEF3C7',
  },
  'deal_created': {
    icon: 'Briefcase',
    bgColor: 'bg-purple-100',
    bgColorHex: '#F3E8FF',
  },
  'deal_status_changed': {
    icon: 'TrendingUp',
    bgColor: 'bg-cyan-100',
    bgColorHex: '#CFFAFE',
  },
  'allocation_created': {
    icon: 'PieChart',
    bgColor: 'bg-indigo-100',
    bgColorHex: '#E0E7FF',
  },
  'allocation_funded': {
    icon: 'DollarSign',
    bgColor: 'bg-emerald-100',
    bgColorHex: '#D1FAE5',
  },
  'allocation_updated': {
    icon: 'RefreshCw',
    bgColor: 'bg-orange-100',
    bgColorHex: '#FFEDD5',
  },
  'document_requested': {
    icon: 'FileText',
    bgColor: 'bg-red-100',
    bgColorHex: '#FEE2E2',
  },
  'document_uploaded': {
    icon: 'Upload',
    bgColor: 'bg-teal-100',
    bgColorHex: '#CCFBF1',
  },
};

/**
 * Get icon configuration for an activity type
 */
export function getActivityIcon(activityType: string): ActivityIconConfig {
  return ACTIVITY_ICON_MAP[activityType] || {
    icon: 'Activity',
    bgColor: 'bg-gray-100',
    bgColorHex: '#F3F4F6',
  };
}

/**
 * Get icon name for an activity type
 */
export function getActivityIconName(activityType: string): string {
  return getActivityIcon(activityType).icon;
}

/**
 * Get background color for an activity type
 */
export function getActivityIconBgColor(activityType: string): string {
  return getActivityIcon(activityType).bgColor;
}
