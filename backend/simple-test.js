// 簡単なテストスクリプト - Developer Toolsのコンソールで実行

// 1. 基本確認
async function basicCheck() {
  console.log(' 基本データ確認中...');
  
  // 商品数確認
  const products = await fetch('/admin/products').then(r => r.json());
  console.log(`現在の商品数: ${products?.products?.length || 0}`);
  
  // 会社データ確認
  const companies = await fetch('/admin/companies').then(r => r.json());
  console.log(`現在の会社数: ${companies?.companies?.length || 0}`);
  
  return { products, companies };
}

// 2. 商品作成テスト
async function createTestProduct() {
  console.log(' テスト商品作成中...');
  
  const response = await fetch('/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'テスト商品 - ' + new Date().toISOString().slice(0,10),
      handle: 'test-product-' + Date.now(),
      description: 'マルチテナント分離テスト用商品',
      status: 'published',
      variants: [{
        title: 'デフォルト',
        prices: [{ currency_code: 'jpy', amount: 1000 }]
      }]
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

// 3. 会社-ストア関連確認
async function checkCompanyStores() {
  console.log(' 会社-ストア関連確認中...');
  
  const tenantAId = 'comp_01K27ZHT30SKSCWDH9Z2J8AEGF';
  const tenantBId = 'comp_7de1989184db5bd876b8390390';
  
  const tenantAStores = await fetch(`/admin/companies/${tenantAId}/stores`).then(r => r.json());
  const tenantBStores = await fetch(`/admin/companies/${tenantBId}/stores`).then(r => r.json());
  
  console.log('テナントA会社のストア:', tenantAStores);
  console.log('テナントB会社のストア:', tenantBStores);
  
  return { tenantAStores, tenantBStores };
}

// 全テスト実行
async function runAllTests() {
  try {
    console.log(' マルチテナント分離テスト開始');
    console.log('=' .repeat(40));
    
    await basicCheck();
    console.log('\n');
    
    const product = await createTestProduct();
    console.log('\n');
    
    await checkCompanyStores();
    
    console.log('\n テスト完了!');
    
    // 次のステップを表示
    console.log('\n 次のステップ:');
    console.log('1. Admin UIでProductsページを確認');
    console.log('2. テスト商品が作成されていることを確認');
    console.log('3. 各テナントが独立していることを確認');
    
    return product;
    
  } catch (error) {
    console.error(' テストエラー:', error);
  }
}

// テスト実行（この行をコピー&ペーストして実行）
runAllTests();
