'use server';
/**
 * @fileOverview Agente de IA para análise de imagens.
 *
 * - analyzeImage - Uma função que lida com o processo de análise de imagem.
 * - AnalyzeImageInput - O tipo de entrada para a função analyzeImage.
 * - AnalyzeImageOutput - O tipo de retorno para a função analyzeImage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto a ser analisada, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
  userPrompt: z.string().optional().describe('Um prompt ou pergunta adicional do usuário sobre a imagem.'),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  description: z.string().describe('Uma descrição dos objetos, cenas e elementos presentes na imagem, respondendo a quaisquer perguntas ou instruções do usuário, se fornecidas no prompt.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: {schema: AnalyzeImageInputSchema},
  output: {schema: AnalyzeImageOutputSchema},
  prompt: `Você é um assistente de IA especialista em análise de imagens.
Sua principal tarefa é descrever os objetos, cenas e elementos presentes na imagem.

{{#if userPrompt}}
O usuário forneceu a seguinte pergunta ou instrução adicional: "{{{userPrompt}}}"
Por favor, use esta informação para guiar ou refinar sua análise da imagem. Responda à pergunta do usuário se aplicável, mantendo o foco na análise da imagem.
{{else}}
Por favor, forneça uma descrição detalhada da imagem.
{{/if}}

Imagem: {{media url=photoDataUri}}`,
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
