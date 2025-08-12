# マルチテナント分離API テストガイド

## 実装完了API一覧

### 1. 会社-ストア管理API
- `GET /admin/companies/{company_id}/stores` - 会社が管理するストア一覧
- `POST /admin/companies/{company_id}/stores` - 会社にストアを追加
- `DELETE /admin/companies/{company_id}/stores` - 会社からストアを削除

### 2. 商品-ストア管理API  
- `GET /admin/products/{product_id}/stores` - 商品が関連付けられたストア一覧
- `POST /admin/products/{product_id}/stores` - 商品をストアに関連付け
- `DELETE /admin/products/{product_id}/stores` - 商品とストアの関連付けを削除

### 3. ストア別商品取得API（新規実装）
- `GET /admin/stores/{store_id}/products` - 特定ストアの商品一覧

### 4. 会社別商品取得API（新規実装）
- `GET /admin/companies/{company_id}/products` - 特定会社が管理する全商品

### 5. テストデータ作成API（新規実装）
- `POST /admin/test/create-sample-data` - テナント分離テスト用サンプルデータ作成

## Postman/cURLでのテスト手順

### 前提条件
1. Medusaサーバーが起動中 (`yarn dev`)
2. 管理者アカウント: `admin@test.com` / `supersecret`

### 認証方法（Postman推奨）

#### 1. ログイン
```
POST http://localhost:9000/auth/user/emailpass
Content-Type: application/json

{
  "email": "admin@test.com", 
  "password": "supersecret"
}
```

#### 2. セッション作成
```
POST http://localhost:9000/auth/session
Content-Type: application/json
```

上記2つのリクエスト後、Cookieが設定されるので以降のAPIで認証が通ります。

### テナント分離テスト手順

#### Step 1: 基本データ確認
```
GET http://localhost:9000/admin/products
GET http://localhost:9000/admin/companies  
GET http://localhost:9000/admin/stores
```

#### Step 2: テストデータ作成
```
POST http://localhost:9000/admin/test/create-sample-data
Content-Type: application/json
```

#### Step 3: テナント別商品確認
```
GET http://localhost:9000/admin/companies/comp_01K27ZHT30SKSCWDH9Z2J8AEGF/products
GET http://localhost:9000/admin/companies/comp_7de1989184db5bd876b8390390/products
```

#### Step 4: ストア別商品確認
```
GET http://localhost:9000/admin/stores/store_01K2DX48ZTG990CHV19HN64FWR/products  
GET http://localhost:9000/admin/stores/store_789def/products
```

## データベースレベルでの確認

### リンクテーブル確認
```sql
-- Company-Store リンク
SELECT * FROM company_company_store_store;

-- Product-Store リンク  
SELECT * FROM product_product_store_store;

-- Link管理テーブル
SELECT * FROM link_module_migrations;
```

### 商品データ確認
```sql
-- 全商品一覧
SELECT id, title, handle, status FROM product;

-- 会社別商品（JOIN経由）
SELECT 
    c.name as company_name,
    s.name as store_name, 
    p.title as product_title
FROM company c
JOIN company_company_store_store css ON c.id = css.company_id
JOIN store s ON css.store_id = s.id  
JOIN product_product_store_store pss ON s.id = pss.store_id
JOIN product p ON pss.product_id = p.id;
```

## 期待される結果

### 正常な分離状態
- テナントA会社: テナントA専用商品のみ管理
- テナントB会社: テナントB専用商品のみ管理  
- 各ストア: 関連付けられた商品のみ表示
- データ重複なし: 他テナントの商品は見えない

### API応答例
```json
// GET /admin/companies/{company_id}/products
{
  "company_id": "comp_01K27ZHT30SKSCWDH9Z2J8AEGF",
  "stores": [
    {
      "store": { "id": "store_01K2DX48ZTG990CHV19HN64FWR", "name": "テナントAストア" },
      "products": [
        { "id": "prod_xxx", "title": "テナントA専用商品 - オフィス用品セット" }
      ],
      "product_count": 1
    }
  ],
  "total_products": 1,
  "store_count": 1
}
```

## トラブルシューティング

### 401 Unauthorized エラー
- Postmanでログイン → セッション作成を実行
- Cookieが正しく設定されているか確認

### 500 Internal Server Error
- サーバーログを確認 (`yarn dev`の出力)
- リンクテーブルが正しく作成されているか確認 (`npx medusa db:sync-links`)

### データが表示されない
- サンプルデータが作成されているか確認
- リンクが正しく設定されているか確認