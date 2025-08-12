# Link Module Migrations テーブルを使ったCompany-Store関連付け作業記録

## 作業概要

Medusa Store Moduleを使用して、既存テーブルを変更せずに Company と Store の関連付けを実装する。

## 背景・要件

- **目標**: SaaS型ECプラットフォームのマルチテナント構成実現
- **制約**: 既存テーブル（`company`, `store`）は変更しない
- **方針**: Medusaの`link_module_migrations`システムを活用

## 現在の状況確認

### 既存のCompanyテーブル構造
```sql
Table "public.company"
- id (text, PK)
- name (text, NOT NULL)
- phone, email, address, city, state, zip, country
- logo_url, currency_code
- spending_limit_reset_frequency
- created_at, updated_at, deleted_at
```

### 既存のStoreテーブル構造
```sql
Table "public.store"
- id (text, PK)
- name (text, NOT NULL, default 'Medusa Store')
- default_sales_channel_id, default_region_id, default_location_id
- metadata (jsonb)
- created_at, updated_at, deleted_at
```

### 現在のStore一覧
```sql
id                               | name      | created_at
store_01K27XHETT3F9Q476JC90YSBJT | テナントA | 2025-08-10 02:20:02.393373+09
store_01K2DX48ZTG990CHV19HN64FWR | テナントB | 2025-08-12 10:08:17 (新規作成)
```

## Link Module Migrations システムの理解

### 目的と仕組み
1. **モジュール間の関係性管理**: 異なるMedusaモジュール間のデータリレーションを管理
2. **スキーマレス関連付け**: 既存テーブルを変更せずに新しい関係性を作成
3. **動的な関係構築**: アプリケーション実行時に関係性テーブルを自動生成

### 現在のリンク設定確認
`link_module_migrations`テーブルには既に25のリンクが設定済み：
- `company_employee_customer_customer`: 会社の従業員と顧客の関連
- `company_company_cart_cart`: 会社とカートの関連
- `order_order_company_company`: 注文と会社の関連
- その他22のリンク

### Medusaのlink定義の仕組み
```typescript
// src/links/company-store.ts を作成すると
// ↓ Medusaが自動的に以下を実行
// 1. link_module_migrationsテーブルにメタデータ挿入
// 2. company_storeテーブルを自動生成
// 3. リンク機能をアクティブ化
```

## 実装計画

### multi-tenant-architecture.mdとの整合性
✅ **Phase 1: データモデル拡張**に該当
- CompanyとStoreの関連付け → `defineLink()`で実現
- テナント識別子の追加 → 今後実装
- 権限モデルの拡張 → 今後実装

### ファイル構成計画

#### 📁 新規作成するファイル
1. **Company-Store リンク定義**
   ```
   src/links/company-store.ts  （新規）
   ```

2. **ワークフロー**
   ```
   src/workflows/company/workflows/add-store-to-company.ts  （新規）
   src/workflows/company/workflows/remove-store-from-company.ts  （新規）
   ```

3. **API エンドポイント**
   ```
   src/api/admin/companies/[id]/stores/route.ts  （新規）
   ```

#### 📝 既存ファイル修正
1. **Company Service**
   ```
   src/modules/company/service.ts  （既存修正）
   ```
   - `addStore()` メソッド追加
   - `removeStore()` メソッド追加  
   - `getStores()` メソッド追加

2. **Company Types**
   ```
   src/types/company/service.ts  （既存修正）
   ```
   - 新メソッドの型定義追加

### 実装順序
1. **最初**: `src/links/company-store.ts` でリンク定義
2. **次に**: `src/modules/company/service.ts` でサービスメソッド追加
3. **その後**: ワークフローとAPI実装

## linkの使用方法

### 基本的な使用パターン
```typescript
// ワークフロー内での使用例
export const addStoreToCompanyWorkflow = createWorkflow(
  "add-store-to-company",
  (input) => {
    const link = container.resolve("link")
    // Company と Store を関連付け
    await link.create({
      [COMPANY_MODULE]: { company_id: "comp_123" },
      [Modules.STORE]: { store_id: "store_456" }
    });
  }
)
```

### API エンドポイント内での使用例
```typescript
// src/api/admin/companies/[id]/stores/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const link = req.scope.resolve("link")
  // Company に Store を追加
}
```

### サービス内での使用例
```typescript
// src/modules/company/service.ts
class CompanyModuleService {
  async addStore(companyId: string, storeId: string) {
    const link = this.container_.resolve("link")
    // リンク作成処理
  }
}
```

## 期待される効果

### メリット
- ✅ 既存データ構造を保持
- ✅ Medusaの設計思想に準拠
- ✅ 将来的な拡張が容易
- ✅ トランザクション管理が自動

### 実現される関係性
```
Company (三省堂)
  └── Store (サイトC - 一般消費者向け)

Company (会社A)
  ├── Store (サイトE - 一般消費者向け)
  └── Store (サイトF - 法人向け)

Company (会社B)
  ├── Store (サイトG - 日本向け)
  └── Store (サイトH - 海外向け)
```

## 次のアクションアイテム

1. [ ] `src/links/company-store.ts` の作成
2. [ ] Company Service への store 関連メソッド追加
3. [ ] ワークフロー実装
4. [ ] API エンドポイント実装
5. [ ] 動作テスト・検証

## 参考情報

- **Medusa公式ドキュメント**: [Module Links](https://docs.medusajs.com/learn/fundamentals/module-links)
- **設計ドキュメント**: `./multi-tenant-architecture.md`
- **現在のMedusaサーバー**: http://localhost:9000/app
- **管理者ログイン**: saas_admin@test.com / supersecret

---

*作成日: 2025-08-12*  
*最終更新: 2025-08-12*