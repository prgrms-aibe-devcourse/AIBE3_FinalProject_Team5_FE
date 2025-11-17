'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type Props = {
    keyword: string;
    onKeywordChange: (v: string) => void;
    onSearch: () => void;
};

export default function SearchBar({
    keyword,
    onKeywordChange,
    onSearch,
}: Props) {
    return (
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="음식점, 지역, 음식 종류로 검색..."
                    className="pl-10"
                    value={keyword}
                    onChange={(e) => onKeywordChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSearch();
                    }}
                />
            </div>
            <Button onClick={onSearch}>검색</Button>
        </div>
    );
}
