import { Order, Inventory, InventorySnapshot, InventorySummary, RollConversionConfig } from '@/types';
import { compareDates } from './dateUtils';

/**
 * 全受注の在庫スナップショットを計算
 *
 * 重要：底と蓋は同じロール材から切り出されるため、共通プールとして管理
 *
 * @param orders 全受注データ
 * @param currentInventory 現在の在庫
 * @param config ロール換算設定
 * @returns 各受注時点での在庫スナップショット配列
 */
export function calculateInventorySnapshots(
  orders: Order[],
  currentInventory: Inventory,
  config: RollConversionConfig
): InventorySnapshot[] {
  // 1. 受注を納期順にソート（同じ納期なら作成日時順）
  const sortedOrders = [...orders].sort((a, b) => {
    const dateCompare = compareDates(a.deliveryDate, b.deliveryDate);
    if (dateCompare !== 0) return dateCompare;
    return compareDates(a.createdAt, b.createdAt);
  });

  // 2. 初期在庫をセット
  let currentBody = currentInventory.body;
  let currentBottom = currentInventory.bottom;
  let currentLid = currentInventory.lid;
  let currentRolls = currentInventory.rolls;

  // 3. スナップショット配列を初期化
  const snapshots: InventorySnapshot[] = [];

  // 4. 各受注を順番に処理
  for (const order of sortedOrders) {
    // 底・蓋用の共通プール（枚数）を計算
    // 共通プール = 底在庫 + 蓋在庫 + (ロール本数 × 1本あたり枚数)
    const bottomLidPoolBefore = currentBottom + currentLid + (currentRolls * config.piecesPerRoll);

    // 必要数を計算
    const requiredBody = order.setQuantity;
    const requiredBottomLid = order.setQuantity + order.setQuantity + order.additionalLids;
    // セット数分の底 + セット数分の蓋 + 追加蓋数

    // 処理前の在庫を記録
    const beforeInventory = {
      body: currentBody,
      bottom: currentBottom,
      lid: currentLid,
      rolls: currentRolls,
      bottomLidPool: bottomLidPoolBefore,
    };

    // ボディを引き落とし
    currentBody -= requiredBody;

    // 底・蓋を共通プールから引き落とし
    // シンプルなアプローチ：共通プールから必要数を引き、残りを在庫に反映
    const bottomLidPoolAfter = bottomLidPoolBefore - requiredBottomLid;

    // 処理後の在庫を計算（簡略版）
    if (bottomLidPoolAfter >= 0) {
      // 足りている場合：残りを各在庫に分配
      // まず、ロールから優先的に消費
      const totalRollPieces = currentRolls * config.piecesPerRoll;

      if (totalRollPieces >= requiredBottomLid) {
        // ロールだけで足りる
        const remainingRollPieces = totalRollPieces - requiredBottomLid;
        currentRolls = Math.floor(remainingRollPieces / config.piecesPerRoll);
        const extraPieces = remainingRollPieces % config.piecesPerRoll;
        currentLid += extraPieces;
        // currentBottom と currentLid は変わらない（ロールのみ消費）
      } else {
        // ロールを全部使い、残りをカット済みから消費
        currentRolls = 0;
        const stillNeeded = requiredBottomLid - totalRollPieces;

        // 底から優先的に消費
        if (currentBottom >= stillNeeded) {
          currentBottom -= stillNeeded;
        } else {
          const remaining = stillNeeded - currentBottom;
          currentBottom = 0;
          currentLid -= remaining;
        }
      }
    } else {
      // 足りない場合：全て使い切り、不足分をマイナスで表現
      currentRolls = 0;
      currentBottom = 0;
      currentLid = bottomLidPoolAfter; // マイナス値
    }

    // 処理後の在庫を記録
    const bottomLidPoolAfterCalculated = currentBottom + currentLid + (currentRolls * config.piecesPerRoll);

    const afterInventory = {
      body: currentBody,
      bottom: currentBottom,
      lid: currentLid,
      rolls: currentRolls,
      bottomLidPool: bottomLidPoolAfterCalculated,
    };

    // ステータス判定
    const isBodySufficient = currentBody >= 0;
    const isBottomLidSufficient = bottomLidPoolAfterCalculated >= 0;
    const isAllSufficient = isBodySufficient && isBottomLidSufficient;

    // 不足数を計算
    const bodyShortage = currentBody < 0 ? Math.abs(currentBody) : 0;
    const bottomLidShortage = bottomLidPoolAfterCalculated < 0 ? Math.abs(bottomLidPoolAfterCalculated) : 0;

    // スナップショットを作成
    const snapshot: InventorySnapshot = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate,
      setQuantity: order.setQuantity,
      additionalLids: order.additionalLids,
      beforeInventory,
      required: {
        body: requiredBody,
        bottomLid: requiredBottomLid,
      },
      afterInventory,
      isBodySufficient,
      isBottomLidSufficient,
      isAllSufficient,
      bodyShortage,
      bottomLidShortage,
    };

    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * 在庫不足サマリーを取得
 *
 * @param snapshots 在庫スナップショット配列
 * @returns 在庫不足サマリー
 */
export function getInventorySummary(snapshots: InventorySnapshot[]): InventorySummary {
  const affectedOrders = snapshots.filter(s => !s.isAllSufficient);
  const hasShortage = affectedOrders.length > 0;

  // 不足数の合計（最後のスナップショットの不足数が累積値）
  const lastSnapshot = snapshots[snapshots.length - 1];
  const totalBodyShortage = lastSnapshot ? lastSnapshot.bodyShortage : 0;
  const totalBottomLidShortage = lastSnapshot ? lastSnapshot.bottomLidShortage : 0;

  return {
    hasShortage,
    totalBodyShortage,
    totalBottomLidShortage,
    affectedOrders,
  };
}

/**
 * ロール本数から枚数に換算
 */
export function rollsToQuantity(rolls: number, config: RollConversionConfig): number {
  return rolls * config.piecesPerRoll;
}

/**
 * 枚数からロール本数に換算（切り上げ）
 */
export function quantityToRolls(quantity: number, config: RollConversionConfig): number {
  return Math.ceil(quantity / config.piecesPerRoll);
}
