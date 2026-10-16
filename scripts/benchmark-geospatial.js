#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { MongoClient } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");

const DEFAULTS = {
  datasetSize: 1000,
  warmupCount: 10,
  repetitions: 100,
  radiusMeters: 1000,
  referenceLatitude: 7.0595,
  referenceLongitude: 38.7628,
  seed: 8675309,
  timeWindowMs: 48 * 60 * 60 * 1000,
};

const OUTPUT_DIR = path.join(process.cwd(), "benchmark-results");
const VALID_DB_HOST_HINTS = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];

function parseArgs(argv) {
  const args = {
    datasetSize: parseInt(process.env.SAFE_CAMPUS_BENCH_DATASET_SIZE || "", 10) || DEFAULTS.datasetSize,
    warmupCount: parseInt(process.env.SAFE_CAMPUS_BENCH_WARMUP_COUNT || "", 10) || DEFAULTS.warmupCount,
    repetitions: parseInt(process.env.SAFE_CAMPUS_BENCH_REPETITIONS || "", 10) || DEFAULTS.repetitions,
    radiusMeters: parseInt(process.env.SAFE_CAMPUS_BENCH_RADIUS_METERS || "", 10) || DEFAULTS.radiusMeters,
    referenceLatitude: parseFloat(process.env.SAFE_CAMPUS_BENCH_REFERENCE_LAT || "") || DEFAULTS.referenceLatitude,
    referenceLongitude: parseFloat(process.env.SAFE_CAMPUS_BENCH_REFERENCE_LNG || "") || DEFAULTS.referenceLongitude,
    seed: parseInt(process.env.SAFE_CAMPUS_BENCH_SEED || "", 10) || DEFAULTS.seed,
    dbName: process.env.SAFE_CAMPUS_BENCH_DB_NAME || null,
    mongoUri: process.env.SAFE_CAMPUS_BENCH_MONGO_URI || process.env.MONGO_DB_URL || null,
    runId: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
  };

  for (const token of argv) {
    if (!token.startsWith("--")) continue;
    const [rawKey, rawValue] = token.split("=");
    const key = rawKey.replace(/^--/, "");
    if (!rawValue && !token.includes("=")) {
      continue;
    }

    switch (key) {
      case "dataset":
        args.datasetSize = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_DATASET_SIZE || DEFAULTS.datasetSize);
        break;
      case "warmup":
        args.warmupCount = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_WARMUP_COUNT || DEFAULTS.warmupCount);
        break;
      case "repetitions":
        args.repetitions = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_REPETITIONS || DEFAULTS.repetitions);
        break;
      case "radius":
        args.radiusMeters = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_RADIUS_METERS || DEFAULTS.radiusMeters);
        break;
      case "lat":
        args.referenceLatitude = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_REFERENCE_LAT || DEFAULTS.referenceLatitude);
        break;
      case "lng":
        args.referenceLongitude = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_REFERENCE_LNG || DEFAULTS.referenceLongitude);
        break;
      case "seed":
        args.seed = Number(rawValue || process.env.SAFE_CAMPUS_BENCH_SEED || DEFAULTS.seed);
        break;
      case "db-name":
        args.dbName = rawValue || null;
        break;
      case "mongo-uri":
        args.mongoUri = rawValue || null;
        break;
      default:
        break;
    }
  }

  if (!Number.isFinite(args.datasetSize) || args.datasetSize <= 0) {
    throw new Error("Dataset size must be a positive integer.");
  }
  if (!Number.isFinite(args.warmupCount) || args.warmupCount < 0) {
    throw new Error("Warm-up count must be >= 0.");
  }
  if (!Number.isFinite(args.repetitions) || args.repetitions <= 0) {
    throw new Error("Measured repetitions must be > 0.");
  }
  if (!Number.isFinite(args.radiusMeters) || args.radiusMeters <= 0) {
    throw new Error("Search radius must be a positive integer in meters.");
  }
  if (!Number.isFinite(args.referenceLatitude) || args.referenceLatitude < -90 || args.referenceLatitude > 90) {
    throw new Error("Reference latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(args.referenceLongitude) || args.referenceLongitude < -180 || args.referenceLongitude > 180) {
    throw new Error("Reference longitude must be between -180 and 180.");
  }

  return args;
}

function createRng(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createSyntheticIncident(index, rng, referenceLat, referenceLng, runId, now) {
  const insideRadiusProbability = 0.7;
  const roll = rng();
  const distanceMeters = roll < insideRadiusProbability
    ? rng() * 900 + 10
    : 1000 + rng() * 15000;
  const angleRadians = rng() * Math.PI * 2;

  const latDelta = (distanceMeters / 111_320) * Math.cos(angleRadians);
  const lngScale = 111_320 * Math.cos((referenceLat * Math.PI) / 180);
  const lngDelta = (distanceMeters / lngScale) * Math.sin(angleRadians);

  const latitude = clamp(referenceLat + latDelta, -89.9999, 89.9999);
  const longitude = clamp(referenceLng + lngDelta, -179.9999, 179.9999);

  const variationHours = 48 + rng() * 120;
  const reportedAt = new Date(now.getTime() - (variationHours * 60 * 60 * 1000));

  return {
    benchmarkRunId: runId,
    benchmarkDataset: "geospatial-incident-benchmark",
    description: `Synthetic benchmark incident ${index}`,
    tag: ["harassment", "theft", "vandalism", "assault", "other"][index % 5],
    status: index % 7 === 0 ? "resolved" : "pending",
    anonymous: index % 5 === 0,
    reporterId: new (require("mongodb").ObjectId)(),
    location: {
      type: "Point",
      coordinates: [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))],
    },
    reportedAt,
  };
}

function ensureOutputDirectory() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function safeFileNameSuffix(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * ratio) - 1));
  return sortedValues[index];
}

function summarizeLatencies(latenciesMs) {
  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const total = sorted.reduce((acc, value) => acc + value, 0);

  return {
    count: sorted.length,
    mean: sorted.length ? total / sorted.length : 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
    p50: sorted.length ? percentile(sorted, 0.50) : 0,
    p95: sorted.length ? percentile(sorted, 0.95) : 0,
  };
}

function getLocalUriNotification(uri) {
  const normalized = String(uri || "").toLowerCase();
  if (!normalized) return "No explicit URI configured; the script will use an isolated temporary MongoDB instance.";
  return `Using explicit URI: ${uri}`;
}

function confirmLocalBenchmarkTarget(uri) {
  if (!uri) return;
  const normalized = String(uri).toLowerCase();
  const isLocalHost = VALID_DB_HOST_HINTS.some((hint) => normalized.includes(hint));
  if (!isLocalHost) {
    throw new Error(
      "Refusing to benchmark against a non-local MongoDB target. Set SAFE_CAMPUS_BENCH_MONGO_URI to a localhost/127.0.0.1 address or leave it unset to use an isolated temporary MongoDB instance."
    );
  }
  if (/(prod|production|staging|live|cluster)/.test(normalized)) {
    throw new Error("Refusing to target a production-like database for the benchmark.");
  }
}

async function createTemporaryMongoConnection(config) {
  let mongoServer = null;
  let client = null;

  if (config.mongoUri) {
    confirmLocalBenchmarkTarget(config.mongoUri);
    client = new MongoClient(config.mongoUri, { maxPoolSize: 10 });
    await client.connect();
    return { client, mongoServer, db: client.db(config.dbName) };
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(config.dbName);
  return { client, mongoServer, db };
}

async function buildBenchmarkQuery(referenceLat, referenceLng, radiusMeters, timeWindowMs) {
  return {
    reportedAt: { $gte: new Date(Date.now() - timeWindowMs) },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [referenceLng, referenceLat],
        },
        $maxDistance: radiusMeters,
      },
    },
  };
}

async function verifyIndices(collection, expectedIndexName) {
  const info = await collection.indexInformation();
  const names = Object.keys(info);
  const hasExpected = names.includes(expectedIndexName) || names.includes("location_2dsphere");
  return {
    names,
    hasExpected,
    info,
  };
}

async function seedSyntheticCollection(collection, config, runId) {
  const rng = createRng(config.seed);
  const inserted = [];
  const now = new Date();

  for (let i = 0; i < config.datasetSize; i++) {
    inserted.push(createSyntheticIncident(i, rng, config.referenceLatitude, config.referenceLongitude, runId, now));
  }

  const result = await collection.insertMany(inserted, { ordered: false });
  const sampleDocs = await collection.find({ benchmarkRunId: runId }, { location: 1 }).limit(5).toArray();
  const valid = sampleDocs.every((doc) => {
    return doc && doc.location && doc.location.type === "Point" && Array.isArray(doc.location.coordinates) && doc.location.coordinates.length === 2 && Number.isFinite(doc.location.coordinates[0]) && Number.isFinite(doc.location.coordinates[1]);
  });

  if (!valid) {
    throw new Error("Synthetic benchmark data did not produce valid GeoJSON Point coordinates.");
  }

  return {
    insertedCount: result.insertedCount,
    sampleDocs,
  };
}

async function collectExplain(collection, query) {
  try {
    const plan = await collection.find(query).explain("executionStats");
    const stats = plan.executionStats || {};
    return {
      supported: true,
      executionTimeMillis: stats.executionTimeMillis,
      totalDocsExamined: stats.totalDocsExamined,
      totalKeysExamined: stats.totalKeysExamined,
      nReturned: stats.nReturned,
      winningPlan: plan.queryPlanner && plan.queryPlanner.winningPlan,
      executionStages: stats.executionStages,
    };
  } catch (error) {
    return {
      supported: false,
      error: error.message,
    };
  }
}

async function runBenchmarkMode(collection, config, mode) {
  const timeWindowQuery = await buildBenchmarkQuery(config.referenceLatitude, config.referenceLongitude, config.radiusMeters, config.timeWindowMs);
  const indexName = "location_2dsphere";

  if (mode === "indexed") {
    await collection.createIndex({ location: "2dsphere" }, { name: indexName });
  } else {
    try {
      await collection.dropIndex(indexName);
    } catch (error) {
      // Ignore if no index existed for this collection.
    }
  }

  const indexStatus = await verifyIndices(collection, indexName);
  if (mode === "indexed" && !indexStatus.hasExpected) {
    throw new Error(`Expected index ${indexName} to exist in indexed benchmark mode.`);
  }

  if (mode === "unindexed") {
    const probeError = await collection.find(timeWindowQuery).limit(1).toArray().then(() => null).catch((error) => error);
    if (probeError) {
      const unsupported = /unable to find index for \$geoNear query|requires a geospatial index/i.test(probeError.message || String(probeError));
      return {
        mode,
        supported: false,
        indexStatus,
        limitation: unsupported
          ? "MongoDB rejects the geospatial $near query without a 2dsphere index, so no unindexed latency result is fabricated."
          : `Query failed even in an isolated benchmark collection: ${probeError.message}`,
        warmupOperations: 0,
        repetitions: config.repetitions,
        measuredRepetitions: 0,
        matchedCount: 0,
        failedRuns: config.repetitions,
        summary: null,
        explain: {
          supported: false,
          error: probeError.message,
        },
        query: {
          collection: collection.collectionName,
          radiusMeters: config.radiusMeters,
          referenceLatitude: config.referenceLatitude,
          referenceLongitude: config.referenceLongitude,
          timeWindowMs: config.timeWindowMs,
        },
      };
    }
  }

  const warmupLatencies = [];
  for (let i = 0; i < config.warmupCount; i++) {
    const docs = await collection.find(timeWindowQuery).toArray();
    warmupLatencies.push(docs.length);
  }

  const measuredLatencies = [];
  let matchedCount = 0;
  let failedRuns = 0;

  for (let i = 0; i < config.repetitions; i++) {
    const start = process.hrtime.bigint();
    try {
      const docs = await collection.find(timeWindowQuery).toArray();
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      measuredLatencies.push(elapsedMs);
      matchedCount = docs.length;
    } catch (error) {
      failedRuns += 1;
      measuredLatencies.push(Number.NaN);
      console.error(`Benchmark run failed in ${mode} mode at repetition ${i}:`, error.message);
    }
  }

  const explainResult = await collectExplain(collection, timeWindowQuery);
  const summary = summarizeLatencies(measuredLatencies.filter((value) => Number.isFinite(value)));

  return {
    mode,
    supported: true,
    indexStatus,
    warmupOperations: warmupLatencies.length,
    repetitions: config.repetitions,
    measuredRepetitions: measuredLatencies.filter((value) => Number.isFinite(value)).length,
    matchedCount,
    failedRuns,
    summary,
    explain: explainResult,
    query: {
      collection: collection.collectionName,
      radiusMeters: config.radiusMeters,
      referenceLatitude: config.referenceLatitude,
      referenceLongitude: config.referenceLongitude,
      timeWindowMs: config.timeWindowMs,
      filter: {
        reportedAt: { $gte: "Date.now() - 48h" },
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [config.referenceLongitude, config.referenceLatitude] },
            $maxDistance: config.radiusMeters,
          },
        },
      },
    },
  };
}

async function run() {
  const config = parseArgs(process.argv.slice(2));
  const runId = config.runId;
  const dbName = config.dbName || `safe_campus_benchmark_${safeFileNameSuffix(config.seed)}_${safeFileNameSuffix(config.datasetSize)}_${safeFileNameSuffix(runId)}`;
  const collectionName = `benchmark_incidents_${safeFileNameSuffix(config.seed)}_${safeFileNameSuffix(config.datasetSize)}`;

  if (dbName.toLowerCase().includes("prod") || dbName.toLowerCase().includes("production")) {
    throw new Error("Refusing to use a production-like benchmark database name.");
  }

  ensureOutputDirectory();

  const connection = await createTemporaryMongoConnection({
    mongoUri: config.mongoUri,
    dbName,
  });

  const { client, mongoServer, db } = connection;
  const collection = db.collection(collectionName);

  const cleanup = async () => {
    try {
      await collection.deleteMany({ benchmarkRunId: runId });
      await collection.drop().catch(() => {});
    } catch (error) {
      console.warn("Benchmark cleanup warning:", error.message);
    }
  };

  const shutdown = async (signal) => {
    try {
      console.warn(`Received ${signal}; cleaning up benchmark data only.`);
      await cleanup();
    } finally {
      try {
        await client.close();
      } finally {
        if (mongoServer) {
          await mongoServer.stop();
        }
      }
      process.exit(signal === "SIGINT" ? 130 : 143);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await collection.createIndex({ benchmarkRunId: 1 });
    await seedSyntheticCollection(collection, config, runId);

    const indexed = await runBenchmarkMode(collection, config, "indexed");
    const unindexed = await runBenchmarkMode(collection, config, "unindexed");

    const adminDb = db.admin();
    const buildInfo = await adminDb.command({ buildInfo: 1 });
    const serverVersion = buildInfo.version || "unknown";
    const result = {
      benchmark: "safe-campus-geospatial-near-incidents",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      mongodbServerVersion: serverVersion,
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      datasetSize: config.datasetSize,
      seed: config.seed,
      benchmarkRunId: runId,
      databaseName: dbName,
      collectionName,
      databaseSource: config.mongoUri ? "explicit-local-mongo" : "mongodb-memory-server",
      config: {
        warmupCount: config.warmupCount,
        repetitions: config.repetitions,
        radiusMeters: config.radiusMeters,
        referenceLatitude: config.referenceLatitude,
        referenceLongitude: config.referenceLongitude,
        timeWindowMs: config.timeWindowMs,
        cacheState: "unknown",
      },
      query: {
        actualAppQuery: {
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [config.referenceLongitude, config.referenceLatitude],
              },
              $maxDistance: config.radiusMeters,
            },
          },
          reportedAt: { $gte: "Date.now() - 48h" },
        },
        coordinateOrder: "[longitude, latitude]",
        radiusUnits: "meters",
        filters: ["reportedAt >= now - 48h", "within 1000m radius"],
      },
      indexDefinitions: {
        indexed: { location: "2dsphere" },
        comparison: "drop the benchmark collection index only in an isolated benchmark database",
      },
      indexed, 
      unindexed,
      cleanup: {
        description: "Only benchmark-owned documents in the benchmark collection are deleted; no production database is touched.",
      },
    };

    const fileName = `geospatial-benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}-${safeFileNameSuffix(config.datasetSize)}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    console.log(`Benchmark result saved to ${filePath}`);
    const indexedSummary = indexed.summary ? `${indexed.summary.p50.toFixed(3)}ms / ${indexed.summary.p95.toFixed(3)}ms` : "unsupported";
    console.log(`Indexed mode: p50/p95=${indexedSummary}, matched=${indexed.matchedCount}, repetitions=${indexed.measuredRepetitions}`);

    if (unindexed.supported) {
      console.log(`Unindexed mode: p50=${unindexed.summary.p50.toFixed(3)}ms, p95=${unindexed.summary.p95.toFixed(3)}ms, matched=${unindexed.matchedCount}, repetitions=${unindexed.measuredRepetitions}`);
    } else {
      console.log(`Unindexed mode: unsupported. MongoDB rejected the geospatial $near query without a 2dsphere index: ${unindexed.limitation}`);
    }

    console.log(`Index present in indexed mode: ${indexed.indexStatus.hasExpected}`);
    console.log(`Explain stats supported: ${indexed.explain.supported ? "yes" : "no"}`);

    await cleanup();
    console.log("Benchmark cleanup completed for benchmark-owned records only.");
    await client.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(0);
  } catch (error) {
    console.error("Geospatial benchmark failed:", error.message);
    await cleanup().catch(() => {});
    try {
      await client.close();
    } catch (closeError) {
      console.warn("Error closing benchmark connection:", closeError.message);
    }
    if (mongoServer) {
      await mongoServer.stop().catch(() => {});
    }
    process.exit(1);
  }
}

run();
