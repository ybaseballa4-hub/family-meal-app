import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Calendar, User, Heart, ThumbsDown, Edit2, Check, X, Target, Activity, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FamilyMember {
  id?: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  appetite_level: number;
  likes?: string;
  dislikes?: string;
}

type FamilyMode = 'normal' | 'diet' | 'muscle';

export function FamilySettings() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyMode, setFamilyMode] = useState<FamilyMode>('normal');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember>({
    name: '',
    birth_date: '',
    gender: 'male',
    appetite_level: 3,
    likes: '',
    dislikes: '',
  });

  useEffect(() => {
    loadFamilyMembers();
    loadFamilyMode();
  }, [user]);

  const loadFamilyMembers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
  };

  const loadFamilyMode = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('family_mode')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setFamilyMode((data.family_mode as FamilyMode) || 'normal');
    }
  };

  const updateFamilyMode = async (mode: FamilyMode) => {
    if (!user) return;

    setFamilyMode(mode);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        family_mode: mode,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating family mode:', error);
    }
  };

  const addMember = async () => {
    if (!user || !editingMember.name || !editingMember.birth_date) return;

    const { error } = await supabase
      .from('family_members')
      .insert({
        user_id: user.id,
        name: editingMember.name,
        birth_date: editingMember.birth_date,
        gender: editingMember.gender,
        appetite_level: editingMember.appetite_level,
        likes: editingMember.likes || '',
        dislikes: editingMember.dislikes || '',
      });

    if (!error) {
      await loadFamilyMembers();
      setIsAdding(false);
      setEditingMember({
        name: '',
        birth_date: '',
        gender: 'male',
        appetite_level: 3,
        likes: '',
        dislikes: '',
      });
    }
  };

  const updateMember = async (id: string, updates: Partial<FamilyMember>) => {
    if (!user) return;

    const { error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadFamilyMembers();
      setEditingMemberId(null);
    }
  };

  const startEditingMember = (member: FamilyMember) => {
    setEditingMemberId(member.id || null);
  };

  const cancelEditing = () => {
    setEditingMemberId(null);
  };

  const deleteMember = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadFamilyMembers();
    }
  };

  const getAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender: string): string => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '不明';
    }
  };

  const getGenderEmoji = (gender: string): string => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'other': return '👤';
      default: return '👤';
    }
  };

  const getAppetiteLabel = (level: number): string => {
    const labels = ['少なめ', 'やや少なめ', '普通', 'やや多め', '多め'];
    return labels[level - 1] || '普通';
  };

  const getModeInfo = (mode: FamilyMode) => {
    switch (mode) {
      case 'normal':
        return {
          icon: Utensils,
          label: '通常モード',
          description: 'バランスの良い食事を提案します',
          color: 'blue',
          gradient: 'from-blue-500 to-blue-600',
          hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
        };
      case 'diet':
        return {
          icon: Target,
          label: 'ダイエットモード',
          description: '低カロリーでヘルシーな食事を提案します',
          color: 'green',
          gradient: 'from-green-500 to-green-600',
          hoverGradient: 'hover:from-green-600 hover:to-green-700',
        };
      case 'muscle':
        return {
          icon: Activity,
          label: '筋トレモード',
          description: '高タンパク質で筋肉をサポートする食事を提案します',
          color: 'orange',
          gradient: 'from-orange-500 to-orange-600',
          hoverGradient: 'hover:from-orange-600 hover:to-orange-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          家族の健康目標
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          家族全体の食事モードを選択してください。メニュー生成時に自動的に反映されます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['normal', 'diet', 'muscle'] as FamilyMode[]).map((mode) => {
            const info = getModeInfo(mode);
            const Icon = info.icon;
            const isSelected = familyMode === mode;
            return (
              <button
                key={mode}
                onClick={() => updateFamilyMode(mode)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `border-${info.color}-500 bg-${info.color}-50 shadow-lg scale-105`
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${info.gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{info.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{info.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-800">家族構成</h3>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="disney-button px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            メンバー追加
          </button>
        )}
      </div>

      {isAdding && (
        <div className="border-2 border-purple-300 rounded-xl p-6 bg-purple-50">
          <h4 className="text-lg font-bold text-gray-800 mb-4">新しいメンバーを追加</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                名前
              </label>
              <input
                type="text"
                value={editingMember.name}
                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                placeholder="例：太郎"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                生年月日
              </label>
              <input
                type="date"
                value={editingMember.birth_date}
                onChange={(e) => setEditingMember({ ...editingMember, birth_date: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                性別
              </label>
              <select
                value={editingMember.gender}
                onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as 'male' | 'female' | 'other' })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              >
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                食べる量（5段階）
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editingMember.appetite_level}
                  onChange={(e) => setEditingMember({ ...editingMember, appetite_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>少なめ</span>
                  <span>普通</span>
                  <span>多め</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-purple-600">
                    {getAppetiteLabel(editingMember.appetite_level)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1 text-green-500" />
                好きな食材・料理
              </label>
              <input
                type="text"
                value={editingMember.likes || ''}
                onChange={(e) => setEditingMember({ ...editingMember, likes: e.target.value })}
                placeholder="例：トマト、チーズ、カレー"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ThumbsDown className="w-4 h-4 inline mr-1 text-red-500" />
                苦手な食材・料理
              </label>
              <input
                type="text"
                value={editingMember.dislikes || ''}
                onChange={(e) => setEditingMember({ ...editingMember, dislikes: e.target.value })}
                placeholder="例：ナス、ピーマン、魚"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={addMember}
                disabled={!editingMember.name || !editingMember.birth_date}
                className="flex-1 disney-button px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingMember({
                    name: '',
                    birth_date: '',
                    gender: 'male',
                    appetite_level: 3,
                    likes: '',
                    dislikes: '',
                  });
                }}
                className="flex-1 disney-button px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>まだ家族メンバーが登録されていません</p>
          <p className="text-sm mt-2">「メンバー追加」ボタンから登録してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isEditing = editingMemberId === member.id;
            return (
              <div
                key={member.id}
                className="border-2 border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getGenderEmoji(member.gender)}</span>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{member.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getAge(member.birth_date)}歳 ({getGenderLabel(member.gender)})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => startEditingMember(member)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => member.id && deleteMember(member.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="ml-12 space-y-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(member.birth_date).toLocaleDateString('ja-JP')}
                    </span>
                    <span className="font-semibold text-purple-600">
                      食べる量: {getAppetiteLabel(member.appetite_level)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <Heart className="w-3 h-3 inline mr-1 text-green-500" />
                          好きな食材・料理
                        </label>
                        <input
                          type="text"
                          defaultValue={member.likes || ''}
                          onBlur={(e) => member.id && updateMember(member.id, { likes: e.target.value })}
                          placeholder="例：トマト、チーズ、カレー"
                          className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <ThumbsDown className="w-3 h-3 inline mr-1 text-red-500" />
                          苦手な食材・料理
                        </label>
                        <input
                          type="text"
                          defaultValue={member.dislikes || ''}
                          onBlur={(e) => member.id && updateMember(member.id, { dislikes: e.target.value })}
                          placeholder="例：ナス、ピーマン、魚"
                          className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={cancelEditing}
                          className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                        >
                          完了
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {member.likes && (
                        <div className="flex items-start gap-1">
                          <Heart className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{member.likes}</span>
                        </div>
                      )}
                      {member.dislikes && (
                        <div className="flex items-start gap-1">
                          <ThumbsDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{member.dislikes}</span>
                        </div>
                      )}
                      {!member.likes && !member.dislikes && (
                        <p className="text-xs text-gray-400 italic">好みが未設定です（編集ボタンから追加できます）</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
