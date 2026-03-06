O Gemini disse
Switching to React Navigation is a pivot into the mobile-first (React Native) world. While it shares some concepts with web routers, its philosophy is Imperative and Stack-based rather than URL-based.

If you are doing this POC on the web, keep in mind that React Navigation is essentially "faking" a URL bar to match its internal state, whereas TanStack Router and Next.js are "URL-first."

Here is your plan to hit the same core topics in a React Navigation POC.

1. The "Configuration" Foundation
Unlike the file-system routing of the other two, React Navigation is code-based.

The Navigator: Set up a NavigationContainer and a NativeStack.Navigator.

The Tree: You manually define your screens in a component tree.

The Comparison: Notice the lack of "magic." If you want a new route, you must manually add a <Stack.Screen /> component.

2. Topic 6: Auth Guards (The "Conditional" Pattern)
React Navigation handles auth differently than beforeLoad or Middleware. You use Conditional Rendering.

The Pattern: If isLoggedIn is false, you render an AuthStack. If true, you render the AppStack.

Why? This prevents the user from "back-buttoning" from the Home screen into the Login screen, as the Login screen literally stops existing in the component tree.

3. Topic 3: Route Params (The "State" Struggle)
In mobile, "Search Params" are just "Route Params."

Passing Data: Use navigation.navigate('Posts', { page: 1 }).

Type Safety: You have to manually define a RootStackParamList type and pass it to your navigator and hooks. It is not automatic like TanStack Router.

Validation: There is no built-in Zod validation. You receive the object and hope it has the data you need.

4. Topic 4: Data Loading (Hooks & Effects)
React Navigation does not have a Loader API.

The Manual Way: You must use useEffect inside the screen component or a library like TanStack Query.

Focus Hooks: Use useFocusEffect. On mobile, a screen might stay "mounted" in the background, so useEffect won't re-run when you navigate back to it. useFocusEffect solves this.

5. Topic 5: Pending & Error States
Manual UI: Since there is no pendingComponent, you must manually manage a loading state in your component and return an <ActivityIndicator />.

Comparison: The "Triad" of Routers
Feature	TanStack Router (Web)	Next.js (Web/Server)	React Navigation (Mobile)
Routing Logic	File-based / Automatic	File-based / Automatic	Code-based / Manual
Auth	beforeLoad (Hook)	middleware.ts (Server)	Conditional Components
Data Fetching	loader (Pre-render)	Server Components	useEffect (Post-render)
Param Safety	100% Auto-generated	Manual Zod parsing	Manual TypeScript Interfaces
