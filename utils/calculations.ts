import { Order, Inventory, InventorySnapshot, InventorySummary, RollConversionConfig, getTotalInventory } from '@/types';
import { compareDates } from './dateUtils';
import { DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG, PAIL_BODY_CONFIG } from './constants';

/**
 * 全受注の在庫スナップショットを計算
 *
 * 重要：底と蓋は同じロール材から切り出されるため、共通プールとして管理
 * 製品タイプ（standard / pail）ごとに異なる在庫を使用
 *
 * @param orders 全受注データ
 * @param currentInventory 現在の在庫
 * @param config ロール換算設定（既存製品用、後方互換性のため残す）
 * @returns 各受注時点での在庫スナップショット配列
 */
export function calculateInventorySnapshots(
  orders: Order[],
  currentInventory: Inventory,
  config: RollConversionConfig = DEFAULT_ROLL_CONFIG
): InventorySnapshot[] {
  // 1. 受注を納期順にソート（同じ納期なら作成日時順）
  const sortedOrders = [...orders].sort((a, b) => {
    const dateCompare = compareDates(a.deliveryDate, b.deliveryDate);
    if (dateCompare !== 0) return dateCompare;
    return compareDates(a.createdAt, b.createdAt);
  });

  // 2. 初期在庫をセット（全拠点の合計）
  const totalInventory = getTotalInventory(currentInventory);

  // 既存製品用在庫
  let currentBody = totalInventory.body;
  let currentBottom = totalInventory.bottom;
  let currentLid = totalInventory.lid;
  let currentRolls = totalInventory.rolls;

  // ペール製品用在庫
  let currentPailBody = totalInventory.pailBody;
  let currentPailBottom = totalInventory.pailBottom;
  let currentPailLid = totalInventory.pailLid;
  let currentPailRolls = totalInventory.pailRolls;

  // 3. スナップショット配列を初期化
  const snapshots: InventorySnapshot[] = [];

  // 4. 各受注を順番に処理
  for (const order of sortedOrders) {
    if (order.productType === 'pail') {
      // ===== ペール製品の処理 =====

      // 底・蓋用の共通プール（枚数）を計算
      const bottomLidPoolBefore = currentPailBottom + currentPailLid + (currentPailRolls * PAIL_ROLL_CONFIG.piecesPerRoll);

      // 必要数を計算
      const requiredBody = order.setQuantity;
      const requiredBottomLid = order.setQuantity + order.setQuantity + order.additionalLids;

      // 処理前の在庫を記録
      const beforeInventory = {
        body: currentPailBody,
        bottom: currentPailBottom,
        lid: currentPailLid,
        rolls: currentPailRolls,
        bottomLidPool: bottomLidPoolBefore,
      };

      // ボディを引き落とし（ペールボディは10ロール = 3,700枚の換算）
      currentPailBody -= requiredBody;

      // 底・蓋を共通プールから引き落とし
      const bottomLidPoolAfter = bottomLidPoolBefore - requiredBottomLid;

      // 処理後の在庫を計算
      if (bottomLidPoolAfter >= 0) {
        // 足りている場合：残りを各在庫に分配
        const totalRollPieces = currentPailRolls * PAIL_ROLL_CONFIG.piecesPerRoll;

        if (totalRollPieces >= requiredBottomLid) {
          // ロールだけで足りる
          const remainingRollPieces = totalRollPieces - requiredBottomLid;
          currentPailRolls = Math.floor(remainingRollPieces / PAIL_ROLL_CONFIG.piecesPerRoll);
          const extraPieces = remainingRollPieces % PAIL_ROLL_CONFIG.piecesPerRoll;
          currentPailLid += extraPieces;
        } else {
          // ロールを全部使い、残りをカット済みから消費
          currentPailRolls = 0;
          const stillNeeded = requiredBottomLid - totalRollPieces;

          // 底から優先的に消費
          if (currentPailBottom >= stillNeeded) {
            currentPailBottom -= stillNeeded;
          } else {
            const remaining = stillNeeded - currentPailBottom;
            currentPailBottom = 0;
            currentPailLid -= remaining;
          }
        }
      } else {
        // 足りない場合：全て使い切り、不足分をマイナスで表現
        currentPailRolls = 0;
        currentPailBottom = 0;
        currentPailLid = bottomLidPoolAfter;
      }

      // 処理後の在庫を記録
      const bottomLidPoolAfterCalculated = currentPailBottom + currentPailLid + (currentPailRolls * PAIL_ROLL_CONFIG.piecesPerRoll);

      const afterInventory = {
        body: currentPailBody,
        bottom: currentPailBottom,
        lid: currentPailLid,
        rolls: currentPailRolls,
        bottomLidPool: bottomLidPoolAfterCalculated,
      };

      // ステータス判定
      const isBodySufficient = currentPailBody >= 0;
      const isBottomLidSufficient = bottomLidPoolAfterCalculated >= 0;
      const isAllSufficient = isBodySufficient && isBottomLidSufficient;

      // 不足数を計算
      const bodyShortage = currentPailBody < 0 ? Math.abs(currentPailBody) : 0;
      const bottomLidShortage = bottomLidPoolAfterCalculated < 0 ? Math.abs(bottomLidPoolAfterCalculated) : 0;

      // スナップショットを作成
      snapshots.push({
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
      });

    } else {
      // ===== 既存製品の処理 =====

      // 底・蓋用の共通プール（枚数）を計算
      const bottomLidPoolBefore = currentBottom + currentLid + (currentRolls * config.piecesPerRoll);

      // 必要数を計算
      const requiredBody = order.setQuantity;
      const requiredBottomLid = order.setQuantity + order.setQuantity + order.additionalLids;

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
      const bottomLidPoolAfter = bottomLidPoolBefore - requiredBottomLid;

      // 処理後の在庫を計算
      if (bottomLidPoolAfter >= 0) {
        // 足りている場合：残りを各在庫に分配
        const totalRollPieces = currentRolls * config.piecesPerRoll;

        if (totalRollPieces >= requiredBottomLid) {
          // ロールだけで足りる
          const remainingRollPieces = totalRollPieces - requiredBottomLid;
          currentRolls = Math.floor(remainingRollPieces / config.piecesPerRoll);
          const extraPieces = remainingRollPieces % config.piecesPerRoll;
          currentLid += extraPieces;
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
        currentLid = bottomLidPoolAfter;
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
      snapshots.push({
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
      });
    }
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
