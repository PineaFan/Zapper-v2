const validCharacters = "367CDFGHJKLQMNPRTWX";

export function isCodeValid(code: string): boolean {
    if (code.length !== 5) return false;

    let total = 0;
    for (const char of code) {
        const idx = validCharacters.indexOf(char);
        if (idx === -1) return false;
        total += idx;
    }

    return total % validCharacters.length === 0;
}

export function generateCode(): string {
    let code = "";
    let total = 0;

    for (let i = 0; i < 4; i++) {
        const idx = Math.floor(Math.random() * validCharacters.length);
        code += validCharacters[idx];
        total += idx;
    }

    // Calculate checksum character
    const checksumIdx = (validCharacters.length - (total % validCharacters.length)) % validCharacters.length;
    code += validCharacters[checksumIdx];

    return code;
}
