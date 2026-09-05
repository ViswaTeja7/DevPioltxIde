import { FileNode } from './types';

export const initialFileTree: FileNode[] = [
  {
    id: 'root-1',
    name: 'devpilot-x',
    type: 'folder',
    path: '/devpilot-x',
    children: [
      {
        id: 'folder-src',
        name: 'src',
        type: 'folder',
        path: '/devpilot-x/src',
        children: [
          {
            id: 'folder-components',
            name: 'components',
            type: 'folder',
            path: '/devpilot-x/src/components',
            children: [
              { id: 'file-app-tsx', name: 'App.tsx', type: 'file', language: 'typescript', path: '/devpilot-x/src/components/App.tsx', content: 'import React from "react";\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">\n      <h1 className="text-4xl font-bold">Hello DevPilotX</h1>\n    </div>\n  );\n}' },
              { id: 'file-button-tsx', name: 'Button.tsx', type: 'file', language: 'typescript', path: '/devpilot-x/src/components/Button.tsx', content: 'export const Button = () => {\n  return <button>Click me</button>;\n};' }
            ]
          },
          { id: 'file-main-tsx', name: 'main.tsx', type: 'file', language: 'typescript', path: '/devpilot-x/src/main.tsx', content: 'import { createRoot } from "react-dom/client";\nimport App from "./components/App";\n\ncreateRoot(document.getElementById("root")!).render(<App />);' },
          { id: 'file-utils-ts', name: 'utils.ts', type: 'file', language: 'typescript', path: '/devpilot-x/src/utils.ts', content: 'export function cx(...classes: (string | undefined | null | false)[]) {\n  return classes.filter(Boolean).join(" ");\n}' }
        ]
      },
      { id: 'file-package', name: 'package.json', type: 'file', language: 'json', path: '/devpilot-x/package.json', content: '{\n  "name": "devpilot-x-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}' },
      { id: 'file-vite-config', name: 'vite.config.ts', type: 'file', language: 'typescript', path: '/devpilot-x/vite.config.ts', content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n});' },
      { id: 'file-dockerfile', name: 'Dockerfile', type: 'file', language: 'dockerfile', path: '/devpilot-x/Dockerfile', content: 'FROM node:18-alpine\nWORKDIR /app\nCOPY package.json ./\nRUN npm install\nCOPY . .\nCMD ["npm", "run", "dev"]' }
    ]
  }
];
