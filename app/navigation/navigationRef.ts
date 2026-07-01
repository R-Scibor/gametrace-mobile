import { createNavigationContainerRef } from '@react-navigation/native';

// Shared ref so non-screen code (report context builder) can read the current
// route. Passed to <NavigationContainer ref={navigationRef}> in RootNavigator.
export const navigationRef = createNavigationContainerRef();
