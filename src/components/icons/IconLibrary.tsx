'use client';

import React from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import {
  // Navigation & Layout
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Sidebar,
  PanelLeft,
  PanelRight,
  
  // Actions & Controls
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Send,
  Share,
  ExternalLink,
  Link,
  Unlink,
  Refresh,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  
  // Status & Feedback
  Check,
  CheckCircle,
  CheckSquare,
  X as XIcon,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  
  // Data & Analytics
  BarChart,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  Target,
  Zap,
  
  // Communication
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  Video,
  Mic,
  MicOff,
  Bell,
  BellOff,
  
  // Files & Documents
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FilePlus,
  FolderOpen,
  Folder,
  Archive,
  
  // Users & Security
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  
  // Technology
  Database,
  Server,
  Cloud,
  CloudUpload,
  CloudDownload,
  Wifi,
  WifiOff,
  Bluetooth,
  Cpu,
  HardDrive,
  
  // Business & Finance
  Building,
  Building2,
  Briefcase,
  CreditCard,
  DollarSign,
  TrendingUp as Growth,
  Calculator,
  Receipt,
  
  // Time & Calendar
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  Stopwatch,
  History,
  
  // Media & Content
  Image,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume,
  VolumeX,
  Camera,
  
  // Tools & Settings
  Settings,
  Sliders,
  Filter,
  Search,
  ScanLine,
  Wrench,
  Hammer,
  Scissors,
  
  // Transportation & Location
  MapPin,
  Map,
  Navigation,
  Compass,
  Car,
  Plane,
  Ship,
  
  // Weather & Nature
  Sun,
  Moon,
  Cloud as CloudIcon,
  CloudRain,
  Snowflake,
  Leaf,
  
  // Shapes & Symbols
  Circle,
  Square as SquareIcon,
  Triangle,
  Diamond,
  Hash,
  AtSign,
  Percent,
  
  // Accessibility
  Accessibility,
  Volume2,
  Type,
  MousePointer,
  Keyboard,
  
  // Risk Management Specific
  AlertOctagon,
  ShieldAlert,
  ShieldX,
  Scale,
  Gavel,
  FileCheck,
  ClipboardCheck,
  Award,
  
  // AI & Technology
  Brain,
  Cpu as Processor,
  Zap as Lightning,
  Sparkles,
  Bot,
  
  // Additional Lucide Icons
  Globe,
  Layers,
  Grid,
  List,
  Table,
  Columns,
  Rows
} from 'lucide-react';

// Icon size mapping
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const iconSizes: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48
};

// Icon color variants
export type IconColor = 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'disabled' 
  | 'inverse' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'brand'
  | 'current';

const iconColors: Record<IconColor, string> = {
  primary: designTokens.colors.text.primary,
  secondary: designTokens.colors.text.secondary,
  tertiary: designTokens.colors.text.tertiary,
  disabled: designTokens.colors.text.disabled,
  inverse: designTokens.colors.text.inverse,
  success: designTokens.colors.semantic.success[600],
  warning: designTokens.colors.semantic.warning[600],
  error: designTokens.colors.semantic.error[600],
  info: designTokens.colors.semantic.info[600],
  brand: designTokens.colors.interactive.primary,
  current: 'currentColor'
};

// Icon component props
interface IconProps {
  size?: IconSize;
  color?: IconColor;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
}

// Base icon component
const createIcon = (LucideIcon: React.ComponentType<any>) => {
  return React.forwardRef<SVGSVGElement, IconProps>(({
    size = 'md',
    color = 'current',
    className = '',
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role,
    ...props
  }, ref) => {
    const iconSize = iconSizes[size];
    const iconColor = iconColors[color];
    
    return (
      <LucideIcon
        ref={ref}
        size={iconSize}
        color={iconColor}
        className={className}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
        role={role}
        {...props}
      />
    );
  });
};

// Semantic icon categories
export const NavigationIcons = {
  Home: createIcon(Home),
  Menu: createIcon(Menu),
  Close: createIcon(X),
  ChevronLeft: createIcon(ChevronLeft),
  ChevronRight: createIcon(ChevronRight),
  ChevronUp: createIcon(ChevronUp),
  ChevronDown: createIcon(ChevronDown),
  ArrowLeft: createIcon(ArrowLeft),
  ArrowRight: createIcon(ArrowRight),
  ArrowUp: createIcon(ArrowUp),
  ArrowDown: createIcon(ArrowDown),
  MoreHorizontal: createIcon(MoreHorizontal),
  MoreVertical: createIcon(MoreVertical),
  Sidebar: createIcon(Sidebar),
  PanelLeft: createIcon(PanelLeft),
  PanelRight: createIcon(PanelRight)
};

export const ActionIcons = {
  Add: createIcon(Plus),
  Remove: createIcon(Minus),
  Edit: createIcon(Edit),
  Delete: createIcon(Trash2),
  Copy: createIcon(Copy),
  Save: createIcon(Save),
  Download: createIcon(Download),
  Upload: createIcon(Upload),
  Send: createIcon(Send),
  Share: createIcon(Share),
  ExternalLink: createIcon(ExternalLink),
  Link: createIcon(Link),
  Unlink: createIcon(Unlink),
  Refresh: createIcon(Refresh),
  Undo: createIcon(RotateCcw),
  Redo: createIcon(RotateCw),
  Maximize: createIcon(Maximize),
  Minimize: createIcon(Minimize),
  ZoomIn: createIcon(ZoomIn),
  ZoomOut: createIcon(ZoomOut)
};

export const StatusIcons = {
  Success: createIcon(CheckCircle),
  Check: createIcon(Check),
  CheckSquare: createIcon(CheckSquare),
  Error: createIcon(XCircle),
  Close: createIcon(XIcon),
  Warning: createIcon(AlertTriangle),
  Alert: createIcon(AlertCircle),
  Info: createIcon(Info),
  Help: createIcon(HelpCircle),
  Star: createIcon(Star),
  Heart: createIcon(Heart),
  ThumbsUp: createIcon(ThumbsUp),
  ThumbsDown: createIcon(ThumbsDown),
  Flag: createIcon(Flag),
  Bookmark: createIcon(Bookmark)
};

export const DataIcons = {
  BarChart: createIcon(BarChart),
  BarChart3: createIcon(BarChart3),
  LineChart: createIcon(LineChart),
  PieChart: createIcon(PieChart),
  TrendingUp: createIcon(TrendingUp),
  TrendingDown: createIcon(TrendingDown),
  Activity: createIcon(Activity),
  Gauge: createIcon(Gauge),
  Target: createIcon(Target),
  Zap: createIcon(Zap)
};

export const CommunicationIcons = {
  Mail: createIcon(Mail),
  Message: createIcon(MessageSquare),
  MessageCircle: createIcon(MessageCircle),
  Phone: createIcon(Phone),
  Video: createIcon(Video),
  Mic: createIcon(Mic),
  MicOff: createIcon(MicOff),
  Bell: createIcon(Bell),
  BellOff: createIcon(BellOff)
};

export const FileIcons = {
  File: createIcon(File),
  FileText: createIcon(FileText),
  FileImage: createIcon(FileImage),
  FileVideo: createIcon(FileVideo),
  FileAudio: createIcon(FileAudio),
  FilePlus: createIcon(FilePlus),
  Folder: createIcon(Folder),
  FolderOpen: createIcon(FolderOpen),
  Archive: createIcon(Archive)
};

export const UserIcons = {
  User: createIcon(User),
  Users: createIcon(Users),
  UserPlus: createIcon(UserPlus),
  UserMinus: createIcon(UserMinus),
  UserCheck: createIcon(UserCheck)
};

export const SecurityIcons = {
  Shield: createIcon(Shield),
  ShieldCheck: createIcon(ShieldCheck),
  ShieldAlert: createIcon(ShieldAlert),
  ShieldX: createIcon(ShieldX),
  Lock: createIcon(Lock),
  Unlock: createIcon(Unlock),
  Key: createIcon(Key),
  Eye: createIcon(Eye),
  EyeOff: createIcon(EyeOff)
};

export const TechnologyIcons = {
  Database: createIcon(Database),
  Server: createIcon(Server),
  Cloud: createIcon(Cloud),
  CloudUpload: createIcon(CloudUpload),
  CloudDownload: createIcon(CloudDownload),
  Wifi: createIcon(Wifi),
  WifiOff: createIcon(WifiOff),
  Bluetooth: createIcon(Bluetooth),
  Cpu: createIcon(Cpu),
  HardDrive: createIcon(HardDrive),
  Globe: createIcon(Globe)
};

export const BusinessIcons = {
  Building: createIcon(Building),
  Building2: createIcon(Building2),
  Briefcase: createIcon(Briefcase),
  CreditCard: createIcon(CreditCard),
  DollarSign: createIcon(DollarSign),
  Growth: createIcon(Growth),
  Calculator: createIcon(Calculator),
  Receipt: createIcon(Receipt)
};

export const TimeIcons = {
  Calendar: createIcon(Calendar),
  CalendarDays: createIcon(CalendarDays),
  Clock: createIcon(Clock),
  Timer: createIcon(Timer),
  Stopwatch: createIcon(Stopwatch),
  History: createIcon(History)
};

export const MediaIcons = {
  Image: createIcon(Image),
  Play: createIcon(Play),
  Pause: createIcon(Pause),
  Stop: createIcon(Square),
  SkipBack: createIcon(SkipBack),
  SkipForward: createIcon(SkipForward),
  Volume: createIcon(Volume),
  VolumeX: createIcon(VolumeX),
  Camera: createIcon(Camera)
};

export const ToolIcons = {
  Settings: createIcon(Settings),
  Sliders: createIcon(Sliders),
  Filter: createIcon(Filter),
  Search: createIcon(Search),
  ScanLine: createIcon(ScanLine),
  Wrench: createIcon(Wrench),
  Hammer: createIcon(Hammer),
  Scissors: createIcon(Scissors)
};

export const LocationIcons = {
  MapPin: createIcon(MapPin),
  Map: createIcon(Map),
  Navigation: createIcon(Navigation),
  Compass: createIcon(Compass),
  Car: createIcon(Car),
  Plane: createIcon(Plane),
  Ship: createIcon(Ship)
};

export const WeatherIcons = {
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),
  Cloud: createIcon(CloudIcon),
  CloudRain: createIcon(CloudRain),
  Snowflake: createIcon(Snowflake),
  Leaf: createIcon(Leaf)
};

export const ShapeIcons = {
  Circle: createIcon(Circle),
  Square: createIcon(SquareIcon),
  Triangle: createIcon(Triangle),
  Diamond: createIcon(Diamond),
  Hash: createIcon(Hash),
  AtSign: createIcon(AtSign),
  Percent: createIcon(Percent)
};

export const AccessibilityIcons = {
  Accessibility: createIcon(Accessibility),
  Volume2: createIcon(Volume2),
  Type: createIcon(Type),
  MousePointer: createIcon(MousePointer),
  Keyboard: createIcon(Keyboard)
};

export const RiskManagementIcons = {
  AlertOctagon: createIcon(AlertOctagon),
  ShieldAlert: createIcon(ShieldAlert),
  ShieldX: createIcon(ShieldX),
  Scale: createIcon(Scale),
  Gavel: createIcon(Gavel),
  FileCheck: createIcon(FileCheck),
  ClipboardCheck: createIcon(ClipboardCheck),
  Award: createIcon(Award),
  Target: createIcon(Target),
  Activity: createIcon(Activity)
};

export const AIIcons = {
  Brain: createIcon(Brain),
  Processor: createIcon(Processor),
  Lightning: createIcon(Lightning),
  Sparkles: createIcon(Sparkles),
  Bot: createIcon(Bot)
};

export const LayoutIcons = {
  Layers: createIcon(Layers),
  Grid: createIcon(Grid),
  List: createIcon(List),
  Table: createIcon(Table),
  Columns: createIcon(Columns),
  Rows: createIcon(Rows)
};

// Combined icon library
export const IconLibrary = {
  Navigation: NavigationIcons,
  Action: ActionIcons,
  Status: StatusIcons,
  Data: DataIcons,
  Communication: CommunicationIcons,
  File: FileIcons,
  User: UserIcons,
  Security: SecurityIcons,
  Technology: TechnologyIcons,
  Business: BusinessIcons,
  Time: TimeIcons,
  Media: MediaIcons,
  Tool: ToolIcons,
  Location: LocationIcons,
  Weather: WeatherIcons,
  Shape: ShapeIcons,
  Accessibility: AccessibilityIcons,
  RiskManagement: RiskManagementIcons,
  AI: AIIcons,
  Layout: LayoutIcons
};

// Icon showcase component for documentation
export const IconShowcase: React.FC<{
  category?: keyof typeof IconLibrary;
  size?: IconSize;
  color?: IconColor;
}> = ({ 
  category, 
  size = 'md', 
  color = 'primary' 
}) => {
  const categoriesToShow = category ? [category] : Object.keys(IconLibrary) as Array<keyof typeof IconLibrary>;
  
  return (
    <div className="space-y-8">
      {categoriesToShow.map((cat) => (
        <div key={cat} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {cat} Icons
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
            {Object.entries(IconLibrary[cat]).map(([name, IconComponent]) => (
              <div
                key={name}
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <IconComponent 
                  size={size} 
                  color={color}
                  aria-label={`${name} icon`}
                />
                <span className="text-xs text-gray-600 mt-2 text-center">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Icon search component
export const IconSearch: React.FC<{
  onIconSelect?: (iconName: string, category: string) => void;
}> = ({ onIconSelect }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const allIcons = React.useMemo(() => {
    const icons: Array<{ name: string; category: string; component: React.ComponentType<IconProps> }> = [];
    
    Object.entries(IconLibrary).forEach(([category, categoryIcons]) => {
      Object.entries(categoryIcons).forEach(([name, component]) => {
        icons.push({ name, category, component });
      });
    });
    
    return icons;
  }, []);
  
  const filteredIcons = React.useMemo(() => {
    if (!searchTerm) return allIcons;
    
    return allIcons.filter(icon =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allIcons, searchTerm]);
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <ToolIcons.Search 
          size="sm" 
          color="tertiary"
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-96 overflow-y-auto">
        {filteredIcons.map(({ name, category, component: IconComponent }) => (
          <button
            key={`${category}-${name}`}
            onClick={() => onIconSelect?.(name, category)}
            className="flex flex-col items-center p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            title={`${name} (${category})`}
          >
            <IconComponent size="md" color="primary" />
            <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
              {name}
            </span>
          </button>
        ))}
      </div>
      
      {filteredIcons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No icons found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

// Export individual icon categories for convenience
export {
  NavigationIcons,
  ActionIcons,
  StatusIcons,
  DataIcons,
  CommunicationIcons,
  FileIcons,
  UserIcons,
  SecurityIcons,
  TechnologyIcons,
  BusinessIcons,
  TimeIcons,
  MediaIcons,
  ToolIcons,
  LocationIcons,
  WeatherIcons,
  ShapeIcons,
  AccessibilityIcons,
  RiskManagementIcons,
  AIIcons,
  LayoutIcons
};

export default IconLibrary; 