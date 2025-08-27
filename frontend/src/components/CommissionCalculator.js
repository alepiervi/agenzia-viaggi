import React, { useState, useEffect } from 'react';
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
import { Separator } from './ui/separator';
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  BarChart3,
  Calendar,
  Percent,
  Euro,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommissionCalculator = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Calculator form state
  const [calculatorData, setCalculatorData] = useState({
    gross_amount: 0,
    net_amount: 0,
    discount: 0
  });
  
  // Calculated results
  const [calculatedResults, setCalculatedResults] = useState({
    gross_commission: 0,
    supplier_commission: 0,
    agent_commission: 0
  });

  useEffect(() => {
    fetchAnalytics();
    fetchYearlyData();
  }, [selectedYear]);

  useEffect(() => {
    calculateCommissions();
  }, [calculatorData]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (user?.role === 'agent') params.append('agent_id', user.id);
      
      const response = await axios.get(`${API}/analytics/agent-commissions?${params}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Errore nel caricamento delle analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/yearly-summary/${selectedYear}`);
      setYearlyData(response.data);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  };

  const calculateCommissions = () => {
    const { gross_amount, net_amount, discount } = calculatorData;
    
    // Calculate commissions using the same logic as backend
    const gross_commission = gross_amount - discount - net_amount;
    const supplier_commission = gross_amount * 0.04; // 4% of gross
    const agent_commission = gross_commission - supplier_commission;
    
    setCalculatedResults({
      gross_commission,
      supplier_commission,
      agent_commission
    });
  };

  const handleInputChange = (field, value) => {
    setCalculatorData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleReset = () => {
    setCalculatorData({
      gross_amount: 0,
      net_amount: 0,
      discount: 0
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Generate year options
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <Dashboard>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Calcolatore Commissioni</h1>
            <p className="text-slate-600 mt-1">Calcola commissioni e visualizza analytics finanziarie</p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="year-select" className="text-sm font-medium">Anno:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetchAnalytics();
                fetchYearlyData();
              }}
              disabled={loading}
            >
              <RefreshCw size={14} className="mr-2" />
              Aggiorna
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commission Calculator */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={20} className="text-blue-600" />
                  Calcolatore Commissioni
                </CardTitle>
                <CardDescription>
                  Calcola automaticamente le commissioni in base agli importi inseriti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gross_amount">Importo Lordo Saldato</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="gross_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.gross_amount}
                        onChange={(e) => handleInputChange('gross_amount', e.target.value)}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="net_amount">Importo Netto</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="net_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.net_amount}
                        onChange={(e) => handleInputChange('net_amount', e.target.value)}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount">Sconto</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.discount}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 mb-3">Risultati Calcolati</h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Commissione Lorda</span>
                      <span className="font-bold text-green-600">{formatCurrency(calculatedResults.gross_commission)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-orange-800">
                        Commissione Fornitore
                        <span className="text-xs ml-1">(4%)</span>
                      </span>
                      <span className="font-bold text-orange-600">{formatCurrency(calculatedResults.supplier_commission)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Commissione Agente</span>
                      <span className="font-bold text-blue-600">{formatCurrency(calculatedResults.agent_commission)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleReset}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset Calcolatore
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Analytics and Reports */}
          <div className="space-y-6">
            {/* Yearly Summary */}
            {yearlyData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar size={20} className="text-purple-600" />
                    Riepilogo Anno {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    Totali delle pratiche confermate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800">{yearlyData.total_confirmed_trips}</div>
                      <div className="text-sm text-slate-600">Pratiche Confermate</div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">{formatCurrency(yearlyData.total_revenue)}</div>
                      <div className="text-sm text-slate-600">Fatturato Totale</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Commissioni Lorde</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(yearlyData.total_gross_commission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Commissioni Fornitore</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(yearlyData.total_supplier_commission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Commissioni Agenti</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(yearlyData.total_agent_commission)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-emerald-600" />
                    Metriche Performance
                  </CardTitle>
                  <CardDescription>
                    Analytics dettagliate per {analytics.year}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Fatturato Medio per Pratica</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(analytics.total_confirmed_trips > 0 ? analytics.total_revenue / analytics.total_confirmed_trips : 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Commissione Media per Pratica</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(analytics.total_confirmed_trips > 0 ? analytics.total_agent_commission / analytics.total_confirmed_trips : 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium text-slate-700">% Commissione su Fatturato</span>
                      <span className="font-bold text-slate-800">
                        {formatPercentage(analytics.total_gross_commission, analytics.total_revenue)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium text-slate-700">% Commissione Agente</span>
                      <span className="font-bold text-slate-800">
                        {formatPercentage(analytics.total_agent_commission, analytics.total_gross_commission)}
                      </span>
                    </div>
                  </div>

                  {analytics.total_confirmed_trips === 0 && (
                    <div className="text-center py-8">
                      <TrendingUp size={48} className="mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-500">Nessuna pratica confermata per {analytics.year}</p>
                      <p className="text-sm text-slate-400">Le statistiche appariranno una volta confermate le pratiche</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Commission Formula Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent size={20} className="text-indigo-600" />
                  Formula Calcolo Commissioni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-700 mb-1">Commissione Lorda</div>
                    <div className="text-slate-600">= Importo Lordo - Sconto - Importo Netto</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-700 mb-1">Commissione Fornitore</div>
                    <div className="text-slate-600">= 4% dell'Importo Lordo</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-700 mb-1">Commissione Agente</div>
                    <div className="text-slate-600">= Commissione Lorda - Commissione Fornitore</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default CommissionCalculator;