"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { getLang, subscribeLang } from "./i18n";

export function useLang(): Lang {
    const [langState, setLangState] = useState<Lang>(() => getLang());
    useEffect(() => {
        return subscribeLang(() => setLangState(getLang()));
    }, []);
    return langState;
}


