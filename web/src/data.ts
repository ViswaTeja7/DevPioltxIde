import { FileNode } from './types';

// Start with an empty workspace. Users create their own files via the Explorer
// "+" button or the AI agent's create_file action.
export const initialFileTree: FileNode[] = [];
