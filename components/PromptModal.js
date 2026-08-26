// components/PromptModal.js
// A small, reusable text-input dialog built entirely from React Native's
// own primitives (Modal + TextInput) — no extra dependency needed. Used
// by ProfileScreen.js for "add a favorite team/league" and "edit name",
// since RN's built-in Alert.prompt() only exists on iOS, not Android.

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function PromptModal({ visible, title, placeholder, initialValue = '', onCancel, onSubmit }) {
  const [value, setValue] = useState(initialValue);

  // Reset to the current initialValue every time the modal opens, so a
  // stale value from a previous use doesn't linger.
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmit}>
              <Text style={styles.submitText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: spacing.lg,
  },
  title: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  input: {
    ...type.body,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderGlassStrong,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 13.5,
  },
  submitButton: {
    backgroundColor: colors.emerald,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: spacing.sm,
  },
  submitText: {
    ...type.bodySemiBold,
    color: colors.textOnEmerald,
    fontSize: 13.5,
  },
});