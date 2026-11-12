/* NamaHam 用チュートリアル設定（NamaTutorial キット v1）
   キャラの口調: 基本は丁寧語。文末は「です」「ます」の代わりに「ナマ」を語幹へ直接付ける
   （例: 機能の一覧ナマ／できナマ／仰せつかってナマ／お疲れナマ。規格参照） */
window.NAMA_TUTORIAL_CONFIG = {
  appId: 'namaham',
  assetBase: 'tutorial/img/',
  buttonImage: 'tutorial/img/tutorial-button.png',
  buttonPages: ['main'], // 設定モーダル表示中はボタンを隠す（パネルに被らないように）
  buttonSize: 54, // 純／平ボタンに寄せて少し小さく
  buttonOffsetRight: 66, // 右端の「純／平」ボタンを避けて少し左に置く
  bridge: 'NamaHamTutorialBridge',
  introTitle: 'NamaHamの使い方',
  introText: 'このアプリの使い方を、実際の画面を触りながら案内しナマ。1分くらいで終わりナマ。',
  chapters: [
    {
      id: 'intro', page: 'main', title: 'はじめに', desc: '鍵盤の弾き方と、この案内の使い方', icon: 'wave', since: 1,
      steps: [
        { page: 'main', pose: 'wave', text: 'やあ！生物（ナマモノ）ナマ。このアプリの案内役を仰せつかってナマ。先に言っておくと、この案内はいつでも✕ボタンでやめられるし、やめた後も右下のボタンから見直せナマ。気楽にどうぞ。' },
        { page: 'main', target: '.keyboard', mode: 'tap', pose: 'point', text: 'ここが鍵盤ナマ。押すと音が出ナマ。いくつか同時に押すと和音も鳴らせナマ。試しに押してみるナマ。' },
        { page: 'main', target: '.gear-btn', pose: 'point', text: '左上の歯車は設定ナマ。コンサートピッチやテーマカラーはここから変えナマ。最後の章で案内しナマ。' }
      ]
    },
    {
      id: 'top', page: 'main', title: '上段の操作', desc: '移調・音色・持続音・音量・音域', icon: 'yay', since: 3,
      steps: [
        { page: 'main', target: '.ham-transpose-btn', pose: 'point', text: '「移調」ナマ。タップすると音名の一覧が出ナマ。縦にスワイプしても変えられナマ。自分の楽器の調に合わせて、音の高さを移し替えナマ。' },
        { page: 'main', target: '.ham-tone-btn', pose: 'point', text: '「音色」は8つありナマ。クラリネット、フルート、トランペット、オーボエ、ホルン、矩形波、正弦波、のこぎり波ナマ。タップで一覧、スワイプでも切り替えられナマ。' },
        { page: 'main', target: '.sustain-btn', mode: 'tap', pose: 'point', text: '「持続音」ナマ。押してみるナマ。オレンジ色に光ったらオンの合図ナマ。' },
        { page: 'main', target: '.keyboard', mode: 'tap', pose: 'point', text: 'この状態で鍵盤を押すと、指を離しても音が鳴り続けナマ。和音の響きをゆっくり確かめるのに便利ナマ。押してみるナマ。' },
        { page: 'main', target: '.sustain-btn', mode: 'tap', pose: 'point', text: '鳴り続けている音は、もう一度「持続音」を押すと止まりナマ。押してオフに戻すナマ。' },
        { page: 'main', target: '.vol-wrap', mode: 'free', pose: 'point', bubblePos: 'bottom', text: '音量ナマ。スピーカーの絵か数字をタップするとスライダーが出ナマ。上下のスワイプでも増えたり減ったりしナマ。試してみるナマ。' },
        { page: 'main', target: '.range-wrap', mode: 'free', pose: 'point', text: '「音域」ナマ。▼▲のボタンで、鍵盤全体を1オクターブずつ上下にずらせナマ（2つ上から2つ下まで）。スワイプでも動かせナマ。' }
      ]
    },
    {
      id: 'harmony', page: 'main', title: '和声と調', desc: '根音を弾く・調（純正律のピッチ調整）・純／平', icon: 'thinking', since: 1,
      steps: [
        { page: 'main', target: '.root-btn', mode: 'tap', pose: 'point', text: '「根音を弾く」ナマ。押すと待機状態になって、オレンジ色に光りナマ。押してみるナマ。' },
        { page: 'main', target: '.keyboard', mode: 'tap', pose: 'point', text: 'この状態で鍵盤を1つ押すと、その音が「調」の根音に設定されナマ（音は鳴らず、待機も終わりナマ）。純正律の基準を、弾いて決めたい時に使うナマ。' },
        { page: 'main', target: '.root-btn', pose: 'point', text: '待機を取り消したい時は、鍵盤を押す前にもう一度「根音を弾く」を押せば戻りナマ。' },
        { page: 'main', target: '.key-pill', pose: 'point', text: '「調」ナマ。純正律のピッチ調整の基準にする音はここナマ。通常は「自動判定」で、弾いた和音から根音とコード名を読み取って表示しナマ。タップすると一覧から手動でも選べて、自動判定にも戻せナマ。スワイプでも切り替えられナマ。' },
        { page: 'main', target: '.temp-btn', mode: 'tap', pose: 'point', text: '右端のボタンは「純」と「平」の切り替えナマ。純は純正律、平は平均律ナマ。押してみるナマ。' },
        { page: 'main', target: '.temp-btn', mode: 'tap', pose: 'point', text: 'もう一度押すと元に戻りナマ。' }
      ]
    },
    {
      id: 'settings', page: 'settings', title: '設定', desc: 'コンサートピッチ・テーマ・スリープ防止・言語など', icon: 'question', since: 1,
      steps: [
        { page: 'settings', target: '#ham-set-pitch', pose: 'point', text: '「コンサートピッチ」ナマ。A（ラ）の基準の周波数を、415〜466Hzの間で変えられナマ。今の値は、鍵盤の3段目にも薄く表示されてナマ。' },
        { page: 'settings', target: '#ham-set-theme', pose: 'point', text: '「テーマカラー」ナマ。画面の色合いを6つから選べナマ。' },
        { page: 'settings', target: '#ham-set-wake', pose: 'point', text: '「スリープ防止」をオンにすると、使っている間は画面が暗くならナマ。' },
        { page: 'settings', target: '#ham-set-lang', pose: 'point', text: '言語の切り替えナマ。Englishにすると、アプリの名前も「NamaHarmony」に変わりナマ。' },
        { page: 'settings', target: '#ham-set-tutorial', mode: 'free', pose: 'point', text: 'この案内のボタンの表示・非表示はここナマ。オフにすると右下のボタンが消えナマ。消してしまっても、ここに戻ればいつでも出せナマ。' },
        { page: 'settings', target: '#ham-set-install', pose: 'point', text: '一番下はインストールのボタン ナマ。このアプリをホーム画面に追加できナマ。NamaSoundPlusから開いている時は、単独で入れるかの確認が出ナマ。閉じる時は右上の×ナマ。' }
      ]
    }
  ]
};
