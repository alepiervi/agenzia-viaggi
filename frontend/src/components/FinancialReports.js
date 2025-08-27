import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  FileText,
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Eye,
  Percent
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialReports = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
    fetchYearlyData();
  }, [selectedYear]);

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
      console.error('Error details:', error.response?.data || error.message);
      // Set empty analytics to prevent UI errors
      setAnalytics({
        year: selectedYear,
        total_confirmed_trips: 0,
        total_revenue: 0,
        total_gross_commission: 0,
        total_supplier_commission: 0,
        total_agent_commission: 0,
        trips: []
      });
      toast.error('Analytics non disponibili per questo periodo');
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
      console.error('Error details:', error.response?.data || error.message);
      // Set empty yearly data to prevent UI errors
      setYearlyData({
        year: selectedYear,
        total_confirmed_trips: 0,
        total_revenue: 0,
        total_gross_commission: 0,
        total_supplier_commission: 0,
        total_agent_commission: 0
      });
      toast.error('Dati annuali non disponibili');
    }
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
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  const getMonthlyBreakdown = () => {
    if (!analytics || !analytics.trips) return [];
    
    const monthlyData = {};
    
    analytics.trips.forEach(trip => {
      const date = new Date(trip.practice_confirm_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          trips: 0,
          revenue: 0,
          commission: 0
        };
      }
      
      monthlyData[monthKey].trips += 1;
      monthlyData[monthKey].revenue += trip.gross_amount || 0;
      monthlyData[monthKey].commission += trip.agent_commission || 0;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const monthlyBreakdown = getMonthlyBreakdown();

  return (
    <Dashboard>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Report Finanziari</h1>
            <p className="text-slate-600 mt-1">
              {user?.role === 'admin' 
                ? 'Report completi del sistema' 
                : 'Report delle tue commissioni e performance'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button 
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Download size={14} className="mr-2" />
              Esporta
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {yearlyData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Pratiche Confermate</p>
                    <p className="text-2xl font-bold text-slate-800">{yearlyData.total_confirmed_trips}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Fatturato Totale</p>
                    <p className="text-2xl font-bold text-teal-600">{formatCurrency(yearlyData.total_revenue)}</p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Commissioni Lorde</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(yearlyData.total_gross_commission)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Commissioni Agenti</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(yearlyData.total_agent_commission)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Breakdown Mensile {selectedYear}
              </CardTitle>
              <CardDescription>
                Performance mese per mese
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {monthlyBreakdown.map((monthData) => (
                    <div key={monthData.month} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {new Date(monthData.month + '-01').toLocaleDateString('it-IT', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-slate-600">
                          {monthData.trips} pratiche
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {formatCurrency(monthData.revenue)}
                        </div>
                        <div className="text-sm text-green-600">
                          Comm: {formatCurrency(monthData.commission)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500">Nessun dato disponibile per {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                Analisi Performance
              </CardTitle>
              <CardDescription>
                Metriche chiave di performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics && yearlyData && yearlyData.total_confirmed_trips > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">Fatturato Medio/Pratica</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(yearlyData.total_revenue / yearlyData.total_confirmed_trips)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">Commissione Media/Pratica</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(yearlyData.total_agent_commission / yearlyData.total_confirmed_trips)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-800">% Commissione su Fatturato</span>
                        <span className="font-bold text-purple-600">
                          {formatPercentage(yearlyData.total_gross_commission, yearlyData.total_revenue)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-orange-800">% Commissione Agente</span>
                        <span className="font-bold text-orange-600">
                          {formatPercentage(yearlyData.total_agent_commission, yearlyData.total_gross_commission)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-slate-800 mb-3">Breakdown Commissioni</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Commissioni Lorde</span>
                        <span className="font-semibold">{formatCurrency(yearlyData.total_gross_commission)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Commissioni Fornitore (4%)</span>
                        <span className="font-semibold">{formatCurrency(yearlyData.total_supplier_commission)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-2">
                        <span className="text-slate-800">Commissioni Agenti Nette</span>
                        <span className="text-green-600">{formatCurrency(yearlyData.total_agent_commission)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Percent size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500">Nessuna pratica confermata per {selectedYear}</p>
                  <p className="text-sm text-slate-400">Le metriche appariranno una volta confermate le pratiche</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison with Previous Year */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Confronto Anni Precedenti
            </CardTitle>
            <CardDescription>
              Performance {selectedYear} vs anni precedenti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">Confronto multi-anno in sviluppo</p>
              <p className="text-sm text-slate-400">
                Questa funzionalità mostrerà grafici comparativi tra gli anni
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default FinancialReports;