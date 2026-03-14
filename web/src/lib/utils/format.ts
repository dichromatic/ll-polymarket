export type FormatNumberOptions = {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};

function sanitize(value: number): number {
    return Number.isFinite(value) ? value : 0;
}

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
    const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;

    return sanitize(value).toLocaleString(undefined, {
        minimumFractionDigits,
        maximumFractionDigits
    });
}

export function formatUO(value: number, options: FormatNumberOptions = {}): string {
    return `${formatNumber(value, options)} UO`;
}

export function formatShares(value: number, options: FormatNumberOptions = {}): string {
    return `${formatNumber(value, options)} shares`;
}

export function formatPricePerShare(value: number, fractionDigits: number = 3): string {
    return `${formatNumber(value, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    })} UO/share`;
}

export function formatProbabilityPercent(value: number): string {
    return `${Math.round(sanitize(value) * 100)}%`;
}
