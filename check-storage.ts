import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkStorage() {
  const requiredBuckets = ['tours', 'avatars'];
  console.log('Checking required buckets:', requiredBuckets);
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
     console.error('Error listing buckets:', error.message);
     return;
  }
  
  for (const bucketName of requiredBuckets) {
    const exists = buckets.find(b => b.name === bucketName);
    if (!exists) {
      console.log(`Bucket "${bucketName}" is missing. Creating...`);
      await supabase.storage.createBucket(bucketName, { public: true });
    } else {
      console.log(`Bucket "${bucketName}" exists.`);
    }
  }
  console.log('Storage check complete.');
}

checkStorage();
