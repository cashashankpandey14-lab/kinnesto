import { Redirect } from 'expo-router';
import { homeRouteFor, useAuth } from '@/lib/auth';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={homeRouteFor(user)} />;
}
