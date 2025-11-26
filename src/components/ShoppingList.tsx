import { useState, useEffect } from 'react';
import { Check, RefreshCw, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShoppingListItem {
  name: string;
  qty: number;
  unit: string;
}

interface InventoryItem {
  name: string;
  qty: number;
  unit: string;
}

interface IngredientBreakdown {
  date: string;
  dish: string;
  category: string;
  dishName: string;
  qty: number;
  unit: string;
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  getIngredientBreakdown: (ingredientName: string) => IngredientBreakdown[];
  inventory: InventoryItem[];
  getTotalNeeded: (ingredientName: string) => { qty: number; unit: string } | null;
  onInventoryUpdate: () => void;
  onShoppingMode: () => void;
}

function getWeekIdentifier(): string {
  const now = new Date();
  const year = now.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const daysSinceFirstDay = Math.floor((now.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber}`;
}

export function ShoppingList({ items, getIngredientBreakdown, inventory, getTotalNeeded, onInventoryUpdate, onShoppingMode }: ShoppingListProps) {
  const { user } = useAuth();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const weekId = getWeekIdentifier();

  useEffect(() => {
    if (user) {
      loadCheckedItems();
    }
  }, [user?.id, weekId]);

  const loadCheckedItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('shopping_list_checks')
      .select('item_name, is_checked')
      .eq('user_id', user.id)
      .eq('week_identifier', weekId);

    if (!error && data) {
      const checked = new Set<string>();
      data.forEach(item => {
        if (item.is_checked) {
          checked.add(item.item_name);
        }
      });
      setCheckedItems(checked);
    }
  };

  const toggleCheck = async (itemName: string) => {
    if (!user) return;

    const isCurrentlyChecked = checkedItems.has(itemName);
    const newCheckedState = !isCurrentlyChecked;

    const newCheckedItems = new Set(checkedItems);
    if (newCheckedState) {
      newCheckedItems.add(itemName);
    } else {
      newCheckedItems.delete(itemName);
    }
    setCheckedItems(newCheckedItems);

    const { error } = await supabase
      .from('shopping_list_checks')
      .upsert({
        user_id: user.id,
        week_identifier: weekId,
        item_name: itemName,
        is_checked: newCheckedState,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,week_identifier,item_name'
      });

    if (error) {
      const revertedItems = new Set(checkedItems);
      if (isCurrentlyChecked) {
        revertedItems.add(itemName);
      } else {
        revertedItems.delete(itemName);
      }
      setCheckedItems(revertedItems);
    } else if (newCheckedState) {
      // チェックを入れた場合は在庫に追加
      const item = items.find(i => i.name === itemName);
      if (item) {
        const { data: existingItem } = await supabase
          .from('inventory')
          .select('qty')
          .eq('user_id', user.id)
          .eq('name', item.name)
          .eq('unit', item.unit)
          .maybeSingle();

        if (existingItem) {
          // 既存の在庫に追加
          await supabase
            .from('inventory')
            .update({ qty: existingItem.qty + item.qty })
            .eq('user_id', user.id)
            .eq('name', item.name)
            .eq('unit', item.unit);
        } else {
          // 新規在庫として追加
          await supabase
            .from('inventory')
            .insert({
              user_id: user.id,
              name: item.name,
              qty: item.qty,
              unit: item.unit,
            });
        }

        // 在庫更新を通知
        onInventoryUpdate();
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onInventoryUpdate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="disney-card border-4 border-lime-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">在庫を追加・変更したら更新ボタンを押してください</p>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="disney-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-400 to-primary-500 hover:from-accent-500 hover:to-primary-600 text-white font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            更新
          </button>
          <button
            onClick={onShoppingMode}
            className="disney-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white font-bold transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            買い物モード
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items
          .sort((a, b) => {
            const aChecked = checkedItems.has(a.name);
            const bChecked = checkedItems.has(b.name);
            if (aChecked === bChecked) return 0;
            return aChecked ? 1 : -1;
          })
          .map((item, i) => {
          const breakdown = getIngredientBreakdown(item.name);
          const isChecked = checkedItems.has(item.name);
          const totalNeeded = getTotalNeeded(item.name);
          const inventoryItem = inventory.find(inv => inv.name === item.name && inv.unit === item.unit);

          return (
            <li key={i} className="disney-card border-3 border-disney-blue-200 p-3 transition-all h-full hover:border-disney-blue-400">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleCheck(item.name)}
                  className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${
                    isChecked
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300 hover:border-green-400'
                  }`}
                >
                  {isChecked && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className={`font-bold text-base transition-all truncate ${
                      isChecked ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      isChecked
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      合計 {item.qty}{item.unit}
                    </span>
                  </div>

                  {breakdown.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1.5 font-semibold">使用内訳:</p>
                      <ul className="space-y-0.5">
                        {breakdown.map((bd, j) => {
                          const categoryColor =
                            bd.category === '主食' ? 'text-amber-600' :
                            bd.category === '主菜' ? 'text-orange-600' :
                            bd.category === '副菜' ? 'text-green-600' :
                            'text-blue-600';

                          const dotColor = isChecked ? 'bg-gray-300' :
                            bd.category === '主食' ? 'bg-amber-400' :
                            bd.category === '主菜' ? 'bg-orange-400' :
                            bd.category === '副菜' ? 'bg-green-400' :
                            'bg-blue-400';

                          return (
                            <li key={j} className={`text-xs flex items-center justify-between ${
                              isChecked ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <span className="flex items-center gap-1.5 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}></span>
                                <span className="truncate">
                                  {bd.date} <span className={`font-semibold ${isChecked ? 'text-gray-400' : categoryColor}`}>[{bd.category}]</span> {bd.dishName}
                                </span>
                              </span>
                              <span className="text-gray-500 ml-2 whitespace-nowrap">{bd.qty}{bd.unit}</span>
                            </li>
                          );
                        })}
                        {inventoryItem && (
                          <li className={`text-xs flex items-center justify-between font-semibold ${
                            isChecked ? 'text-gray-400' : 'text-blue-600'
                          }`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isChecked ? 'bg-gray-300' : 'bg-blue-400'
                              }`}></span>
                              在庫
                            </span>
                            <span className="ml-2 whitespace-nowrap">{inventoryItem.qty}{inventoryItem.unit}</span>
                          </li>
                        )}
                      </ul>
                      {totalNeeded && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                          <div className="text-xs flex items-center justify-between">
                            <span className={`font-semibold ${
                              isChecked ? 'text-gray-400' : 'text-gray-700'
                            }`}>必要な合計:</span>
                            <span className={`font-bold ${
                              isChecked ? 'text-gray-400' : 'text-gray-900'
                            }`}>{totalNeeded.qty}{totalNeeded.unit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
