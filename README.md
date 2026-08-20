# javascript-tracer

ブラウザ内でJavaScriptを一行ずつ実行し、変数とコンソール出力を確認できる小さなトレースワークスペースです。

## 起動

```bash
npm install
npm run dev
```

表示されたローカルURLをブラウザで開いてください。

## 操作

- **Step**: 現在行を1行実行
- **Run all**: 先頭から自動実行
- **Pause**: 自動実行を停止
- **Reset**: 実行状態を初期化
- `Ctrl + Enter` / `Cmd + Enter`: Run all

コードは外部サーバーへ送信せず、ブラウザ内で評価されます。
