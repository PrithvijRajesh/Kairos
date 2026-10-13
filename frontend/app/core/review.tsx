// Removed — core no longer rates workouts.
import { Redirect } from 'expo-router';

export default function CoreReviewRemoved() {
  return <Redirect href="/core" />;
}
