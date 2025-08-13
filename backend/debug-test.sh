#!/bin/bash

echo "デバッグテスト開始"
echo "=================="

# トークン取得
TOKEN=$(curl -s -X POST "http://localhost:9000/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"supersecret"}' | jq -r '.token')

echo "Token取得: ${TOKEN:0:20}..."

# 1. 全商品確認
echo ""
echo "1. 全商品確認:"
curl -s -X GET "http://localhost:9000/admin/products" \
  -H "Authorization: Bearer $TOKEN" | jq '.products[] | {id, title}'

# 2. 会社一覧確認
echo ""
echo "2. 会社一覧確認:"
curl -s -X GET "http://localhost:9000/admin/companies" \
  -H "Authorization: Bearer $TOKEN" | jq '.companies[] | {id, name}'

# 3. ストア一覧確認
echo ""
echo "3. ストア一覧確認:"
curl -s -X GET "http://localhost:9000/admin/stores" \
  -H "Authorization: Bearer $TOKEN" | jq '.stores[] | {id, name}'

# 4. 会社-ストア関連確認
echo ""
echo "4. 企業Aのストア:"
curl -s -X GET "http://localhost:9000/admin/companies/comp_01K27ZHT30SKSCWDH9Z2J8AEGF/stores" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "5. 企業Bのストア:"
curl -s -X GET "http://localhost:9000/admin/companies/comp_7de1989184db5bd876b8390390/stores" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. ストア別商品確認
echo ""
echo "6. 企業Aストアの商品:"
curl -s -X GET "http://localhost:9000/admin/stores/store_01K27XHETT3F9Q476JC90YSBJT/products" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "7. 企業Bストアの商品:"
curl -s -X GET "http://localhost:9000/admin/stores/store_01K2DX48ZTG990CHV19HN64FWR/products" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "デバッグテスト完了"
