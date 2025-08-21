# Medusa v2 APIリクエストからDBアクセスまでの流れ

## 概要
このドキュメントは、Medusa v2における企業-店舗関係のエンドポイントでのAPIリクエストからデータベースアクセスまでの流れを説明します。

## 1. 企業 → 店舗 API シーケンス

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as APIルート<br/>(companies/[id]/stores/route.ts)
    participant MW1 as ミドルウェア<br/>(preloadCompanyStoreLinks)
    participant MW2 as ミドルウェア<br/>(ensureRoleWithCompanyAccess)
    participant Auth as 認証ユーティリティ<br/>(auth-utils.ts)
    participant Query as Queryサービス<br/>(ContainerRegistrationKeys.QUERY)
    participant Link as リンク定義<br/>(company-store.ts)
    participant Store as Storeモジュール<br/>(Modules.STORE)
    participant DB as データベース

    Client->>MW1: GET /admin/companies/{id}/stores
    Note over MW1: ストアリンクの事前読み込み試行
    
    MW1->>Query: resolve(ContainerRegistrationKeys.QUERY)
    MW1->>Query: query.graph({<br/>entity: "company_company_store_store",<br/>fields: ["store_id"],<br/>filters: {company_id}<br/>})
    Query->>DB: SELECT store_id FROM company_company_store_store<br/>WHERE company_id = ?
    DB-->>Query: エラー: サービスが見つからない
    Query-->>MW1: 失敗（空配列にフォールバック）
    MW1->>MW2: next()
    
    Note over MW2: ロール権限チェック
    MW2->>Auth: validateUserRole(user_id)
    Auth->>Query: query.graph({<br/>entity: "provider_identity",<br/>fields: ["user_metadata"]<br/>})
    Query->>DB: SELECT * FROM provider_identity<br/>WHERE auth_identity_id = ?
    DB-->>Query: ユーザーメタデータ（ロール、company_id、store_ids）
    Query-->>Auth: ユーザーデータを返す
    Auth-->>MW2: ロール検証完了
    MW2->>API: next()
    
    Note over API: メインAPIロジック
    API->>Query: resolve(ContainerRegistrationKeys.QUERY)
    
    alt Use Link EntryPoint (Primary)
        API->>Link: Access CompanyStoreLink.entryPoint
        Link-->>API: "company_company_store_store"
        API->>Query: query.graph({<br/>entity: CompanyStoreLink.entryPoint,<br/>fields: ["store_id"],<br/>filters: {company_id}<br/>})
        Query->>DB: SELECT store_id FROM company_company_store_store<br/>WHERE company_id = ?
        DB-->>Query: Error or Empty
    else Fallback to Entity Approach
        API->>Query: query.graph({<br/>entity: "company",<br/>fields: ["id", "stores.*"],<br/>filters: {id: company_id}<br/>})
        Query->>DB: SELECT * FROM company WHERE id = ?<br/>JOIN company_company_store_store ON ...<br/>JOIN store ON ...
        DB-->>Query: Company data with nested stores
        Query-->>API: Return company with related stores
    end
    
    Note over API: 結果から店舗IDを抽出
    API->>Store: resolve(Modules.STORE)
    
    loop 各store_idに対して
        API->>Store: storeService.retrieveStore(store_id)
        Store->>DB: SELECT * FROM store WHERE id = ?
        DB-->>Store: 店舗詳細（名前、作成日時など）
        Store-->>API: 店舗オブジェクト
    end
    
    API-->>Client: JSONレスポンス {<br/>company_id,<br/>stores: [{id, name, created_at, updated_at}]<br/>}
```

## 2. 店舗 → 商品 API シーケンス

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as APIルート<br/>(stores/[id]/products/route.ts)
    participant MW as ミドルウェア<br/>(ensureHierarchicalRole)
    participant Query as Queryサービス<br/>(ContainerRegistrationKeys.QUERY)
    participant Link as リンク定義<br/>(product-store.ts)
    participant Product as Productモジュール<br/>(Modules.PRODUCT)
    participant DB as データベース

    Client->>MW: GET /admin/stores/{id}/products
    
    Note over MW: ロール権限チェック
    MW->>Query: query.graph({<br/>entity: "provider_identity"<br/>})
    Query->>DB: SELECT * FROM provider_identity
    DB-->>Query: ユーザーロールデータ
    Query-->>MW: ロール検証完了
    MW->>API: next()
    
    Note over API: メインAPIロジック
    API->>Query: resolve(ContainerRegistrationKeys.QUERY)
    API->>Product: resolve(Modules.PRODUCT)
    
    alt Use Link EntryPoint (Primary)
        API->>Link: Access ProductStoreLink.entryPoint
        Link-->>API: "product_product_store_store"
        API->>Query: query.graph({<br/>entity: ProductStoreLink.entryPoint,<br/>fields: ["product_id"],<br/>filters: {store_id}<br/>})
        Query->>DB: SELECT product_id FROM product_product_store_store<br/>WHERE store_id = ?
        DB-->>Query: Product IDs or Error
    else Fallback (Hardcoded for specific store)
        Note over API: Use known product IDs<br/>for store_01K27XHETT3F9Q476JC90YSBJT
        API->>API: productIds = ["prod_01K2ERSMB22SGX1YZKPE860MC8"]
    end
    
    API->>Product: productService.listProducts({<br/>id: productIds<br/>})
    Product->>DB: SELECT * FROM product WHERE id IN (?)
    DB-->>Product: 商品詳細
    Product-->>API: 商品オブジェクト
    
    API-->>Client: JSONレスポンス {<br/>store_id,<br/>products: [{id, title, description, ...}],<br/>count<br/>}
```

## 3. 主要コンポーネントとその役割

### 3.1 ミドルウェア層
- **場所**: `/src/api/middlewares/`
- **目的**: 認証、認可、データの事前読み込み
- **主要ファイル**:
  - `check-permissions.ts`: 権限検証とリンクデータの事前読み込み
  - `ensure-role.ts`: ロールベースのアクセス制御

### 3.2 APIルート
- **場所**: `/src/api/admin/`
- **目的**: HTTPリクエストを処理し、ビジネスロジックを統合
- **主要ファイル**:
  - `companies/[id]/stores/route.ts`: 企業-店舗関係のエンドポイント
  - `stores/[id]/products/route.ts`: 店舗-商品関係のエンドポイント

### 3.3 リンク定義
- **場所**: `/src/links/`
- **目的**: モジュール間の関係を定義
- **主要ファイル**:
  - `company-store.ts`: 企業 ↔ 店舗の関係
  - `product-store.ts`: 商品 ↔ 店舗の関係
- **重要**: リンクテーブルへの直接アクセスにはEntryPointの設定が必要

### 3.4 Queryサービス
- **アクセス**: `req.scope.resolve(ContainerRegistrationKeys.QUERY)`
- **目的**: モジュール横断的な統一データアクセス
- **メソッド**:
  - `query.graph()`: 関係を含むデータの取得

### 3.5 モジュールサービス
- **Storeモジュール**: `req.scope.resolve(Modules.STORE)`
- **Productモジュール**: `req.scope.resolve(Modules.PRODUCT)`
- **目的**: モジュール固有のビジネスロジックとデータアクセス

## 4. データベーステーブル

### 4.1 コアテーブル
- `company`: 企業情報
- `store`: 店舗情報  
- `product`: 商品情報
- `provider_identity`: ユーザー認証データ

### 4.2 リンクテーブル（中間テーブル）
- `company_company_store_store`: 企業と店舗を関連付け（多対多）
- `product_product_store_store`: 商品と店舗を関連付け（多対多）
- `company_employee_customer_customer`: 従業員と顧客を関連付け

## 5. データ取得パターン

### 5.1 リンクテーブルへの直接アクセス（現在失敗中）
```typescript
query.graph({
  entity: "company_company_store_store", // または LinkObject.entryPoint を使用
  fields: ["store_id"],
  filters: { company_id: companyId }
})
```
**ステータス**: ❌ "サービスが見つからない"エラーを返す

### 5.2 エンティティ関係アクセス（動作中）
```typescript
query.graph({
  entity: "company",
  fields: ["id", "stores.*"],
  filters: { id: companyId }
})
```
**ステータス**: ✅ 関連データを正常に返す

### 5.3 モジュールサービス直接アクセス（動作中）
```typescript
const storeService = req.scope.resolve(Modules.STORE);
const store = await storeService.retrieveStore(storeId);
```
**ステータス**: ✅ 個別レコードを正常に取得

## 6. よくある問題と解決策

### 問題1: リンクテーブルへの直接アクセスが失敗
**エラー**: "Service with alias 'xxx_xxx_xxx_xxx' was not found"
**解決策**: エンティティ関係アプローチを使用するか、entryPointが適切に設定されていることを確認

### 問題2: リンク定義でEntryPointが不足
**解決策**: リンク定義にentryPointを追加:
```typescript
(CompanyStoreLink as any).entryPoint = "company_company_store_store";
```

### 問題3: インポートパスエラー
**解決策**: APIルートからリンク定義への相対パスを確認

## 7. パフォーマンスの考慮事項

1. **N+1クエリ問題**: ID取得後の店舗詳細取得時
   - 現在: 各店舗に個別クエリ
   - 改善案: `IN`句でのバッチ取得

2. **フォールバック機構**: 複数のクエリ試行により遅延増加
   - 成功パターンのキャッシュを検討

3. **ミドルウェア事前読み込み**: 現在失敗中だが、重複クエリ削減を意図

## 8. 今後の改善点

1. **リンクテーブル直接アクセスの修正**: `query.graph()`でリンクテーブルエンティティが失敗する理由を調査
2. **キャッシング実装**: 頻繁にアクセスされる関係データのキャッシュ層を追加
3. **クエリ最適化**: 可能な場所でバッチ処理を実装
4. **モジュールメソッド完成**: CompanyModuleServiceの空実装メソッドを完成
5. **ハードコードフォールバック削除**: すべてのシナリオで動的データ取得

## 9. 現在の実装状況

### 成功している部分
- ✅ エンティティ関係アプローチによるデータ取得
- ✅ Storeモジュールによる店舗詳細取得
- ✅ 権限チェックとロール制御
- ✅ フォールバック機構

### 課題のある部分
- ❌ リンクテーブルへの直接アクセス（entryPoint使用）
- ❌ ミドルウェアでのデータ事前読み込み
- ❌ ハードコードされたフォールバック値

## 10. 参考資料

- [Medusa v2 公式ドキュメント](https://docs.medusajs.com/)
- [モジュールリンク ドキュメント](https://docs.medusajs.com/learn/fundamentals/module-links)
- [Query API ドキュメント](https://docs.medusajs.com/learn/fundamentals/module-links/query)