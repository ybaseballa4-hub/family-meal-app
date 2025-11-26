import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, RefreshCw, GripVertical, ChevronDown, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FullMenu, DishItem } from '../lib/storage';
import { calculateDishWeight, selectWeightedRandomDish } from '../lib/menuGenerator';

interface MenuItem {
  day: string;
  dish: string;
  ingredients: FullMenu;
}

interface DailyMenu {
  id: string;
  menu_date: string;
  dish: string;
  ingredients: FullMenu;
}

interface WeeklyMenu {
  id: string;
  week_start: string;
  menu_data: MenuItem[];
}

interface CookingHistory {
  id: string;
  dish_name: string;
  cooked_date: string;
  rank?: string;
  overall_score?: number;
}

export function WeeklyMenuView() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [history, setHistory] = useState<CookingHistory[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<{ dish: string; ingredients: any[]; date: Date } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleExpanded = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const toggleFavorite = async (dishName: string) => {
    if (!user) return;

    const isFavorite = favorites.has(dishName);

    if (isFavorite) {
      // お気に入りから削除
      const { error } = await supabase
        .from('favorite_dishes')
        .delete()
        .eq('user_id', user.id)
        .eq('dish_name', dishName);

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(dishName);
          return newSet;
        });
      }
    } else {
      // お気に入りに追加
      const { error } = await supabase
        .from('favorite_dishes')
        .insert({
          user_id: user.id,
          dish_name: dishName,
        });

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(dishName);
          return newSet;
        });
      }
    }
  };

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadDailyMenus();
    loadHistory();
    loadFavorites();
  }, [currentWeekStart, user?.id]);

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorite_dishes')
      .select('dish_name')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(item => item.dish_name)));
    }
  };

  const loadDailyMenus = async () => {
    if (!user) return;

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('user_id', user.id)
      .gte('menu_date', formatDateToLocal(currentWeekStart))
      .lte('menu_date', formatDateToLocal(weekEnd))
      .order('menu_date', { ascending: true });

    if (!error && data) {
      setDailyMenus(data);
    } else {
      setDailyMenus([]);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const { data, error } = await supabase
      .from('cooking_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('cooked_date', formatDateToLocal(currentWeekStart))
      .lte('cooked_date', formatDateToLocal(weekEndDate));

    if (!error && data) {
      setHistory(data);
    }
  };

  const markAsCooked = async (dish: string, date: Date) => {
    if (!user || !selectedMenu) return;

    const dateStr = formatDateToLocal(date);

    // 既に同じ日付と料理名の履歴が存在するかチェック
    const { data: existingHistory } = await supabase
      .from('cooking_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('dish_name', dish)
      .eq('cooked_date', dateStr)
      .maybeSingle();

    if (existingHistory) {
      // 既に存在する場合はモーダルを閉じるだけ
      setSelectedMenu(null);
      return;
    }

    const { error } = await supabase
      .from('cooking_history')
      .insert({
        user_id: user.id,
        dish_name: dish,
        cooked_date: dateStr,
      });

    if (!error) {
      // 使用した食材を在庫から減らす
      if (selectedMenu.ingredients) {
        let ingredientsList: { name: string; qty: number; unit: string }[] = [];

        if ('dishes' in selectedMenu.ingredients) {
          // FullMenu形式の場合
          selectedMenu.ingredients.dishes.forEach((dish: DishItem) => {
            ingredientsList = ingredientsList.concat(dish.ingredients);
          });
        } else if (Array.isArray(selectedMenu.ingredients)) {
          // 配列形式の場合
          ingredientsList = selectedMenu.ingredients;
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

      loadHistory();
      setSelectedMenu(null);
    }
  };

  const refreshSingleDay = async (menuId: string, menuDate: string) => {
    if (!user) return;
    setIsRefreshing(menuId);

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

    const currentMenu = dailyMenus.find(m => m.id === menuId);

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

    const { error } = await supabase
      .from('daily_menus')
      .update({
        dish: selectedRecipe.name,
        ingredients: newIngredients,
        updated_at: new Date().toISOString()
      })
      .eq('id', menuId);

    if (!error) {
      await loadDailyMenus();
    }

    setTimeout(() => setIsRefreshing(null), 500);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      swapMenus(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });

    longPressTimer.current = setTimeout(() => {
      setDraggedIndex(index);
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

    if (draggedIndex !== null) {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const menuItem = element?.closest('[data-menu-index]');
      if (menuItem) {
        const index = parseInt(menuItem.getAttribute('data-menu-index') || '-1');
        if (index !== -1) {
          setDragOverIndex(index);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      swapMenus(draggedIndex, dragOverIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartPos(null);
  };

  const swapMenus = async (fromIndex: number, toIndex: number) => {
    if (!user) return;

    const fromMenu = dailyMenus[fromIndex];
    const toMenu = dailyMenus[toIndex];

    // データベースで入れ替え
    const { error: error1 } = await supabase
      .from('daily_menus')
      .update({
        dish: toMenu.dish,
        ingredients: toMenu.ingredients,
        updated_at: new Date().toISOString()
      })
      .eq('id', fromMenu.id);

    const { error: error2 } = await supabase
      .from('daily_menus')
      .update({
        dish: fromMenu.dish,
        ingredients: fromMenu.ingredients,
        updated_at: new Date().toISOString()
      })
      .eq('id', toMenu.id);

    if (!error1 && !error2) {
      await loadDailyMenus();
    }
  };

  const isDishCookedOnDate = (dish: string, date: Date): boolean => {
    const dateStr = formatDateToLocal(date);
    return history.some(h => h.dish_name === dish && h.cooked_date === dateStr);
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const getDateForDay = (dayName: string): Date => {
    const dayMap: { [key: string]: number } = {
      '月曜日': 0,
      '火曜日': 1,
      '水曜日': 2,
      '木曜日': 3,
      '金曜日': 4,
      '土曜日': 5,
      '日曜日': 6,
    };
    const offset = dayMap[dayName] || 0;
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + offset);
    return date;
  };

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekRangeText = `${currentWeekStart.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  })} - ${weekEndDate.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  })}`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4">
        <div className="disney-card border-4 border-sky-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">週間メニュー</h2>
              <p className="text-sm text-gray-600 mt-1">{weekRangeText}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={previousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={nextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {dailyMenus.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">この週のメニューはまだ作成されていません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyMenus.map((item, index) => {
                const itemDate = new Date(item.menu_date);
                const isCooked = isDishCookedOnDate(item.dish, itemDate);
                const isToday = itemDate.toDateString() === new Date().toDateString();
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                const dayName = itemDate.toLocaleDateString('ja-JP', { weekday: 'long' });

                return (
                  <div
                    key={item.id}
                    data-menu-index={index}
                    draggable={!isCooked}
                    onDragStart={(e) => !isCooked && handleDragStart(e, index)}
                    onDragOver={(e) => !isCooked && handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => !isCooked && handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    } ${isCooked ? 'bg-green-50' : 'cursor-move'} ${
                      isDragging ? 'opacity-50 scale-95' : ''
                    } ${isDragOver && !isDragging ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!isCooked && (
                        <div className="flex-shrink-0 pt-1">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                            {itemDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} ({dayName})
                          </span>
                          {isToday && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">
                              今日
                            </span>
                          )}
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg font-bold text-gray-800">
                              {item.dish}
                            </span>
                            {!isCooked && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    refreshSingleDay(item.id, item.menu_date);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  disabled={isRefreshing === item.id}
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                  title="この日のメニューを変更"
                                >
                                  <RefreshCw className={`w-5 h-5 ${isRefreshing === item.id ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item.dish);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-50 transition-colors"
                                  title="お気に入りに追加"
                                >
                                  <Star className={`w-5 h-5 ${favorites.has(item.dish) ? 'fill-yellow-500' : ''}`} />
                                </button>
                              </>
                            )}
                          </div>
                          {isCooked && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold">
                              調理済み
                            </span>
                          )}
                        </div>
                        <div className="ml-0">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-600 font-semibold">献立</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  toggleExpanded(item.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                draggable={false}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200"
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.has(item.id) ? 'rotate-180' : ''}`} />
                                {expandedMenus.has(item.id) ? '材料を閉じる' : '材料を見る'}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {item.ingredients.dishes?.map((dish, idx) => (
                                <div key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className={`text-xs font-semibold min-w-[40px] ${
                                      dish.category === '主食' ? 'text-amber-600' :
                                      dish.category === '主菜' ? 'text-orange-600' :
                                      dish.category === '副菜' ? 'text-green-600' :
                                      'text-blue-600'
                                    }`}>
                                      {dish.category}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {dish.name}
                                    </span>
                                  </div>
                                  {expandedMenus.has(item.id) && dish.ingredients && dish.ingredients.length > 0 && (
                                    <div className="ml-12 mt-1 space-y-0.5">
                                      {dish.ingredients.map((ing, ingIdx) => (
                                        <div key={ingIdx} className="text-xs text-gray-600">
                                          • {ing.name}: {ing.qty}{ing.unit}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!isCooked && (
                          <button
                            onClick={() => {
                              setSelectedMenu({ dish: item.dish, ingredients: item.ingredients as any[], date: itemDate });
                            }}
                            className="disney-button px-3 py-2 bg-gradient-to-r from-accent-400 to-primary-500 hover:from-accent-500 hover:to-primary-600 text-white font-bold transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            完了
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="disney-card border-4 border-primary-300 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">調理完了の確認</h3>
            <p className="text-gray-700 mb-6">
              <span className="font-semibold">{selectedMenu.dish}</span>
              を調理完了としてマークしますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMenu(null)}
                className="disney-button flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => markAsCooked(selectedMenu.dish, selectedMenu.date)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-colors"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
