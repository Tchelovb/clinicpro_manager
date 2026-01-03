import React from 'react';
import { EliteDocumentEngine } from '../components/documents/EliteDocumentEngine';
import { AppShell } from '../components/shared/AppShell';

const EliteDocumentsPage: React.FC = () => {
    return (
        <AppShell>
            <EliteDocumentEngine />
        </AppShell>
    );
};

export default EliteDocumentsPage;
