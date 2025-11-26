import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, RefreshCw, GripVertical, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FullMenu, DishItem } from '../lib/storage';
import { RatingDialog } from './RatingDialog';
import { calculateDishWeight, selectWeightedRandomDish } from '../lib/menuGenerator';

interface CookingHistory {
  id: string;
  dish_name: string;
  cooked_date: string;
  notes?: string;
  rating?: number;
  taste_rating?: number;
  ease_rating?: number;
  overall_score?: number;
  rank?: string;
}


interface DailyMenu {
  id: string;
  menu_date: string;
  dish: string;
  ingredients: FullMenu;
}

export function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState<CookingHistory[]>([]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', notes: '', rating: 0 });
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ dayIndex: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingDishInfo, setRatingDishInfo] = useState<{ name: string; date: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadDailyMenus();
    loadFavorites();
    loadHistory();
  }, [currentDate, user?.id]);

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorite_dishes')
      .select('dish_name')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.dish_name)));
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('cooking_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('cooked_date', formatDateToLocal(startOfMonth))
      .lte('cooked_date', formatDateToLocal(endOfMonth))
      .order('cooked_date', { ascending: true });

    if (!error && data) {
      setHistory(data);
    }
  };


  const loadDailyMenus = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('user_id', user.id)
      .gte('menu_date', formatDateToLocal(startOfMonth))
      .lte('menu_date', formatDateToLocal(endOfMonth))
      .order('menu_date', { ascending: true });

    if (!error && data) {
      setDailyMenus(data);
    }
  };

  const addCookingHistory = async () => {
    if (!user || !selectedDate || !newDish.name.trim()) return;

    const dateStr = formatDateToLocal(selectedDate);

    // 既に同じ料理名の履歴が存在するかチェック
    const { data: existingHistory } = await supabase
      .from('cooking_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('dish_name', newDish.name)
      .maybeSingle();

    if (existingHistory) {
      // 既に存在する場合は更新（日付も更新）
      const { error } = await supabase
        .from('cooking_history')
        .update({
          cooked_date: dateStr,
          notes: newDish.notes || null,
          rating: newDish.rating > 0 ? newDish.rating : null,
        })
        .eq('id', existingHistory.id);

      if (!error) {
        await loadHistory();
        setNewDish({ name: '', notes: '', rating: 0 });
        setShowAddModal(false);
      }
      return;
    }

    // 新規追加
    const { error } = await supabase
      .from('cooking_history')
      .insert({
        user_id: user.id,
        dish_name: newDish.name,
        cooked_date: dateStr,
        notes: newDish.notes || null,
        rating: newDish.rating > 0 ? newDish.rating : null,
      });

    if (!error) {
      // 予定メニューと一致する場合、在庫から減らす
      const plannedMenu = getMenuForDate(selectedDate);
      if (plannedMenu && plannedMenu.dish === newDish.name && plannedMenu.ingredients) {
        let ingredientsList: { name: string; qty: number; unit: string }[] = [];

        if ('dishes' in plannedMenu.ingredients) {
          // FullMenu形式の場合
          plannedMenu.ingredients.dishes.forEach(dish => {
            ingredientsList = ingredientsList.concat(dish.ingredients);
          });
        } else {
          // 配列形式の場合
          ingredientsList = plannedMenu.ingredients;
        }

        // 在庫から減らす
        for (const ingredient of ingredientsList) {
          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('qty')
            .eq('user_id', user.id)
            .eq('name', ingredient.name)
            .eq('unit', ingredient.unit)
            .maybeSingle();

          if (inventoryItem) {
            const currentQty = parseFloat(inventoryItem.qty) || 0;
            if (currentQty > 0) {
              const newQty = Math.max(0, currentQty - ingredient.qty);

              if (newQty === 0) {
                // 在庫が0になったら削除
                await supabase
                  .from('inventory')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('name', ingredient.name)
                  .eq('unit', ingredient.unit);
              } else {
                // 在庫を減らす
                await supabase
                  .from('inventory')
                  .update({ qty: newQty })
                  .eq('user_id', user.id)
                  .eq('name', ingredient.name)
                  .eq('unit', ingredient.unit);
              }
            }
          }
        }
      }

      await loadHistory();
      setNewDish({ name: '', notes: '', rating: 0 });
      setShowAddModal(false);
    }
  };

  const deleteCookingHistory = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('cooking_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadHistory();
    }

    if (!error) {
    }
  };

  const refreshSingleDayInCalendar = async (menuDate: string) => {
    if (!user) return;
    setIsRefreshing(menuDate);

    interface DishRecipe {
      name: string;
      type: string[];
      mainIngredients: string[];
      ingredients: { name: string; qty: number; unit: string }[];
    }

    const size = 4; // デフォルトのファミリーサイズ
    const allDishRecipes: DishRecipe[] = [
      {
        name: 'カレーライス',
        type: ['japanese'],
        mainIngredients: ['カレールー', '玉ねぎ', 'じゃがいも', 'にんじん', '豚肉'],
        ingredients: [
          { name: '玉ねぎ', qty: size * 1, unit: '個' },
          { name: 'じゃがいも', qty: size * 2, unit: '個' },
          { name: 'にんじん', qty: size * 1, unit: '本' },
          { name: '豚肉', qty: size * 150, unit: 'g' },
          { name: 'カレールー', qty: size * 25, unit: 'g' },
          { name: '米', qty: size * 150, unit: 'g' },
        ]
      },
      {
        name: 'ハンバーグ',
        type: ['western'],
        mainIngredients: ['合いびき肉', '玉ねぎ', '卵'],
        ingredients: [
          { name: '合いびき肉', qty: size * 100, unit: 'g' },
          { name: '玉ねぎ', qty: Math.ceil(size * 0.5), unit: '個' },
          { name: 'パン粉', qty: size * 10, unit: 'g' },
          { name: '卵', qty: Math.ceil(size * 0.3), unit: '個' },
          { name: 'レタス', qty: Math.ceil(size * 0.25), unit: '個' },
        ]
      },
      {
        name: '麻婆豆腐',
        type: ['chinese', 'spicy'],
        mainIngredients: ['木綿豆腐', '豚ひき肉', '長ねぎ', '豆板醤'],
        ingredients: [
          { name: '木綿豆腐', qty: size * 1, unit: '丁' },
          { name: '豚ひき肉', qty: size * 80, unit: 'g' },
          { name: '長ねぎ', qty: Math.ceil(size * 0.5), unit: '本' },
          { name: 'にんにく', qty: Math.ceil(size * 0.5), unit: '片' },
          { name: '豆板醤', qty: size * 5, unit: 'g' },
        ]
      },
      {
        name: 'オムライス',
        type: ['western'],
        mainIngredients: ['卵', '鶏肉', '玉ねぎ'],
        ingredients: [
          { name: '卵', qty: size * 2, unit: '個' },
          { name: '米', qty: size * 150, unit: 'g' },
          { name: '鶏肉', qty: size * 80, unit: 'g' },
          { name: '玉ねぎ', qty: Math.ceil(size * 0.3), unit: '個' },
          { name: 'ケチャップ', qty: size * 30, unit: 'g' },
        ]
      },
      {
        name: 'パスタカルボナーラ',
        type: ['western'],
        mainIngredients: ['パスタ', 'ベーコン', '卵', 'チーズ'],
        ingredients: [
          { name: 'パスタ', qty: size * 100, unit: 'g' },
          { name: 'ベーコン', qty: size * 50, unit: 'g' },
          { name: '卵', qty: size * 1, unit: '個' },
          { name: 'パルメザンチーズ', qty: size * 20, unit: 'g' },
          { name: 'にんにく', qty: Math.ceil(size * 0.3), unit: '片' },
        ]
      },
      {
        name: '親子丼',
        type: ['japanese'],
        mainIngredients: ['鶏肉', '卵', '玉ねぎ'],
        ingredients: [
          { name: '鶏肉', qty: size * 100, unit: 'g' },
          { name: '卵', qty: size * 2, unit: '個' },
          { name: '玉ねぎ', qty: Math.ceil(size * 0.5), unit: '個' },
          { name: '米', qty: size * 150, unit: 'g' },
          { name: 'みりん', qty: size * 15, unit: 'ml' },
        ]
      },
      {
        name: '焼き魚定食',
        type: ['japanese', 'healthy'],
        mainIngredients: ['鮭', '大根', 'ほうれん草'],
        ingredients: [
          { name: '鮭', qty: size * 1, unit: '切れ' },
          { name: '大根', qty: Math.ceil(size * 0.3), unit: '本' },
          { name: 'ほうれん草', qty: Math.ceil(size * 0.5), unit: '束' },
          { name: '米', qty: size * 150, unit: 'g' },
          { name: '味噌', qty: size * 15, unit: 'g' },
        ]
      },
      {
        name: '生姜焼き',
        type: ['japanese'],
        mainIngredients: ['豚肉', '玉ねぎ', '生姜'],
        ingredients: [
          { name: '豚肉', qty: size * 150, unit: 'g' },
          { name: '玉ねぎ', qty: Math.ceil(size * 0.5), unit: '個' },
          { name: '生姜', qty: Math.ceil(size * 0.5), unit: '片' },
          { name: '醤油', qty: size * 15, unit: 'ml' },
          { name: 'みりん', qty: size * 15, unit: 'ml' },
        ]
      },
    ];

    const currentMenu = dailyMenus.find(m => m.menu_date === menuDate);

    const dishesWithWeights = allDishRecipes.map(recipe => ({
      name: recipe.name,
      weight: calculateDishWeight(
        recipe.name,
        history,
        favorites.has(recipe.name)
      ),
      recipe
    }));

    const selectedDishName = selectWeightedRandomDish(
      dishesWithWeights.map(d => ({ name: d.name, weight: d.weight })),
      currentMenu ? [currentMenu.dish] : []
    );

    const selectedRecipe = allDishRecipes.find(r => r.name === selectedDishName) || allDishRecipes[0];

    const newIngredients: FullMenu = {
      dishes: [
        { category: '主食', name: 'ご飯', ingredients: [{ name: '米', qty: 150, unit: 'g' }] },
        { category: '主菜', name: selectedRecipe.name, ingredients: selectedRecipe.ingredients },
        { category: '副菜', name: 'サラダ', ingredients: [{ name: 'レタス', qty: 1, unit: '個' }] },
        { category: '汁物', name: '味噌汁', ingredients: [{ name: '味噌', qty: 30, unit: 'g' }] }
      ]
    };

    const dailyMenu = dailyMenus.find(m => m.menu_date === menuDate);
    if (dailyMenu) {
      const { error } = await supabase
        .from('daily_menus')
        .update({
          dish: selectedRecipe.name,
          ingredients: newIngredients,
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyMenu.id);

      if (!error) {
        await loadDailyMenus();
      }
    }

    setTimeout(() => setIsRefreshing(null), 500);
  };

  const handleDragStart = (e: React.DragEvent, dayIndex: number) => {
    setDraggedItem({ dayIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverItem({ dayIndex });
  };

  const handleDragEnd = () => {
    if (draggedItem && dragOverItem && draggedItem.dayIndex !== dragOverItem.dayIndex) {
      swapMenuItems(draggedItem, dragOverItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleTouchStart = (e: React.TouchEvent, dayIndex: number) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });

    longPressTimer.current = setTimeout(() => {
      setDraggedItem({ dayIndex });
      navigator.vibrate?.(50);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPos) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }

    if (draggedItem) {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const menuCard = element?.closest('[data-menu-card]');
      if (menuCard) {
        const dayIndex = menuCard.getAttribute('data-day-index');
        if (dayIndex) {
          setDragOverItem({ dayIndex: parseInt(dayIndex) });
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (draggedItem && dragOverItem && draggedItem.dayIndex !== dragOverItem.dayIndex) {
      swapMenuItems(draggedItem, dragOverItem);
    }

    setDraggedItem(null);
    setDragOverItem(null);
    setTouchStartPos(null);
  };

  const swapMenuItems = async (from: { dayIndex: number }, to: { dayIndex: number }) => {
    if (!user) return;

    const fromDailyMenu = dailyMenus[from.dayIndex];
    const toDailyMenu = dailyMenus[to.dayIndex];

    if (fromDailyMenu && toDailyMenu) {
      await supabase
        .from('daily_menus')
        .update({
          dish: toDailyMenu.dish,
          ingredients: toDailyMenu.ingredients,
          updated_at: new Date().toISOString()
        })
        .eq('id', fromDailyMenu.id);

      await supabase
        .from('daily_menus')
        .update({
          dish: fromDailyMenu.dish,
          ingredients: fromDailyMenu.ingredients,
          updated_at: new Date().toISOString()
        })
        .eq('id', toDailyMenu.id);

      await loadDailyMenus();
    }
  };


  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getMenuForDate = (date: Date) => {
    const dateStr = formatDateToLocal(date);

    const dailyMenu = dailyMenus.find(menu => menu.menu_date === dateStr);
    if (dailyMenu) {
      return { dish: dailyMenu.dish, ingredients: dailyMenu.ingredients };
    }

    return null;
  };

  const getHistoryForDate = (date: Date) => {
    const dateStr = formatDateToLocal(date);
    return history.filter(h => h.cooked_date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{monthName}</h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const plannedMenu = getMenuForDate(day);
              const dayHistory = getHistoryForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square border-2 rounded-xl p-2 cursor-pointer transition-all hover:border-orange-300 ${
                    isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowAddModal(true);
                  }}
                >
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {plannedMenu && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate font-semibold">
                        予定: {plannedMenu.dish}
                      </div>
                    )}
                    {dayHistory.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`「${item.dish_name}」の料理履歴を削除しますか？`)) {
                            deleteCookingHistory(item.id);
                          }
                        }}
                        className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <span>✓ {item.dish_name}</span>
                        {item.rank && (
                          <span className={`font-bold ${
                            item.rank === 'A' ? 'text-green-700' :
                            item.rank === 'B' ? 'text-blue-700' :
                            item.rank === 'C' ? 'text-yellow-700' :
                            'text-gray-700'
                          }`}>{item.rank}</span>
                        )}
                      </div>
                    ))}
                    {dayHistory.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayHistory.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {dailyMenus.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">今月の予定メニュー</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyMenus.map((item, dayIndex) => {
                const menuDate = new Date(item.menu_date);
                const isDragging = draggedItem?.dayIndex === dayIndex;
                const isDragOver = dragOverItem?.dayIndex === dayIndex;
                const isToday = menuDate.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={item.id}
                    data-menu-card
                    data-day-index={dayIndex}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dayIndex)}
                    onDragOver={(e) => handleDragOver(e, dayIndex)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, dayIndex)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`bg-gray-50 rounded-lg p-3 border-2 cursor-move transition-all ${
                      isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    } ${
                      isDragging ? 'opacity-50 scale-95' : ''
                    } ${isDragOver && !isDragging ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600">
                            {menuDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && (
                            <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                              今日
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-800 truncate block">{item.dish}</span>
                        <div className="text-xs text-gray-600 mt-1">
                          {item.ingredients.dishes?.map((dish, idx) => (
                            <div key={idx} className="flex gap-1">
                              <span className={`font-semibold ${
                                dish.category === '主食' ? 'text-amber-600' :
                                dish.category === '主菜' ? 'text-orange-600' :
                                dish.category === '副菜' ? 'text-green-600' :
                                'text-blue-600'
                              }`}>{dish.category}</span>
                              <span>{dish.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingDishInfo({ name: item.dish, date: item.menu_date });
                            setShowRatingDialog(true);
                          }}
                          className="flex-shrink-0 p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                          title="完了にする"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshSingleDayInCalendar(item.menu_date);
                          }}
                          disabled={isRefreshing === item.menu_date}
                          className="flex-shrink-0 p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50"
                          title="メニューを変更"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing === item.menu_date ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAddModal && selectedDate && (() => {
        const plannedMenu = getMenuForDate(selectedDate);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 max-w-md w-full max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                料理を追加
                <span className="text-xs font-normal text-gray-600 ml-2">
                  {selectedDate.toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </h3>

              {plannedMenu && (
                <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-800 mb-1">予定メニュー</p>
                  <p className="font-bold text-gray-800 mb-2 text-sm">{plannedMenu.dish}</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setRatingDishInfo({ name: plannedMenu.dish, date: formatDateToLocal(selectedDate) });
                      setShowRatingDialog(true);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    このメニューを完了にする
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    料理名
                  </label>
                  <input
                    type="text"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    placeholder="例: カレーライス"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    メモ（任意）
                  </label>
                  <textarea
                    value={newDish.notes}
                    onChange={(e) => setNewDish({ ...newDish, notes: e.target.value })}
                    placeholder="感想やレシピのメモなど"
                    rows={2}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    評価（任意）
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setNewDish({ ...newDish, rating })}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating <= newDish.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDish({ name: '', notes: '', rating: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button
                  onClick={addCookingHistory}
                  disabled={!newDish.name.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showRatingDialog && ratingDishInfo && (
        <RatingDialog
          dishName={ratingDishInfo.name}
          onSubmit={async (rating) => {
            if (!user) return;

            const { data: existingHistory } = await supabase
              .from('cooking_history')
              .select('id')
              .eq('user_id', user.id)
              .eq('dish_name', ratingDishInfo.name)
              .maybeSingle();

            if (existingHistory) {
              await supabase
                .from('cooking_history')
                .update({
                  cooked_date: ratingDishInfo.date,
                  taste_rating: rating.tasteRating,
                  cooking_time_rating: rating.cookingTimeRating,
                  repeat_desire: rating.repeatDesire,
                  overall_score: rating.overallScore,
                  rank: rating.rank,
                  notes: rating.notes || null,
                })
                .eq('id', existingHistory.id);
            } else {
              const { error } = await supabase
                .from('cooking_history')
                .insert({
                  user_id: user.id,
                  dish_name: ratingDishInfo.name,
                  cooked_date: ratingDishInfo.date,
                  taste_rating: rating.tasteRating,
                  cooking_time_rating: rating.cookingTimeRating,
                  repeat_desire: rating.repeatDesire,
                  overall_score: rating.overallScore,
                  rank: rating.rank,
                  notes: rating.notes || null,
                });

              if (!error) {
                const plannedMenu = dailyMenus.find(m => m.menu_date === ratingDishInfo.date);
                if (plannedMenu && plannedMenu.dish === ratingDishInfo.name) {
                  let ingredientsList: { name: string; qty: number; unit: string }[] = [];
                  plannedMenu.ingredients.dishes?.forEach(dish => {
                    ingredientsList = ingredientsList.concat(dish.ingredients);
                  });

                  for (const ingredient of ingredientsList) {
                    const { data: inventoryItem } = await supabase
                      .from('inventory')
                      .select('qty')
                      .eq('user_id', user.id)
                      .eq('name', ingredient.name)
                      .eq('unit', ingredient.unit)
                      .maybeSingle();

                    if (inventoryItem) {
                      const currentQty = parseFloat(inventoryItem.qty) || 0;
                      if (currentQty > 0) {
                        const newQty = Math.max(0, currentQty - ingredient.qty);

                        if (newQty === 0) {
                          await supabase
                            .from('inventory')
                            .delete()
                            .eq('user_id', user.id)
                            .eq('name', ingredient.name)
                            .eq('unit', ingredient.unit);
                        } else {
                          await supabase
                            .from('inventory')
                            .update({ qty: newQty })
                            .eq('user_id', user.id)
                            .eq('name', ingredient.name)
                            .eq('unit', ingredient.unit);
                        }
                      }
                    }
                  }
                }
              }
            }

            await loadHistory();
            setShowRatingDialog(false);
            setRatingDishInfo(null);
              }}
          onCancel={() => {
            setShowRatingDialog(false);
            setRatingDishInfo(null);
          }}
        />
      )}
    </div>
  );
}
