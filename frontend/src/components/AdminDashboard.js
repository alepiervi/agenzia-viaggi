import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Camera,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  UserCheck,
  Plane
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tripsRes, usersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trips/with-details`),
        axios.get(`${API}/users`)
      ]);

      setStats(statsRes.data);
      setTrips(tripsRes.data.slice(0, 5)); // Show latest 5 trips with details
      setUsers(usersRes.data.slice(0, 5)); // Show latest 5 users
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
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

  const getTripTypeBadgeClass = (type) => {
    switch (type) {
      case 'cruise':
        return 'trip-type-cruise';
      case 'resort':
        return 'trip-type-resort';
      case 'tour':
        return 'trip-type-tour';
      case 'custom':
        return 'trip-type-custom';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'status-draft';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Dashboard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <nav className="space-y-2">
        <div className="nav-item active">
          <BarChart3 size={20} />
          Dashboard
        </div>
        <Link to="/manage-trips" className="nav-item">
          <MapPin size={20} />
          Gestione Viaggi
        </Link>
        <div className="nav-item">
          <Users size={20} />
          Gestione Utenti
        </div>
        <div className="nav-item">
          <TrendingUp size={20} />
          Analytics
        </div>
      </nav>
      
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Amministratore</h1>
            <p className="text-slate-600 mt-1">Panoramica completa del sistema</p>
          </div>
          <div className="flex space-x-3">
            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
              <Plus size={16} className="mr-2" />
              Nuovo Viaggio
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Viaggi Totali</p>
                  <p className="stat-number text-teal-600">{stats.total_trips || 0}</p>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Utenti Registrati</p>
                  <p className="stat-number text-blue-600">{stats.total_users || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Viaggi Attivi</p>
                  <p className="stat-number text-emerald-600">{stats.active_trips || 0}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Foto Caricate</p>
                  <p className="stat-number text-purple-600">{stats.total_photos || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Camera className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips and Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane size={20} className="text-teal-600" />
                Viaggi Recenti
              </CardTitle>
              <CardDescription>
                Ultimi viaggi creati nel sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trips.length > 0 ? (
                trips.map((tripDetail) => {
                  const trip = tripDetail.trip;
                  const agent = tripDetail.agent;
                  
                  return (
                    <div key={trip.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{trip.title}</h4>
                          <Badge className={`text-xs ${getTripTypeBadgeClass(trip.trip_type)}`}>
                            {trip.trip_type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadgeClass(trip.status)}`}>
                            {trip.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{trip.destination}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          </span>
                          {agent && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              👨‍💼 {agent.first_name} {agent.last_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button size="sm" variant="ghost">
                          <Eye size={14} />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-center py-8">
                  Nessun viaggio trovato
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck size={20} className="text-blue-600" />
                Utenti Recenti
              </CardTitle>
              <CardDescription>
                Ultimi utenti registrati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.length > 0 ? (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-semibold">
                          {getUserInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {user.first_name} {user.last_name}
                        </h4>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </Badge>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">
                  Nessun utente trovato
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Dashboard>
  );
};

export default AdminDashboard;