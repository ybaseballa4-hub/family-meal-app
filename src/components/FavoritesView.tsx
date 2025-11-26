import { useState, useEffect } from 'react';
import { Star, Heart, Target, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CookingHistoryRecord {
  id: string;
  dish_name: string;
  cooked_date: string;
  taste_rating: number;
  difficulty_rating?: number;
  cooking_time_rating?: number;
  repeat_desire?: number;
  overall_score: number;
  rank: string;
  notes: string | null;
}

type RankFilter = 'favorite' | 'A' | 'B' | 'C' | 'D';

export function FavoritesView() {
  const { user } = useAuth();
  const [selectedRank, setSelectedRank] = useState<RankFilter>('favorite');
  const [history, setHistory] = useState<CookingHistoryRecord[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
    loadFavorites();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cooking_history')
      .select('*')
      .eq('user_id', user.id)
      .order('cooked_date', { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('favorite_dishes')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data && data.favorite_dishes) {
      setFavorites(data.favorite_dishes);
    }
  };

  const getUniqueDishesByRank = (rank: string) => {
    const dishMap = new Map<string, CookingHistoryRecord>();

    history
      .filter(record => record.rank === rank)
      .forEach(record => {
        if (!dishMap.has(record.dish_name)) {
          dishMap.set(record.dish_name, record);
        }
      });

    return Array.from(dishMap.values());
  };

  const getFavoriteDishes = () => {
    const dishMap = new Map<string, CookingHistoryRecord>();

    history
      .filter(record => favorites.includes(record.dish_name))
      .forEach(record => {
        if (!dishMap.has(record.dish_name)) {
          dishMap.set(record.dish_name, record);
        }
      });

    return Array.from(dishMap.values());
  };

  const getFilteredDishes = () => {
    if (selectedRank === 'favorite') {
      return getFavoriteDishes();
    }
    return getUniqueDishesByRank(selectedRank);
  };

  const getCount = (filter: RankFilter) => {
    if (filter === 'favorite') {
      return getFavoriteDishes().length;
    }
    return getUniqueDishesByRank(filter).length;
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'B':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const tabs: Array<{ id: RankFilter; label: string }> = [
    { id: 'favorite', label: 'お気に入り' },
    { id: 'A', label: 'A級' },
    { id: 'B', label: 'B級' },
    { id: 'C', label: 'C級' },
    { id: 'D', label: 'D級' },
  ];

  const filteredDishes = getFilteredDishes();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">お気に入り・評価済みレシピ</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const count = getCount(tab.id);
          const isSelected = selectedRank === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedRank(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {filteredDishes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>このカテゴリーにはまだ料理がありません</p>
          <p className="text-sm mt-2">
            {selectedRank === 'favorite'
              ? 'お気に入りに追加した料理がここに表示されます'
              : `${selectedRank}評価の料理がここに表示されます`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDishes.map((record) => (
            <div
              key={record.id}
              className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{record.dish_name}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(record.cooked_date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-lg border-2 font-bold text-lg ${getRankColor(record.rank)}`}>
                  {record.rank}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">おいしさ</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`w-4 h-4 ${
                          value <= record.taste_rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {record.difficulty_rating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      難易度
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`w-4 h-4 ${
                            value <= record.difficulty_rating!
                              ? 'fill-blue-400 text-blue-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {record.cooking_time_rating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      調理時間
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`w-4 h-4 ${
                            value <= record.cooking_time_rating!
                              ? 'fill-green-400 text-green-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {record.repeat_desire && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      また作りたい
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`w-4 h-4 ${
                            value <= record.repeat_desire!
                              ? 'fill-red-400 text-red-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">総合評価</span>
                    <span className="text-lg font-bold text-gray-800">{record.overall_score}</span>
                  </div>
                </div>

                {record.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
