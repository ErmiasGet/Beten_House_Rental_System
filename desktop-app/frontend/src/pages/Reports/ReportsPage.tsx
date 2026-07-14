import { useState } from 'react';
import { reportsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { formatCurrency } from '@beten-homes-rent/shared';
import { toast } from '../../components/ui/toaster';
import { Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [incomeReport, setIncomeReport] = useState<any>(null);
  const [expenseReport, setExpenseReport] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadIncomeReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getIncome(dateRange);
      setIncomeReport(response.data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load report', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadExpenseReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getExpenses(dateRange);
      setExpenseReport(response.data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load report', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadOccupancy = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getOccupancy();
      setOccupancy(response.data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load occupancy', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const exportPDF = async (type: 'payments' | 'expenses') => {
    try {
      const response = type === 'payments'
        ? await reportsAPI.exportPayments(dateRange)
        : await reportsAPI.exportExpenses(dateRange);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.pdf`;
      a.click();
      toast({ title: 'Success', description: 'Report downloaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export', variant: 'destructive' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export reports</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
            <Button onClick={loadIncomeReport} disabled={loading}>Load Reports</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Income Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeReport ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(incomeReport.totalIncome)}</p>
                </div>
                {incomeReport.monthlyBreakdown?.map((m: any) => (
                  <div key={`${m.month}-${m.year}`} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm">{new Date(m.year, m.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })}</span>
                    <span className="text-sm font-medium">{formatCurrency(m.amount)}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => exportPDF('payments')}>
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Select date range and load report</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              Expense Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseReport ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(expenseReport.totalExpenses)}</p>
                </div>
                {expenseReport.categoryBreakdown?.map((c: any) => (
                  <div key={c.category} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm">{c.category}</span>
                    <span className="text-sm font-medium">{formatCurrency(c.amount)} ({c.count})</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => exportPDF('expenses')}>
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Select date range and load report</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Occupancy Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadOccupancy} className="mb-4" disabled={loading}>Load Occupancy</Button>
          {occupancy && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Rooms</p>
                  <p className="text-lg font-bold">{occupancy.totalRooms}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500">Occupied</p>
                  <p className="text-lg font-bold text-green-600">{occupancy.occupiedRooms}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-gray-500">Vacant</p>
                  <p className="text-lg font-bold text-yellow-600">{occupancy.vacantRooms}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-lg font-bold text-purple-600">{occupancy.occupancyRate.toFixed(1)}%</p>
                </div>
              </div>
              {occupancy.houseBreakdown?.map((h: any) => (
                <div key={h.houseId} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{h.houseName}</span>
                  <span className="text-sm">{h.occupied}/{h.total} occupied</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
