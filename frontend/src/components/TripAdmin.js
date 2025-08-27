import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft,
  CalendarIcon,
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  Save,
  FileText,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripAdmin = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [tripAdmin, setTripAdmin] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [adminData, setAdminData] = useState({
    practice_number: '',
    booking_number: '',
    gross_amount: 0,
    net_amount: 0,
    discount: 0,
    practice_confirm_date: null,
    client_departure_date: null,
    confirmation_deposit: 0,
    status: 'draft'
  });
  
  // New payment form
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_date: null,
    payment_type: 'installment',
    notes: ''
  });

  useEffect(() => {
    if (tripId) {
      fetchData();
    }
  }, [tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trip info
      const tripRes = await axios.get(`${API}/trips/${tripId}`);
      setTrip(tripRes.data);
      
      // Fetch trip admin data if exists
      try {
        const adminRes = await axios.get(`${API}/trips/${tripId}/admin`);
        if (adminRes.data) {
          setTripAdmin(adminRes.data);
          setAdminData({
            practice_number: adminRes.data.practice_number,
            booking_number: adminRes.data.booking_number,
            gross_amount: adminRes.data.gross_amount,
            net_amount: adminRes.data.net_amount,
            discount: adminRes.data.discount,
            practice_confirm_date: new Date(adminRes.data.practice_confirm_date),
            client_departure_date: new Date(adminRes.data.client_departure_date),
            confirmation_deposit: adminRes.data.confirmation_deposit,
            status: adminRes.data.status
          });
          
          // Fetch payments
          const paymentsRes = await axios.get(`${API}/trip-admin/${adminRes.data.id}/payments`);
          setPayments(paymentsRes.data);
        }
      } catch (error) {
        // No admin data exists yet
        console.log('No admin data found');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Errore nel caricamento dei dati');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAdmin = async () => {
    if (!adminData.practice_number || !adminData.booking_number || !adminData.gross_amount) {
      toast.error('Compila i campi obbligatori');
      return;
    }

    setSaving(true);
    
    try {
      const payload = {
        ...adminData,
        practice_confirm_date: adminData.practice_confirm_date?.toISOString(),
        client_departure_date: adminData.client_departure_date?.toISOString()
      };

      let response;
      if (tripAdmin) {
        // Update existing
        response = await axios.put(`${API}/trip-admin/${tripAdmin.id}`, payload);
      } else {
        // Create new
        response = await axios.post(`${API}/trips/${tripId}/admin`, {
          trip_id: tripId,
          ...payload
        });
      }

      setTripAdmin(response.data);
      toast.success('Dati amministrativi salvati con successo!');
      await fetchData(); // Refresh to get calculated fields
      
    } catch (error) {
      console.error('Error saving admin data:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!tripAdmin) {
      toast.error('Salva prima i dati amministrativi');
      return;
    }

    if (!newPayment.amount || !newPayment.payment_date) {
      toast.error('Inserisci importo e data pagamento');
      return;
    }

    try {
      await axios.post(`${API}/trip-admin/${tripAdmin.id}/payments`, {
        trip_admin_id: tripAdmin.id,
        ...newPayment,
        payment_date: newPayment.payment_date.toISOString()
      });

      setNewPayment({
        amount: 0,
        payment_date: null,
        payment_type: 'installment',
        notes: ''
      });

      toast.success('Pagamento aggiunto con successo!');
      await fetchData(); // Refresh to get updated balance
      
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Errore nell\'aggiunta del pagamento');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo pagamento?')) {
      try {
        await axios.delete(`${API}/payments/${paymentId}`);
        toast.success('Pagamento eliminato con successo!');
        await fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Errore nell\'eliminazione del pagamento');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "PPP", { locale: it });
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
            <h1 className="text-3xl font-bold text-slate-800">Gestione Amministrativa</h1>
            <p className="text-slate-600 mt-1">{trip.title} - {trip.destination}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Administrative Data Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Dati Pratica
                </CardTitle>
                <CardDescription>
                  Informazioni amministrative e commerciali del viaggio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="practice_number">Numero Scheda Pratica *</Label>
                    <Input
                      id="practice_number"
                      placeholder="es. PR-2024-001"
                      value={adminData.practice_number}
                      onChange={(e) => handleInputChange('practice_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking_number">Numero Prenotazione *</Label>
                    <Input
                      id="booking_number"
                      placeholder="es. BK-123456"
                      value={adminData.booking_number}
                      onChange={(e) => handleInputChange('booking_number', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gross_amount">Importo Lordo Saldato *</Label>
                    <Input
                      id="gross_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={adminData.gross_amount}
                      onChange={(e) => handleInputChange('gross_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="net_amount">Importo Netto *</Label>
                    <Input
                      id="net_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={adminData.net_amount}
                      onChange={(e) => handleInputChange('net_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Sconto</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={adminData.discount}
                      onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Conferma Pratica</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {adminData.practice_confirm_date ? format(adminData.practice_confirm_date, "PPP", { locale: it }) : "Seleziona data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={adminData.practice_confirm_date}
                          onSelect={(date) => handleInputChange('practice_confirm_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Partenza Cliente</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {adminData.client_departure_date ? format(adminData.client_departure_date, "PPP", { locale: it }) : "Seleziona data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={adminData.client_departure_date}
                          onSelect={(date) => handleInputChange('client_departure_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_deposit">Acconto Versato per Conferma</Label>
                    <Input
                      id="confirmation_deposit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={adminData.confirmation_deposit}
                      onChange={(e) => handleInputChange('confirmation_deposit', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Stato Pratica</Label>
                    <Select 
                      value={adminData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="confirmed">Confermata</SelectItem>
                        <SelectItem value="paid">Pagata</SelectItem>
                        <SelectItem value="cancelled">Annullata</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveAdmin}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {saving ? (
                    <>
                      <div className="spinner mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salva Dati Amministrativi
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Calculations and Payments */}
          <div className="space-y-6">
            {/* Calculated Fields */}
            {tripAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator size={20} className="text-green-600" />
                    Calcoli Automatici
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Commissione Lorda</span>
                      <span className="font-bold text-green-600">{formatCurrency(tripAdmin.gross_commission)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-orange-800">Commissione Fornitore (4%)</span>
                      <span className="font-bold text-orange-600">{formatCurrency(tripAdmin.supplier_commission)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Commissione Agente</span>
                      <span className="font-bold text-blue-600">{formatCurrency(tripAdmin.agent_commission)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-800">Saldo da Versare</span>
                      <span className="font-bold text-red-600">{formatCurrency(tripAdmin.balance_due)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-600" />
                  Gestione Pagamenti
                </CardTitle>
                <CardDescription>
                  Aggiungi acconti e gestisci i pagamenti del cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Payment */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800">Aggiungi Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="payment_amount">Importo</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Versamento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newPayment.payment_date ? format(newPayment.payment_date, "PPP", { locale: it }) : "Seleziona data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newPayment.payment_date}
                            onSelect={(date) => setNewPayment(prev => ({ ...prev, payment_date: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo Pagamento</Label>
                      <Select 
                        value={newPayment.payment_type} 
                        onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="installment">Acconto</SelectItem>
                          <SelectItem value="balance">Saldo</SelectItem>
                          <SelectItem value="deposit">Caparra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_notes">Note</Label>
                      <Input
                        id="payment_notes"
                        placeholder="Note aggiuntive..."
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddPayment}
                    disabled={!tripAdmin}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Aggiungi Pagamento
                  </Button>
                </div>

                {/* Payments List */}
                {payments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Pagamenti Registrati</h4>
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {payment.payment_type === 'installment' ? 'Acconto' : 
                               payment.payment_type === 'balance' ? 'Saldo' : 'Caparra'}
                            </Badge>
                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {formatDate(payment.payment_date)}
                            {payment.notes && ` - ${payment.notes}`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default TripAdmin;