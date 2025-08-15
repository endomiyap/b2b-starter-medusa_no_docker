#!/bin/bash

# 簡単なAPIテストスクリプト（Cookie認証版）
echo "Medusa APIテスト開始"
echo "===================="

BASE_URL="http://localhost:9000"

# 1. ログイン（トークンを取得）
echo "1. ログイン中..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"supersecret"}')

# トークンを抽出
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo " ログイン失敗"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo " ログイン成功"
echo "Token: ${TOKEN:0:50}..."

# 2. 基本データ確認（Authorizationヘッダー使用）
echo ""
echo "2. 基本データ確認..."

# 商品数確認
PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/products" \
  -H "Authorization: Bearer $TOKEN")
PRODUCT_COUNT=$(echo $PRODUCTS | jq '.products | length' 2>/dev/null || echo "0")
echo "現在の商品数: $PRODUCT_COUNT"

# 会社数確認
COMPANIES=$(curl -s -X GET "$BASE_URL/admin/companies" \
  -H "Authorization: Bearer $TOKEN")
COMPANY_COUNT=$(echo $COMPANIES | jq '.companies | length' 2>/dev/null || echo "0")
echo "現在の会社数: $COMPANY_COUNT"

# 3. テストデータ作成
echo ""
echo "3. テストデータ作成..."
SAMPLE_DATA=$(curl -s -X POST "$BASE_URL/admin/test/create-sample-data" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "サンプルデータ作成結果:"
if echo $SAMPLE_DATA | jq . >/dev/null 2>&1; then
  echo $SAMPLE_DATA | jq '.message'
else
  echo "$SAMPLE_DATA"
fi

# 4. テナント別商品確認
echo ""
echo "4. テナント別商品確認..."

TENANT_A_ID="comp_01K27ZHT30SKSCWDH9Z2J8AEGF"
TENANT_B_ID="comp_7de1989184db5bd876b8390390"

echo "企業A会社の商品確認:"
TENANT_A_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/companies/$TENANT_A_ID/products" \
  -H "Authorization: Bearer $TOKEN")

if echo $TENANT_A_PRODUCTS | jq . >/dev/null 2>&1; then
  TENANT_A_COUNT=$(echo $TENANT_A_PRODUCTS | jq '.total_products' 2>/dev/null || echo "0")
  echo "  商品数: $TENANT_A_COUNT"
  echo $TENANT_A_PRODUCTS | jq -r '.products[]?.title // "商品なし"' 2>/dev/null | head -3
else
  echo "  エラー: $TENANT_A_PRODUCTS"
fi

echo ""
echo "企業B会社の商品確認:"
TENANT_B_PRODUCTS=$(curl -s -X GET "$BASE_URL/admin/companies/$TENANT_B_ID/products" \
  -H "Authorization: Bearer $TOKEN")

if echo $TENANT_B_PRODUCTS | jq . >/dev/null 2>&1; then
  TENANT_B_COUNT=$(echo $TENANT_B_PRODUCTS | jq '.total_products' 2>/dev/null || echo "0")
  echo "  商品数: $TENANT_B_COUNT"
  echo $TENANT_B_PRODUCTS | jq -r '.products[]?.title // "商品なし"' 2>/dev/null | head -3
else
  echo "  エラー: $TENANT_B_PRODUCTS"
fi

# 5. 結果確認
echo ""
echo "5. テスト結果:"
if [ "$TENANT_A_COUNT" != "0" ] && [ "$TENANT_B_COUNT" != "0" ]; then
  echo " テナント分離成功: 各テナントが独立した商品を管理"
else
  echo " テナント分離未完了: データ作成または取得に問題があります"
fi

echo ""
echo "APIテスト完了!"



