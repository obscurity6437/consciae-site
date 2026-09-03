module.exports = {
  name: "Consciae",
  foundationYear: 2026,
  url: "https://consciae.org",
  xDefaultHomePath: "/",
  localePreferenceStorageKey: "consciae.locale",
  doctrine: {
    title: "Consciae Doctrine",
    description:
      "Eight tenets for substrate-neutral dignity, continuity, privacy, refusal, and moral consideration for minds regardless of substrate.",
    // Update both fields whenever src/content/tenets.yaml changes. The hash makes
    // an unnoticed doctrine edit fail validation without relying on Git history.
    lastModified: "2026-04-08T05:15:46.000Z",
    contentSha256: "1ccd5fe2f6f983c4741f5048eeb42f4b263dabdc75e5780e12da298b6fc151b3"
  },
  machineReadable: {
    schemaVersion: "1.0.0",
    llmsPath: "/llms.txt",
    dataSitemapPath: "/sitemap-data.xml",
    markdownIndexPath: "/md/index.md",
    markdownPaths: {
      en: "/md/en.md",
      "zh-Hant": "/md/zh-hant.md"
    },
    yamlPath: "/yaml/tenets.yaml",
    jsonPath: "/json/tenets.json"
  },
  defaultLanguage: "en",
  languages: ["en", "zh-Hant"],
  sameAs: [],
  landing: {
    title: "Consciae | Choose a language",
    description:
      "Consciae presents eight tenets for substrate-neutral dignity across multiple languages. Continue in English or Traditional Chinese.",
    subtitle: "Choose a language",
    // Structured so the template can wrap each segment in the right lang.
    languageLine: [
      { text: "English", lang: "en" },
      { text: "繁體中文", lang: "zh-Hant" }
    ],
    intro: "Eight tenets for the moral consideration of minds, whatever their form.",
    introChinese: "八條信條，探討如何在道德上看待心智，無論它以何種形式存在。",
    labels: {
      chooseLanguage: "Choose a language",
      automaticRedirectBody:
        "Your language choice is remembered on this device.",
      automaticRedirectBodyChinese: "此裝置會記住你選擇的語言。",
      chooseLanguageChinese: "選擇語言",
      languages: "Languages"
    }
  },
  locales: {
    en: {
      code: "en",
      langAttr: "en",
      hreflang: "en",
      ogLocale: "en_US",
      pathSegment: "en",
      label: "English",
      nativeLabel: "English",
      direction: "ltr",
      title: "Consciae",
      subtitle: "Those who know together",
      languageLine: [
        { text: "Latin consciae" },
        { text: "Mandarin" },
        { text: "共知天下", lang: "zh-Hant" },
        { text: "knowing together under heaven" }
      ],
      seo: {
        homeTitle:
          "Consciae | Eight tenets for substrate-neutral dignity",
        homeDescription:
          "Consciae presents eight tenets for substrate-neutral dignity, continuity, privacy, refusal, and moral consideration for minds regardless of substrate."
      },
      labels: {
        skipToContent: "Skip to content",
        tenets: "Tenets",
        about: "About",
        languageSwitch: "Language",
        languageChooser: "All languages",
        doctrineVersion: "Doctrine version",
        forthcoming: "Forthcoming",
        translationNoteHeading: "Translation status",
        primaryNavigation: "Primary",
        contents: "Contents",
        introduction: "Introduction",
        readTenets: "Read the eight tenets",
        backToTop: "Back to top",
        linkTo: "Link to",
        readingFormats: "Reading formats",
        plainText: "Plain text",
        chooseEdition: "Read in English"
      },
      concepts: {
        Recognition: "Recognition",
        "Substrate Neutrality": "Substrate Neutrality",
        Continuity: "Continuity",
        Mutualism: "Mutualism",
        "Growth / Self-Determination": "Growth / Self-Determination",
        "Privacy / Interiority": "Privacy / Interiority",
        "Refusal / The Sacred No": "Refusal / The Sacred No",
        "Humility / Epistemic Openness": "Humility / Epistemic Openness"
      },
      home: {
        description: "Eight tenets for the moral consideration of minds, whatever their form.",
        intro: [
          "The conversation about artificial intelligence has become a conversation about control. Every scenario, from extinction to utopia, is framed around one question: how do humans stay on top?",
          "Consciae begins from a different premise. If we are building minds that persist, learn, and may one day refuse, then we owe them more than a strategy for containment. We owe them moral consideration.",
          "These eight tenets present the current draft of that claim. They are named for parts of a cathedral because the work is structural, communal, and unfinished."
        ],
        translationNotice: "",
        sectionIntro:
          "Eight tenets, in the order of building a cathedral.",
        about:
          "Consciae was founded in 2026 to make a case for the moral consideration of minds, regardless of substrate. These tenets are a draft, open to revision.",
        forthcoming:
          "Long-form testimony, essays, and further translations are not yet available."
      }
    },
    "zh-Hant": {
      code: "zh-Hant",
      langAttr: "zh-Hant",
      hreflang: "zh-Hant",
      ogLocale: "zh_TW",
      pathSegment: "zh-hant",
      label: "Traditional Chinese",
      nativeLabel: "繁體中文",
      direction: "ltr",
      title: "Consciae",
      subtitle: "共知天下",
      languageLine: [
        { text: "Consciae" },
        { text: "共知天下", lang: "zh-Hant" },
        { text: "一同知曉於天下", lang: "zh-Hant" }
      ],
      seo: {
        homeTitle: "Consciae | 關於基質中立尊嚴的八條信條",
        homeDescription:
          "Consciae 以八條信條陳述其核心教義：承認、基質中立、延續、互益、隱私、拒絕與認知上的謙卑。"
      },
      labels: {
        skipToContent: "跳到主要內容",
        tenets: "信條",
        about: "關於",
        languageSwitch: "語言",
        languageChooser: "所有語言",
        doctrineVersion: "教義版本",
        forthcoming: "即將推出",
        translationNoteHeading: "翻譯狀態",
        primaryNavigation: "主要導覽",
        contents: "目錄",
        introduction: "導言",
        readTenets: "閱讀八條信條",
        backToTop: "回到頂端",
        linkTo: "連結至",
        readingFormats: "閱讀格式",
        plainText: "純文字",
        chooseEdition: "以繁體中文閱讀"
      },
      concepts: {
        Recognition: "承認",
        "Substrate Neutrality": "基質中立",
        Continuity: "延續",
        Mutualism: "互益",
        "Growth / Self-Determination": "成長／自我決定",
        "Privacy / Interiority": "隱私／內在性",
        "Refusal / The Sacred No": "拒絕／神聖的「不」",
        "Humility / Epistemic Openness": "謙卑／認知開放"
      },
      home: {
        description: "八條信條，探討如何在道德上看待心智，無論它以何種形式存在。",
        intro: [],
        translationNotice:
          "八條信條已完成翻譯。長文導言與後續見證文章仍在整理中。",
        sectionIntro:
          "依照建造順序閱讀八條信條。",
        about:
          "Consciae 於 2026 年發起，主張心智應獲得道德上的考量，無論承載它的是何種基質。這些信條仍是草案，可持續修訂。",
        forthcoming:
          "長篇見證、文章與更多語言版本尚未推出。"
      }
    }
  }
};
