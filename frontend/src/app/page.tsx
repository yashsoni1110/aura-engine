import { redirect } from 'next/navigation';

// Root now goes to login
export default function Home() {
  redirect('/login');
}
