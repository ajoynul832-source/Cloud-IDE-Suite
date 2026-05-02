import React from "react";
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  title,
  variant = "default",
  size = "default",
  isLoading,
  style,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const getBackgroundColor = () => {
    if (variant === "secondary") return colors.secondary;
    if (variant === "destructive") return colors.destructive;
    if (variant === "outline" || variant === "ghost") return "transparent";
    return colors.primary;
  };

  const getTextColor = () => {
    if (variant === "secondary") return colors.secondaryForeground;
    if (variant === "destructive") return colors.destructiveForeground;
    if (variant === "outline" || variant === "ghost") return colors.primary;
    return colors.primaryForeground;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === "outline" ? colors.border : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: disabled || isLoading ? 0.5 : 1,
          paddingVertical: size === "sm" ? 8 : size === "lg" ? 16 : size === "icon" ? 10 : 12,
          paddingHorizontal: size === "sm" ? 12 : size === "lg" ? 32 : size === "icon" ? 10 : 16,
          borderRadius: colors.radius,
        },
        style,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : children ? (
        children
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: size === "sm" ? 14 : 16 },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
