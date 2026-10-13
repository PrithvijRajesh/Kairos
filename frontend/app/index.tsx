// Entry — skip goals; go straight to training.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/dashboard" />;
}
