import { type ReactNode } from 'react';
interface FieldProps {
    label: string;
    error?: string;
    children: ReactNode;
}
export function FormField({ label, error, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}