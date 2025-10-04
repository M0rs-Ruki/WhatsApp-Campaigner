import bcrypt from 'bcrypt';


const hashPassword = async (password: string): Promise<string> => {
    try {
        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error("Error during password hashing:", error);
        throw error; 
    }
};

const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        console.error("Error during password comparison:", error);
        throw error;
    }
};

export { hashPassword, comparePassword };