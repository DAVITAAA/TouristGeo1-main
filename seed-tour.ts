import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedTour() {
  // Try to clean up the premium tour to avoid clutter
  await supabase.from('tours').delete().eq('title', 'Premium 7-Day Ultimate Georgian Experience');

  const regularTour = {
    title: "Kazbegi Day Trip & Gergeti Trinity",
    category: "Nature",
    location: "Kazbegi, Gudauri",
    duration: "1 Day",
    description: "Take a scenic drive along the Georgian Military Highway to the stunning Caucasus Mountains. We'll stop at the Zhinvali Reservoir, the Ananuri Fortress complex, and the Russia-Georgia Friendship Monument in Gudauri. The highlight of the trip is reaching the town of Stepantsminda, where we will switch to 4x4 vehicles to go up to the iconic 14th-century Gergeti Trinity Church, sitting at 2170 meters right under Mount Kazbek.",
    price: 35,
    max_group_size: 15,
    image: "https://storage.georgia.travel/images/gomi-mountain-gnta.webp",
    languages: ["English", "Russian"],
    itinerary: [
      {
        day: 1,
        title: "Tbilisi to Kazbegi & Return",
        description: "Depart from Tbilisi at 9:00 AM. Scenic stops along the Military Highway, visit Gergeti Trinity, and return to Tbilisi by 7:00 PM.",
        activities: ["Ananuri Fortress", "Gudauri Viewpoint", "Gergeti Trinity 4x4 Ride"],
        image: "https://storage.georgia.travel/images/gomi-mountain-gnta.webp"
      }
    ],
    status: "published"
  };

  try {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (profiles && profiles.length > 0) {
      // @ts-ignore
      regularTour.operator_id = profiles[0].id;
    }

    const { data, error } = await supabase.from('tours').insert([regularTour]).select();
    
    if (error) {
      console.error("Error inserting tour:", error);
    } else {
      console.log("Successfully inserted example tour:", data[0].title);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

seedTour();
