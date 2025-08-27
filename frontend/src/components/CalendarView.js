import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { 
  Calendar as CalendarIcon,
  MapPin,
  Ship,
  Building,
  Route,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarView = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/trips`);
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Errore nel caricamento dei viaggi');
    } finally {
      setLoading(false);
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type) {
      case 'cruise':
        return <Ship size={16} className="text-blue-600" />;
      case 'resort':
        return <Building size={16} className="text-green-600" />;
      case 'tour':
        return <Route size={16} className="text-orange-600" />;
      case 'custom':
        return <MapPin size={16} className="text-purple-600" />;
      default:
        return <MapPin size={16} className="text-gray-600" />;
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

  // Get trips for a specific date
  const getTripsForDate = (date) => {
    return trips.filter(trip => {
      const startDate = parseISO(trip.start_date);
      const endDate = parseISO(trip.end_date);
      return date >= startDate && date <= endDate;
    });
  };

  // Get trips starting on a specific date
  const getTripsStartingOnDate = (date) => {
    return trips.filter(trip => {
      const startDate = parseISO(trip.start_date);
      return isSameDay(startDate, date);
    });
  };

  // Get trips ending on a specific date
  const getTripsEndingOnDate = (date) => {
    return trips.filter(trip => {
      const endDate = parseISO(trip.end_date);
      return isSameDay(endDate, date);
    });
  };

  // Check if date has trips
  const hasTripsOnDate = (date) => {
    return getTripsForDate(date).length > 0;
  };

  const formatDate = (dateString) => {
    return format(parseISO(dateString), "PPP", { locale: it });
  };

  const formatDateShort = (dateString) => {
    return format(parseISO(dateString), "dd/MM", { locale: it });
  };

  // Get calendar data for current month
  const getCalendarData = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: day,
      trips: getTripsForDate(day),
      hasTrips: hasTripsOnDate(day),
      isToday: isSameDay(day, new Date()),
      isSelected: isSameDay(day, selectedDate)
    }));
  };

  const selectedDateTrips = getTripsForDate(selectedDate);

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
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Calendario Viaggi</h1>
            <p className="text-slate-600 mt-1">Visualizza tutti i viaggi organizzati per data</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="font-semibold text-slate-800 min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon size={20} className="text-teal-600" />
                  Calendario
                </CardTitle>
                <CardDescription>
                  Clicca su una data per vedere i viaggi programmati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={it}
                  modifiers={{
                    hasTrips: (date) => hasTripsOnDate(date)
                  }}
                  modifiersStyles={{
                    hasTrips: {
                      backgroundColor: '#0891b2',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                  className="rounded-md border"
                />
                
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-800 mb-2">Legenda</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-teal-600 rounded"></div>
                      <span className="text-slate-600">Giorni con viaggi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 rounded"></div>
                      <span className="text-slate-600">Giorni liberi</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                </CardTitle>
                <CardDescription>
                  {selectedDateTrips.length > 0 
                    ? `${selectedDateTrips.length} viaggi in corso`
                    : 'Nessun viaggio programmato'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDateTrips.length > 0 ? (
                  selectedDateTrips.map((trip) => {
                    const startDate = parseISO(trip.start_date);
                    const endDate = parseISO(trip.end_date);
                    const isStarting = isSameDay(startDate, selectedDate);
                    const isEnding = isSameDay(endDate, selectedDate);
                    
                    return (
                      <div key={trip.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getTripTypeIcon(trip.trip_type)}
                            <h3 className="font-semibold text-slate-800">{trip.title}</h3>
                          </div>
                          <div className="flex gap-1">
                            <Badge className={`text-xs ${getTripTypeBadgeClass(trip.trip_type)}`}>
                              {trip.trip_type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusBadgeClass(trip.status)}`}>
                              {trip.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">📍 {trip.destination}</p>
                        <p className="text-xs text-slate-500 mb-3">
                          {formatDateShort(trip.start_date)} - {formatDateShort(trip.end_date)}
                        </p>
                        
                        {/* Trip status for this date */}
                        <div className="flex items-center gap-2 mb-3">
                          {isStarting && (
                            <Badge className="text-xs bg-green-100 text-green-700">
                              🛫 Partenza
                            </Badge>
                          )}
                          {isEnding && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              🛬 Rientro
                            </Badge>
                          )}
                          {!isStarting && !isEnding && (
                            <Badge className="text-xs bg-amber-100 text-amber-700">
                              ✈️ In corso
                            </Badge>
                          )}
                        </div>
                        
                        <Link to={`/trips/${trip.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye size={14} className="mr-2" />
                            Visualizza Dettagli
                          </Button>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-500">Nessun viaggio programmato per questa data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Statistiche Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Viaggi Totali</span>
                  <Badge variant="outline">{trips.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Viaggi Attivi</span>
                  <Badge variant="outline">
                    {trips.filter(trip => trip.status === 'active').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Crociere</span>
                  <Badge variant="outline">
                    {trips.filter(trip => trip.trip_type === 'cruise').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Resort</span>
                  <Badge variant="outline">
                    {trips.filter(trip => trip.trip_type === 'resort').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Tour</span>
                  <Badge variant="outline">
                    {trips.filter(trip => trip.trip_type === 'tour').length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default CalendarView;