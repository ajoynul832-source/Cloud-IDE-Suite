import React, { useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGetBuildStatus, useGetBuildLogs, JobStatus } from "@workspace/api-client-react";
import * as Linking from "expo-linking";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  const { data: statusData, isLoading: isLoadingStatus } = useGetBuildStatus(id || "", {
    query: {
      enabled: !!id,
      queryKey: [`/api/status/${id || ""}`],
      refetchInterval: (query) => {
        const s = (query.state?.data as JobStatus | undefined)?.status;
        return s === "queued" || s === "building" ? 3000 : false;
      },
    }
  });

  const { data: logsData } = useGetBuildLogs(id || "", {
    query: {
      enabled: !!id,
      refetchInterval: statusData?.status === "building" ? 3000 : false,
      queryKey: [`/api/logs/${id || ""}`],
    }
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const handleDownloadApk = () => {
    if (statusData?.download) {
      Linking.openURL(statusData.download);
    } else if (id) {
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      Linking.openURL(`${baseUrl}/api/download/${id}`);
    }
  };

  const currentStatus = statusData?.status || "idle";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ 
        title: "Job Details", 
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerBackTitle: "Back"
      }} />
      <View style={styles.container}>
        {isLoadingStatus ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={[styles.jobId, { color: colors.foreground }]}>{id}</Text>
                  <View style={{ height: 8 }} />
                  <Badge status={currentStatus} />
                </View>
                {(currentStatus === "queued" || currentStatus === "building") && (
                  <ActivityIndicator size="large" color={colors.primary} />
                )}
              </View>
              
              {statusData?.stage && (
                <Text style={[styles.stage, { color: colors.accent }]}>
                  {statusData.stage}...
                </Text>
              )}
            </Card>

            <View style={[styles.logsWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.logsHeader, { borderBottomColor: colors.border }]}>
                <Feather name="terminal" size={16} color={colors.mutedForeground} />
                <Text style={[styles.logsTitle, { color: colors.mutedForeground }]}>Build Logs</Text>
              </View>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.logsScroll} 
                contentContainerStyle={styles.logsContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                <Text style={[styles.logsText, { color: colors.foreground }]}>
                  {logsData?.logs || "No logs available."}
                </Text>
              </ScrollView>
            </View>

            <View style={styles.actions}>
              {currentStatus === "success" && (
                <Button 
                  title="Download APK" 
                  onPress={handleDownloadApk} 
                  style={styles.actionBtn}
                />
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobId: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
    fontWeight: "bold",
  },
  stage: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  logsWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  logsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  logsScroll: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  logsText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    width: "100%",
  }
});
