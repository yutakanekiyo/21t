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
import { DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG, PAIL_BOTTOM_PIECES_PER_ROLL, PAIL_LID_PIECES_PER_ROLL } from './constants';

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

  // メーカー在庫（メーカーはボディとロールのみ。底・蓋のカット済み在庫は持たない）
  let mfrBody = manufacturerInventory.body;
  const mfrBottom = 0;
  const mfrLid = 0;
  let mfrRolls = manufacturerInventory.rolls;
  let mfrPailBody = manufacturerInventory.pailBody;
  const mfrPailBottom = 0;
  const mfrPailLid = 0;
  let mfrPailRolls = manufacturerInventory.pailRolls;

  const snapshots: InventorySnapshot[] = [];

  // 3. 各受注を処理
  for (const order of sortedOrders) {
    const isPail = order.productType === 'pail';
    const rollConfig = isPail ? PAIL_ROLL_CONFIG : config;

    // 必要数を計算
    const requiredBody = order.setQuantity;
    // 変更後: 底1枚/セット + 蓋トータル（setQuantity*2 から setQuantity へ）
    const requiredBottomLid = order.setQuantity + order.additionalLids;

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
    let bottomProductionNeeded = 0;
    let lidProductionNeeded = 0;

    if (isPail) {
      // ペール: 底と蓋で異なるロール歩留まり（655 vs 606）を使用した分割引当
      const reqBottom = order.setQuantity;
      const reqLid = order.additionalLids;

      // 拠点在庫から底を引当（pailBottom → pailRolls 655枚/本）
      let localInv = { bottom: localPailBottom, lid: localPailLid, rolls: localPailRolls };
      const localBottomResult = allocatePailBottom(reqBottom, localInv);
      localInv = localBottomResult.newInventory;

      // 拠点在庫から蓋を引当（pailLid → 残りpailRolls 606枚/本）
      const localLidResult = allocatePailLid(reqLid, localInv);
      localInv = localLidResult.newInventory;

      localPailBottom = localInv.bottom;
      localPailLid = localInv.lid;
      localPailRolls = localInv.rolls;
      bottomLidFromLocal = localBottomResult.allocated + localLidResult.allocated;

      const remainingBottom = reqBottom - localBottomResult.allocated;
      const remainingLid = reqLid - localLidResult.allocated;

      if (remainingBottom > 0 || remainingLid > 0) {
        // メーカー在庫から引当
        let mfrInv = { bottom: mfrPailBottom, lid: mfrPailLid, rolls: mfrPailRolls };
        const mfrBottomResult = allocatePailBottom(remainingBottom, mfrInv);
        mfrInv = mfrBottomResult.newInventory;
        const mfrLidResult = allocatePailLid(remainingLid, mfrInv);
        mfrInv = mfrLidResult.newInventory;

        mfrPailRolls = mfrInv.rolls;
        bottomLidFromMfr = mfrBottomResult.allocated + mfrLidResult.allocated;

        const prodBottom = remainingBottom - mfrBottomResult.allocated;
        const prodLid = remainingLid - mfrLidResult.allocated;
        bottomLidProductionNeeded = prodBottom + prodLid;
        bottomProductionNeeded = prodBottom;
        lidProductionNeeded = prodLid;
      }
    } else {
      // WIP: 分割方式（底・蓋を独立して引当、どちらも300枚/本）
      const reqBottom = order.setQuantity;
      const reqLid = order.additionalLids;

      // 拠点在庫から底を引当（bottom → rolls@300枚/本）
      let localInv = { bottom: localBottom, lid: localLid, rolls: localRolls };
      const localBottomResult = allocateWipBottom(reqBottom, localInv);
      localInv = localBottomResult.newInventory;

      // 拠点在庫から蓋を引当（lid → 残りrolls@300枚/本）
      const localLidResult = allocateWipLid(reqLid, localInv);
      localInv = localLidResult.newInventory;

      localBottom = localInv.bottom;
      localLid = localInv.lid;
      localRolls = localInv.rolls;
      bottomLidFromLocal = localBottomResult.allocated + localLidResult.allocated;

      const remainingBottom = reqBottom - localBottomResult.allocated;
      const remainingLid = reqLid - localLidResult.allocated;

      if (remainingBottom > 0 || remainingLid > 0) {
        // メーカー在庫から引当
        let mfrInv = { bottom: mfrBottom, lid: mfrLid, rolls: mfrRolls };
        const mfrBottomResult = allocateWipBottom(remainingBottom, mfrInv);
        mfrInv = mfrBottomResult.newInventory;
        const mfrLidResult = allocateWipLid(remainingLid, mfrInv);
        mfrInv = mfrLidResult.newInventory;

        mfrRolls = mfrInv.rolls;
        bottomLidFromMfr = mfrBottomResult.allocated + mfrLidResult.allocated;

        const prodBottom = remainingBottom - mfrBottomResult.allocated;
        const prodLid = remainingLid - mfrLidResult.allocated;
        bottomLidProductionNeeded = prodBottom + prodLid;
        bottomProductionNeeded = prodBottom;
        lidProductionNeeded = prodLid;
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
      isBodySufficient: bodyProductionNeeded === 0,
      isBottomLidSufficient: bottomLidProductionNeeded === 0,
      isAllSufficient: bodyProductionNeeded === 0 && bottomLidProductionNeeded === 0,
      bodyShortage: bodyProductionNeeded,
      bottomLidShortage: bottomLidProductionNeeded,
      bottomShortage: bottomProductionNeeded,
      lidShortage: lidProductionNeeded,
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
 * WIP用: 底・蓋をプール方式で在庫から引き落とすヘルパー関数（300枚/本）
 */
function allocateBottomLid(
  required: number,
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

interface PailAllocationResult {
  allocated: number;
  newInventory: { bottom: number; lid: number; rolls: number };
}

/**
 * ペール用: 底をpailBottom → pailRolls（655枚/本）の順で引当
 */
function allocatePailBottom(
  required: number,
  inventory: { bottom: number; lid: number; rolls: number }
): PailAllocationResult {
  let { bottom, lid, rolls } = { ...inventory };
  let remaining = required;

  // pailBottomから優先使用
  const fromDirect = Math.min(bottom, remaining);
  bottom -= fromDirect;
  remaining -= fromDirect;

  // pailRollsを655枚/本で使用（必要枚数だけ切り出す）
  if (remaining > 0) {
    const totalRollPieces = rolls * PAIL_BOTTOM_PIECES_PER_ROLL;
    const piecesFromRolls = Math.min(totalRollPieces, remaining);
    remaining -= piecesFromRolls;
    rolls = Math.floor((totalRollPieces - piecesFromRolls) / PAIL_BOTTOM_PIECES_PER_ROLL);
  }

  return { allocated: required - remaining, newInventory: { bottom, lid, rolls } };
}

/**
 * ペール用: 蓋をpailLid → 残りpailRolls（606枚/本）の順で引当
 */
function allocatePailLid(
  required: number,
  inventory: { bottom: number; lid: number; rolls: number }
): PailAllocationResult {
  let { bottom, lid, rolls } = { ...inventory };
  let remaining = required;

  // pailLidから優先使用
  const fromDirect = Math.min(lid, remaining);
  lid -= fromDirect;
  remaining -= fromDirect;

  // 残りpailRollsを606枚/本で使用（必要枚数だけ切り出す）
  if (remaining > 0) {
    const totalRollPieces = rolls * PAIL_LID_PIECES_PER_ROLL;
    const piecesFromRolls = Math.min(totalRollPieces, remaining);
    remaining -= piecesFromRolls;
    rolls = Math.floor((totalRollPieces - piecesFromRolls) / PAIL_LID_PIECES_PER_ROLL);
  }

  return { allocated: required - remaining, newInventory: { bottom, lid, rolls } };
}

/**
 * WIP用: 底をbottom → rolls（300枚/本）の順で引当
 */
function allocateWipBottom(
  required: number,
  inventory: { bottom: number; lid: number; rolls: number }
): PailAllocationResult {
  let { bottom, lid, rolls } = { ...inventory };
  let remaining = required;

  const fromDirect = Math.min(bottom, remaining);
  bottom -= fromDirect;
  remaining -= fromDirect;

  if (remaining > 0) {
    const totalRollPieces = rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;
    const piecesFromRolls = Math.min(totalRollPieces, remaining);
    remaining -= piecesFromRolls;
    rolls = Math.floor((totalRollPieces - piecesFromRolls) / DEFAULT_ROLL_CONFIG.piecesPerRoll);
  }

  return { allocated: required - remaining, newInventory: { bottom, lid, rolls } };
}

/**
 * WIP用: 蓋をlid → 残りrolls（300枚/本）の順で引当
 */
function allocateWipLid(
  required: number,
  inventory: { bottom: number; lid: number; rolls: number }
): PailAllocationResult {
  let { bottom, lid, rolls } = { ...inventory };
  let remaining = required;

  const fromDirect = Math.min(lid, remaining);
  lid -= fromDirect;
  remaining -= fromDirect;

  if (remaining > 0) {
    const totalRollPieces = rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;
    const piecesFromRolls = Math.min(totalRollPieces, remaining);
    remaining -= piecesFromRolls;
    rolls = Math.floor((totalRollPieces - piecesFromRolls) / DEFAULT_ROLL_CONFIG.piecesPerRoll);
  }

  return { allocated: required - remaining, newInventory: { bottom, lid, rolls } };
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
    // WIP製品
    bodySets: number;           // ボディ不足分（個数）
    bottomLidPieces: number;    // 底・蓋不足分（枚数）
    bottomLidRolls: number;     // 底・蓋不足分（ロール本数）
    bottomLidMeters: number;    // 底・蓋不足分（メートル数）
    estimatedSets: number;      // おおよそのセット数換算

    // ペール製品
    pailBodySets: number;
    pailBottomLidPieces: number;
    pailBottomLidRolls: number;
    pailBottomLidMeters: number; // ペール底・蓋不足分（メートル数）
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
    const bottomLidRequired = order.setQuantity + order.additionalLids;

    if (isPail) {
      totalPailBodyRequired += bodyRequired;
      totalPailBottomLidRequired += bottomLidRequired;
    } else {
      totalBodyRequired += bodyRequired;
      totalBottomLidRequired += bottomLidRequired;
    }
  }

  // 拠点在庫（事務所+杉崎のみ）を取得
  const baseLocalInventory = getLocalInventory(currentInventory);

  // 過去納期のアクティブ受注が消費する拠点在庫を先に差し引く
  // （ウォーターフォール引当と整合させるため）
  const allActiveSorted = [...orders]
    .filter((o) => o.status === 'active')
    .sort((a, b) => compareDates(a.deliveryDate, b.deliveryDate));

  let adjBody = baseLocalInventory.body;
  let adjBottom = baseLocalInventory.bottom;
  let adjLid = baseLocalInventory.lid;
  let adjRolls = baseLocalInventory.rolls;
  let adjPailBody = baseLocalInventory.pailBody;
  let adjPailBottom = baseLocalInventory.pailBottom;
  let adjPailLid = baseLocalInventory.pailLid;
  let adjPailRolls = baseLocalInventory.pailRolls;

  for (const order of allActiveSorted) {
    const deliveryDate = new Date(order.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    if (deliveryDate >= today) break;

    const isPail = order.productType === 'pail';
    if (isPail) {
      adjPailBody = Math.max(0, adjPailBody - order.setQuantity);
      let inv = { bottom: adjPailBottom, lid: adjPailLid, rolls: adjPailRolls };
      const br = allocatePailBottom(order.setQuantity, inv);
      inv = br.newInventory;
      const lr = allocatePailLid(order.additionalLids, inv);
      inv = lr.newInventory;
      adjPailBottom = inv.bottom;
      adjPailLid = inv.lid;
      adjPailRolls = inv.rolls;
    } else {
      adjBody = Math.max(0, adjBody - order.setQuantity);
      const pool = adjBottom + adjLid + adjRolls * standardRollConfig.piecesPerRoll;
      const needed = order.setQuantity + order.additionalLids;
      if (pool >= needed) {
        const result = allocateBottomLid(needed, standardRollConfig, { bottom: adjBottom, lid: adjLid, rolls: adjRolls });
        adjBottom = result.bottom;
        adjLid = result.lid;
        adjRolls = result.rolls;
      } else {
        adjBottom = 0;
        adjLid = 0;
        adjRolls = 0;
      }
    }
  }

  // 調整後の拠点在庫プールを計算
  const localBottomLidPool = adjBottom + adjLid + adjRolls * standardRollConfig.piecesPerRoll;
  const localPailBottomLidPool = adjPailBottom + adjPailLid + adjPailRolls * pailRollConfig.piecesPerRoll;

  // 不足分を計算（マイナスの場合は0）
  const bodyShortage = Math.max(0, totalBodyRequired - adjBody);
  const pailBodyShortage = Math.max(0, totalPailBodyRequired - adjPailBody);
  const bottomLidShortage = Math.max(0, totalBottomLidRequired - localBottomLidPool);
  const pailBottomLidShortage = Math.max(
    0,
    totalPailBottomLidRequired - localPailBottomLidPool
  );

  // 発注推奨量を各単位で計算
  const bottomLidRolls = Math.ceil(bottomLidShortage / standardRollConfig.piecesPerRoll);
  const pailBottomLidRolls = Math.ceil(pailBottomLidShortage / pailRollConfig.piecesPerRoll);

  const recommendedOrder = {
    // WIP製品
    bodySets: bodyShortage,
    bottomLidPieces: bottomLidShortage,
    bottomLidRolls,
    bottomLidMeters: bottomLidRolls * 200,
    estimatedSets: Math.ceil(
      Math.max(bodyShortage, bottomLidShortage / 2) // おおよそのセット数
    ),

    // ペール製品
    pailBodySets: pailBodyShortage,
    pailBottomLidPieces: pailBottomLidShortage,
    pailBottomLidRolls,
    pailBottomLidMeters: pailBottomLidRolls * 200,
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
      body: adjBody,
      pailBody: adjPailBody,
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
