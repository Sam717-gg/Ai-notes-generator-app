export type NoteType = 'summary' | 'study-guide' | 'meeting-minutes' | 'brainstorm' | 'flashcards';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  createdAt: number;
  sourceText: string;
}

export interface GenerationConfig {
  type: NoteType;
  tone: 'professional' | 'casual' | 'academic';
  length: 'short' | 'medium' | 'long';
}
