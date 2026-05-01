const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('tours').select('*').limit(1).single();
    if (error) {
        console.error(error);
        return;
    }
    console.log('Keys in tours table:', Object.keys(data));
    console.log('Sample data:', data);
}

check();
