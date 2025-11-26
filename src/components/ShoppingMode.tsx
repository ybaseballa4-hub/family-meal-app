import { useState, useEffect } from 'react';
import { Check, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShoppingItem {
  name: string;
  qty: number;
  unit: string;
}

interface ShoppingModeProps {
  items: ShoppingItem[];
  onBack: () => void;
  onInventoryUpdate: () => void;
}

function getWeekIdentifier(): string {
  const now = new Date();
  const year = now.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const daysSinceFirstDay = Math.floor((now.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber}`;
}

function categorizeItem(itemName: string): { category: string; bgColor: string; borderColor: string; textColor: string; badgeColor: string } {
  const vegetables = ['玉ねぎ', 'じゃがいも', 'にんじん', 'キャベツ', 'ニラ', '長ねぎ', 'レタス', '大根', 'ほうれん草', 'トマト', 'アボカド', 'もやし'];
  const meat = ['豚肉', '合いびき肉', '豚ひき肉', '鶏肉', '鶏胸肉', '鶏もも肉', 'ベーコン', 'ハム'];
  const fish = ['鮭', '魚'];
  const seasoning = ['カレールー', 'シチューのルー', 'ごま油', 'ケチャップ', 'みりん', '味噌', 'オリーブオイル', '豆板醤', '片栗粉'];
  const grains = ['米', 'パスタ'];
  const dairy = ['卵', '牛乳', 'パルメザンチーズ'];
  const tofu = ['木綿豆腐'];
  const other = ['パン粉', '餃子の皮', 'にんにく', '生姜', 'キムチ'];

  if (vegetables.includes(itemName)) {
    return { category: '野菜', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-900', badgeColor: 'bg-green-500' };
  } else if (meat.includes(itemName)) {
    return { category: '肉類', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-900', badgeColor: 'bg-red-500' };
  } else if (fish.includes(itemName)) {
    return { category: '魚介', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-900', badgeColor: 'bg-blue-500' };
  } else if (seasoning.includes(itemName)) {
    return { category: '調味料', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-900', badgeColor: 'bg-amber-500' };
  } else if (grains.includes(itemName)) {
    return { category: '穀物', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-900', badgeColor: 'bg-yellow-500' };
  } else if (dairy.includes(itemName)) {
    return { category: '乳製品', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-900', badgeColor: 'bg-orange-500' };
  } else if (tofu.includes(itemName)) {
    return { category: '豆腐', bgColor: 'bg-slate-50', borderColor: 'border-slate-300', textColor: 'text-slate-900', badgeColor: 'bg-slate-500' };
  } else {
    return { category: 'その他', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-900', badgeColor: 'bg-gray-500' };
  }
}

export function ShoppingMode({ items, onBack, onInventoryUpdate }: ShoppingModeProps) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<Set<string>>(new Set());
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  const [isConfirmed, setIsConfirmed] = useState(false);
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
      setConfirmedItems(checked);
    }
  };

  const toggleCart = (itemName: string) => {
    const newCartItems = new Set(cartItems);
    if (newCartItems.has(itemName)) {
      newCartItems.delete(itemName);
    } else {
      newCartItems.add(itemName);
    }
    setCartItems(newCartItems);
  };

  const handleConfirm = async () => {
    if (!user || cartItems.size === 0) return;

    const updates = Array.from(cartItems).map(itemName => ({
      user_id: user.id,
      week_identifier: weekId,
      item_name: itemName,
      is_checked: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('shopping_list_checks')
      .upsert(updates, {
        onConflict: 'user_id,week_identifier,item_name'
      });

    if (!error) {
      // 在庫に追加
      const boughtItems = items.filter(item => cartItems.has(item.name));
      for (const item of boughtItems) {
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
      }

      const newConfirmed = new Set([...confirmedItems, ...cartItems]);
      setConfirmedItems(newConfirmed);
      setIsConfirmed(true);
      setCartItems(new Set());
      onInventoryUpdate();
    }
  };

  const handleBackToShopping = () => {
    setIsConfirmed(false);
  };

  if (isConfirmed) {
    const boughtItems = items.filter(item => confirmedItems.has(item.name));
    const notBoughtItems = items.filter(item => !confirmedItems.has(item.name));

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-2 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              戻る
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <CheckCircle className="w-7 h-7 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">確定完了！</h2>
            </div>
            <p className="text-center text-gray-600 text-sm">
              {boughtItems.length}個の商品を購入しました
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              在庫に追加され、買い物リストから削除されました
            </p>
          </div>

          {boughtItems.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 px-2">✓ 買ったもの</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {boughtItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-bold text-green-900">{item.name}</span>
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold text-center">
                        {item.qty}{item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notBoughtItems.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 px-2">まだ買ってないもの</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {notBoughtItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-bold text-gray-600">{item.name}</span>
                      <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm font-bold text-center">
                        {item.qty}{item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleBackToShopping}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-lg font-bold transition-colors shadow-lg"
          >
            買い物を続ける
          </button>
        </div>
      </div>
    );
  }

  const remainingItems = items.filter(item => !confirmedItems.has(item.name));

  const groupedItems = remainingItems.reduce((acc, item) => {
    const { category } = categorizeItem(item.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const categoryOrder = ['野菜', '肉類', '魚介', '穀物', '乳製品', '豆腐', '調味料', 'その他'];
  const sortedCategories = categoryOrder.filter(cat => groupedItems[cat]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-32">
      <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-2 py-3 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </button>
          <div className="text-sm font-bold text-gray-700">
            {cartItems.size} / {remainingItems.length}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-3">
        {sortedCategories.map((category) => {
          const categoryItems = groupedItems[category];
          const sampleItem = categoryItems[0];
          const { bgColor, badgeColor } = categorizeItem(sampleItem.name);

          return (
            <div key={category} className="mb-4">
              <div className={`${badgeColor} text-white px-3 py-1 rounded-lg inline-block text-sm font-bold mb-2`}>
                {category}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryItems.map((item, i) => {
                  const isInCart = cartItems.has(item.name);
                  const { bgColor, borderColor, textColor } = categorizeItem(item.name);

                  return (
                    <button
                      key={i}
                      onClick={() => toggleCart(item.name)}
                      className={`p-3 rounded-lg shadow-md transition-all transform active:scale-95 border-2 ${
                        isInCart
                          ? 'bg-green-500 border-green-600'
                          : `${bgColor} ${borderColor}`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                            isInCart ? 'bg-green-600' : 'bg-white'
                          }`}
                        >
                          {isInCart && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            isInCart ? 'text-white' : textColor
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isInCart
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {item.qty}{item.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed left-0 right-0 bg-white border-t-2 border-gray-200 p-3 shadow-2xl z-50" style={{ bottom: '80px' }}>
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleConfirm}
            disabled={cartItems.size === 0}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-all shadow-lg ${
              cartItems.size > 0
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {cartItems.size > 0
              ? `${cartItems.size}個を確定`
              : 'かごに入れてください'}
          </button>
        </div>
      </div>
    </div>
  );
}
