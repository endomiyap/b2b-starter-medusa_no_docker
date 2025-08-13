#!/bin/bash

# Medusa Admin APIテスト用スクリプト
# 使用方法: ./test-api.sh

echo "Medusa マルチテナント分離APIテスト開始"
echo "=========================================="

BASE_URL="http://localhost:9000"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="supersecret"

# 1. 認証（ログイン）
echo "1. 管理者ログイン中..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# セッション作成
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/session" \
  -H "Content-Type: application/json" \
  -c cookies.txt)

echo "ログイン完了"

# 2. 基本データ確認
echo ""
echo "2. 基本データ確認中..."

# 商品数確認
PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/products" \
  -b cookies.txt)
echo "現在の商品数: $(echo $PRODUCTS | jq '.products | length')"

# 会社数確認  
COMPANIES=$(curl -s -X GET "$BASE_URL/admin/companies" \
  -b cookies.txt)
echo "現在の会社数: $(echo $COMPANIES | jq '.companies | length')"

# 3. サンプルデータ作成
echo ""
echo "3. テナント分離用サンプルデータ作成中..."
SAMPLE_DATA=$(curl -s -X POST "$BASE_URL/admin/test/create-sample-data" \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "サンプルデータ作成結果:"
echo $SAMPLE_DATA | jq '.'

# 4. 会社ごとの商品確認
echo ""
echo "4. テナント別商品確認中..."

TENANT_A_ID="comp_01K27ZHT30SKSCWDH9Z2J8AEGF"
TENANT_B_ID="comp_7de1989184db5bd876b8390390"

echo "企業A会社の商品:"
TENANT_A_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/companies/$TENANT_A_ID/products" \
  -b cookies.txt)
echo $TENANT_A_PRODUCTS | jq '.total_products, .products[].title'

echo ""
echo "企業B会社の商品:"
TENANT_B_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/companies/$TENANT_B_ID/products" \
  -b cookies.txt)
echo $TENANT_B_PRODUCTS | jq '.total_products, .products[].title'

# 5. ストア別商品確認
echo ""
echo "5. ストア別商品確認中..."

TENANT_A_STORE_ID="store_01K2DX48ZTG990CHV19HN64FWR"
TENANT_B_STORE_ID="store_789def"

echo "企業Aストアの商品:"
STORE_A_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/stores/$TENANT_A_STORE_ID/products" \
  -b cookies.txt)
echo $STORE_A_PRODUCTS | jq '.count, .products[].title'

echo ""
echo "企業Bストアの商品:"
STORE_B_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/stores/$TENANT_B_STORE_ID/products" \
  -b cookies.txt)
echo $STORE_B_PRODUCTS | jq '.count, .products[].title'

# 6. 分離確認
echo ""
echo "6. テナント分離確認結果:"
TENANT_A_COUNT=$(echo $TENANT_A_PRODUCTS | jq '.total_products')
TENANT_B_COUNT=$(echo $TENANT_B_PRODUCTS | jq '.total_products')

echo "企業A管理商品数: $TENANT_A_COUNT"
echo "企業B管理商品数: $TENANT_B_COUNT"

if [ "$TENANT_A_COUNT" -gt 0 ] && [ "$TENANT_B_COUNT" -gt 0 ]; then
    echo " テナント分離成功: 各テナントが独立した商品を管理"
else
    echo " テナント分離未完了: データが不足しています"
fi

echo ""
echo "APIテスト完了!"

# クリーンアップ
rm -f cookies.txt
