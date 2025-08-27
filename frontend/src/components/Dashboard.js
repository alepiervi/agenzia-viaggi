import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import NavigationItems from './NavigationItems';
import { 
  LogOut, 
  User, 
  Settings, 
  Bell,
  Menu,
  X
} from 'lucide-react';

const Dashboard = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'agent':
        return 'role-agent';
      case 'client':
        return 'role-client';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'agent':
        return 'Agente';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-200 ease-in-out
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <div>
                <h1 className="font-semibold text-slate-800">Travel Agency</h1>
                <p className="text-xs text-slate-500">Gestione Viaggi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-teal-200">
                <AvatarFallback className="bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 font-semibold">
                  {getUserInitials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm text-slate-500 truncate">
                  {user?.email}
                </div>
                <Badge className={`mt-1 text-xs ${getRoleBadgeClass(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <NavigationItems />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <Settings size={16} className="mr-3" />
                Impostazioni
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <Bell size={16} className="mr-3" />
                Notifiche
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut size={16} className="mr-3" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={16} />
          </Button>
          <h1 className="font-semibold text-slate-800">Dashboard</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="px-4 pb-4 lg:px-8 lg:pb-8">
          <div className="pt-2 lg:pt-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;