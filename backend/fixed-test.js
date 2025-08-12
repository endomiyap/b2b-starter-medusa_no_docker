// 修正版テストスクリプト - Developer Toolsのコンソールで実行

// 1. 基本確認
async function basicCheck() {
  console.log(' 基本データ確認中...');
  
  const products = await fetch('/admin/products').then(r => r.json());
  console.log(`現在の商品数: ${products?.products?.length || 0}`);
  
  const companies = await fetch('/admin/companies').then(r => r.json());
  console.log(`現在の会社数: ${companies?.companies?.length || 0}`);
  
  return { products, companies };
}

// 2. 修正版商品作成（オプション付き）
async function createTestProductFixed() {
  console.log(' 修正版テスト商品作成中...');
  
  const response = await fetch('/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'テスト商品修正版 - ' + new Date().toISOString().slice(0,16),
      handle: 'test-product-fixed-' + Date.now(),
      description: 'マルチテナント分離テスト用商品（修正版）',
      status: 'published',
      options: [
        {
          title: 'サイズ',
          values: ['S', 'M', 'L']
        }
      ],
      variants: [
        {
          title: 'S',
          prices: [{ currency_code: 'jpy', amount: 1000 }],
          options: { 'サイズ': 'S' }
        },
        {
          title: 'M', 
          prices: [{ currency_code: 'jpy', amount: 1200 }],
          options: { 'サイズ': 'M' }
        },
        {
          title: 'L',
          prices: [{ currency_code: 'jpy', amount: 1500 }],
          options: { 'サイズ': 'L' }
        }
      ]
    })
  });
  
  if (response.ok) {
    const product = await response.json();
    console.log(' 商品作成成功:', product.product?.title);
    return product.product;
  } else {
    const error = await response.json();
    console.log(' 商品作成失敗:', error);
    return null;
  }
}

// 3. 会社-ストア関連確認（修正版）
async function checkCompanyStoresFixed() {
  console.log(' 会社-ストア関連確認中（修正版）...');
  
  const tenantAId = 'comp_01K27ZHT30SKSCWDH9Z2J8AEGF';
  const tenantBId = 'comp_7de1989184db5bd876b8390390';
  
  try {
    const tenantAResponse = await fetch(`/admin/companies/${tenantAId}/stores`);
    const tenantAStores = await tenantAResponse.json();
    console.log('テナントA会社のストア:', tenantAStores);
    
    const tenantBResponse = await fetch(`/admin/companies/${tenantBId}/stores`);
    const tenantBStores = await tenantBResponse.json();  
    console.log('テナントB会社のストア:', tenantBStores);
    
    return { 
      tenantAStores: tenantAResponse.ok ? tenantAStores : { error: 'API Error' },
      tenantBStores: tenantBResponse.ok ? tenantBStores : { error: 'API Error' }
    };
    
  } catch (error) {
    console.log(' 会社-ストア確認エラー:', error);
    return { error: 'Network Error' };
  }
}

// 4. テナント分離機能の基本確認
async function checkTenantSeparation() {
  console.log(' テナント分離基本確認...');
  
  // 既存の商品リストを確認
  const allProducts = await fetch('/admin/products').then(r => r.json());
  console.log('システム内の全商品:', allProducts.products?.length || 0);
  
  if (allProducts.products?.length > 0) {
    console.log('最近の商品:');
    allProducts.products.slice(-3).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (ID: ${product.id})`);
    });
  }
  
  return allProducts;
}

// 修正版全テスト実行
async function runFixedTests() {
  try {
    console.log(' 修正版マルチテナント分離テスト開始');
    console.log('=' .repeat(50));
    
    await basicCheck();
    console.log('\n');
    
    const product = await createTestProductFixed();
    console.log('\n');
    
    const companyStores = await checkCompanyStoresFixed();
    console.log('\n');
    
    await checkTenantSeparation();
    
    console.log('\n 修正版テスト完了!');
    console.log('\n 結果確認:');
    console.log('1. 商品作成:', product ? ' 成功' : ' 失敗');
    console.log('2. 会社-ストア取得:', companyStores.error ? ' エラー' : ' 成功');
    console.log('\n 次のステップ:');
    console.log('1. Admin UIでProductsページを確認');
    console.log('2. 作成された商品を確認');
    console.log('3. Company-Store APIエラーを確認');
    
    return { product, companyStores };
    
  } catch (error) {
    console.error(' テストエラー:', error);
  }
}

// 修正版テスト実行（この行をコピー&ペーストして実行）
runFixedTests();
