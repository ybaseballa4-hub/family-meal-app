import { useState, useEffect, useCallback, useRef } from 'react';
import { ChefHat, Users, Loader2, Home, Calendar, CalendarDays, ShoppingCart, Package, Heart, ThumbsDown, Flame, Plus, Minus, Trash2, Settings, Star, LogOut, RefreshCw, GripVertical, HelpCircle } from 'lucide-react';
import { saveUserSettings, loadUserSettings, saveFavoriteMenu, removeFavoriteMenu, loadFavoriteMenus, saveWeeklyMenu, loadWeeklyMenu, FullMenu, saveInventoryItem, loadInventory, deleteInventoryItem } from './lib/storage';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { CalendarView } from './components/CalendarView';
import { ShoppingList } from './components/ShoppingList';
import { WeeklyMenuView } from './components/WeeklyMenuView';
import { ShoppingMode } from './components/ShoppingMode';
import { FamilySettings } from './components/FamilySettings';
import { FavoritesView } from './components/FavoritesView';
import HelpPage from './components/HelpPage';
import { generateFullMenu, getAllIngredientsFromFullMenu, getAllIngredientsWithCategoryFromFullMenu } from './lib/menuGenerator';

type Page = 'home' | 'settings' | 'menu' | 'shopping' | 'inventory' | 'favorites' | 'calendar' | 'shopping-mode' | 'help';

type Ingredient = { name: string; qty: number; unit: string; };
type MenuItem   = { day: string; dish: string; ingredients: FullMenu; date?: string; };
type ShoppingListItem = { name: string; qty: number; unit: string; };
type PlanData = { menu: MenuItem[]; shopping_list: ShoppingListItem[]; };
type InventoryItem = { name: string; qty: number; unit: string; };
type FavoriteMenu = { dish: string; ingredients: Ingredient[]; };

interface FamilyMember {
  id: string;
  name: string;
  birth_date: string;
  gender: string;
  appetite_level: number;
  likes?: string;
  dislikes?: string;
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [likes, setLikes] = useState<string>('');
  const [dislikes, setDislikes] = useState<string>('');
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [familyMode, setFamilyMode] = useState<'normal' | 'diet' | 'muscle'>('normal');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('個');
  const [favorites, setFavorites] = useState<FavoriteMenu[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [draggedMenuIndex, setDraggedMenuIndex] = useState<number | null>(null);
  const [dragOverMenuIndex, setDragOverMenuIndex] = useState<number | null>(null);
  const [isRefreshingMenu, setIsRefreshingMenu] = useState<number | null>(null);
  const menuLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [menuTouchStartPos, setMenuTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const prevSettingsRef = useRef<string>('');
  const prevPageRef = useRef<Page>('home');

  const getDefaultStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 6);
    return today.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (isInitialized) {
        setFamilyMembers([]);
        setLikes('');
        setDislikes('');
        setPreferredTypes([]);
        setFavorites([]);
        setInventory([]);
        setPlanData(null);
        setCurrentPage('home');
        setIsInitialized(false);
        prevSettingsRef.current = '';
      }
      return;
    }

    if (isInitialized) return;

    const loadSavedData = async () => {
      try {
        const settings = await loadUserSettings();
        if (settings) {
          setLikes(settings.likes);
          setDislikes(settings.dislikes);
          setPreferredTypes(settings.preferred_types);
          setFamilyMode(settings.family_mode || 'normal');
        }

        const { data: members, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && members) {
          setFamilyMembers(members);
        }

        const savedFavorites = await loadFavoriteMenus();
        setFavorites(savedFavorites);

        const savedInventory = await loadInventory();
        setInventory(savedInventory);

        const savedMenu = await loadWeeklyMenu();
        if (savedMenu) {
          setPlanData(savedMenu);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedData();
  }, [user, authLoading, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !user) return;

    const currentSettings = JSON.stringify({
      family_size: familyMembers.length.toString(),
      likes,
      dislikes,
      preferred_types: preferredTypes,
    });

    if (prevSettingsRef.current === '') {
      prevSettingsRef.current = currentSettings;
      return;
    }

    if (prevSettingsRef.current === currentSettings) {
      return;
    }

    prevSettingsRef.current = currentSettings;

    const saveSettings = async () => {
      try {
        await saveUserSettings({
          family_size: familyMembers.length.toString(),
          likes,
          dislikes,
          preferred_types: preferredTypes,
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [likes, dislikes, preferredTypes, familyMembers, isInitialized, user]);

  useEffect(() => {
    if (!user) return;

    const reloadData = async () => {
      if (currentPage === 'inventory' || currentPage === 'shopping') {
        const savedInventory = await loadInventory();
        setInventory(savedInventory);
      }

      if ((currentPage === 'home' || currentPage === 'settings') &&
          (prevPageRef.current === 'settings' || prevPageRef.current === 'home')) {
        const { data: members, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && members) {
          setFamilyMembers(members);
        }
      }
    };

    reloadData();
    prevPageRef.current = currentPage;
  }, [currentPage, user]);

  const loadDailyMenus = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('user_id', user.id)
      .order('menu_date', { ascending: true });

    if (error) {
      console.error('Error loading daily menus:', error);
      return [];
    }

    return data || [];
  }, [user]);

  const calculateShoppingListFromDailyMenus = useCallback(async (currentInventory: InventoryItem[]): Promise<ShoppingListItem[]> => {
    const dailyMenus = await loadDailyMenus();

    if (dailyMenus.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureMenus = dailyMenus.filter(menu => {
      const menuDate = new Date(menu.menu_date);
      menuDate.setHours(0, 0, 0, 0);
      return menuDate >= today;
    });

    if (futureMenus.length === 0) {
      return [];
    }

    const map = new Map<string, { qty: number; unit: string }>();

    for (const menu of futureMenus) {
      const allIngredients = getAllIngredientsFromFullMenu(menu.ingredients);
      for (const ing of allIngredients) {
        const key = `${ing.name}:${ing.unit}`;
        map.set(key, { qty: (map.get(key)?.qty ?? 0) + ing.qty, unit: ing.unit });
      }
    }

    let shopping_list: ShoppingListItem[] = [...map.entries()].map(([k, v]) => {
      const [name] = k.split(':');
      return { name, qty: Math.round(v.qty), unit: v.unit };
    });

    shopping_list = shopping_list.map(item => {
      const inventoryItem = currentInventory.find(
        inv => inv.name === item.name && inv.unit === item.unit
      );
      if (inventoryItem) {
        const remaining = item.qty - inventoryItem.qty;
        return { ...item, qty: Math.max(0, remaining) };
      }
      return item;
    }).filter(item => item.qty > 0);

    return shopping_list;
  }, [loadDailyMenus]);

  const recalculateShoppingList = useCallback((currentPlanData: PlanData, currentInventory: InventoryItem[]): ShoppingListItem[] => {
    const map = new Map<string, { qty: number; unit: string }>();
    for (const m of currentPlanData.menu) {
      const allIngredients = getAllIngredientsFromFullMenu(m.ingredients);
      for (const ing of allIngredients) {
        const key = `${ing.name}:${ing.unit}`;
        map.set(key, { qty: (map.get(key)?.qty ?? 0) + ing.qty, unit: ing.unit });
      }
    }
    let shopping_list: ShoppingListItem[] = [...map.entries()].map(([k, v]) => {
      const [name] = k.split(':');
      return { name, qty: Math.round(v.qty), unit: v.unit };
    });

    shopping_list = shopping_list.map(item => {
      const inventoryItem = currentInventory.find(
        inv => inv.name === item.name && inv.unit === item.unit
      );
      if (inventoryItem) {
        const remaining = item.qty - inventoryItem.qty;
        return { ...item, qty: Math.max(0, remaining) };
      }
      return item;
    }).filter(item => item.qty > 0);

    return shopping_list;
  }, []);

  const cuisineTypes = [
    { id: 'japanese', label: '和食', emoji: '🍱' },
    { id: 'western', label: '洋食', emoji: '🍕' },
    { id: 'chinese', label: '中華', emoji: '🍜' },
    { id: 'healthy', label: 'ヘルシー', emoji: '🥗' },
    { id: 'spicy', label: '辛い料理', emoji: '🌶️' },
  ];

  const toggleCuisineType = (id: string) => {
    setPreferredTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleFavorite = async (dish: string, ingredients: Ingredient[]) => {
    const isFav = favorites.some(fav => fav.dish === dish);

    try {
      if (isFav) {
        await removeFavoriteMenu(dish);
        setFavorites(favorites.filter(fav => fav.dish !== dish));
      } else {
        await saveFavoriteMenu({ dish, ingredients });
        setFavorites([...favorites, { dish, ingredients }]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (dish: string) => {
    return favorites.some(fav => fav.dish === dish);
  };

  const refreshSingleMenu = async (menuIndex: number) => {
    if (!planData || !user) return;
    setIsRefreshingMenu(menuIndex);

    let sampleDishes: string[] = [];

    if (familyMode === 'diet') {
      sampleDishes = [
        '焼き魚定食', '豆腐ハンバーグ', '鶏胸肉のソテー', '野菜たっぷり鍋',
        'こんにゃくステーキ', '蒸し鶏のサラダ', '白身魚の蒸し物', '豆腐サラダ',
        '鶏ささみの蒸し物', 'きのこ炒め', '野菜スープ', '豆腐グラタン'
      ];
    } else if (familyMode === 'muscle') {
      sampleDishes = [
        '鶏胸肉のステーキ', 'サーモンのグリル', '牛赤身肉のステーキ', 'プロテインオムレツ',
        '鶏もも肉のグリル', 'まぐろの刺身', '豚ヒレ肉のソテー', '牛もも肉の焼肉',
        '鶏ささみの筋肉飯', 'サバの塩焼き', '豆腐ステーキ', '卵とブロッコリー炒め'
      ];
    } else {
      sampleDishes = [
        'ハンバーグ', '焼き魚定食', '生姜焼き', '麻婆豆腐', 'カレーライス',
        'オムライス', 'パスタカルボナーラ', '親子丼', '牛丼', '天丼', '餃子', 'チャーハン'
      ];
    }

    const currentDish = planData.menu[menuIndex].dish;
    const filteredDishes = sampleDishes.filter(d => d !== currentDish);
    const newDish = filteredDishes[Math.floor(Math.random() * filteredDishes.length)];

    const size = familyMembers.length;
    const newIngredients: FullMenu = generateFullMenu(newDish, [], size);

    const updatedMenu = [...planData.menu];
    updatedMenu[menuIndex] = {
      ...updatedMenu[menuIndex],
      dish: newDish,
      ingredients: newIngredients
    };

    const newPlanData = { ...planData, menu: updatedMenu };
    const newShoppingList = recalculateShoppingList(newPlanData, inventory);
    const finalPlanData = { ...newPlanData, shopping_list: newShoppingList };

    setPlanData(finalPlanData);
    await saveWeeklyMenu(finalPlanData);

    setTimeout(() => setIsRefreshingMenu(null), 500);
  };

  const handleMenuDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMenuIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMenuDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverMenuIndex(index);
  };

  const handleMenuDragEnd = () => {
    if (draggedMenuIndex !== null && dragOverMenuIndex !== null && draggedMenuIndex !== dragOverMenuIndex) {
      swapMenuItems(draggedMenuIndex, dragOverMenuIndex);
    }
    setDraggedMenuIndex(null);
    setDragOverMenuIndex(null);
  };

  const handleMenuTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setMenuTouchStartPos({ x: touch.clientX, y: touch.clientY });

    menuLongPressTimer.current = setTimeout(() => {
      setDraggedMenuIndex(index);
      navigator.vibrate?.(50);
    }, 500);
  };

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    if (menuTouchStartPos) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - menuTouchStartPos.x);
      const deltaY = Math.abs(touch.clientY - menuTouchStartPos.y);

      if (deltaX > 10 || deltaY > 10) {
        if (menuLongPressTimer.current) {
          clearTimeout(menuLongPressTimer.current);
          menuLongPressTimer.current = null;
        }
      }
    }

    if (draggedMenuIndex !== null) {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = element?.closest('[data-menu-card-index]');
      if (card) {
        const index = parseInt(card.getAttribute('data-menu-card-index') || '-1');
        if (index !== -1) {
          setDragOverMenuIndex(index);
        }
      }
    }
  };

  const handleMenuTouchEnd = () => {
    if (menuLongPressTimer.current) {
      clearTimeout(menuLongPressTimer.current);
      menuLongPressTimer.current = null;
    }

    if (draggedMenuIndex !== null && dragOverMenuIndex !== null && draggedMenuIndex !== dragOverMenuIndex) {
      swapMenuItems(draggedMenuIndex, dragOverMenuIndex);
    }

    setDraggedMenuIndex(null);
    setDragOverMenuIndex(null);
    setMenuTouchStartPos(null);
  };

  const swapMenuItems = async (fromIndex: number, toIndex: number) => {
    if (!planData) return;

    const updatedMenu = [...planData.menu];
    const temp = updatedMenu[fromIndex];
    updatedMenu[fromIndex] = updatedMenu[toIndex];
    updatedMenu[toIndex] = temp;

    const newPlanData = { ...planData, menu: updatedMenu };
    setPlanData(newPlanData);
    await saveWeeklyMenu(newPlanData);
  };

  const navItems = [
    { id: 'home' as Page, label: 'ホーム', icon: Home },
    { id: 'settings' as Page, label: '基本設定', icon: Settings },
    { id: 'menu' as Page, label: 'メニュー', icon: Flame },
    { id: 'favorites' as Page, label: 'お気に入り', icon: Star },
    { id: 'calendar' as Page, label: 'カレンダー', icon: Calendar },
    { id: 'shopping' as Page, label: '買い物', icon: ShoppingCart },
    { id: 'inventory' as Page, label: '在庫', icon: Package },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const size = familyMembers.length;
    if (size < 1 || size > 6) {
      setError('家族人数は1〜6人の範囲で設定してください');
      return;
    }

    if (!startDate || !endDate) {
      setError('開始日と終了日を入力してください');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('開始日は終了日より前である必要があります');
      return;
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff > 30) {
      setError('期間は最大30日までです');
      return;
    }

    setIsLoading(true);
    setPlanData(null);
    try {
      const days = ['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'];

      type DishRecipe = {
        name: string;
        ingredients: Ingredient[];
        type: string[];
        mainIngredients: string[];
      };

      const normalRecipes: DishRecipe[] = [
        {
          name: 'カレーライス',
          type: ['japanese'],
          mainIngredients: ['玉ねぎ', 'じゃがいも', 'にんじん', '豚肉'],
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
          name: '餃子',
          type: ['chinese'],
          mainIngredients: ['豚ひき肉', 'キャベツ', 'ニラ'],
          ingredients: [
            { name: '豚ひき肉', qty: size * 100, unit: 'g' },
            { name: 'キャベツ', qty: Math.ceil(size * 0.25), unit: '個' },
            { name: 'ニラ', qty: Math.ceil(size * 0.5), unit: '束' },
            { name: '餃子の皮', qty: size * 12, unit: '枚' },
            { name: 'ごま油', qty: size * 5, unit: 'ml' },
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
          name: 'チャーハン',
          type: ['chinese'],
          mainIngredients: ['卵', '長ねぎ', 'ハム'],
          ingredients: [
            { name: '米', qty: size * 150, unit: 'g' },
            { name: '卵', qty: size * 1, unit: '個' },
            { name: '長ねぎ', qty: Math.ceil(size * 0.5), unit: '本' },
            { name: 'ハム', qty: size * 50, unit: 'g' },
            { name: 'ごま油', qty: size * 10, unit: 'ml' },
          ]
        },
        {
          name: 'シチュー',
          type: ['western'],
          mainIngredients: ['鶏肉', 'じゃがいも', 'にんじん', '玉ねぎ'],
          ingredients: [
            { name: '鶏肉', qty: size * 120, unit: 'g' },
            { name: 'じゃがいも', qty: size * 2, unit: '個' },
            { name: 'にんじん', qty: size * 1, unit: '本' },
            { name: '玉ねぎ', qty: size * 1, unit: '個' },
            { name: 'シチューのルー', qty: size * 25, unit: 'g' },
            { name: '牛乳', qty: size * 100, unit: 'ml' },
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
          name: 'サラダチキンボウル',
          type: ['healthy'],
          mainIngredients: ['鶏胸肉', 'レタス', 'トマト', 'アボカド'],
          ingredients: [
            { name: '鶏胸肉', qty: size * 120, unit: 'g' },
            { name: 'レタス', qty: Math.ceil(size * 0.3), unit: '個' },
            { name: 'トマト', qty: size * 1, unit: '個' },
            { name: 'アボカド', qty: Math.ceil(size * 0.5), unit: '個' },
            { name: 'オリーブオイル', qty: size * 10, unit: 'ml' },
          ]
        },
        {
          name: '豚キムチ',
          type: ['spicy'],
          mainIngredients: ['豚肉', 'キムチ', '玉ねぎ'],
          ingredients: [
            { name: '豚肉', qty: size * 150, unit: 'g' },
            { name: 'キムチ', qty: size * 100, unit: 'g' },
            { name: '玉ねぎ', qty: Math.ceil(size * 0.5), unit: '個' },
            { name: 'ごま油', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 150, unit: 'g' },
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
          name: '鶏の唐揚げ',
          type: ['japanese'],
          mainIngredients: ['鶏もも肉', 'にんにく', '生姜'],
          ingredients: [
            { name: '鶏もも肉', qty: size * 150, unit: 'g' },
            { name: 'にんにく', qty: Math.ceil(size * 0.5), unit: '片' },
            { name: '生姜', qty: Math.ceil(size * 0.3), unit: '片' },
            { name: '片栗粉', qty: size * 30, unit: 'g' },
            { name: 'レタス', qty: Math.ceil(size * 0.25), unit: '個' },
          ]
        },
        {
          name: '野菜炒め',
          type: ['chinese', 'healthy'],
          mainIngredients: ['キャベツ', 'にんじん', 'もやし', '豚肉'],
          ingredients: [
            { name: 'キャベツ', qty: Math.ceil(size * 0.25), unit: '個' },
            { name: 'にんじん', qty: Math.ceil(size * 0.5), unit: '本' },
            { name: 'もやし', qty: size * 100, unit: 'g' },
            { name: '豚肉', qty: size * 100, unit: 'g' },
            { name: 'ごま油', qty: size * 10, unit: 'ml' },
          ]
        },
      ];

      const dietRecipes: DishRecipe[] = [
        {
          name: '豆腐ハンバーグ',
          type: ['healthy'],
          mainIngredients: ['木綿豆腐', '鶏ひき肉', '玉ねぎ'],
          ingredients: [
            { name: '木綿豆腐', qty: size * 0.5, unit: '丁' },
            { name: '鶏ひき肉', qty: size * 80, unit: 'g' },
            { name: '玉ねぎ', qty: Math.ceil(size * 0.3), unit: '個' },
            { name: 'パン粉', qty: size * 10, unit: 'g' },
            { name: 'レタス', qty: Math.ceil(size * 0.3), unit: '個' },
          ]
        },
        {
          name: '鶏胸肉のソテー',
          type: ['healthy'],
          mainIngredients: ['鶏胸肉', 'ブロッコリー', 'トマト'],
          ingredients: [
            { name: '鶏胸肉', qty: size * 100, unit: 'g' },
            { name: 'ブロッコリー', qty: Math.ceil(size * 0.3), unit: '株' },
            { name: 'トマト', qty: size * 1, unit: '個' },
            { name: 'オリーブオイル', qty: size * 5, unit: 'ml' },
            { name: 'レモン', qty: Math.ceil(size * 0.3), unit: '個' },
          ]
        },
        {
          name: '野菜たっぷり鍋',
          type: ['healthy', 'japanese'],
          mainIngredients: ['白菜', '豆腐', 'しいたけ', '鶏肉'],
          ingredients: [
            { name: '白菜', qty: Math.ceil(size * 0.25), unit: '個' },
            { name: '木綿豆腐', qty: size * 0.5, unit: '丁' },
            { name: 'しいたけ', qty: size * 3, unit: '個' },
            { name: '鶏もも肉', qty: size * 80, unit: 'g' },
            { name: 'ポン酢', qty: size * 30, unit: 'ml' },
          ]
        },
        {
          name: '蒸し鶏のサラダ',
          type: ['healthy'],
          mainIngredients: ['鶏胸肉', 'レタス', 'トマト', 'きゅうり'],
          ingredients: [
            { name: '鶏胸肉', qty: size * 100, unit: 'g' },
            { name: 'レタス', qty: Math.ceil(size * 0.3), unit: '個' },
            { name: 'トマト', qty: size * 1, unit: '個' },
            { name: 'きゅうり', qty: size * 1, unit: '本' },
            { name: 'ドレッシング', qty: size * 20, unit: 'ml' },
          ]
        },
        {
          name: '白身魚の蒸し物',
          type: ['healthy', 'japanese'],
          mainIngredients: ['白身魚', '野菜'],
          ingredients: [
            { name: '白身魚', qty: size * 1, unit: '切れ' },
            { name: 'ほうれん草', qty: Math.ceil(size * 0.5), unit: '束' },
            { name: 'えのき', qty: size * 50, unit: 'g' },
            { name: 'ポン酢', qty: size * 20, unit: 'ml' },
            { name: '米', qty: size * 100, unit: 'g' },
          ]
        },
        {
          name: 'こんにゃくステーキ',
          type: ['healthy'],
          mainIngredients: ['こんにゃく', 'ピーマン'],
          ingredients: [
            { name: 'こんにゃく', qty: size * 1, unit: '枚' },
            { name: 'ピーマン', qty: size * 2, unit: '個' },
            { name: 'にんにく', qty: Math.ceil(size * 0.3), unit: '片' },
            { name: '醤油', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 100, unit: 'g' },
          ]
        },
      ];

      const muscleRecipes: DishRecipe[] = [
        {
          name: '鶏胸肉のステーキ',
          type: ['healthy'],
          mainIngredients: ['鶏胸肉', 'ブロッコリー'],
          ingredients: [
            { name: '鶏胸肉', qty: size * 200, unit: 'g' },
            { name: 'ブロッコリー', qty: Math.ceil(size * 0.5), unit: '株' },
            { name: 'オリーブオイル', qty: size * 10, unit: 'ml' },
            { name: 'にんにく', qty: Math.ceil(size * 0.5), unit: '片' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
        {
          name: 'サーモンのグリル',
          type: ['healthy'],
          mainIngredients: ['サーモン', 'アスパラガス'],
          ingredients: [
            { name: 'サーモン', qty: size * 2, unit: '切れ' },
            { name: 'アスパラガス', qty: size * 3, unit: '本' },
            { name: 'レモン', qty: Math.ceil(size * 0.3), unit: '個' },
            { name: 'オリーブオイル', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
        {
          name: '牛赤身肉のステーキ',
          type: ['western'],
          mainIngredients: ['牛赤身肉', 'ブロッコリー'],
          ingredients: [
            { name: '牛赤身肉', qty: size * 180, unit: 'g' },
            { name: 'ブロッコリー', qty: Math.ceil(size * 0.5), unit: '株' },
            { name: 'にんにく', qty: Math.ceil(size * 0.5), unit: '片' },
            { name: 'オリーブオイル', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
        {
          name: 'プロテインオムレツ',
          type: ['western'],
          mainIngredients: ['卵', '鶏胸肉', 'チーズ'],
          ingredients: [
            { name: '卵', qty: size * 3, unit: '個' },
            { name: '鶏胸肉', qty: size * 80, unit: 'g' },
            { name: 'チーズ', qty: size * 30, unit: 'g' },
            { name: 'トマト', qty: size * 1, unit: '個' },
            { name: 'パン', qty: size * 1, unit: '枚' },
          ]
        },
        {
          name: 'まぐろの刺身',
          type: ['japanese'],
          mainIngredients: ['まぐろ', '卵'],
          ingredients: [
            { name: 'まぐろ', qty: size * 150, unit: 'g' },
            { name: '卵', qty: size * 2, unit: '個' },
            { name: 'アボカド', qty: Math.ceil(size * 0.5), unit: '個' },
            { name: '醤油', qty: size * 15, unit: 'ml' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
        {
          name: '豚ヒレ肉のソテー',
          type: ['western'],
          mainIngredients: ['豚ヒレ肉', 'ほうれん草'],
          ingredients: [
            { name: '豚ヒレ肉', qty: size * 150, unit: 'g' },
            { name: 'ほうれん草', qty: Math.ceil(size * 0.5), unit: '束' },
            { name: 'にんにく', qty: Math.ceil(size * 0.5), unit: '片' },
            { name: 'オリーブオイル', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
        {
          name: '卵とブロッコリー炒め',
          type: ['healthy', 'chinese'],
          mainIngredients: ['卵', 'ブロッコリー', '鶏胸肉'],
          ingredients: [
            { name: '卵', qty: size * 3, unit: '個' },
            { name: 'ブロッコリー', qty: Math.ceil(size * 0.5), unit: '株' },
            { name: '鶏胸肉', qty: size * 120, unit: 'g' },
            { name: 'ごま油', qty: size * 10, unit: 'ml' },
            { name: '米', qty: size * 180, unit: 'g' },
          ]
        },
      ];

      let allDishRecipes: DishRecipe[];
      if (familyMode === 'diet') {
        allDishRecipes = [...dietRecipes, ...normalRecipes.filter(r => r.type.includes('healthy'))];
      } else if (familyMode === 'muscle') {
        allDishRecipes = [...muscleRecipes, ...normalRecipes.filter(r => ['鶏の唐揚げ', '焼き魚定食'].includes(r.name))];
      } else {
        allDishRecipes = normalRecipes;
      }

      const scoreRecipe = (recipe: DishRecipe): number => {
        let score = 0;

        if (preferredTypes.length > 0) {
          const hasPreferredType = recipe.type.some(t => preferredTypes.includes(t));
          if (hasPreferredType) score += 10;
        }

        for (const member of familyMembers) {
          const memberLikes = (member.likes || '').toLowerCase();
          const memberDislikes = (member.dislikes || '').toLowerCase();

          if (memberLikes) {
            const likesMatch = recipe.mainIngredients.some(ing =>
              memberLikes.includes(ing.toLowerCase()) || recipe.name.toLowerCase().includes(memberLikes)
            );
            if (likesMatch) score += 5;
          }

          if (memberDislikes) {
            const dislikesMatch = recipe.mainIngredients.some(ing =>
              memberDislikes.includes(ing.toLowerCase()) || recipe.name.toLowerCase().includes(memberDislikes)
            );
            if (dislikesMatch) score -= 100;
          }
        }

        return score;
      };

      const scoredRecipes = allDishRecipes
        .map(recipe => ({ recipe, score: scoreRecipe(recipe) }))
        .filter(item => item.score > -100)
        .sort((a, b) => b.score - a.score);

      if (scoredRecipes.length === 0) {
        setError('指定された条件に合う料理が見つかりませんでした。設定を調整してください。');
        setIsLoading(false);
        return;
      }

      const selectedRecipes: DishRecipe[] = [];
      const menuWithDates: Array<{ date: string; dish: string; fullMenu: FullMenu }> = [];

      const currentDate = new Date(start);
      for (let i = 0; i < daysDiff; i++) {
        let selectedIndex: number;

        if (i < scoredRecipes.length) {
          selectedIndex = i % scoredRecipes.length;
        } else {
          selectedIndex = Math.floor(Math.random() * Math.min(scoredRecipes.length, 5));
        }

        const recipe = scoredRecipes[selectedIndex].recipe;
        selectedRecipes.push(recipe);

        const dateStr = currentDate.toISOString().split('T')[0];
        const fullMenu = generateFullMenu(recipe.name, recipe.ingredients, size);
        menuWithDates.push({
          date: dateStr,
          dish: recipe.name,
          fullMenu,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const menu: MenuItem[] = menuWithDates.map((item, i) => {
        const date = new Date(item.date);
        const dayOfWeek = days[date.getDay()];
        return {
          day: dayOfWeek,
          dish: item.dish,
          ingredients: item.fullMenu,
          date: item.date,
        };
      });

      const tempPlanData = { menu, shopping_list: [] };
      const shopping_list = recalculateShoppingList(tempPlanData, inventory);

      const newPlanData = { menu, shopping_list };
      setPlanData(newPlanData);

      await saveWeeklyMenu(newPlanData);

      if (user?.id) {
        for (const item of menuWithDates) {
          await supabase
            .from('daily_menus')
            .upsert({
              user_id: user.id,
              menu_date: item.date,
              dish: item.dish,
              ingredients: item.fullMenu,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,menu_date'
            });
        }
      }

      setCurrentPage('menu');
    } catch (err: any) {
      setError(err?.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">今週のメニューを簡単に生成・管理</p>
            </div>

            <div className="disney-card border-4 border-disney-blue-200 p-8 md:p-10">
              {familyMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-700 mb-2">まずは家族メンバーを登録</h2>
                  <p className="text-gray-600 mb-6">家族構成と好みを設定してメニューを生成しましょう</p>
                  <button
                    onClick={() => setCurrentPage('settings')}
                    className="bg-gradient-to-r from-disney-blue-500 to-disney-purple-500 hover:from-disney-blue-600 hover:to-disney-purple-600 disney-button text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    基本設定へ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-6 h-6 text-orange-600" />
                      <span className="text-3xl font-bold text-orange-600">{familyMembers.length}人分</span>
                    </div>
                    <p className="text-sm text-gray-600">のメニューを生成します</p>
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <div className="flex flex-wrap justify-center gap-2 mb-3">
                        {familyMembers.map((member, idx) => (
                          <span key={idx} className="text-sm bg-white px-3 py-1 rounded-full border border-orange-300">
                            {member.name}
                          </span>
                        ))}
                      </div>
                      {preferredTypes.length > 0 && (
                        <p className="text-sm text-gray-700">
                          <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                          多め: {preferredTypes.map(id => cuisineTypes.find(c => c.id === id)?.label).join('、')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        開始日
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        終了日
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-sm font-medium text-center">{error}</p>}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-disney-blue-500 to-disney-purple-500 hover:from-disney-blue-600 hover:to-disney-purple-600 disney-button text-white text-xl font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-3"
                  >
                    {isLoading ? (<><Loader2 className="w-6 h-6 animate-spin" />生成中...</>) : ('メニューを生成')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage('settings')}
                    className="w-full border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 text-lg font-semibold py-3 px-6 rounded-xl hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    設定を変更
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-orange-50 rounded-lg"><div className="text-2xl font-bold text-orange-600">7</div><div className="text-xs text-gray-600 mt-1">日分のメニュー</div></div>
                  <div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">自動</div><div className="text-xs text-gray-600 mt-1">買い物リスト</div></div>
                  <div className="p-4 bg-amber-50 rounded-lg"><div className="text-2xl font-bold text-amber-600">在庫</div><div className="text-xs text-gray-600 mt-1">管理機能</div></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="disney-card border-4 border-disney-blue-200 p-8 md:p-10 space-y-6">
              <FamilySettings />

              <div className="border-t-2 border-gray-200 pt-6 space-y-4">
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-700 mb-3">
                    <Flame className="w-5 h-5 mr-2 text-orange-500" />
                    多めにしたい料理の種類
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cuisineTypes.map((cuisine) => (
                      <button
                        key={cuisine.id}
                        type="button"
                        onClick={() => toggleCuisineType(cuisine.id)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                          preferredTypes.includes(cuisine.id)
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <span className="mr-2">{cuisine.emoji}</span>
                        {cuisine.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">複数選択できます</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentPage('home')}
                className="w-full bg-gradient-to-r from-disney-blue-500 to-disney-purple-500 hover:from-disney-blue-600 hover:to-disney-purple-600 disney-button text-white text-xl font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                設定を保存してホームへ
              </button>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">週間メニュー</h2>
            {!planData ? (
              <div className="disney-card border-4 border-disney-blue-200 p-8 text-gray-600">
                まずホームで人数を入力して「今週のメニューを生成」を押してください。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planData.menu.map((item, idx) => {
                  const mainDish = item.ingredients.dishes.find(d => d.category === '主菜');
                  const isDragging = draggedMenuIndex === idx;
                  const isDragOver = dragOverMenuIndex === idx;

                  const menuDate = item.date ? new Date(item.date) : null;
                  const dateStr = menuDate ? menuDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) : '';
                  const isToday = menuDate ? menuDate.toDateString() === new Date().toDateString() : false;

                  return (
                    <div
                      key={idx}
                      data-menu-card-index={idx}
                      draggable
                      onDragStart={(e) => handleMenuDragStart(e, idx)}
                      onDragOver={(e) => handleMenuDragOver(e, idx)}
                      onDragEnd={handleMenuDragEnd}
                      onTouchStart={(e) => handleMenuTouchStart(e, idx)}
                      onTouchMove={handleMenuTouchMove}
                      onTouchEnd={handleMenuTouchEnd}
                      className={`rounded-2xl shadow p-6 relative cursor-move transition-all ${
                        isToday ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border-2 border-transparent'
                      } ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${isDragOver && !isDragging ? 'border-blue-500 bg-blue-50' : ''}`}
                    >
                      <div className="absolute top-4 left-4">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      <button
                        onClick={() => toggleFavorite(item.dish, mainDish?.ingredients || [])}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            isFavorite(item.dish)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <div className="mb-4 pl-8 pr-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-800">
                            {dateStr} ({item.day})
                          </span>
                          {isToday && (
                            <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full font-semibold">
                              今日
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleMenu(idx);
                            }}
                            disabled={isRefreshingMenu === idx}
                            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                            title="メニューを変更"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshingMenu === idx ? 'animate-spin' : ''}`} />
                          </button>
                          <span className="text-lg font-bold text-gray-800">{item.dish}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {item.ingredients.dishes.map((dish, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className={`text-xs font-semibold min-w-[40px] ${
                              dish.category === '主食' ? 'text-amber-600' :
                              dish.category === '主菜' ? 'text-orange-600' :
                              dish.category === '副菜' ? 'text-green-600' :
                              'text-blue-600'
                            }`}>{dish.category}</span>
                            <span className="text-sm font-medium text-gray-800">{dish.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'shopping':
        const ShoppingListContent = () => {
          const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
          const [dailyMenusData, setDailyMenusData] = useState<any[]>([]);
          const [isLoading, setIsLoading] = useState(true);

          useEffect(() => {
            const loadData = async () => {
              setIsLoading(true);
              const menus = await loadDailyMenus();
              setDailyMenusData(menus);
              const list = await calculateShoppingListFromDailyMenus(inventory);
              setShoppingList(list);
              setIsLoading(false);
            };
            loadData();
          }, [inventory]);

          const getIngredientBreakdown = (ingredientName: string) => {
            const breakdown: { date: string; dish: string; category: string; dishName: string; qty: number; unit: string }[] = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            dailyMenusData.forEach(menuItem => {
              const menuDate = new Date(menuItem.menu_date);
              menuDate.setHours(0, 0, 0, 0);

              if (menuDate < today) return;

              const allIngredients = getAllIngredientsWithCategoryFromFullMenu(menuItem.ingredients);
              allIngredients.forEach(ing => {
                if (ing.name === ingredientName) {
                  const dateStr = menuDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
                  breakdown.push({
                    date: dateStr,
                    dish: menuItem.dish,
                    category: ing.category,
                    dishName: ing.dishName,
                    qty: ing.qty,
                    unit: ing.unit,
                  });
                }
              });
            });

            return breakdown;
          };

          const getTotalNeededForIngredient = (ingredientName: string): { qty: number; unit: string } | null => {
            let totalQty = 0;
            let unit = '';

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            dailyMenusData.forEach(menuItem => {
              const menuDate = new Date(menuItem.menu_date);
              menuDate.setHours(0, 0, 0, 0);

              if (menuDate < today) return;

              const allIngredients = getAllIngredientsFromFullMenu(menuItem.ingredients);
              allIngredients.forEach(ing => {
                if (ing.name === ingredientName) {
                  totalQty += ing.qty;
                  unit = ing.unit;
                }
              });
            });

            return totalQty > 0 ? { qty: totalQty, unit } : null;
          };

          if (isLoading) {
            return (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">買い物リスト</h2>
                <div className="disney-card border-4 border-disney-blue-200 p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </div>
              </div>
            );
          }

          if (dailyMenusData.length === 0) {
            return (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">買い物リスト</h2>
                <div className="disney-card border-4 border-disney-blue-200 p-8 text-gray-600">
                  まずホームで人数を入力して「今週のメニューを生成」を押してください。
                </div>
              </div>
            );
          }

          return (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">買い物リスト</h2>
              <ShoppingList
                items={shoppingList}
                getIngredientBreakdown={getIngredientBreakdown}
                inventory={inventory}
                getTotalNeeded={getTotalNeededForIngredient}
                onInventoryUpdate={async () => {
                  const savedInventory = await loadInventory();
                  setInventory(savedInventory);
                  const newList = await calculateShoppingListFromDailyMenus(savedInventory);
                  setShoppingList(newList);
                }}
                onShoppingMode={() => setCurrentPage('shopping-mode')}
              />
            </div>
          );
        };

        return <ShoppingListContent />;

      case 'shopping-mode':
        const ShoppingModeContent = () => {
          const [shoppingModeList, setShoppingModeList] = useState<ShoppingListItem[]>([]);
          const [isLoading, setIsLoading] = useState(true);

          useEffect(() => {
            const loadData = async () => {
              setIsLoading(true);
              const list = await calculateShoppingListFromDailyMenus(inventory);
              setShoppingModeList(list);
              setIsLoading(false);
            };
            loadData();
          }, [inventory]);

          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            );
          }

          return (
            <ShoppingMode
              items={shoppingModeList}
              onBack={async () => {
                const savedInventory = await loadInventory();
                setInventory(savedInventory);
                setCurrentPage('shopping');
              }}
              onInventoryUpdate={async () => {
                const savedInventory = await loadInventory();
                setInventory(savedInventory);
              }}
            />
          );
        };

        return <ShoppingModeContent />;

      case 'calendar':
        return <CalendarView />;

      case 'favorites':
        return <FavoritesView />;

      case 'inventory':
        const addInventoryItem = async () => {
          if (!newItemName || !newItemQty) return;

          const qty = parseFloat(newItemQty);
          if (isNaN(qty) || qty <= 0) return;

          try {
            const existingIndex = inventory.findIndex(
              item => item.name === newItemName && item.unit === newItemUnit
            );

            let updated: InventoryItem[];
            if (existingIndex >= 0) {
              updated = [...inventory];
              updated[existingIndex].qty += qty;
              await saveInventoryItem(updated[existingIndex]);
            } else {
              const newItem = { name: newItemName, qty, unit: newItemUnit };
              await saveInventoryItem(newItem);
              updated = [...inventory, newItem];
            }
            setInventory(updated);

            setNewItemName('');
            setNewItemQty('');
            setNewItemUnit('個');
          } catch (error) {
            console.error('Error adding inventory item:', error);
            alert('在庫の追加中にエラーが発生しました: ' + (error as Error).message);
          }
        };

        const updateInventoryQty = async (index: number, delta: number) => {
          try {
            const updated = [...inventory];
            updated[index].qty = Math.max(0, updated[index].qty + delta);

            if (updated[index].qty === 0) {
              await deleteInventoryItem(updated[index].name, updated[index].unit);
              updated.splice(index, 1);
            } else {
              await saveInventoryItem(updated[index]);
            }
            setInventory(updated);
          } catch (error) {
            console.error('Error updating inventory qty:', error);
          }
        };

        const deleteInventoryItemAtIndex = async (index: number) => {
          try {
            const item = inventory[index];
            await deleteInventoryItem(item.name, item.unit);
            const updated = inventory.filter((_, i) => i !== index);
            setInventory(updated);
          } catch (error) {
            console.error('Error deleting inventory item:', error);
          }
        };

        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">在庫管理</h2>

            <div className="disney-card border-4 border-disney-blue-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">在庫を追加</h3>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="食材名"
                  className="flex-1 min-w-[150px] border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
                <input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  placeholder="数量"
                  min="0"
                  step="0.1"
                  className="w-24 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                >
                  <option value="個">個</option>
                  <option value="本">本</option>
                  <option value="束">束</option>
                  <option value="丁">丁</option>
                  <option value="枚">枚</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="片">片</option>
                </select>
                <button
                  onClick={addInventoryItem}
                  className="bg-gradient-to-r from-disney-blue-500 to-disney-purple-500 hover:from-disney-blue-600 hover:to-disney-purple-600 disney-button text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  追加
                </button>
              </div>
            </div>

            <div className="disney-card border-4 border-disney-blue-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">現在の在庫</h3>
              {inventory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">在庫がありません</p>
              ) : (
                <div className="space-y-2">
                  {inventory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-lg">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => updateInventoryQty(index, -1)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="font-bold text-gray-800 px-3 min-w-[80px] text-center">
                            {item.qty}{item.unit}
                          </span>
                          <button
                            onClick={() => updateInventoryQty(index, 1)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteInventoryItemAtIndex(index)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'help':
        return <HelpPage onClose={() => setCurrentPage('home')} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (authMode === 'login') {
      return <LoginForm onSwitchToSignUp={() => setAuthMode('signup')} />;
    } else {
      return <SignUpForm onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="disney-card shadow-lg border-b-4 border-disney-blue-300 px-4 py-4 flex items-center justify-between mx-2 my-2 rounded-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-disney-blue-500 to-disney-purple-500 rounded-full flex items-center justify-center shadow-disney transform hover:rotate-12 transition-transform animate-float">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black font-disney gold-accent">✨ 魔法のキッチン ✨</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('help')}
            className="disney-button flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-bold">使い方</span>
          </button>
          <button
            onClick={signOut}
            className="disney-button flex items-center gap-2 bg-rose-400 hover:bg-rose-500 text-white px-4 py-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">ログアウト</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 pb-24">
          {renderContent()}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-disney-blue-50 via-indigo-50 to-disney-purple-50 border-t-4 border-disney-gold-400 shadow-disney-lg z-50 safe-area-inset-bottom rounded-t-3xl">
        <div className="flex justify-around items-center px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all transform hover:scale-110 ${
                  isActive ? 'text-disney-blue-600' : 'text-gray-500'
                }`}
              >
                <div className={`p-2 rounded-2xl transition-all ${
                  isActive ? 'bg-disney-blue-400 shadow-cute' : 'bg-transparent'
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white scale-110' : ''} transition-transform`} />
                </div>
                <span className={`text-xs font-bold ${
                  isActive ? 'text-disney-blue-600' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
