export interface Login {
    email: string;
    password: string;
}

export interface LoginResponse{
    token: string;
    user:{
        id: string;
        name: string;
        email: string;
        role: string;
    }
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthContextType{
    user:User | null;
    token: string | null;
    login: (data: Login) => Promise<void>;
    logout: () => void;
    error: string | null;
    loading: boolean;
}