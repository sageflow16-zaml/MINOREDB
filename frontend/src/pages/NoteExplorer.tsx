import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { useVaults, useNotes, useNote, useBacklinks, useAutoLink } from '../hooks/useObsidian';
import { FileText, ArrowLeft, Link2, Tag, Calendar, RefreshCw, ChevronRight } from 'lucide-react';
import type { ObsidianNote, BacklinkRef } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type ViewMode = 'list' | 'detail';

export default function NoteExplorerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedVault, setSelectedVault] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [view, setView] = useState<ViewMode>('list');

  const vaults = useVaults(projectId!);
  const notes = useNotes(projectId!, selectedVault);
  const note = useNote(projectId!, selectedNote);
  const backlinks = useBacklinks(projectId!, selectedNote);
  const autoLink = useAutoLink(projectId!);

  const vaultsData = vaults.data || [];
  const notesData = notes.data || [];

  if (view === 'detail' && note.data) {
    return <NoteDetail note={note.data} backlinks={backlinks.data || []} onBack={() => { setView('list'); setSelectedNote(''); }} />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Note Explorer"
          description="Browse and read Obsidian notes synced with Minore"
          actions={
            <div className="flex gap-2">
              <select value={selectedVault} onChange={(e) => setSelectedVault(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                <option value="">Select Vault</option>
                {vaultsData.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => autoLink.mutate(selectedVault)} disabled={!selectedVault || autoLink.isPending}>
                <RefreshCw className={`h-4 w-4 mr-1 ${autoLink.isPending ? 'animate-spin' : ''}`} />Auto-Link
              </Button>
            </div>
          }
        />
      </motion.div>

      {!selectedVault ? (
        <EmptyState message="Select a vault to browse notes" />
      ) : notes.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : notesData.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {notesData.map((n: ObsidianNote) => (
            <motion.div key={n.id} variants={item}>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setSelectedNote(n.id); setView('detail'); }}>
                <CardContent className="flex items-start gap-3 p-4">
                  <FileText className="h-5 w-5 text-primary-text shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{n.title || n.file_name}</h4>
                      {n.note_type && <Badge variant="outline" className="text-3xs">{n.note_type}</Badge>}
                      <Badge variant={n.sync_status === 'synced' ? 'success' : n.sync_status === 'conflict' ? 'warning' : 'secondary'} className="text-3xs">{n.sync_status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{n.file_path}</p>
                    {n.tags && n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {n.tags.slice(0, 5).map((t) => <Badge key={t} variant="secondary" className="text-3xs">#{t}</Badge>)}
                        {n.tags.length > 5 && <span className="text-3xs text-muted-foreground">+{n.tags.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState message="No notes in this vault yet" />
      )}
    </motion.div>
  );
}

function NoteDetail({ note, backlinks, onBack }: { note: ObsidianNote; backlinks: BacklinkRef[]; onBack: () => void }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-lg font-semibold">{note.title || note.file_name}</h2>
            <p className="text-xs text-muted-foreground font-mono">{note.file_path}</p>
          </div>
          {note.note_type && <Badge variant="outline">{note.note_type}</Badge>}
          <Badge variant={note.sync_status === 'synced' ? 'success' : 'secondary'}>{note.sync_status}</Badge>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {note.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">{note.content}</pre>
                ) : (
                  <p className="text-muted-foreground">No content</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          {note.tags && note.tags.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Tags</p>
                <div className="flex flex-wrap gap-1">{note.tags.map((t) => <Badge key={t} variant="secondary" className="text-3xs">#{t}</Badge>)}</div>
              </CardContent>
            </Card>
          )}
          {note.headings && note.headings.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2">Headings</p>
                <ul className="space-y-1">{note.headings.map((h, i) => (
                  <li key={i} className="text-xs text-muted-foreground" style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>{h.text}</li>
                ))}</ul>
              </CardContent>
            </Card>
          )}
          {note.wiki_links && note.wiki_links.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />Wiki Links</p>
                <ul className="space-y-1">{note.wiki_links.map((wl, i) => (
                  <li key={i} className="text-xs text-primary-text cursor-pointer hover:underline">{wl.target}</li>
                ))}</ul>
              </CardContent>
            </Card>
          )}
          {backlinks.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2">Backlinks ({backlinks.length})</p>
                <ul className="space-y-1">{backlinks.map((b, i) => (
                  <li key={i} className="text-xs text-primary-text cursor-pointer hover:underline">{b.link_text || b.source_path}</li>
                ))}</ul>
              </CardContent>
            </Card>
          )}
          {note.detected_sessions && note.detected_sessions.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2">Sessions</p>
                <div className="flex flex-wrap gap-1">{note.detected_sessions.map((s) => <Badge key={s} variant="info" className="text-3xs">{s}</Badge>)}</div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
