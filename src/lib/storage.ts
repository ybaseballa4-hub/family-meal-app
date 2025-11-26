import { supabase, getUserId } from './supabase';

export type UserSettings = {
  family_size: string;
  likes: string;
  dislikes: string;
  preferred_types: string[];
};

export type Ingredient = {
  name: string;
  qty: number;
  unit: string;
};

export type DishItem = {
  category: '主食' | '主菜' | '副菜' | '汁物';
  name: string;
  ingredients: Ingredient[];
};

export type FullMenu = {
  dishes: DishItem[];
};

export type FavoriteMenu = {
  dish: string;
  ingredients: Ingredient[];
};

export type MenuItem = {
  day: string;
  dish: string;
  ingredients: FullMenu | Ingredient[];
};

export type ShoppingListItem = {
  name: string;
  qty: number;
  unit: string;
};

export type WeeklyMenu = {
  menu: MenuItem[];
  shopping_list: ShoppingListItem[];
};

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      family_size: settings.family_size,
      likes: settings.likes,
      dislikes: settings.dislikes,
      preferred_types: settings.preferred_types,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function loadUserSettings(): Promise<UserSettings | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading settings:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    family_size: data.family_size || '',
    likes: data.likes || '',
    dislikes: data.dislikes || '',
    preferred_types: data.preferred_types || [],
  };
}

export async function saveFavoriteMenu(favorite: FavoriteMenu): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('favorite_menus')
    .insert({
      user_id: userId,
      dish: favorite.dish,
      ingredients: favorite.ingredients,
    });

  if (error) {
    console.error('Error saving favorite:', error);
    throw error;
  }
}

export async function removeFavoriteMenu(dish: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('favorite_menus')
    .delete()
    .eq('user_id', userId)
    .eq('dish', dish);

  if (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

export async function loadFavoriteMenus(): Promise<FavoriteMenu[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('favorite_menus')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading favorites:', error);
    return [];
  }

  return (data || []).map(item => ({
    dish: item.dish,
    ingredients: item.ingredients as { name: string; qty: number; unit: string }[],
  }));
}

export async function saveWeeklyMenu(weeklyMenu: WeeklyMenu): Promise<void> {
  const userId = await getUserId();
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { error } = await supabase
    .from('weekly_menus')
    .upsert({
      user_id: userId,
      week_start: weekStartStr,
      menu_data: weeklyMenu.menu,
      shopping_list: weeklyMenu.shopping_list,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,week_start'
    });

  if (error) {
    console.error('Error saving weekly menu:', error);
    throw error;
  }
}

export async function loadWeeklyMenu(): Promise<WeeklyMenu | null> {
  const userId = await getUserId();
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStartStr)
    .maybeSingle();

  if (error) {
    console.error('Error loading weekly menu:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    menu: data.menu_data as MenuItem[],
    shopping_list: data.shopping_list as ShoppingListItem[],
  };
}

export type InventoryItem = {
  name: string;
  qty: number;
  unit: string;
};

export async function saveInventoryItem(item: InventoryItem): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('inventory')
    .upsert({
      user_id: userId,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,name,unit'
    });

  if (error) {
    console.error('Error saving inventory:', error);
    throw error;
  }
}

export async function loadInventory(): Promise<InventoryItem[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading inventory:', error);
    return [];
  }

  return (data || []).map(item => ({
    name: item.name,
    qty: item.qty,
    unit: item.unit,
  }));
}

export async function deleteInventoryItem(name: string, unit: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('user_id', userId)
    .eq('name', name)
    .eq('unit', unit);

  if (error) {
    console.error('Error deleting inventory:', error);
    throw error;
  }
}
