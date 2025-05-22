"use client";

import { ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export function ImageUploader({ onFilesSelected, isUploading }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 border-2 border-dashed border-border rounded-lg text-center bg-card shadow-md hover:border-primary transition-colors duration-200">
      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={isUploading}
        aria-label="Seletor de Arquivos"
      />
      <Button 
        onClick={handleButtonClick} 
        disabled={isUploading} 
        className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-lg rounded-md shadow-sm hover:shadow-md transition-shadow"
        aria-live="polite"
      >
        <Upload className="mr-2 h-5 w-5" />
        {isUploading ? 'Processando...' : 'Carregar Imagens'}
      </Button>
      <p className="mt-3 text-sm text-muted-foreground">
        Selecione uma ou mais imagens para analisar. Suas imagens são processadas localmente por IA.
      </p>
    </div>
  );
}
