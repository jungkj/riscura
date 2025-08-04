'use client';

import React from 'react';
// import {
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
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  User,
  Users,
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  Star,
  Heart,
  Bookmark,
  Share,
  ExternalLink,
  Link,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  FileText,
  File,
  Folder,
  FolderOpen,
  Image,
  Video,
  Music,
  Archive,
  Database,
  Server,
  Cloud,
  Wifi,
  Battery,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package,
  Truck,
  Globe,
  Building,
  Car,
  Plane,
  Ship,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Thermometer,
  Droplets,
  Wind,
  Leaf,
  Flower,
  TreePine,
  Mountain,
  Camera,
  Mic,
  MicOff,
  Speaker,
  Volume,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Mouse,
  Keyboard,
  Printer,
  Scan,
  Wifi as WifiIcon,
  Bluetooth,
  Usb,
  HardDrive,
  Cpu,
  MemoryStick,
  CircuitBoard,
  Router,
  Gamepad2,
  Headphones,
  Webcam,
} from 'lucide-react'

// Type definitions
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

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

interface IconProps {
  size?: IconSize;
  color?: IconColor;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
}

// Create icon wrapper
const createIcon = (LucideIcon: React.ComponentType<any>) => {
  const IconComponent = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 'md', color = 'current', className = '', ...props }, ref) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
        '2xl': 'w-10 h-10',
      }

      const colorClasses = {
        primary: 'text-blue-600',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-400',
        disabled: 'text-gray-300',
        inverse: 'text-white',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        info: 'text-blue-500',
        brand: 'text-indigo-600',
        current: 'text-current',
      }

      const classes = `${sizeClasses[size]} ${colorClasses[color]} ${className}`.trim();

      return <LucideIcon ref={ref} className={classes} {...props} />;
    }
  );

  IconComponent.displayName = `Icon(${LucideIcon.displayName || LucideIcon.name || 'Unknown'})`;
  return IconComponent;
}

// Icon categories
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
}

export const ActionIcons = {
  Plus: createIcon(Plus),
  Minus: createIcon(Minus),
  Edit: createIcon(Edit),
  Trash: createIcon(Trash2),
  Save: createIcon(Save),
  Copy: createIcon(Copy),
  Download: createIcon(Download),
  Upload: createIcon(Upload),
  Search: createIcon(Search),
  Filter: createIcon(Filter),
  Settings: createIcon(Settings),
}

export const StatusIcons = {
  CheckCircle: createIcon(CheckCircle),
  XCircle: createIcon(XCircle),
  X: createIcon(X),
  AlertTriangle: createIcon(AlertTriangle),
  AlertCircle: createIcon(AlertCircle),
  Info: createIcon(Info),
  HelpCircle: createIcon(HelpCircle),
  Eye: createIcon(Eye),
  EyeOff: createIcon(EyeOff),
}

export const UserIcons = {
  User: createIcon(User),
  Users: createIcon(Users),
  Lock: createIcon(Lock),
  Unlock: createIcon(Unlock),
  Shield: createIcon(Shield),
}

export const CommunicationIcons = {
  Bell: createIcon(Bell),
  Mail: createIcon(Mail),
  Phone: createIcon(Phone),
  MessageSquare: createIcon(MessageSquare),
  Share: createIcon(Share),
  ExternalLink: createIcon(ExternalLink),
  Link: createIcon(Link),
  Microphone: createIcon(Mic),
  MicrophoneOff: createIcon(MicOff),
  Volume: createIcon(Volume2),
  Speaker: createIcon(Speaker),
}

export const FileIcons = {
  FileText: createIcon(FileText),
  File: createIcon(File),
  Folder: createIcon(Folder),
  FolderOpen: createIcon(FolderOpen),
  Image: createIcon(Image),
  Archive: createIcon(Archive),
}

export const DataIcons = {
  Database: createIcon(Database),
  Server: createIcon(Server),
  Cloud: createIcon(Cloud),
  Activity: createIcon(Activity),
  TrendingUp: createIcon(TrendingUp),
  TrendingDown: createIcon(TrendingDown),
  BarChart3: createIcon(BarChart3),
  PieChart: createIcon(PieChart),
  LineChart: createIcon(LineChart),
}

export const TimeIcons = {
  Calendar: createIcon(Calendar),
  Clock: createIcon(Clock),
}

export const BusinessIcons = {
  Building: createIcon(Building),
  DollarSign: createIcon(DollarSign),
  CreditCard: createIcon(CreditCard),
  ShoppingCart: createIcon(ShoppingCart),
  Package: createIcon(Package),
  Target: createIcon(Target),
  Award: createIcon(Award),
  Flag: createIcon(Flag),
}

export const TechnologyIcons = {
  Wifi: createIcon(WifiIcon),
  Bluetooth: createIcon(Bluetooth),
  HardDrive: createIcon(HardDrive),
  Cpu: createIcon(Cpu),
  Monitor: createIcon(Monitor),
  Smartphone: createIcon(Smartphone),
  Laptop: createIcon(Laptop),
}

export const RiskManagementIcons = {
  Risk: createIcon(AlertTriangle),
  Control: createIcon(Shield),
  Threat: createIcon(AlertCircle),
  Vulnerability: createIcon(Unlock),
  Impact: createIcon(TrendingUp),
  Likelihood: createIcon(Target),
  Assessment: createIcon(CheckCircle),
  Mitigation: createIcon(Shield),
  Compliance: createIcon(Award),
  Audit: createIcon(Search),
}

// Combined icon library
export const IconLibrary = {
  Navigation: NavigationIcons,
  Action: ActionIcons,
  Status: StatusIcons,
  User: UserIcons,
  Communication: CommunicationIcons,
  File: FileIcons,
  Data: DataIcons,
  Time: TimeIcons,
  Business: BusinessIcons,
  Technology: TechnologyIcons,
  RiskManagement: RiskManagementIcons,
}

export default IconLibrary;
