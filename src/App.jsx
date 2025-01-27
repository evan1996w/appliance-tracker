import React, { useState, useEffect } from 'react';

const App = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('settings');
      return saved ? JSON.parse(saved) : { gasPrice: 3.50 };
    } catch (error) {
      return { gasPrice: 3.50 };
    }
  });

  const [pickups, setPickups] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  const [newPickup, setNewPickup] = useState({
    date: new Date().toISOString().split('T')[0],
    itemType: '',
    potentialValue: '',
    distance: '',
    timePickup: '',
    timePrep: '',
    timeListing: '',
    actualSalePrice: '',
    notes: ''
  });

  const [metrics, setMetrics] = useState({
    totalProfit: 0,
    avgProfitPerMile: 0,
    avgProfitPerHour: 0,
    totalGasCost: 0,
    netProfit: 0,
    bestPerformingRadius: 0,
    totalItems: 0
  });

  useEffect(() => {
    try {
      const savedPickups = localStorage.getItem('pickups');
      if (savedPickups) {
        setPickups(JSON.parse(savedPickups));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pickups', JSON.stringify(pickups));
      localStorage.setItem('settings', JSON.stringify(settings));
      calculateMetrics(pickups);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [pickups, settings]);

  const calculateMetrics = (data) => {
    if (data.length === 0) return;

    const totalProfit = data.reduce((sum, pickup) => 
      sum + (Number(pickup.actualSalePrice) || 0), 0);
    const totalMiles = data.reduce((sum, pickup) => 
      sum + (Number(pickup.distance) || 0), 0);
    const totalGasCost = totalMiles * (settings.gasPrice / 20); // Assuming 20 MPG average
    const totalHours = data.reduce((sum, pickup) => {
      const pickupTime = Number(pickup.timePickup) || 0;
      const prepTime = Number(pickup.timePrep) || 0;
      const listingTime = Number(pickup.timeListing) || 0;
      return sum + pickupTime + prepTime + listingTime;
    }, 0);

    setMetrics({
      totalProfit: totalProfit.toFixed(2),
      avgProfitPerMile: totalMiles ? (totalProfit / totalMiles).toFixed(2) : 0,
      avgProfitPerHour: totalHours ? (totalProfit / totalHours).toFixed(2) : 0,
      totalGasCost: totalGasCost.toFixed(2),
      netProfit: (totalProfit - totalGasCost).toFixed(2),
      bestPerformingRadius: calculateBestRadius(data),
      totalItems: data.length
    });
  };

  const calculateBestRadius = (data) => {
    const radiusGroups = {};
    data.forEach(pickup => {
      const radius = Math.floor(Number(pickup.distance) / 5) * 5;
      if (!radiusGroups[radius]) {
        radiusGroups[radius] = { profit: 0, count: 0 };
      }
      radiusGroups[radius].profit += Number(pickup.actualSalePrice) || 0;
      radiusGroups[radius].count += 1;
    });

    let bestRadius = 0;
    let bestProfitPerTrip = 0;
    Object.entries(radiusGroups).forEach(([radius, data]) => {
      const profitPerTrip = data.profit / data.count;
      if (profitPerTrip > bestProfitPerTrip) {
        bestProfitPerTrip = profitPerTrip;
        bestRadius = Number(radius);
      }
    });
    return bestRadius;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPickups = [...pickups, {...newPickup, id: Date.now()}];
    setPickups(updatedPickups);
    setNewPickup({
      date: new Date().toISOString().split('T')[0],
      itemType: '',
      potentialValue: '',
      distance: '',
      timePickup: '',
      timePrep: '',
      timeListing: '',
      actualSalePrice: '',
      notes: ''
    });
  };

  const deletePickup = (id) => {
    setPickups(pickups.filter(pickup => pickup.id !== id));
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ pickups, settings }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appliance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Appliance Tracker</h1>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Settings</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Gas Price per Gallon ($)</label>
            <input
              type="number"
              value={settings.gasPrice}
              onChange={(e) => setSettings({...settings, gasPrice: e.target.value})}
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>
          <button 
            onClick={exportData}
            className="mt-4 w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Export Data Backup
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={newPickup.date}
              onChange={(e) => setNewPickup({...newPickup, date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Item Type</label>
            <input
              value={newPickup.itemType}
              onChange={(e) => setNewPickup({...newPickup, itemType: e.target.value})}
              placeholder="e.g., Washer, Dryer, Stove"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Potential Value ($)</label>
            <input
              type="number"
              value={newPickup.potentialValue}
              onChange={(e) => setNewPickup({...newPickup, potentialValue: e.target.value})}
              placeholder="0.00"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Distance (miles)</label>
            <input
              type="number"
              value={newPickup.distance}
              onChange={(e) => setNewPickup({...newPickup, distance: e.target.value})}
              placeholder="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Time (hrs)</label>
              <input
                type="number"
                value={newPickup.timePickup}
                onChange={(e) => setNewPickup({...newPickup, timePickup: e.target.value})}
                placeholder="0.0"
                step="0.25"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prep Time (hrs)</label>
              <input
                type="number"
                value={newPickup.timePrep}
                onChange={(e) => setNewPickup({...newPickup, timePrep: e.target.value})}
                placeholder="0.0"
                step="0.25"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Listing Time (hrs)</label>
              <input
                type="number"
                value={newPickup.timeListing}
                onChange={(e) => setNewPickup({...newPickup, timeListing: e.target.value})}
                placeholder="0.0"
                step="0.25"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Actual Sale Price ($)</label>
            <input
              type="number"
              value={newPickup.actualSalePrice}
              onChange={(e) => setNewPickup({...newPickup, actualSalePrice: e.target.value})}
              placeholder="0.00"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input
              value={newPickup.notes}
              onChange={(e) => setNewPickup({...newPickup, notes: e.target.value})}
              placeholder="Any additional details..."
              className="w-full p-2 border rounded"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Add Pickup
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <h2 className="text-xl font-bold mb-4">Business Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-600">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">${metrics.totalProfit}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-600">Gas Costs</h3>
            <p className="text-2xl font-bold text-red-600">-${metrics.totalGasCost}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded col-span-2">
            <h3 className="font-medium text-gray-600">Net Profit</h3>
            <p className="text-2xl font-bold text-blue-600">${metrics.netProfit}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-600">Profit/Mile</h3>
            <p className="text-2xl font-bold">${metrics.avgProfitPerMile}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-600">Profit/Hour</h3>
            <p className="text-2xl font-bold">${metrics.avgProfitPerHour}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Recent Pickups</h2>
        <div className="space-y-4">
          {pickups.slice().reverse().map((pickup) => (
            <div key={pickup.id} className="border rounded p-4 relative">
              <button 
                onClick={() => deletePickup(pickup.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-bold">{pickup.itemType}</p>
                  <p className="text-sm text-gray-600">Date: {pickup.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${pickup.actualSalePrice}</p>
                  <p className="text-sm text-gray-600">{pickup.distance} miles</p>
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  Time: {Number(pickup.timePickup || 0) + Number(pickup.timePrep || 0) + Number(pickup.timeListing || 0)} hrs
                </div>
                {pickup.notes && (
                  <p className="col-span-2 text-sm text-gray-600">{pickup.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
