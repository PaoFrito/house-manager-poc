import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge, EmptyState, FAB } from '../../components/UIKit';
import { notes, database } from '../../db';
import { Note } from '../../db/models/Note';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NoteListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [noteList, setNoteList] = useState<Note[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const all = await notes.query().fetch();
    setNoteList(all.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = noteList.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleTogglePin = async (note: Note) => {
    await database.write(async () => {
      await note.update(n => { n.isPinned = !n.isPinned; });
    });
    load();
  };

  const handleDelete = (note: Note) => {
    Alert.alert('Excluir Nota', `Excluir "${note.title}"?`, [
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => { await database.write(async () => { await note.destroyPermanently(); }); load(); },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('notes.title')}
        </Text>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={16} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]}
            placeholder={t('common.search')}
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ flex: 1, marginBottom: 8 }}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            onLongPress={() => handleDelete(item)}
          >
            <Card style={{ flex: 1 }}>
              <View style={styles.noteHeader}>
                {(item.isPinned || item.isHighPriority) && (
                  <Ionicons
                    name={item.isPinned ? 'pin' : 'alert-circle'}
                    size={14}
                    color={item.isPinned ? theme.colors.brand.secondary : theme.colors.brand.warning}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[styles.noteTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.semiBold, flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <TouchableOpacity onPress={() => handleTogglePin(item)}>
                  <Ionicons
                    name={item.isPinned ? 'pin' : 'pin-outline'}
                    size={16}
                    color={item.isPinned ? theme.colors.brand.secondary : theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <Text
                style={[styles.notePreview, { color: theme.colors.textSecondary }]}
                numberOfLines={3}
              >
                {item.content}
              </Text>
              <Text style={[styles.noteDate, { color: theme.colors.textMuted }]}>
                {format(item.updatedAt, 'dd/MM', { locale: ptBR })}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Nenhuma nota"
            subtitle="Crie notas de texto livre com suporte a Markdown"
            action={{ label: t('notes.newNote'), onPress: () => navigation.navigate('NoteEditor') }}
          />
        }
      />

      <FAB onPress={() => navigation.navigate('NoteEditor')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: 14 },
  notePreview: { fontSize: 12, lineHeight: 18 },
  noteDate: { fontSize: 11, marginTop: 8 },
});
