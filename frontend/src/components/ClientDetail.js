import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Eye,
  Percent,
  FileText,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [clientInfo, setClientInfo] = useState(null);
  const [clientTrips, setClientTrips] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [userRes, tripsRes, financialRes] = await Promise.all([
        axios.get(`${API}/users/${clientId}`),
        axios.get(`${API}/trips?client_id=${clientId}`),
        axios.get(`${API}/clients/${clientId}/financial-summary`)
      ]);
      
      setClientInfo(userRes.data);
      setClientTrips(tripsRes.data);
      setFinancialSummary(financialRes.data);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Errore nel caricamento dei dati del cliente');
      navigate('/clients');
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
        return '🚢';
      case 'resort':
        return '🏖️';
      case 'tour':
        return '🗺️';
      case 'custom':
        return '✨';
      default:
        return '📍';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl text-teal-700">
                {clientInfo?.first_name?.charAt(0)}{clientInfo?.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {clientInfo?.first_name} {clientInfo?.last_name}
              </h1>
              <p className="text-slate-600 mt-1">Dettagli Cliente e Situazione Finanziaria</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} className="text-teal-600" />
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{clientInfo?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Registrato</p>
                  <p className="font-medium">
                    {format(new Date(clientInfo?.created_at || new Date()), "PPP", { locale: it })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-teal-100 text-teal-800">
                  Cliente
                </Badge>
                {clientInfo?.blocked && (
                  <Badge className="bg-red-100 text-red-800">
                    Bloccato
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        {financialSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Riepilogo Finanziario
              </CardTitle>
              <CardDescription>
                Situazione economica e guadagni generati dal cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                      <p className="text-sm font-medium text-green-800">Fatturato Generato</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.total_revenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Commissioni Generate</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(financialSummary.total_gross_commission)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
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
              </div>

              {/* Commission Breakdown */}
              <div className="p-4 border rounded-lg bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-3">Breakdown Commissioni</h4>
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
                    <span className="text-slate-600">Commissioni Agente Nette:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(financialSummary.total_agent_commission)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmed Bookings Details */}
        {financialSummary?.confirmed_booking_details && financialSummary.confirmed_booking_details.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} className="text-green-600" />
                Pratiche Confermate ({financialSummary.confirmed_bookings})
              </CardTitle>
              <CardDescription>
                Dettaglio delle prenotazioni confermate e fatturato generato
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Cards for Confirmed Bookings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-l-green-500">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-green-800">Fatturato Lordo Confermato</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.confirmed_revenue)}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-l-blue-500">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-blue-800">Commissioni Fornitore</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.confirmed_supplier_commission)}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-l-purple-500">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-purple-800">Commissioni Agente</h4>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(financialSummary.confirmed_agent_commission)}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Booking List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 border-b pb-2">Dettaglio Pratiche</h4>
                {financialSummary.confirmed_booking_details.map((booking, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-slate-800">{booking.trip_title}</h5>
                        <p className="text-sm text-slate-600">📍 {booking.trip_destination}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Pratica: {booking.practice_number}</p>
                        <p className="text-sm text-slate-500">Prenotazione: {booking.booking_number}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fatturato Lordo:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(booking.gross_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fatturato Netto:</span>
                        <span className="font-semibold">{formatCurrency(booking.net_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Comm. Fornitore:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(booking.supplier_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Comm. Agente:</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(booking.agent_commission)}</span>
                      </div>
                    </div>
                    
                    {booking.confirmation_date && (
                      <div className="mt-2 pt-2 border-t text-xs text-slate-500">
                        Confermato: {format(new Date(booking.confirmation_date), "PPP", { locale: it })}
                        {booking.departure_date && (
                          <span className="ml-4">Partenza: {format(new Date(booking.departure_date), "PPP", { locale: it })}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Viaggi del Cliente ({clientTrips.length})
            </CardTitle>
            <CardDescription>
              Storico completo dei viaggi prenotati
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientTrips.length > 0 ? (
              <div className="space-y-4">
                {clientTrips.map((trip) => (
                  <Card key={trip.id} className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {getTripTypeIcon(trip.trip_type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{trip.title}</h4>
                            <p className="text-slate-600">📍 {trip.destination}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-slate-500">
                                {format(new Date(trip.start_date), "dd MMM yyyy", { locale: it })} - 
                                {format(new Date(trip.end_date), "dd MMM yyyy", { locale: it })}
                              </span>
                              <Badge className={getStatusBadgeClass(trip.status)}>
                                {getStatusDisplayName(trip.status)}
                              </Badge>
                              <Badge className="bg-slate-100 text-slate-700 capitalize">
                                {trip.trip_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          <Eye size={14} className="mr-2" />
                          Dettagli
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">Nessun viaggio ancora prenotato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default ClientDetail;