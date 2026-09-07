import Website from '@/components/website';
import { notFound } from 'next/navigation';
import about from '@/content/about.json';
import mudra from '@/content/mudra.json';
import chakra from '@/content/chakra.json';
import element from '@/content/element.json';
import dining from '@/content/dining.json';
import spa from '@/content/spa.json';
import retreats from '@/content/retreats.json';
import contact from '@/content/contact.json';
const pages = {about,mudra,chakra,element,dining,spa,retreats,contact};
export function generateStaticParams(){return Object.keys(pages).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const page=pages[slug as keyof typeof pages];return {title:page?`${page.title} | Light of Landour`:'Page Not Found | Light of Landour',description:page?`${page.title}. Discover Light of Landour in the Himalayas, Landour, Mussoorie.`:undefined};}
export default async function SanctuaryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const page=pages[slug as keyof typeof pages];if(!page)notFound();return <Website page={page}/>;}
