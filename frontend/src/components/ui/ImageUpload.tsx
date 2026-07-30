import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  preview?: boolean;
}

export function ImageUpload({ value, onChange, label, preview = true }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange(ev.target?.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-2xs font-medium text-muted-foreground">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted/50 transition-colors',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {loading ? 'Loading...' : value ? 'Change' : 'Upload'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {preview && value && (
        <div className="relative mt-1 rounded-lg overflow-hidden border border-border/50 bg-muted/20" style={{ maxHeight: 180 }}>
          <img src={value} alt="Preview" className="w-full h-auto object-contain max-h-[180px]" />
        </div>
      )}
    </div>
  );
}
