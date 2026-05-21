'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export interface ColorImagePair {
  color: string;
  imageUrl: string;
  imageFile?: File;
  aiGenerated?: boolean;
}

interface Step2Props {
  data: ColorImagePair[];
  onChange: (pairs: ColorImagePair[]) => void;
  productType?: string;
  categoryId?: string;
}

export function Step2ImageUpload({ data, onChange, productType }: Step2Props) {
  const token = useAuthStore((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [generatingFor, setGeneratingFor] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!pendingFile || !colorInput.trim()) {
      toast.error('Select an image and enter a color name');
      return;
    }
    if (!token) {
      toast.error('Session expired', 'Please log in again.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      const res = await api.uploadForm<{ url: string }>('/api/upload/image', formData, token);
      onChange([...data, { color: colorInput.trim(), imageUrl: res.url }]);
      setPendingFile(null);
      setPendingPreview('');
      setColorInput('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: unknown) {
      toast.error('Upload failed', err instanceof Error ? err.message : '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  // Send the uploaded photo to Gemini ("nano banana") and replace it with the
  // generated clean studio image.
  const generateImage = async (index: number) => {
    if (!token) {
      toast.error('Session expired', 'Please log in again.');
      return;
    }
    const pair = data[index];
    setGeneratingFor(pair.color);
    try {
      const res = await api.post<{ url: string }>(
        '/api/ai/generate-image',
        { imageUrl: pair.imageUrl, productType, color: pair.color },
        token
      );
      onChange(
        data.map((p, i) => (i === index ? { ...p, imageUrl: res.url, aiGenerated: true } : p))
      );
      toast.success('AI image generated');
    } catch (err: unknown) {
      toast.error('AI generation failed', err instanceof Error ? err.message : '');
    } finally {
      setGeneratingFor('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new color-image pair */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 space-y-4">
        <h4 className="font-medium text-gray-700">Add Color Variant Image</h4>

        <div className="flex gap-4 items-start">
          {/* File picker */}
          <div
            className="w-24 h-24 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden flex-shrink-0"
            onClick={() => fileRef.current?.click()}
          >
            {pendingPreview ? (
              // Local blob preview — next/image cannot render blob: URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pendingPreview} alt="preview" className="object-contain w-full h-full" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex-1 space-y-3">
            <div>
              <Label>Color Name</Label>
              <Input
                placeholder="e.g., Crimson Red, Navy Blue"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={uploading || !pendingFile || !colorInput.trim()}
              size="sm"
            >
              {uploading ? 'Uploading...' : 'Add Image'}
            </Button>
          </div>
        </div>
      </div>

      {/* Existing pairs */}
      {data.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Added Colors ({data.length})</h4>
          {data.map((pair, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Image
                src={pair.imageUrl}
                alt={pair.color}
                width={56}
                height={56}
                className="rounded-lg object-contain flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{pair.color}</p>
                  {pair.aiGenerated && (
                    <span className="text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full px-2 py-0.5">
                      ✨ AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{pair.imageUrl}</p>

                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 h-7"
                    onClick={() => generateImage(i)}
                    disabled={generatingFor === pair.color}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingFor === pair.color ? 'Generating image...' : 'Generate AI Image'}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                onClick={() => handleRemove(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 && (
        <p className="text-sm text-center text-gray-400 py-2">No color variants added yet. Add at least one image above.</p>
      )}
    </div>
  );
}
