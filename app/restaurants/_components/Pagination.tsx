'use client';

import { Button } from '@/components/ui/button';

type Props = {
    page: number;
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
};

export default function Pagination({
    page,
    canPrev,
    canNext,
    onPrev,
    onNext,
}: Props) {
    return (
        <div className="p-4 border-t flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={onPrev}
            >
                이전
            </Button>
            <span className="text-xs text-muted-foreground">{page}</span>
            <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={onNext}
            >
                다음
            </Button>
        </div>
    );
}
