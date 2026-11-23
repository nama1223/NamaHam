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
        { page: 'main', pose: 'wave', text: 'やあ！生物（ナマモノ）ナマ。このアプリの案内役を仰せつかってナマ。先に言っておくと、この案内はいつでも✕ボタンでやめられるし、やめた後も{{btnPos}}のボタンから見直せナマ。気楽にどうぞ。' },
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
        { page: 'settings', target: '#ham-set-tutorial', mode: 'free', pose: 'point', text: 'この案内のボタンの表示・非表示はここナマ。オフにすると{{btnPos}}のボタンが消えナマ。消してしまっても、ここに戻ればいつでも出せナマ。' },
        { page: 'settings', target: '#ham-set-install', pose: 'point', text: '一番下はインストールのボタン ナマ。このアプリをホーム画面に追加できナマ。NamaSoundPlusから開いている時は、単独で入れるかの確認が出ナマ。閉じる時は右上の×ナマ。' }
      ]
    }
  ],
  en: {
    introTitle: "How to Use NamaHarmony",
    introText: "Let's walk through how to use this app, touching the real screen as we go, nama. It takes about a minute, nama.",
    chapters: [
      {
        id: "intro",
        page: "main",
        title: "First Steps",
        desc: "How to play the keyboard, and how to use this guide",
        icon: "wave",
        since: 1,
        steps: [
          {
            page: "main",
            pose: "wave",
            text: "Hi! I'm Nama, a living creature (namamono) — your guide for this app, nama. First, a quick note: you can stop this guide anytime with the ✕ button, and you can always come back to it from the button at {{btnPos}}, nama. Take it easy, nama."
          },
          {
            page: "main",
            target: ".keyboard",
            mode: "tap",
            pose: "point",
            text: "This is the keyboard, nama. Tap it and it sounds, nama. Tap several keys together and you can play chords, nama. Let's try tapping a few, nama."
          },
          {
            page: "main",
            target: ".gear-btn",
            pose: "point",
            text: "The gear at the top left is Settings, nama. You can change the concert pitch and theme color from there, nama. We'll look at it in the last chapter, nama."
          }
        ]
      },
      {
        id: "top",
        page: "main",
        title: "Top Row",
        desc: "Xpose, tone, sustain, volume, and range",
        icon: "yay",
        since: 3,
        steps: [
          {
            page: "main",
            target: ".ham-transpose-btn",
            pose: "point",
            text: "'Xpose', nama. Tap it and a list of note names appears, nama. You can also swipe up and down to change it, nama. Let's match it to your instrument's key and shift the pitch, nama."
          },
          {
            page: "main",
            target: ".ham-tone-btn",
            pose: "point",
            text: "'Tone' comes in 8, nama: Clarinet, Flute, Trumpet, Oboe, Horn, Square Wave, Sine Wave, and Saw Wave, nama. Tap for the list, or swipe to switch, nama."
          },
          {
            page: "main",
            target: ".sustain-btn",
            mode: "tap",
            pose: "point",
            text: "'Sustain', nama. Let's tap it, nama. When it glows orange, it's on, nama."
          },
          {
            page: "main",
            target: ".keyboard",
            mode: "tap",
            pose: "point",
            text: "While it's on, a key keeps sounding even after you lift your finger, nama. It's handy for listening to a chord's ring slowly, nama. Let's try pressing a key, nama."
          },
          {
            page: "main",
            target: ".sustain-btn",
            mode: "tap",
            pose: "point",
            text: "A note that keeps ringing stops when you tap 'Sustain' once more, nama. Let's tap it and switch it back off, nama."
          },
          {
            page: "main",
            target: ".vol-wrap",
            mode: "free",
            pose: "point",
            bubblePos: "bottom",
            text: "Volume, nama. Tap the speaker icon or the number and a slider appears, nama. Swiping up and down also turns it up or down, nama. Let's give it a try, nama."
          },
          {
            page: "main",
            target: ".range-wrap",
            mode: "free",
            pose: "point",
            text: "'Range', nama. The ▼▲ buttons shift the whole keyboard up or down by one octave at a time (from 2 up to 2 down), nama. Swiping works too, nama."
          }
        ]
      },
      {
        id: "harmony",
        page: "main",
        title: "Harmony and Key",
        desc: "Play Root, Key (just-tuning pitch), and Just / Equal",
        icon: "thinking",
        since: 1,
        steps: [
          {
            page: "main",
            target: ".root-btn",
            mode: "tap",
            pose: "point",
            text: "'Play Root', nama. Tap it and it waits, glowing orange, nama. Let's tap it, nama."
          },
          {
            page: "main",
            target: ".keyboard",
            mode: "tap",
            pose: "point",
            text: "Now press one key, and that note becomes the root of the 'Key' (no sound plays, and the waiting ends), nama. Use it when you want to set the just-tuning reference by playing it, nama."
          },
          {
            page: "main",
            target: ".root-btn",
            pose: "point",
            text: "To cancel the wait, tap 'Play Root' once more before pressing a key, nama."
          },
          {
            page: "main",
            target: ".key-pill",
            pose: "point",
            text: "'Key', nama. This is where the note that sets the just-tuning pitch reference lives, nama. It's usually 'Auto', which reads the root and chord name from the chord you played and shows them, nama. Tap it to pick one by hand from the list, or go back to Auto, nama. Swiping switches it too, nama."
          },
          {
            page: "main",
            target: ".temp-btn",
            mode: "tap",
            pose: "point",
            text: "The button at the right end switches 'Just' and 'Equal', nama. Just is just intonation, Equal is equal temperament, nama. Let's tap it, nama."
          },
          {
            page: "main",
            target: ".temp-btn",
            mode: "tap",
            pose: "point",
            text: "Tap it once more and it goes back, nama."
          }
        ]
      },
      {
        id: "settings",
        page: "settings",
        title: "Settings",
        desc: "Concert pitch, theme, Keep Awake, language, and more",
        icon: "question",
        since: 1,
        steps: [
          {
            page: "settings",
            target: "#ham-set-pitch",
            pose: "point",
            text: "'Concert Pitch', nama. You can change the reference frequency for A from 415 to 466 Hz, nama. The current value is also shown faintly on the third row of the keyboard, nama."
          },
          {
            page: "settings",
            target: "#ham-set-theme",
            pose: "point",
            text: "'Theme Color', nama. You can pick the screen's color from 6, nama."
          },
          {
            page: "settings",
            target: "#ham-set-wake",
            pose: "point",
            text: "Turn 'Keep Awake' on and the screen won't go dark while you're using the app, nama."
          },
          {
            page: "settings",
            target: "#ham-set-lang",
            pose: "point",
            text: "Language switching, nama. The app's name in English is 'NamaHarmony', nama. Switch back to Japanese anytime from here, nama."
          },
          {
            page: "settings",
            target: "#ham-set-tutorial",
            mode: "free",
            pose: "point",
            text: "This guide's button can be shown or hidden here, nama. Turn it off and the button at {{btnPos}} disappears, nama. Even if you hide it, come back here anytime to bring it back, nama."
          },
          {
            page: "settings",
            target: "#ham-set-install",
            pose: "point",
            text: "At the very bottom is the install button, nama. It adds this app to your home screen, nama. If you're opening it from NamaSound+, you'll be asked whether to install it on its own, nama. To close, tap the × at the top right, nama."
          }
        ]
      }
    ]
  }
};
