"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { suggestSessionOutline, type SuggestSessionOutlineInput, type SuggestSessionOutlineOutput } from '@/ai/flows/suggest-session-outline';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIAssistantPage() {
  const [clientNotes, setClientNotes] = useState<string>('');
  const [suggestedOutline, setSuggestedOutline] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuggestedOutline(null);

    try {
      const input: SuggestSessionOutlineInput = { clientNotes };
      const output: SuggestSessionOutlineOutput = await suggestSessionOutline(input);
      setSuggestedOutline(output.sessionOutline);
    } catch (err) {
      console.error("Error fetching session outline:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Training Assistant
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Behavioral Suggestion Tool</CardTitle>
          <CardDescription>
            Input client notes from previous sessions to get an AI-generated outline for the next session's training goals, exercises, and techniques.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="clientNotes" className="text-lg font-medium">Client Notes</Label>
              <Textarea
                id="clientNotes"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Enter detailed notes about the client's dog, observed behaviors, progress from past sessions, and any specific concerns or goals..."
                rows={8}
                className="mt-2 text-base"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Suggest Session Outline
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {suggestedOutline && (
            <Card className="mt-8 bg-muted/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-6 w-6" />
                  Suggested Session Outline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md bg-background p-4 border shadow-sm">
                  {suggestedOutline}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
