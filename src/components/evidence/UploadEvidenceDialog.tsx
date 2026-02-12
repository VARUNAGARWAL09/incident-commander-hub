import { useState, useRef } from 'react';
import { Upload, Image, Hash, Globe, Network, Mail, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EvidenceType } from '@/types/incident';

type EvidenceClassification = 'malicious' | 'suspicious' | 'benign' | 'unknown';

interface UploadEvidenceDialogProps {
  trigger: React.ReactNode;
}

export function UploadEvidenceDialog({ trigger }: UploadEvidenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<EvidenceType>('other');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<EvidenceClassification>('unknown');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) {
      toast({ title: 'Error', description: 'Evidence value is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('evidence-files')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Use signed URL since bucket is now private
        const { data: urlData, error: urlError } = await supabase.storage
          .from('evidence-files')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiration

        if (urlError) throw urlError;
        imageUrl = urlData.signedUrl;
      }

      // Insert evidence record
      const { error } = await supabase.from('evidence').insert({
        type,
        value: value.trim(),
        description: description.trim() || null,
        classification,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Evidence uploaded successfully' });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload evidence', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('other');
    setValue('');
    setDescription('');
    setClassification('unknown');
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Evidence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Evidence Type</label>
            <Select value={type} onValueChange={(v) => setType(v as EvidenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hash">Hash</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Value *</label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 192.168.1.1 or suspicious.exe"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context about this evidence..."
              rows={2}
            />
          </div>

          {/* Classification */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Classification</label>
            <Select value={classification} onValueChange={(v) => setClassification(v as EvidenceClassification)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="malicious">Malicious</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="benign">Benign</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Attach Image (optional)</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload image</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Uploading...' : 'Upload Evidence'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}