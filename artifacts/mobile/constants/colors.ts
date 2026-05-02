/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: "#00ff00",
    tint: "#00ff00",
    background: "#0d0f14",
    foreground: "#e5e5e5",
    card: "#161b22",
    cardForeground: "#e5e5e5",
    primary: "#00ff00", // Terminal Green
    primaryForeground: "#0d0f14",
    secondary: "#1f2937",
    secondaryForeground: "#e5e5e5",
    muted: "#1f2937",
    mutedForeground: "#9ca3af",
    accent: "#00ffff", // Electric Cyan
    accentForeground: "#0d0f14",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#30363d",
    input: "#161b22",
  },
  dark: {
    text: "#00ff00",
    tint: "#00ff00",
    background: "#0d0f14",
    foreground: "#e5e5e5",
    card: "#161b22",
    cardForeground: "#e5e5e5",
    primary: "#00ff00",
    primaryForeground: "#0d0f14",
    secondary: "#1f2937",
    secondaryForeground: "#e5e5e5",
    muted: "#1f2937",
    mutedForeground: "#9ca3af",
    accent: "#00ffff",
    accentForeground: "#0d0f14",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#30363d",
    input: "#161b22",
  },
  radius: 6,
};

export default colors;
