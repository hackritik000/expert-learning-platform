import { API_ROUTES, type ManagedTimeSlot } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';

const TIME_PRESETS = [
  { start: '09:00 AM', end: '10:00 AM', label: '09:00 - 10:00 AM' },
  { start: '10:00 AM', end: '11:00 AM', label: '10:00 - 11:00 AM' },
  { start: '11:00 AM', end: '12:00 PM', label: '11:00 - 12:00 PM' },
  { start: '02:00 PM', end: '03:00 PM', label: '02:00 - 03:00 PM' },
  { start: '03:00 PM', end: '04:00 PM', label: '03:00 - 04:00 PM' },
  { start: '04:30 PM', end: '05:30 PM', label: '04:30 - 05:30 PM' },
  { start: '06:00 PM', end: '07:00 PM', label: '06:00 - 07:00 PM' },
  { start: '07:00 PM', end: '08:00 PM', label: '07:00 - 08:00 PM' },
];

function getQuickDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    dates.push({ date: dateStr, label });
  }

  return dates;
}

export default function ManageSlotsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'booked'>('all');

  // Modal State for Create/Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ManagedTimeSlot | null>(null);

  const quickDates = useMemo(() => getQuickDates(), []);

  // Form State
  const [selectedDate, setSelectedDate] = useState(quickDates[0].date);
  const [customDate, setCustomDate] = useState('');
  const [selectedTimePreset, setSelectedTimePreset] = useState<string>(TIME_PRESETS[0].label);
  const [customStartTime, setCustomStartTime] = useState(TIME_PRESETS[0].start);
  const [customEndTime, setCustomEndTime] = useState(TIME_PRESETS[0].end);
  const [useCustomTime, setUseCustomTime] = useState(false);

  // 1. Fetch Educator's Slots
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['educator-my-slots'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: ManagedTimeSlot[];
      }>(API_ROUTES.EDUCATORS.MY_SLOTS);
      return res.data.data;
    },
  });

  // 2. Create Slot Mutation
  const createSlotMutation = useMutation({
    mutationFn: async (payload: { date: string; startTime: string; endTime: string }) => {
      const res = await apiClient.post(API_ROUTES.EDUCATORS.CREATE_SLOT, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator-my-slots'] });
      queryClient.invalidateQueries({ queryKey: ['educator'] });
      closeModal();
      Alert.alert('Success', 'Availability slot added successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to create slot';
      Alert.alert('Error', msg);
    },
  });

  // 3. Update Slot Mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({
      slotId,
      payload,
    }: {
      slotId: string;
      payload: { date: string; startTime: string; endTime: string };
    }) => {
      const res = await apiClient.put(API_ROUTES.EDUCATORS.UPDATE_SLOT(slotId), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator-my-slots'] });
      queryClient.invalidateQueries({ queryKey: ['educator'] });
      closeModal();
      Alert.alert('Success', 'Availability slot updated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to update slot';
      Alert.alert('Error', msg);
    },
  });

  // 4. Delete Slot Mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await apiClient.delete(API_ROUTES.EDUCATORS.DELETE_SLOT(slotId));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator-my-slots'] });
      queryClient.invalidateQueries({ queryKey: ['educator'] });
      Alert.alert('Deleted', 'Time slot removed successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to delete slot';
      Alert.alert('Error', msg);
    },
  });

  const openCreateModal = () => {
    setEditingSlot(null);
    setSelectedDate(quickDates[0].date);
    setCustomDate('');
    setSelectedTimePreset(TIME_PRESETS[0].label);
    setCustomStartTime(TIME_PRESETS[0].start);
    setCustomEndTime(TIME_PRESETS[0].end);
    setUseCustomTime(false);
    setModalVisible(true);
  };

  const openEditModal = (slot: ManagedTimeSlot) => {
    if (slot.isBooked) {
      Alert.alert(
        'Slot Booked',
        'This slot has already been purchased by a student and cannot be modified.',
      );
      return;
    }

    setEditingSlot(slot);
    setSelectedDate(slot.date);
    setCustomDate(slot.date);

    const matchingPreset = TIME_PRESETS.find(
      (p) => p.start === slot.startTime && p.end === slot.endTime,
    );

    if (matchingPreset) {
      setSelectedTimePreset(matchingPreset.label);
      setCustomStartTime(matchingPreset.start);
      setCustomEndTime(matchingPreset.end);
      setUseCustomTime(false);
    } else {
      setUseCustomTime(true);
      setCustomStartTime(slot.startTime);
      setCustomEndTime(slot.endTime);
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSlot(null);
  };

  const handleSaveSlot = () => {
    const finalDate = (customDate.trim() || selectedDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
      Alert.alert('Invalid Date', 'Date must be formatted as YYYY-MM-DD');
      return;
    }

    let startTime = customStartTime.trim();
    let endTime = customEndTime.trim();

    if (!useCustomTime) {
      const preset = TIME_PRESETS.find((p) => p.label === selectedTimePreset);
      if (preset) {
        startTime = preset.start;
        endTime = preset.end;
      }
    }

    if (!startTime || !endTime) {
      Alert.alert('Missing Time', 'Please choose or enter both start and end time.');
      return;
    }

    if (editingSlot) {
      updateSlotMutation.mutate({
        slotId: editingSlot.id,
        payload: {
          date: finalDate,
          startTime,
          endTime,
        },
      });
    } else {
      createSlotMutation.mutate({
        date: finalDate,
        startTime,
        endTime,
      });
    }
  };

  const handleDeleteSlot = (slot: ManagedTimeSlot) => {
    if (slot.isBooked) {
      Alert.alert(
        'Cannot Delete',
        'This time slot has already been booked by a student. You cannot delete it.',
      );
      return;
    }

    Alert.alert(
      'Delete Time Slot',
      `Are you sure you want to remove the slot for ${slot.date} (${slot.startTime} - ${slot.endTime})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSlotMutation.mutate(slot.id),
        },
      ],
    );
  };

  const filteredSlots = useMemo(() => {
    if (activeTab === 'available') {
      return slots.filter((s) => !s.isBooked);
    }
    if (activeTab === 'booked') {
      return slots.filter((s) => s.isBooked);
    }
    return slots;
  }, [slots, activeTab]);

  const stats = useMemo(() => {
    const total = slots.length;
    const booked = slots.filter((s) => s.isBooked).length;
    const available = total - booked;
    return { total, available, booked };
  }, [slots]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Availability Slots</Text>
          <Text style={styles.headerSubtitle}>Set and change your consultation slots</Text>
        </View>
        <TouchableOpacity
          onPress={openCreateModal}
          style={styles.addSlotButton}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.white} />
          <Text style={styles.addSlotButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Slots</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAvailable]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>Open Slots</Text>
        </View>
        <View style={[styles.statCard, styles.statCardBooked]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.booked}</Text>
          <Text style={styles.statLabel}>Booked</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Available ({stats.available})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'booked' && styles.tabButtonActive]}
          onPress={() => setActiveTab('booked')}
        >
          <Text style={[styles.tabText, activeTab === 'booked' && styles.tabTextActive]}>
            Booked ({stats.booked})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slot List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your consultation slots...</Text>
        </View>
      ) : filteredSlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title={activeTab === 'booked' ? 'No Booked Slots' : 'No Slots Available'}
            description={
              activeTab === 'booked'
                ? 'No students have booked your open consultation slots yet.'
                : 'You have not added any available time slots. Add slots so students can book consultations with you!'
            }
            actionTitle="Add New Slot"
            onAction={openCreateModal}
            icon={<Calendar size={36} color={colors.primary} />}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {filteredSlots.map((slot) => {
            const isBooked = slot.isBooked;
            return (
              <View key={slot.id} style={[styles.slotCard, isBooked && styles.slotCardBooked]}>
                <View style={styles.slotTopRow}>
                  <View style={styles.dateBadge}>
                    <Calendar size={14} color={colors.primary} />
                    <Text style={styles.dateText}>{slot.date}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isBooked ? styles.statusPillBooked : styles.statusPillAvailable,
                    ]}
                  >
                    {isBooked ? (
                      <>
                        <Lock size={12} color={colors.primary} />
                        <Text style={styles.statusPillTextBooked}>Booked</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} color={colors.success} />
                        <Text style={styles.statusPillTextAvailable}>Available</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Clock size={16} color={colors.textLight} />
                  <Text style={styles.timeText}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </View>

                {isBooked ? (
                  <View style={styles.bookedDetails}>
                    <User size={14} color={colors.primary} />
                    <Text style={styles.bookedDetailsText}>
                      Booked by:{' '}
                      <Text style={styles.boldText}>{slot.studentName || 'Student'}</Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => openEditModal(slot)}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={15} color={colors.primary} />
                      <Text style={styles.editActionText}>Change Slot</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDeleteSlot(slot)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color={colors.error} />
                      <Text style={styles.deleteActionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create / Edit Slot Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={closeModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingSlot ? 'Change Consultation Slot' : 'Add Available Slot'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Students can only book within your configured slots
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalFormScroll}
              keyboardShouldPersistTaps="handled"
              bottomOffset={spacing.md}
            >
              {/* Select Date */}
              <Text style={styles.formSectionTitle}>1. Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.datePresetsRow}
              >
                {quickDates.map((item) => {
                  const isSelected = selectedDate === item.date && !customDate;
                  return (
                    <TouchableOpacity
                      key={item.date}
                      style={[styles.datePresetChip, isSelected && styles.datePresetChipSelected]}
                      onPress={() => {
                        setSelectedDate(item.date);
                        setCustomDate('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.datePresetChipText,
                          isSelected && styles.datePresetChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.datePresetSubText,
                          isSelected && styles.datePresetSubTextSelected,
                        ]}
                      >
                        {item.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.orText}>— Or specify custom date —</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD (e.g. 2026-11-20)"
                placeholderTextColor={colors.textLight}
                value={customDate}
                onChangeText={(text) => {
                  setCustomDate(text);
                  setSelectedDate(text);
                }}
              />

              {/* Time Selection */}
              <View style={styles.timeSectionHeader}>
                <Text style={styles.formSectionTitle}>2. Select Consultation Time</Text>
                <TouchableOpacity
                  onPress={() => setUseCustomTime(!useCustomTime)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customToggleText}>
                    {useCustomTime ? 'Use Standard Presets' : 'Custom Time Range'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!useCustomTime ? (
                <View style={styles.timePresetsGrid}>
                  {TIME_PRESETS.map((preset) => {
                    const isSelected = selectedTimePreset === preset.label;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[styles.timePresetChip, isSelected && styles.timePresetChipSelected]}
                        onPress={() => {
                          setSelectedTimePreset(preset.label);
                          setCustomStartTime(preset.start);
                          setCustomEndTime(preset.end);
                        }}
                        activeOpacity={0.7}
                      >
                        <Clock size={13} color={isSelected ? colors.white : colors.textLight} />
                        <Text
                          style={[
                            styles.timePresetChipText,
                            isSelected && styles.timePresetChipTextSelected,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.customTimeInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 10:00 AM"
                      placeholderTextColor={colors.textLight}
                      value={customStartTime}
                      onChangeText={setCustomStartTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 11:00 AM"
                      placeholderTextColor={colors.textLight}
                      value={customEndTime}
                      onChangeText={setCustomEndTime}
                    />
                  </View>
                </View>
              )}

              {/* Policy note */}
              <View style={styles.policyNotice}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={styles.policyNoticeText}>
                  Students can only message you during purchased active slots. Making slots
                  available lets students schedule their consultations.
                </Text>
              </View>
            </KeyboardAwareScrollView>

            <View style={styles.modalActions}>
              <SecondaryButton title="Cancel" onPress={closeModal} style={{ flex: 1 }} />
              <PrimaryButton
                title={
                  createSlotMutation.isPending || updateSlotMutation.isPending
                    ? 'Saving...'
                    : editingSlot
                      ? 'Save Changes'
                      : 'Create Slot'
                }
                onPress={handleSaveSlot}
                disabled={createSlotMutation.isPending || updateSlotMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  addSlotButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  statCardAvailable: {
    borderColor: '#C6F6D5',
    backgroundColor: '#F0FFF4',
  },
  statCardBooked: {
    borderColor: '#EBF8FF',
    backgroundColor: '#F0F7FF',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  slotCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  slotCardBooked: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  statusPillAvailable: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  statusPillTextAvailable: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  statusPillBooked: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusPillTextBooked: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  bookedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: spacing.xs + 2,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    gap: 6,
  },
  bookedDetailsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalFormScroll: {
    marginBottom: spacing.md,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  datePresetsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  datePresetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  datePresetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  datePresetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  datePresetChipTextSelected: {
    color: colors.white,
  },
  datePresetSubText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  datePresetSubTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  customToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  timePresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  timePresetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timePresetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  timePresetChipTextSelected: {
    color: colors.white,
  },
  customTimeInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  policyNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
