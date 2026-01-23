import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Send, Users, Activity, BarChart3, Save, BookOpen, Loader2, LogOut, Download } from 'lucide-react';
import { supabase } from './supabaseClient';
import Login from './Login';

// Design aesthetics and constants - Pastel Colors
const COLORS = {
  A: '#93C5FD', // Visual (Pastel Blue - Tailwind blue-300)
  B: '#6EE7B7', // Auditivo (Pastel Emerald - Tailwind emerald-300)
  C: '#FCD34D', // Leitor/Escrita (Pastel Amber - Tailwind amber-300)
  D: '#FCA5A5', // Cinestésico (Pastel Red - Tailwind red-300)
};

const LABELS = {
  A: 'Visual',
  B: 'Auditivo',
  C: 'Leitor/Escrita',
  D: 'Cinestésico'
};

const App = () => {
  // Session state
  const [session, setSession] = useState(null);
  const [customSession, setCustomSession] = useState(null);

  // Persistence state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    a: '',
    b: '',
    c: '',
    d: ''
  });

  // Current session result for immediate feedback
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    // Check Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Check Custom Local Session
    const localSession = localStorage.getItem('vark_user_session');
    if (localSession) {
      try {
        setCustomSession(JSON.parse(localSession));
      } catch (e) {
        console.error("Error parsing local session", e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Load data from LocalStorage when session exists
  useEffect(() => {
    if (session || customSession) {
      fetchResults();
    }
  }, [session, customSession]);

  const getUserEmail = () => {
    if (session?.user?.email) return session.user.email;
    if (customSession?.email) return customSession.email;
    return null;
  };

  const fetchResults = async () => {
    try {
      const email = getUserEmail();
      if (!email) return;

      if (customSession?.isGuest) {
        setResults([]);
        return;
      }

      const key = `vark_results_${email}`;
      const localData = localStorage.getItem(key);
      const data = localData ? JSON.parse(localData) : [];
      setResults(data);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePercentages = (scores) => {
    const total = 16.0;
    return {
      A: ((scores.A / total) * 100).toFixed(1),
      B: ((scores.B / total) * 100).toFixed(1),
      C: ((scores.C / total) * 100).toFixed(1),
      D: ((scores.D / total) * 100).toFixed(1),
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('vark_user_session');
    setCustomSession(null);
    setResults([]);
    setCurrentResult(null);
  };

  const onLoginSuccess = (user) => {
    setCustomSession(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = getUserEmail();
    if (!email) {
      alert("Erro de sessão. Por favor, faça login novamente.");
      return;
    }

    // Parse inputs
    const scores = {
      A: parseInt(formData.a) || 0,
      B: parseInt(formData.b) || 0,
      C: parseInt(formData.c) || 0,
      D: parseInt(formData.d) || 0
    };

    // Validation: Sum must be 16
    const totalScore = scores.A + scores.B + scores.C + scores.D;
    if (totalScore !== 16) {
      alert(`A soma das alternativas deve ser exatemente 16. O total atual é ${totalScore}.`);
      return;
    }

    if (!formData.name.trim()) {
      alert("Por favor, digite seu nome.");
      return;
    }

    setLoading(true);

    const percentages = calculatePercentages(scores);

    // Prepare data object
    const newEntry = {
      id: Date.now(), // Generate ID
      name: formData.name,
      scores,
      percentages,
      timestamp: new Date().toLocaleString()
    };

    try {
      // Save to Local Storage
      const existingData = localStorage.getItem('vark_results_data');
      const resultsArray = existingData ? JSON.parse(existingData) : [];

      // Add new entry to the beginning
      const updatedResults = [newEntry, ...resultsArray];
      localStorage.setItem('vark_results_data', JSON.stringify(updatedResults));

      // Prepare chart data for this specific entry (Client side visualization)
      const chartData = [
        { name: LABELS.A, value: scores.A, color: COLORS.A },
        { name: LABELS.B, value: scores.B, color: COLORS.B },
        { name: LABELS.C, value: scores.C, color: COLORS.C },
        { name: LABELS.D, value: scores.D, color: COLORS.D },
      ].filter(item => item.value > 0);

      // Set current result to show graph
      setCurrentResult({ ...newEntry, chartData });

      // Refresh list
      setResults(updatedResults);

      // Clear form inputs
      setFormData({ name: '', a: '', b: '', c: '', d: '' });

    } catch (error) {
      console.error('Erro ao salvar resultado:', error.message);
      alert('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // If NO session (Supabase or Custom), show Login
  if (!session && !customSession) {
    return <Login onLoginSuccess={onLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 relative">

      {/* Logout Button */}
      <div className="absolute top-6 right-6 flex gap-3">
        <a
          href="/VARK_CA_Wayground.pdf"
          download="VARK_CA_Wayground.pdf"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-500 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <Download size={16} /> Download Avaliação
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Resultados VARK
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Descubra e compartilhe seu estilo de aprendizagem. Insira seus resultados abaixo para gerar seu perfil.
          </p>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-violet-500">
              <Activity /> Inserir Dados
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all outline-none disabled:opacity-50"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'a', label: 'A - Visual', colorKey: 'A' },
                  { id: 'b', label: 'B - Auditivo', colorKey: 'B' },
                  { id: 'c', label: 'C - Leitor/Escrita', colorKey: 'C' },
                  { id: 'd', label: 'D - Cinestésico', colorKey: 'D' }
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: COLORS[field.colorKey] }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleInputChange}
                      min="0"
                      max="16"
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all outline-none disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-400 hover:bg-violet-500 disabled:bg-violet-300 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {loading ? 'Salvando...' : 'Compartilhar Resultados'}
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">
                  Certifique-se de que a soma dos pontos seja igual a 16.
                </p>
              </div>
            </form>
          </div>

          {/* Results Visualization (Current User) */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col justify-center items-center relative overflow-hidden">
            {!currentResult ? (
              <div className="text-center text-slate-400 space-y-4">
                <BarChart3 size={64} className="mx-auto opacity-20" />
                <p>Preencha os dados ao lado para visualizar o seu gráfico personalizado.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Perfil de {currentResult.name}</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                          <feOffset in="blur" dx="3" dy="5" result="offsetBlur" />
                          <feMerge>
                            <feMergeNode in="offsetBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Shadow Layer (No Labels, No Legend) */}
                      <Pie
                        data={currentResult.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        stroke="none"
                        style={{ filter: 'url(#shadow)' }}
                        isAnimationActive={false}
                        legendType="none"
                      >
                        {currentResult.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {/* Top Layer (Labels, With Legend) */}
                      <Pie
                        data={currentResult.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        stroke="none"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {currentResult.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Summary Chips */}
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  {Object.entries(currentResult.scores).filter(([_, val]) => val > 0).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                      <span className="font-semibold" style={{ color: COLORS[key] }}>{LABELS[key]}</span>
                      <span className="font-bold text-slate-900">{value} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="w-full">
          <button
            onClick={() => window.location.href = '/dashboard.html'}
            className="w-full bg-violet-400 hover:bg-violet-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
          >
            <BookOpen size={24} /> Entenda o Significado dos Resultados
          </button>
        </div>

        {/* Global Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-violet-500" /> Histórico de Resultados
            </h2>
            <span className="text-sm font-medium text-slate-500 px-3 py-1 bg-white rounded-full border border-slate-200">
              {results.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4" style={{ color: COLORS.A }}>Visual</th>
                  <th className="px-6 py-4" style={{ color: COLORS.B }}>Auditivo</th>
                  <th className="px-6 py-4" style={{ color: COLORS.C }}>Leitor/Escrita</th>
                  <th className="px-6 py-4" style={{ color: COLORS.D }}>Cinestésico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      Nenhum resultado registrado ainda.
                    </td>
                  </tr>
                ) : (
                  results.map((entry) => (
                    <tr key={entry.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{entry.name}</td>
                      <td className="px-6 py-4 text-slate-500">{entry.timestamp}</td>
                      <td className="px-6 py-4 font-mono">{entry.percentages.A}%</td>
                      <td className="px-6 py-4 font-mono">{entry.percentages.B}%</td>
                      <td className="px-6 py-4 font-mono">{entry.percentages.C}%</td>
                      <td className="px-6 py-4 font-mono">{entry.percentages.D}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
