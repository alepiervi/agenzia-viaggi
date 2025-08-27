import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Camera, 
  Calendar,
  Eye,
  Upload,
  Plane,
  Ship,
  Building,
  Route,
  Clock,
  StickyNote,
  DollarSign,
  TrendingUp,
  Percent,
  CreditCard
} from 'lucide-react';

// Smart backend URL detection
const getBackendUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  // If environment URL contains preview domain, use localhost instead
  if (envUrl && envUrl.includes('preview.emergentagent.com')) {
    return 'http://localhost:8001';
  }
  return envUrl || 'http://localhost:8001';
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [trips, setTrips] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const requests = [
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trips`)
      ];
      
      // Only fetch financial summary if user is a client
      if (user?.role === 'client') {
        requests.push(axios.get(`${API}/clients/${user.id}/financial-summary`));
      }
      
      const responses = await Promise.all(requests);
      
      setStats(responses[0].data);
      setTrips(responses[1].data);
      
      if (responses[2]) {
        setFinancialSummary(responses[2].data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const getTripTypeIcon = (type) => {
    switch (type) {
      case 'cruise':
        return <Ship size={20} className="text-blue-600" />;
      case 'resort':
        return <Building size={20} className="text-green-600" />;
      case 'tour':
        return <Route size={20} className="text-orange-600" />;
      case 'custom':
        return <MapPin size={20} className="text-purple-600" />;
      default:
        return <MapPin size={20} className="text-gray-600" />;
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

  const isUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  const getTripTypeDisplayName = (type) => {
    switch (type) {
      case 'cruise':
        return 'Crociera';
      case 'resort':
        return 'Resort';
      case 'tour':
        return 'Tour';
      case 'custom':
        return 'Personalizzato';
      default:
        return type;
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'draft':
        return 'Bozza';
      case 'active':
        return 'Attivo';
      case 'completed':
        return 'Completato';
      case 'cancelled':
        return 'Annullato';
      default:
        return status;
    }
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
        <div className="nav-item">
          <Camera size={20} />
          Le Mie Foto
        </div>
        <div className="nav-item">
          <StickyNote size={20} />
          Le Mie Note
        </div>
        <div className="nav-item">
          <Calendar size={20} />
          Calendario
        </div>
      </nav>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">I Miei Viaggi</h1>
            <p className="text-slate-600 mt-1">Esplora e gestisci i tuoi itinerari di viaggio</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Viaggi Totali</p>
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
                  <p className="stat-label">Prossimi Viaggi</p>
                  <p className="stat-number text-orange-600">{stats.upcoming_trips || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Foto Caricate</p>
                  <p className="stat-number text-purple-600">{stats.my_photos || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Camera className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary - Only for clients */}
        {user?.role === 'client' && financialSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Riepilogo Finanziario
              </CardTitle>
              <CardDescription>
                Panoramica dei tuoi investimenti e costi di viaggio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Prenotazioni Totali</p>
                      <p className="text-2xl font-bold text-blue-600">{financialSummary.total_bookings}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Fatturato Totale</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.total_revenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Sconti Applicati</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(financialSummary.total_discounts)}</p>
                    </div>
                    <Percent className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Commissioni Totali</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(financialSummary.total_gross_commission)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
              
              {/* Additional financial details */}
              <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-3">Dettaglio Commissioni</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Commissioni Lorde:</span>
                    <span className="font-semibold">{formatCurrency(financialSummary.total_gross_commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Commissioni Fornitore:</span>
                    <span className="font-semibold">{formatCurrency(financialSummary.total_supplier_commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Commissioni Agente:</span>
                    <span className="font-semibold">{formatCurrency(financialSummary.total_agent_commission)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane size={20} className="text-teal-600" />
              I Tuoi Viaggi
            </CardTitle>
            <CardDescription>
              Visualizza e gestisci tutti i tuoi itinerari di viaggio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trips.length > 0 ? (
              <div className="space-y-6">
                {trips.map((trip) => (
                  <Card key={trip.id} className="border-l-4 border-l-teal-500 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                            {getTripTypeIcon(trip.trip_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-xl text-slate-800">{trip.title}</h3>
                              {isUpcoming(trip.start_date) && (
                                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                                  Prossimo
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="text-slate-600 font-medium">📍 {trip.destination}</p>
                              <p className="text-slate-500">{trip.description}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>🗓️ {formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge className={`text-xs ${getTripTypeBadgeClass(trip.trip_type)}`}>
                                  {getTripTypeDisplayName(trip.trip_type)}
                                </Badge>
                                <Badge className={`text-xs ${getStatusBadgeClass(trip.status)}`}>
                                  {getStatusDisplayName(trip.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link to={`/trips/${trip.id}`}>
                            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
                              <Eye size={16} className="mr-2" />
                              Visualizza
                            </Button>
                          </Link>
                          <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                            <Upload size={16} className="mr-2" />
                            Carica Foto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Plane size={32} className="text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Nessun viaggio ancora</h3>
                <p className="text-slate-500 mb-6">
                  Non hai ancora nessun viaggio pianificato. <br />
                  Contatta il tuo agente di viaggio per iniziare!
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg text-teal-700">
                  <span className="text-sm font-medium">Presto disponibili nuovi itinerari!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default ClientDashboard;