import Website from '@/components/website';
import data from '@/content/home.json';
export const metadata = { title: 'Light of Landour | Himalayan Sanctuary & Retreat', description: 'Light of Landour — your Himalayan home away from the heat and dust. Explore Mudra, Chakra and Element rooms, dining, wellness and curated stays.' };
export default function Home() { return <Website page={data} />; }
