// テナント別商品作成・関連付けスクリプト
// ブラウザのDeveloper Toolsで実行してください（http://localhost:9000/app でログイン後）

const createTenantProducts = async () => {
  console.log('🏭 テナント別商品データを作成中...');
  console.log('=' .repeat(60));

  try {
    // 1. テナントAの商品を作成
    console.log('\n テナントA専用商品を作成中...');
    const tenantAProduct = await fetch('/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'テナントA専用商品 - オフィス用品セット',
        handle: 'tenant-a-office-supplies',
        description: 'テナントA向けのビジネス用品セットです。他のテナントからは見えません。',
        status: 'published',
        variants: [{
          title: 'デフォルトバリアント',
          prices: [{ currency_code: 'jpy', amount: 5000 }]
        }]
      })
    });
    const tenantAProductData = await tenantAProduct.json();
    console.log('✅ テナントA商品作成完了:', tenantAProductData?.product?.title);

    // 2. テナントBの商品を作成
    console.log('\n2️⃣ テナントB専用商品を作成中...');
    const tenantBProduct = await fetch('/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'テナントB専用商品 - 海外向けパッケージ',
        handle: 'tenant-b-international-package',
        description: 'テナントB向けの国際展開用商品です。テナントAからは見えません。',
        status: 'published',
        variants: [{
          title: 'デフォルトバリアント',
          prices: [{ currency_code: 'jpy', amount: 8000 }]
        }]
      })
    });
    const tenantBProductData = await tenantBProduct.json();
    console.log('✅ テナントB商品作成完了:', tenantBProductData?.product?.title);

    // 3. 商品とストアの関連付け（リンク作成）
    const tenantAStoreId = 'store_01K2DX48ZTG990CHV19HN64FWR'; // テナントAストア
    const tenantBStoreId = 'store_789def'; // テナントBストア

    console.log('\n 商品-ストア関連付け中...');
    
    // テナントA商品 → テナントAストアのみ
    if (tenantAProductData?.product?.id) {
      console.log(' テナントA商品をテナントAストアに関連付け中...');
      const linkAResponse = await fetch(`/admin/products/${tenantAProductData.product.id}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: tenantAStoreId })
      });
      const linkAResult = await linkAResponse.json();
      console.log(' テナントA商品-ストアリンク作成:', linkAResponse.ok ? '成功' : '失敗', linkAResult);
    }

    // テナントB商品 → テナントBストアのみ
    if (tenantBProductData?.product?.id) {
      console.log(' テナントB商品をテナントBストアに関連付け中...');
      const linkBResponse = await fetch(`/admin/products/${tenantBProductData.product.id}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: tenantBStoreId })
      });
      const linkBResult = await linkBResponse.json();
      console.log(' テナントB商品-ストアリンク作成:', linkBResponse.ok ? '成功' : '失敗', linkBResult);
    }

    console.log('\n テナント別商品データ作成完了！');
    console.log('\n 作成されたデータ:');
    console.log(`- テナントA商品: ${tenantAProductData?.product?.title} (ID: ${tenantAProductData?.product?.id})`);
    console.log(`- テナントB商品: ${tenantBProductData?.product?.title} (ID: ${tenantBProductData?.product?.id})`);
    
    console.log('\n 次のステップ:');
    console.log('1. 商品-ストアリンクAPI実装');
    console.log('2. 各テナントでの商品表示確認');
    console.log('3. 他テナントの商品が見えないことを確認');

  } catch (error) {
    console.error(' エラー:', error);
  }
};

// スクリプト実行
createTenantProducts();
