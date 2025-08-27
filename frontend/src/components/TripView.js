import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Ship,
  Building,
  Route,
  Camera,
  StickyNote,
  Clock,
  Upload,
  Save,
  Plus,
  Eye,
  Star,
  Users,
  Anchor
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [cruiseInfo, setCruiseInfo] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Photo upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Notes
  const [newNote, setNewNote] = useState('');
  const [selectedDayForNote, setSelectedDayForNote] = useState(1);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const [tripRes, itinerariesRes, photosRes, notesRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}`),
        axios.get(`${API}/trips/${tripId}/itineraries`),
        axios.get(`${API}/trips/${tripId}/photos`),
        axios.get(`${API}/trips/${tripId}/notes`)
      ]);

      setTrip(tripRes.data);
      setItineraries(itinerariesRes.data);
      setPhotos(photosRes.data);
      setNotes(notesRes.data);

      // If it's a cruise, fetch cruise info
      if (tripRes.data.trip_type === 'cruise') {
        try {
          const cruiseRes = await axios.get(`${API}/trips/${tripId}/cruise-info`);
          setCruiseInfo(cruiseRes.data);
        } catch (error) {
          console.log('No cruise info found');
        }
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast.error('Errore nel caricamento del viaggio');
      navigate('/dashboard');
    } finally {
      setLoading(false);
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
        return <MapPin size={24} className="text-gray-600" />;
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

  const getPhotoCategoryOptions = (tripType) => {
    const common = [
      { value: 'destination', label: 'Destinazioni' },
      { value: 'activities', label: 'Attività' },
    ];

    switch (tripType) {
      case 'cruise':
        return [
          ...common,
          { value: 'ship_cabin', label: 'Cabina' },
          { value: 'ship_facilities', label: 'Servizi Nave' },
          { value: 'dining', label: 'Ristorazione' },
          { value: 'excursion', label: 'Escursioni' }
        ];
      case 'resort':
        return [
          ...common,
          { value: 'resort_room', label: 'Camera' },
          { value: 'resort_beach', label: 'Spiaggia' },
          { value: 'resort_pool', label: 'Piscina' },
          { value: 'dining', label: 'Ristoranti' }
        ];
      case 'tour':
        return [
          ...common,
          { value: 'tour_attractions', label: 'Attrazioni' },
          { value: 'tour_hotels', label: 'Hotel' },
          { value: 'dining', label: 'Cibo Locale' }
        ];
      default:
        return common;
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !photoCategory) {
      toast.error('Seleziona un file e una categoria');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caption', photoCaption);
    formData.append('photo_category', photoCategory);

    try {
      await axios.post(`${API}/trips/${tripId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Foto caricata con successo!');
      setSelectedFile(null);
      setPhotoCaption('');
      setPhotoCategory('');
      fetchTripData(); // Refresh photos
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Errore nel caricamento della foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNoteSubmit = async () => {
    if (!newNote.trim()) {
      toast.error('Inserisci il testo della nota');
      return;
    }

    setSavingNote(true);
    try {
      await axios.post(`${API}/trips/${tripId}/notes`, {
        day_number: selectedDayForNote,
        note_text: newNote
      });

      toast.success('Nota salvata con successo!');
      setNewNote('');
      fetchTripData(); // Refresh notes
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Errore nel salvataggio della nota');
    } finally {
      setSavingNote(false);
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "PPP", { locale: it });
  };

  const getTripDays = () => {
    if (!trip) return [];
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
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

  if (!trip) {
    return (
      <Dashboard>
        <div className="text-center py-16">
          <p className="text-slate-500">Viaggio non trovato</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Torna alla Dashboard
          </Button>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <nav className="space-y-2">
        <div className="nav-item" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </div>
        <div className="nav-item active">
          <Eye size={20} />
          Visualizza Viaggio
        </div>
      </nav>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                {getTripTypeIcon(trip.trip_type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{trip.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-slate-600">📍 {trip.destination}</p>
                  <Badge className={`${getTripTypeBadgeClass(trip.trip_type)}`}>
                    {trip.trip_type}
                  </Badge>
                  <Badge className={`${getStatusBadgeClass(trip.status)}`}>
                    {trip.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-teal-600" size={20} />
                <div>
                  <p className="text-sm text-slate-500">Date del Viaggio</p>
                  <p className="font-semibold text-slate-800">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </p>
                </div>
              </div>
              
              {cruiseInfo && (
                <>
                  <div className="flex items-center gap-3">
                    <Ship className="text-blue-600" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Nave</p>
                      <p className="font-semibold text-slate-800">{cruiseInfo.ship_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Anchor className="text-slate-600" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Cabina</p>
                      <p className="font-semibold text-slate-800">{cruiseInfo.cabin_number}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {trip.description && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-slate-600">{trip.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
            <TabsTrigger value="photos">Foto ({photos.length})</TabsTrigger>
            <TabsTrigger value="notes">Note ({notes.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera size={20} className="text-purple-600" />
                    Foto Recenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {photos.slice(0, 4).map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                          <img
                            src={`${BACKEND_URL}${photo.url}`}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                            <p className="text-white text-xs p-2 truncate">{photo.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">Nessuna foto caricata</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote size={20} className="text-amber-600" />
                    Note Recenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.slice(0, 3).map((note) => (
                        <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Giorno {note.day_number}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-2">{note.note_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">Nessuna nota scritta</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Itinerario Giornaliero</CardTitle>
                <CardDescription>
                  Programma dettagliato per ogni giorno del viaggio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getTripDays().map((day, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border-l-4 border-l-teal-500 bg-slate-50 rounded-r-lg mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Calendar size={16} className="text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">
                          Giorno {index + 1}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {format(day, "PPP", { locale: it })}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Itinerario in fase di pianificazione...
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={20} className="text-purple-600" />
                  Carica Nuova Foto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo-file">Seleziona Foto</Label>
                    <Input
                      id="photo-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo-category">Categoria</Label>
                    <Select value={photoCategory} onValueChange={setPhotoCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPhotoCategoryOptions(trip.trip_type).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo-caption">Didascalia</Label>
                    <Input
                      id="photo-caption"
                      placeholder="Descrivi la foto..."
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handlePhotoUpload} 
                  disabled={uploadingPhoto || !selectedFile || !photoCategory}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="spinner mr-2" />
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Carica Foto
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Photos Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Galleria Foto</CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="photo-grid">
                    {photos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <img
                          src={`${BACKEND_URL}${photo.url}`}
                          alt={photo.caption}
                        />
                        <div className="photo-overlay">
                          <Badge className="mb-2 text-xs">{photo.photo_category}</Badge>
                          <p>{photo.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-16">
                    Nessuna foto caricata ancora. Inizia a caricare le tue foto di viaggio!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            {/* Add Note Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} className="text-amber-600" />
                  Aggiungi Nuova Nota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="note-day">Giorno</Label>
                    <Select value={selectedDayForNote.toString()} onValueChange={(value) => setSelectedDayForNote(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTripDays().map((day, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            Giorno {index + 1} - {format(day, "dd/MM", { locale: it })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="note-text">Nota</Label>
                    <Textarea
                      id="note-text"
                      placeholder="Scrivi la tua nota per questo giorno..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleNoteSubmit} 
                    disabled={savingNote || !newNote.trim()}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                  >
                    {savingNote ? (
                      <>
                        <div className="spinner mr-2" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Salva Nota
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            <Card>
              <CardHeader>
                <CardTitle>Le Tue Note</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline">
                            Giorno {note.day_number}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(note.created_at), "PPP 'alle' p", { locale: it })}
                          </span>
                        </div>
                        <p className="text-slate-700">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-16">
                    Nessuna nota scritta ancora. Inizia a documentare le tue esperienze!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Dashboard>
  );
};

export default TripView;