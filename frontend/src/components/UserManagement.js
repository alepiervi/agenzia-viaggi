import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Mail,
  User,
  Shield,
  Lock,
  Unlock,
  Archive,
  ArchiveRestore,
  Search,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'client'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use appropriate endpoint based on user role
      let endpoint = `${API}/users`; // Admin endpoint
      if (currentUser?.role === 'agent') {
        endpoint = `${API}/clients`; // Agent endpoint (only clients)
      }
      
      const response = await axios.get(endpoint);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleViewClient = (userId) => {
    navigate(`/clients/${userId}`);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: currentUser?.role === 'admin' ? 'client' : 'client' // Admin can choose, agent defaults to client
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('La password è obbligatoria per nuovi utenti');
      return;
    }

    // Check role permissions
    if (currentUser?.role === 'agent' && formData.role !== 'client') {
      toast.error('Gli agenti possono creare solo clienti');
      return;
    }

    try {
      if (editingUser) {
        // Update user (not implemented in backend yet)
        toast.info('Aggiornamento utenti non ancora implementato');
      } else {
        // Create new user
        await axios.post(`${API}/auth/register`, formData);
        toast.success('Utente creato con successo!');
        setIsDialogOpen(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.detail || 'Errore nel salvataggio dell\'utente';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ ATTENZIONE: Vuoi eliminare DEFINITIVAMENTE questo utente?\n\nQuesta azione è IRREVERSIBILE e cancellerà:\n• Tutti i dati dell\'utente\n• I viaggi associati\n• Lo storico delle transazioni\n\nSe vuoi solo nascondere l\'utente temporaneamente, usa "Archivia" invece.\n\nConfermi l\'eliminazione definitiva?')) {
      try {
        await axios.delete(`${API}/users/${userId}`);
        toast.success('Utente eliminato definitivamente!');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        const message = error.response?.data?.detail || 'Errore nell\'eliminazione dell\'utente';
        toast.error(message);
      }
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    const action = isBlocked ? 'ripristinare' : 'archiviare';
    const description = isBlocked 
      ? 'Il cliente sarà nuovamente visibile e potrà accedere al sistema.'
      : 'Il cliente sarà nascosto dalla lista ma i suoi dati rimarranno nel sistema.';
    
    if (window.confirm(`Vuoi ${action} questo utente?\n\n${description}\n\nConfermi l'operazione?`)) {
      try {
        const endpoint = isBlocked ? 'unblock' : 'block';
        await axios.post(`${API}/users/${userId}/${endpoint}`);
        toast.success(`Utente ${isBlocked ? 'ripristinato' : 'archiviato'} con successo!`);
        fetchUsers();
      } catch (error) {
        console.error(`Error ${action} user:`, error);
        const message = error.response?.data?.detail || `Errore nell'${action} l'utente`;
        toast.error(message);
      }
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

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'agent':
        return 'Agente';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  // Filter users based on search term and archive status
  const filteredUsers = users.filter(user => {
    // Filter by archive status
    const archiveFilter = showArchivedUsers ? user.blocked : !user.blocked;
    
    // Filter by search term
    const searchFilter = searchTerm === '' || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return archiveFilter && searchFilter;
  });

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === 'admin') {
      return [
        { value: 'client', label: 'Cliente' },
        { value: 'agent', label: 'Agente' },
        { value: 'admin', label: 'Amministratore' }
      ];
    } else {
      return [{ value: 'client', label: 'Cliente' }];
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
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {currentUser?.role === 'admin' ? 'Gestione Utenti' : 'I Miei Clienti'}
            </h1>
            <p className="text-slate-600 mt-1">
              {currentUser?.role === 'admin' 
                ? 'Crea e gestisci tutti gli utenti del sistema' 
                : 'Crea e gestisci i tuoi clienti'
              }
            </p>
          </div>
          <Button 
            onClick={handleCreateUser}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          >
            <Plus size={16} className="mr-2" />
            {currentUser?.role === 'admin' ? 'Nuovo Utente' : 'Nuovo Cliente'}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Cerca per nome, cognome o email..."
            className="pl-10 pr-10 py-2 w-full bg-white border-slate-300 focus:border-teal-500 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {showArchivedUsers 
                ? `${filteredUsers.length} Archiviati` + (searchTerm ? ` (filtrati)` : '')
                : `${filteredUsers.length} Attivi` + (searchTerm ? ` (filtrati)` : '')
              }
            </Badge>
            {searchTerm && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                🔍 "{searchTerm}"
              </Badge>
            )}
            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">
              Totali: {users.filter(u => !u.blocked).length} attivi, {users.filter(u => u.blocked).length} archiviati
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Mostra archiviati:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchivedUsers(!showArchivedUsers)}
              className={showArchivedUsers ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
            >
              {showArchivedUsers ? (
                <ArchiveRestore size={14} className="mr-2" />
              ) : (
                <Archive size={14} className="mr-2" />
              )}
              {showArchivedUsers ? 'Nascondi' : 'Mostra'}
            </Button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-teal-700">
                        {getUserInitials(user.first_name, user.last_name)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {user.first_name} {user.last_name}
                        </h3>
                        {user.blocked && (
                          <Lock size={16} className="text-red-500" title="Account bloccato" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs ${getRoleBadgeClass(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    {user.blocked && (
                      <Badge className="text-xs bg-red-100 text-red-700">
                        Bloccato
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <span>Registrato il:</span>
                  <span>{new Date(user.created_at).toLocaleDateString('it-IT')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* View Client Details Button (for clients only) */}
                  {user.role === 'client' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 hover:bg-teal-50 hover:text-teal-700"
                      onClick={() => handleViewClient(user.id)}
                      title="Visualizza dettagli cliente"
                    >
                      <Eye size={14} className="mr-1" />
                      Dettagli
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleEditUser(user)}
                    title="Modifica dati utente"
                  >
                    <Edit size={14} className="mr-1" />
                    Modifica
                  </Button>

                  {/* Archive/Restore Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`hover:${user.blocked ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}
                    onClick={() => handleBlockUser(user.id, user.blocked)}
                    title={user.blocked ? 'Ripristina utente' : 'Archivia utente'}
                  >
                    {user.blocked ? (
                      <ArchiveRestore size={14} className="mr-1" />
                    ) : (
                      <Archive size={14} className="mr-1" />
                    )}
                    {user.blocked ? 'Ripristina' : 'Archivia'}
                  </Button>

                  {/* Delete Button - Only for Admin */}
                  {currentUser?.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Elimina definitivamente utente"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-16">
                  <Users size={48} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {searchTerm ? (
                      <>Nessun risultato per "<span className="text-teal-600">{searchTerm}</span>"</>
                    ) : (
                      <>Nessun {showArchivedUsers ? 'utente archiviato' : currentUser?.role === 'admin' ? 'utente' : 'cliente'} trovato</>
                    )}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm ? (
                      'Prova a modificare i termini di ricerca o controlla se il cliente è archiviato.'
                    ) : (
                      showArchivedUsers ? 
                        'Non ci sono utenti archiviati.' :
                        `Non ci sono ${currentUser?.role === 'admin' ? 'utenti' : 'clienti'} ancora creati.`
                    )}
                  </p>
                  {searchTerm && (
                    <Button onClick={clearSearch} variant="outline">
                      <X size={16} className="mr-2" />
                      Pulisci ricerca
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {users.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-16">
              <Users size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Nessun {currentUser?.role === 'admin' ? 'utente' : 'cliente'} trovato
              </h3>
              <p className="text-slate-500 mb-6">
                {currentUser?.role === 'admin' 
                  ? 'Inizia creando il primo utente del sistema'
                  : 'Inizia creando il tuo primo cliente'
                }
              </p>
              <Button 
                onClick={handleCreateUser}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                <Plus size={16} className="mr-2" />
                {currentUser?.role === 'admin' ? 'Crea Primo Utente' : 'Crea Primo Cliente'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Modifica Utente' : `Nuovo ${currentUser?.role === 'admin' ? 'Utente' : 'Cliente'}`}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Modifica i dati dell\'utente esistente'
                  : `Compila il form per creare un nuovo ${currentUser?.role === 'admin' ? 'utente' : 'cliente'}`
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome *</Label>
                  <Input
                    id="first_name"
                    placeholder="Mario"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Cognome *</Label>
                  <Input
                    id="last_name"
                    placeholder="Rossi"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mario.rossi@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {!editingUser && '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={editingUser ? "Lascia vuoto per non modificare" : "Minimo 8 caratteri"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required={!editingUser}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Ruolo *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  <Save size={16} className="mr-2" />
                  {editingUser ? 'Aggiorna' : 'Crea'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Dashboard>
  );
};

export default UserManagement;