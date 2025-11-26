import React from 'react';
import { X, Home, Settings, Calendar, Star, ShoppingCart, Package, Users, ArrowLeft } from 'lucide-react';

interface HelpPageProps {
  onClose: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = React.useState<string>('overview');

  const sections = [
    { id: 'overview', title: '概要', icon: Home },
    { id: 'menu', title: '献立生成', icon: Home },
    { id: 'calendar', title: 'カレンダー', icon: Calendar },
    { id: 'rating', title: '評価機能', icon: Star },
    { id: 'favorites', title: 'お気に入り', icon: Star },
    { id: 'shopping', title: '買い物リスト', icon: ShoppingCart },
    { id: 'family', title: '家族モード', icon: Users },
    { id: 'inventory', title: '在庫管理', icon: Package },
    { id: 'settings', title: '基本設定', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">使い方ガイド</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r overflow-y-auto bg-gray-50">
            <nav className="p-4 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-orange-500 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">魔法のキッチンへようこそ</h3>

                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    毎日の献立作りの悩みを解決する献立管理アプリです。
                    好みや苦手な食材を登録するだけで、1週間分の献立を自動生成します。
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Home className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">自動献立生成</h4>
                    <p className="text-gray-600">
                      好きな料理や苦手な食材を考慮して、バラエティ豊かな1週間分の献立を自動で作成します。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">評価システム</h4>
                    <p className="text-gray-600">
                      作った料理を3つの観点から評価。自動でランク付けされ、お気に入りを管理できます。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <ShoppingCart className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">買い物リスト</h4>
                    <p className="text-gray-600">
                      献立から必要な食材を自動抽出。カテゴリ別に整理され、チェック機能で買い物を効率化。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">家族モード</h4>
                    <p className="text-gray-600">
                      家族メンバーそれぞれの好みを登録。全員が満足できる献立を提案します。
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">まずは基本設定から</h4>
                  <p className="text-gray-700">
                    左下の「基本設定」アイコンから、好きな料理や苦手な食材を登録しましょう。
                    その後、「メニュー」タブで献立を生成できます。
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'menu' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">献立の自動生成</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    「メニュー」タブで1週間分の献立を自動生成できます。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                      <h4 className="text-xl font-bold text-gray-800">メニュータブを開く</h4>
                    </div>
                    <p className="text-gray-600 ml-11">
                      画面下部のナビゲーションから「メニュー」タブを選択します。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                      <h4 className="text-xl font-bold text-gray-800">生成ボタンをクリック</h4>
                    </div>
                    <p className="text-gray-600 ml-11">
                      「新しい週のメニューを生成」ボタンをクリックすると、自動的に7日分の献立が作成されます。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                      <h4 className="text-xl font-bold text-gray-800">献立の変更</h4>
                    </div>
                    <p className="text-gray-600 ml-11">
                      気に入らない料理がある場合は、料理カードの「×」ボタンで別の料理に変更できます。
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">生成される献立の特徴</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>好きな料理が優先的に含まれる</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>苦手な食材を使った料理は除外される</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>高評価の料理が優先的に選ばれる</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>バラエティ豊かな献立構成</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'calendar' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">カレンダー機能</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    月単位で献立を管理し、過去の調理履歴も確認できます。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">日付の選択</h4>
                    <p className="text-gray-600 mb-3">
                      カレンダーの日付をクリックすると、その日の献立が表示されます。
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        緑の丸印は料理がある日を示します
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">料理の追加</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. カレンダーから日付を選択</li>
                      <li>2. 「料理を追加」ボタンをクリック</li>
                      <li>3. 料理名とメモ（オプション）を入力</li>
                      <li>4. 「追加」ボタンで保存</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">料理の削除</h4>
                    <p className="text-gray-600">
                      料理カードの「削除」ボタンで、その日の献立から料理を削除できます。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'rating' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">評価機能</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    作った料理を3つの観点から評価し、自動的にランク付けします。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">評価方法</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. カレンダーから料理カードをクリック</li>
                      <li>2. 評価ダイアログが表示されます</li>
                      <li>3. 3つの項目を星で評価</li>
                      <li>4. メモを入力（オプション）</li>
                      <li>5. 「評価を保存」ボタンで完了</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">評価項目</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">おいしさ</h5>
                          <p className="text-gray-600 text-sm">味の満足度を5段階で評価</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">調理時間</h5>
                          <p className="text-gray-600 text-sm">実際にかかった時間の妥当性を評価</p>
                          <p className="text-gray-500 text-xs mt-1">5つ星：短時間で完成、1つ星：予想以上に時間がかかった</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">また作りたい</h5>
                          <p className="text-gray-600 text-sm">リピートしたい度合いを評価</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">ランク判定</h4>
                    <p className="text-gray-600 mb-3">総合スコアに基づき、自動的にランク付けされます：</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                        <span className="w-8 h-8 bg-yellow-400 text-white font-bold rounded flex items-center justify-center">A</span>
                        <span className="text-gray-700">4.5〜5.0 - 超おすすめ！</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                        <span className="w-8 h-8 bg-gray-400 text-white font-bold rounded flex items-center justify-center">B</span>
                        <span className="text-gray-700">3.5〜4.4 - おすすめ</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                        <span className="w-8 h-8 bg-orange-400 text-white font-bold rounded flex items-center justify-center">C</span>
                        <span className="text-gray-700">2.5〜3.4 - まあまあ</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                        <span className="w-8 h-8 bg-red-400 text-white font-bold rounded flex items-center justify-center">D</span>
                        <span className="text-gray-700">0〜2.4 - イマイチ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'favorites' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">お気に入り管理</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    評価済みの料理をランク別に整理し、いつでも確認できます。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">ランク別フィルタ</h4>
                    <p className="text-gray-600 mb-3">
                      上部のタブで、表示する料理を絞り込めます：
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">お気に入り</span>
                        <span className="text-gray-500">- お気に入りに追加した料理</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-yellow-400 text-white text-xs font-bold rounded flex items-center justify-center">A</span>
                        <span className="font-medium">A級</span>
                        <span className="text-gray-500">- 総合評価4.5以上</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-400 text-white text-xs font-bold rounded flex items-center justify-center">B</span>
                        <span className="font-medium">B級</span>
                        <span className="text-gray-500">- 総合評価3.5〜4.4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-orange-400 text-white text-xs font-bold rounded flex items-center justify-center">C</span>
                        <span className="font-medium">C級</span>
                        <span className="text-gray-500">- 総合評価2.5〜3.4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-red-400 text-white text-xs font-bold rounded flex items-center justify-center">D</span>
                        <span className="font-medium">D級</span>
                        <span className="text-gray-500">- 総合評価2.4以下</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">料理カードの情報</h4>
                    <p className="text-gray-600 mb-3">各カードには以下の情報が表示されます：</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• 料理名</li>
                      <li>• 最後に作った日付</li>
                      <li>• 3つの評価（星表示）</li>
                      <li>• 総合評価スコア</li>
                      <li>• ランク（A〜D）</li>
                      <li>• メモ（入力されている場合）</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">お気に入りへの追加</h4>
                    <p className="text-gray-600">
                      料理カードの「お気に入りに追加」ボタンで、特に気に入った料理を「お気に入り」タブで管理できます。
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">ポイント</h4>
                  <p className="text-gray-700">
                    同じ料理を複数回作った場合、最新の評価で上書きされます。
                    日付も自動的に更新されるので、最後に作った日が常に表示されます。
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'shopping' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">買い物リスト</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    献立から必要な食材を自動抽出し、買い物をサポートします。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">リストの生成</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. 「買い物」タブを開く</li>
                      <li>2. 「買い物リストを生成」ボタンをクリック</li>
                      <li>3. 今週の献立から食材が自動抽出されます</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">カテゴリ別整理</h4>
                    <p className="text-gray-600 mb-3">
                      食材は以下のカテゴリに自動分類されます：
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                      <div>• 野菜</div>
                      <div>• 肉類</div>
                      <div>• 魚介類</div>
                      <div>• 乳製品</div>
                      <div>• 調味料</div>
                      <div>• その他</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">チェック機能</h4>
                    <p className="text-gray-600 mb-3">
                      各食材をタップすると、チェックマークが付きます。
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        チェック状態は自動保存され、次回開いたときも保持されます。
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">ショッピングモード</h4>
                    <p className="text-gray-600 mb-3">
                      「ショッピングモード」ボタンで、買い物中に便利な表示に切り替わります。
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>シンプルで大きな表示</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>スクロールしやすいレイアウト</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>買い物中の操作に最適化</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'family' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">家族モード</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    家族メンバーそれぞれの好みを管理し、全員が満足できる献立を提案します。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">家族モードの有効化</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. 「基本設定」タブを開く</li>
                      <li>2. 「家族モードを有効にする」をオンにする</li>
                      <li>3. 家族メンバーを追加できるようになります</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">メンバーの追加</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. メンバーの名前を入力</li>
                      <li>2. 好きな料理を登録</li>
                      <li>3. 苦手な食材を登録</li>
                      <li>4. 「メンバーを追加」ボタンで保存</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">メンバー情報の編集</h4>
                    <p className="text-gray-600">
                      各メンバーカードから、好きな料理や苦手な食材を追加・削除できます。
                      変更は即座に献立生成に反映されます。
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">献立への反映</h4>
                    <p className="text-gray-600 mb-3">
                      家族モードが有効な場合、献立生成時に：
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">✓</span>
                        <span>全メンバーの好きな料理が考慮されます</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">✓</span>
                        <span>誰か一人でも苦手な食材がある料理は除外されます</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">✓</span>
                        <span>家族全員が楽しめる献立が提案されます</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">個人モードへの切り替え</h4>
                  <p className="text-gray-700">
                    家族モードをオフにすると、自分の設定のみが使用されます。
                    メンバー情報は保持されるので、いつでも再度有効化できます。
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'inventory' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">在庫管理</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    冷蔵庫や食品庫の在庫を管理し、無駄な買い物を防ぎます。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">在庫の追加</h4>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. 「在庫」タブを開く</li>
                      <li>2. 食材名を入力</li>
                      <li>3. 数量と単位を入力（例：2個、300g）</li>
                      <li>4. カテゴリを選択</li>
                      <li>5. 「追加」ボタンで保存</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">カテゴリ分類</h4>
                    <p className="text-gray-600 mb-3">
                      在庫は以下のカテゴリに分類されます：
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-gray-700">野菜</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-700">肉類</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-700">魚介類</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-gray-700">乳製品</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className="text-gray-700">調味料</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded"></div>
                        <span className="text-gray-700">その他</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">在庫の削除</h4>
                    <p className="text-gray-600">
                      使い切った食材や古くなった在庫は、各カードの「削除」ボタンで削除できます。
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">活用のヒント</h4>
                  <p className="text-gray-700">
                    買い物から帰ったらすぐに在庫を登録する習慣をつけましょう。
                    献立を考える際に在庫を確認することで、無駄な買い物を防げます。
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">基本設定</h3>

                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-lg text-gray-700">
                    好きな料理や苦手な食材を登録し、献立生成をカスタマイズします。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">好きな料理の登録</h4>
                    <p className="text-gray-600 mb-3">
                      好きな料理を登録すると、献立生成時に優先的に提案されます。
                    </p>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. 「基本設定」タブを開く</li>
                      <li>2. 「好きな料理」欄に料理名を入力</li>
                      <li>3. 「追加」ボタンで保存</li>
                      <li>4. ×印で削除可能</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">苦手な食材の登録</h4>
                    <p className="text-gray-600 mb-3">
                      苦手な食材を登録すると、その食材を使う料理が献立から除外されます。
                    </p>
                    <ol className="space-y-2 text-gray-600">
                      <li>1. 「苦手な食材」欄に食材名を入力</li>
                      <li>2. 「追加」ボタンで保存</li>
                      <li>3. ×印で削除可能</li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">設定の反映</h4>
                    <p className="text-gray-600">
                      設定は即座に保存され、次回の献立生成から反映されます。
                      いつでも自由に追加・削除できます。
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-3">最初に設定しよう</h4>
                  <p className="text-gray-700 mb-3">
                    アプリを使い始める前に、以下を設定することをおすすめします：
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 text-xl">1.</span>
                      <span>好きな料理を5〜10個登録</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 text-xl">2.</span>
                      <span>アレルギーや苦手な食材を登録</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 text-xl">3.</span>
                      <span>家族で使う場合は家族モードを有効化</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
