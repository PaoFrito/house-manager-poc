import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { database, notes } from '../../db';
import { Note } from '../../db/models/Note';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';

export const NoteEditorScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const noteId: string | undefined = route.params?.noteId;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadNote = useCallback(async () => {
    if (!noteId) return;
    const all = await notes.query().fetch();
    const found = all.find(n => n.id === noteId);
    if (found) {
      setNote(found);
      setTitle(found.title);
      setContent(found.content);
      setIsPinned(found.isPinned);
      setIsHighPriority(found.isHighPriority);
    }
  }, [noteId]);

  useEffect(() => { loadNote(); }, [loadNote]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe um título para a nota.');
      return;
    }
    const userId = 'local-user';
    await database.write(async () => {
      if (note) {
        await note.update(n => {
          n.title = title.trim();
          n.content = content;
          n.isPinned = isPinned;
          n.isHighPriority = isHighPriority;
          n.updatedBy = userId;
        });
      } else {
        await notes.create(n => {
          n.title = title.trim();
          n.content = content;
          n.isPinned = isPinned;
          n.isHighPriority = isHighPriority;
          n.createdBy = userId;
          n.updatedBy = userId;
        });
      }
    });
    setDirty(false);
    navigation.goBack();
  }, [note, title, content, isPinned, isHighPriority, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.icon} />
        </TouchableOpacity>

        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={[styles.toolbarBtn, preview && { backgroundColor: theme.colors.brand.primary + '20' }]}
            onPress={() => setPreview(!preview)}
          >
            <Ionicons name={preview ? 'code' : 'eye-outline'} size={18} color={preview ? theme.colors.brand.primary : theme.colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={18} color={theme.colors.brand.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.editorArea} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold, borderBottomColor: theme.colors.border }]}
            value={title}
            onChangeText={v => { setTitle(v); setDirty(true); }}
            placeholder={t('notes.noteName')}
            placeholderTextColor={theme.colors.textMuted}
            multiline={false}
          />

          {!preview ? (
            <TextInput
              style={[styles.contentInput, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular, flex: 1 }]}
              value={content}
              onChangeText={v => { setContent(v); setDirty(true); }}
              placeholder={`${t('notes.content')}\n\n# Título\n**negrito** _itálico_`}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <ScrollView style={{ flex: 1 }}>
              <Text style={[styles.previewText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]}>
                {content || '*(conteúdo vazio)*'}
              </Text>
            </ScrollView>
          )}

          {/* Meta options */}
          <View style={[styles.metaSection, { borderTopColor: theme.colors.border }]}>
            <View style={styles.switchRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pin-outline" size={16} color={theme.colors.brand.secondary} />
                <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('notes.pin')}</Text>
              </View>
              <Switch value={isPinned} onValueChange={setIsPinned} trackColor={{ true: theme.colors.brand.secondary }} thumbColor="#fff" />
            </View>
            <View style={styles.switchRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.brand.warning} />
                <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('common.highPriority')}</Text>
              </View>
              <Switch value={isHighPriority} onValueChange={setIsHighPriority} trackColor={{ true: theme.colors.brand.warning }} thumbColor="#fff" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  toolbarActions: { flexDirection: 'row', gap: 4 },
  toolbarBtn: { padding: 8, borderRadius: 8 },
  editorArea: { flexGrow: 1, padding: 16 },
  titleInput: {
    fontSize: 22,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  contentInput: { fontSize: 15, lineHeight: 24, minHeight: 200 },
  previewText: { fontSize: 15, lineHeight: 24 },
  metaSection: { borderTopWidth: 1, paddingTop: 16, marginTop: 16, gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14 },
});
