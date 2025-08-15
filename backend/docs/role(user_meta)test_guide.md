# 階層的権限管理テストガイド

## テスト概要

このドキュメントでは、実装した階層的権限管理システムのテスト方法と期待結果について説明します。
(既存のuser_metadataを使用してrole定義したパターン)

## テスト準備

### 1. 環境セットアップ

```bash
# プロジェクトディレクトリに移動
cd /Users/miyakoendo/sample/sample_medusa/medusa-b2b-mvcp-demo/b2b-starter-medusa_no_docker/backend

# 依存関係の確認
yarn install

# データベースマイグレーション
npx medusa db:sync-links

# 開発サーバー起動
yarn dev
```

### 2. 基本データの準備

```bash
# 多テナント用のサンプルデータ作成
yarn exec src/scripts/create-multi-tenant-seed.ts

# 階層権限ユーザーの作成
yarn exec src/scripts/create-hierarchical-users.ts
```

## テストユーザー一覧

作成されるテストユーザーとその権限：

| ユーザー | Email | 権限レベル | アクセス範囲 |
|---------|-------|----------|------------|
| SaaS運営者 | `saas_admin@example.com` | platform_admin | 全システム |
| 会社A管理者 | `会社a_admin@example.com` | company_admin | 会社A全体 |
| 会社B管理者 | `会社b_admin@example.com` | company_admin | 会社B全体 |
| ストアE管理者 | `ストアe_admin@example.com` | store_admin | ストアEのみ |
| ストアF管理者 | `ストアf_admin@example.com` | store_admin | ストアFのみ |

全ユーザーのパスワード: `supersecret`

## 自動テスト実行

### テストスクリプトの実行

```bash
# 権限テストスクリプトに実行権限を付与
chmod +x test-permissions.sh

# テスト実行
./test-permissions.sh
```

### 期待される出力例

```
階層的権限管理テスト開始
==========================

✅ platform_admin トークン取得成功
✅ company_admin_a トークン取得成功
✅ company_admin_b トークン取得成功
✅ store_admin_e トークン取得成功
✅ store_admin_f トークン取得成功

=== 権限テスト開始 ===

1. 会社一覧アクセステスト
------------------------
[platform_admin] GET /admin/companies: ✅ PASS (200)
[company_admin_a] GET /admin/companies: ✅ PASS (200)
[store_admin_e] GET /admin/companies: ✅ PASS (403)

2. 会社作成権限テスト
-------------------
[platform_admin] POST /admin/companies: ✅ PASS (200)
[company_admin_a] POST /admin/companies: ✅ PASS (403)
[store_admin_e] POST /admin/companies: ✅ PASS (403)

3. 自社データアクセステスト
------------------------
[platform_admin] GET /admin/companies/comp_A: ✅ PASS (200)
[company_admin_a] GET /admin/companies/comp_A: ✅ PASS (200)
[company_admin_a] GET /admin/companies/comp_B: ✅ PASS (403)
[company_admin_b] GET /admin/companies/comp_A: ✅ PASS (403)
```

## 手動テスト手順

### 1. Platform Admin テスト

```bash
# ログイン
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"saas_admin@example.com","password":"supersecret"}'

# トークンを取得後、以下をテスト
TOKEN="[取得したトークン]"

# 全ての会社の閲覧
curl -X GET http://localhost:9000/admin/companies \
  -H "Authorization: Bearer $TOKEN"

# 新しい会社の作成
curl -X POST http://localhost:9000/admin/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"新規会社","email":"new@example.com","currency_code":"JPY"}'
```

### 2. Company Admin テスト

```bash
# 会社A管理者でログイン
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"会社a_admin@example.com","password":"supersecret"}'

TOKEN_A="[取得したトークン]"

# 自社情報の閲覧（成功するはず）
curl -X GET http://localhost:9000/admin/companies/[会社AのID] \
  -H "Authorization: Bearer $TOKEN_A"

# 他社情報の閲覧（403エラーになるはず）
curl -X GET http://localhost:9000/admin/companies/[会社BのID] \
  -H "Authorization: Bearer $TOKEN_A"

# 自社従業員の管理（成功するはず）
curl -X GET http://localhost:9000/admin/companies/[会社AのID]/employees \
  -H "Authorization: Bearer $TOKEN_A"
```

### 3. Store Admin テスト

```bash
# ストアE管理者でログイン
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"ストアe_admin@example.com","password":"supersecret"}'

TOKEN_E="[取得したトークン]"

# 担当ストアの商品閲覧（成功するはず）
curl -X GET http://localhost:9000/admin/stores/[ストアEのID]/products \
  -H "Authorization: Bearer $TOKEN_E"

# 他ストアの商品閲覧（403エラーになるはず）
curl -X GET http://localhost:9000/admin/stores/[ストアFのID]/products \
  -H "Authorization: Bearer $TOKEN_E"

# 会社レベルの管理（403エラーになるはず）
curl -X GET http://localhost:9000/admin/companies \
  -H "Authorization: Bearer $TOKEN_E"
```

## テスト項目チェックリスト

### 認証テスト
- [ ] Platform Adminのログイン成功
- [ ] Company Adminのログイン成功
- [ ] Store Adminのログイン成功
- [ ] 無効なCredentialsでのログイン失敗

### 垂直権限テスト（上位→下位アクセス）
- [ ] Platform Admin → 全ての会社データアクセス
- [ ] Platform Admin → 全てのStoreデータアクセス
- [ ] Company Admin → 自社Storeデータアクセス
- [ ] Company Admin → 自社従業員データアクセス

### 水平権限テスト（同レベル間制限）
- [ ] 会社A Admin → 会社Bデータアクセス拒否
- [ ] ストアE Admin → ストアFデータアクセス拒否
- [ ] 会社A従業員 → 会社B商品アクセス拒否

### API権限テスト
- [ ] GET /admin/companies - 権限別レスポンス確認
- [ ] POST /admin/companies - Platform Adminのみ許可
- [ ] GET /admin/companies/:id - 会社アクセス権確認
- [ ] GET /admin/companies/:id/employees - 従業員管理権限確認
- [ ] GET /admin/stores/:id/products - Store権限確認

### データ分離テスト
- [ ] 会社A管理者が会社Bの商品を見れない
- [ ] ストアE管理者がストアFの注文を見れない
- [ ] Platform Adminは全てのデータを見れる

## エラーパターンと対処法

### よくあるテストエラー

#### 1. 401 Unauthorized
```
原因: トークンが無効または期限切れ
対処: 再ログインしてトークンを取得
```

#### 2. 403 Forbidden (期待外)
```
原因: user_metadataが正しく設定されていない
対処: データベースでuser_metadataを確認・修正

-- user_metadataの確認
SELECT user_metadata FROM provider_identity 
WHERE entity_id = 'ユーザーのemail';
```

#### 3. 500 Internal Server Error
```
原因: ミドルウェアでのエラー
対処: サーバーログを確認

# ログ確認
yarn dev --verbose
```

#### 4. 404 Not Found
```
原因: エンドポイントが存在しない、またはID不正
対処: 正しいエンドポイントとIDを確認
```

## パフォーマンステスト

### レスポンス時間の測定

```bash
# 権限チェック有りの場合
time curl -X GET http://localhost:9000/admin/companies \
  -H "Authorization: Bearer $TOKEN"

# 大量データでの権限チェック
for i in {1..100}; do
  curl -X GET http://localhost:9000/admin/companies \
    -H "Authorization: Bearer $TOKEN" &
done
wait
```

### 期待値
- 権限チェック追加による処理時間増加: < 10ms
- 大量同時アクセス時の権限チェック成功率: 100%

## セキュリティテスト

### 権限昇格攻撃の検証

```bash
# 1. JWTトークンの改ざんテスト
# （無効なトークンで403エラーになることを確認）

# 2. SQLインジェクション攻撃
curl -X GET "http://localhost:9000/admin/companies/'; DROP TABLE companies; --" \
  -H "Authorization: Bearer $TOKEN"

# 3. パラメータ改ざん攻撃
curl -X GET http://localhost:9000/admin/companies/other_company_id \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"
```

## 継続的テスト

### CI/CDパイプライン組み込み

```yaml
# .github/workflows/permissions-test.yml
name: Permissions Test
on: [push, pull_request]
jobs:
  test-permissions:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Start test database
        run: docker-compose up -d postgres
      
      - name: Run migrations
        run: npx medusa db:migrate
      
      - name: Create test users
        run: yarn exec src/scripts/create-hierarchical-users.ts
      
      - name: Run permission tests
        run: ./test-permissions.sh
```

## テスト結果の記録

### 成功時のログサンプル

```
=== テスト完了 ===

=== 権限階層サマリー ===
Platform Admin (saas_admin@example.com):
  - 全システム管理可能
  - 全ての会社・Store・商品にアクセス可能

Company Admin (会社a_admin@example.com):
  - 自社の全てのStore・従業員を管理可能
  - 他社のデータにはアクセス不可

Store Admin (ストアe_admin@example.com):
  - 担当Storeの商品・注文のみ管理可能
  - 会社レベルの管理機能にはアクセス不可

総テスト数: 25
成功: 25
失敗: 0
```

## まとめ

このテストガイドに従うことで、階層的権限管理システムが正しく動作していることを確認できます。定期的なテスト実行により、セキュリティを維持しながらシステムを運用できます。
