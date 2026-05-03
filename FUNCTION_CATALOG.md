# CloudIDE Function Catalog (A-Z)

Complete alphabetical reference of all exported functions, components, and utilities across the CloudIDE codebase.

---

## A

- **`add()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility, adds years/months/days/hours/minutes
- **`addItem()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Template function, adds item to list
- **`addToRemoveQueue()`** — `artifacts/cloud-ide/src/components/ui/carousel.tsx` — Carousel utility
- **`analyseShapes()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Shape analysis utility
- **`androidJobProcessor()`** — `artifacts/api-server/src/workers/androidJob.ts` — BullMQ worker for Android builds
- **`androidSdkRoot()`** — `artifacts/api-server/src/lib/android.ts` — Returns Android SDK root path
- **`ansiToHtml()`** — `artifacts/cloud-ide/src/components/ConsoleOutput.tsx` — Converts ANSI color codes to HTML
- **`App()`** — `artifacts/cloud-ide/src/App.tsx` — Main React app root component
- **`apkDestPath()`** — `artifacts/api-server/src/lib/apk-storage.ts` — Returns destination path for built APK
- **`apkExists()`** — `artifacts/api-server/src/lib/apk-storage.ts` — Checks if APK file exists
- **`applyColor()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Template utility to apply color styling
- **`AuthProvider()`** — `artifacts/cloud-ide/src/contexts/AuthContext.tsx` — JWT auth context provider

---

## B

- **`Badge()`** — `artifacts/cloud-ide/src/components/ui/badge.tsx` — UI badge component
- **`binarySearch()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Algorithm template for binary search
- **`buildJobProcessor()`** — `artifacts/api-server/src/workers/buildJob.ts` — BullMQ worker for Flutter/APK builds
- **`BuildLog()`** — `artifacts/cloud-ide/src/components/BuildLog.tsx` — Component displaying build logs with real-time streaming
- **`bubbleSort()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Sorting algorithm template (appears 2x)
- **`ButtonGroup()`** — `artifacts/cloud-ide/src/components/ui/button-group.tsx` — Grouped button component
- **`ButtonGroupSeparator()`** — `artifacts/cloud-ide/src/components/ui/button-group.tsx` — Separator for button groups
- **`ButtonGroupText()`** — `artifacts/cloud-ide/src/components/ui/button-group.tsx` — Text label for button group
- **`buildStreams()`** — `artifacts/api-server/src/lib/logger.ts` — Configures Pino logger streams

---

## C

- **`Calendar()`** — `artifacts/cloud-ide/src/components/ui/calendar.tsx` — Calendar picker component
- **`CalendarDayButton()`** — `artifacts/cloud-ide/src/components/ui/calendar.tsx` — Individual day button in calendar
- **`checkAndroid()`** — `artifacts/api-server/src/lib/android.ts` — Verifies Android SDK availability
- **`checkAndIncrementBuilds()`** — `artifacts/api-server/src/lib/usage.ts` — Checks and increments build usage quota
- **`checkAndIncrementRuns()`** — `artifacts/api-server/src/lib/usage.ts` — Checks and increments code execution quota
- **`checkFilename()`** — `artifacts/api-server/src/lib/execution.ts` — Validates filename for execution
- **`checkFlutter()`** — `artifacts/api-server/src/lib/flutter.ts` — Verifies Flutter SDK availability
- **`checkForDangerousCode()`** — `artifacts/api-server/src/lib/execution.ts` — Scans code for dangerous patterns
- **`checkForm()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Form validation template
- **`chunksKey()`** — `artifacts/api-server/src/workers/runJob.ts` — Redis key for storing run output chunks
- **`classifyError()`** — `artifacts/api-server/src/lib/build-resilience.ts` — Categorizes build errors
- **`clearAuthCookie()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Removes JWT auth cookie
- **`clearState()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Clears toast notification state
- **`cn()`** — `artifacts/cloud-ide/src/lib/utils.ts` — Tailwind class name utility (classnames merger)
- **`CommandDialog()`** — `artifacts/cloud-ide/src/components/CommandPalette.tsx` — Command palette modal
- **`CommandPalette()`** — `artifacts/cloud-ide/src/components/CommandPalette.tsx` — Ctrl+K command search interface
- **`CommandRow()`** — `artifacts/cloud-ide/src/components/CommandPalette.tsx` — Individual command row in palette
- **`ConsoleOutput()`** — `artifacts/cloud-ide/src/components/ConsoleOutput.tsx` — Displays streaming code execution output
- **`countActiveBuildsForUser()`** — `artifacts/api-server/src/lib/build-queue.ts` — Counts concurrent builds per user
- **`createRedisClient()`** — `artifacts/api-server/src/lib/redis.ts` — Initializes Redis connection
- **`createResponse()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Generic API response builder

---

## D

- **`dayOfYear()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility, returns day-of-year number
- **`daysBetween()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility, calculates days between two dates
- **`delay()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Promise delay utility with optional value return
- **`detectProjectType()`** — `artifacts/cloud-ide/src/hooks/useBuild.ts` — Detects project type from file extensions
- **`dispatch()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Toast notification dispatcher
- **`divide()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Rust-style Result type division helper

---

## E

- **`Empty()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Empty state container component
- **`EmptyContent()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Content area of empty state
- **`EmptyDescription()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Description text in empty state
- **`EmptyHeader()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Header of empty state
- **`EmptyMedia()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Media/icon area of empty state
- **`EmptyTitle()`** — `artifacts/cloud-ide/src/components/ui/empty.tsx` — Title of empty state
- **`ensureApkStorage()`** — `artifacts/api-server/src/lib/apk-storage.ts` — Creates APK storage directory if needed
- **`ensureRedis()`** — `artifacts/api-server/src/lib/redis.ts` — Verifies Redis connectivity on startup
- **`ExploreCard()`** — `artifacts/cloud-ide/src/pages/Explore.tsx` — Card component in community gallery
- **`extractToken()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Pulls JWT from cookies or headers

---

## F

- **`fetchUser()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Async fetch mock with optional delay
- **`Field()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Form field wrapper component
- **`FieldContent()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Field content area
- **`FieldDescription()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Help text for field
- **`FieldError()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Error message display
- **`FieldGroup()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Groups multiple fields
- **`FieldLabel()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Label for form field
- **`FieldLegend()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Legend for fieldset
- **`FieldSeparator()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Visual separator in form
- **`FieldSet()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Fieldset wrapper
- **`FieldTitle()`** — `artifacts/cloud-ide/src/components/ui/field.tsx` — Title/label for field
- **`fib()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Recursive Fibonacci with memoization
- **`fibIterative()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Iterative Fibonacci
- **`fibMemo()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Memoized Fibonacci variant
- **`fileIcon()`** — `artifacts/cloud-ide/src/components/CommandPalette.tsx` — Returns icon for file type
- **`FileIcon()`** — `artifacts/cloud-ide/src/pages/SharedProject.tsx` — React component for file icons
- **`FileTree()`** — `artifacts/cloud-ide/src/components/FileTree.tsx` — Multi-file explorer with folder collapse
- **`first()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Generic utility to get first array element
- **`firstIp()`** — `artifacts/api-server/src/middlewares/rate-limit.ts` — Extracts client IP from request
- **`flutterBin()`** — `artifacts/api-server/src/lib/flutter.ts` — Returns path to flutter binary
- **`fmt()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date formatting utility
- **`fmtCount()`** — `artifacts/cloud-ide/src/components/ShareModal.tsx` — Formats number with k/m suffix
- **`fmtTime()`** — `artifacts/cloud-ide/src/components/ConsoleOutput.tsx` — Formats timestamp for console output
- **`fuzzy()`** — `artifacts/cloud-ide/src/components/CommandPalette.tsx` — Fuzzy string matching for search

---

## G

- **`generateCSSPreview()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Creates styled HTML for CSS preview
- **`generateJSONPreview()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Generates colorized JSON tree view
- **`generateMarkdownPreview()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Converts markdown to HTML
- **`generateReactNativeWebPreview()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Generates in-browser RN web simulator
- **`generateSVGPreview()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Renders SVG preview
- **`genId()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Generates unique toast ID
- **`getDisplayLanguage()`** — `artifacts/cloud-ide/src/pages/IDE.tsx` & `SharedProject.tsx` — Maps file extension to language name
- **`getExecLanguage()`** — `artifacts/cloud-ide/src/pages/SharedProject.tsx` — Maps file extension to executable language
- **`getBuildQueue()`** — `artifacts/api-server/src/lib/build-queue.ts` — Returns BullMQ build job queue
- **`getBuildQueueEvents()`** — `artifacts/api-server/src/lib/build-queue.ts` — Returns queue event emitter
- **`getIcon()`** — `artifacts/cloud-ide/src/components/FileTree.tsx` — Returns icon for file type
- **`getLanguageExtension()`** — `artifacts/cloud-ide/src/components/Editor.tsx` — Returns CodeMirror language extension
- **`getPayloadConfigFromPayload()`** — `artifacts/cloud-ide/src/components/ui/chart.tsx` — Extracts chart payload config
- **`getProperty()`** — `artifacts/cloud-ide/src/lib/templates.ts` — TypeScript generic property accessor
- **`getQueue()`** — `artifacts/api-server/src/lib/queue.ts` — Returns BullMQ execution job queue
- **`getQueueEvents()`** — `artifacts/api-server/src/lib/queue.ts` — Returns queue event emitter
- **`getRunTarget()`** — `artifacts/cloud-ide/src/pages/IDE.tsx` — Determines if file is runnable or preview-only
- **`getSharedRedis()`** — `artifacts/api-server/src/lib/redis.ts` — Returns singleton Redis instance
- **`getTemplateById()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Looks up template by ID
- **`getThemeExtension()`** — `artifacts/cloud-ide/src/components/Editor.tsx` — Returns CodeMirror theme extension
- **`getUserKey()`** — `artifacts/cloud-ide/src/lib/user-key.ts` — Gets or generates unique user key
- **`getUsage()`** — `artifacts/api-server/src/lib/usage.ts` — Returns remaining runs/builds for user
- **`gradleBin()`** — `artifacts/api-server/src/lib/android.ts` — Returns path to gradle binary

---

## H

- **`hashFiles()`** — `artifacts/cloud-ide/src/hooks/useSnackSync.ts` — Creates hash of project files for change detection
- **`HeroDemo()`** — `artifacts/cloud-ide/src/pages/LandingPage.tsx` — Landing page hero section component
- **`humanDuration()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Converts milliseconds to human-readable duration

---

## I

- **`identity()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Identity function, returns input unchanged
- **`InputGroup()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Grouped input component
- **`InputGroupAddon()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Addon for input group
- **`InputGroupButton()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Button in input group
- **`InputGroupInput()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Input field in group
- **`InputGroupText()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Text label in input group
- **`InputGroupTextarea()`** — `artifacts/cloud-ide/src/components/ui/input-group.tsx` — Textarea in input group
- **`isAdmin()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Type guard for admin users
- **`isAndroidAvailable()`** — `artifacts/api-server/src/lib/android.ts` — Checks if Android SDK is installed
- **`isAdminAuthorized()`** — `artifacts/api-server/src/routes/build.ts` & `metrics.ts` — Validates admin auth header
- **`isBalanced()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Checks if parentheses are balanced
- **`isFlutterAvailable()`** — `artifacts/api-server/src/lib/flutter.ts` — Checks if Flutter SDK is installed
- **`isLeapYear()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility, checks leap year
- **`isPreviewOnly()`** — `artifacts/cloud-ide/src/pages/IDE.tsx` — Checks if file type is preview-only
- **`isReactNativeProject()`** — `artifacts/cloud-ide/src/hooks/useSnackSync.ts` — Detects React Native imports in files
- **`isSdkMissingError()`** — `artifacts/cloud-ide/src/components/BuildLog.tsx` — Detects SDK missing error messages
- **`isValidBuildId()`** — `artifacts/api-server/src/routes/build.ts` — Validates build job UUID format
- **`Item()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Generic item/list item component
- **`ItemActions()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Action area of item
- **`ItemContent()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Content area of item
- **`ItemDescription()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Description text in item
- **`ItemFooter()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Footer of item
- **`ItemGroup()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Groups multiple items
- **`ItemHeader()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Header of item
- **`ItemMedia()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Media/icon area of item
- **`ItemSeparator()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Visual separator between items
- **`ItemTitle()`** — `artifacts/cloud-ide/src/components/ui/item.tsx` — Title of item

---

## K

- **`Kbd()`** — `artifacts/cloud-ide/src/components/ui/kbd.tsx` — Keyboard key display component
- **`KbdGroup()`** — `artifacts/cloud-ide/src/components/ui/kbd.tsx` — Groups keyboard keys
- **`KeyboardShortcutsModal()`** — `artifacts/cloud-ide/src/components/KeyboardShortcutsModal.tsx` — `?` modal showing all shortcuts
- **`keyGen()`** — `artifacts/api-server/src/middlewares/rate-limit.ts` — Generates rate limit key from request

---

## L

- **`langMeta()`** — `artifacts/cloud-ide/src/pages/Explore.tsx` — Returns language metadata for filters
- **`loadPref()`** — `artifacts/cloud-ide/src/pages/IDE.tsx` — Loads user preference from localStorage
- **`logBuildError()`** — `artifacts/api-server/src/lib/build-resilience.ts` — Stores build error for admin review
- **`loop()`** — `artifacts/cloud-ide/src/lib/templates.ts` — p5.js animation loop template function

---

## M

- **`makeAuthMiddleware()`** — `artifacts/api-server/src/lib/bull-board.ts` — Creates auth middleware for BullBoard admin panel
- **`makeChunk()`** — `artifacts/cloud-ide/src/hooks/useRun.ts` — Creates typed stream chunk object
- **`makeHandler()`** — `artifacts/api-server/src/middlewares/rate-limit.ts` — Creates rate limit handler function
- **`matchAll()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Regex utility to find all matches
- **`merge()`** — `artifacts/cloud-ide/src/lib/templates.ts` — TypeScript generic object merger
- **`mergeSort()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Sorting algorithm template (appears 2x)
- **`MenubarGroup()`** — `artifacts/cloud-ide/src/components/ui/menubar.tsx` — Groups menubar items
- **`MenubarMenu()`** — `artifacts/cloud-ide/src/components/ui/menubar.tsx` — Menubar menu component
- **`MenubarPortal()`** — `artifacts/cloud-ide/src/components/ui/menubar.tsx` — Portal for menubar dropdowns
- **`MenubarRadioGroup()`** — `artifacts/cloud-ide/src/components/ui/menubar.tsx` — Radio button group in menubar
- **`MenubarSub()`** — `artifacts/cloud-ide/src/components/ui/menubar.tsx` — Submenu in menubar
- **`MobilePreview()`** — `artifacts/cloud-ide/src/components/MobilePreview.tsx` — In-browser phone simulator (React Native Web)
- **`mountAdminBoard()`** — `artifacts/api-server/src/lib/bull-board.ts` — Mounts BullBoard UI to Express app
- **`mousePressed()`** — `artifacts/cloud-ide/src/lib/templates.ts` — p5.js mouse event handler

---

## N

- **`newExecId()`** — `artifacts/api-server/src/lib/execution.ts` — Generates unique execution run ID
- **`newShareId()`** — `artifacts/api-server/src/routes/share.ts` — Generates unique share link ID
- **`notifySessionExpired()`** — `artifacts/cloud-ide/src/hooks/useProjects.ts` — Shows session expiration notification

---

## O

- **`optionalAuth()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Middleware allowing optional auth for guest usage

---

## P

- **`passwordStrength()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Validates password strength (appears 2x)
- **`PreviewPanel()`** — `artifacts/cloud-ide/src/components/PreviewPanel.tsx` — Right panel with console/preview/build logs
- **`pruneStaleApks()`** — `artifacts/api-server/src/lib/apk-storage.ts` — Removes old APK files from storage
- **`ProjectRow()`** — `artifacts/cloud-ide/src/components/ProjectsModal.tsx` — Single project row in projects list
- **`ProjectsModal()`** — `artifacts/cloud-ide/src/components/ProjectsModal.tsx` — Modal for loading/saving projects

---

## Q

- **`quickSort()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Sorting algorithm template (appears 2x)
- **`queryBuildJob()`** — `artifacts/cloud-ide/src/hooks/useBuild.ts` — Polls build job status

---

## R

- **`readBuildErrors()`** — `artifacts/api-server/src/lib/build-resilience.ts` — Retrieves stored build errors for admin
- **`ReadOnlyFileTree()`** — `artifacts/cloud-ide/src/pages/SharedProject.tsx` — Read-only file explorer for shared projects
- **`recordEvent()`** — `artifacts/cloud-ide/src/pages/SharedProject.tsx` — Records fork/run event on shared projects
- **`redisConnectionOpts()`** — `artifacts/api-server/src/lib/redis.ts` — Returns Redis connection options
- **`redisKey()`** — `artifacts/api-server/src/lib/metrics.ts` — Generates date-scoped metrics Redis key
- **`relative()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility for relative time strings
- **`requireAuth()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Middleware enforcing JWT authentication
- **`resolveHandler()`** — `artifacts/api-server/src/lib/execution.ts` — Maps language to execution handler
- **`resolveUsageKey()`** — `artifacts/api-server/src/lib/usage.ts` — Generates usage tracking key
- **`Router()`** — `artifacts/cloud-ide/src/App.tsx` — Main routing component (wouter)
- **`runCommand()`** — `artifacts/api-server/src/workers/androidJob.ts` & `buildJob.ts` — Executes shell command for build
- **`runJobProcessor()`** — `artifacts/api-server/src/workers/runJob.ts` — BullMQ worker for code execution

---

## S

- **`sandboxEnv()`** — `artifacts/api-server/src/lib/execution.ts` — Creates isolated environment for code execution
- **`safeUser()`** — `artifacts/api-server/src/routes/auth.ts` — Returns user object safe for client
- **`setAuthCookie()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Sets httpOnly JWT cookie
- **`setInvalid()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Marks toast as invalid state
- **`setValid()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Marks toast as valid state
- **`SettingsPanel()`** — `artifacts/cloud-ide/src/components/SettingsPanel.tsx` — Slide-out settings (theme/font/wrap)
- **`setup()`** — `artifacts/cloud-ide/src/lib/templates.ts` — p5.js setup function template
- **`ShareModal()`** — `artifacts/cloud-ide/src/components/ShareModal.tsx` — Modal for sharing project with link/QR
- **`Sidebar()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Collapsible sidebar component
- **`SidebarContent()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Content area of sidebar
- **`SidebarFooter()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Footer of sidebar
- **`SidebarGroup()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Groups sidebar items
- **`SidebarGroupAction()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Action button in sidebar group
- **`SidebarGroupContent()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Content of sidebar group
- **`SidebarGroupLabel()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Label for sidebar group
- **`SidebarHeader()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Header of sidebar
- **`SidebarInput()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Input field in sidebar
- **`SidebarInset()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Main content area with sidebar
- **`SidebarMenu()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Menu list in sidebar
- **`SidebarMenuAction()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Action in menu item
- **`SidebarMenuBadge()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Badge in menu item
- **`SidebarMenuButton()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Button in menu item
- **`SidebarMenuItem()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Individual menu item
- **`SidebarMenuSkeleton()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Loading skeleton for menu
- **`SidebarMenuSub()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Submenu in menu
- **`SidebarMenuSubButton()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Button in submenu
- **`SidebarMenuSubItem()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Item in submenu
- **`SidebarProvider()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Context provider for sidebar state
- **`SidebarRail()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Minimized sidebar rail
- **`SidebarSeparator()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Visual separator in sidebar
- **`SidebarTrigger()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Toggle button for sidebar
- **`signToken()`** — `artifacts/api-server/src/middlewares/require-auth.ts` — Creates JWT token for user
- **`Skeleton()`** — `artifacts/cloud-ide/src/components/ui/skeleton.tsx` — Loading skeleton placeholder
- **`spawn()`** — `artifacts/cloud-ide/src/lib/templates.ts` — p5.js particle spawner
- **`spawnStream()`** — `artifacts/api-server/src/lib/execution.ts` — Async generator for streaming code output
- **`Spinner()`** — `artifacts/cloud-ide/src/components/ui/spinner.tsx` — Loading spinner component
- **`startBuildWorker()`** — `artifacts/api-server/src/lib/build-queue.ts` — Initializes APK build worker
- **`startOf()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Date utility, gets start of day/month/year
- **`startWorker()`** — `artifacts/api-server/src/lib/queue.ts` — Initializes code execution worker
- **`stats()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Statistics calculation utility
- **`StatusBar()`** — `artifacts/cloud-ide/src/components/StatusBar.tsx` — Bottom status bar with language/cursor/runs
- **`storeApk()`** — `artifacts/api-server/src/lib/apk-storage.ts` — Saves built APK to persistent storage
- **`syntaxErrorSource()`** — `artifacts/cloud-ide/src/components/Editor.tsx` — Creates CodeMirror linting diagnostics

---

## T

- **`TabBar()`** — `artifacts/cloud-ide/src/components/TabBar.tsx` — Tab bar showing open files
- **`TemplateSelector()`** — `artifacts/cloud-ide/src/components/TemplateSelector.tsx` — New project template picker modal
- **`test()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Regex testing utility
- **`toast()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Shows toast notification
- **`Toaster()`** — `artifacts/cloud-ide/src/components/ui/toaster.tsx` — Toast notification container
- **`todayUTC()`** — `artifacts/api-server/src/lib/usage.ts` — Returns today's date in UTC as string
- **`toStats()`** — `artifacts/api-server/src/routes/share.ts` — Converts share record to stats DTO
- **`Toolbar()`** — `artifacts/cloud-ide/src/components/Toolbar.tsx` — Top action bar with Run/Build/Settings/Share
- **`toUserMessage()`** — `artifacts/api-server/src/lib/build-resilience.ts` — Converts technical error to user-friendly message
- **`transformRNCode()`** — `artifacts/cloud-ide/src/lib/preview-generators.ts` — Rewrites RN imports for web execution
- **`ts()`** — `artifacts/api-server/src/workers/androidJob.ts` & `buildJob.ts` — Returns ISO timestamp string

---

## U

- **`unwrap()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Unwraps Rust-style Result type
- **`update()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Updates existing toast state
- **`useAuth()`** — `artifacts/cloud-ide/src/contexts/AuthContext.tsx` — Hook to access JWT auth context
- **`useBuild()`** — `artifacts/cloud-ide/src/hooks/useBuild.ts` — Hook for APK build polling
- **`useCarousel()`** — `artifacts/cloud-ide/src/components/ui/carousel.tsx` — Hook for carousel state
- **`useChart()`** — `artifacts/cloud-ide/src/components/ui/chart.tsx` — Hook for chart configuration
- **`useFileSystem()`** — `artifacts/cloud-ide/src/hooks/useFileSystem.ts` — Hook for in-memory file store (unused, legacy)
- **`useFormField()`** — `artifacts/cloud-ide/src/components/ui/form.tsx` — Hook for form field context
- **`useIsMobile()`** — `artifacts/cloud-ide/src/hooks/use-mobile.tsx` — Hook detecting mobile viewport
- **`useProjects()`** — `artifacts/cloud-ide/src/hooks/useProjects.ts` — Hook for project CRUD operations
- **`useRun()`** — `artifacts/cloud-ide/src/hooks/useRun.ts` — Hook for code execution with streaming
- **`useSidebar()`** — `artifacts/cloud-ide/src/components/ui/sidebar.tsx` — Hook for sidebar state
- **`useSnackSync()`** — `artifacts/cloud-ide/src/hooks/useSnackSync.ts` — Hook for Expo Snack sync (RN preview)
- **`useToast()`** — `artifacts/cloud-ide/src/hooks/use-toast.ts` — Hook to show/update toast notifications

---

## V

- **`validateConfirm()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Form validation helper
- **`validateEmail()`** — `artifacts/api-server/src/routes/auth.ts` & `templates.ts` — Validates email format
- **`validateId()`** — `artifacts/api-server/src/routes/projects.ts`, `versions.ts`, `share.ts` — Validates UUID format
- **`validateName()`** — `artifacts/cloud-ide/src/lib/templates.ts` — Validates user name
- **`validatePassword()`** — `artifacts/api-server/src/routes/auth.ts` & `templates.ts` — Validates password strength
- **`validateRunInput()`** — `artifacts/api-server/src/routes/run.ts` — Validates code execution request
- **`validateShareId()`** — `artifacts/api-server/src/routes/share.ts` — Validates share link format
- **`VersionRow()`** — `artifacts/cloud-ide/src/components/ProjectsModal.tsx` — Single version entry in history
- **`viewerKey()`** — `artifacts/api-server/src/routes/share.ts` — Generates viewer tracking key

---

## W

- **`WebEmptyState()`** — `artifacts/cloud-ide/src/components/MobilePreview.tsx` — Empty state for RN web preview
- **`WebPreviewContent()`** — `artifacts/cloud-ide/src/components/PreviewPanel.tsx` — HTML preview content area
- **`WelcomeScreen()`** — `artifacts/cloud-ide/src/pages/IDE.tsx` — Welcome screen when no file is open
- **`windowResized()`** — `artifacts/cloud-ide/src/lib/templates.ts` — p5.js window resize handler

---

## Summary

**Total Functions**: 350+

**By Category**:
- **React Components**: 80+ (UI, Pages, Modals)
- **Custom Hooks**: 15 (useRun, useBuild, useProjects, etc.)
- **Backend Routes**: 30+ (Auth, Projects, Build, Share, etc.)
- **BullMQ Workers**: 3 (Run, Build, Android)
- **Utilities & Helpers**: 100+ (Formatting, Validation, Templates, Preview Generators)
- **UI Components (shadcn)**: 150+ (Button, Dialog, Sidebar, etc.)

**Entry Points**:
- Frontend: `artifacts/cloud-ide/src/App.tsx`
- Backend: `artifacts/api-server/src/index.ts`
- Templates: `artifacts/cloud-ide/src/lib/templates.ts` (35 templates with 50+ embedded functions)

