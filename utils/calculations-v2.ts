import {
  Order,
  Inventory,
  InventorySnapshot,
  InventorySummary,
  RollConversionConfig,
  getTotalInventory,
  getLocalInventory,
  AllocationStatus,
} from '@/types';
import { compareDates } from './dateUtils';
import { DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG } from './constants';

/**
 * 2段階在庫引当ロジックを実装した新しい計算関数
 *
 * Waterfall方式：
 * 1. 拠点在庫（事務所+杉崎）から優先的に引当
 * 2. 不足分はメーカー在庫から引当
 * 3. さらに不足する場合は生産必要とマーク
 */
export function calculateInventorySnapshotsV2(
  orders: Order[],
  currentInventory: Inventory,
  config: RollConversionConfig = DEFAULT_ROLL_CONFIG
): InventorySnapshot[] {
  // 1. 受注を納期順にソート
  const sortedOrders = [...orders].sort((a, b) => {
    const dateCompare = compareDates(a.deliveryDate, b.deliveryDate);
    if (dateCompare !== 0) return dateCompare;
    return compareDates(a.createdAt, b.createdAt);
  });

  // 2. 初期在庫をセット
  const localInventory = getLocalInventory(currentInventory);
  const manufacturerInventory = currentInventory.manufacturer;

  // 拠点在庫（事務所+杉崎）
  let localBody = localInventory.body;
  let localBottom = localInventory.bottom;
  let localLid = localInventory.lid;
  let localRolls = localInventory.rolls;
  let localPailBody = localInventory.pailBody;
  let localPailBottom = localInventory.pailBottom;
  let localPailLid = localInventory.pailLid;
  let localPailRolls = localInventory.pailRolls;

  // メーカー在庫
  let mfrBody = manufacturerInventory.body;
  let mfrBottom = manufacturerInventory.bottom;
  let mfrLid = manufacturerInventory.lid;
  let mfrRolls = manufacturerInventory.rolls;
  let mfrPailBody = manufacturerInventory.pailBody;
  let mfrPailBottom = manufacturerInventory.pailBottom;
  let mfrPailLid = manufacturerInventory.pailLid;
  let mfrPailRolls = manufacturerInventory.pailRolls;

  const snapshots: InventorySnapshot[] = [];

  // 3. 各受注を処理
  for (const order of sortedOrders) {
    const isPail = order.productType === 'pail';
    const rollConfig = isPail ? PAIL_ROLL_CONFIG : config;

    // 必要数を計算
    const requiredBody = order.setQuantity;
    const requiredBottomLid = order.setQuantity + order.setQuantity + order.additionalLids;

    // 処理前の在庫（全体）
    const totalBodyBefore = isPail
      ? localPailBody + mfrPailBody
      : localBody + mfrBody;
    const totalBottomBefore = isPail
      ? localPailBottom + mfrPailBottom
      : localBottom + mfrBottom;
    const totalLidBefore = isPail
      ? localPailLid + mfrPailLid
      : localLid + mfrLid;
    const totalRollsBefore = isPail
      ? localPailRolls + mfrPailRolls
      : localRolls + mfrRolls;
    const totalBottomLidPoolBefore =
      totalBottomBefore + totalLidBefore + totalRollsBefore * rollConfig.piecesPerRoll;

    // === ボディの引当 ===
    let bodyFromLocal = 0;
    let bodyFromMfr = 0;
    let bodyProductionNeeded = 0;

    const currentLocalBody = isPail ? localPailBody : localBody;
    const currentMfrBody = isPail ? mfrPailBody : mfrBody;

    if (currentLocalBody >= requiredBody) {
      // 拠点在庫で足りる
      bodyFromLocal = requiredBody;
      if (isPail) {
        localPailBody -= requiredBody;
      } else {
        localBody -= requiredBody;
      }
    } else {
      // 拠点在庫を全部使う
      bodyFromLocal = currentLocalBody;
      const remainingBody = requiredBody - currentLocalBody;

      if (currentMfrBody >= remainingBody) {
        // メーカー在庫で足りる
        bodyFromMfr = remainingBody;
        if (isPail) {
          localPailBody = 0;
          mfrPailBody -= remainingBody;
        } else {
          localBody = 0;
          mfrBody -= remainingBody;
        }
      } else {
        // メーカー在庫も不足
        bodyFromMfr = currentMfrBody;
        bodyProductionNeeded = remainingBody - currentMfrBody;
        if (isPail) {
          localPailBody = 0;
          mfrPailBody = 0;
        } else {
          localBody = 0;
          mfrBody = 0;
        }
      }
    }

    // === 底・蓋の引当 ===
    let bottomLidFromLocal = 0;
    let bottomLidFromMfr = 0;
    let bottomLidProductionNeeded = 0;

    // 拠点在庫の底・蓋プール
    const localBottomLidPool = isPail
      ? localPailBottom + localPailLid + localPailRolls * rollConfig.piecesPerRoll
      : localBottom + localLid + localRolls * rollConfig.piecesPerRoll;

    // メーカー在庫の底・蓋プール
    const mfrBottomLidPool = isPail
      ? mfrPailBottom + mfrPailLid + mfrPailRolls * rollConfig.piecesPerRoll
      : mfrBottom + mfrLid + mfrRolls * rollConfig.piecesPerRoll;

    if (localBottomLidPool >= requiredBottomLid) {
      // 拠点在庫で足りる
      bottomLidFromLocal = requiredBottomLid;
      // 拠点在庫から引き落とし
      allocateBottomLid(
        requiredBottomLid,
        isPail,
        true,
        rollConfig,
        { bottom: isPail ? localPailBottom : localBottom, lid: isPail ? localPailLid : localLid, rolls: isPail ? localPailRolls : localRolls }
      );
      if (isPail) {
        const result = allocateBottomLid(requiredBottomLid, isPail, true, rollConfig, { bottom: localPailBottom, lid: localPailLid, rolls: localPailRolls });
        localPailBottom = result.bottom;
        localPailLid = result.lid;
        localPailRolls = result.rolls;
      } else {
        const result = allocateBottomLid(requiredBottomLid, isPail, true, rollConfig, { bottom: localBottom, lid: localLid, rolls: localRolls });
        localBottom = result.bottom;
        localLid = result.lid;
        localRolls = result.rolls;
      }
    } else {
      // 拠点在庫を全部使う
      bottomLidFromLocal = localBottomLidPool;
      const remainingBottomLid = requiredBottomLid - localBottomLidPool;

      // 拠点在庫をゼロに
      if (isPail) {
        localPailBottom = 0;
        localPailLid = 0;
        localPailRolls = 0;
      } else {
        localBottom = 0;
        localLid = 0;
        localRolls = 0;
      }

      if (mfrBottomLidPool >= remainingBottomLid) {
        // メーカー在庫で足りる
        bottomLidFromMfr = remainingBottomLid;
        if (isPail) {
          const result = allocateBottomLid(remainingBottomLid, isPail, false, rollConfig, { bottom: mfrPailBottom, lid: mfrPailLid, rolls: mfrPailRolls });
          mfrPailBottom = result.bottom;
          mfrPailLid = result.lid;
          mfrPailRolls = result.rolls;
        } else {
          const result = allocateBottomLid(remainingBottomLid, isPail, false, rollConfig, { bottom: mfrBottom, lid: mfrLid, rolls: mfrRolls });
          mfrBottom = result.bottom;
          mfrLid = result.lid;
          mfrRolls = result.rolls;
        }
      } else {
        // メーカー在庫も不足
        bottomLidFromMfr = mfrBottomLidPool;
        bottomLidProductionNeeded = remainingBottomLid - mfrBottomLidPool;
        if (isPail) {
          mfrPailBottom = 0;
          mfrPailLid = 0;
          mfrPailRolls = 0;
        } else {
          mfrBottom = 0;
          mfrLid = 0;
          mfrRolls = 0;
        }
      }
    }

    // === 引当ステータスを決定 ===
    let allocationStatus: AllocationStatus;
    if (bodyProductionNeeded > 0 || bottomLidProductionNeeded > 0) {
      allocationStatus = 'production_needed';
    } else if (bodyFromMfr > 0 || bottomLidFromMfr > 0) {
      allocationStatus = 'manufacturer_pickup';
    } else {
      allocationStatus = 'local_ok';
    }

    // 処理後の在庫（全体）
    const totalBodyAfter = isPail
      ? localPailBody + mfrPailBody
      : localBody + mfrBody;
    const totalBottomAfter = isPail
      ? localPailBottom + mfrPailBottom
      : localBottom + mfrBottom;
    const totalLidAfter = isPail
      ? localPailLid + mfrPailLid
      : localLid + mfrLid;
    const totalRollsAfter = isPail
      ? localPailRolls + mfrPailRolls
      : localRolls + mfrRolls;
    const totalBottomLidPoolAfter =
      totalBottomAfter + totalLidAfter + totalRollsAfter * rollConfig.piecesPerRoll;

    // スナップショット作成
    const snapshot: InventorySnapshot = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate,
      setQuantity: order.setQuantity,
      additionalLids: order.additionalLids,
      beforeInventory: {
        body: totalBodyBefore,
        bottom: totalBottomBefore,
        lid: totalLidBefore,
        rolls: totalRollsBefore,
        bottomLidPool: totalBottomLidPoolBefore,
      },
      required: {
        body: requiredBody,
        bottomLid: requiredBottomLid,
      },
      afterInventory: {
        body: totalBodyAfter,
        bottom: totalBottomAfter,
        lid: totalLidAfter,
        rolls: totalRollsAfter,
        bottomLidPool: totalBottomLidPoolAfter,
      },
      isBodySufficient: totalBodyAfter >= 0,
      isBottomLidSufficient: totalBottomLidPoolAfter >= 0,
      isAllSufficient: totalBodyAfter >= 0 && totalBottomLidPoolAfter >= 0,
      bodyShortage: totalBodyAfter < 0 ? Math.abs(totalBodyAfter) : 0,
      bottomLidShortage: totalBottomLidPoolAfter < 0 ? Math.abs(totalBottomLidPoolAfter) : 0,
      allocationStatus,
      localInventoryUsed: {
        body: bodyFromLocal,
        bottomLid: bottomLidFromLocal,
      },
      manufacturerInventoryUsed: {
        body: bodyFromMfr,
        bottomLid: bottomLidFromMfr,
      },
      productionNeeded: {
        body: bodyProductionNeeded,
        bottomLid: bottomLidProductionNeeded,
      },
    };

    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * 底・蓋を在庫から引き落とすヘルパー関数
 */
function allocateBottomLid(
  required: number,
  isPail: boolean,
  isLocal: boolean,
  rollConfig: RollConversionConfig,
  inventory: { bottom: number; lid: number; rolls: number }
): { bottom: number; lid: number; rolls: number } {
  let { bottom, lid, rolls } = inventory;
  let remaining = required;

  // ロールから優先的に使用
  const rollPieces = rolls * rollConfig.piecesPerRoll;
  if (rollPieces >= remaining) {
    const usedPieces = remaining;
    const remainingPieces = rollPieces - usedPieces;
    rolls = Math.floor(remainingPieces / rollConfig.piecesPerRoll);
    const extraPieces = remainingPieces % rollConfig.piecesPerRoll;
    lid += extraPieces;
    return { bottom, lid, rolls };
  }

  // ロールを全部使う
  remaining -= rollPieces;
  rolls = 0;

  // 底から使う
  if (bottom >= remaining) {
    bottom -= remaining;
    return { bottom, lid, rolls };
  }

  // 底を全部使う
  remaining -= bottom;
  bottom = 0;

  // 蓋から使う
  lid -= remaining;

  return { bottom, lid, rolls };
}

/**
 * 在庫不足サマリーを取得
 */
export function getInventorySummary(
  snapshots: InventorySnapshot[]
): InventorySummary {
  const affectedOrders = snapshots.filter((s) => !s.isAllSufficient);
  const hasShortage = affectedOrders.length > 0;

  const totalBodyShortage = affectedOrders.reduce(
    (sum, s) => sum + s.bodyShortage,
    0
  );
  const totalBottomLidShortage = affectedOrders.reduce(
    (sum, s) => sum + s.bottomLidShortage,
    0
  );

  return {
    hasShortage,
    totalBodyShortage,
    totalBottomLidShortage,
    affectedOrders,
  };
}

/**
 * 月次発注レコメンデーションを計算
 * 翌月末までの受注に対し、拠点在庫（事務所+杉崎）の不足分を算出
 */
export interface MonthlyOrderRecommendation {
  targetPeriod: {
    start: string; // ISO8601 date
    end: string;   // ISO8601 date (翌月末)
  };
  totalRequired: {
    body: number;
    pailBody: number;
    bottomLid: number;
    pailBottomLid: number;
  };
  localInventory: {
    body: number;
    pailBody: number;
    bottomLid: number; // 底 + 蓋 + ロール換算枚数
    pailBottomLid: number;
  };
  shortage: {
    body: number;
    pailBody: number;
    bottomLid: number;
    pailBottomLid: number;
  };
  recommendedOrder: {
    // 既存製品
    bodySets: number;           // ボディ不足分（個数）
    bottomLidPieces: number;    // 底・蓋不足分（枚数）
    bottomLidRolls: number;     // 底・蓋不足分（ロール本数）
    estimatedSets: number;      // おおよそのセット数換算

    // ペール製品
    pailBodySets: number;
    pailBottomLidPieces: number;
    pailBottomLidRolls: number;
    pailEstimatedSets: number;
  };
  affectedOrders: Order[];
}

export function calculateMonthlyOrderRecommendation(
  orders: Order[],
  currentInventory: Inventory,
  standardRollConfig: RollConversionConfig = DEFAULT_ROLL_CONFIG,
  pailRollConfig: RollConversionConfig = PAIL_ROLL_CONFIG
): MonthlyOrderRecommendation {
  // 今日の日付
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 翌月末の日付を計算
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  nextMonthEnd.setHours(23, 59, 59, 999);

  const targetStart = today.toISOString().split('T')[0];
  const targetEnd = nextMonthEnd.toISOString().split('T')[0];

  // 翌月末までの受注を抽出（activeのみ）
  const targetOrders = orders.filter((order) => {
    if (order.status !== 'active') return false;
    const deliveryDate = new Date(order.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate >= today && deliveryDate <= nextMonthEnd;
  });

  // 合計必要量を計算（製品タイプ別）
  let totalBodyRequired = 0;
  let totalPailBodyRequired = 0;
  let totalBottomLidRequired = 0;
  let totalPailBottomLidRequired = 0;

  for (const order of targetOrders) {
    const isPail = order.productType === 'pail';
    const bodyRequired = order.setQuantity;
    const bottomLidRequired = order.setQuantity * 2 + order.additionalLids;

    if (isPail) {
      totalPailBodyRequired += bodyRequired;
      totalPailBottomLidRequired += bottomLidRequired;
    } else {
      totalBodyRequired += bodyRequired;
      totalBottomLidRequired += bottomLidRequired;
    }
  }

  // 拠点在庫（事務所+杉崎のみ）を取得
  const localInventory = getLocalInventory(currentInventory);

  // 拠点在庫の底・蓋プールを計算
  const localBottomLidPool =
    localInventory.bottom +
    localInventory.lid +
    localInventory.rolls * standardRollConfig.piecesPerRoll;

  const localPailBottomLidPool =
    localInventory.pailBottom +
    localInventory.pailLid +
    localInventory.pailRolls * pailRollConfig.piecesPerRoll;

  // 不足分を計算（マイナスの場合は0）
  const bodyShortage = Math.max(0, totalBodyRequired - localInventory.body);
  const pailBodyShortage = Math.max(0, totalPailBodyRequired - localInventory.pailBody);
  const bottomLidShortage = Math.max(0, totalBottomLidRequired - localBottomLidPool);
  const pailBottomLidShortage = Math.max(
    0,
    totalPailBottomLidRequired - localPailBottomLidPool
  );

  // 発注推奨量を各単位で計算
  const recommendedOrder = {
    // 既存製品
    bodySets: bodyShortage,
    bottomLidPieces: bottomLidShortage,
    bottomLidRolls: Math.ceil(bottomLidShortage / standardRollConfig.piecesPerRoll),
    estimatedSets: Math.ceil(
      Math.max(bodyShortage, bottomLidShortage / 2) // おおよそのセット数
    ),

    // ペール製品
    pailBodySets: pailBodyShortage,
    pailBottomLidPieces: pailBottomLidShortage,
    pailBottomLidRolls: Math.ceil(pailBottomLidShortage / pailRollConfig.piecesPerRoll),
    pailEstimatedSets: Math.ceil(
      Math.max(pailBodyShortage, pailBottomLidShortage / 2)
    ),
  };

  return {
    targetPeriod: {
      start: targetStart,
      end: targetEnd,
    },
    totalRequired: {
      body: totalBodyRequired,
      pailBody: totalPailBodyRequired,
      bottomLid: totalBottomLidRequired,
      pailBottomLid: totalPailBottomLidRequired,
    },
    localInventory: {
      body: localInventory.body,
      pailBody: localInventory.pailBody,
      bottomLid: localBottomLidPool,
      pailBottomLid: localPailBottomLidPool,
    },
    shortage: {
      body: bodyShortage,
      pailBody: pailBodyShortage,
      bottomLid: bottomLidShortage,
      pailBottomLid: pailBottomLidShortage,
    },
    recommendedOrder,
    affectedOrders: targetOrders,
  };
}
