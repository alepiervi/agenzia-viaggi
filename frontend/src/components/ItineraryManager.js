import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { 
  CalendarIcon,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Clock,
  MapPin,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ItineraryManager = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [editingData, setEditingData] = useState({}); // Store editing data separately
  const [newItinerary, setNewItinerary] = useState({
    day_number: 1,
    date: null,
    title: '',
    description: '',
    itinerary_type: 'cruise_port'
  });

  useEffect(() => {
    fetchTripAndItineraries();
  }, [tripId]);

  const fetchTripAndItineraries = async () => {
    try {
      const [tripRes, itinerariesRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}/full`),
        axios.get(`${API}/trips/${tripId}/itineraries`)
      ]);
      
      setTrip(tripRes.data.trip);
      setItineraries(itinerariesRes.data.sort((a, b) => a.day_number - b.day_number));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Errore nel caricamento dei dati');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateDaysFromTrip = () => {
    if (!trip) return;
    
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const days = [];
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const existingItinerary = itineraries.find(it => it.day_number === i + 1);
      
      days.push({
        day_number: i + 1,
        date: currentDate,
        existing: existingItinerary,
        title: existingItinerary?.title || '',
        description: existingItinerary?.description || '',
        itinerary_type: existingItinerary?.itinerary_type || getDefaultItineraryType()
      });
    }
    
    return days;
  };

  const getDefaultItineraryType = () => {
    switch (trip?.trip_type) {
      case 'cruise': return 'cruise_port';
      case 'resort': return 'resort_day';
      case 'tour': return 'tour_day';
      default: return 'cruise_port';
    }
  };

  const getItineraryTypeOptions = () => {
    const baseOptions = [
      { value: 'cruise_port', label: 'Porto Crociera' },
      { value: 'cruise_sea', label: 'Giorno in Mare' },
      { value: 'resort_day', label: 'Giorno Resort' },
      { value: 'tour_day', label: 'Giorno Tour' }
    ];
    
    return baseOptions;
  };

  const getItineraryTypeColor = (type) => {
    switch (type) {
      case 'cruise_port': return 'bg-blue-100 text-blue-800';
      case 'cruise_sea': return 'bg-cyan-100 text-cyan-800';
      case 'resort_day': return 'bg-green-100 text-green-800';
      case 'tour_day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startEditingDay = (day) => {
    setEditingDay(day.day_number);
    // Initialize editing data with current values or defaults
    setEditingData({
      day_number: day.day_number,
      date: day.date,
      title: day.existing?.title || '',
      description: day.existing?.description || '',
      itinerary_type: day.existing?.itinerary_type || getDefaultItineraryType()
    });
  };

  const updateEditingData = (field, value) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cancelEditing = () => {
    setEditingDay(null);
    setEditingData({});
  };

  const handleSaveItinerary = async () => {
    if (!editingData.title?.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    try {
      const itineraryData = {
        trip_id: tripId,
        day_number: editingData.day_number,
        date: editingData.date.toISOString(),
        title: editingData.title,
        description: editingData.description,
        itinerary_type: editingData.itinerary_type
      };

      const existingItinerary = itineraries.find(it => it.day_number === editingData.day_number);

      if (existingItinerary) {
        // Update existing itinerary
        await axios.put(`${API}/itineraries/${existingItinerary.id}`, itineraryData);
        toast.success('Itinerario aggiornato con successo');
      } else {
        // Create new itinerary
        await axios.post(`${API}/itineraries`, itineraryData);
        toast.success('Itinerario creato con successo');
      }

      await fetchTripAndItineraries();
      cancelEditing();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Errore nel salvataggio dell\'itinerario');
    }
  };

  const handleDeleteItinerary = async (itinerary) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo itinerario?')) {
      return;
    }

    try {
      await axios.delete(`${API}/itineraries/${itinerary.id}`);
      toast.success('Itinerario eliminato con successo');
      await fetchTripAndItineraries();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error('Errore nell\'eliminazione dell\'itinerario');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
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

  const days = generateDaysFromTrip();

  return (
    <Dashboard>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Gestione Itinerario - {trip?.title}
            </h1>
            <p className="text-slate-600 mt-1">
              Pianifica il programma giorno per giorno del viaggio
            </p>
          </div>
        </div>

        {/* Trip Info */}
        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-teal-800">{trip?.title}</h3>
                <p className="text-teal-600">📍 {trip?.destination}</p>
                <p className="text-sm text-slate-600 mt-1">{trip?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Dal {format(new Date(trip?.start_date), "dd MMM yyyy", { locale: it })}</p>
                <p className="text-sm text-slate-600">Al {format(new Date(trip?.end_date), "dd MMM yyyy", { locale: it })}</p>
                <Badge className="mt-2 capitalize">{trip?.trip_type}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days Grid */}
        <div className="space-y-4">
          {days?.map((day) => (
            <Card key={day.day_number} className="border-l-4 border-l-teal-500">
              <CardContent className="p-6">
                {editingDay === day.day_number ? (
                  /* Editing Mode */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Giorno {day.day_number} - {formatDate(day.date)}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveItinerary(day)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save size={14} className="mr-2" />
                          Salva
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDay(null)}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`title-${day.day_number}`}>Titolo *</Label>
                        <Input
                          id={`title-${day.day_number}`}
                          value={day.title}
                          onChange={(e) => {
                            const updatedDays = days.map(d => 
                              d.day_number === day.day_number 
                                ? { ...d, title: e.target.value }
                                : d
                            );
                            setItineraries(prev => [...prev]);
                            day.title = e.target.value;
                          }}
                          placeholder="es. Barcellona - Visita città"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`type-${day.day_number}`}>Tipo Giornata</Label>
                        <Select 
                          value={day.itinerary_type} 
                          onValueChange={(value) => {
                            day.itinerary_type = value;
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getItineraryTypeOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`desc-${day.day_number}`}>Programma della Giornata</Label>
                      <Textarea
                        id={`desc-${day.day_number}`}
                        value={day.description}
                        onChange={(e) => {
                          day.description = e.target.value;
                        }}
                        placeholder="Descrivi il programma dettagliato della giornata..."
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {day.day_number}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {day.existing ? day.existing.title : 'Giornata da pianificare'}
                          </h3>
                          <p className="text-sm text-slate-600">{formatDate(day.date)}</p>
                        </div>
                        {day.existing && (
                          <Badge className={getItineraryTypeColor(day.existing.itinerary_type)}>
                            {getItineraryTypeOptions().find(opt => opt.value === day.existing.itinerary_type)?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDay(day.day_number)}
                        >
                          {day.existing ? <Edit size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                          {day.existing ? 'Modifica' : 'Pianifica'}
                        </Button>
                        {day.existing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItinerary(day.existing)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {day.existing && day.existing.description && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-700 whitespace-pre-wrap">{day.existing.description}</p>
                      </div>
                    )}
                    
                    {!day.existing && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <p className="text-slate-500 text-center">
                          <Clock size={16} className="inline mr-2" />
                          Clicca su "Pianifica" per aggiungere il programma di questa giornata
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Dashboard>
  );
};

export default ItineraryManager;