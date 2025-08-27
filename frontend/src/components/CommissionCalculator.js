import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  Calculator,
  Euro,
  RefreshCw,
  Percent,
  TrendingUp,
  Info
} from 'lucide-react';

const CommissionCalculator = () => {
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
    calculateCommissions();
  }, [calculatorData]);

  const calculateCommissions = () => {
    const { gross_amount, net_amount, discount } = calculatorData;
    
    // Calculate commissions using the same logic as backend
    const gross_commission = gross_amount - discount - net_amount;
    const supplier_commission = gross_amount * 0.04; // 4% of gross
    const agent_commission = gross_commission - supplier_commission;
    
    setCalculatedResults({
      gross_commission: Math.max(0, gross_commission), // Prevent negative values
      supplier_commission: Math.max(0, supplier_commission),
      agent_commission: Math.max(0, agent_commission)
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

  return (
    <Dashboard>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Calcolatore Commissioni</h1>
            <p className="text-slate-600 mt-1">Calcola automaticamente le commissioni in base agli importi inseriti</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Commission Calculator */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={20} className="text-blue-600" />
                  Inserisci Importi
                </CardTitle>
                <CardDescription>
                  Compila i campi sottostanti per calcolare automaticamente le commissioni
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gross_amount" className="flex items-center gap-2">
                      <span>Importo Lordo Saldato</span>
                      <Info size={14} className="text-slate-400" title="Importo totale pagato dal cliente" />
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="gross_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.gross_amount || ''}
                        onChange={(e) => handleInputChange('gross_amount', e.target.value)}
                        className="pl-10 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="net_amount" className="flex items-center gap-2">
                      <span>Importo Netto</span>
                      <Info size={14} className="text-slate-400" title="Costo del servizio fornito" />
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="net_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.net_amount || ''}
                        onChange={(e) => handleInputChange('net_amount', e.target.value)}
                        className="pl-10 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="flex items-center gap-2">
                      <span>Sconto</span>
                      <Info size={14} className="text-slate-400" title="Eventuale sconto applicato al cliente" />
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={calculatorData.discount || ''}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                        className="pl-10 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleReset}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset Tutti i Campi
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Risultati Calcolati
                </CardTitle>
                <CardDescription>
                  Commissioni calcolate automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-800">Commissione Lorda</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(calculatedResults.gross_commission)}</span>
                    </div>
                    <div className="text-sm text-green-700">
                      = Lordo ({formatCurrency(calculatorData.gross_amount)}) - Sconto ({formatCurrency(calculatorData.discount)}) - Netto ({formatCurrency(calculatorData.net_amount)})
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-orange-800">Commissione Fornitore</span>
                      <span className="text-2xl font-bold text-orange-600">{formatCurrency(calculatedResults.supplier_commission)}</span>
                    </div>
                    <div className="text-sm text-orange-700">
                      = 4% dell'Importo Lordo ({formatCurrency(calculatorData.gross_amount)})
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-800">Commissione Agente</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedResults.agent_commission)}</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      = Commissione Lorda ({formatCurrency(calculatedResults.gross_commission)}) - Commissione Fornitore ({formatCurrency(calculatedResults.supplier_commission)})
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                {calculatorData.gross_amount > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3">Analisi Percentuali</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">% Commissione Lorda</span>
                        <span className="font-semibold">{formatPercentage(calculatedResults.gross_commission, calculatorData.gross_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">% Commissione Fornitore</span>
                        <span className="font-semibold">4.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">% Commissione Agente</span>
                        <span className="font-semibold">{formatPercentage(calculatedResults.agent_commission, calculatorData.gross_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">% Margine Netto</span>
                        <span className="font-semibold">{formatPercentage(calculatorData.net_amount, calculatorData.gross_amount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent size={20} className="text-indigo-600" />
                  Esempi Rapidi
                </CardTitle>
                <CardDescription>
                  Clicca per testare con valori di esempio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setCalculatorData({ gross_amount: 1000, net_amount: 800, discount: 0 })}
                >
                  <span className="text-left">
                    <div className="font-medium">Esempio 1: Viaggio Base</div>
                    <div className="text-sm text-slate-500">Lordo €1000, Netto €800, Sconto €0</div>
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setCalculatorData({ gross_amount: 2500, net_amount: 2000, discount: 100 })}
                >
                  <span className="text-left">
                    <div className="font-medium">Esempio 2: Con Sconto</div>
                    <div className="text-sm text-slate-500">Lordo €2500, Netto €2000, Sconto €100</div>
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setCalculatorData({ gross_amount: 5000, net_amount: 3800, discount: 200 })}
                >
                  <span className="text-left">
                    <div className="font-medium">Esempio 3: Viaggio Premium</div>
                    <div className="text-sm text-slate-500">Lordo €5000, Netto €3800, Sconto €200</div>
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Formula Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info size={20} className="text-slate-600" />
              Come Funziona il Calcolo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-700 mb-2">1. Commissione Lorda</div>
                <div className="text-sm text-slate-600">
                  Si calcola sottraendo dall'importo lordo sia lo sconto che l'importo netto del fornitore
                </div>
                <div className="mt-2 font-mono text-xs bg-white p-2 rounded border">
                  Lordo - Sconto - Netto = Comm. Lorda
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-700 mb-2">2. Commissione Fornitore</div>
                <div className="text-sm text-slate-600">
                  È sempre il 4% dell'importo lordo pagato dal cliente
                </div>
                <div className="mt-2 font-mono text-xs bg-white p-2 rounded border">
                  Lordo × 4% = Comm. Fornitore
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-700 mb-2">3. Commissione Agente</div>
                <div className="text-sm text-slate-600">
                  È la differenza tra commissione lorda e commissione fornitore
                </div>
                <div className="mt-2 font-mono text-xs bg-white p-2 rounded border">
                  Comm. Lorda - Comm. Fornitore = Comm. Agente
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default CommissionCalculator;