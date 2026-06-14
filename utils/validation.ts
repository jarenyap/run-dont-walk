export const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
        return "Password must be at least 6 characters.";
    }
    if (!/[A-Z]/.test(pwd)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(pwd)) {
        return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
        return "Password must contain a special character (!@#$%^&*).";
    }
    return null;
};

export const validateEmail = (email: string): boolean => {
    const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegEx.test(email);
};
