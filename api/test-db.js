// Test MongoDB connection
const { connectToDatabase } = require('./lib/db');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const db = await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully!');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    // Test write operation
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({
      test: true,
      timestamp: new Date()
    });
    console.log('✅ Write operation successful:', result.insertedId);
    
    // Test read operation
    const doc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Read operation successful:', doc);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');
    
    console.log('\n🎉 All MongoDB operations working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();