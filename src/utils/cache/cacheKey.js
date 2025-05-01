const { isPlainObject, flatMap } = require("lodash");

function serializeFilter(filter = {}) {
  return Object.entries(filter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=[${value.sort().join(",")}]`; // normalize order
      }
      if (isPlainObject(value)) {
        return `${key}=${flatMap(value)}`;
      }
      return `${key}=${value}`;
    })
    .join("::");
}
const cacheKey = {
  reports: (filter = {}) => `reports::${serializeFilter(filter)}`,
  reportById: (id) => `report::${id}`,
};

module.exports = cacheKey;
