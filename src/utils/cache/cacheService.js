const NodeCache = require("node-cache");
const cache = new NodeCache({
  stdTTL: 5 * 60, // 5 minutes
  checkperiod: 60, // Check every 60 seconds
});

function setCache(key, value, ttl = 5 * 60) {
  const stringValue = JSON.stringify(value);
  cache.set(key, stringValue, ttl);
}

function getCache(key) {
  const raw = cache.get(key); //in json format
  return raw ? JSON.parse(raw) : null;
}

function delCache(key) {
  console.log("caches before delete");
  cache.del(key);
}

function hasCache(key) {
  return cache.has(key);
}

function flushAllCache() {
  cache.flushAll();
}
function getKeysCache() {
  return cache.keys();
}
//used to delete all caches with a specific prefix
//like reports::
function delCacheByPrefix(prefix) {
  const keys = getKeysCache().filter((key) => key.startsWith(prefix));
  const result = cache.del(keys);
  console.log(`Deleted count: ${result}`);
  return result;
}

/*
 * @param {string} key - The cache key to check or set.
 * @param {function} fetchFn - The function to fetch data if the key is not in cache.
 * @param {number} [ttl=5 * 60] - The time-to-live for the cache in seconds.
 * @returns {any} - The cached data or the fetched data.
 */
async function getOrSetCache(key, fetchFn, ttl = 5 * 60) {
  if (hasCache(key)) {
    console.log("From cache...");
    // console.log("data cached:", getCache(key));
    return getCache(key);
  }

  console.log("Fetching DB...");
  const data = await fetchFn();
  // console.log("fetched data", data);
  setCache(key, data, ttl);
  return data;
}

module.exports = {
  setCache,
  getCache,
  delCache,
  hasCache,
  flushAllCache,
  getKeysCache,
  getOrSetCache,
  delCacheByPrefix,
};
