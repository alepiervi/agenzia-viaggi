import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  MapPin, 
  Calendar, 
  Users,
  Plus,
  BarChart3,
  TrendingUp,
  Camera,
  StickyNote,
  DollarSign,
  Calculator,
  FileText,
  Settings,
  Bell
} from 'lucide-react';

const NavigationItems = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { path: '/dashboard', icon: BarChart3, label: 'Dashboard', active: true },
          { path: '/manage-trips', icon: MapPin, label: 'Gestione Viaggi' },
          { path: '/users', icon: Users, label: 'Gestione Utenti' },
          { path: '/notifications', icon: Bell, label: 'Notifiche' },
          { path: '/analytics', icon: TrendingUp, label: 'Analytics' },
          { path: '/financial-reports', icon: FileText, label: 'Report Finanziari' }
        ];
      
      case 'agent':
        return [
          { path: '/dashboard', icon: MapPin, label: 'I Miei Viaggi', active: true },
          { path: '/manage-trips', icon: Plus, label: 'Crea Viaggio' },
          { path: '/clients', icon: Users, label: 'I Miei Clienti' },
          { path: '/notifications', icon: Bell, label: 'Notifiche' },
          { path: '/calendar', icon: Calendar, label: 'Calendario' },
          { path: '/financial-reports', icon: DollarSign, label: 'Report Finanziari' },
          { path: '/commission-calculator', icon: Calculator, label: 'Calcolatore Commissioni' }
        ];
      
      case 'client':
        return [
          { path: '/dashboard', icon: MapPin, label: 'I Miei Viaggi', active: true },
          { path: '/photos', icon: Camera, label: 'Le Mie Foto' },
          { path: '/notes', icon: StickyNote, label: 'Le Mie Note' },
          { path: '/calendar', icon: Calendar, label: 'Calendario' }
        ];
      
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      {getNavItems().map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <item.icon size={20} />
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default NavigationItems;