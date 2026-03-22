# Cambridge Dictionary Crawler

一個用於爬取劍橋詞典資料的 Node.js 工具庫。

## ⚠️ 重要警告

**此專案僅為實驗性質，不適合在生產環境中使用。**

- 此工具未經過完整的穩定性測試
- 可能會因為網站結構變更而失效
- 不保證資料的準確性和完整性
- 使用時請遵守劍橋詞典的使用條款

## 功能特色

- 自動完成搜尋建議
- 詞彙詳細查詢

## 安裝

```bash
npm install cambridge-crawler
```

```bash
bun add github:laplus-x/cambridge-crawler
bun install
```

## 使用方法

### 基本設定

```typescript
import { Cambridge, LanguageType, DatasetType } from "cambridge-crawler";

// 建立 Cambridge 實例
const client = new Cambridge({
  lang: LanguageType.ZhTw, // 語言：繁體中文
  dataset: DatasetType.EnZhTw, // 字典：英中繁體
  timeout: 30000, // 超時時間：30秒
});
```

### 自動完成

取得搜尋建議：

```typescript
const result = await client.autocomplete({ query: "world" });
console.log(result);
```

### 詞彙查詢

查詢單字詳細資訊：

```typescript
const result = await client.search({ query: "world" });
console.log(result);
```

## 開發

### 環境設定

1. 安裝依賴：

```bash
npm install
```

2. 開發模式：

```bash
npm run dev
```

3. 建置：

```bash
npm run build
```

4. 測試：

```bash
npm test
```

### 專案結構

```
src/
├── main.ts              # 主要功能
├── types/               # 類型定義
│   ├── constant.ts      # 常數定義
│   ├── request.ts       # 請求參數
│   └── response.ts      # 回應資料
└── main.test.ts         # 測試案例
```

## 授權

MIT License

## 免責聲明

此工具僅供學習和研究使用，請勿用於商業用途。使用者需自行承擔使用風險。
