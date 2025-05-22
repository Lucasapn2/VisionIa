import NextImage from 'next/image'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AnalyzeImageOutput } from '@/ai/flows/analyze-image';

interface ImageAnalysisCardProps {
  id: string;
  dataUrl: string;
  fileName: string;
  analysis?: AnalyzeImageOutput;
  isLoading: boolean;
  error?: string;
}

export function ImageAnalysisCard({
  dataUrl,
  fileName,
  analysis,
  isLoading,
  error,
}: ImageAnalysisCardProps) {
  return (
    <Card className="w-full overflow-hidden shadow-lg flex flex-col bg-card rounded-xl border border-border/70 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="p-4 border-b border-border/50">
        <CardTitle className="text-lg truncate font-semibold text-foreground" title={fileName}>{fileName}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        <div className="relative w-full aspect-video bg-muted/30">
          <NextImage 
            src={dataUrl} 
            alt={`Imagem carregada: ${fileName}`} 
            fill 
            style={{ objectFit: 'contain' }}
            className="p-1"
            data-ai-hint="uploaded image"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2 text-md font-medium">Analisando...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Erro na Análise</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          {analysis && !isLoading && !error && (
            <div>
              <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
                <CheckCircle2 className="h-5 w-5 mr-1.5" />
                <h3 className="font-semibold text-md">Análise Concluída</h3>
              </div>
              <CardDescription className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed p-3 bg-muted/50 rounded-md border border-border/50">
                {analysis.description}
              </CardDescription>
            </div>
          )}
        </div>
      </CardContent>
      {/* <CardFooter className="p-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">ID: {id}</p>
      </CardFooter> */}
    </Card>
  );
}
