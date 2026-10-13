import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  PlusCircle,
  X,
  AlertTriangle,
  Shirt,
  Sparkles,
} from 'lucide-react';
import {
  CATEGORIES,
  InventoryItem,
  KidsWearCategory,
  OrderItem,
  StoreSettings,
} from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  storeSettings: StoreSettings;
  onOpenAddInventory: () => void;
  onUpdateStock: (itemId: string, delta: number) => void;
  onAddToCart: (item: InventoryItem, size: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  storeSettings,
  onOpenAddInventory,
  onUpdateStock,
  onAddToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KidsWearCategory>('ALL');
  const [selectedSizePerItem, setSelectedSizePerItem] = useState<Record<string, string>>({});

  const totalStockCount = inventory.reduce((sum, i) => sum + i.stockQuantity, 0);
  const totalStockValue = inventory.reduce(
    (sum, i) => sum + i.stockQuantity * i.retailPrice,
    0
  );

  const filteredItems = inventory.filter((item) => {
    const matchesCat =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-32">
      {/* Top Inventory Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-3xl p-5 shadow-lg shadow-indigo-900/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              {storeSettings.storeName} Stock
            </p>
            <h3 className="text-2xl md:text-3xl font-black mt-0.5">
              {totalStockCount} Pcs in Store
            </h3>
            <p className="text-xs text-amber-300 font-bold mt-1">
              {inventory.length} Garment Designs in Catalog
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-200">Retail Asset Valuation</p>
            <h4 className="text-xl md:text-2xl font-black text-white mt-0.5">
              ₹ {totalStockValue.toFixed(0)}
            </h4>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search kids outfits, SKU, colors..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Slider - Part 1 fix: hidden scrollbars & full width bounds */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar hide-scrollbar w-full max-w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        data-scrollable="true"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer border shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.displayName}</span>
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Shirt className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">
            No kids garments found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
            Add children clothing designs using the button below or tell the AI Voice assistant!
          </p>
          <button
            onClick={onOpenAddInventory}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Kids Wear</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isLowStock = item.stockQuantity < 15;
            const currentSize =
              selectedSizePerItem[item.id] || item.sizes[0] || 'Standard';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.itemCode}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {item.color}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isLowStock
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isLowStock
                        ? `Low Stock (${item.stockQuantity})`
                        : `Stock: ${item.stockQuantity}`}
                    </span>
                  </div>

                  {/* Name */}
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {item.name}
                  </h4>

                  {/* Sizes Chips */}
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      Available Sizes:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setSelectedSizePerItem({
                              ...selectedSizePerItem,
                              [item.id]: s,
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition cursor-pointer ${
                            currentSize === s
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Rate & Stepper & Add to Bill */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-indigo-700">
                      ₹ {item.retailPrice.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-1.5">
                      WS: ₹{item.wholesalePrice.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stock Stepper */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                      <button
                        onClick={() => onUpdateStock(item.id, -1)}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Decrease stock"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.stockQuantity}
                      </span>
                      <button
                        onClick={() => onUpdateStock(item.id, 1)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Increase stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Bill */}
                    <button
                      onClick={() => onAddToCart(item, currentSize)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Bill</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Item Button */}
      <div className="fixed bottom-24 md:bottom-24 right-5 md:right-8 z-30">
        <button
          onClick={onOpenAddInventory}
          className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider shadow-2xl shadow-indigo-600/40 border border-white/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Kids Wear</span>
        </button>
      </div>
    </div>
  );
};
