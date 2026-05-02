import React from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory, HistoryJob } from "@/hooks/useHistory";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { history } = useHistory();

  const isWeb = Platform.OS === "web";
  const webPadding = isWeb ? 67 : 0;

  const renderItem = ({ item }: { item: HistoryJob }) => (
    <TouchableOpacity onPress={() => router.push(`/job/${item.jobId}`)}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.jobId, { color: colors.foreground }]}>
            {item.jobId.substring(0, 12)}...
          </Text>
          <Badge status={item.status} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: webPadding }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Build History</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No builds yet.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.jobId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
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
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  jobId: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  }
});
