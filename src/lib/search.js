import { db } from "$lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

/**
 * @typedef {Object} SearchTarget
 * @property {string} collectionName
 * @property {'event' | 'org'} type
 * @property {string} routeBase
 * @property {(data: Record<string, any>, id: string) => Array<unknown>} labels
 */

/**
 * @typedef {Object} SearchCandidate
 * @property {number} score
 * @property {string} path
 * @property {'event' | 'org'} type
 * @property {string} id
 * @property {string} label
 */

/** @param {unknown} value */
function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {string} label
 * @param {string} term
 */
function getMatchScore(label, term) {
  if (!label || !term) return 0;

  if (label === term) return 120;
  if (label.startsWith(term)) return 90;
  if (label.includes(term)) return 70;

  const labelTokens = label.split(/\s+/);
  if (labelTokens.includes(term)) return 60;

  return 0;
}

/**
 * @param {'all' | 'events' | 'orgs'} scope
 * @returns {SearchTarget[]}
 */
function getSearchTargets(scope) {
  if (scope === "events") {
    return [
      {
        collectionName: "events",
        type: "event",
        routeBase: "/events",
        labels: (data, id) => [data?.TITLE, data?.title, id],
      },
    ];
  }

  if (scope === "orgs") {
    return [
      {
        collectionName: "orgs",
        type: "org",
        routeBase: "/organizations",
        labels: (data, id) => [data?.orgName, data?.name, id],
      },
    ];
  }

  return [
    {
      collectionName: "events",
      type: "event",
      routeBase: "/events",
      labels: (data, id) => [data?.TITLE, data?.title, id],
    },
    {
      collectionName: "orgs",
      type: "org",
      routeBase: "/organizations",
      labels: (data, id) => [data?.orgName, data?.name, id],
    },
  ];
}

/**
 * Search Firestore by user input and return the best destination route.
 *
 * @param {string} rawInput
 * @param {{ scope?: 'all' | 'events' | 'orgs', maxDocs?: number }} [options]
 * @returns {Promise<{ found: boolean, path?: string, type?: 'event' | 'org', id?: string, label?: string, error?: unknown }>}
 */
export async function findBestSearchMatch(rawInput, options = {}) {
  const input = String(rawInput || "").trim();
  const term = normalize(input);

  if (!term) {
    return { found: false };
  }

  /** @type {'all' | 'events' | 'orgs'} */
  const scope = options.scope || "all";
  const maxDocs = Number(options.maxDocs || 250);
  const targets = getSearchTargets(scope);

  /** @type {SearchCandidate | null} */
  let bestMatch = null;

  try {
    for (const target of targets) {
      const snap = await getDocs(
        query(collection(db, target.collectionName), limit(maxDocs)),
      );

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const labels = target
          .labels(data, docSnap.id)
          .map((label) => normalize(label))
          .filter(Boolean);

        let topScore = 0;
        for (const label of labels) {
          const score = getMatchScore(label, term);
          if (score > topScore) {
            topScore = score;
          }
        }

        if (!topScore) continue;

        if (!bestMatch || topScore > bestMatch.score) {
          bestMatch = {
            score: topScore,
            path: `${target.routeBase}/${docSnap.id}`,
            type: target.type,
            id: docSnap.id,
            label:
              data?.TITLE ||
              data?.title ||
              data?.orgName ||
              data?.name ||
              docSnap.id,
          };
        }
      }
    }

    if (!bestMatch) {
      return { found: false };
    }

    return {
      found: true,
      path: bestMatch.path,
      type: bestMatch.type,
      id: bestMatch.id,
      label: bestMatch.label,
    };
  } catch (error) {
    console.error("Search query failed:", error);
    return { found: false, error };
  }
}
