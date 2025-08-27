import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Calendar, 
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Plane,
  Ship,
  Building,
  Route,
  Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trips`)
      ]);

      setStats(statsRes.data);
      setTrips(tripsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type) {
      case 'cruise':
        return <Ship size={16} />;
      case 'resort':
        return <Building size={16} />;
      case 'tour':
        return <Route size={16} />;
      case 'custom':
        return <MapPin size={16} />;
      default:
        return <MapPin size={16} />;
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

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo viaggio?')) {
      try {
        await axios.delete(`${API}/trips/${tripId}`);
        toast.success('Viaggio eliminato con successo');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting trip:', error);
        toast.error('Errore nell\'eliminazione del viaggio');
      }
    }
  };

  const handleEditTrip = (tripId) => {
    navigate(`/manage-trips?edit=${tripId}`);
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
          <MapPin size={20} />
          I Miei Viaggi
        </div>
        <Link to="/manage-trips" className="nav-item">
          <Plus size={20} />
          Crea Viaggio
        </Link>
        <div className="nav-item">
          <Users size={20} />
          I Miei Clienti
        </div>
        <div className="nav-item">
          <Calendar size={20} />
          Calendario
        </div>
      </nav>

      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Agente</h1>
            <p className="text-slate-600 mt-1">Gestisci i tuoi viaggi e clienti</p>
          </div>
          <div className="flex space-x-3">
            <Link to="/manage-trips">
              <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                <Plus size={16} className="mr-2" />
                Nuovo Viaggio
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">I Miei Viaggi</p>
                  <p className="stat-number text-teal-600">{stats.my_trips || 0}</p>
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
                  <p className="stat-label">Completati</p>
                  <p className="stat-number text-blue-600">{stats.completed_trips || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane size={20} className="text-teal-600" />
              Tutti i Viaggi
            </CardTitle>
            <CardDescription>
              Gestisci tutti i viaggi che hai creato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trips.length > 0 ? (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-6 border border-slate-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-teal-200">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
                        {getTripTypeIcon(trip.trip_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-800 text-lg">{trip.title}</h3>
                          <Badge className={`text-xs ${getTripTypeBadgeClass(trip.trip_type)}`}>
                            {trip.trip_type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadgeClass(trip.status)}`}>
                            {trip.status}
                          </Badge>
                        </div>
                        <p className="text-slate-600 mb-2">{trip.destination}</p>
                        <p className="text-sm text-slate-500">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/trips/${trip.id}`}>
                        <Button size="sm" variant="ghost" className="hover:bg-teal-50 hover:text-teal-700">
                          <Eye size={16} />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => handleEditTrip(trip.id)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteTrip(trip.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Plane size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500 mb-4">Non hai ancora creato nessun viaggio</p>
                <Link to="/manage-trips">
                  <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                    <Plus size={16} className="mr-2" />
                    Crea il tuo primo viaggio
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default AgentDashboard;