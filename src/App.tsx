/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDEProvider } from './context/IDEContext';
import { MainLayout } from './components/MainLayout';

export default function App() {
  return (
    <IDEProvider>
      <MainLayout />
    </IDEProvider>
  );
}
