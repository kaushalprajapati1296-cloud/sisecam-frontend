import React, { useState, useEffect, useMemo } from 'react';
import { LogIn, LogOut, FileText, Package, Activity, Plus, Trash2, Download, Database, PlusCircle, Clock } from 'lucide-react';

// --- AUTHENTICATION MOCK DATA ---
const USERS = [
  { id: 1, name: 'Dr. Kaushal Prajapati', password: '1234' },
  { id: 2, name: 'Naresh Parmar', password: '1234' },
  { id: 3, name: 'Wales Raulker', password: '1234' },
  { id: 4, name: 'Shailesh Rathod', password: '1234' }
];

// Backend API URL (Your Live Render URL)
const API_URL = 'https://sisecam-backend.onrender.com/api';

const getLocalDatetime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 15) return 'A Shift (7 AM - 3 PM)';
  if (hour >= 15 && hour < 23) return 'B Shift (3 PM - 11 PM)';
  return 'C Shift (11 PM - 7 AM)';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('OPD');

  // Postgres Database State
  const [inventory, setInventory] = useState([]);
  const [opdRecords, setOpdRecords] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, opdRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/inventory`),
        fetch(`${API_URL}/opd`),
        fetch(`${API_URL}/inventory_logs`) 
      ]);
      
      const invData = await invRes.json();
      const opdData = await opdRes.json();
      const logsData = await logsRes.json();
      
      setInventory(invData);
      setOpdRecords(opdData);
      setInventoryLogs(logsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-300" />
          <h1 className="text-2xl font-bold">Sisecam OHC Cloud</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-blue-800 px-3 py-1 rounded-full border border-blue-700">
            Dispenser: <span className="font-semibold">{currentUser.name}</span>
          </span>
          <button 
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-2 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b flex px-4 gap-1 shadow-sm">
        {['OPD', 'INVENTORY', 'REPORTS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-4 ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'OPD' && <FileText className="inline w-4 h-4 mr-2" />}
            {tab === 'INVENTORY' && <Package className="inline w-4 h-4 mr-2" />}
            {tab === 'REPORTS' && <Activity className="inline w-4 h-4 mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-blue-600">
            <Activity className="w-8 h-8 animate-spin" />
            <span className="ml-2 font-semibold">Syncing with Cloud...</span>
          </div>
        ) : (
          <>
            {activeTab === 'OPD' && <OPDForm inventory={inventory} dispenserName={currentUser.name} refreshData={fetchData} />}
            {activeTab === 'INVENTORY' && <InventoryManager inventory={inventory} refreshData={fetchData} />}
            {activeTab === 'REPORTS' && <Reports opdRecords={opdRecords} inventory={inventory} inventoryLogs={inventoryLogs} refreshData={fetchData} />}
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// 1. LOGIN SCREEN
// ==========================================
function LoginScreen({ onLogin }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.id === parseInt(selectedUserId));
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Invalid User or Password. (Hint: password is 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Database className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Sisecam OHC Login</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center border border-red-200">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Dispenser</label>
            <select 
              className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">-- Select Name --</option>
              {USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. OPD FORM COMPONENT
// ==========================================
function OPDForm({ inventory, dispenserName, refreshData }) {
  const [formData, setFormData] = useState({
    recordDate: getLocalDatetime(),
    shift: getCurrentShift(),
    patientName: '',
    empType: 'Company',
    sapId: '',
    contractorName: '',
    symptoms: ''
  });
  const [medicinesGiven, setMedicinesGiven] = useState([{ drugId: '', qty: 1 }]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMedChange = (index, field, value) => {
    const updated = [...medicinesGiven];
    updated[index][field] = value;
    setMedicinesGiven(updated);
  };

  const addMedField = () => setMedicinesGiven([...medicinesGiven, { drugId: '', qty: 1 }]);
  
  const removeMedField = (index) => {
    const updated = medicinesGiven.filter((_, i) => i !== index);
    setMedicinesGiven(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const workingInventory = JSON.parse(JSON.stringify(inventory));

      for (let i = 0; i < medicinesGiven.length; i++) {
        const med = medicinesGiven[i];
        if (!med.drugId) continue;
        
        const qty = parseInt(med.qty);
        if (qty <= 0 || isNaN(qty)) throw new Error(`Invalid quantity in row ${i + 1}`);

        const invItem = workingInventory.find(item => item.id == med.drugId);
        if (!invItem) throw new Error(`Drug not found in row ${i + 1}`);
        if (invItem.stock < qty) throw new Error(`Insufficient stock for ${invItem.name}. Available: ${invItem.stock}`);

        invItem.stock -= qty; 
      }

      const payload = {
        dispenser: dispenserName,
        ...formData,
        recordDate: new Date(formData.recordDate).toISOString(), // Ensure standard format
        medicines: medicinesGiven
          .filter(m => m.drugId)
          .map(m => {
             const invItem = inventory.find(i => i.id == m.drugId);
             return { id: invItem.id, name: invItem.name, qty: parseInt(m.qty) };
          })
      };

      const res = await fetch(`${API_URL}/opd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save OPD');
      }

      setMessage('✅ Cloud Saved: OPD Record Saved & Inventory Deducted!');
      
      // Reset form
      setFormData({ 
        recordDate: getLocalDatetime(),
        shift: getCurrentShift(),
        patientName: '', empType: 'Company', sapId: '', contractorName: '', symptoms: '' 
      });
      setMedicinesGiven([{ drugId: '', qty: 1 }]);
      await refreshData();
      
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">New OPD Registration</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
          
          {/* Date and Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" /> Date & Time of Visit
            </label>
            <input 
              type="datetime-local" 
              required 
              value={formData.recordDate} 
              onChange={e => setFormData({...formData, recordDate: e.target.value})} 
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          {/* Shift */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              Company Shift
            </label>
            <select 
              value={formData.shift} 
              onChange={e => setFormData({...formData, shift: e.target.value})} 
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="A Shift (7 AM - 3 PM)">A Shift (7 AM - 3 PM)</option>
              <option value="B Shift (3 PM - 11 PM)">B Shift (3 PM - 11 PM)</option>
              <option value="C Shift (11 PM - 7 AM)">C Shift (11 PM - 7 AM)</option>
              <option value="General Shift">General Shift</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name *</label>
            <input type="text" required value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Employee Type *</label>
            <select value={formData.empType} onChange={e => setFormData({...formData, empType: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Company">Company Employee</option>
              <option value="Contract">Contract Employee</option>
            </select>
          </div>

          {formData.empType === 'Company' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">SAP ID *</label>
              <input type="text" required value={formData.sapId} onChange={e => setFormData({...formData, sapId: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contractor Name *</label>
              <input type="text" required value={formData.contractorName} onChange={e => setFormData({...formData, contractorName: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Symptoms *</label>
            <input type="text" required value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Headache, Fever..." />
          </div>
        </div>

        {/* Medicines */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-slate-700">Medicines Dispensed</label>
            <button type="button" onClick={addMedField} className="text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 py-1 px-3 rounded flex items-center gap-1 transition">
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          </div>
          
          <div className="space-y-3">
            {medicinesGiven.map((med, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  {index === 0 && <label className="block text-xs text-slate-500 mb-1">Select Drug</label>}
                  <select 
                    value={med.drugId} 
                    onChange={e => handleMedChange(index, 'drugId', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- None --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stock: {item.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  {index === 0 && <label className="block text-xs text-slate-500 mb-1">Quantity</label>}
                  <input 
                    type="number" 
                    min="1"
                    value={med.qty} 
                    onChange={e => handleMedChange(index, 'qty', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {medicinesGiven.length > 1 && (
                  <button type="button" onClick={() => removeMedField(index)} className="p-2 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 hover:shadow-lg transition disabled:opacity-50">
          {isSubmitting ? 'Syncing to Cloud...' : 'Save OPD Record'}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 3. INVENTORY MANAGER
// ==========================================
function InventoryManager({ inventory, refreshData }) {
  const [newDrug, setNewDrug] = useState({ name: '', stock: '' });
  const [restockInputs, setRestockInputs] = useState({});
  const [message, setMessage] = useState('');

  const handleAddDrug = async (e) => {
    e.preventDefault();
    if (!newDrug.name.trim() || newDrug.stock === '') return;
    
    try {
      await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDrug.name.trim(), stock: parseInt(newDrug.stock) })
      });
      setNewDrug({ name: '', stock: '' });
      setMessage("✅ New drug added & logged!");
      refreshData();
      setTimeout(() => setMessage(''), 3000);
    } catch(err) {
      console.error("Failed to add drug", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
      setMessage("🗑️ Drug deleted permanently.");
      refreshData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleRestock = async (id, drugName) => {
    const qtyAdded = parseInt(restockInputs[id]);
    if (!qtyAdded || qtyAdded <= 0) return;

    try {
      await fetch(`${API_URL}/inventory/${id}/add`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qtyAdded, drugName })
      });
      
      setRestockInputs({ ...restockInputs, [id]: '' });
      setMessage(`📦 Added ${qtyAdded} to ${drugName}!`);
      refreshData();
      setTimeout(() => setMessage(''), 3000);
    } catch(err) {
      console.error("Restock error", err);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded shadow-sm">
          {message}
        </div>
      )}

      {/* Add New Drug */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Add New Drug to System</h2>
        <form onSubmit={handleAddDrug} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Drug Name</label>
            <input type="text" required value={newDrug.name} onChange={e => setNewDrug({...newDrug, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Cough Syrup 100ml" />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Stock</label>
            <input type="number" required min="0" value={newDrug.stock} onChange={e => setNewDrug({...newDrug, stock: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-slate-800 text-white font-semibold rounded hover:bg-slate-900 transition flex items-center justify-center gap-2 h-[42px]">
            <Plus className="w-4 h-4" /> Create Drug
          </button>
        </form>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" /> Database Stock Levels
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Drug Name</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Add Stock (Restock)</th>
                <th className="p-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 && (
                <tr><td colSpan="4" className="p-4 text-center italic text-slate-400">Inventory is empty. Add a drug above.</td></tr>
              )}
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4">
                    <span className="font-bold text-lg text-slate-800">{item.stock}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        placeholder="+ Qty"
                        value={restockInputs[item.id] || ''}
                        onChange={(e) => setRestockInputs({ ...restockInputs, [item.id]: e.target.value })}
                        className="w-24 p-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <button 
                        onClick={() => handleRestock(item.id, item.name)}
                        disabled={!restockInputs[item.id]}
                        className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition disabled:opacity-50"
                        title="Add to stock"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition" title="Delete Drug">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. REPORTS COMPONENT
// ==========================================
function Reports({ opdRecords, inventory, inventoryLogs, refreshData }) {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // Filter Data by Date
  const filteredRecords = useMemo(() => {
    return opdRecords.filter(record => {
      const recordDate = record.date.split('T')[0]; 
      return recordDate >= startDate && recordDate <= endDate;
    });
  }, [opdRecords, startDate, endDate]);

  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter(log => {
      const logDate = log.date.split('T')[0]; 
      return logDate >= startDate && logDate <= endDate;
    });
  }, [inventoryLogs, startDate, endDate]);

  const consumptionData = useMemo(() => {
    const usage = {};
    filteredRecords.forEach(record => {
      let meds = record.medicines;
      if (typeof meds === 'string') {
        try { meds = JSON.parse(meds); } catch (e) { meds = []; }
      }
      if (meds && Array.isArray(meds)) {
        meds.forEach(med => {
          if (usage[med.name]) {
            usage[med.name] += med.qty;
          } else {
            usage[med.name] = med.qty;
          }
        });
      }
    });
    return Object.keys(usage).map(name => ({
      name,
      consumedQty: usage[name]
    })).sort((a,b) => b.consumedQty - a.consumedQty);
  }, [filteredRecords]);

  const downloadCSV = (filename, headers, dataRows) => {
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.map(val => `"${(''+val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadOPD = () => {
    const headers = ['Date', 'Time', 'Shift', 'Patient Name', 'Type', 'ID/Contractor', 'Symptoms', 'Medicines Dispensed', 'Dispenser'];
    const rows = filteredRecords.map(r => {
      const d = new Date(r.date);
      let meds = r.medicines;
      if (typeof meds === 'string') {
        try { meds = JSON.parse(meds); } catch (e) { meds = []; }
      }
      const medsString = meds && Array.isArray(meds) ? meds.map(m => `${m.name} (${m.qty})`).join(' + ') : '';
      
      return [
        d.toLocaleDateString(), d.toLocaleTimeString(), r.shift || 'N/A', r.patient_name, r.emp_type,
        r.emp_type === 'Company' ? r.sap_id : r.contractor_name,
        r.symptoms, medsString, r.dispenser
      ];
    });
    downloadCSV(`OPD_Report_${startDate}_to_${endDate}`, headers, rows);
  };

  const handleDownloadConsumption = () => {
    const headers = ['Drug Name', 'Total Consumed Quantity'];
    const rows = consumptionData.map(c => [c.name, c.consumedQty]);
    downloadCSV(`Consumption_Report_${startDate}_to_${endDate}`, headers, rows);
  };

  const handleDownloadLogs = () => {
    const headers = ['Date', 'Time', 'Drug Name', 'Quantity Added', 'Action Type'];
    const rows = filteredLogs.map(l => {
      const d = new Date(l.date);
      return [d.toLocaleDateString(), d.toLocaleTimeString(), l.drug_name, l.qty_added, l.action_type];
    });
    downloadCSV(`Restock_Logs_${startDate}_to_${endDate}`, headers, rows);
  };

  const handleDownloadInventory = () => {
    const headers = ['Drug Name', 'Current Stock Quantity'];
    const rows = inventory.map(i => [i.name, i.stock]);
    downloadCSV(`Current_Inventory_Report`, headers, rows);
  };

  const handleDeleteOPDRecord = async (id, patientName) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete the record for ${patientName}?\n\nThis will delete the record forever and automatically RETURN the dispensed medicines back to the inventory.`)) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/opd/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      
      alert('✅ Record deleted successfully. Inventory has been restored!');
      refreshData();
    } catch (err) {
      alert(`❌ Error deleting record: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: OPD Records */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col max-h-[500px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">OPD Records</h3>
              <p className="text-sm text-slate-500">Found {filteredRecords.length} records</p>
            </div>
            <button onClick={handleDownloadOPD} disabled={filteredRecords.length===0} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 text-sm font-semibold">
              <Download className="w-4 h-4" /> Download OPD
            </button>
          </div>
          <div className="overflow-y-auto border rounded flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-2 border-b">Date & Time</th>
                  <th className="p-2 border-b">Shift</th>
                  <th className="p-2 border-b">Patient</th>
                  <th className="p-2 border-b text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}<br/>
                      <span className="text-[10px] text-slate-500">{new Date(r.date).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-2 whitespace-nowrap text-xs font-semibold text-slate-600">{r.shift?.split(' ')[0] || '-'}</td>
                    <td className="p-2 font-medium">
                      {r.patient_name} <br/><span className="text-[10px] text-slate-500">{r.emp_type}</span>
                    </td>
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => handleDeleteOPDRecord(r.id, r.patient_name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"
                        title="Delete record & restore inventory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-slate-500">No records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Consumption & Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between max-h-[500px]">
          <div className="flex-1 overflow-hidden flex flex-col mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Drug Consumption</h3>
              </div>
              <button onClick={handleDownloadConsumption} disabled={consumptionData.length===0} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-50 text-xs font-semibold">
                <Download className="w-3 h-3" /> Consumption
              </button>
            </div>
            <div className="overflow-y-auto border rounded flex-1 mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 border-b">Drug Name</th>
                    <th className="p-2 border-b text-right">Qty Consumed</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionData.map(c => (
                    <tr key={c.name} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-700">{c.name}</td>
                      <td className="p-2 text-right font-bold text-slate-800">{c.consumedQty}</td>
                    </tr>
                  ))}
                  {consumptionData.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-slate-500">No consumption data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
             <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Restock History Logs</h4>
                  <p className="text-[10px] text-green-600">Track who added stock & when</p>
                </div>
                <button onClick={handleDownloadLogs} disabled={filteredLogs.length===0} className="flex items-center gap-2 bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 transition disabled:opacity-50 text-xs font-semibold">
                  <Download className="w-3 h-3" /> Get Logs
                </button>
             </div>

             <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Full Inventory Report</h4>
                  <p className="text-[10px] text-slate-500">Download current total stock levels</p>
                </div>
                <button onClick={handleDownloadInventory} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-900 transition text-xs font-semibold">
                  <Download className="w-3 h-3" /> Inventory
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}