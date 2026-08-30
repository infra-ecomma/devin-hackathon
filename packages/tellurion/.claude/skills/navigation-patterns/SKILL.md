---
name: navigation-patterns
description: "Mobile navigation patterns — tab bar vs drawer vs stack, deep linking, modal flows, gesture-based nav (iOS swipe-back, Android system back), per-platform conventions. React Navigation reference. Triggers on: mobile navigation, tab bar, drawer navigation, stack navigator, deep linking, React Navigation, iOS swipe back."
---

# Mobile Navigation Patterns

## Purpose

Navigation is the skeleton of a mobile app. Get it wrong and every screen, every deep link, and every auth redirect becomes a battle. This guide covers the recommended navigation architecture for each framework, with skeleton code you can copy and adapt.

---

## React Native: Expo Router (Recommended)

Expo Router uses file-based routing — the same mental model as Next.js. Files in `app/` become routes. This is the recommended approach for all new React Native projects.

### Why Expo Router Over React Navigation

| Criteria | Expo Router | React Navigation (imperative) |
|----------|-------------|------------------------------|
| Route definition | File system (automatic) | Manual `Stack.Screen` declarations |
| Deep linking | Automatic (file paths = URL paths) | Manual `linking` config |
| Type safety | TypeScript route types generated | Manual type declarations |
| Web support | Built-in (universal links) | Requires extra configuration |
| Learning curve | Low (if you know Next.js) | Medium |

Use React Navigation directly only if you have an existing React Navigation codebase and migration cost is too high.

### Navigation Skeleton

#### Root Layout — Provider Wrapper

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
```

#### Tab Navigator

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

#### Stack Navigation (within a tab or domain)

```
app/
  (tabs)/
    index.tsx                   # /
    search.tsx                  # /search
    profile.tsx                 # /profile
  orders/
    index.tsx                   # /orders (list)
    [id].tsx                    # /orders/123 (detail — dynamic segment)
    create.tsx                  # /orders/create
  modal/
    _layout.tsx                 # Modal presentation
    filter.tsx                  # /modal/filter
    share.tsx                   # /modal/share
```

Navigate programmatically:

```tsx
import { router } from "expo-router";

// Push to a route
router.push("/orders/123");

// Replace current screen
router.replace("/orders");

// Go back
router.back();

// Navigate to a modal
router.push("/modal/filter");
```

#### Auth-Gated Navigation

```tsx
// app/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
```

Alternatively, use redirect in individual screens:

```tsx
// app/(tabs)/index.tsx
import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HomeScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (/* ... */);
}
```

#### Deep Link Route Registration

Expo Router handles deep links automatically. Configure the scheme in `app.json`:

```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

Route mapping:
| Deep Link URL | Route File | Screen |
|--------------|-----------|--------|
| `myapp://` | `app/(tabs)/index.tsx` | Home tab |
| `myapp:///orders` | `app/orders/index.tsx` | Orders list |
| `myapp:///orders/123` | `app/orders/[id].tsx` | Order detail |
| `myapp:///profile` | `app/(tabs)/profile.tsx` | Profile tab |
| `https://myapp.com/orders/123` | `app/orders/[id].tsx` | Order detail (universal link) |

Test deep links:

```bash
# iOS Simulator
npx uri-scheme open myapp:///orders/123 --ios

# Android Emulator
npx uri-scheme open myapp:///orders/123 --android
```

#### Drawer Navigation (if needed)

```tsx
// app/(drawer)/_layout.tsx
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ title: "Home" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}
```

---

## Flutter: GoRouter (Recommended)

GoRouter provides declarative routing with redirect guards, path parameters, and deep link support. It is the recommended routing solution for Flutter.

### Why GoRouter Over Navigator 2.0

| Criteria | GoRouter | Navigator 2.0 (raw) |
|----------|----------|---------------------|
| Route definition | Declarative path config | Imperative `RouterDelegate` |
| Deep linking | Built-in path parsing | Manual URI parsing |
| Guards/redirects | `redirect` callback | Manual in `RouterDelegate` |
| Nested navigation | `ShellRoute` | Manual `Navigator` nesting |
| Complexity | Low | Very high |

### Navigation Skeleton

#### Router Configuration

```dart
// lib/routes/app_router.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/orders/order_list_screen.dart';
import '../screens/orders/order_detail_screen.dart';
import '../screens/profile/profile_screen.dart';
import 'route_names.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,

    // Auth redirect guard
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull?.isAuthenticated ?? false;
      final isOnAuth = state.matchedLocation.startsWith('/auth');

      if (!isLoggedIn && !isOnAuth) return '/auth/login';
      if (isLoggedIn && isOnAuth) return '/';
      return null; // no redirect
    },

    routes: [
      // Bottom navigation shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/',
              name: RouteNames.home,
              builder: (context, state) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/orders',
              name: RouteNames.orderList,
              builder: (context, state) => const OrderListScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  name: RouteNames.orderDetail,
                  builder: (context, state) {
                    final id = state.pathParameters['id']!;
                    return OrderDetailScreen(id: id);
                  },
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/profile',
              name: RouteNames.profile,
              builder: (context, state) => const ProfileScreen(),
            ),
          ]),
        ],
      ),

      // Auth routes (outside shell — no bottom nav)
      GoRoute(
        path: '/auth/login',
        name: RouteNames.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        name: RouteNames.register,
        builder: (context, state) => const RegisterScreen(),
      ),
    ],
  );
});
```

#### Route Names (Constants)

```dart
// lib/routes/route_names.dart
class RouteNames {
  static const home = 'home';
  static const orderList = 'order-list';
  static const orderDetail = 'order-detail';
  static const profile = 'profile';
  static const login = 'login';
  static const register = 'register';
}
```

#### Programmatic Navigation

```dart
// Push
context.push('/orders/123');

// Named route with parameters
context.pushNamed(RouteNames.orderDetail, pathParameters: {'id': '123'});

// Replace
context.go('/orders');

// Pop
context.pop();
```

#### Deep Link Configuration

Deep links work automatically with GoRouter paths. Configure the scheme:

**iOS** — `ios/Runner/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" />
</intent-filter>
```

---

## Native iOS: SwiftUI NavigationStack

### Navigation Skeleton

#### Route Enum

```swift
// Navigation/Route.swift
import Foundation

enum Route: Hashable {
    case home
    case orderList
    case orderDetail(id: String)
    case orderCreate
    case profile
    case settings
}
```

#### Router (NavigationPath-based)

```swift
// Navigation/AppRouter.swift
import SwiftUI

@Observable
class AppRouter {
    var path = NavigationPath()
    var selectedTab: Tab = .home

    enum Tab: Hashable {
        case home
        case orders
        case profile
    }

    func push(_ route: Route) {
        path.append(route)
    }

    func pop() {
        path.removeLast()
    }

    func popToRoot() {
        path.removeLast(path.count)
    }

    func reset() {
        path = NavigationPath()
        selectedTab = .home
    }
}
```

#### Root View with TabView

```swift
// ContentView.swift
import SwiftUI

struct ContentView: View {
    @State private var router = AppRouter()
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        Group {
            if auth.isAuthenticated {
                TabView(selection: $router.selectedTab) {
                    Tab("Home", systemImage: "house", value: .home) {
                        NavigationStack(path: $router.path) {
                            HomeView()
                                .navigationDestination(for: Route.self) { route in
                                    destinationView(for: route)
                                }
                        }
                    }

                    Tab("Orders", systemImage: "list.clipboard", value: .orders) {
                        NavigationStack(path: $router.path) {
                            OrderListView()
                                .navigationDestination(for: Route.self) { route in
                                    destinationView(for: route)
                                }
                        }
                    }

                    Tab("Profile", systemImage: "person", value: .profile) {
                        NavigationStack(path: $router.path) {
                            ProfileView()
                                .navigationDestination(for: Route.self) { route in
                                    destinationView(for: route)
                                }
                        }
                    }
                }
                .environment(router)
            } else {
                LoginView()
            }
        }
    }

    @ViewBuilder
    private func destinationView(for route: Route) -> some View {
        switch route {
        case .home:
            HomeView()
        case .orderList:
            OrderListView()
        case .orderDetail(let id):
            OrderDetailView(id: id)
        case .orderCreate:
            OrderCreateView()
        case .profile:
            ProfileView()
        case .settings:
            SettingsView()
        }
    }
}
```

#### Deep Link Handling

```swift
// Navigation/DeepLinkHandler.swift
import Foundation

struct DeepLinkHandler {
    static func route(from url: URL) -> Route? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else {
            return nil
        }

        let pathComponents = components.path
            .split(separator: "/")
            .map(String.init)

        switch pathComponents {
        case ["orders"]:
            return .orderList
        case ["orders", let id]:
            return .orderDetail(id: id)
        case ["profile"]:
            return .profile
        default:
            return .home
        }
    }
}

// In App struct:
// .onOpenURL { url in
//     if let route = DeepLinkHandler.route(from: url) {
//         router.push(route)
//     }
// }
```

#### NavigationSplitView (iPad/Large Screens)

```swift
// For iPad-optimized layouts
struct OrderSplitView: View {
    @State private var selectedOrder: String?

    var body: some View {
        NavigationSplitView {
            OrderListView(selectedOrder: $selectedOrder)
        } detail: {
            if let orderId = selectedOrder {
                OrderDetailView(id: orderId)
            } else {
                ContentUnavailableView("Select an Order",
                    systemImage: "list.clipboard",
                    description: Text("Choose an order from the sidebar"))
            }
        }
    }
}
```

---

## Native Android: Jetpack Navigation Compose

### Navigation Skeleton

#### Route Sealed Class (Type-Safe)

```kotlin
// ui/navigation/Route.kt
import kotlinx.serialization.Serializable

@Serializable
sealed class Route {
    @Serializable
    data object Home : Route()

    @Serializable
    data object OrderList : Route()

    @Serializable
    data class OrderDetail(val id: String) : Route()

    @Serializable
    data object OrderCreate : Route()

    @Serializable
    data object Profile : Route()

    @Serializable
    data object Settings : Route()

    @Serializable
    data object Login : Route()

    @Serializable
    data object Register : Route()
}
```

#### NavHost Configuration

```kotlin
// ui/navigation/AppNavHost.kt
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute

@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    isAuthenticated: Boolean
) {
    NavHost(
        navController = navController,
        startDestination = if (isAuthenticated) Route.Home else Route.Login
    ) {
        // Auth routes
        composable<Route.Login> {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Route.Home) {
                        popUpTo(Route.Login) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Route.Register)
                }
            )
        }

        composable<Route.Register> {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Route.Home) {
                        popUpTo(Route.Login) { inclusive = true }
                    }
                }
            )
        }

        // Main routes (with bottom nav)
        composable<Route.Home> {
            HomeScreen(
                onNavigateToOrderDetail = { id ->
                    navController.navigate(Route.OrderDetail(id))
                }
            )
        }

        composable<Route.OrderList> {
            OrderListScreen(
                onNavigateToDetail = { id ->
                    navController.navigate(Route.OrderDetail(id))
                },
                onNavigateToCreate = {
                    navController.navigate(Route.OrderCreate)
                }
            )
        }

        composable<Route.OrderDetail> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.OrderDetail>()
            OrderDetailScreen(
                id = route.id,
                onBack = { navController.popBackStack() }
            )
        }

        composable<Route.Profile> {
            ProfileScreen(
                onNavigateToSettings = {
                    navController.navigate(Route.Settings)
                }
            )
        }
    }
}
```

#### Bottom Navigation Bar

```kotlin
// ui/components/BottomNavBar.kt
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: Route
)

@Composable
fun BottomNavBar(navController: NavController) {
    val items = listOf(
        BottomNavItem("Home", Icons.Default.Home, Route.Home),
        BottomNavItem("Orders", Icons.Default.List, Route.OrderList),
        BottomNavItem("Profile", Icons.Default.Person, Route.Profile),
    )

    val currentEntry = navController.currentBackStackEntryAsState()

    NavigationBar {
        items.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
                selected = currentEntry.value?.destination?.route == item.route::class.qualifiedName,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.startDestinationId) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}
```

#### Deep Link Handling

```kotlin
// ui/navigation/DeepLinkHandler.kt
import android.content.Intent
import android.net.Uri

object DeepLinkHandler {
    fun parseRoute(intent: Intent): Route? {
        val uri = intent.data ?: return null
        return parseUri(uri)
    }

    fun parseUri(uri: Uri): Route? {
        val pathSegments = uri.pathSegments

        return when {
            pathSegments.isEmpty() -> Route.Home
            pathSegments[0] == "orders" && pathSegments.size == 1 -> Route.OrderList
            pathSegments[0] == "orders" && pathSegments.size == 2 -> Route.OrderDetail(pathSegments[1])
            pathSegments[0] == "profile" -> Route.Profile
            else -> Route.Home
        }
    }
}

// In AndroidManifest.xml:
// <intent-filter>
//     <action android:name="android.intent.action.VIEW" />
//     <category android:name="android.intent.category.DEFAULT" />
//     <category android:name="android.intent.category.BROWSABLE" />
//     <data android:scheme="myapp" android:host="app" />
// </intent-filter>
```

---

## Cross-Framework Navigation Patterns Summary

| Pattern | Expo Router | GoRouter | SwiftUI | Compose |
|---------|------------|----------|---------|---------|
| **Tab bar** | `<Tabs>` in `(tabs)/_layout.tsx` | `StatefulShellRoute` | `TabView` | `NavigationBar` + `NavHost` |
| **Stack push** | `router.push("/path")` | `context.push("/path")` | `router.push(.route)` | `navController.navigate(Route)` |
| **Modal** | `presentation: "modal"` in layout | `pageBuilder` with `MaterialPage` | `.sheet(isPresented:)` | `composable` with `AnimatedContent` |
| **Drawer** | `<Drawer>` layout | `Scaffold` with `Drawer` | `NavigationSplitView` | `ModalNavigationDrawer` |
| **Deep links** | Automatic from file paths | Path matching in `GoRouter` | `.onOpenURL` handler | `Intent` filter + `NavDeepLink` |
| **Auth guard** | Conditional `Stack.Screen` | `redirect` callback | Conditional view in `ContentView` | Conditional `startDestination` |
| **Go back** | `router.back()` | `context.pop()` | `dismiss()` or `router.pop()` | `navController.popBackStack()` |
| **Dynamic route** | `[id].tsx` file | `:id` path parameter | `Route.case(id:)` enum | `data class Route(val id:)` |

---

## Example Session

```
User: Design navigation for FleetCraft driver app (Expo Router)

App structure:
  (tabs) — bottom tab bar
    today.tsx — driver's active jobs (default)
    jobs.tsx — past + upcoming
    logs.tsx — HOS/ELD logs
    profile.tsx — driver settings
  (modal) — full-screen overlays
    job-detail/[id].tsx (presentation: modal)
    epod-capture/[id].tsx (presentation: modal)
  (auth) — pre-login stack
    login.tsx
    forgot-password.tsx

Deep links:
  fleetcraft://app/today
  fleetcraft://app/job/{id}
  Universal links from dispatcher SMS: fleetcraft.io/j/{shortcode} → resolves to /job/[id]

Auth guard:
  _layout.tsx checks token; if missing → redirect (auth)/login
  Token stored in SecureStore

Back behavior:
  Modal: swipe-down OR X button → router.back()
  Tab: no back stack (deep linking always pushes into a tab's stack)

Output: apps/driver/app/_layout.tsx + tab layouts + dev_docs/design/driver-nav.md
Chain → design-html, deep-linking
```
