import { AuditLog } from "@/pages/AuditDrawer";

export function getDiff(oldData, newData, path = '') {
  const changes = [];
  const oldObj = oldData ?? {};
  const newObj = newData ?? {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    const oldIsObj = isPlainObject(oldVal);
    const newIsObj = isPlainObject(newVal);
    const oldIsArr = Array.isArray(oldVal);
    const newIsArr = Array.isArray(newVal);

    if (oldIsObj && newIsObj) {
      changes.push(...getDiff(oldVal, newVal, currentPath));
    } else if (oldIsArr && newIsArr) {
      changes.push(...diffArrays(oldVal, newVal, currentPath));
    } else if (oldIsArr || newIsArr || oldIsObj || newIsObj) {
      // Type mismatch: array↔object, array↔null, object↔null
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          path: currentPath, oldValue: oldVal, newValue: newVal,
          changeType: oldVal === undefined ? 'ADDED' : newVal === undefined ? 'REMOVED' : 'MODIFIED',
        });
      }
    } else {
      const normalizedOld = normalize(oldVal);
      const normalizedNew = normalize(newVal);
      if (JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew)) {
        changes.push({
          path: currentPath, oldValue: normalizedOld, newValue: normalizedNew,
          changeType: oldVal === undefined ? 'ADDED' : newVal === undefined ? 'REMOVED' : 'MODIFIED',
        });
      }
    }
  }
  return changes;
}

function diffArrays(oldArr, newArr, path) {
  const changes = [];

  const getId = (item) => {
    if (!isPlainObject(item)) return null;
    if (item.id !== undefined) return String(item.id);
    if (item._id !== undefined) {
      if (isPlainObject(item._id) && item._id.$oid) return item._id.$oid; // MongoDB $oid
      return String(item._id);
    }
    return null;
  };

  const hasIds = [...oldArr, ...newArr].some((i) => getId(i) !== null);

  if (hasIds) {
    const oldMap = new Map(oldArr.map((i) => [getId(i), i]));
    const newMap = new Map(newArr.map((i) => [getId(i), i]));
    const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);

    for (const id of allIds) {
      const itemPath = `${path}[id=${id}]`;
      const oldItem = oldMap.get(id);
      const newItem = newMap.get(id);

      if (oldItem === undefined) {
        changes.push({ path: itemPath, changeType: 'ARRAY_ITEM_ADDED', oldValue: undefined, newValue: newItem, summary: `New item added to '${path}' with id='${id}'` });
      } else if (newItem === undefined) {
        changes.push({ path: itemPath, changeType: 'ARRAY_ITEM_REMOVED', oldValue: oldItem, newValue: undefined, summary: `Item removed from '${path}' with id='${id}'` });
      } else if (isPlainObject(oldItem) && isPlainObject(newItem)) {
        changes.push(...getDiff(oldItem, newItem, itemPath));
      } else if (JSON.stringify(normalize(oldItem)) !== JSON.stringify(normalize(newItem))) {
        changes.push({ path: itemPath, changeType: 'MODIFIED', oldValue: normalize(oldItem), newValue: normalize(newItem) });
      }
    }
  } else {
    // Guard: both empty → no change
    if (oldArr.length === 0 && newArr.length === 0) return changes;

    // Reorder detection for primitive arrays
    const sortFn = (a, b) => JSON.stringify(a) > JSON.stringify(b) ? 1 : -1;
    const sortedOld = [...oldArr].map(normalize).sort(sortFn);
    const sortedNew = [...newArr].map(normalize).sort(sortFn);

    if (oldArr.length === newArr.length && JSON.stringify(sortedOld) === JSON.stringify(sortedNew)) {
      changes.push({ path, changeType: 'ARRAY_REORDERED', oldValue: oldArr, newValue: newArr, summary: `Items in '${path}' were reordered` });
    } else {
      const maxLen = Math.max(oldArr.length, newArr.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${path}[${i}]`;
        const oldItem = oldArr[i];
        const newItem = newArr[i];
        if (i >= oldArr.length) {
          changes.push({ path: itemPath, changeType: 'ARRAY_ITEM_ADDED', oldValue: undefined, newValue: newItem, summary: `New item added to '${path}' at index ${i}` });
        } else if (i >= newArr.length) {
          changes.push({ path: itemPath, changeType: 'ARRAY_ITEM_REMOVED', oldValue: oldItem, newValue: undefined, summary: `Item removed from '${path}' at index ${i}` });
        } else if (isPlainObject(oldItem) && isPlainObject(newItem)) {
          changes.push(...getDiff(oldItem, newItem, itemPath));
        } else if (JSON.stringify(normalize(oldItem)) !== JSON.stringify(normalize(newItem))) {
          changes.push({ path: itemPath, changeType: 'MODIFIED', oldValue: normalize(oldItem), newValue: normalize(newItem) });
        }
      }
    }
  }
  return changes;
}

function normalize(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object' && !Array.isArray(val)) {
    if ('$oid' in val) return val.$oid;
    if ('$date' in val) return new Date(val.$date).toISOString();
  }
  return val;
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

// Keys tracked for requestPlan change detection
const TRACKED_KEYS = [
  'item', 'category', 'priority', 'measures',
  'resource', 'deliverable', 'timelineMonth',
  'status', 'targetDate', 'CS', 'dealCondition'
];

// Keys tracked for acceptedPlan change detection  
const ACCEPTED_PLAN_TRACKED_KEYS = [
  'item', 'category', 'priority', 'measures',
  'resource', 'deliverable', 'timelineMonth',
  'status', 'targetDate'
];

/**
 * Main entry point.
 * 
 * Logic:
 *  - finalAcceptance has any false  → diff planHistory[0].requestPlan
 *  - finalAcceptance both true      → diff acceptedPlan only
 */
export function analyzeEscapChanges(oldData, newData) {
  const results = [];
  const { founderAcceptance, investorAcceptance } = newData.finalAcceptance ?? {};
  const bothAccepted = founderAcceptance === true && investorAcceptance === true;
  console.log('Analyzing changes with finalAcceptance:', bothAccepted );
  if (bothAccepted) {
    // Both signed off → only watch acceptedPlan
    results.push(...diffAcceptedPlan(
      oldData.acceptedPlan ?? [],
      newData.acceptedPlan ?? []
    ));
  } else {
    // Still in negotiation → watch latest requestPlan
    const oldRequestPlan = (oldData.planHistory ?? [])[0]?.requestPlan ?? [];
    const newRequestPlan = (newData.planHistory ?? [])[0]?.requestPlan ?? [];
    results.push(...diffRequestPlan(oldRequestPlan, newRequestPlan));
  }

  return results;
}

/**
 * Diffs two requestPlan arrays.
 * - New id found     → NEW_ITEM_ADDED   (item name only)
 * - Id gone          → ITEM_REMOVED
 * - Same id, changed → ITEM_MODIFIED    (which keys + old/new values)
 */
function diffRequestPlan(oldPlan, newPlan) {
  const results = [];
  const oldMap = new Map(oldPlan.map((i) => [i.id, i]));
  const newMap = new Map(newPlan.map((i) => [i.id, i]));

  // Added
  for (const [id, newItem] of newMap) {
    if (!oldMap.has(id)) {
      results.push({
        type: 'NEW_ITEM_ADDED',
        message: `New item "${newItem?.['item']}" has been added to the plan`,
        item: newItem?.['item'],
        id,
      });
    }
  }

  // Removed
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      results.push({
        type: 'ITEM_REMOVED',
        message: `Item "${oldItem?.['item']}" has been removed from the plan`,
        item: oldItem?.['item'],
        id,
      });
    }
  }

  // Modified
  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id);
    if (!oldItem) continue;

    const changedFields = [];
    for (const key of TRACKED_KEYS) {
      if (JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key])) {
        changedFields.push({ key, oldValue: oldItem[key], newValue: newItem[key] });
      }
    }

    if (changedFields.length > 0) {
      const fieldSummary = changedFields
        .map((f) => `${f.key}: "${f.oldValue}" → "${f.newValue}"`)
        .join(', ');

      results.push({
        type: 'ITEM_MODIFIED',
        message: `Item "${newItem?.['item']}" has changes — ${fieldSummary}`,
        item: newItem?.['item'],
        id,
        changedFields,  // full detail for UI rendering
      });
    }
  }

  return results;
}

/**
 * Same diffing logic for acceptedPlan (used when both accepted)
 */
function diffAcceptedPlan(oldPlan, newPlan) {
  const results = [];
  const oldMap = new Map(oldPlan.map((i) => [i.id, i]));
  const newMap = new Map(newPlan.map((i) => [i.id, i]));

  for (const [id, newItem] of newMap) {
    if (!oldMap.has(id)) {
      results.push({
        type: 'ACCEPTED_ITEM_ADDED',
        message: `New item "${newItem?.['item']}" has been added to the accepted plan`,
        item: newItem?.['item'],
        id,
      });
    }
  }

  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      results.push({
        type: 'ACCEPTED_ITEM_REMOVED',
        message: `Item "${oldItem?.['item']}" has been removed from the accepted plan`,
        item: oldItem?.['item'],
        id,
      });
    }
  }

  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id);
    if (!oldItem) continue;

    const changedFields = [];
    for (const key of ACCEPTED_PLAN_TRACKED_KEYS) {
      if (JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key])) {
        changedFields.push({ key, oldValue: oldItem[key], newValue: newItem[key] });
      }
    }

    if (changedFields.length > 0) {
      const fieldSummary = changedFields
        .map((f) => `${f.key}: "${f.oldValue}" → "${f.newValue}"`)
        .join(', ');

      results.push({
        type: 'ACCEPTED_ITEM_MODIFIED',
        message: `Accepted item "${newItem?.['item']}" has changes — ${fieldSummary}`,
        item: newItem?.['item'],
        id,
        changedFields,
      });
    }
  }

  return results;
}