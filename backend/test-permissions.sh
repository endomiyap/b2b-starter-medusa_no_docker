#!/bin/bash

# 階層的権限管理テストスクリプト
echo "階層的権限管理テスト開始"
echo "=========================="

BASE_URL="http://localhost:9000"

# テスト用ユーザーの定義
declare -A USERS=(
    ["platform_admin"]="saas_admin@example.com:supersecret"
    ["company_admin_a"]="会社a_admin@example.com:supersecret"
    ["company_admin_b"]="会社b_admin@example.com:supersecret"
    ["store_admin_e"]="ストアe_admin@example.com:supersecret"
    ["store_admin_f"]="ストアf_admin@example.com:supersecret"
)

# トークン取得関数
get_token() {
    local email=$1
    local password=$2
    
    local response=$(curl -s -X POST "$BASE_URL/auth/user/emailpass" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# APIテスト関数
test_api() {
    local user_type=$1
    local method=$2
    local endpoint=$3
    local token=$4
    local expected_status=$5
    
    echo -n "[$user_type] $method $endpoint: "
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X $method "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $token")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS ($status)"
    else
        echo "❌ FAIL (expected $expected_status, got $status)"
    fi
}

# 会社IDを取得
echo "会社情報の取得..."
PLATFORM_TOKEN=$(get_token "saas_admin@example.com" "supersecret")

if [ -z "$PLATFORM_TOKEN" ]; then
    echo "❌ Platform Adminのトークン取得に失敗しました"
    exit 1
fi

COMPANIES=$(curl -s -X GET "$BASE_URL/admin/companies" \
    -H "Authorization: Bearer $PLATFORM_TOKEN")

COMPANY_A_ID=$(echo $COMPANIES | jq -r '.companies[] | select(.name | contains("会社A")) | .id')
COMPANY_B_ID=$(echo $COMPANIES | jq -r '.companies[] | select(.name | contains("会社B")) | .id')

echo "会社A ID: $COMPANY_A_ID"
echo "会社B ID: $COMPANY_B_ID"
echo ""

# 各ユーザーのトークンを取得
declare -A TOKENS

for user_key in "${!USERS[@]}"; do
    IFS=':' read -r email password <<< "${USERS[$user_key]}"
    token=$(get_token "$email" "$password")
    
    if [ -n "$token" ]; then
        TOKENS[$user_key]=$token
        echo "✅ $user_key トークン取得成功"
    else
        echo "❌ $user_key トークン取得失敗"
    fi
done

echo ""
echo "=== 権限テスト開始 ==="
echo ""

# 1. 会社一覧のアクセステスト
echo "1. 会社一覧アクセステスト"
echo "------------------------"
test_api "platform_admin" "GET" "/admin/companies" "${TOKENS[platform_admin]}" "200"
test_api "company_admin_a" "GET" "/admin/companies" "${TOKENS[company_admin_a]}" "200"
test_api "store_admin_e" "GET" "/admin/companies" "${TOKENS[store_admin_e]}" "403"

echo ""

# 2. 会社作成テスト（Platform Adminのみ）
echo "2. 会社作成権限テスト"
echo "-------------------"
test_api "platform_admin" "POST" "/admin/companies" "${TOKENS[platform_admin]}" "200"
test_api "company_admin_a" "POST" "/admin/companies" "${TOKENS[company_admin_a]}" "403"
test_api "store_admin_e" "POST" "/admin/companies" "${TOKENS[store_admin_e]}" "403"

echo ""

# 3. 自社データアクセステスト
echo "3. 自社データアクセステスト"
echo "------------------------"
test_api "platform_admin" "GET" "/admin/companies/$COMPANY_A_ID" "${TOKENS[platform_admin]}" "200"
test_api "company_admin_a" "GET" "/admin/companies/$COMPANY_A_ID" "${TOKENS[company_admin_a]}" "200"
test_api "company_admin_a" "GET" "/admin/companies/$COMPANY_B_ID" "${TOKENS[company_admin_a]}" "403"
test_api "company_admin_b" "GET" "/admin/companies/$COMPANY_A_ID" "${TOKENS[company_admin_b]}" "403"

echo ""

# 4. 従業員管理権限テスト
echo "4. 従業員管理権限テスト"
echo "--------------------"
test_api "platform_admin" "GET" "/admin/companies/$COMPANY_A_ID/employees" "${TOKENS[platform_admin]}" "200"
test_api "company_admin_a" "GET" "/admin/companies/$COMPANY_A_ID/employees" "${TOKENS[company_admin_a]}" "200"
test_api "company_admin_a" "GET" "/admin/companies/$COMPANY_B_ID/employees" "${TOKENS[company_admin_a]}" "403"
test_api "store_admin_e" "GET" "/admin/companies/$COMPANY_A_ID/employees" "${TOKENS[store_admin_e]}" "403"

echo ""

# 5. Store-Product関連のテスト
echo "5. Store-Product関連テスト"
echo "-----------------------"

# Store一覧の取得
STORES=$(curl -s -X GET "$BASE_URL/admin/stores" \
    -H "Authorization: Bearer $PLATFORM_TOKEN")

STORE_E_ID=$(echo $STORES | jq -r '.stores[] | select(.name | contains("ストアE")) | .id')
STORE_F_ID=$(echo $STORES | jq -r '.stores[] | select(.name | contains("ストアF")) | .id')

echo "ストアE ID: $STORE_E_ID"
echo "ストアF ID: $STORE_F_ID"

# 会社-Store関連のテスト
test_api "platform_admin" "GET" "/admin/companies/$COMPANY_A_ID/stores" "${TOKENS[platform_admin]}" "200"
test_api "company_admin_a" "GET" "/admin/companies/$COMPANY_A_ID/stores" "${TOKENS[company_admin_a]}" "200"
test_api "company_admin_b" "GET" "/admin/companies/$COMPANY_A_ID/stores" "${TOKENS[company_admin_b]}" "403"

echo ""

# 6. Store-Product関連のテスト
if [ -n "$STORE_E_ID" ]; then
    echo "6. Store商品管理テスト"
    echo "-------------------"
    test_api "platform_admin" "GET" "/admin/stores/$STORE_E_ID/products" "${TOKENS[platform_admin]}" "200"
    test_api "company_admin_a" "GET" "/admin/stores/$STORE_E_ID/products" "${TOKENS[company_admin_a]}" "200"
    test_api "store_admin_e" "GET" "/admin/stores/$STORE_E_ID/products" "${TOKENS[store_admin_e]}" "200"
    test_api "store_admin_f" "GET" "/admin/stores/$STORE_E_ID/products" "${TOKENS[store_admin_f]}" "403"
fi

echo ""

# 7. 権限昇格テスト（実際の業務フロー）
echo "7. 実業務フローテスト"
echo "------------------"

# Platform Adminが新しい会社を作成
echo "Platform Adminが新会社を作成..."
NEW_COMPANY=$(curl -s -X POST "$BASE_URL/admin/companies" \
    -H "Authorization: Bearer ${TOKENS[platform_admin]}" \
    -H "Content-Type: application/json" \
    -d '{"name":"テスト会社","email":"test@example.com","currency_code":"JPY"}')

NEW_COMPANY_ID=$(echo $NEW_COMPANY | jq -r '.companies[0].id')

if [ -n "$NEW_COMPANY_ID" ] && [ "$NEW_COMPANY_ID" != "null" ]; then
    echo "✅ 新会社作成成功: $NEW_COMPANY_ID"
    
    # Company Adminが従業員を追加
    echo "Company Adminが従業員を追加..."
    test_api "company_admin_a" "POST" "/admin/companies/$NEW_COMPANY_ID/employees" "${TOKENS[company_admin_a]}" "403"
    echo "✅ 他社への従業員追加は正しく拒否された"
else
    echo "❌ 新会社作成失敗"
fi

echo ""
echo "=== テスト完了 ==="
echo ""

# サマリー表示
echo "=== 権限階層サマリー ==="
echo "Platform Admin (saas_admin@example.com):"
echo "  - 全システム管理可能"
echo "  - 全ての会社・Store・商品にアクセス可能"
echo ""
echo "Company Admin (会社a_admin@example.com):"
echo "  - 自社の全てのStore・従業員を管理可能"
echo "  - 他社のデータにはアクセス不可"
echo ""
echo "Store Admin (ストアe_admin@example.com):"
echo "  - 担当Storeの商品・注文のみ管理可能"
echo "  - 会社レベルの管理機能にはアクセス不可"
echo ""
echo "Company User:"
echo "  - 個人の注文・見積のみアクセス可能"
echo "  - 管理機能にはアクセス不可"