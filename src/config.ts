// アプリ全体の共通設定・メタデータ・文言の一元管理
export const APP_CONFIG = {
    name: 'スケジュール記録ストップウォッチ',
    version: '1.0.0',

    // ステータス・説明文言（ここで一括管理！）
    storageStatusText: 'スプレッドシート自動同期',
    storageDetailText: 'データはローカル保存とGoogleスプレッドシートへ自動同期されます',

    // 機密情報や外部URL（Viteの環境変数から安全に取得、なければフォールバック）
    gasWebAppUrl: import.meta.env.VITE_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbxeW7J7SKLKlRsJgSn7gftWEPQMdlwvcmR8W3dGpFgOrgYKhKUrCRvAeBoWJ9Y-zObG-Q/exec',
};