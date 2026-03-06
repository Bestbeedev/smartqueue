import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/api/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Building2,
  Activity,
  DollarSign,
  Zap,
  Shield,
  Globe,
  Server,
  HardDrive,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Rocket,
  Star,
  Crown,
  Gem,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Database,
  Lock,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  BarChart3,
  PieChartIcon,
  LineChartIcon
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<any>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/saas/monitoring/overview');
      setData(response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions super admin requises.');
      } else {
        toast.error('Impossible de charger les données du dashboard');
      }
      console.error('Erreur lors du chargement du dashboard SaaS:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const stats = useMemo(() => {
    if (!data) return null;

    const subscriptions = data?.subscriptions_by_status || {};
    const activeSubscriptions = Number(subscriptions?.active ?? 0);

    return {
      totalRevenue: null,
      revenueGrowth: null,
      totalCustomers: Number(data?.establishments ?? 0),
      customerGrowth: null,
      activeSubscriptions,
      subscriptionGrowth: null,
      satisfactionRate: null,
    };
  }, [data]);

  const revenueData: any[] = [];
  const planDistribution = useMemo(() => {
    const s = data?.subscriptions_by_status;
    if (!s) return [];
    return [
      { name: 'Actifs', value: Number(s.active ?? 0), color: '#10b981' },
      { name: 'Essai', value: Number(s.trial ?? 0), color: '#3b82f6' },
      { name: 'Expirés', value: Number(s.expired ?? 0), color: '#f59e0b' },
      { name: 'Annulés', value: Number(s.canceled ?? 0), color: '#ef4444' },
    ].filter((x) => Number(x.value) > 0);
  }, [data]);

  const performanceMetrics = useMemo(() => {
    const tickets = data?.tickets;
    const services = data?.services;
    const counters = data?.counters;

    const items: any[] = [];
    if (tickets) {
      const totalTickets = Number(tickets.waiting ?? 0) + Number(tickets.called ?? 0) + Number(tickets.absent ?? 0);
      items.push({ metric: 'Tickets en attente', value: Number(tickets.waiting ?? 0), color: '#3b82f6' });
      items.push({ metric: 'Tickets appelés', value: Number(tickets.called ?? 0), color: '#10b981' });
      items.push({ metric: 'Tickets absents', value: Number(tickets.absent ?? 0), color: '#f59e0b' });
      items.push({ metric: 'Tickets total', value: totalTickets, color: '#8b5cf6' });
    }
    if (services) {
      const total = Number(services.open ?? 0) + Number(services.closed ?? 0);
      items.push({ metric: 'Services ouverts', value: Number(services.open ?? 0), color: '#10b981' });
      items.push({ metric: 'Services fermés', value: Number(services.closed ?? 0), color: '#ef4444' });
      items.push({ metric: 'Services total', value: total, color: '#3b82f6' });
    }
    if (counters) {
      const total = Number(counters.open ?? 0) + Number(counters.closed ?? 0);
      items.push({ metric: 'Guichets ouverts', value: Number(counters.open ?? 0), color: '#10b981' });
      items.push({ metric: 'Guichets fermés', value: Number(counters.closed ?? 0), color: '#ef4444' });
      items.push({ metric: 'Guichets total', value: total, color: '#3b82f6' });
    }

    return items.slice(0, 4).map((m) => ({ ...m, max: 100 }));
  }, [data]);

  const recentActivity: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Dashboard Super Admin
            </h1>
            <p className="text-xl text-muted-foreground">
              Vue d'ensemble de la plateforme SmartQueue SaaS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              Super Admin
            </Badge>
            <div className="inline-flex rounded-xl border border-border p-1 bg-card">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    timeRange === range
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {range === '7d' ? '7J' : range === '30d' ? '30J' : '90J'}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={loadDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white/80 text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {typeof stats?.totalRevenue === 'number' ? `${stats.totalRevenue.toLocaleString()}€` : '—'}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span className="text-green-300 font-medium">{typeof stats?.revenueGrowth === 'number' ? `+${stats.revenueGrowth}%` : '—'}</span>
                <span className="text-white/60 text-sm">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white/80 text-sm font-medium">Clients Actifs</CardTitle>
                <Users className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {typeof stats?.totalCustomers === 'number' ? stats.totalCustomers.toLocaleString() : '—'}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span className="text-green-300 font-medium">{typeof stats?.customerGrowth === 'number' ? `+${stats.customerGrowth}%` : '—'}</span>
                <span className="text-white/60 text-sm">ce mois</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white/80 text-sm font-medium">Abonnements</CardTitle>
                <CreditCard className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {typeof stats?.activeSubscriptions === 'number' ? stats.activeSubscriptions : '—'}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span className="text-green-300 font-medium">{typeof stats?.subscriptionGrowth === 'number' ? `+${stats.subscriptionGrowth}%` : '—'}</span>
                <span className="text-white/60 text-sm">croissance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white/80 text-sm font-medium">Satisfaction</CardTitle>
                <Star className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {typeof stats?.satisfactionRate === 'number' ? `${stats.satisfactionRate}%` : '—'}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span className="text-green-300 font-medium">Excellent</span>
                <span className="text-white/60 text-sm">NPS</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                Évolution des Revenus
              </CardTitle>
              <CardDescription>Derniers 7 jours</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée pour la période sélectionnée.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fill="url(#revenueGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-purple-600" />
                Répartition par Plans
              </CardTitle>
              <CardDescription>Distribution des abonnements</CardDescription>
            </CardHeader>
            <CardContent>
              {planDistribution.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée pour la période sélectionnée.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={planDistribution.map((p: any, i: number) => ({
                    date: String(p.name ?? i),
                    value: Number(p.value ?? 0),
                  }))}>
                    <defs>
                      <linearGradient id="plansGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="url(#plansGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Performance */}
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              Performance Système
            </CardTitle>
            <CardDescription>Métriques en temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performanceMetrics.length === 0 ? (
                <div className="col-span-full text-sm text-muted-foreground text-center py-6">
                  Aucune donnée pour la période sélectionnée.
                </div>
              ) : performanceMetrics.map((metric, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <span className="text-sm text-muted-foreground">{metric.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${metric.value}%`,
                        backgroundColor: metric.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Activité Récente
            </CardTitle>
            <CardDescription>Dernières notifications système</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Aucune activité récente.
                </div>
              ) : recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-full ${activity.color} bg-current/10`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
          <Card className="shadow-xl border-border hover:shadow-2xl transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Gérer les Clients</h3>
              <p className="text-sm text-muted-foreground mb-4">Accéder à la gestion des établissements</p>
              <Button className="w-full">Voir les clients</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border hover:shadow-2xl transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Abonnements</h3>
              <p className="text-sm text-muted-foreground mb-4">Gérer les plans et facturation</p>
              <Button className="w-full" variant="outline">Voir les abonnements</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border hover:shadow-2xl transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">Paramètres avancés de la plateforme</p>
              <Button className="w-full" variant="outline">Config SaaS</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
