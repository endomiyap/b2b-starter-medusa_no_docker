# 商品レベルのテナント分離確認ガイド

## 📋 実装完了項目

✅ **基本マルチテナント構成**
- Company-Store リンク (`company_company_store_store`)
- 企業A → 企業Aストア
- 企業B → 企業Bストア

✅ **商品レベル分離機能**
- Product-Store リンク (`product_product_store_store`)
- 商品とストアの関連付けAPI (`/admin/products/[id]/stores`)
- テナント専用商品作成・関連付けスクリプト

## 🚀 画面での確認手順

### 1. Medusa Adminにアクセス
```
http://localhost:9000/app
```
- ログイン: `admin@test.com` / `supersecret`

### 2. テナント専用商品作成
ブラウザのDeveloper Tools（F12）のConsoleで以下を実行：

```javascript
// 1. 基本データ確認
copy(`
// 商品作成前の確認
fetch('/admin/products').then(r => r.json()).then(d => console.log('現在の商品数:', d?.products?.length))
`); 
```

```javascript
// 2. テナント専用商品作成（create-tenant-products.jsの内容をコピー&ペースト）
```

### 3. テナント分離確認
```javascript
// 3. 商品分離確認（verify-product-separation.jsの内容をコピー&ペースト）
```

## 🔍 期待される動作

### ✅ 正常な分離状態
- **企業A専用商品**: 企業Aストアにのみ関連付け
- **企業B専用商品**: 企業Bストアにのみ関連付け
- **完全分離**: 他テナントの商品は見えない/アクセスできない

### 📊 確認ポイント
1. 各テナント会社が自社ストアのみアクセス可能
2. 商品-ストアリンクが正しく機能
3. Admin UIで他テナントの商品が表示されない
4. API経由でも他テナントの商品に不正アクセス不可

## 📁 関連ファイル

### コア実装
- `/src/links/company-store.ts` - 会社-ストアリンク
- `/src/links/product-store.ts` - 商品-ストアリンク
- `/src/api/admin/companies/[id]/stores/route.ts` - 会社-ストア管理API
- `/src/api/admin/products/[id]/stores/route.ts` - 商品-ストア管理API

### テストスクリプト
- `create-tenant-products.js` - テナント専用商品作成
- `verify-product-separation.js` - 商品レベル分離確認
- `verify-separation.js` - 基本テナント分離確認

## 🎯 最終確認
Admin UI画面で以下を確認：
1. 企業A商品が企業Bで見えないこと
2. 企業B商品が企業Aで見えないこと
3. 各テナントが自社商品のみ管理可能であること

## ⚠️ 注意事項
- 商品作成後は必ずストアとの関連付けを行う
- リンクテーブルは `npx medusa db:sync-links` で同期済み
- TypeScriptビルドエラーなし確認済み
- サーバー起動: `yarn dev`
