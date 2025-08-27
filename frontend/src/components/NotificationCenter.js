import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  RefreshCw,
  ArrowRight,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/notifications/payment-deadlines`);
      setNotifications(response.data.notifications);
      setStats({
        total: response.data.total_count,
        high: response.data.high_priority_count,
        medium: response.data.medium_priority_count,
        low: response.data.low_priority_count
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Errore nel caricamento delle notifiche');
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium':
        return <Clock size={16} className="text-orange-600" />;
      case 'low':
        return <Bell size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment_deadline':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'balance_due':
        return <DollarSign size={16} className="text-green-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const formatDaysUntilDue = (days) => {
    if (days < 0) {
      return `Scaduto da ${Math.abs(days)} giorni`;
    } else if (days === 0) {
      return 'Scade oggi';
    } else if (days === 1) {
      return 'Scade domani';
    } else {
      return `Scade tra ${days} giorni`;
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
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Centro Notifiche</h1>
            <p className="text-slate-600 mt-1">
              Scadenze pagamenti e promemoria per i tuoi clienti
            </p>
          </div>
          <Button 
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Aggiorna
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Totale Notifiche</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
                </div>
                <Bell className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Alta Priorità</p>
                  <p className="text-2xl font-bold text-red-600">{stats.high || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Media Priorità</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.medium || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Bassa Priorità</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.low || 0}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-600" />
              Scadenze Prossime (30 giorni)
            </CardTitle>
            <CardDescription>
              Pagamenti e saldi in scadenza per i tuoi clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className={`border-l-4 ${
                    notification.priority === 'high' ? 'border-l-red-500' :
                    notification.priority === 'medium' ? 'border-l-orange-500' : 'border-l-blue-500'
                  } hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-800">
                                {notification.title}
                              </h4>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {getPriorityIcon(notification.priority)}
                                <span className="ml-1 capitalize">{notification.priority}</span>
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <DollarSign size={14} />
                                {formatCurrency(notification.amount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {format(new Date(notification.payment_date), "PPP", { locale: it })}
                              </span>
                              <span className={`font-medium ${
                                notification.days_until_due <= 7 ? 'text-red-600' :
                                notification.days_until_due <= 14 ? 'text-orange-600' : 'text-blue-600'
                              }`}>
                                {formatDaysUntilDue(notification.days_until_due)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/trips/${notification.trip_id}`)}
                          >
                            <Eye size={14} className="mr-2" />
                            Viaggio
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/trip-admin/${notification.trip_id}`)}
                          >
                            <ArrowRight size={14} className="mr-2" />
                            Gestisci
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Nessuna notifica
                </h3>
                <p className="text-slate-500">
                  Non ci sono scadenze di pagamento nei prossimi 30 giorni
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default NotificationCenter;