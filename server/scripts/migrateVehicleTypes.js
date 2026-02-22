/**
 * Migration: Populate vehicle_type_id on Load and Payment documents
 *
 * - Reads all distinct vehicle_type strings from Load collection
 * - Upserts each into VehicleType collection
 * - Stamps vehicle_type_id onto matching Load and Payment documents
 *
 * Safe to run multiple times (idempotent).
 * Does NOT remove or modify any existing fields.
 *
 * Usage: node server/scripts/migrateVehicleTypes.js
 */

const mongoose = require("mongoose");
const path = require("path");
const dotenv =require("dotenv")
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const dBURL = process.env.MONGODB_URI;
const VehicleType = require("../models/VehicleType");
console.log(dBURL);

async function migrate() {
  const uri = dBURL;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const db = mongoose.connection.db;
  const loadsCol = db.collection("loads");
  const paymentsCol = db.collection("payments");

  // 1. Collect distinct vehicle_type strings from Load (ignore null/empty)
  const distinctTypes = await loadsCol.distinct("vehicle_type", {
    vehicle_type: { $exists: true, $nin: [null, ""] },
  });

  console.log(
    `Found ${distinctTypes.length} distinct vehicle_type(s) in Load:`,
    distinctTypes,
  );

  if (distinctTypes.length === 0) {
    console.log("\nNothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  // 2. Upsert each into VehicleType; track created vs existing
  let created = 0;
  let existing = 0;
  const typeMap = {}; // { "Truck" → ObjectId, ... }

  for (const name of distinctTypes) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    // findOneAndUpdate with upsert — won't duplicate, returns existing if present
    const doc = await VehicleType.findOneAndUpdate(
      { name: trimmed },
      { $setOnInsert: { name: trimmed, isAvailable: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    typeMap[name] = doc._id;

    // Detect if it was pre-existing: compare createdAt vs updatedAt
    const wasNew =
      doc.createdAt &&
      doc.updatedAt &&
      doc.createdAt.getTime() === doc.updatedAt.getTime();
    // More reliable: check if the doc was just created (within last 5s)
    const justCreated = Date.now() - doc.createdAt.getTime() < 5000;
    if (justCreated && wasNew) {
      created++;
      console.log(`  [CREATED] VehicleType "${trimmed}" → ${doc._id}`);
    } else {
      existing++;
      console.log(`  [EXISTS]  VehicleType "${trimmed}" → ${doc._id}`);
    }
  }

  console.log(
    `\nVehicleType upsert complete: ${created} created, ${existing} already existed.\n`,
  );

  // 3. Stamp vehicle_type_id on Load and Payment documents
  let totalLoadsUpdated = 0;
  let totalPaymentsUpdated = 0;

  for (const [vehicleTypeName, vehicleTypeId] of Object.entries(typeMap)) {
    const loadResult = await loadsCol.updateMany(
      { vehicle_type: vehicleTypeName },
      { $set: { vehicle_type_id: vehicleTypeId } },
    );
    totalLoadsUpdated += loadResult.modifiedCount;
    console.log(
      `  Load   "${vehicleTypeName}": ${loadResult.modifiedCount} updated (${loadResult.matchedCount} matched)`,
    );

    const paymentResult = await paymentsCol.updateMany(
      { vehicle_type: vehicleTypeName },
      { $set: { vehicle_type_id: vehicleTypeId } },
    );
    totalPaymentsUpdated += paymentResult.modifiedCount;
    console.log(
      `  Payment "${vehicleTypeName}": ${paymentResult.modifiedCount} updated (${paymentResult.matchedCount} matched)`,
    );
  }

  // 4. Summary
  console.log("\n========== Migration Summary ==========");
  console.log(`VehicleType docs created : ${created}`);
  console.log(`VehicleType docs existing: ${existing}`);
  console.log(`Load docs updated        : ${totalLoadsUpdated}`);
  console.log(`Payment docs updated     : ${totalPaymentsUpdated}`);
  console.log("=======================================\n");

  await mongoose.disconnect();
  console.log("Done. Disconnected from MongoDB.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
