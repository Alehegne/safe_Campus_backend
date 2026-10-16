# Geospatial benchmark for nearby incident queries

This benchmark measures the real geospatial query used by the campus safety incident feature without touching production data. The script creates an isolated MongoDB instance, seeds synthetic GeoJSON incident data, verifies the required `2dsphere` index, runs the same `$near` pattern used by the app, and records the results in a JSON artifact under `benchmark-results/`.

## Why this benchmark is valid

The application query is effectively:

```js
{
  reportedAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [referenceLongitude, referenceLatitude],
      },
      $maxDistance: 1000,
    },
  },
}
```

This is a MongoDB geospatial query that requires a `2dsphere` index. The benchmark therefore uses the exact query contract from the application and records the fact that MongoDB rejects the query without the index instead of inventing a synthetic unindexed number.

## Safe execution rules

- No production or external database is used by default.
- If a custom URI is supplied, it must be localhost-only and not production-like.
- The script only deletes benchmark-owned documents from the benchmark collection.
- Benchmark files are ignored by Git via the repository config.

## Commands

From the repository root:

```bash
npm run benchmark:geospatial
```

Optional overrides:

```bash
node scripts/benchmark-geospatial.js --dataset 2000 --warmup 10 --repetitions 50
SAFE_CAMPUS_BENCH_DATASET_SIZE=2000 SAFE_CAMPUS_BENCH_REPETITIONS=50 node scripts/benchmark-geospatial.js
```

## Measured result

Latest verified run for the default configuration (`dataset=1000`, `warmup=10`, `repetitions=100`):

- Indexed mode: p50 = 7.139 ms, p95 = 9.458 ms
- Matched records: 662
- Repetitions: 100
- Index present: true
- Explain stats: supported
- Unindexed mode: rejected by MongoDB, as expected for geospatial `$near` queries without a `2dsphere` index

## Interpretation

This is a valid local performance measurement for the project’s actual geospatial lookup pattern. The important engineering takeaway is not that the number itself is universal, but that the app is operating within a supported MongoDB index contract and that the query remains fast enough for a campus incident radius lookup at this scale.

## Artifact location

The raw JSON benchmark output is stored in `benchmark-results/`, and the latest run is:

- `benchmark-results/geospatial-benchmark-2026-10-16T11-59-13-266Z-1000.json`
