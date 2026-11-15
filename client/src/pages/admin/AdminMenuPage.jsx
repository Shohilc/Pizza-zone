import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Sparkles,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { menuApi } from '../../api/menuApi';

export function AdminMenuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
    isVeg: true,
    isAvailable: true,
    badge: '',
    preparationTimeMinutes: 15,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories(),
      ]);
      if (itemsRes?.items) setItems(itemsRes.items);
      if (catsRes?.categories) setCategories(catsRes.categories);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async (id) => {
    try {
      const res = await menuApi.toggleAvailability(id);
      if (res?.success) {
        setItems((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isAvailable: res.isAvailable } : item))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await menuApi.deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: categories[0]?._id || '',
      price: '',
      description: '',
      image: '',
      isVeg: true,
      isAvailable: true,
      badge: '',
      preparationTimeMinutes: 15,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category?._id || item.category,
      price: item.price,
      description: item.description || '',
      image: item.image,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      badge: item.badge || '',
      preparationTimeMinutes: item.preparationTimeMinutes || 15,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await menuApi.uploadImage(file);
      if (res?.success && res?.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
      }
    } catch (err) {
      setFormError(err.message || 'Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFormError('Item name is required');
    if (!formData.category) return setFormError('Please select a category');
    if (!formData.price || Number(formData.price) < 0) return setFormError('Enter a valid price');
    if (!formData.image.trim()) return setFormError('Please provide an image URL or upload one');

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        description: formData.description.trim(),
        image: formData.image.trim(),
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        badge: formData.badge.trim() || null,
        preparationTimeMinutes: Number(formData.preparationTimeMinutes) || 15,
      };

      if (editingItem) {
        const res = await menuApi.updateMenuItem(editingItem._id, payload);
        if (res?.success && res?.item) {
          setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.item : i)));
          setModalOpen(false);
        }
      } else {
        const res = await menuApi.createMenuItem(payload);
        if (res?.success && res?.item) {
          setItems((prev) => [res.item, ...prev]);
          setModalOpen(false);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCat !== 'all') {
      const cId = item.category?._id || item.category;
      if (cId !== selectedCat) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back and Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Queue</span>
            </Link>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Menu Management</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Add new snacks, update prices, or instantly toggle stock availability
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Snack Item</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCat === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Items ({items.length})
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCat(c._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCat === c._id
                    ? 'bg-brand-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Menu Items Table / Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-4 rounded-2xl border border-stone-200 animate-pulse h-16" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
            <h3 className="text-sm font-bold text-stone-900">No items match your filter</h3>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-stone-100">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-stone-100 flex-shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border bg-white flex items-center justify-center ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 mt-1 line-clamp-1 max-w-lg">
                        {item.description || 'No description provided'}
                      </p>

                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500 font-medium">
                        <span className="font-bold text-stone-900 text-sm">₹{item.price}</span>
                        <span>•</span>
                        <span>{item.category?.name || 'Category'}</span>
                        <span>•</span>
                        <span>{item.preparationTimeMinutes || 15} mins prep</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Controls */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Stock Switcher */}
                    <button
                      onClick={() => handleToggleAvailability(item._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        item.isAvailable
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item._id, item.name)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingItem ? 'Edit Snack Item' : 'Add New Snack Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cheesy Paneer Supreme Pizza"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="199"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fresh ingredients, melted cheese, spicy tandoori herbs..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Image URL or Cloudinary Upload */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl cursor-pointer text-xs font-semibold text-stone-700 flex items-center gap-1 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Bestseller / New"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.preparationTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, preparationTimeMinutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Vegetarian item</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Available in stock</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

