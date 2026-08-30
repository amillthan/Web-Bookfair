import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Edit3,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  Plus,
  Save,
  X,
} from "lucide-react";
import Admin from "../../services/Admin";
import { motion, AnimatePresence } from "framer-motion";

const AdminStallPricing = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [editForm, setEditForm] = useState({
    basePrice: "",
    weekendMultiplier: "",
    peakHourMultiplier: "",
    discountPercentage: "",
  });

  // Notification
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Mock data for pricing - replace with actual API call
  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch real stall data and group by type
      const stallsData = await Admin.getAllStalls();

      // Group stalls by size/type and calculate pricing info
      const pricingMap = {};

      stallsData.forEach(stall => {
        const type = stall.size; // Using size as the type
        if (!pricingMap[type]) {
          pricingMap[type] = {
            id: type,
            stallType: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + " Stall",
            basePrice: stall.price || 0,
            count: 0,
            totalPrice: 0,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        pricingMap[type].count += 1;
        pricingMap[type].totalPrice += stall.price || 0;
        // Update base price to average if multiple stalls
        pricingMap[type].basePrice = pricingMap[type].totalPrice / pricingMap[type].count;
      });

      // Convert to array and add default multipliers
      const pricingData = Object.values(pricingMap).map(item => ({
        ...item,
        weekendMultiplier: 1.5, // Default weekend multiplier
        peakHourMultiplier: 1.2, // Default peak hour multiplier
        discountPercentage: 10, // Default discount
      }));

      setPricing(pricingData);
    } catch (err) {
      console.error("Error fetching pricing:", err);
      setError("Failed to load pricing data. Please try again.");
      setPricing([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // Filtered pricing
  const filteredPricing = useMemo(() => {
    let data = [...pricing];

    // Search by stall type
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter((item) =>
        (item.stallType || "").toLowerCase().includes(q)
      );
    }

    return data;
  }, [pricing, searchTerm]);

  const handleEditPricing = (item) => {
    setSelectedPricing(item);
    setEditForm({
      basePrice: item.basePrice.toString(),
      weekendMultiplier: item.weekendMultiplier.toString(),
      peakHourMultiplier: item.peakHourMultiplier.toString(),
      discountPercentage: item.discountPercentage.toString(),
    });
    setShowEditModal(true);
  };

  const handleSavePricing = async () => {
    if (!selectedPricing) return;

    try {
      // TODO: Replace with actual API call
      // await Admin.updatePricing(selectedPricing.id, editForm);

      // Update local state for now
      setPricing(prev =>
        prev.map(item =>
          item.id === selectedPricing.id
            ? {
                ...item,
                ...editForm,
                basePrice: parseFloat(editForm.basePrice),
                weekendMultiplier: parseFloat(editForm.weekendMultiplier),
                peakHourMultiplier: parseFloat(editForm.peakHourMultiplier),
                discountPercentage: parseInt(editForm.discountPercentage),
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : item
        )
      );

      showNotification("Pricing updated successfully", "success");
      setShowEditModal(false);
      setSelectedPricing(null);
    } catch (err) {
      console.error("Error updating pricing:", err);
      showNotification("Failed to update pricing", "error");
    }
  };

  const calculateEffectivePrice = (item) => {
    const base = item.basePrice;
    const weekend = base * item.weekendMultiplier;
    const peak = base * item.peakHourMultiplier;
    const discount = base * (item.discountPercentage / 100);
    return { base, weekend, peak, discount: base - discount };
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Stall Pricing Management</h1>
          <p className="text-slate-300">Configure pricing rules and rates for different stall types</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-slate-900/50 rounded-lg shadow-sm border border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stall types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchPricing}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Pricing Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Stall Types</p>
                <p className="text-2xl font-bold text-white">{pricing.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-600">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Average Base Price</p>
                <p className="text-2xl font-bold text-white">
                  ${pricing.length > 0 ? (pricing.reduce((sum, item) => sum + item.basePrice, 0) / pricing.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-600">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Last Updated</p>
                <p className="text-lg font-bold text-white">
                  {pricing.length > 0 ? Math.max(...pricing.map(item => new Date(item.lastUpdated).getTime())) === -Infinity ? 'Never' : new Date(Math.max(...pricing.map(item => new Date(item.lastUpdated).getTime()))).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-slate-900/50 rounded-lg shadow-sm border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-300">Loading pricing data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 text-red-600" />
              <span className="ml-2 text-red-600">{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Stall Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Weekend Multiplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Peak Hour Multiplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Discount %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredPricing.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        No pricing data found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPricing.map((item) => {
                      const prices = calculateEffectivePrice(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {item.stallType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">${item.basePrice.toFixed(2)}</div>
                            <div className="text-xs text-slate-400">Base rate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{item.weekendMultiplier}x</div>
                            <div className="text-xs text-slate-400">${prices.weekend.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{item.peakHourMultiplier}x</div>
                            <div className="text-xs text-slate-400">${prices.peak.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{item.discountPercentage}%</div>
                            <div className="text-xs text-green-400">${prices.discount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditPricing(item)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
                              title="Edit Pricing"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Pricing Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-800"
              >
                <h3 className="text-lg font-medium text-white mb-4">Edit Pricing</h3>
                <p className="text-slate-300 mb-6">
                  Update pricing for {selectedPricing?.stallType}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Base Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.basePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Weekend Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.weekendMultiplier}
                      onChange={(e) => setEditForm(prev => ({ ...prev, weekendMultiplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Peak Hour Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.peakHourMultiplier}
                      onChange={(e) => setEditForm(prev => ({ ...prev, peakHourMultiplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.discountPercentage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discountPercentage: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-white bg-slate-700 rounded-lg hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePricing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminStallPricing;