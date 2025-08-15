// 簡単なユーザー作成テストスクリプト
console.log("=== ユーザー作成テスト開始 ===");

const fs = require('fs');
const path = require('path');

// スクリプトの実行確認
console.log("1. スクリプトが実行されています");
console.log("2. 現在のディレクトリ:", process.cwd());
console.log("3. ファイルが存在するか確認:", fs.existsSync('src/scripts/create-hierarchical-users.ts'));

// 簡単なHTTPリクエストでサーバーの状態確認
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9000,
  path: '/admin/companies',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log("4. サーバーに接続テスト...");

const req = http.request(options, (res) => {
  console.log(`サーバー応答: ${res.statusCode}`);
  console.log(`ヘッダー: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('レスポンス:', data);
    console.log("=== テスト完了 ===");
  });
});

req.on('error', (e) => {
  console.error(`エラー: ${e.message}`);
  console.log("=== テスト完了（エラー） ===");
});

req.end();