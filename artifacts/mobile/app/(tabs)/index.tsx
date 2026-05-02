import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TextInput, ScrollView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Feather } from "@expo/vector-icons";
import { useStartBuild, useGetBuildStatus, useGetBuildLogs, JobStatus } from "@workspace/api-client-react";
import { useHistory } from "@/hooks/useHistory";
import * as Linking from "expo-linking";

export default function BuildScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addJob, updateJob } = useHistory();

  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const startBuildMutation = useStartBuild();

  const { data: statusData } = useGetBuildStatus(jobId || "", {
    query: {
      enabled: !!jobId,
      queryKey: [`/api/status/${jobId || ""}`],
      refetchInterval: (query) => {
        const s = (query.state?.data as JobStatus | undefined)?.status;
        return s === "queued" || s === "building" ? 3000 : false;
      },
    }
  });

  const { data: logsData } = useGetBuildLogs(jobId || "", {
    query: {
      enabled: !!jobId && (statusData?.status === "building" || statusData?.status === "success" || statusData?.status === "failed"),
      refetchInterval: statusData?.status === "building" ? 3000 : false,
      queryKey: [`/api/logs/${jobId || ""}`],
    }
  });

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (statusData) {
      updateJob(statusData);
    }
  }, [statusData]);

  const handleStartBuild = async () => {
    if (!url.trim()) {
      setErrorMsg("Please enter a URL");
      return;
    }
    setErrorMsg("");
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download ZIP");
      const blob = await response.blob();
      
      const res = await startBuildMutation.mutateAsync({ data: { project: blob } });
      setJobId(res.jobId);
      
      addJob({
        jobId: res.jobId,
        status: res.status,
        queuePosition: res.queuePosition,
      });
      
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to start build");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadApk = () => {
    if (statusData?.download) {
      Linking.openURL(statusData.download);
    } else if (jobId) {
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      Linking.openURL(`${baseUrl}/api/download/${jobId}`);
    }
  };

  const reset = () => {
    setJobId(null);
    setUrl("");
    setErrorMsg("");
    startBuildMutation.reset();
  };

  const isWeb = Platform.OS === "web";
  const webPadding = isWeb ? 67 : 0;
  
  const currentStatus = statusData?.status || "idle";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: webPadding }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Flutter APK Builder</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Compile your Flutter app in the cloud</Text>
        </View>

        {!jobId ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.card}>
              <View style={styles.iconContainer}>
                <Feather name="box" size={48} color={colors.accent} />
              </View>
              <Text style={[styles.label, { color: colors.foreground }]}>Project ZIP URL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                  }
                ]}
                placeholder="https://github.com/user/repo/archive/main.zip"
                placeholderTextColor={colors.mutedForeground}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errorMsg ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text> : null}
              
              <Button 
                title="Start Build" 
                onPress={handleStartBuild} 
                isLoading={downloading || startBuildMutation.isPending} 
                style={styles.submitBtn} 
              />
            </Card>
          </ScrollView>
        ) : (
          <View style={styles.buildContainer}>
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={[styles.jobId, { color: colors.mutedForeground }]}>Job ID: {jobId.substring(0, 8)}...</Text>
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
                  {logsData?.logs || "Waiting for logs..."}
                </Text>
              </ScrollView>
            </View>

            <View style={styles.actions}>
              {currentStatus === "success" && (
                <Button 
                  title="Download APK" 
                  onPress={handleDownloadApk} 
                  style={styles.actionBtn}
                  variant="default"
                />
              )}
              {(currentStatus === "success" || currentStatus === "failed") && (
                <Button 
                  title="New Build" 
                  onPress={reset} 
                  style={styles.actionBtn} 
                  variant="outline"
                />
              )}
            </View>
          </View>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  label: {
    alignSelf: "flex-start",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  errorText: {
    alignSelf: "flex-start",
    marginBottom: 16,
    fontSize: 14,
  },
  submitBtn: {
    width: "100%",
    marginTop: 8,
  },
  buildContainer: {
    flex: 1,
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
