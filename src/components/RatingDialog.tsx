import { useState } from 'react';
import { Star, Clock, Heart } from 'lucide-react';

interface RatingDialogProps {
  dishName: string;
  onSubmit: (rating: {
    tasteRating: number;
    cookingTimeRating: number;
    repeatDesire: number;
    overallScore: number;
    rank: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

export function RatingDialog({ dishName, onSubmit, onCancel }: RatingDialogProps) {
  const [tasteRating, setTasteRating] = useState(0);
  const [cookingTimeRating, setCookingTimeRating] = useState(0);
  const [repeatDesire, setRepeatDesire] = useState(0);
  const [notes, setNotes] = useState('');

  const calculateOverallScore = (taste: number, time: number, repeat: number) => {
    return (taste * 0.4 + time * 0.3 + repeat * 0.3).toFixed(2);
  };

  const getRank = (score: number) => {
    if (score >= 4.5) return 'A';
    if (score >= 3.5) return 'B';
    if (score >= 2.5) return 'C';
    return 'D';
  };

  const getRankLabel = (rank: string) => {
    switch (rank) {
      case 'A': return '大成功！';
      case 'B': return '良い感じ';
      case 'C': return 'まあまあ';
      case 'D': return '改善が必要';
      default: return '';
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return '';
    }
  };

  const overallScore = tasteRating > 0 && cookingTimeRating > 0 && repeatDesire > 0
    ? parseFloat(calculateOverallScore(tasteRating, cookingTimeRating, repeatDesire))
    : 0;
  const rank = overallScore > 0 ? getRank(overallScore) : '';

  const handleSubmit = () => {
    if (tasteRating === 0 || cookingTimeRating === 0 || repeatDesire === 0) {
      alert('すべての項目を評価してください');
      return;
    }

    onSubmit({
      tasteRating,
      cookingTimeRating,
      repeatDesire,
      overallScore,
      rank,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-900 mb-1">
          料理を評価
        </h2>

        <p className="text-gray-700 font-medium mb-2 text-xs">{dishName}</p>

        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              おいしさ
            </label>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTasteRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      value <= tasteRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              調理時間（短いほど高評価）
            </label>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCookingTimeRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      value <= cookingTimeRating
                        ? 'fill-green-400 text-green-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" />
              また作りたい
            </label>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRepeatDesire(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      value <= repeatDesire
                        ? 'fill-red-400 text-red-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={`p-2 rounded-lg border-2 ${rank ? getRankColor(rank) : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">総合評価</span>
              {rank ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{rank}</span>
                  <span className="text-xs">({overallScore.toFixed(1)})</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">すべて評価してください</span>
              )}
            </div>
            {rank && <p className="text-xs mt-0.5">{getRankLabel(rank)}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              メモ（任意）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：子供が喜んだ！、時間がかかりすぎた、など"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-xs"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-2.5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
          >
            評価を保存
          </button>
        </div>
      </div>
    </div>
  );
}
