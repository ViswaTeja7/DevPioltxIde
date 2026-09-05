import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { UploadCloud, CheckCircle, AlertTriangle, Play, GitMerge, FileCode, RefreshCw } from 'lucide-react';
import { RepoTree } from './RepoTree';

const complexityData = [
  { name: 'App.js', score: 4 },
  { name: 'Utils.js', score: 12 },
  { name: 'Auth.js', score: 8 },
  { name: 'Dashboard.js', score: 15 },
  { name: 'API.js', score: 25 },
];

const coverageData = [
  { day: 'Mon', coverage: 78 },
  { day: 'Tue', coverage: 80 },
  { day: 'Wed', coverage: 75 },
  { day: 'Thu', coverage: 82 },
  { day: 'Fri', coverage: 85 },
];

export const Dashboard = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  return (
    <div className="flex-1 overflow-y-auto bg-[#0D1117] p-8 text-[#C9D1D9]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Upload */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Project Dashboard</h1>
            <p className="text-sm text-[#8B949E]">Repo Analysis, CI/CD, and AI Batch Remediation</p>
          </div>
          <button className="flex items-center gap-2 bg-[#238636] hover:bg-[#2EA043] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <UploadCloud size={16} />
            Upload Project ZIP
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* File Explorer (RepoTree) */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg flex flex-col md:col-span-1 min-h-[400px]">
            <h2 className="text-xs uppercase font-bold text-[#8B949E] tracking-wider p-4 border-b border-[#30363D]">
              Project Files
            </h2>
            <div className="flex-1 overflow-y-auto">
              <RepoTree hideHeader />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-3">
            {/* Project Summary */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
              <h2 className="text-xs uppercase font-bold text-[#8B949E] tracking-wider mb-4 flex items-center gap-2">
                <FileCode size={14} /> Project Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-white">42</div>
                  <div className="text-xs text-[#8B949E]">Files Analyzed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#58A6FF]">TS/React</div>
                  <div className="text-xs text-[#8B949E]">Primary Stack</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#3FB950]">85%</div>
                  <div className="text-xs text-[#8B949E]">Test Coverage</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#F85149]">15</div>
                  <div className="text-xs text-[#8B949E]">Critical Issues</div>
                </div>
              </div>
            </div>

            {/* Test Coverage Trend */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
              <h2 className="text-xs uppercase font-bold text-[#8B949E] tracking-wider mb-4">Coverage Trend</h2>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coverageData}>
                    <Area type="monotone" dataKey="coverage" stroke="#58A6FF" fill="#58A6FF" fillOpacity={0.2} />
                    <XAxis dataKey="day" stroke="#8B949E" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D1117', borderColor: '#30363D', fontSize: '12px' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Complexity Heatmap */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 col-span-1 md:col-span-2">
              <h2 className="text-xs uppercase font-bold text-[#8B949E] tracking-wider mb-4">Complexity Heatmap (Cyclomatic)</h2>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complexityData}>
                    <XAxis dataKey="name" stroke="#8B949E" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D1117', borderColor: '#30363D', fontSize: '12px' }} />
                    <Bar dataKey="score" fill="#F78166" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CI/CD & Batch Remediation */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase font-bold text-[#8B949E] tracking-wider flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#D2A8FF]" /> Batch Fix Previews
                </h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] text-xs rounded border border-[#30363D] transition-colors flex items-center gap-1.5">
                    <Play size={12} /> Run Tests
                  </button>
                  <button className="px-3 py-1 bg-[#238636] hover:bg-[#2EA043] text-white text-xs rounded transition-colors flex items-center gap-1.5">
                    <CheckCircle size={12} /> Apply All Fixes
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#30363D] rounded">
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5">Refactor `API.js` to reduce cyclomatic complexity</div>
                    <div className="text-xs text-[#8B949E]">AI proposes splitting `handleRequest` into 3 sub-functions.</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-[#58A6FF] hover:underline">Preview Diff</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#30363D] rounded">
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5">Resolve circular dependency in `Auth.js`</div>
                    <div className="text-xs text-[#8B949E]">Extract shared types to break cycle with `User.js`.</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-[#58A6FF] hover:underline">Preview Diff</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#30363D] rounded opacity-75">
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5 flex items-center gap-1.5">
                      <RefreshCw size={12} className="text-[#3FB950]" /> Applied: Fix memory leak in `useEffect`
                    </div>
                    <div className="text-xs text-[#8B949E]">Commit hash: a1b2c3d</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-[#F85149] hover:underline">Rollback</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
