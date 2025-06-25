
// This file is machine-generated - edit with caution!
'use server';
/**
 * @fileOverview An AI-powered wine supply chain analyzer that identifies bottlenecks,
 * predicts disruptions, and suggests optimizations based on chaincode events
 * and registered asset data.
 *
 * - analyzeSupplyChain - A function that handles the supply chain analysis process.
 * - AnalyzeSupplyChainInput - The input type for the analyzeSupplyChain function.
 * - AnalyzeSupplyChainOutput - The return type for the analyzeSupplyChain function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSupplyChainInputSchema = z.object({
  chaincodeEvents: z
    .string()
    .describe(
      'A string containing chaincode events data from the Hyperledger Fabric network for a wine supply chain.'
    ),
  assetData: z
    .string()
    .describe('A string containing registered asset data (Grape Lots, Wine Batches) from the system.'),
});
export type AnalyzeSupplyChainInput = z.infer<typeof AnalyzeSupplyChainInputSchema>;

const AnalyzeSupplyChainOutputSchema = z.object({
  bottlenecks: z
    .string()
    .describe('Identified bottlenecks in the wine supply chain.'),
  disruptions: z
    .string()
    .describe('Predicted potential disruptions in the wine supply chain.'),
  optimizations:
    z.string().describe('Suggested optimizations for the wine supply chain.'),
});
export type AnalyzeSupplyChainOutput = z.infer<typeof AnalyzeSupplyChainOutputSchema>;

export async function analyzeSupplyChain(
  input: AnalyzeSupplyChainInput
): Promise<AnalyzeSupplyChainOutput> {
  return analyzeSupplyChainFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supplyChainAnalyzerPrompt',
  input: {schema: AnalyzeSupplyChainInputSchema},
  output: {schema: AnalyzeSupplyChainOutputSchema},
  prompt: `You are an AI-powered supply chain analyst specializing in the wine industry.

You will analyze the provided chaincode events and registered asset data to identify bottlenecks, predict potential disruptions, and suggest optimizations for the wine supply chain.

Chaincode Events:
{{chaincodeEvents}}

Asset Data:
{{assetData}}

Based on this information, provide a detailed analysis of the wine supply chain, including:

1.  Identified Bottlenecks: Clearly describe any bottlenecks, such as delays in grape transfer, wine production, or distribution.
2.  Predicted Disruptions: Forecast any potential disruptions, like climate affecting harvest or transport issues.
3.  Suggested Optimizations: Offer actionable recommendations to improve the efficiency and resilience of the supply chain, such as alternative transport routes or inventory management strategies.

Ensure that your analysis is clear, concise, and actionable, providing specific recommendations that can be implemented to enhance the wine supply chain's performance.
`,
});

const analyzeSupplyChainFlow = ai.defineFlow(
  {
    name: 'analyzeSupplyChainFlow',
    inputSchema: AnalyzeSupplyChainInputSchema,
    outputSchema: AnalyzeSupplyChainOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
