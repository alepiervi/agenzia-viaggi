import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Ship,
  Building,
  Route,
  MapPin,
  Plus,
  Save,
  ArrowLeft,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripManager = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get('edit');
  const isEditMode = Boolean(editTripId);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState('');
  const [existingTrip, setExistingTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null); // For agent/client info
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    start_date: null,
    end_date: null,
    client_id: '',
    trip_type: ''
  });

  // Cruise specific data
  const [cruiseData, setCruiseData] = useState({
    ship_name: '',
    cabin_number: '',
    departure_time: null,
    return_time: null,
    ship_facilities: []
  });

  useEffect(() => {
    fetchUsers();
    if (isEditMode) {
      fetchTripData();
    }
  }, [isEditMode, editTripId]);

  const fetchUsers = async () => {
    try {
      // Use clients endpoint for agents, users for admins
      const endpoint = currentUser?.role === 'admin' ? `${API}/users` : `${API}/clients`;
      const response = await axios.get(endpoint);
      
      // Filter only clients if using admin endpoint
      const clients = currentUser?.role === 'admin' 
        ? response.data.filter(user => user.role === 'client')
        : response.data; // clients endpoint already returns only clients
        
      setUsers(clients);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    }
  };

  const fetchTripData = async () => {
    try {
      const response = await axios.get(`${API}/trips/${editTripId}`);
      const trip = response.data;
      setExistingTrip(trip);
      setSelectedTripType(trip.trip_type);
      
      // Populate form with existing data
      setFormData({
        title: trip.title,
        destination: trip.destination,
        description: trip.description,
        start_date: new Date(trip.start_date),
        end_date: new Date(trip.end_date),
        client_id: trip.client_id,
        trip_type: trip.trip_type
      });

      // If it's a cruise, fetch cruise info
      if (trip.trip_type === 'cruise') {
        try {
          const cruiseRes = await axios.get(`${API}/trips/${editTripId}/cruise-info`);
          if (cruiseRes.data) {
            setCruiseData({
              ship_name: cruiseRes.data.ship_name,
              cabin_number: cruiseRes.data.cabin_number,
              departure_time: cruiseRes.data.departure_time ? new Date(cruiseRes.data.departure_time) : null,
              return_time: cruiseRes.data.return_time ? new Date(cruiseRes.data.return_time) : null,
              ship_facilities: cruiseRes.data.ship_facilities || []
            });
          }
        } catch (error) {
          console.log('No cruise info found for this trip');
        }
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast.error('Errore nel caricamento del viaggio');
      navigate('/dashboard');
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type) {
      case 'cruise':
        return <Ship size={24} className="text-blue-600" />;
      case 'resort':
        return <Building size={24} className="text-green-600" />;
      case 'tour':
        return <Route size={24} className="text-orange-600" />;
      case 'custom':
        return <MapPin size={24} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getTripTypeDescription = (type) => {
    switch (type) {
      case 'cruise':
        return 'Crociera con programmazione porti e attività nave';
      case 'resort':
        return 'Soggiorno in resort con attività e servizi inclusi';
      case 'tour':
        return 'Tour multi-destinazione con spostamenti programmati';
      case 'custom':
        return 'Viaggio personalizzato con itinerario flessibile';
      default:
        return '';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCruiseDataChange = (field, value) => {
    setCruiseData(prev => ({ ...prev, [field]: value }));
  };

  const handleTripTypeSelect = (type) => {
    setSelectedTripType(type);
    setFormData(prev => ({ ...prev, trip_type: type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.destination || !formData.start_date || !formData.end_date || !formData.client_id || !formData.trip_type) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
    
    try {
      let tripResponse;
      const tripData = {
        ...formData,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString()
      };

      if (isEditMode) {
        // Update existing trip
        tripResponse = await axios.put(`${API}/trips/${editTripId}`, tripData);
      } else {
        // Create new trip
        tripResponse = await axios.post(`${API}/trips`, tripData);
      }

      const tripId = isEditMode ? editTripId : tripResponse.data.id;

      // If it's a cruise, create/update cruise info
      if (formData.trip_type === 'cruise' && cruiseData.ship_name) {
        const cruisePayload = {
          ...cruiseData,
          trip_id: tripId,
          departure_time: cruiseData.departure_time?.toISOString(),
          return_time: cruiseData.return_time?.toISOString()
        };

        if (isEditMode && existingTrip?.trip_type === 'cruise') {
          // Update existing cruise info
          await axios.put(`${API}/cruise-info/${existingTrip.id}`, cruisePayload);
        } else {
          // Create new cruise info
          await axios.post(`${API}/trips/${tripId}/cruise-info`, cruisePayload);
        }
      }

      toast.success(isEditMode ? 'Viaggio aggiornato con successo!' : 'Viaggio creato con successo!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error(isEditMode ? 'Errore nell\'aggiornamento del viaggio' : 'Errore nella creazione del viaggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dashboard>
      <nav className="space-y-2">
        <div className="nav-item" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </div>
        <div className="nav-item active">
          <Plus size={20} />
          {isEditMode ? 'Modifica Viaggio' : 'Crea Nuovo Viaggio'}
        </div>
      </nav>

      <div className="space-y-8 animate-fade-in">
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
              {isEditMode ? 'Modifica Viaggio' : 'Crea Nuovo Viaggio'}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEditMode ? 'Aggiorna i dettagli del viaggio esistente' : 'Seleziona il tipo di viaggio e configura i dettagli'}
            </p>
          </div>
        </div>

        {/* Trip Type Selection */}
        {!selectedTripType && !isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Seleziona il Tipo di Viaggio</CardTitle>
              <CardDescription>
                Scegli la tipologia di viaggio per configurare le opzioni specifiche
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: 'cruise', name: 'Crociera', color: 'from-blue-500 to-cyan-500' },
                { type: 'resort', name: 'Resort', color: 'from-green-500 to-emerald-500' },
                { type: 'tour', name: 'Tour', color: 'from-orange-500 to-amber-500' },
                { type: 'custom', name: 'Personalizzato', color: 'from-purple-500 to-violet-500' }
              ].map((tripType) => (
                <Card 
                  key={tripType.type}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-teal-200"
                  onClick={() => handleTripTypeSelect(tripType.type)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`p-4 rounded-full bg-gradient-to-br ${tripType.color} w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                      {getTripTypeIcon(tripType.type)}
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">{tripType.name}</h3>
                    <p className="text-sm text-slate-600">{getTripTypeDescription(tripType.type)}</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Trip Form */}
        {(selectedTripType || isEditMode) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip Type Badge */}
            <div className="flex items-center gap-4">
              <Badge className="text-sm py-2 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                {getTripTypeIcon(selectedTripType)}
                <span className="ml-2 capitalize">{selectedTripType}</span>
              </Badge>
              {!isEditMode && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedTripType('')}
                >
                  Cambia Tipo
                </Button>
              )}
            </div>

            {/* Basic Trip Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Base del Viaggio</CardTitle>
                <CardDescription>
                  Inserisci i dettagli principali del viaggio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titolo del Viaggio *</Label>
                    <Input
                      id="title"
                      placeholder="es. Crociera nel Mediterraneo"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destinazione *</Label>
                    <Input
                      id="destination"
                      placeholder="es. Mediterraneo, Caraibi, Toscana"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrivi brevemente il viaggio..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Data di Partenza *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "PPP", { locale: it }) : "Seleziona data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => handleInputChange('start_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Data di Ritorno *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP", { locale: it }) : "Seleziona data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => handleInputChange('end_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            {user.first_name} {user.last_name} - {user.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Cruise-specific form */}
            {(selectedTripType === 'cruise' || (isEditMode && existingTrip?.trip_type === 'cruise')) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship size={20} className="text-blue-600" />
                    Dettagli Crociera
                  </CardTitle>
                  <CardDescription>
                    Configura le informazioni specifiche della crociera
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ship_name">Nome della Nave</Label>
                      <Input
                        id="ship_name"
                        placeholder="es. MSC Seaside"
                        value={cruiseData.ship_name}
                        onChange={(e) => handleCruiseDataChange('ship_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cabin_number">Numero Cabina</Label>
                      <Input
                        id="cabin_number"
                        placeholder="es. 8024"
                        value={cruiseData.cabin_number}
                        onChange={(e) => handleCruiseDataChange('cabin_number', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Orario di Partenza</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {cruiseData.departure_time ? format(cruiseData.departure_time, "PPP", { locale: it }) : "Data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={cruiseData.departure_time}
                              onSelect={(date) => handleCruiseDataChange('departure_time', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-32"
                          onChange={(e) => {
                            if (cruiseData.departure_time && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(cruiseData.departure_time);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              handleCruiseDataChange('departure_time', newDate);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Orario di Ritorno</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {cruiseData.return_time ? format(cruiseData.return_time, "PPP", { locale: it }) : "Data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={cruiseData.return_time}
                              onSelect={(date) => handleCruiseDataChange('return_time', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-32"
                          onChange={(e) => {
                            if (cruiseData.return_time && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(cruiseData.return_time);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              handleCruiseDataChange('return_time', newDate);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {isEditMode ? 'Aggiorna Viaggio' : 'Crea Viaggio'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dashboard>
  );
};

export default TripManager;