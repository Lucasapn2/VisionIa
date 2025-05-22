
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeImage, type AnalyzeImageOutput, type AnalyzeImageInput } from '@/ai/flows/analyze-image';
import { ImageUploader } from '@/components/image-uploader';
import { ImageAnalysisCard } from '@/components/image-analysis-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, RefreshCw } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface ImageAnalysisState {
  id: string;
  file: File;
  dataUrl: string;
  analysis?: AnalyzeImageOutput;
  isLoading: boolean;
  error?: string;
}

export default function HomePage() {
  const [images, setImages] = useState<ImageAnalysisState[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);
  const { toast } = useToast();
  const analysisQueue = useRef<ImageAnalysisState[]>([]);
  const isAnalyzing = useRef(false);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const processAnalysisQueue = useCallback(async () => {
    if (isAnalyzing.current || analysisQueue.current.length === 0) {
      if (analysisQueue.current.length === 0 && !images.some(img => img.isLoading)) {
        setIsProcessingGlobal(false);
      }
      return;
    }

    isAnalyzing.current = true;
    setIsProcessingGlobal(true);
    const imageToAnalyze = analysisQueue.current.shift();

    if (imageToAnalyze) {
      try {
        const input: AnalyzeImageInput = { 
          photoDataUri: imageToAnalyze.dataUrl,
          userPrompt: userPrompt || undefined,
        };
        const result = await analyzeImage(input);
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === imageToAnalyze.id ? { ...img, analysis: result, isLoading: false, error: undefined } : img
          )
        );
      } catch (error) {
        console.error('Erro ao analisar imagem:', imageToAnalyze.file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante a análise.';
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === imageToAnalyze.id ? { ...img, isLoading: false, error: errorMessage } : img
          )
        );
        toast({
          title: `Falha na Análise de ${imageToAnalyze.file.name}`,
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
    isAnalyzing.current = false;
    processAnalysisQueue(); 
  }, [toast, userPrompt]);


  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsProcessingGlobal(true);
    const newImageStatesPromises = files.map(async (file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de Arquivo Inválido",
          description: `${file.name} não é um arquivo de imagem válido.`,
          variant: "destructive",
        });
        return null;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        // Adiciona um nome de arquivo padrão para imagens coladas
        const fileName = file.name || `imagem-colada-${Date.now()}.png`;
        const uniqueId = `${fileName}-${Date.now()}-${Math.random()}`;
        
        return {
          id: uniqueId,
          file: new File([file], fileName, { type: file.type }), // Garante que o arquivo tenha um nome
          dataUrl,
          isLoading: true, 
          error: undefined,
          analysis: undefined,
        };
      } catch (error) {
        console.error("Erro ao ler arquivo:", file.name, error);
        toast({
          title: "Erro ao Ler Arquivo",
          description: `Não foi possível ler ${file.name || 'imagem colada'}.`,
          variant: "destructive",
        });
        return null;
      }
    });

    const newImageStatesResults = await Promise.all(newImageStatesPromises);
    const validNewImageStates = newImageStatesResults.filter(state => state !== null) as ImageAnalysisState[];
    
    if (validNewImageStates.length > 0) {
      setImages(prevImages => [...prevImages, ...validNewImageStates]);
      analysisQueue.current.push(...validNewImageStates);
      if (!isAnalyzing.current) {
        processAnalysisQueue();
      }
    } else if (analysisQueue.current.length === 0 && !images.some(img => img.isLoading)) {
       setIsProcessingGlobal(false);
    }
  }, [toast, processAnalysisQueue]);
  
  const handleReanalyzeAll = () => {
    if (images.length === 0 || isProcessingGlobal) return;

    toast({
      title: "Reanalisando Imagens",
      description: "As imagens carregadas serão reanalisadas com o prompt atual.",
    });

    setIsProcessingGlobal(true);
    analysisQueue.current = []; 

    const imagesToReanalyze = images.map(img => ({
      ...img,
      isLoading: true,
      analysis: undefined,
      error: undefined,
    }));
    
    setImages(imagesToReanalyze); 
    analysisQueue.current.push(...imagesToReanalyze);
    
    if (!isAnalyzing.current) {
      processAnalysisQueue();
    }
  };


  useEffect(() => {
    if (!images.some(img => img.isLoading) && analysisQueue.current.length === 0) {
        setIsProcessingGlobal(false);
    }
  }, [images]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault(); // Previne a ação padrão de colar (ex: em um campo de texto)
        handleFilesSelected(imageFiles);
        toast({
          title: "Imagem Colada",
          description: `${imageFiles.length} imagem(s) adicionada(s) da área de transferência.`,
        });
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleFilesSelected, toast]);


  const handleClearAll = () => {
    setImages([]);
    analysisQueue.current = []; 
    setUserPrompt('');
    toast({
      title: "Tudo Limpo",
      description: "Todas as imagens, prompts e análises foram limpos.",
    });
    setIsProcessingGlobal(false);
  };

  return (
    <>
      <ImageUploader onFilesSelected={handleFilesSelected} isUploading={isProcessingGlobal} />
      
      {images.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-primary">Resultados da Análise</h2>
            <Button variant="outline" onClick={handleClearAll} disabled={isProcessingGlobal}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Tudo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
            {images.map(imageState => (
              <ImageAnalysisCard
                key={imageState.id}
                id={imageState.id}
                dataUrl={imageState.dataUrl}
                fileName={imageState.file.name}
                analysis={imageState.analysis}
                isLoading={imageState.isLoading}
                error={imageState.error}
              />
            ))}
          </div>
        </div>
      )}

      <div className="my-8 pt-8 border-t border-border">
        <label htmlFor="userPrompt" className="block text-lg font-medium text-foreground mb-3">
          Seu prompt ou pergunta para a IA:
        </label>
        <Textarea
          id="userPrompt"
          placeholder="Ex: Descreva os sentimentos que esta imagem transmite. Ou, identifique todas as plantas. Você também pode colar imagens (Ctrl+V)."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="w-full p-3 border-input rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-primary resize-none text-base"
          rows={4}
          disabled={isProcessingGlobal && analysisQueue.current.length > 0}
        />
        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
            <Button 
                onClick={handleReanalyzeAll} 
                disabled={isProcessingGlobal || images.length === 0}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-md rounded-md shadow-sm hover:shadow-md transition-shadow"
            >
                <RefreshCw className="mr-2 h-5 w-5" />
                Analisar Imagens com este Prompt
            </Button>
            <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">
            Digite seu prompt acima. Ao carregar novas imagens ou colar da área de transferência, elas serão analisadas com este prompt. Use o botão ao lado para reanalisar imagens já carregadas.
            </p>
        </div>
      </div>
      <Toaster />
    </>
  );
}
