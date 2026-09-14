import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/app/queryClient.ts'
import { OrgExplorer } from '@/features/org-tree/ui/OrgExplorer.tsx'
import { GlobalStyle } from '@/styles/GlobalStyle.ts'

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <GlobalStyle />
            <OrgExplorer />
        </QueryClientProvider>
    )
}

export default App
