import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBrokerProviders, useCreateBrokerConnection } from '../hooks/useBroker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/Feedback';
import { Alert } from '../components/ui/alert';
import { ArrowLeft, Check, Key, Database, Globe } from 'lucide-react';

const providerIcons: Record<string, string> = {
  metatrader4: 'MT4', metatrader5: 'MT5', ctrader: 'cT',
  dxtrade: 'DX', interactive_brokers: 'IB', oanda: 'OA',
  tradelocker: 'TL', binance: 'BN', bybit: 'BB', kraken: 'KR',
  custom_rest: 'API',
};

const providerNames: Record<string, string> = {
  metatrader4: 'MetaTrader 4', metatrader5: 'MetaTrader 5',
  ctrader: 'cTrader', dxtrade: 'DXtrade',
  interactive_brokers: 'Interactive Brokers', oanda: 'OANDA',
  tradelocker: 'TradeLocker', binance: 'Binance',
  bybit: 'Bybit', kraken: 'Kraken', custom_rest: 'Custom REST',
};

const credentialLabels: Record<string, string> = {
  login: 'Login ID',
  password: 'Password',
  server: 'Server',
  terminal_path: 'Terminal Path',
  client_id: 'Client ID',
  client_secret: 'Client Secret',
  account_id: 'Account ID',
  api_key: 'API Key',
  api_secret: 'API Secret',
  base_url: 'Base URL',
  environment: 'Environment',
  endpoint: 'Endpoint',
  paper_trading: 'Paper Trading',
  headers: 'Custom Headers',
};

export default function BrokerSetup() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: providers, isLoading } = useBrokerProviders(projectId || '');
  const createConn = useCreateBrokerConnection(projectId || '');

  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const providerInfo = providers?.find((p) => p.name === selectedProvider);

  const handleSelectProvider = (name: string) => {
    setSelectedProvider(name);
    setLabel(`My ${providerNames[name] || name}`);
    setStep('configure');
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedProvider || !label.trim()) return;
    setError(null);
    try {
      await createConn.mutateAsync({
        provider: selectedProvider,
        label: label.trim(),
        credentials,
        config: Object.keys(config).length > 0 ? config : undefined,
      } as unknown as Record<string, unknown>);
      setSuccess(true);
      setTimeout(() => navigate('../broker'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create connection');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (success) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Connection Created</h2>
          <p className="text-muted-foreground">Redirecting to Broker Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        {step === 'configure' && (
          <Button variant="ghost" size="icon" onClick={() => setStep('select')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">New Broker Connection</h1>
          <p className="text-muted-foreground">Connect Project Minore to your trading platform</p>
        </div>
      </div>

      {error && <Alert variant="error" title={error} />}

      {step === 'select' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers?.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectProvider(p.name)}
              className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {providerIcons[p.name] || '?'}
              </div>
              <div className="space-y-1">
                <div className="font-semibold">{p.display_name}</div>
                <div className="text-xs text-muted-foreground">{p.name}</div>
                <div className="flex gap-1 mt-2">
                  {p.supports_live_prices && <Badge variant="secondary" className="text-[10px]">Live Prices</Badge>}
                  {p.supports_streaming && <Badge variant="secondary" className="text-[10px]">Streaming</Badge>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'configure' && providerInfo && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Connection Details
              </CardTitle>
              <CardDescription>Configure your {providerInfo.display_name} connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Connection Label</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My MT5 Account" />
              </div>

              {providerInfo.required_credentials.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Required Credentials
                  </h3>
                  <div className="space-y-3">
                    {providerInfo.required_credentials.map((key) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {credentialLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                        <Input
                          type={key.includes('password') || key.includes('secret') ? 'password' : 'text'}
                          value={credentials[key] || ''}
                          onChange={(e) => handleCredentialChange(key, e.target.value)}
                          placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {providerInfo.optional_credentials.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Optional Settings
                  </h3>
                  <div className="space-y-3">
                    {providerInfo.optional_credentials.map((key) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {credentialLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                        <Input
                          value={config[key] || credentials[key] || ''}
                          onChange={(e) => handleConfigChange(key, e.target.value)}
                          placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('../broker')}>Cancel</Button>
            <Button onClick={handleSave} disabled={!label.trim() || createConn.isPending}>
              {createConn.isPending ? 'Creating...' : 'Create Connection'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
