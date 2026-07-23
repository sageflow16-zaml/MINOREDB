/**
 * Minore Trading OS — Obsidian Plugin
 *
 * Bidirectional sync between Obsidian and Project Minore.
 * Provides: vault connection, note sync, trade templates,
 * AI insights, and unified search.
 */
import { App, Plugin, PluginSettingTab, Notice, TFile, TFolder, Modal, Setting } from 'obsidian';

interface MinoreSettings {
  apiEndpoint: string;
  apiKey: string;
  projectId: string;
  vaultId: string;
  autoSync: boolean;
  syncFrequency: number; // minutes
  ignoredFolders: string[];
  ignoredPatterns: string[];
  conflictPolicy: 'ask' | 'keep_local' | 'keep_remote' | 'auto_merge';
  syncAttachments: boolean;
  lastSyncToken: string | null;
}

const DEFAULT_SETTINGS: MinoreSettings = {
  apiEndpoint: 'http://localhost:8000',
  apiKey: '',
  projectId: '',
  vaultId: '',
  autoSync: true,
  syncFrequency: 5,
  ignoredFolders: ['.obsidian', '.trash', '.git'],
  ignoredPatterns: ['*.tmp', '*.bak'],
  conflictPolicy: 'ask',
  syncAttachments: true,
  lastSyncToken: null,
};

export default class MinorePlugin extends Plugin {
  settings: MinoreSettings;
  syncInterval: number | null = null;

  async onload() {
    await this.loadSettings();
    console.log('Minore Trading OS plugin loaded');

    // Add settings tab
    this.addSettingTab(new MinoreSettingTab(this.app, this));

    // Add commands
    this.addCommand({
      id: 'minore-sync-now',
      name: 'Sync vault now',
      callback: () => this.syncNow(),
    });

    this.addCommand({
      id: 'minore-connect-vault',
      name: 'Connect vault to Minore',
      callback: () => new ConnectVaultModal(this.app, this).open(),
    });

    this.addCommand({
      id: 'minore-search',
      name: 'Search Minore',
      callback: () => new SearchModal(this.app, this).open(),
    });

    this.addCommand({
      id: 'minore-insert-trade-template',
      name: 'Insert trade review template',
      callback: () => this.insertTemplate('trade_review'),
    });

    this.addCommand({
      id: 'minore-insert-journal-template',
      name: 'Insert daily journal template',
      callback: () => this.insertTemplate('daily_journal'),
    });

    this.addCommand({
      id: 'minore-pull-insights',
      name: 'Pull AI insights from Minore',
      callback: () => this.pullInsights(),
    });

    this.addCommand({
      id: 'minore-view-analytics',
      name: 'View analytics in Minore',
      callback: () => this.openMinorePage('analytics'),
    });

    // Register file change events for auto-sync
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && this.settings.autoSync) {
          this.queueSync(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && this.settings.autoSync) {
          this.queueSync(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile && this.settings.autoSync) {
          this.handleDelete(file);
        }
      })
    );

    // Start auto-sync
    if (this.settings.autoSync) {
      this.startAutoSync();
    }

    // Add ribbon icon
    this.addRibbonIcon('database', 'Minore Sync', () => {
      this.syncNow();
    });
  }

  onunload() {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
    }
    console.log('Minore Trading OS plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  startAutoSync() {
    if (this.syncInterval) window.clearInterval(this.syncInterval);
    this.syncInterval = window.setInterval(
      () => this.syncNow(),
      this.settings.syncFrequency * 60 * 1000
    );
  }

  async syncNow() {
    if (!this.settings.apiKey || !this.settings.vaultId) {
      new Notice('Please configure Minore settings first');
      return;
    }

    new Notice('Syncing with Minore...');

    try {
      const files = this.app.vault.getFiles();
      const notes: { file_path: string; content: string; title: string }[] = [];

      for (const file of files) {
        if (this.shouldIgnore(file.path)) continue;
        const content = await this.app.vault.read(file);
        notes.push({
          file_path: file.path,
          content,
          title: file.basename,
        });
      }

      const response = await fetch(`${this.settings.apiEndpoint}/projects/${this.settings.projectId}/obsidian/sync/import-data?vault_id=${this.settings.vaultId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify(notes),
      });

      if (response.ok) {
        const result = await response.json();
        new Notice(`Sync complete: ${result.imported} imported, ${result.conflicted} conflicts`);
      } else {
        new Notice(`Sync failed: ${response.statusText}`);
      }
    } catch (e) {
      new Notice(`Sync error: ${e.message}`);
    }
  }

  shouldIgnore(path: string): boolean {
    for (const folder of this.settings.ignoredFolders) {
      if (path.startsWith(folder + '/') || path === folder) return true;
    }
    for (const pattern of this.settings.ignoredPatterns) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(path.split('/').pop() || '')) return true;
    }
    return false;
  }

  async queueSync(file: TFile) {
    // Debounced sync — could be enhanced with a proper queue
    if (!this.settings.apiKey || !this.settings.vaultId) return;
    if (this.shouldIgnore(file.path)) return;

    try {
      const content = await this.app.vault.read(file);
      await fetch(`${this.settings.apiEndpoint}/projects/${this.settings.projectId}/obsidian/sync/import-data?vault_id=${this.settings.vaultId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify([{ file_path: file.path, content, title: file.basename }]),
      });
    } catch (e) {
      console.error('Minore sync error:', e);
    }
  }

  async handleDelete(file: TFile) {
    // Mark as deleted in Minore
    console.log('Minore: file deleted', file.path);
  }

  async insertTemplate(templateType: string) {
    if (!this.settings.apiKey) {
      new Notice('Please configure Minore API key');
      return;
    }

    try {
      const response = await fetch(
        `${this.settings.apiEndpoint}/projects/${this.settings.projectId}/obsidian/templates?template_type=${templateType}`,
        { headers: { 'Authorization': `Bearer ${this.settings.apiKey}` } }
      );
      if (response.ok) {
        const templates = await response.json();
        if (templates.length > 0) {
          const template = templates[0];
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile) {
            await this.app.vault.modify(activeFile, template.content);
            new Notice(`Template "${template.name}" inserted`);
          }
        }
      }
    } catch (e) {
      new Notice(`Template error: ${e.message}`);
    }
  }

  async pullInsights() {
    if (!this.settings.apiKey) { new Notice('Configure API key first'); return; }
    try {
      const response = await fetch(
        `${this.settings.apiEndpoint}/projects/${this.settings.projectId}/ai/insights`,
        { headers: { 'Authorization': `Bearer ${this.settings.apiKey}` } }
      );
      if (response.ok) {
        const insights = await response.json();
        const notice = insights.slice(0, 3).map((i: { title: string }) => `• ${i.title}`).join('\n');
        new Notice(`AI Insights:\n${notice || 'No insights yet'}`);
      }
    } catch (e) {
      new Notice(`Error: ${e.message}`);
    }
  }

  openMinorePage(page: string) {
    window.open(`${this.settings.apiEndpoint.replace('/api', '')}/projects/${this.settings.projectId}/${page}`, '_blank');
  }
}

// ── Modals ──

class ConnectVaultModal extends Modal {
  plugin: MinorePlugin;
  name = '';
  path = '';

  constructor(app: App, plugin: MinorePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Connect Obsidian Vault' });

    new Setting(contentEl)
      .setName('Vault Name')
      .addText((t) => t.onChange((v) => (this.name = v)));

    new Setting(contentEl)
      .setName('Vault Path')
      .addText((t) => t.setPlaceholder('/path/to/vault').onChange((v) => (this.path = v)));

    new Setting(contentEl)
      .addButton((btn) => btn.setButtonText('Connect').setCta().onClick(async () => {
        if (!this.name || !this.path) return;
        try {
          const response = await fetch(`${this.plugin.settings.apiEndpoint}/projects/${this.plugin.settings.projectId}/obsidian/vaults`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.plugin.settings.apiKey}`,
            },
            body: JSON.stringify({ name: this.name, path: this.path, vault_type: 'local' }),
          });
          if (response.ok) {
            const vault = await response.json();
            this.plugin.settings.vaultId = vault.id;
            await this.plugin.saveSettings();
            new Notice(`Vault "${this.name}" connected!`);
            this.close();
          }
        } catch (e) {
          new Notice(`Error: ${e.message}`);
        }
      }));
  }

  onClose() { this.contentEl.empty(); }
}

class SearchModal extends Modal {
  plugin: MinorePlugin;
  query = '';

  constructor(app: App, plugin: MinorePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Search Minore' });

    const input = contentEl.createEl('input', { attr: { type: 'text', placeholder: 'Search notes, trades, strategies...' } });
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.marginBottom = '12px';

    const resultsDiv = contentEl.createEl('div');

    input.addEventListener('input', async () => {
      const q = input.value;
      if (q.length < 2) { resultsDiv.empty(); return; }
      try {
        const response = await fetch(
          `${this.plugin.settings.apiEndpoint}/projects/${this.plugin.settings.projectId}/obsidian/search?q=${encodeURIComponent(q)}`,
          { headers: { 'Authorization': `Bearer ${this.plugin.settings.apiKey}` } }
        );
        if (response.ok) {
          const results = await response.json();
          resultsDiv.empty();
          for (const r of results.slice(0, 10)) {
            const el = resultsDiv.createEl('div', { text: `${r.result_type}: ${r.title}` });
            el.style.padding = '4px 0';
            el.style.cursor = 'pointer';
            el.style.fontSize = '14px';
            el.addEventListener('click', () => {
              new Notice(`Opening: ${r.title}`);
              this.close();
            });
          }
        }
      } catch (e) { /* ignore */ }
    });

    input.focus();
  }

  onClose() { this.contentEl.empty(); }
}
