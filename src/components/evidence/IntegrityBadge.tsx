/**
 * Evidence Integrity Badge Component
 * 
 * Displays integrity status and provides verification functionality.
 * Can be added to evidence display components.
 */

import { Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface IntegrityBadgeProps {
    isVerified?: boolean;
    lastVerified?: string;
    onVerify?: () => void;
    verifying?: boolean;
}

export function IntegrityBadge({
    isVerified,
    lastVerified,
    onVerify,
    verifying = false
}: IntegrityBadgeProps) {
    if (isVerified === undefined) {
        // No integrity data available
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1.5">
                            <Shield className="h-3 w-3" />
                            No Integrity Data
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>This evidence predates chain of custody tracking</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Badge
                variant={isVerified ? 'default' : 'destructive'}
                className="gap-1.5"
            >
                {isVerified ? (
                    <>
                        <CheckCircle className="h-3 w-3" />
                        Verified
                    </>
                ) : (
                    <>
                        <AlertTriangle className="h-3 w-3" />
                        Modified
                    </>
                )}
            </Badge>

            {onVerify && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onVerify}
                    disabled={verifying}
                    className="h-7 px-2 text-xs"
                >
                    {verifying ? (
                        <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <Shield className="h-3 w-3 mr-1" />
                            Verify Now
                        </>
                    )}
                </Button>
            )}

            {lastVerified && (
                <span className="text-xs text-muted-foreground">
                    Last verified: {new Date(lastVerified).toLocaleString()}
                </span>
            )}
        </div>
    );
}
