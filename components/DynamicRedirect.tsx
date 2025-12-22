import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

interface DynamicRedirectProps {
    to: string;
}

/**
 * Component to handle dynamic redirects with route parameters
 * Replaces :param placeholders in the 'to' prop with actual param values
 */
export const DynamicRedirect: React.FC<DynamicRedirectProps> = ({ to }) => {
    const params = useParams();

    // Replace all :param placeholders with actual values
    let finalPath = to;
    Object.entries(params).forEach(([key, value]) => {
        finalPath = finalPath.replace(`:${key}`, value || '');
    });

    return <Navigate to={finalPath} replace />;
};
