#!/bin/bash

# RLS動作確認テストスクリプト
echo "RLS (Row Level Security) 動作確認テスト開始"
echo "============================================="

DB_NAME="medusa-b2b-starter"

# テスト用のユーザー設定関数
set_db_user() {
    local email=$1
    local role=$2
    local company_id=$3
    local store_ids=$4
    
    echo "データベースユーザー設定: $email ($role)"
    
    # current_settingを使用してユーザー情報を設定
    psql -d $DB_NAME -c "
        SELECT set_config('app.current_user_email', '$email', false);
    " > /dev/null
}

# RLSポリシーが適用されているかチェック
check_rls_status() {
    echo "1. RLS適用状況の確認"
    echo "-------------------"
    
    psql -d $DB_NAME -c "
        SELECT 
            tablename, 
            rowsecurity,
            CASE WHEN rowsecurity THEN '✅ 有効' ELSE '❌ 無効' END as status
        FROM pg_tables 
        WHERE tablename IN ('company', 'employee', 'quote', 'product', 'store', 'customer', 'cart', 'approval')
        AND schemaname = 'public'
        ORDER BY tablename;
    "
    
    echo ""
    echo "2. 作成されたRLSポリシー一覧"
    echo "-------------------------"
    
    psql -d $DB_NAME -c "
        SELECT 
            tablename,
            policyname,
            CASE cmd 
                WHEN 'ALL' THEN '全操作'
                WHEN 'SELECT' THEN '閲覧のみ'
                WHEN 'INSERT' THEN '挿入のみ'
                WHEN 'UPDATE' THEN '更新のみ'
                WHEN 'DELETE' THEN '削除のみ'
            END as permissions
        FROM pg_policies 
        WHERE tablename IN ('company', 'employee', 'quote', 'product', 'store', 'customer', 'cart', 'approval')
        ORDER BY tablename, policyname;
    "
    
    echo ""
}

# ヘルパー関数のテスト
test_helper_functions() {
    echo "3. RLSヘルパー関数テスト"
    echo "----------------------"
    
    # platform_adminとして設定
    set_db_user "saas_admin@example.com" "platform_admin" "" ""
    
    echo "Platform Admin設定後:"
    psql -d $DB_NAME -c "SELECT * FROM rls_debug_current_user;"
    
    echo ""
    
    # company_adminとして設定
    set_db_user "会社a_admin@example.com" "company_admin" "comp_test123" ""
    
    echo "Company Admin設定後:"
    psql -d $DB_NAME -c "SELECT * FROM rls_debug_current_user;"
    
    echo ""
}

# 実際のデータでRLSテスト
test_rls_with_data() {
    echo "4. 実データでのRLSテスト"
    echo "--------------------"
    
    # まず、全データ件数を確認（システム管理者として）
    echo "【システム管理者視点 - 全データ】"
    set_db_user "saas_admin@example.com" "platform_admin" "" ""
    
    echo -n "Companies: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM company;" | tr -d ' '
    
    echo -n "Employees: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM employee;" | tr -d ' '
    
    echo -n "Products: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM product;" | tr -d ' '
    
    echo ""
    
    # Company Adminとしてテスト
    echo "【Company Admin視点 - 自社データのみ】"
    set_db_user "会社a_admin@example.com" "company_admin" "comp_01JFD2KKFHX8FVHK9FQ6E0Q8P0" ""
    
    echo "アクセス可能なCompanies:"
    psql -d $DB_NAME -c "SELECT name FROM company;"
    
    echo ""
    echo "アクセス可能なEmployees:"
    psql -d $DB_NAME -c "SELECT COUNT(*) as employee_count FROM employee;"
    
    echo ""
    
    # Employee Userとしてテスト
    echo "【Employee User視点 - 個人データのみ】"
    set_db_user "test.employee@example.com" "employee_user" "comp_01JFD2KKFHX8FVHK9FQ6E0Q8P0" ""
    
    echo "アクセス可能なCompanies:"
    psql -d $DB_NAME -c "SELECT COUNT(*) as company_count FROM company;"
    
    echo ""
    echo "アクセス可能なCustomer情報:"
    psql -d $DB_NAME -c "SELECT COUNT(*) as customer_count FROM customer;"
    
    echo ""
}

# RLSバイパスのテスト（セキュリティ検証）
test_rls_bypass() {
    echo "5. RLSバイパステスト（セキュリティ検証）"
    echo "-----------------------------------"
    
    # 不正なユーザーでアクセス試行
    set_db_user "malicious@hacker.com" "employee_user" "" ""
    
    echo "不正ユーザーでのアクセス試行:"
    echo -n "Company件数: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM company;" | tr -d ' '
    
    echo -n "Employee件数: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM employee;" | tr -d ' '
    
    echo -n "Product件数: "
    psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM product;" | tr -d ' '
    
    echo ""
    echo "※ 上記がすべて0または少数なら、RLSが正常に動作しています"
    echo ""
}

# メイン実行
main() {
    # データベースへの接続確認
    if ! psql -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ データベース '$DB_NAME' に接続できません"
        exit 1
    fi
    
    echo "✅ データベース接続OK"
    echo ""
    
    check_rls_status
    test_helper_functions
    test_rls_with_data
    test_rls_bypass
    
    echo "============================================="
    echo "RLSテスト完了"
    echo ""
    echo "【重要な注意点】"
    echo "- RLSはデータベースレベルでの制限です"
    echo "- アプリケーション層でもuser情報をcurrent_settingに設定する必要があります"
    echo "- 本番環境では適切なデータベースユーザー管理も必要です"
    echo "============================================="
}

# スクリプト実行
main