import React from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BadgeProps extends ViewProps {
  status: "queued" | "building" | "success" | "failed" | string;
  label?: string;
}

export function Badge({ status, label, style, ...props }: BadgeProps) {
  const colors = useColors();

  const getStatusColor = () => {
    switch (status) {
      case "queued":
        return { bg: colors.muted, text: colors.mutedForeground };
      case "building":
        return { bg: colors.accent, text: colors.accentForeground };
      case "success":
        return { bg: colors.primary, text: colors.primaryForeground };
      case "failed":
        return { bg: colors.destructive, text: colors.destructiveForeground };
      default:
        return { bg: colors.secondary, text: colors.secondaryForeground };
    }
  };

  const { bg, text } = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderRadius: colors.radius },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, { color: text }]}>{label || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
