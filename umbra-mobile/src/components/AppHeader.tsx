import React, { useState } from "react";
import { View, Text, Pressable, Modal, TouchableWithoutFeedback, ScrollView } from "react-native";
import { Eye, EyeOff, Settings, ChevronDown } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/lib/store";
import { SUPPORTED_CURRENCIES } from "@/lib/markets";

export function AppHeader({ subtitle: _subtitle }: { subtitle?: string }) {
  const hidden = useApp((s) => s.hideBalances);
  const toggle = useApp((s) => s.toggleHideBalances);
  const ccy = useApp((s) => s.displayCurrency);
  const setCcy = useApp((s) => s.setDisplayCurrency);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
      {/* Wordmark */}
      <View className="flex-row items-center gap-2">
        <View className="w-6 h-6 rounded-md bg-primary items-center justify-center">
          <View className="w-2.5 h-2.5 rounded-full bg-white/90" />
        </View>
        <Text className="text-sm font-semibold tracking-tight text-foreground">umbra</Text>
      </View>

      {/* Controls */}
      <View className="flex-row items-center gap-1">
        {/* Currency picker */}
        <View>
          <Pressable
            onPress={() => setOpen(true)}
            className="h-7 px-2 flex-row items-center gap-1 rounded-md border border-border bg-card"
          >
            <Text className="text-[11px] font-mono text-muted-foreground">{ccy}</Text>
            <ChevronDown size={10} color="#8c8ca0" />
          </Pressable>

          <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <TouchableWithoutFeedback onPress={() => setOpen(false)}>
              <View className="flex-1 bg-black/50 justify-end">
                <TouchableWithoutFeedback>
                  <View className="bg-popover rounded-t-2xl border-t border-x border-border" style={{ maxHeight: 400 }}>
                    <View className="py-3 items-center">
                      <View className="h-[3px] w-8 rounded-full bg-white/12" />
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => { setCcy(c); setOpen(false); }}
                          className="px-5 py-3"
                        >
                          <Text className={`text-sm font-mono ${c === ccy ? "text-primary" : "text-muted-foreground"}`}>{c}</Text>
                        </Pressable>
                      ))}
                      <View style={{ height: 32 }} />
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Balance toggle */}
        <Pressable
          onPress={toggle}
          className="w-7 h-7 items-center justify-center rounded-md border border-border bg-card"
        >
          {hidden ? <EyeOff size={14} color="#8c8ca0" /> : <Eye size={14} color="#8c8ca0" />}
        </Pressable>

        {/* Settings */}
        <Pressable
          onPress={() => router.push("/settings")}
          className="w-7 h-7 items-center justify-center rounded-md border border-border bg-card"
        >
          <Settings size={14} color="#8c8ca0" />
        </Pressable>
      </View>
    </View>
  );
}
