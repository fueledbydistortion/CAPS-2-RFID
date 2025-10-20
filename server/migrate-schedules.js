const { db } = require("./config/firebase-admin-config");

// Migration script to add missing time range fields to existing schedules
const migrateSchedules = async () => {
  try {
    console.log("🔄 Starting schedule migration...");

    // Get all schedules
    const snapshot = await db.ref("schedules").once("value");

    if (!snapshot.exists()) {
      console.log("❌ No schedules found in database");
      return;
    }

    const schedules = [];
    snapshot.forEach((childSnapshot) => {
      schedules.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    console.log(`📊 Found ${schedules.length} schedules to migrate`);

    let migratedCount = 0;

    for (const schedule of schedules) {
      console.log(`\n🔍 Processing schedule: ${schedule.id}`);
      console.log(`   Day: ${schedule.day}`);
      console.log(`   Current timeIn: ${schedule.timeIn}`);
      console.log(`   Current timeOut: ${schedule.timeOut}`);

      // Check if schedule already has the new fields
      const hasNewFields =
        schedule.timeInStart !== undefined ||
        schedule.timeInEnd !== undefined ||
        schedule.timeOutStart !== undefined ||
        schedule.timeOutEnd !== undefined ||
        schedule.lateTimeIn !== undefined;

      if (hasNewFields) {
        console.log(`   ✅ Schedule already has new fields, skipping...`);
        continue;
      }

      // Create update data with new fields
      const updateData = {
        // Set the new range fields based on existing timeIn/timeOut
        timeInStart: schedule.timeIn || "",
        timeInEnd: "", // Empty by default
        timeOutStart: "", // Empty by default
        timeOutEnd: schedule.timeOut || "",
        lateTimeIn: "", // Empty by default
        updatedAt: Date.now(),
      };

      console.log(`   📝 Adding new fields:`, updateData);

      // Update the schedule
      await db.ref(`schedules/${schedule.id}`).update(updateData);

      migratedCount++;
      console.log(`   ✅ Successfully migrated schedule ${schedule.id}`);
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   📊 Total schedules: ${schedules.length}`);
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${schedules.length - migratedCount}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSchedules()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateSchedules };
